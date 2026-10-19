const jwt = require('jsonwebtoken')
const config = require('../../config/environment')

// Exige "Authorization: Bearer <token>". Preenche req.usuario = { id, papel }
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const [esquema, token] = authHeader ? authHeader.split(' ') : []

    if (esquema !== 'Bearer' || !token) {
        return res.status(401).json({ sucesso: false, erro: 'Token não fornecido' })
    }

    try {
        req.usuario = jwt.verify(token, config.jwt.secret)
        return next()
    } catch (erro) {
        return res.status(401).json({ sucesso: false, erro: 'Token inválido ou expirado' })
    }
}

function verificarAdmin(req, res, next) {
    if (req.usuario?.papel !== 'admin') {
        return res.status(403).json({ sucesso: false, erro: 'Acesso restrito a administrador' })
    }
    next()
}

module.exports = { verificarAdmin, verificarToken }
