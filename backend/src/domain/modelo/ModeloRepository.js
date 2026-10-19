const { criarRepository } = require('../../shared/lib/crud')
const config = require('./ModeloConfig')

module.exports = criarRepository(config)
