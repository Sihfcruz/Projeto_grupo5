const { criarRepository } = require('../../shared/lib/crud')
const config = require('./CargoConfig')
const db = require('../../config/database')

module.exports = criarRepository(config)

class CargoRepository {

    async listar() {
        const query =
            `SELECT * from cargo `

        const [rows] = await db.query(query)
        return rows
    }

    async buscarPorId(id) {
        const query =
            `SELECT * FROM cargo WHERE id_cargo = ?`

        const [rows] = await db.query(query, [id])
        return rows[0] || null

    }

    /*
    async listar() {
        const [rows] = await pool.query(
            `SELECT ${select} FROM ${tabela} WHERE 1=1${filtroAtivo} ORDER BY ${orderBy}`
        )
        return rows
    }

    async buscarPorId(id) {
        const [rows] = await pool.query(
            `SELECT ${select} FROM ${tabela} WHERE ${pk} = ?${filtroAtivo}`, [id]
        )
        return rows[0] || null
    }
    */


    async criar(dados) {
        const query =
            `INSERT INTO cargo VALUES (?, ?)`

        const [rows] = db.query(query, [dados])
        return rows

    }

    async criar(dados) {
        const campos = gravaveis.filter((c) => dados[c] !== undefined)
        const sql = `INSERT INTO ${tabela} (${campos.map((c) => colunas[c]).join(', ')}) VALUES (${campos.map(() => '?').join(', ')})`
        const [result] = await pool.query(sql, campos.map((c) => dados[c]))
        return result.insertId
    }

    async atualizar(id, dados) {
        const campos = gravaveis.filter((c) => dados[c] !== undefined)
        if (campos.length === 0) return 0
        const sql = `UPDATE ${tabela} SET ${campos.map((c) => `${colunas[c]} = ?`).join(', ')} WHERE ${pk} = ?${filtroAtivo}`
        const [result] = await pool.query(sql, [...campos.map((c) => dados[c]), id])
        return result.affectedRows
    }

    async excluir(id) {
        const sql = softDelete
            ? `UPDATE ${tabela} SET ativo = FALSE, deleted_at = NOW() WHERE ${pk} = ? AND deleted_at IS NULL`
            : `DELETE FROM ${tabela} WHERE ${pk} = ?`
        const [result] = await pool.query(sql, [id])
        return result.affectedRows
    }
}


// Traduz erros comuns do MySQL em erros HTTP
function traduzirErroBanco(error, entidade) {
    if (error instanceof AppError) return error
    if (error.code === 'ER_DUP_ENTRY') return new AppError(`Já existe ${entidade} com estes dados.`, 409)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return new AppError('Um dos registros relacionados informados não existe.', 400)
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return new AppError(`Não é possível excluir: ${entidade} está em uso por outros registros.`, 409)
    if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return new AppError('Algum valor informado viola as regras do banco de dados.', 400)
    return error
}