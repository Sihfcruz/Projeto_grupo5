const bcrypt = require('bcrypt')
const pool = require('./database')
const { texto, emailValido, dataISO } = require('../shared/lib/validators')

async function criarAdmin() {
    const email = emailValido()(process.env.ADMIN_EMAIL)
    const nome = texto('ADMIN_NOME', { max: 100 })(process.env.ADMIN_NOME || 'Administrador')
    const nascimento = dataISO('ADMIN_NASCIMENTO')(process.env.ADMIN_NASCIMENTO)
    const senha = process.env.ADMIN_SENHA
    if (typeof senha !== 'string' || senha.length < 8 || Buffer.byteLength(senha) > 72) throw new Error('ADMIN_SENHA deve ter pelo menos 8 caracteres e no máximo 72 bytes')
    const hoje = new Date()
    if (new Date(nascimento + 'T00:00:00') > new Date(hoje.getFullYear() - 14, hoje.getMonth(), hoje.getDate())) throw new Error('Administrador deve ter pelo menos 14 anos')
    const [cargos] = await pool.query('SELECT id_cargo FROM cargo WHERE nivel_acesso >= 100 ORDER BY id_cargo LIMIT 1')
    if (!cargos.length) throw new Error('Carregue o schema antes de criar o administrador')
    const [existentes] = await pool.query('SELECT id_funcionario FROM funcionario WHERE email = ?', [email])
    if (existentes.length) throw new Error('E-mail já cadastrado; nenhuma conta foi alterada')
    await pool.query('INSERT INTO funcionario (nome_completo, data_nascimento, senha, email, id_cargo) VALUES (?, ?, ?, ?, ?)', [nome, nascimento, await bcrypt.hash(senha, 10), email, cargos[0].id_cargo])
    console.log('Administrador criado com sucesso')
}

criarAdmin().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
}).finally(() => pool.end())
