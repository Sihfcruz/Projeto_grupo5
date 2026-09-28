const pool = require('../../config/database');

class EstoqueRepository {
    /**
     * Consulta todo o estoque consolidado a partir da View.
     * @returns {Promise<Array<Object>>}
     */
    async listarTodos() {
        const [rows] = await pool.query('SELECT * FROM vw_estoque_atual');
        return rows;
    }

    /**
     * Consulta um SKU específico pelo seu identificador primário.
     * Utiliza Prepared Statement (?, idSku) para proteção contra SQL Injection.
     * @param {number} idSku 
     * @returns {Promise<Object|null>}
     */
    async buscarPorSkuId(idSku) {
        const [rows] = await pool.query(
            'SELECT * FROM vw_estoque_atual WHERE id_sku = ?',
            [idSku]
        );
        return rows[0] || null;
    }
}

module.exports = new EstoqueRepository();