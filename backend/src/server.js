require('dotenv').config()
const app = require('./app')
const pool = require('./config/database')
const AuthRepository = require('./domain/auth/AuthFuncionarioRepository')

const PORT = process.env.PORT || 3000

console.log('Inicializando servidor!')

function validateEnv() {
    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_SECUNDARY
    if (!secret || secret.length < 32)
        throw new Error('JWT_SECRET ausente ou muito curto (mínimo 32 caracteres)')

    const refreshSecret = process.env.JWT_REFRESH_SECRET
    if (!refreshSecret || refreshSecret.length < 32)
        throw new Error('JWT_REFRESH_SECRET ausente ou muito curto (mínimo 32 caracteres)')
}

async function startServer() {
    try {
        validateEnv()

        const connection = await pool.getConnection()
        console.log('Conexão estabelecida')
        connection.release()

        app.listen(PORT, () => {
            console.log('Servidor rodando na porta', { PORT })
        })

        // Limpa refresh tokens expirados uma vez por hora
        setInterval(() => {
            AuthRepository.removerExpirados().catch(() => {})
        }, 60 * 60 * 1000)
    } catch (error) {
        console.error('Erro ao realizar a conexão com o banco de dados', error)
        process.exit(1)
    }

}


startServer()