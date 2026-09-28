const pool = require('../../config/database');

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
        d.reutilizavel,
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
        d.reutilizavel,
        d.valor_reembolso AS valorReembolso,
        d.id_venda_troca AS idVendaTroca,
        d.data_devolucao AS dataDevolucao
      FROM devolucao d
      WHERE d.id_devolucao = ?
    `;

        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    async cadastrarDevolucao(devolucaoData) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const query = `
        INSERT INTO devolucao (
          id_funcionario,
          id_item_venda,
          tipo,
          quantidade,
          motivo,
          reutilizavel,
          valor_reembolso,
          id_venda_troca,
          data_devolucao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const [result] = await connection.execute(query, [
                devolucaoData.id_funcionario,
                devolucaoData.id_item_venda,
                devolucaoData.tipo,
                devolucaoData.quantidade,
                devolucaoData.motivo,
                devolucaoData.reutilizavel,
                devolucaoData.valor_reembolso,
                devolucaoData.id_venda_troca,
                devolucaoData.data_devolucao
            ]);

            // Efetiva as alterações no disco/redo log do MySQL
            await connection.commit();

            // Retorna a chave primária gerada via AUTO_INCREMENT
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