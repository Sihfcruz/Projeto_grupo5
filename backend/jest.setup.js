// Silencia logs durante os testes
process.env.LOG_LEVEL = 'silent'
process.env.NODE_ENV = 'test'

// Chaves JWT mínimas para testes (nunca usar em produção)
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'chave_de_teste_unitario_minimo_32_chars_1234'
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'chave_refresh_de_teste_unitario_minimo_32_chars'
