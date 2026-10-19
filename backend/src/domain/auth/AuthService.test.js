jest.mock('./AuthFuncionarioRepository', () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  salvarRefresh: jest.fn(),
  buscarRefreshToken: jest.fn(),
  removerRefreshToken: jest.fn(),
}))
jest.mock('bcrypt', () => ({ compare: jest.fn() }))

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Repo = require('./AuthFuncionarioRepository')
const AuthService = require('./AuthFuncionarioService')

const funcionario = (nivel = 10) => ({
  id_funcionario: 7, nome_completo: 'Ana', email: 'ana@x.com', senha: 'hash', id_cargo: 2, nivel_acesso: nivel,
})

beforeEach(() => jest.resetAllMocks())

describe('AuthService.login', () => {
  it('rejeita email/senha ausentes com 400', async () => {
    await expect(AuthService.login(undefined, 'x')).rejects.toMatchObject({ statusCode: 400 })
    await expect(AuthService.login('a@a.com', '')).rejects.toMatchObject({ statusCode: 400 })
  })

  it('retorna 401 para email inexistente', async () => {
    Repo.findByEmail.mockResolvedValue(undefined)
    await expect(AuthService.login('a@a.com', 'x')).rejects.toMatchObject({ statusCode: 401, message: 'Credenciais inválidas' })
  })

  it('retorna 401 para senha errada (mesma mensagem)', async () => {
    Repo.findByEmail.mockResolvedValue(funcionario())
    bcrypt.compare.mockResolvedValue(false)
    await expect(AuthService.login('a@a.com', 'x')).rejects.toMatchObject({ statusCode: 401, message: 'Credenciais inválidas' })
  })

  it('gera tokens com o id correto, papel funcionario e salva o refresh por ~7 dias', async () => {
    Repo.findByEmail.mockResolvedValue(funcionario(10))
    bcrypt.compare.mockResolvedValue(true)

    const r = await AuthService.login('  ANA@x.com ', 'senha123')

    expect(Repo.findByEmail).toHaveBeenCalledWith('ana@x.com')
    const payload = jwt.verify(r.accessToken, process.env.JWT_SECRET)
    expect(payload).toMatchObject({ id: 7, papel: 'funcionario' })
    expect(r.funcionario).toMatchObject({ id: 7, nome: 'Ana', papel: 'funcionario' })

    const [id, token, expira] = Repo.salvarRefresh.mock.calls[0]
    expect(id).toBe(7)
    expect(token).toBe(r.refreshToken)
    const dias = (expira - Date.now()) / 86400000
    expect(dias).toBeGreaterThan(6.9)
    expect(dias).toBeLessThan(7.1)
  })

  it('cargo com nivel_acesso >= 100 vira admin', async () => {
    Repo.findByEmail.mockResolvedValue(funcionario(100))
    bcrypt.compare.mockResolvedValue(true)
    const r = await AuthService.login('a@a.com', 'x')
    expect(jwt.verify(r.accessToken, process.env.JWT_SECRET).papel).toBe('admin')
  })
})

describe('AuthService.renovarToken', () => {
  it('rejeita token malformado com 401', async () => {
    await expect(AuthService.renovarToken('lixo')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejeita token que não está no banco (ou expirado) com 401', async () => {
    Repo.findByEmail.mockResolvedValue(funcionario())
    bcrypt.compare.mockResolvedValue(true)
    const { refreshToken } = await AuthService.login('a@a.com', 'x')
    Repo.buscarRefreshToken.mockResolvedValue(undefined)
    await expect(AuthService.renovarToken(refreshToken)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rotaciona: remove o antigo e devolve novos tokens', async () => {
    Repo.findByEmail.mockResolvedValue(funcionario())
    bcrypt.compare.mockResolvedValue(true)
    const { refreshToken } = await AuthService.login('a@a.com', 'x')

    Repo.buscarRefreshToken.mockResolvedValue({ token: refreshToken })
    Repo.findById.mockResolvedValue(funcionario())

    const novo = await AuthService.renovarToken(refreshToken)

    expect(Repo.removerRefreshToken).toHaveBeenCalledWith(refreshToken)
    expect(novo.accessToken).toBeDefined()
    expect(novo.refreshToken).not.toBe(refreshToken)
  })
})

describe('AuthService.logout', () => {
  it('exige o refresh token', async () => {
    await expect(AuthService.logout(undefined)).rejects.toMatchObject({ statusCode: 400 })
  })
  it('remove o token', async () => {
    await AuthService.logout('abc')
    expect(Repo.removerRefreshToken).toHaveBeenCalledWith('abc')
  })
})
