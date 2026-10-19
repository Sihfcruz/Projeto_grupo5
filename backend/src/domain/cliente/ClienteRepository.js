const { criarRepository } = require('../../shared/lib/crud')
const config = require('./ClienteConfig')

module.exports = criarRepository(config)
