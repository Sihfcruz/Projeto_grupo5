const EntradaService = require('./EntradaService').constructor

const mk = () => {
  const entradasRepo = { buscarTodasEntradas: jest.fn(), buscarEntradaPorId: jest.fn(), create: jest.fn() }
  const skuRepo = { findById: jest.fn() }
  return { entradasRepo, skuRepo, service: new EntradaService(entradasRepo, skuRepo) }
}

const dados = () => ({
  idFuncionario: 1, idSku: 2, quantidade: 10, valorTotal: 500.5, dataEntrada: '2026-01-15', lote: ' L1 ',
})

describe('EntradaService', () => {
  it('lista vazia retorna 200 com total 0 (não erro)', async () => {
    const { service, entradasRepo } = mk()
    entradasRepo.buscarTodasEntradas.mockResolvedValue([])
    await expect(service.listarEntradas()).resolves.toMatchObject({ sucesso: true, total: 0 })
  })

  it('valida id', async () => {
    const { service } = mk()
    await expect(service.listarEntradaPorId('x')).rejects.toMatchObject({ statusCode: 400 })
  })

  it('404 quando não encontra', async () => {
    const { service, entradasRepo } = mk()
    entradasRepo.buscarEntradaPorId.mockResolvedValue(null)
    await expect(service.listarEntradaPorId(3)).rejects.toMatchObject({ statusCode: 404 })
  })

  it.each([
    ['quantidade', 0], ['quantidade', 1.5], ['valorTotal', -1], ['lote', ''], ['dataEntrada', '15/01/2026'], ['idSku', 'a'],
  ])('rejeita %s inválido (%p)', async (campo, valor) => {
    const { service } = mk()
    await expect(service.criarEntrada({ ...dados(), [campo]: valor })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('404 quando o SKU não existe', async () => {
    const { service, skuRepo } = mk()
    skuRepo.findById.mockResolvedValue(null)
    await expect(service.criarEntrada(dados())).rejects.toMatchObject({ statusCode: 404 })
  })

  it('cria a entrada (lote com trim)', async () => {
    const { service, skuRepo, entradasRepo } = mk()
    skuRepo.findById.mockResolvedValue({ idSku: 2 })
    entradasRepo.create.mockResolvedValue(8)
    entradasRepo.buscarEntradaPorId.mockResolvedValue({ idEntrada: 8 })
    const r = await service.criarEntrada(dados())
    expect(entradasRepo.create).toHaveBeenCalledWith(expect.objectContaining({ lote: 'L1' }))
    expect(r.dados).toEqual({ idEntrada: 8 })
  })

  it('lote duplicado vira 409', async () => {
    const { service, skuRepo, entradasRepo } = mk()
    skuRepo.findById.mockResolvedValue({ idSku: 2 })
    entradasRepo.create.mockRejectedValue({ code: 'ER_DUP_ENTRY' })
    await expect(service.criarEntrada(dados())).rejects.toMatchObject({ statusCode: 409 })
  })
})
