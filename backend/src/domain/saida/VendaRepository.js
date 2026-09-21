const pool = require('../../config/database')

class VendaRepository {

    async buscarTodasVendas() {
        const [rows] = await pool.query(
            `SELECT v.*, c.nome AS cliente_nome
               FROM venda v
               LEFT JOIN cliente c ON c.id_cliente = v.id_cliente
              ORDER BY v.data_venda DESC, v.id_venda DESC`
        )
        return rows
    }

    // Retorna a venda com seus itens e pagamentos
    async buscarVendaPorId(id) {
        const [vendaRows] = await pool.query(
            `SELECT v.*, c.nome AS cliente_nome
               FROM venda v
               LEFT JOIN cliente c ON c.id_cliente = v.id_cliente
              WHERE v.id_venda = ?`,
            [id]
        )

        if (vendaRows.length === 0) return null

        const [itens] = await pool.query(
            `SELECT iv.*, s.tamanho, s.cor, s.codigo_barras, m.nome_modelo
               FROM item_venda iv
               JOIN sku s    ON s.id_sku = iv.id_sku
               JOIN modelo m ON m.id_modelo = s.id_modelo
              WHERE iv.id_venda = ?`,
            [id]
        )

        const [pagamentos] = await pool.query(
            'SELECT * FROM pagamento WHERE id_venda = ?',
            [id]
        )

        return { ...vendaRows[0], itens, pagamentos }
    }

    // Executa o callback dentro de uma transação. Qualquer erro faz rollback.
    // READ COMMITTED garante que a checagem de estoque (trigger) enxergue
    // vendas já confirmadas por outras transações.
    async executarEmTransacao(callback) {
        const connection = await pool.getConnection()

        try {
            await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED')
            await connection.beginTransaction()

            const resultado = await callback(connection)

            await connection.commit()
            return resultado
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    }

    // Trava os SKUs (em ordem crescente, evita deadlock) e devolve o preço atual.
    // Enquanto a transação não termina, outra venda do mesmo SKU espera.
    async bloquearSkus(connection, idsSku) {
        const [rows] = await connection.query(
            `SELECT id_sku, preco_venda
               FROM sku
              WHERE id_sku IN (?) AND ativo = TRUE AND deleted_at IS NULL
              ORDER BY id_sku
                FOR UPDATE`,
            [idsSku]
        )
        return rows
    }

    async clienteAtivoExiste(connection, idCliente) {
        const [rows] = await connection.query(
            `SELECT 1 FROM cliente
              WHERE id_cliente = ? AND ativo = TRUE AND deleted_at IS NULL`,
            [idCliente]
        )
        return rows.length > 0
    }

    async inserirVenda(connection, venda) {
        const {
            idCliente = null,
            idFuncionario,
            canal,
            status,
            desconto,
            valorTotal,
            codigoRastreamento = null,
            observacao = null
        } = venda

        const [result] = await connection.query(
            `INSERT INTO venda
                (id_cliente, id_funcionario, canal, status, desconto, valor_total, codigo_rastreamento, observacao)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [idCliente, idFuncionario, canal, status, desconto, valorTotal, codigoRastreamento, observacao]
        )

        return result.insertId
    }

    // O trigger trg_item_venda_valida_estoque roda a cada linha inserida
    async inserirItens(connection, idVenda, itens) {
        const valores = itens.map((i) => [
            idVenda,
            i.idSku,
            i.quantidade,
            i.precoUnitario,
            i.descontoItem
        ])

        await connection.query(
            `INSERT INTO item_venda
                (id_venda, id_sku, quantidade, preco_unitario, desconto_item)
             VALUES ?`,
            [valores]
        )
    }

    async inserirPagamentos(connection, idVenda, pagamentos) {
        if (pagamentos.length === 0) return

        const valores = pagamentos.map((p) => [
            idVenda,
            p.forma,
            p.parcelas,
            p.valor,
            p.status,
            p.status === 'APROVADO' ? new Date() : null
        ])

        await connection.query(
            `INSERT INTO pagamento
                (id_venda, forma, parcelas, valor, status, data_pagamento)
             VALUES ?`,
            [valores]
        )
    }
}

module.exports = new VendaRepository()