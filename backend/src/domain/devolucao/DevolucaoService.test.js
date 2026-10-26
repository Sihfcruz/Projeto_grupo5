jest.mock('./DevolucaoRepository')
const Repo = require('./DevolucaoRepository')
const AppError = require('../../shared/errors/AppError')
const Service = require('./DevolucaoService')

beforeEach(() => jest.resetAllMocks())

const dados = (extra = {}) => ({
  idFuncionario: 1, idItemVenda: 4, tipo: 'DEVOLUCAO', quantidade: 1, motivo: 'Tamanho errado',
  reutilizavel: true, valorReembolso: 100, dataDevolucao: '2026-02-10', ...extra,
})

describe('DevolucaoService', () => {
  it('lista vazia retorna 200 com total 0', async () => {
    Repo.buscarTodasDevolucoes.mockResolvedValue([])
    await expect(Service.listarDevolucoes()).resolves.toMatchObject({ sucesso: true, total: 0 })
  })

  it('valida id e 404', async () => {
    await expect(Service.listarDevolucaoPorId('abc')).rejects.toMatchObject({ statusCode: 400 })
    Repo.buscarDevolucoesPorId.mockResolvedValue(null)
    await expect(Service.listarDevolucaoPorId(9)).rejects.toMatchObject({ statusCode: 404 })
  })

  it.each([
    [{ quantidade: 0 }], [{ tipo: 'OUTRO' }], [{ motivo: '' }], [{ reutilizavel: 'sim' }],
    [{ valorReembolso: -1 }], [{ dataDevolucao: '10/02/2026' }], [{ idItemVenda: 'x' }],
    [{ tipo: 'TROCA' }], [{ idVendaTroca: 5 }],
  ])('rejeita payload inválido %j', async (extra) => {
    await expect(Service.criarDevolucao(dados(extra))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('cria devolução e envia colunas em snake_case ao repository', async () => {
    Repo.cadastrarDevolucao.mockResolvedValue(3)
    Repo.buscarDevolucoesPorId.mockResolvedValue({ idDevolucao: 3 })
    const r = await Service.criarDevolucao(dados({ motivo: ' defeito ' }))
    expect(Repo.cadastrarDevolucao).toHaveBeenCalledWith(expect.objectContaining({
      id_item_venda: 4, motivo: 'defeito', reutilizavel: true, id_venda_troca: null,
    }))
    expect(r.mensagem).toMatch(/Devolução/)
  })

  it('troca exige idVendaTroca', async () => {
    Repo.cadastrarDevolucao.mockResolvedValue(3)
    Repo.buscarDevolucoesPorId.mockResolvedValue({})
    await expect(Service.criarDevolucao(dados({ tipo: 'TROCA', idVendaTroca: 12 }))).resolves.toMatchObject({ sucesso: true })
  })

  it('propaga AppError do repository (ex.: excede vendido) sem mascarar', async () => {
    Repo.cadastrarDevolucao.mockRejectedValue(new AppError('Quantidade devolvida excede o vendido', 409))
    await expect(Service.criarDevolucao(dados())).rejects.toMatchObject({ statusCode: 409 })
  })

  it('FK inexistente vira 400', async () => {
    Repo.cadastrarDevolucao.mockRejectedValue({ code: 'ER_NO_REFERENCED_ROW_2' })
    await expect(Service.criarDevolucao(dados())).rejects.toMatchObject({ statusCode: 400 })
  })
})
