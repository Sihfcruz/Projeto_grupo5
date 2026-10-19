const { criarController } = require('../../shared/lib/crud')
const ClienteService = require('./ClienteService')

module.exports = criarController(ClienteService, require('./ClienteConfig').controller || {})
