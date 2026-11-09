// Stub do @scalar/express-api-reference para evitar carregamento do pacote nos testes
module.exports = {
  apiReference: () => (_req, res) => res.status(200).send(''),
}
