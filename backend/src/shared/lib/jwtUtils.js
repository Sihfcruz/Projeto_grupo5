const jwt = require('jsonwebtoken')
const config = require('../../config/environment')

const jwtUtils = {
    gerarAccessToken(payload) {
        return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiry })
    },

    gerarRefreshToken(payload) {
        return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry })
    },

    verificarRefreshToken(token) {
        return jwt.verify(token, config.jwt.refreshSecret)
    }
}

module.exports = jwtUtils
