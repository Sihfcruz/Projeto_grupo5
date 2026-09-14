// Adicione no topo do arquivo de teste
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  execute: jest.fn(),
}));

jest.mock('./DevolucaoRepository');

const DevolucaoRepository = require('./DevolucaoRepository');
const DevolucaoService = require('./DevolucaoService');

const dadosValidos = () => ({
  idCadastro: 1,
  codigoProduto: 10,
  unidades: 2,
  motivo: 'Produto com defeito',
  reutilizacao: true,
  valor: 49.9,
  dataEntrada: new Date().toISOString(),
  etiqueta: 'ETQ-001',
});

describe('DevolucaoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarDevolucoes', () => {
    it('deve lançar erro 404 quando o repositório não retorna dados', async () => {
      DevolucaoRepository.buscarTodasDevolucoes.mockResolvedValue(null);

      await expect(DevolucaoService.listarDevolucoes()).rejects.toMatchObject({
        message: 'Nenhuma devolução encontrada',
        statusCode: 404,
      });
    });

    it('deve retornar sucesso e dados quando existem devoluções', async () => {
      const devolucoesFake = [{ id: 1 }, { id: 2 }];
      DevolucaoRepository.buscarTodasDevolucoes.mockResolvedValue(devolucoesFake);

      const resultado = await DevolucaoService.listarDevolucoes();

      expect(resultado).toEqual({ sucesso: true, dados: devolucoesFake });
    });
  });

  describe('listarDevolucaoPorId', () => {
    it.each([undefined, 'abc'])('deve lançar erro quando o id é inválido (%p)', async (id) => {
      await expect(DevolucaoService.listarDevolucaoPorId(id)).rejects.toMatchObject({
        message: 'Id deve ser informado',
        statusCode: 400,
      });
    });

    it('deve lançar erro 404 quando a devolução não é encontrada', async () => {
      DevolucaoRepository.buscarDevolucoesPorId.mockResolvedValue(null);

      await expect(DevolucaoService.listarDevolucaoPorId(1)).rejects.toMatchObject({
        message: 'Nenhuma devolução encontrada',
        statusCode: 404,
      });
    });

    it('deve retornar a devolução quando encontrada', async () => {
      const devolucaoFake = { id: 1, motivo: 'Defeito' };
      DevolucaoRepository.buscarDevolucoesPorId.mockResolvedValue(devolucaoFake);

      const resultado = await DevolucaoService.listarDevolucaoPorId(1);

      expect(resultado).toEqual({ sucesso: true, dados: devolucaoFake });
    });
  });

  describe('criarDevolucao', () => {
    it.each(['codigoProduto', 'unidades', 'motivo', 'valor'])(
      'deve lançar erro quando o campo obrigatório "%s" não é informado',
      async (campo) => {
        const dados = dadosValidos();
        delete dados[campo];

        await expect(DevolucaoService.criarDevolucao(dados)).rejects.toThrow(
          `O campo '${campo}' é obrigatório e deve ser preenchido.`,
        );
      },
    );

    it('não deve considerar "reutilizacao: false" como campo obrigatório ausente', async () => {
      const dados = { ...dadosValidos(), reutilizacao: false };
      DevolucaoRepository.cadastrarDevolucao.mockResolvedValue({ id: 1, ...dados });

      await expect(DevolucaoService.criarDevolucao(dados)).resolves.toMatchObject({
        sucesso: true,
      });
    });

    it('deve lançar erro quando motivo não é uma string', async () => {
      const dados = { ...dadosValidos(), motivo: 123 };

      await expect(DevolucaoService.criarDevolucao(dados)).rejects.toThrow(
        "Os campos 'motivo' e 'etiqueta' devem ser do tipo texto.",
      );
    });

    it('deve lançar erro quando etiqueta é informada mas não é uma string', async () => {
      const dados = { ...dadosValidos(), etiqueta: 123 };

      await expect(DevolucaoService.criarDevolucao(dados)).rejects.toThrow(
        "Os campos 'motivo' e 'etiqueta' devem ser do tipo texto.",
      );
    });

    it('deve lançar erro quando reutilizacao não é booleano', async () => {
      const dados = { ...dadosValidos(), reutilizacao: 'sim' };

      await expect(DevolucaoService.criarDevolucao(dados)).rejects.toThrow(
        "O campo 'reutilizacao' deve ser um valor booleano (true ou false).",
      );
    });

    it.each(['codigoProduto', 'unidades', 'valor'])(
      'deve lançar erro quando o campo numérico "%s" é inválido',
      async (campo) => {
        const dados = { ...dadosValidos(), [campo]: -1 };

        await expect(DevolucaoService.criarDevolucao(dados)).rejects.toThrow(
          `O campo '${campo}' deve ser um número válido e maior que zero.`,
        );
      },
    );

    it('deve lançar erro quando idCadastro é informado mas inválido', async () => {
      const dados = { ...dadosValidos(), idCadastro: -5 };

      await expect(DevolucaoService.criarDevolucao(dados)).rejects.toThrow(
        "O campo 'idCadastro' deve ser um número válido e maior que zero.",
      );
    });

    it('não deve validar idCadastro quando ele não é informado', async () => {
      const dados = dadosValidos();
      delete dados.idCadastro;
      DevolucaoRepository.cadastrarDevolucao.mockResolvedValue({ id: 1, ...dados });

      await expect(DevolucaoService.criarDevolucao(dados)).resolves.toMatchObject({
        sucesso: true,
      });
    });

    it('deve cadastrar a devolução quando todos os dados são válidos', async () => {
      const dados = dadosValidos();
      DevolucaoRepository.cadastrarDevolucao.mockResolvedValue({ id: 1, ...dados });

      const resultado = await DevolucaoService.criarDevolucao(dados);

      expect(DevolucaoRepository.cadastrarDevolucao).toHaveBeenCalledWith(dados);
      expect(resultado).toEqual({
        sucesso: true,
        mensagem: 'Devolução cadastrada',
        dados: { id: 1, ...dados },
      });
    });
  });
});
