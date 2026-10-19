const { criarService } = require('../../shared/lib/crud')
const SkuRepository = require('./SkuRepository')
const { entidade, schema } = require('./SkuConfig')

module.exports = criarService({ repository: SkuRepository, entidade, schema })
