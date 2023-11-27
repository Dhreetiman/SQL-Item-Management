let jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({
                error: "Missing Authorization in request header."
            })
        }
        const token = req.headers.authorization.split(' ')[1]
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decodedToken.user

        next()

    } catch(error) {
        return res.status(401).json({
            error: error.message
        })
    }
}