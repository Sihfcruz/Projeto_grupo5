const logger = require('../lib/logger')

// Middleware de erro central. Deve ser o último do app.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    // JSON inválido no body
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ sucesso: false, erro: 'JSON inválido no corpo da requisição' })
    }

    const statusCode = err.statusCode || 500

    if (statusCode >= 500) {
        logger.error({
            requestId: req.id,
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method
        })
    }

    // Em 500 nunca expõe detalhes internos (SQL, stack, etc.)
    const mensagem = statusCode >= 500 ? 'Erro interno do servidor' : err.message

    return res.status(statusCode).json({
        sucesso: false,
        erro: mensagem,
        requestId: req.id
    })
}

module.exports = errorHandler
