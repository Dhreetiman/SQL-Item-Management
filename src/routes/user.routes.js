let {
    registerUser,
    sendVerificationEmailAgain,
} = require('../controllers/user');

const router = require('express').Router();
const userValidator = require('../validator/userValidator')

router.post('/register', userValidator.validateUser, registerUser);
router.post('/send-verification', userValidator.verificationEmailValidate, sendVerificationEmailAgain);

module.exports = router