const { criarController } = require('../../shared/lib/crud')
const CategoriaService = require('./CategoriaService')

module.exports = criarController(CategoriaService, require('./CategoriaConfig').controller || {})
