const { criarRepository } = require('../../shared/lib/crud')
const config = require('./CargoConfig')

module.exports = criarRepository(config)
