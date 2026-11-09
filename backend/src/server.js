const config = require('./config/environment')
const app = require('./app')
const pool = require('./config/database')

const PORT = config.port

console.log('Inicializando servidor!')

function verifyToken() {
    if (!config.jwt.refreshSecret || config.jwt.refreshSecret.length < 32 || config.jwt.refreshSecret === config.jwt.secret) {
        throw new Error('Configure JWT_REFRESH_SECRET com pelo menos 32 caracteres e diferente da chave de acesso')
    }
    if (config.jwt.secret && config.jwt.secret.length >= 32) return config.jwt.secret

    throw new Error("Falha crítica: Nenhuma chave JWT válida (com +32 caractéres), foi encontrada no env")
}

async function startServer() {
    try {
        const secretKey = verifyToken()
        app.set('secretKey', secretKey)

        const connection = await pool.getConnection()
        console.log('Conexão estabelecida')
        connection.release()

        app.listen(PORT, () => {
            console.log('Servidor rodando na porta', { PORT })
        })
    } catch (error) {
        console.error('Erro ao realizar a conexão com o banco de dados', error)
        process.exit(1)
    }

}


startServer()