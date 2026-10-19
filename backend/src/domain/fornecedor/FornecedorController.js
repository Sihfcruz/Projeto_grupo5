const { criarController } = require('../../shared/lib/crud')
const FornecedorService = require('./FornecedorService')

module.exports = criarController(FornecedorService, require('./FornecedorConfig').controller || {})
