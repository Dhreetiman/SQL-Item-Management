let User = require('../models/user');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(require('../configs/db').development);
let bcrypt = require('bcrypt');
let sendEmail = require('../utils/sendEmail');
let jwt = require('jsonwebtoken')
let tokenService = require('../services/token.service');

exports.registerUser = async (req, res) => {
    try {

        const { username, email, password, fullname, gender, address } = req.body;

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
        res.setHeader("Token", token);
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
        res.setHeader("Token", token);

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

        const { email } = req.body;
        let sql = `UPDATE Users SET is_email_verified = true WHERE email = $email`;

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}