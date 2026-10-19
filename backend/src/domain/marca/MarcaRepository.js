const { criarRepository } = require('../../shared/lib/crud')
const config = require('./MarcaConfig')

module.exports = criarRepository(config)
