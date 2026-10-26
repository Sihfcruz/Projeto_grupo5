const { criarRotas } = require('../../shared/lib/crud')
const CategoriaController = require('./CategoriaController')

module.exports = criarRotas(CategoriaController, require('./CategoriaConfig').rotas || {})
