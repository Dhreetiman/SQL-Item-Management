let User = require('../models/user');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(require('../configs/db').development);
let bcrypt = require('bcrypt');
let sendEmail = require('../utils/sendEmail');
let jwt = require('jsonwebtoken')
let tokenService = require('../services/token.service');
const axios = require('axios');

exports.registerUser = async (req, res) => {
    try {

        let { username, email, password, fullname, gender, address } = req.body;
        password = await bcrypt.hash(password, 10);
        let sql = `INSERT INTO User (username, email, password, fullname, gender, address) VALUES ($username, $email, $password, $fullname, $gender, $address)`;
        await sequelize.query(sql, {
            bind: { username, email, password, fullname, gender, address: address ?? null },
            type: Sequelize.QueryTypes.INSERT
        });
        let otp = Math.floor(100000 + Math.random() * 900000);
        let subject = 'Email Verification Code';
        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Email</title>
        </head>
        <body style="font-family: Arial, sans-serif;">

        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>One-Time Password (OTP)</h2>
            <p>Your OTP is: <strong style="font-size: 18px;">${otp}</strong></p>
            <p>Please use this code to proceed with your action or login.</p>
            <p style="margin-top: 30px;">This OTP is valid for a limited time. Do not share this OTP with anyone for security reasons.</p>
            <p>If you didn't request this OTP, please ignore this email or contact support immediately.</p>
            <p style="margin-top: 30px;">Best Regards,<br>Your Company Name</p>
        </div>

        </body>
        </html>
`;
        let token = await tokenService.generateVerifyEmailToken(email, otp);

        await sendEmail(email, subject, html)
            .then(result => console.log(result))
            .catch(error => console.error(error));
        return res.status(200).json({
            success: true,
            message: 'User has been registered. Please Check email to verify.',
        })

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: error.errors[0].message
            })
        }
        if (error.name === 'SequelizeDatabaseError') {
            return res.status(400).json({
                success: false,
                message: error.parent.sqlMessage
            })
        }
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.sendVerificationEmailAgain = async (req, res) => {
    try {
        let { email } = req.body
        let otp = Math.floor(100000 + Math.random() * 900000);
        let subject = 'Email Verification Code';
        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Email</title>
        </head>
        <body style="font-family: Arial, sans-serif;">

        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>One-Time Password (OTP)</h2>
            <p>Your OTP is: <strong style="font-size: 18px;">${otp}</strong></p>
            <p>Please use this code to proceed with your action or login.</p>
            <p style="margin-top: 30px;">This OTP is valid for a limited time. Do not share this OTP with anyone for security reasons.</p>
            <p>If you didn't request this OTP, please ignore this email or contact support immediately.</p>
            <p style="margin-top: 30px;">Best Regards,<br>Your Company Name</p>
        </div>

        </body>
        </html>
        `;

        let token = await tokenService.generateVerifyEmailToken(email, otp);

        await sendEmail(email, subject, html)
            .then(result => console.log(result))
            .catch(error => console.error(error));

        return res.status(200).send({
            success: true,
            message: 'Verification email has been sent again. Please check email.',
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.verifyEmail = async (req, res) => {
    try {

        const { email, otp } = req.body;
        let userSQL = `SELECT * FROM User WHERE email = $email`;
        let user = await sequelize.query(userSQL, {
            bind: { email },
            type: Sequelize.QueryTypes.SELECT
        })
        user = user[0]
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'This email is not registered'
            })
        }
        if (user.is_email_verified === 1) {
            return res.status(400).json({
                success: false,
                message: 'Email is already Verified'
            })
        }

        let tokenSql = `SELECT token FROM Tokens WHERE user_id = $user_id AND type = 'verifyEmail'`;
        let token = await sequelize.query(tokenSql, {
            bind: { user_id: user.id },
            type: Sequelize.QueryTypes.SELECT
        })
        console.log("token", token)
        const decodedToken = jwt.verify(token[0].token, process.env.JWT_SECRET)
        console.log("decodedToken", decodedToken)

        if (decodedToken.email !== email) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            })
        }
        if (decodedToken.otp.toString() !== otp.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Invalid OTP'
            })
        }

        let sql = `UPDATE User SET is_email_verified = true WHERE email = $email`;
        await sequelize.query(sql, {
            bind: { email },
            type: Sequelize.QueryTypes.UPDATE
        })

        return res.status(200).json({
            success: true,
            message: 'Email Verified'
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.login = async (req, res) => {
    try {

        const { email, password } = req.body;
        let userSQL = `SELECT * FROM User WHERE email = $email`;
        let user = await sequelize.query(userSQL, {
            bind: { email },
            type: Sequelize.QueryTypes.SELECT
        })
        user = user[0]
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Incorrect email or password'
            })
        }
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(404).json({
                success: false,
                message: 'Incorrect email or password'
            })
        }

        if (user.is_email_verified === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please verify your email'
            })
        }

        axios.get(`${process.env.ABSTRACT_API_URL}/?api_key=${process.env.ABSTRACT_API_KEY}&ip_address=${req.clientIp}`)
            .then(response => {
                console.log(response.data);
                // if (response.data.country_code !== 'IN') {
                //     res.status(200).send({
                //         success: false,
                //         message: 'Only Indian users are allowed to login'
                //     })
                // }
                if (response.data.city !== null) {
                    let sql = `INSERT INTO LoginInfo (userId, ip, city, region, postalCode, country_code, longitude, latitude, timeZone, loginTime, localLoginTime, connectionDetails) VALUES ($userId, $ip, $city, $region, $postalCode, $country_code, $longitude, $latitude, $timezone, $loginTime, $localLoginTime, $connectionDetails)`;
                    sequelize.query(sql, {
                        bind: {
                            userId: user.id,
                            ip: response.data.ip_address,
                            city: response.data.city,
                            region: response.data.region,
                            postalCode: response.data.postal_code,
                            country_code: response.data.country_code,
                            longitude: response.data.longitude,
                            latitude: response.data.latitude,
                            timezone: response.data.timezone.name,
                            loginTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
                            localLoginTime: new Date().toLocaleString('en-US', { timeZone: response.data.timezone.name }),
                            connectionDetails: JSON.stringify(response.data.connection)
                        },
                        type: Sequelize.QueryTypes.INSERT
                    })
                }
            })
            .catch(error => {
                return res.status(400).json({
                    success: false,
                    message: error.message
                })
            });

        const token = await tokenService.generateAuthTokens(user)

        return res.status(200).json({
            success: true,
            data: {
                user,
                token
            }
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.info = async (req, res) => {
    try {
        let { user, clientIp } = req
        console.log("user", user)
        let userSQL = `SELECT * FROM User WHERE id = $id`;
        let userData = await sequelize.query(userSQL, {
            bind: { id: user.id },
            type: Sequelize.QueryTypes.SELECT
        })
        userData = userData[0]
        if (!userData) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }
        return res.status(200).json({
            success: true,
            data: {
                user: userData,
                ip: clientIp
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


