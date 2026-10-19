const { criarRotas } = require('../../shared/lib/crud')
const ClienteController = require('./ClienteController')

module.exports = criarRotas(ClienteController, require('./ClienteConfig').rotas || {})
