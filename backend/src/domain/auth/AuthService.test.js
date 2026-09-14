/**
 * Testes unitários para AuthService.
 *
 * ATENÇÃO — bugs encontrados no arquivo original (AuthService.js) que afetam estes testes:
 *
 * 1. O arquivo nunca faz `require('jsonwebtoken')`, mas usa `jwt.sign` / `jwt.verify`.
 *    Sem isso, TODA chamada a gerarAcessToken/gerarRefreshToken/login/renovarToken
 *    lança "ReferenceError: jwt is not defined" em produção.
 *    Aqui a variável `jwt` é "shimada" como global só para conseguirmos testar a
 *    lógica de negócio — isso NÃO conserta o bug real, só permite validar o resto
 *    do fluxo. Corrija adicionando `const jwt = require('jsonwebtoken');` no topo
 *    do serviço.
 *
 * 2. Em `login()`, o accessToken é gerado com `this.gerarRefreshToken(funcionario)`
 *    em vez de `this.gerarAcessToken(funcionario)` — provavelmente um erro de
 *    copiar/colar. O teste de login abaixo documenta esse comportamento atual.
 *
 * 3. Em `renovarToken()`, a linha
 *      const funcionario = { id: funcionario.id, role: funcionario.id_cargo }
 *    referencia `funcionario` antes dele existir (TDZ), o que sempre lança
 *    "ReferenceError: Cannot access 'funcionario' before initialization".
 *    O teste marcado como "[bug conhecido]" documenta esse comportamento.
 */

// Adicione no topo do arquivo de teste
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  execute: jest.fn(),
}));

jest.mock('jsonwebtoken');
jest.mock('./AuthFuncionarioRepository');

const jwt = require('jsonwebtoken');
// Shim necessário por conta do bug #1 acima.
global.jwt = jwt;

const AuthRepository = require('./AuthFuncionarioRepository');
const AuthService = require('./AuthFuncionarioService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'access-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  describe('gerarAcessToken', () => {
    it('deve chamar jwt.sign com o payload, secret e expiração corretos', () => {
      jwt.sign.mockReturnValue('access-token-fake');
      const user = { id: 1, role: 'ADMIN' };

      const token = AuthService.gerarAcessToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
      );
      expect(token).toBe('access-token-fake');
    });
  });

  describe('gerarRefreshToken', () => {
    it('deve chamar jwt.sign com o payload, secret, expiração e algoritmo ES256', () => {
      jwt.sign.mockReturnValue('refresh-token-fake');
      const user = { id: 1 };

      const token = AuthService.gerarRefreshToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN, algorithm: 'ES256' },
      );
      expect(token).toBe('refresh-token-fake');
    });
  });

  describe('login', () => {
    it('deve lançar erro quando o funcionário não é encontrado', async () => {
      AuthRepository.findByEmail.mockResolvedValue(null);

      await expect(
        AuthService.login('naoexiste@email.com', '123456'),
      ).rejects.toThrow('Credenciais inválidas');
      expect(AuthRepository.findByEmail).toHaveBeenCalledWith('naoexiste@email.com');
    });

    it('deve gerar tokens, salvar o refresh token e retornar os dados do funcionário', async () => {
      const funcionario = {
        id: 10,
        nome: 'João',
        email: 'joao@email.com',
        id_cargo: 2,
      };
      AuthRepository.findByEmail.mockResolvedValue(funcionario);
      AuthRepository.salvarRefresh.mockResolvedValue();
      jwt.sign.mockReturnValue('token-fake');

      const resultado = await AuthService.login('joao@email.com', '123456');

      expect(resultado).toEqual({
        funcionario: {
          id: funcionario.id,
          nome: funcionario.nome,
          email: funcionario.email,
          role: funcionario.id_cargo,
        },
        acessToken: 'token-fake',
        refreshToken: 'token-fake',
      });

      // BUG #2: como login() usa gerarRefreshToken() duas vezes, jwt.sign é chamado
      // duas vezes com o secret/algoritmo de REFRESH — nunca com JWT_SECRET.
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        { id: funcionario.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN, algorithm: 'ES256' },
      );

      expect(AuthRepository.salvarRefresh).toHaveBeenCalledWith(
        funcionario.id,
        'token-fake',
        expect.any(Date),
      );
    });

    it('deve salvar o refresh token com validade de aproximadamente 7 dias', async () => {
      const funcionario = { id: 1, nome: 'Ana', email: 'ana@email.com', id_cargo: 1 };
      AuthRepository.findByEmail.mockResolvedValue(funcionario);
      AuthRepository.salvarRefresh.mockResolvedValue();
      jwt.sign.mockReturnValue('token-fake');

      const antes = Date.now();
      await AuthService.login('ana@email.com', 'senha');

      const [, , expiraEm] = AuthRepository.salvarRefresh.mock.calls[0];
      const diffDias = (expiraEm.getTime() - antes) / (1000 * 60 * 60 * 24);

      expect(diffDias).toBeGreaterThan(6.9);
      expect(diffDias).toBeLessThan(7.1);
    });
  });

  describe('renovarToken', () => {
    it('deve lançar erro quando o refresh token não está cadastrado', async () => {
      AuthRepository.buscarRefreshToken.mockResolvedValue(null);

      await expect(AuthService.renovarToken('token-invalido')).rejects.toThrow(
        'Refresh token expirado',
      );
    });

    // BUG #3: mesmo com um registro válido, o método sempre lança um ReferenceError
    // porque `funcionario` é referenciado antes de ser inicializado. Este teste
    // documenta o comportamento atual; remova-o quando o bug for corrigido.
    it('[bug conhecido] lança erro mesmo com um registro de refresh token válido', async () => {
      AuthRepository.buscarRefreshToken.mockResolvedValue({ token: 'token-valido' });
      jwt.verify.mockReturnValue({ id: 1, id_cargo: 2 });

      await expect(AuthService.renovarToken('token-valido')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('deve remover o refresh token informado', async () => {
      AuthRepository.removerRefreshToken.mockResolvedValue();

      await AuthService.logout('algum-refresh-token');

      expect(AuthRepository.removerRefreshToken).toHaveBeenCalledWith('algum-refresh-token');
    });
  });
});
