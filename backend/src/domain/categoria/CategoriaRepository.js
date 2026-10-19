const { criarRepository } = require('../../shared/lib/crud')
const config = require('./CategoriaConfig')

module.exports = criarRepository(config)
