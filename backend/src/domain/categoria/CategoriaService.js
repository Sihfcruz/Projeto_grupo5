const { criarService } = require('../../shared/lib/crud')
const CategoriaRepository = require('./CategoriaRepository')
const { entidade, schema } = require('./CategoriaConfig')

module.exports = criarService({ repository: CategoriaRepository, entidade, schema })
