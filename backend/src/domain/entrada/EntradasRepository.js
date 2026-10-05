const db = require('../../config/database'); // Instância da pool (ex: mysql2/promise)

class EntradasRepository {
    async buscarTodasEntradas() {
        const query = `
      SELECT 
        e.id_entrada AS idEntrada,
        e.id_funcionario AS idFuncionario,
        e.id_fornecedor AS idFornecedor,
        e.id_sku AS idSku,
        e.quantidade,
        e.valor_total AS valorTotal,
        e.data_entrada AS dataEntrada,
        e.lote,
        e.nota_fiscal AS notaFiscal
      FROM entrada e
      ORDER BY e.data_entrada DESC, e.id_entrada DESC
    `;

        const [rows] = await db.query(query);
        return rows;
    }

    async buscarEntradaPorId(id) {
        const query = `
      SELECT 
        e.id_entrada AS idEntrada,
        e.id_funcionario AS idFuncionario,
        e.id_fornecedor AS idFornecedor,
        e.id_sku AS idSku,
        e.quantidade,
        e.valor_total AS valorTotal,
        e.data_entrada AS dataEntrada,
        e.lote,
        e.nota_fiscal AS notaFiscal
      FROM entrada e
      WHERE e.id_entrada = ?
    `;

        const [rows] = await db.query(query, [id]);
        return rows[0] || null;
    }

    async create(dados) {
        const {
            idFuncionario,
            idFornecedor,
            idSku,
            quantidade,
            valorTotal,
            dataEntrada,
            lote,
            notaFiscal
        } = dados;

        const query = `
      INSERT INTO entrada (
        id_funcionario,
        id_fornecedor,
        id_sku,
        quantidade,
        valor_total,
        data_entrada,
        lote,
        nota_fiscal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const [result] = await db.execute(query, [
            idFuncionario,
            idFornecedor,
            idSku,
            quantidade,
            valorTotal,
            dataEntrada,
            lote,
            notaFiscal
        ]);

        return result.insertId;
    }
}

module.exports = new EntradasRepository();