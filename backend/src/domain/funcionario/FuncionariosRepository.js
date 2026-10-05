const pool = require('../../config/database')

class FuncionarioRepository {

    async buscarTodosFuncionarios() {
        const [rows] = await pool.query('SELECT * FROM funcionario WHERE deleted_at IS NULL AND ativo = 1')
        return rows
    }

    async buscarFuncionarioUnico(id) {
        const [funcionarioRows] = await pool.query('SELECT * FROM funcionario WHERE id_funcionario = ? AND deleted_at IS NULL AND ativo = 1', [id])

        if (funcionarioRows.length === 0) return null

        const funcionario = funcionarioRows[0]
        return funcionario
    }

    async buscarPorEmail(email) {
        const [rows] = await pool.query('SELECT * FROM funcionario WHERE email = ? AND deleted_at IS NULL', [email])
        if (rows.length === 0) return null
        return rows[0]
    }

    async buscarCargoPorId(idCargo) {
        // Assume CargoRepository is handling cargo, but let's implement basic check
        const [rows] = await pool.query('SELECT * FROM cargo WHERE id_cargo = ?', [idCargo])
        if (rows.length === 0) return null
        return rows[0]
    }

    async cadastrarFuncionario(funcionarioData) {
        const { nome, dataNascimento, senha, email, idCargo } = funcionarioData

        const connection = await pool.getConnection()

        try {
            await connection.beginTransaction()

            const [result] = await connection.query('INSERT INTO funcionario (nome_completo, data_nascimento, senha, email, id_cargo) VALUES (?, ?, ?, ?, ?)', [nome, dataNascimento, senha, email, idCargo])

            const funcionarioId = result.insertId

            await connection.commit()
            return funcionarioId
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    }

    async atualizarFuncionario(id, funcionarioData) {
        const fields = []
        const values = []

        for (const [key, value] of Object.entries(funcionarioData)) {
            fields.push(`${key} = ?`)
            values.push(value)
        }

        if (fields.length === 0) return null

        values.push(id)
        const query = `UPDATE funcionario SET ${fields.join(', ')} WHERE id_funcionario = ?`
        const [result] = await pool.query(query, values)
        return result.affectedRows
    }

    async softDeleteFuncionario(id, dataDesativacao) {
        const [result] = await pool.query(
            `UPDATE funcionario SET ativo = 0, deleted_at = ? WHERE id_funcionario = ?`, [dataDesativacao, id]
        )
        return result.affectedRows
    }
}

module.exports = new FuncionarioRepository()