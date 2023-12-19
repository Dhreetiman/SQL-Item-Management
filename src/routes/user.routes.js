let {
    registerUser,
    sendVerificationEmailAgain,
} = require('../controllers/user');
const requestIp = require('request-ip')

const router = require('express').Router();
const userValidator = require('../validator/userValidator')

router.post('/register', userValidator.validateUser, registerUser);
router.post('/send-verification', userValidator.verificationEmailValidate, sendVerificationEmailAgain);
router.get('/ip', (req, res) => {
    var clientIp = requestIp.getClientIp(req)
    res.send(`Your IP Address is ${clientIp}.`)
  })

module.exports = router