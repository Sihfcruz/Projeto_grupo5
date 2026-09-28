const db = require('../config/database');

class SkuRepository {
    async findById(idSku) {
        const query = `
      SELECT 
        s.id_sku AS idSku,
        s.id_modelo AS idModelo,
        s.tamanho,
        s.cor,
        s.codigo_barras AS codigoBarras,
        s.preco_custo AS precoCusto,
        s.preco_venda AS precoVenda,
        s.estoque_minimo AS estoqueMinimo,
        s.ativo
      FROM sku s
      WHERE s.id_sku = ? 
        AND s.ativo = TRUE 
        AND s.deleted_at IS NULL
    `;

        const [rows] = await db.query(query, [idSku]);
        return rows[0] || null;
    }
}

module.exports = new SkuRepository();