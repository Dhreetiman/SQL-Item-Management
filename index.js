const express = require('express');
const morgan = require("morgan");
const colors = require("colors");
let http = require('http');
require('dotenv').config()
const requestIp = require('request-ip');
const host = '0.0.0.0';
const db_config = require('./configs/db');
const mongoose = require('mongoose');

const { Sequelize, DataTypes } = require('sequelize');

const PORT = process.env.PORT || 8080;

const app = express();
let server = http.createServer(app);

//! Middleware
app.use(express.json());
app.use(morgan('dev'))
app.set('port', PORT);
app.use(requestIp.mw());

// Create a Sequelize instance
const sequelize = new Sequelize(db_config.development);

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('MySQL Connection has been established successfully.'.random.italic.bold);
    })
    .catch((error) => {
        console.error('Unable to connect to the MySQL database:', error);
    });

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log('MongoDB connection established successfully.'.blue.italic.bold);
    })
    .catch((error) => {
        console.error('Unable to connect to MongoDB:', error);
    });



// Routes
app.use('/', require('./routes/index'));



//!------------------------------------------------


server.listen(PORT, host, async () => {
    try {
        console.log(`Swift-Shop - Node server is up and running on : ${PORT}`.rainbow.bold)
    } catch (error) {
        console.log(`Swift-Shop - Error while starting node server : ${error}`)
    }
});

