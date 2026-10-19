const { randomUUID } = require('crypto')

const requestIdMiddleware = (req, res, next) => {
    const recebido = req.headers['x-request-id']
    // Aceita o ID do cliente apenas se for curto e seguro (evita injeção em logs)
    req.id = typeof recebido === 'string' && /^[\w-]{1,64}$/.test(recebido) ? recebido : randomUUID()
    res.setHeader('X-Request-Id', req.id)
    next()
}

module.exports = requestIdMiddleware
