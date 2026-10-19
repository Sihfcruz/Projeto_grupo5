const { criarRotas } = require('../../shared/lib/crud')
const FornecedorController = require('./FornecedorController')

module.exports = criarRotas(FornecedorController, require('./FornecedorConfig').rotas || {})
