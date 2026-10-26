const pool = require('../../config/database')

class AuthRepository {

    async findByEmail(email) {
        const [rows] = await pool.query(
            `SELECT f.*, c.nivel_acesso
               FROM funcionario f
               JOIN cargo c ON c.id_cargo = f.id_cargo
              WHERE f.email = ? AND f.ativo = TRUE AND f.deleted_at IS NULL`,
            [email]
        )
        return rows[0]
    }

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT f.*, c.nivel_acesso
               FROM funcionario f
               JOIN cargo c ON c.id_cargo = f.id_cargo
              WHERE f.id_funcionario = ? AND f.ativo = TRUE AND f.deleted_at IS NULL`,
            [id]
        )
        return rows[0]
    }

    async salvarRefresh(funcionarioId, token, expiraEm) {
        await pool.query(
            'INSERT INTO refresh_tokens (id_funcionario, token, expira_em) VALUES (?, ?, ?)',
            [funcionarioId, token, expiraEm]
        )
    }

    // Só retorna tokens ainda não expirados
    async buscarRefreshToken(token) {
        const [rows] = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = ? AND expira_em > NOW()',
            [token]
        )
        return rows[0]
    }

    async removerRefreshToken(token) {
        await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [token])
    }
}

module.exports = new AuthRepository()
