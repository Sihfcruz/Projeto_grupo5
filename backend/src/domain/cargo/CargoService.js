const { criarService } = require('../../shared/lib/crud')
const CargoRepository = require('./CargoRepository')
const { entidade, schema } = require('./CargoConfig')

module.exports = criarService({ repository: CargoRepository, entidade, schema })
