const v = require('../../shared/lib/validators')

// quantidadeEstoque é somente leitura: só muda por entrada, venda, devolução ou ajuste.
module.exports = {
    entidade: 'SKU',
    tabela: 'sku',
    pk: 'id_sku',
    softDelete: true,
    colunas: {
        idSku: 'id_sku', idModelo: 'id_modelo', tamanho: 'tamanho', cor: 'cor',
        codigoBarras: 'codigo_barras', precoCusto: 'preco_custo', precoVenda: 'preco_venda',
        estoqueMinimo: 'estoque_minimo', quantidadeEstoque: 'quantidade_estoque', ativo: 'ativo'
    },
    gravaveis: ['idModelo', 'tamanho', 'cor', 'codigoBarras', 'precoCusto', 'precoVenda', 'estoqueMinimo'],
    schema: {
        idModelo: { obrigatorio: true, valida: v.inteiroPositivo('idModelo') },
        tamanho: {
            obrigatorio: true,
            valida: (valor) => {
                if (typeof valor !== 'number' || valor < 15 || valor > 50 || Math.abs(valor * 2 - Math.round(valor * 2)) > 1e-9) {
                    throw new (require('../../shared/errors/AppError'))("O campo 'tamanho' deve estar entre 15 e 50 (múltiplos de 0,5).")
                }
                return valor
            }
        },
        cor: { obrigatorio: true, valida: v.texto('cor', { max: 30 }) },
        codigoBarras: { obrigatorio: true, valida: v.texto('codigoBarras', { max: 20 }) },
        precoCusto: { obrigatorio: true, valida: v.decimalPositivo('precoCusto') },
        precoVenda: { obrigatorio: true, valida: v.decimalPositivo('precoVenda') },
        estoqueMinimo: { valida: v.inteiroMin('estoqueMinimo', 0) }
    }
}
