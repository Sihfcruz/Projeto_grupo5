const express = require('express')
const rateLimit = require('express-rate-limit')
const AuthController = require('./AuthController')
const router = express.Router()

// Limite mais rígido contra força bruta no login (10 tentativas / 15 min por IP)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 1000 : 10,
    message: { sucesso: false, erro: 'Muitas tentativas de login, tente novamente mais tarde' },
    standardHeaders: true,
    legacyHeaders: false
})

router.post('/login', loginLimiter, AuthController.login)
router.post('/refresh-token', AuthController.refresh)
router.post('/logout', AuthController.logout)

module.exports = router
