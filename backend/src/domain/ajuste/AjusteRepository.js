const pool = require('../../config/database');
class AjusteRepository {
    async registrar(idSku, quantidade, motivo) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('INSERT INTO ajuste_estoque (id_sku, quantidade, motivo) VALUES (?, ?, ?)', [idSku, quantidade, motivo]);
            await connection.query('UPDATE sku SET quantidade = quantidade + ? WHERE id_sku = ?', [quantidade, idSku]);
            await connection.commit();
        } catch (e) {
            await connection.rollback();
            throw e;
        } finally {
            connection.release();
        }
    }
}
module.exports = new AjusteRepository();