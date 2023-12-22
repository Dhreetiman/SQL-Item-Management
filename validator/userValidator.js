const Joi = require('joi');
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,}$/;

const validateUser = async (req, res, next) => {
    try {

        const userSchema = Joi.object({
            id: Joi.number().integer(),
            username: Joi.string().required(),
            email: Joi.string().email({ tlds: { allow: false } }).required(),
            password: Joi.string().regex(passwordRegex).required()
                .messages({
                    'string.pattern.base': 'Password must be at least 8 characters long and include at least one letter, one number, and one special character.',
                }),
            fullname: Joi.string().max(255).required(),
            gender: Joi.string().valid('male', 'female', 'other').required(),
            address: Joi.string().max(255).required(),
            // is_email_verified: Joi.boolean().default(false),
        });

        const { error } = userSchema.validate(req.body, { abortEarly: false });

        if (error) {
            const message = error.details.map(i => i.message).join(',');
            res.status(400).json({ error: message });
        } else {
            next();
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

let verificationEmailValidate = async (req, res, next) => {
    try {

        const dataToValidate = Joi.object({
            email: Joi.string().email({ tlds: { allow: false } }).required(),
        });

        const { error } = dataToValidate.validate(req.body, { abortEarly: false });

        if (error) {
            const message = error.details.map(i => i.message).join(',');
            res.status(400).json({ error: message });
        } else {
            next();
        }
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

let verifyEmailValidator = async (req, res, next) => {
    try {
        const dataToValidate = Joi.object({
            email: Joi.string().email({ tlds: { allow: false } }).required(),
            otp: Joi.string().required()
        });

        const { error } = dataToValidate.validate(req.body, { abortEarly: false });

        if (error) {
            const message = error.details.map(i => i.message).join(',');
            return res.status(400).json({ error: message });
        }

        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

let loginValidator = async (req, res, next) => {
    try {
        const dataToValidate = Joi.object({
            email: Joi.string().email({ tlds: { allow: false } }).required(),
            password: Joi.string().regex(passwordRegex).required()
                .messages({
                    'string.pattern.base': 'Password must be at least 8 characters long and include at least one letter, one number, and one special character.',
                }),
        });

        const { error } = dataToValidate.validate(req.body, { abortEarly: false });

        if (error) {
            const message = error.details.map(i => i.message).join(',');
            return res.status(400).json({ error: message });
        }

        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

let updateUserValidator = async (req, res, next) => {
    try {
        const dataToValidate = Joi.object({
            fullname: Joi.string().max(255).min(3),
            gender: Joi.string().valid('male', 'female', 'other'),
            address: Joi.string().max(255).min(1),
        });

        const { error } = dataToValidate.validate(req.body, { abortEarly: false });

        if (error) {
            const message = error.details.map(i => i.message).join(',');
            return res.status(400).json({ error: message });
        }

        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

module.exports = {
    validateUser,
    verificationEmailValidate,
    verifyEmailValidator,
    loginValidator,
    updateUserValidator
};