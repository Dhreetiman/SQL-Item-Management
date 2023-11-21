const express = require('express');
const morgan = require("morgan");
const colors = require("colors");
let http = require('http');
require('dotenv').config()
const host = '0.0.0.0';
const db_config = require('./src/configs/db');

const { Sequelize, DataTypes } = require('sequelize');

const PORT = process.env.PORT || 8080;

const app = express();
let server = http.createServer(app);

//! Middleware
app.use(express.json());
app.use(morgan('dev'))
app.set('port', PORT);

console.log(process.env.DB_HOST)

// Create a Sequelize instance
const sequelize = new Sequelize(db_config.development);

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch((error) => {
        console.error('Unable to connect to the database:', error);
    });

    
// Routes
app.use('/', require('./src/routes/index'));



//!------------------------------------------------




server.listen(PORT, host, async () => {
    try {
        console.log(`Item-Management - Node server is up and running on : ${PORT}`)
    } catch (error) {
        console.log(`Item-Management - Error while starting node server : ${error}`)
    }
});

