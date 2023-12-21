const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(require('../configs/db').development);

const LoginInfo = sequelize.define('LoginInfo', {
    infoId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'User', 
            key: 'id',
        },
    },
    ip: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    postalCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    region: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    country_code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    longitude: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    latitude: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timeZone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    loginTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    connectionDetails: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'LoginInfo', 
});



module.exports = LoginInfo;