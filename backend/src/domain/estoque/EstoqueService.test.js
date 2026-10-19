jest.mock('./EstoqueRepository')
const Repo = require('./EstoqueRepository')
const EstoqueService = require('./EstoqueService')

beforeEach(() => jest.resetAllMocks())

describe('EstoqueService', () => {
  it('lista normalizando flags para boolean', async () => {
    Repo.listarTodos.mockResolvedValue([{ id_sku: 1, abaixo_do_minimo: 1, ativo: 1 }, { id_sku: 2, abaixo_do_minimo: 0, ativo: 1 }])
    const r = await EstoqueService.listarEstoque()
    expect(r.total).toBe(2)
    expect(r.dados[0].abaixo_do_minimo).toBe(true)
    expect(r.dados[1].abaixo_do_minimo).toBe(false)
  })

  it('buscarPorId valida o id', async () => {
    await expect(EstoqueService.buscarPorId('abc')).rejects.toMatchObject({ statusCode: 400 })
  })

  it('buscarPorId retorna 404 quando não existe', async () => {
    Repo.buscarPorSkuId.mockResolvedValue(null)
    await expect(EstoqueService.buscarPorId(5)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('buscarPorId retorna o item', async () => {
    Repo.buscarPorSkuId.mockResolvedValue({ id_sku: 5, abaixo_do_minimo: 0, ativo: 1 })
    const r = await EstoqueService.buscarPorId('5')
    expect(r.dados).toMatchObject({ id_sku: 5, abaixo_do_minimo: false, ativo: true })
  })
})
