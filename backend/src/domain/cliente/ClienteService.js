const { criarService } = require('../../shared/lib/crud')
const ClienteRepository = require('./ClienteRepository')
const { entidade, schema } = require('./ClienteConfig')

module.exports = criarService({ repository: ClienteRepository, entidade, schema })
