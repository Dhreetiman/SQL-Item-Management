const express = require('express');
const morgan = require("morgan");
const colors = require("colors");


const app = express();

//! Middleware
app.use(express.json());
app.use(morgan('dev'))

//! Routes


// app.use('/', require('./routes/index'))



//!------------------------------------------------


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
});

module.exports = index