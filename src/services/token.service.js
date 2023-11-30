const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
// const { Token } = require('../models');
const ApiError = require('../utils/ApiError');
const Joi = require('joi');

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, secret = process.env.JWT_SECRET) => {
    const payload = {
        sub: userId,
        iat: moment().unix(),
        exp: expires.unix(),
    };
    return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type) => {
    try {

        const schema = Joi.object({
            token: Joi.string().required(),
            user: Joi.number().integer().required(),
            expires: Joi.date().iso().required(),
            type: Joi.string().valid('otp_token', 'auth_token', 'refresh_token').required(), // Define valid types
        });

        const dataToValidate = {
            token,
            user: userId,
            expires,
            type
        };

        const validationResult = schema.validate(dataToValidate, { abortEarly: false });

        if (validationResult.error) {
            throw new Error(validationResult.error.details.map((detail) => detail.message).join(', '));
        }


        let sql = `INSERT INTO Token (token, user_id, expires, type) VALUES ($token, $user_id, $expires, $type)`;
        await sequelize.query(sql, {
            bind: { token, user_id, expires, type },
            type: Sequelize.QueryTypes.INSERT
        })

        
    } catch (error) {
        throw new ApiError(httpStatus.BAD_REQUEST, error);       
    }
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await userService.getUserById({ id: payload.sub });
    if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Exists');
    }
    if (user.emailVerified && type !== 'resetPassword') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email Already Verified');
    }
    const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
    if (!tokenDoc) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Token not found');
    }
    return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
    
    // const accessTokenExpires = moment().add(100000, 'minutes');
    // const accessToken = generateToken(user.id, accessTokenExpires);

    const refreshTokenExpires = moment().add(30, 'days');
    const refreshToken = generateToken(user.id, refreshTokenExpires);
    await saveToken(refreshToken, user.id, refreshTokenExpires, 'auth_token');

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate(),
        },
    };
};

const generateVerifyEmailToken = async (email) => {
    const user = await userService.getUserByEmail(email, session);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
    } else if (user.emailVerified) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email is already Verified');
    }
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
    const token = generateToken(user.id, expires);
    // await Token.deleteMany({ user, type: 'verifyEmail' });
    await saveToken(token, user.id, expires, 'verifyEmail');
    return token;
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
    const user = await userService.getUserByEmail({ email });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
    }
    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
    const resetPasswordToken = generateToken(user.id, expires);
    await saveToken(resetPasswordToken, user.id, expires, 'resetPassword');
    return resetPasswordToken;
};

/**
 * Get auth tokens
 * @param {User} user
 * @param token
 * @returns {Promise<Object>}
 */
const getAuthTokens = async (user, token) => {
    const tokenDoc = await Token.findOne({ type: 'refresh', user: user.id, blacklisted: false });
    if (!tokenDoc) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Token not found');
    }
    const { exp } = jwt.verify(token, config.jwt.secret);

    return {
        access: {
            token,
            expires: moment.unix(exp).toDate(),
        },
        refresh: {
            token: tokenDoc.token,
            expires: tokenDoc.expires,
        },
    };
};

const invalidateToken = async (token) => {
    const tokenDoc = await Token.findOne({ type: 'refresh', token, blacklisted: false });
    if (!tokenDoc) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Token not found');
    } else {
        return Token.findByIdAndUpdate(tokenDoc._id, { $set: { blacklisted: true } });
    }
};

module.exports = {
    generateAuthTokens, 
};