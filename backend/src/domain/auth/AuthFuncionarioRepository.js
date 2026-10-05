const pool = require('../../config/database')

class AuthRepository {

    async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM funcionario WHERE email = ? AND deleted_at IS NULL', [email])
        return rows[0]
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM funcionario WHERE id_funcionario = ? AND deleted_at IS NULL', [id])
        return rows[0]
    }

    async salvarRefresh(funcionarioId, token, expiraEm) {
        await pool.query(
            `INSERT INTO refresh_tokens (id_funcionario, token, expira_em) VALUES (?, ?, ?)`, [funcionarioId, token, expiraEm]
        )
    }

    async buscarRefreshToken(token) {
        const [rows] = await pool.query('SELECT * FROM refresh_tokens WHERE token = ?', [token])
        return rows[0]
    }

    async removerRefreshToken(token) {
        await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [token])
    }
}

module.exports = new AuthRepository()