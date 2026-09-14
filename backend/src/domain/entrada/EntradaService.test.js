// Adicione no topo do arquivo de teste
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  execute: jest.fn(),
}));

jest.mock('./EntradasRepository');
jest.mock('../produto/ProdutoRepository');

const EntradasRepository = require('./EntradasRepository');
const ProdutoRepository = require('../produto/ProdutoRepository');
const EntradaService = require('./EntradaService');

const dadosValidos = () => ({
  idCadastro: 1,
  codigoProduto: 10,
  quantidade: 5,
  pesoTotal: 2.5,
  dataEntrada: new Date().toISOString(),
  dataValidade: null,
  lote: 'LOTE-001',
  etiqueta: 'ETQ-001',
  valor: 99.9,
});

describe('EntradaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarEntradas', () => {
    it('deve lançar AppError 404 quando o repositório não retorna dados', async () => {
      EntradasRepository.buscarTodasEntradas.mockResolvedValue(null);

      await expect(EntradaService.listarEntradas()).rejects.toMatchObject({
        message: 'Nenhum produto encontrado',
        statusCode: 404,
      });
    });

    it('deve retornar sucesso, dados e total quando existem entradas', async () => {
      const entradasFake = [{ id: 1 }, { id: 2 }];
      EntradasRepository.buscarTodasEntradas.mockResolvedValue(entradasFake);

      const resultado = await EntradaService.listarEntradas();

      expect(resultado).toEqual({
        sucesso: true,
        dados: entradasFake,
        total: 2,
      });
    });
  });

  describe('listarEntradaPorId', () => {
    it('deve lançar erro quando o id é inválido', async () => {
      await expect(EntradaService.listarEntradaPorId('abc')).rejects.toThrow('Id inválido');
    });

    it('deve lançar AppError 404 quando a entrada não é encontrada', async () => {
      EntradasRepository.buscarEntradaPorId.mockResolvedValue(null);

      await expect(EntradaService.listarEntradaPorId(1)).rejects.toMatchObject({
        message: 'Nenhum produto encontrado',
        statusCode: 404,
      });
    });

    it('deve retornar a entrada quando encontrada', async () => {
      const entradaFake = { id: 1, lote: 'LOTE-001' };
      EntradasRepository.buscarEntradaPorId.mockResolvedValue(entradaFake);

      const resultado = await EntradaService.listarEntradaPorId(1);

      expect(resultado).toEqual({ sucesso: true, dados: entradaFake });
    });
  });

  describe('criarEntrada', () => {
    it.each([
      'idCadastro',
      'codigoProduto',
      'quantidade',
      'pesoTotal',
      'dataEntrada',
      'lote',
      'etiqueta',
      'valor',
    ])('deve lançar erro quando o campo obrigatório "%s" não é informado', async (campo) => {
      const dados = dadosValidos();
      delete dados[campo];

      await expect(EntradaService.criarEntrada(dados)).rejects.toThrow(
        `O campo '${campo}' é obrigatório e deve ser preenchido.`,
      );
    });

    it('deve lançar erro quando lote ou etiqueta não são strings', async () => {
      const dados = { ...dadosValidos(), lote: 123 };

      await expect(EntradaService.criarEntrada(dados)).rejects.toThrow(
        "Os campos 'lote' e 'etiqueta' devem ser do tipo texto.",
      );
    });

    it('deve lançar erro quando um campo numérico não é um número válido maior que zero', async () => {
      const dados = { ...dadosValidos(), pesoTotal: -1 };

      await expect(EntradaService.criarEntrada(dados)).rejects.toThrow(
        "O campo 'pesoTotal' deve ser um número válido e maior que zero.",
      );
    });

    it('deve lançar erro quando a data de entrada é inválida', async () => {
      const dados = { ...dadosValidos(), dataEntrada: 'data-invalida' };

      await expect(EntradaService.criarEntrada(dados)).rejects.toThrow(
        'A data de entrada deve ser preenchida',
      );
    });

    it('deve lançar erro quando o produto não existe', async () => {
      const dados = dadosValidos();
      ProdutoRepository.findById.mockResolvedValue(null);

      await expect(EntradaService.criarEntrada(dados)).rejects.toThrow(
        `Produto com o código ${dados.codigoProduto} não foi encontrado.`,
      );
    });

    it('deve cadastrar a entrada quando todos os dados são válidos', async () => {
      const dados = dadosValidos();
      ProdutoRepository.findById.mockResolvedValue({ id: dados.codigoProduto });
      EntradasRepository.create.mockResolvedValue({ id: 1, ...dados });

      const resultado = await EntradaService.criarEntrada(dados);

      expect(ProdutoRepository.findById).toHaveBeenCalledWith(dados.codigoProduto);
      expect(EntradasRepository.create).toHaveBeenCalledTimes(1);

      // Observação (não é bug bloqueante, mas vale confirmar a intenção):
      // o serviço sempre grava a data ATUAL do servidor em dataEntrada,
      // ignorando o valor recebido em `dados.dataEntrada` (ver EntradaService.js).
      const entradaEnviada = EntradasRepository.create.mock.calls[0][0];
      expect(entradaEnviada.dataEntrada).toBe(new Date().toISOString().split('T')[0]);

      expect(resultado).toEqual({
        sucesso: true,
        mensagem: 'Entrada cadastrada com sucesso!',
        dados: { id: 1, ...dados },
      });
    });
  });
});
