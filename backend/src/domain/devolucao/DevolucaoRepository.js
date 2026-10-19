const pool = require('../../config/database');
const AppError = require('../../shared/errors/AppError');

class DevolucaoRepository {
    async buscarTodasDevolucoes() {
        const query = `
      SELECT 
        d.id_devolucao AS idDevolucao,
        d.id_funcionario AS idFuncionario,
        d.id_item_venda AS idItemVenda,
        d.tipo,
        d.quantidade,
        d.motivo,
        (d.reutilizavel = 1) AS reutilizavel,
        d.valor_reembolso AS valorReembolso,
        d.id_venda_troca AS idVendaTroca,
        d.data_devolucao AS dataDevolucao
      FROM devolucao d
      ORDER BY d.data_devolucao DESC, d.id_devolucao DESC
    `;

        const [rows] = await pool.query(query);
        return rows;
    }

    async buscarDevolucoesPorId(id) {
        const query = `
      SELECT 
        d.id_devolucao AS idDevolucao,
        d.id_funcionario AS idFuncionario,
        d.id_item_venda AS idItemVenda,
        d.tipo,
        d.quantidade,
        d.motivo,
        (d.reutilizavel = 1) AS reutilizavel,
        d.valor_reembolso AS valorReembolso,
        d.id_venda_troca AS idVendaTroca,
        d.data_devolucao AS dataDevolucao
      FROM devolucao d
      WHERE d.id_devolucao = ?
    `;

        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    // Valida contra o item vendido, grava a devolução e (se reutilizável) devolve o par ao estoque.
    async cadastrarDevolucao(devolucaoData) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [itens] = await connection.query(
                `SELECT iv.id_item_venda, iv.id_sku, iv.quantidade, iv.preco_unitario, v.status
                   FROM item_venda iv
                   JOIN venda v ON v.id_venda = iv.id_venda
                  WHERE iv.id_item_venda = ?
                    FOR UPDATE`,
                [devolucaoData.id_item_venda]
            );
            if (itens.length === 0) throw new AppError('Item de venda não encontrado.', 404);
            const item = itens[0];

            if (!['PAGA', 'ENVIADA', 'ENTREGUE'].includes(item.status)) {
                throw new AppError(`Não é possível devolver itens de uma venda ${item.status}.`, 409);
            }

            const [[{ jaDevolvido }]] = await connection.query(
                'SELECT COALESCE(SUM(quantidade), 0) AS jaDevolvido FROM devolucao WHERE id_item_venda = ?',
                [item.id_item_venda]
            );
            if (Number(jaDevolvido) + devolucaoData.quantidade > item.quantidade) {
                throw new AppError(
                    `Quantidade devolvida excede o vendido (vendido: ${item.quantidade}, já devolvido: ${Number(jaDevolvido)}).`,
                    409
                );
            }

            const maxReembolso = Math.round(item.preco_unitario * devolucaoData.quantidade * 100) / 100;
            if (devolucaoData.valor_reembolso > maxReembolso) {
                throw new AppError(`O reembolso não pode passar de ${maxReembolso.toFixed(2)}.`, 400);
            }

            const [result] = await connection.execute(
                `INSERT INTO devolucao (
                    id_funcionario, id_item_venda, tipo, quantidade, motivo,
                    reutilizavel, valor_reembolso, id_venda_troca, data_devolucao
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    devolucaoData.id_funcionario,
                    devolucaoData.id_item_venda,
                    devolucaoData.tipo,
                    devolucaoData.quantidade,
                    devolucaoData.motivo,
                    devolucaoData.reutilizavel,
                    devolucaoData.valor_reembolso,
                    devolucaoData.id_venda_troca,
                    devolucaoData.data_devolucao
                ]
            );

            if (devolucaoData.reutilizavel) {
                await connection.query(
                    'UPDATE sku SET quantidade_estoque = quantidade_estoque + ? WHERE id_sku = ?',
                    [devolucaoData.quantidade, item.id_sku]
                );
            }

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new DevolucaoRepository();
