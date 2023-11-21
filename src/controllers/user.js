let User = require('../models/user');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(require('../configs/db').development);

exports.registerUser = async (req, res) => {
    try {

        const { username, email, password, fullname, gender, address, is_email_verified } = req.body;

        let sql = `INSERT INTO Users (username, email, password, fullname, gender, address, is_email_verified) VALUES ($username, $email, $password, $fullname, $gender, $address, $is_email_verified)`;
        await sequelize.query(sql, {
            bind: {username, email, password, fullname, gender, address: address ?? null, is_email_verified: is_email_verified ?? false},
            type: Sequelize.QueryTypes.INSERT
        });
        return res.status(200).json({
            success: true,
            message: 'User registered successfully'
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
        return res.status(500).json({
            success: false,
            message: error.message
        })    
    }
}