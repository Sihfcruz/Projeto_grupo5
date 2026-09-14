// Adicione no topo do arquivo de teste
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  execute: jest.fn(),
}));

jest.mock('./EstoqueRepository');

const EstoqueRepository = require('./EstoqueRepository');
const EstoqueService = require('./EstoqueService');

describe('EstoqueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarEstoque', () => {
    it('deve lançar AppError 404 quando o repositório não retorna dados (null)', async () => {
      EstoqueRepository.listarTodos.mockResolvedValue(null);

      await expect(EstoqueService.listarEstoque()).rejects.toMatchObject({
        message: 'Nenhum produto encontrado',
        statusCode: 404,
      });
    });

    it('deve lançar AppError 404 quando o repositório retorna undefined', async () => {
      EstoqueRepository.listarTodos.mockResolvedValue(undefined);

      await expect(EstoqueService.listarEstoque()).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('deve retornar sucesso, dados e total quando existem itens no estoque', async () => {
      const estoqueFake = [{ id: 1 }, { id: 2 }, { id: 3 }];
      EstoqueRepository.listarTodos.mockResolvedValue(estoqueFake);

      const resultado = await EstoqueService.listarEstoque();

      expect(resultado).toEqual({
        sucesso: true,
        dados: estoqueFake,
        total: 3,
      });
    });

    it('deve retornar total 0 quando o estoque é um array vazio (é "truthy", não cai no 404)', async () => {
      EstoqueRepository.listarTodos.mockResolvedValue([]);

      const resultado = await EstoqueService.listarEstoque();

      expect(resultado).toEqual({
        sucesso: true,
        dados: [],
        total: 0,
      });
    });
  });
});
