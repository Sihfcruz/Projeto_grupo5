const pool = require('../config/database')

class DevolucaoRepository {

    async buscarTodasDevolucoes() {

        const [rows] = await pool.query('SELECT * FROM devolucoes ORDER BY DESC')
        return rows
    }

    async buscarDevolucoesPorId(id) {

        const [devolucaoRows] = await pool.query('SELECT * FROM devoilucoes WHERE id = ?', [id])

        if(devolucaoRows.length === 0) return null

        const devolucao = devolucaoRows[0]

        return devolucao
    }

    async cadastrarDevolucao(devolucaoData) {
        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            const [result] = await pool.query('INSERT INTO saidas SET ?', [devolucaoData])
        } catch (error) {
            await connection.commit()
            throw error
        } finally {
            connection.release()
        }
    }
}

module.exports = new DevolucaoRepository