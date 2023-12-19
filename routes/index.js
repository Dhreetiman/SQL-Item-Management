const router = require('express').Router();

router.get('/' , (req, res) => {
    res.send('This is test server for swift-shop')
})

router.use('/user', require('./user.routes'));

module.exports = router