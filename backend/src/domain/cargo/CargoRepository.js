const pool = require('../../config/database')

class CargoRepository {
    async listar() {
        const [rows] = await pool.query('SELECT * FROM cargo ORDER BY id_cargo DESC')
        return rows
    }

    async buscarPorId(id) {
        const [rows] = await pool.query('SELECT * FROM cargo WHERE id_cargo = ?', [id])
        if (rows.length === 0) return null
        return rows[0]
    }

    async buscarPorNome(nome) {
        const [rows] = await pool.query('SELECT * FROM cargo WHERE nome = ?', [nome])
        if (rows.length === 0) return null
        return rows[0]
    }

    async cadastrar(dados) {
        const [result] = await pool.query('INSERT INTO cargo SET ?', [dados])
        return result.insertId
    }

    async atualizar(id, dados) {
        await pool.query('UPDATE cargo SET ? WHERE id_cargo = ?', [dados, id])
    }

    async excluir(id) {
        await pool.query('DELETE FROM cargo WHERE id_cargo = ?', [id])
    }
}

module.exports = new CargoRepository()