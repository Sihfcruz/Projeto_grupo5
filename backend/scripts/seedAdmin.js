/**
 * Cria (ou atualiza) o cargo admin e o funcionário admin inicial.
 * Idempotente: pode ser executado várias vezes sem duplicar dados.
 *
 * Variáveis de ambiente (além das do banco):
 *   ADMIN_EMAIL  – e-mail do admin (obrigatório)
 *   ADMIN_SENHA  – senha em texto claro (obrigatório)
 *   ADMIN_NOME   – nome completo (default: "Administrador")
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const bcrypt = require('bcrypt')
const mysql = require('mysql2/promise')
const config = require('../src/config/environment')

const NIVEL_ADMIN = config.nivelAdmin ?? 100
const BCRYPT_ROUNDS = 10

async function main() {
    const email = process.env.ADMIN_EMAIL
    const senha = process.env.ADMIN_SENHA
    const nome = process.env.ADMIN_NOME || 'Administrador'

    if (!email || !senha) {
        console.error('ADMIN_EMAIL e ADMIN_SENHA são obrigatórios.')
        process.exit(1)
    }

    const connection = await mysql.createConnection({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.name
    })

    try {
        // 1. Garantir que existe um cargo com nivel_acesso >= NIVEL_ADMIN
        const [cargos] = await connection.execute(
            'SELECT id_cargo FROM cargo WHERE nivel_acesso >= ? LIMIT 1',
            [NIVEL_ADMIN]
        )

        let idCargo
        if (cargos.length > 0) {
            idCargo = cargos[0].id_cargo
        } else {
            const [res] = await connection.execute(
                'INSERT INTO cargo (nome_cargo, nivel_acesso) VALUES (?, ?)',
                ['Administrador', NIVEL_ADMIN]
            )
            idCargo = res.insertId
            console.log(`Cargo "Administrador" criado (id ${idCargo}).`)
        }

        // 2. Criar ou atualizar funcionário admin
        const hash = await bcrypt.hash(senha, BCRYPT_ROUNDS)
        const [existentes] = await connection.execute(
            'SELECT id_funcionario FROM funcionario WHERE email = ?',
            [email.toLowerCase()]
        )

        if (existentes.length > 0) {
            await connection.execute(
                'UPDATE funcionario SET nome_completo = ?, senha = ?, id_cargo = ?, ativo = TRUE, deleted_at = NULL WHERE email = ?',
                [nome, hash, idCargo, email.toLowerCase()]
            )
            console.log(`Admin "${email}" atualizado.`)
        } else {
            await connection.execute(
                'INSERT INTO funcionario (nome_completo, data_nascimento, senha, email, id_cargo) VALUES (?, ?, ?, ?, ?)',
                [nome, '1990-01-01', hash, email.toLowerCase(), idCargo]
            )
            console.log(`Admin "${email}" criado.`)
        }
    } finally {
        await connection.end()
    }
}

main().catch((err) => {
    console.error('Erro ao executar seedAdmin:', err.message)
    process.exit(1)
})
