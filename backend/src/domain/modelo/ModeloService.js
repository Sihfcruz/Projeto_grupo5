const { criarService } = require('../../shared/lib/crud')
const ModeloRepository = require('./ModeloRepository')
const { entidade, schema } = require('./ModeloConfig')

module.exports = criarService({ repository: ModeloRepository, entidade, schema })
