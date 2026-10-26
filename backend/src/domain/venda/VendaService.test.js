jest.mock('./VendaRepository')
const Repo = require('./VendaRepository')
const Service = require('./VendaService')

const conn = { id: 'conn' }

beforeEach(() => {
  jest.resetAllMocks()
  // executarEmTransacao apenas executa o callback com uma conexão falsa
  Repo.executarEmTransacao.mockImplementation((cb) => cb(conn))
})

const venda = (extra = {}) => ({
  idFuncionario: 1,
  itens: [{ idSku: 10, quantidade: 2 }],
  ...extra,
})

describe('VendaService.criarVenda', () => {
  it.each([
    [{ idFuncionario: 0 }], [{ canal: 'LOJA2' }], [{ itens: [] }], [{ desconto: -1 }],
    [{ itens: [{ idSku: 1, quantidade: 0 }] }],
    [{ itens: [{ idSku: 1, quantidade: 1 }, { idSku: 1, quantidade: 1 }] }],
    [{ pagamentos: [{ forma: 'FIADO', valor: 10 }] }],
    [{ pagamentos: [{ forma: 'PIX', parcelas: 3, valor: 10 }] }],
  ])('rejeita payload inválido %j', async (extra) => {
    await expect(Service.criarVenda(venda(extra))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('calcula total no servidor, baixa o estoque e marca PAGA quando tudo aprovado', async () => {
    Repo.bloquearSkus.mockResolvedValue([{ id_sku: 10, preco_venda: 199.9, quantidade_estoque: 5 }])
    Repo.inserirVenda.mockResolvedValue(77)
    Repo.buscarVendaPorId.mockResolvedValue({ id_venda: 77 })

    await Service.criarVenda(venda({
      desconto: 10,
      pagamentos: [{ forma: 'PIX', valor: 389.8, status: 'APROVADO' }],
    }))

    expect(Repo.inserirVenda).toHaveBeenCalledWith(conn, expect.objectContaining({ valorTotal: 389.8, status: 'PAGA', desconto: 10 }))
    expect(Repo.baixarEstoque).toHaveBeenCalledWith(conn, [expect.objectContaining({ idSku: 10, quantidade: 2 })])
  })

  it('404 quando o SKU não existe', async () => {
    Repo.bloquearSkus.mockResolvedValue([])
    await expect(Service.criarVenda(venda())).rejects.toMatchObject({ statusCode: 404 })
  })

  it('rejeita pagamentos que não fecham o total', async () => {
    Repo.bloquearSkus.mockResolvedValue([{ id_sku: 10, preco_venda: 100 }])
    await expect(Service.criarVenda(venda({ pagamentos: [{ forma: 'PIX', valor: 50 }] }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('propaga 409 de estoque insuficiente', async () => {
    const AppError = require('../../shared/errors/AppError')
    Repo.bloquearSkus.mockResolvedValue([{ id_sku: 10, preco_venda: 100 }])
    Repo.inserirVenda.mockResolvedValue(1)
    Repo.baixarEstoque.mockRejectedValue(new AppError('Estoque insuficiente', 409))
    await expect(Service.criarVenda(venda())).rejects.toMatchObject({ statusCode: 409 })
  })
})

describe('VendaService.atualizarStatus', () => {
  it('rejeita status inválido e id inválido', async () => {
    await expect(Service.atualizarStatus(1, 'XYZ')).rejects.toMatchObject({ statusCode: 400 })
    await expect(Service.atualizarStatus('a', 'PAGA')).rejects.toMatchObject({ statusCode: 400 })
  })

  it('404 quando a venda não existe', async () => {
    Repo.buscarStatusParaAtualizar.mockResolvedValue(null)
    await expect(Service.atualizarStatus(1, 'PAGA')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('bloqueia transição inválida (ENTREGUE -> ABERTA) com 409', async () => {
    Repo.buscarStatusParaAtualizar.mockResolvedValue({ status: 'ENTREGUE' })
    await expect(Service.atualizarStatus(1, 'ABERTA')).rejects.toMatchObject({ statusCode: 409 })
  })

  it('cancelar repõe o estoque', async () => {
    Repo.buscarStatusParaAtualizar.mockResolvedValue({ status: 'PAGA' })
    Repo.possuiDevolucoes.mockResolvedValue(false)
    Repo.buscarVendaPorId.mockResolvedValue({ id_venda: 1, status: 'CANCELADA' })
    await Service.atualizarStatus(1, 'CANCELADA')
    expect(Repo.reporEstoqueDaVenda).toHaveBeenCalledWith(conn, 1)
    expect(Repo.atualizarStatus).toHaveBeenCalledWith(conn, 1, 'CANCELADA')
  })

  it('não cancela venda que já tem devoluções', async () => {
    Repo.buscarStatusParaAtualizar.mockResolvedValue({ status: 'PAGA' })
    Repo.possuiDevolucoes.mockResolvedValue(true)
    await expect(Service.atualizarStatus(1, 'CANCELADA')).rejects.toMatchObject({ statusCode: 409 })
    expect(Repo.reporEstoqueDaVenda).not.toHaveBeenCalled()
  })
})
