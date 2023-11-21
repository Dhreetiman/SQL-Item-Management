let {
    registerUser
} = require('../controllers/user');

const router = require('express').Router();
const userValidator = require('../validator/userValidator')

router.post('/register', userValidator.validateUser, registerUser);

module.exports = router