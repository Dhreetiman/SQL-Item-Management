const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const Joi = require('joi');
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(require('../configs/db').development);

class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (payload, expires, secret = process.env.JWT_SECRET) => {

    payload.iat = moment().unix();
    payload.exp = expires.unix();
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
            userId: Joi.number().integer().required(),
            expires: Joi.date().iso().required(),
            type: Joi.string().valid('verifyEmail', 'authToken', 'otpToken').required(), // Define valid types
        });

        const dataToValidate = {
            token,
            userId,
            expires,
            type
        };

        const validationResult = schema.validate(dataToValidate, { abortEarly: false });

        if (validationResult.error) {
            throw new Error(validationResult.error.details.map((detail) => detail.message).join(', '));
        }


        let sql = `INSERT INTO Tokens (token, user_id, expires, type) VALUES ($token, $user_id, $expires, $type)`;
        await sequelize.query(sql, {
            bind: { token, user_id: userId, expires, type },
            type: Sequelize.QueryTypes.INSERT
        })


    } catch (error) {
        throw new ApiError(httpStatus.BAD_REQUEST, error);
    }
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {

    let payload = {
        user: user,
    }

    const authTokenExpires = moment().add(30, 'days');
    console.log("authTokenExpires", authTokenExpires)
    const refreshToken = generateToken(payload, authTokenExpires);
    console.log("refreshToken", refreshToken)
    let sql1 = `DELETE FROM Tokens WHERE user_id = $user_id AND type = 'authToken'`;
    await sequelize.query(sql1, {
        bind: { user_id: user.id },
        type: Sequelize.QueryTypes.DELETE
    })
    let expiresSequelizeFormat = authTokenExpires.toISOString().slice(0, 19).replace('T', ' ');
    await saveToken(refreshToken, user.id, expiresSequelizeFormat, 'authToken');

    return {

        authToken: {
            token: refreshToken,
            expires: authTokenExpires.toDate(),
        },
    };
};

const generateVerifyEmailToken = async (email, otp) => {
    try {

        let sql = `SELECT * FROM User WHERE email = $email`;
        const user = await sequelize.query(sql, {
            bind: { email },
            type: Sequelize.QueryTypes.SELECT
        })
        console.log(user)
        if (user.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
        } else if (user[0].is_email_verified === 1) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Email is already Verified');
        }
        let expires = moment().add(15, 'minutes');

        let expiresDate = new Date(expires);
        let expiresSequelizeFormat = expiresDate.toISOString().slice(0, 19).replace('T', ' ');

        let payload = {
            user: user[0].id,
            email: email,
            otp: otp
        }
        const token = generateToken(payload, expires);
        let sql1 = `DELETE FROM Tokens WHERE user_id = $user_id AND type = 'verifyEmail'`;
        await sequelize.query(sql1, {
            bind: { user_id: user[0].id },
            type: Sequelize.QueryTypes.DELETE
        })
        let sql2 = `INSERT INTO Tokens (token, user_id, expires, type) VALUES ($token, $user_id, $expires, $type)`;
        await sequelize.query(sql2, {
            bind: { token, user_id: user[0].id, expires: expiresSequelizeFormat, type: 'verifyEmail' },
            type: Sequelize.QueryTypes.INSERT
        })
        return token;

    } catch (error) {
        throw new ApiError(httpStatus.BAD_REQUEST, error);
    }
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
    let sql = `SELECT * FROM User WHERE email = $email`;
    const user = await sequelize.query(sql, {
        bind: { email },
        type: Sequelize.QueryTypes.SELECT
    })

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
const getTokens = async (userId, token) => {
    let sql = `SELECT * FROM Tokens WHERE user_id = $user_id AND token = $token`;
    const tokenDoc = await sequelize.query(sql, {
        bind: { user_id: userId, type: token },
        type: Sequelize.QueryTypes.SELECT
    })
    if (!tokenDoc) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Token not found');
    }
    const { exp } = jwt.verify(token, config.jwt.secret);

    return {
        token: tokenDoc.token,
        expires: moment.unix(exp).toDate(),
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
    generateVerifyEmailToken,
    getTokens,
    ApiError

};