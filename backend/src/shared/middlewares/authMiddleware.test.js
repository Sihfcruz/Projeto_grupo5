const jwt = require('jsonwebtoken')
const { verificarToken, verificarAdmin } = require('./authMiddleware')

const res = () => {
  const r = {}
  r.status = jest.fn().mockReturnValue(r)
  r.json = jest.fn().mockReturnValue(r)
  return r
}

describe('verificarToken', () => {
  it('401 sem header', () => {
    const r = res(), next = jest.fn()
    verificarToken({ headers: {} }, r, next)
    expect(r.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('401 com token inválido ou assinado com outra chave', () => {
    const r = res(), next = jest.fn()
    const falso = jwt.sign({ id: 1, papel: 'admin' }, 'outra-chave-qualquer-com-mais-de-32-caracteres')
    verificarToken({ headers: { authorization: `Bearer ${falso}` } }, r, next)
    expect(r.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('aceita token válido e preenche req.usuario', () => {
    const req = { headers: { authorization: `Bearer ${jwt.sign({ id: 3, papel: 'funcionario' }, process.env.JWT_SECRET)}` } }
    const next = jest.fn()
    verificarToken(req, res(), next)
    expect(next).toHaveBeenCalled()
    expect(req.usuario).toMatchObject({ id: 3, papel: 'funcionario' })
  })
})

describe('verificarAdmin', () => {
  it('403 para não admin, passa para admin', () => {
    const r = res(), next = jest.fn()
    verificarAdmin({ usuario: { papel: 'funcionario' } }, r, next)
    expect(r.status).toHaveBeenCalledWith(403)
    verificarAdmin({ usuario: { papel: 'admin' } }, res(), next)
    expect(next).toHaveBeenCalledTimes(1)
  })
})
