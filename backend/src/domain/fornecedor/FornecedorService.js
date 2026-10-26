const { criarService } = require('../../shared/lib/crud')
const FornecedorRepository = require('./FornecedorRepository')
const { entidade, schema } = require('./FornecedorConfig')

module.exports = criarService({ repository: FornecedorRepository, entidade, schema })
