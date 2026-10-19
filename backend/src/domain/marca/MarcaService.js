const { criarService } = require('../../shared/lib/crud')
const MarcaRepository = require('./MarcaRepository')
const { entidade, schema } = require('./MarcaConfig')

module.exports = criarService({ repository: MarcaRepository, entidade, schema })
