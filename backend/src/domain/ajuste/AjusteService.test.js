jest.mock('./AjusteRepository')
const Repo = require('./AjusteRepository')
const AjusteService = require('./AjusteService')

beforeEach(() => jest.resetAllMocks())

describe('AjusteService', () => {
  it.each([
    [undefined, 5, 'x'], [1, 0, 'x'], [1, 1.5, 'x'], [1, 5, ''], [1, 5, undefined],
  ])('rejeita dados inválidos (%p, %p, %p)', async (sku, qtd, motivo) => {
    await expect(AjusteService.ajustar(sku, qtd, motivo)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('registra ajuste positivo e negativo', async () => {
    await expect(AjusteService.ajustar(1, -3, ' perda ', 9)).resolves.toEqual({ sucesso: true })
    expect(Repo.registrar).toHaveBeenCalledWith(1, -3, 'perda', 9)
  })

  it('traduz violação de CHECK em 409', async () => {
    Repo.registrar.mockRejectedValue({ code: 'ER_CHECK_CONSTRAINT_VIOLATED' })
    await expect(AjusteService.ajustar(1, -3, 'x')).rejects.toMatchObject({ statusCode: 409 })
  })
})
