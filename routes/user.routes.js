let {
    registerUser,
    sendVerificationEmailAgain,
    verifyEmail,
    login,
    info,
    updateUser

} = require('../controllers/user');


const router = require('express').Router();
const userValidator = require('../validator/userValidator')
let auth = require('../middlewares/auth')

router.post('/register', userValidator.validateUser, registerUser);
router.post('/send-verification', userValidator.verificationEmailValidate, sendVerificationEmailAgain);

router.post('/verify-email', userValidator.verifyEmailValidator, verifyEmail)
router.post('/login', userValidator.loginValidator, login);
router.get('/info', auth, info);
router.put('/update', auth, userValidator.updateUserValidator, updateUser);

module.exports = router