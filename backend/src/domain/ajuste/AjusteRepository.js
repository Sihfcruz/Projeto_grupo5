const pool = require('../../config/database');
const AppError = require('../../shared/errors/AppError');

class AjusteRepository {
    async listar() {
        const [rows] = await pool.query(
            `SELECT a.id_ajuste AS idAjuste, a.id_sku AS idSku, a.id_funcionario AS idFuncionario,
                    a.quantidade, a.motivo, a.data_ajuste AS dataAjuste,
                    s.tamanho, s.cor, m.nome_modelo AS nomeModelo
               FROM ajuste_estoque a
               JOIN sku s    ON s.id_sku = a.id_sku
               JOIN modelo m ON m.id_modelo = s.id_modelo
              ORDER BY a.data_ajuste DESC, a.id_ajuste DESC`
        )
        return rows
    }

    async registrar(idSku, quantidade, motivo, idFuncionario = null) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [skus] = await connection.query(
                'SELECT quantidade_estoque FROM sku WHERE id_sku = ? AND deleted_at IS NULL FOR UPDATE', [idSku]
            );
            if (skus.length === 0) throw new AppError('SKU não encontrado.', 404);
            if (skus[0].quantidade_estoque + quantidade < 0) {
                throw new AppError('O ajuste deixaria o estoque negativo.', 409);
            }

            await connection.query(
                'INSERT INTO ajuste_estoque (id_sku, id_funcionario, quantidade, motivo) VALUES (?, ?, ?, ?)',
                [idSku, idFuncionario, quantidade, motivo]
            );
            await connection.query(
                'UPDATE sku SET quantidade_estoque = quantidade_estoque + ? WHERE id_sku = ?',
                [quantidade, idSku]
            );
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
