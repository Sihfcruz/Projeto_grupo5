require('dotenv').config()
const app = require('./app')
const pool = require('./config/database')

const PORT = process.env.PORT || 3000

console.log('Inicializando servidor!')

function verifyToken() {
    const primaryKey = process.env.JWT_SECRET
    const secondKey = process.env.JWT_SECRET_SECUNDARY

    if (primaryKey && primaryKey.length >= 32) return primaryKey
    if (secondKey && secondKey.length >= 32) return secondKey

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