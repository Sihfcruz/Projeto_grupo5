// Adicione no topo do arquivo de teste
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  execute: jest.fn(),
}));

/**
 * Testes unitários para SaidaService.
 *
 * OBSERVAÇÃO — possível bug no arquivo original (SaidaService.js):
 * Em `listarSaidas()`, o código faz `saidas.length` sem antes checar se
 * `saidas` é null/undefined (diferente de DevolucaoService e EntradaService,
 * que fazem essa checagem). Se o repositório retornar null/undefined, o
 * método lança um TypeError em vez de um erro de negócio tratável. O teste
 * abaixo documenta esse comportamento atual.
 */

jest.mock('./SaidaRepository');
jest.mock('../produto/ProdutoRepository');

const SaidaRepository = require('./SaidaRepository');
const ProdutoRepository = require('../produto/ProdutoRepository');
const SaidaService = require('./SaidaService');

const dadosValidos = () => ({
  idCadastro: 1,
  codigoProduto: 10,
  destinatario: 'Cliente Fulano',
  dataSaida: new Date().toISOString(),
  codigoCliente: 5,
  motivo: 'Venda',
  valor: 150,
  unidades: 3,
  lote: 'LOTE-001',
  etiqueta: 'ETQ-001',
  codigoRastreamento: 123456,
});

describe('SaidaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarSaidas', () => {
    it('deve retornar sucesso, dados e total quando existem saídas', async () => {
      const saidasFake = [{ id: 1 }, { id: 2 }];
      SaidaRepository.buscarTodasSaidas.mockResolvedValue(saidasFake);

      const resultado = await SaidaService.listarSaidas();

      expect(resultado).toEqual({ sucesso: true, dados: saidasFake, total: 2 });
    });

    it('[bug conhecido] lança erro quando o repositório retorna null (sem checagem prévia)', async () => {
      SaidaRepository.buscarTodasSaidas.mockResolvedValue(null);

      await expect(SaidaService.listarSaidas()).rejects.toThrow();
    });
  });

  describe('listarSaidasPorId', () => {
    it.each([undefined, 'abc'])('deve lançar erro quando o id é inválido (%p)', async (id) => {
      await expect(SaidaService.listarSaidasPorId(id)).rejects.toMatchObject({
        message: 'Id inválido',
        statusCode: 400,
      });
    });

    it('deve lançar erro 404 quando a saída não é encontrada', async () => {
      SaidaRepository.buscarSaidaPorId.mockResolvedValue(null);

      await expect(SaidaService.listarSaidasPorId(1)).rejects.toMatchObject({
        message: 'Nenhuma saida encontrada',
        statusCode: 404,
      });
    });

    it('deve retornar a saída quando encontrada', async () => {
      const saidaFake = { id: 1, destinatario: 'Cliente Fulano' };
      SaidaRepository.buscarSaidaPorId.mockResolvedValue(saidaFake);

      const resultado = await SaidaService.listarSaidasPorId(1);

      expect(resultado).toEqual({ sucesso: true, dados: saidaFake });
    });
  });

  describe('criarSaida', () => {
    it.each([
      'idCadastro',
      'codigoProduto',
      'destinatario',
      'dataSaida',
      'codigoCliente',
      'motivo',
      'valor',
      'unidades',
      'lote',
      'etiqueta',
      'codigoRastreamento',
    ])('deve lançar erro quando o campo obrigatório "%s" não é informado', async (campo) => {
      const dados = dadosValidos();
      delete dados[campo];

      await expect(SaidaService.criarSaida(dados)).rejects.toThrow(
        'Todos os campos devem estar preenchidos.',
      );
    });

    it('deve lançar erro quando destinatario ou motivo não são strings', async () => {
      const dados = { ...dadosValidos(), destinatario: 123 };

      await expect(SaidaService.criarSaida(dados)).rejects.toThrow(
        'Os campos destinatario e motivo devem ser textos.',
      );
    });

    it.each(['idCadastro', 'codigoProduto', 'codigoCliente', 'valor', 'unidades', 'codigoRastreamento'])(
      'deve lançar erro quando o campo numérico "%s" é inválido',
      async (campo) => {
        const dados = { ...dadosValidos(), [campo]: -1 };

        await expect(SaidaService.criarSaida(dados)).rejects.toThrow(
          `O campo ${campo} deve ser um número válido e maior que zero.`,
        );
      },
    );

    it('deve lançar erro quando o produto não existe', async () => {
      const dados = dadosValidos();
      ProdutoRepository.findById.mockResolvedValue(null);

      await expect(SaidaService.criarSaida(dados)).rejects.toThrow(
        `Produto com o código ${dados.codigoProduto} não foi encontrado.`,
      );
    });

    it('deve cadastrar a saída quando todos os dados são válidos', async () => {
      const dados = dadosValidos();
      ProdutoRepository.findById.mockResolvedValue({ id: dados.codigoProduto });
      SaidaRepository.cadastrarSaida.mockResolvedValue({ id: 1, ...dados });

      const resultado = await SaidaService.criarSaida(dados);

      expect(ProdutoRepository.findById).toHaveBeenCalledWith(dados.codigoProduto);
      expect(SaidaRepository.cadastrarSaida).toHaveBeenCalledWith(dados);
      expect(resultado).toEqual({
        sucesso: true,
        mensagem: 'Saída cadastrada com sucesso',
        dados: { id: 1, ...dados },
      });
    });
  });
});
