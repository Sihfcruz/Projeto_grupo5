const { criarRepository } = require('../../shared/lib/crud')
const config = require('./FornecedorConfig')

module.exports = criarRepository(config)
