const VendaRepository = require('./VendaRepository')

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
  }
}

const CANAIS = ['LOJA', 'ONLINE']
const FORMAS_PAGAMENTO = ['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'VALE_TROCA']
const STATUS_PAGAMENTO = ['PENDENTE', 'APROVADO', 'RECUSADO', 'ESTORNADO']

const ehInteiroPositivo = (v) => Number.isInteger(v) && v > 0

// Trabalha em centavos para evitar erros de ponto flutuante (0.1 + 0.2)
const paraCentavos = (valor, campo) => {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
    throw new AppError(`O campo '${campo}' deve ser um número válido e não negativo.`)
  }
  const centavos = Math.round(valor * 100)
  if (Math.abs(valor * 100 - centavos) > 1e-6) {
    throw new AppError(`O campo '${campo}' aceita no máximo 2 casas decimais.`)
  }
  return centavos
}

class VendaService {

  async listarVendas() {
    const vendas = await VendaRepository.buscarTodasVendas()

    return {
      sucesso: true,
      dados: vendas,
      total: vendas.length
    }
  }

  async listarVendaPorId(id) {
    const idNumerico = Number(id)

    if (!ehInteiroPositivo(idNumerico)) {
      throw new AppError('Id inválido', 400)
    }

    const venda = await VendaRepository.buscarVendaPorId(idNumerico)

    if (!venda) {
      throw new AppError('Venda não encontrada', 404)
    }

    return { sucesso: true, dados: venda }
  }

  /**
   * Payload esperado:
   * {
   *   idFuncionario, idCliente?, canal?, desconto?, codigoRastreamento?, observacao?,
   *   itens: [{ idSku, quantidade, descontoItem? }],          // descontoItem = desconto total da linha
   *   pagamentos?: [{ forma, parcelas?, valor, status? }]
   * }
   * O preço vem do cadastro do SKU e o total é calculado aqui, nunca pelo cliente.
   */
  async criarVenda(dados) {
    const {
      idFuncionario,
      idCliente = null,
      canal = 'LOJA',
      desconto = 0,
      codigoRastreamento = null,
      observacao = null,
      itens,
      pagamentos = []
    } = dados || {}

    // 1. Validação do cabeçalho
    if (!ehInteiroPositivo(idFuncionario)) {
      throw new AppError("O campo 'idFuncionario' deve ser um número inteiro maior que zero.")
    }
    if (idCliente !== null && !ehInteiroPositivo(idCliente)) {
      throw new AppError("O campo 'idCliente' deve ser um número inteiro maior que zero.")
    }
    if (!CANAIS.includes(canal)) {
      throw new AppError(`O campo 'canal' deve ser um de: ${CANAIS.join(', ')}.`)
    }
    if (codigoRastreamento !== null &&
      (typeof codigoRastreamento !== 'string' || codigoRastreamento.length > 50)) {
      throw new AppError("O campo 'codigoRastreamento' deve ser um texto de até 50 caracteres.")
    }
    if (observacao !== null && (typeof observacao !== 'string' || observacao.length > 255)) {
      throw new AppError("O campo 'observacao' deve ser um texto de até 255 caracteres.")
    }
    const descontoVendaCent = paraCentavos(desconto, 'desconto')

    // 2. Validação dos itens
    if (!Array.isArray(itens) || itens.length === 0) {
      throw new AppError('A venda precisa ter ao menos um item.')
    }

    const idsVistos = new Set()
    const itensValidados = itens.map((item, i) => {
      const { idSku, quantidade, descontoItem = 0 } = item || {}

      if (!ehInteiroPositivo(idSku)) {
        throw new AppError(`Item ${i + 1}: 'idSku' deve ser um número inteiro maior que zero.`)
      }
      if (!ehInteiroPositivo(quantidade)) {
        throw new AppError(`Item ${i + 1}: 'quantidade' deve ser um número inteiro maior que zero.`)
      }
      if (idsVistos.has(idSku)) {
        throw new AppError(`O SKU ${idSku} aparece mais de uma vez. Some as quantidades em um único item.`)
      }
      idsVistos.add(idSku)

      return {
        idSku,
        quantidade,
        descontoItemCent: paraCentavos(descontoItem, `itens[${i}].descontoItem`)
      }
    })

    // 3. Validação dos pagamentos (opcionais)
    if (!Array.isArray(pagamentos)) {
      throw new AppError("O campo 'pagamentos' deve ser uma lista.")
    }

    const pagamentosValidados = pagamentos.map((pag, i) => {
      const { forma, parcelas = 1, valor, status = 'PENDENTE' } = pag || {}

      if (!FORMAS_PAGAMENTO.includes(forma)) {
        throw new AppError(`Pagamento ${i + 1}: 'forma' deve ser um de: ${FORMAS_PAGAMENTO.join(', ')}.`)
      }
      if (!STATUS_PAGAMENTO.includes(status)) {
        throw new AppError(`Pagamento ${i + 1}: 'status' deve ser um de: ${STATUS_PAGAMENTO.join(', ')}.`)
      }
      if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 24) {
        throw new AppError(`Pagamento ${i + 1}: 'parcelas' deve ser um inteiro entre 1 e 24.`)
      }
      if (parcelas > 1 && forma !== 'CARTAO_CREDITO') {
        throw new AppError(`Pagamento ${i + 1}: parcelamento só é permitido no cartão de crédito.`)
      }
      const valorCent = paraCentavos(valor, `pagamentos[${i}].valor`)
      if (valorCent <= 0) {
        throw new AppError(`Pagamento ${i + 1}: 'valor' deve ser maior que zero.`)
      }

      return { forma, parcelas, status, valorCent }
    })

    // 4. Transação: trava os SKUs, calcula valores e grava tudo
    try {
      const idVenda = await VendaRepository.executarEmTransacao(async (connection) => {

        if (idCliente !== null) {
          const clienteExiste = await VendaRepository.clienteAtivoExiste(connection, idCliente)
          if (!clienteExiste) {
            throw new AppError(`Cliente ${idCliente} não foi encontrado.`, 404)
          }
        }

        const skus = await VendaRepository.bloquearSkus(
          connection,
          itensValidados.map((i) => i.idSku)
        )
        const precoPorSku = new Map(skus.map((s) => [s.id_sku, Math.round(Number(s.preco_venda) * 100)]))

        let subtotalCent = 0

        const itensCalculados = itensValidados.map((item) => {
          const precoCent = precoPorSku.get(item.idSku)

          if (precoCent === undefined) {
            throw new AppError(`SKU ${item.idSku} não foi encontrado ou está inativo.`, 404)
          }

          const brutoCent = precoCent * item.quantidade
          if (item.descontoItemCent > brutoCent) {
            throw new AppError(`O desconto do SKU ${item.idSku} é maior que o valor do item.`)
          }

          subtotalCent += brutoCent - item.descontoItemCent

          return {
            idSku: item.idSku,
            quantidade: item.quantidade,
            precoUnitario: precoCent / 100,
            descontoItem: item.descontoItemCent / 100
          }
        })

        if (descontoVendaCent > subtotalCent) {
          throw new AppError('O desconto da venda é maior que o valor dos itens.')
        }

        const totalCent = subtotalCent - descontoVendaCent

        // Se houver pagamentos, precisam fechar exatamente o total
        const somaPagamentosCent = pagamentosValidados.reduce((acc, p) => acc + p.valorCent, 0)
        if (pagamentosValidados.length > 0 && somaPagamentosCent !== totalCent) {
          throw new AppError(
            `A soma dos pagamentos (${(somaPagamentosCent / 100).toFixed(2)}) ` +
            `difere do total da venda (${(totalCent / 100).toFixed(2)}).`
          )
        }

        const todosAprovados =
          pagamentosValidados.length > 0 &&
          pagamentosValidados.every((p) => p.status === 'APROVADO')

        const novaVendaId = await VendaRepository.inserirVenda(connection, {
          idCliente,
          idFuncionario,
          canal,
          status: todosAprovados ? 'PAGA' : 'ABERTA',
          desconto: descontoVendaCent / 100,
          valorTotal: totalCent / 100,
          codigoRastreamento,
          observacao
        })

        await VendaRepository.inserirItens(connection, novaVendaId, itensCalculados)

        await VendaRepository.inserirPagamentos(
          connection,
          novaVendaId,
          pagamentosValidados.map((p) => ({
            forma: p.forma,
            parcelas: p.parcelas,
            status: p.status,
            valor: p.valorCent / 100
          }))
        )

        return novaVendaId
      })

      const venda = await VendaRepository.buscarVendaPorId(idVenda)

      return {
        sucesso: true,
        mensagem: 'Venda cadastrada com sucesso!',
        dados: venda
      }
    } catch (error) {
      if (error instanceof AppError) throw error

      // Trigger de estoque (SIGNAL SQLSTATE '45000')
      if (error.sqlState === '45000') {
        throw new AppError(error.sqlMessage, 409)
      }
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new AppError('Funcionário, cliente ou SKU informado não existe.', 400)
      }
      if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
        throw new AppError('Algum valor informado viola as regras de validação do banco.', 400)
      }
      if (error.code === 'ER_LOCK_DEADLOCK') {
        throw new AppError('Conflito com outra venda em andamento. Tente novamente.', 409)
      }
      throw error
    }
  }
}

module.exports = new VendaService()