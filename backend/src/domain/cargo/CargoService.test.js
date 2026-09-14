// Adicione no topo do arquivo de teste
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  execute: jest.fn(),
}));

jest.mock('./CargoRepository', () => ({
  listar: jest.fn(),
  buscarPorId: jest.fn(),
  buscarPorNome: jest.fn(),
  cadastrar: jest.fn(),
  atualizar: jest.fn(),
  excluir: jest.fn(),
}));

const CargoRepository = require('./CargoRepository');
const CargoService = require('./CargoService');

describe('CargoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listar', () => {
    it('deve retornar a lista de cargos vinda do repositório', async () => {
      const cargosFake = [{ id: 1, nome_cargo: 'Gerente' }];
      CargoRepository.listar.mockResolvedValue(cargosFake);

      const resultado = await CargoService.listar();

      expect(resultado).toBe(cargosFake);
      expect(CargoRepository.listar).toHaveBeenCalledTimes(1);
    });
  });

  describe('buscarPorId', () => {
    it('deve lançar erro quando o cargo não é encontrado', async () => {
      CargoRepository.buscarPorId.mockResolvedValue(null);

      await expect(CargoService.buscarPorId(99)).rejects.toThrow('Cargo não encontrado.');
    });

    it('deve retornar o cargo quando encontrado', async () => {
      const cargoFake = { id: 1, nome_cargo: 'Analista' };
      CargoRepository.buscarPorId.mockResolvedValue(cargoFake);

      const resultado = await CargoService.buscarPorId(1);

      expect(resultado).toBe(cargoFake);
    });
  });

  describe('cadastrar', () => {
    it('deve lançar erro quando nome_cargo não é informado', async () => {
      await expect(CargoService.cadastrar({ nivel_acesso: 1 })).rejects.toThrow(
        'O nome do cargo é obrigatório.',
      );
    });

    it('deve lançar erro quando nivel_acesso não é informado', async () => {
      await expect(CargoService.cadastrar({ nome_cargo: 'Analista' })).rejects.toThrow(
        'O nível de acesso é obrigatório.',
      );
    });

    it('deve lançar erro quando nivel_acesso é negativo', async () => {
      await expect(
        CargoService.cadastrar({ nome_cargo: 'Analista', nivel_acesso: -1 }),
      ).rejects.toThrow('O nível de acesso não pode ser negativo.');
    });

    it('deve lançar erro quando o cargo já existe', async () => {
      CargoRepository.buscarPorNome.mockResolvedValue({ id: 1, nome_cargo: 'Analista' });

      await expect(
        CargoService.cadastrar({ nome_cargo: 'Analista', nivel_acesso: 2 }),
      ).rejects.toThrow('Este cargo já está cadastrado.');
    });

    it('deve cadastrar o cargo quando os dados são válidos', async () => {
      const dados = { nome_cargo: 'Analista', nivel_acesso: 2 };
      CargoRepository.buscarPorNome.mockResolvedValue(null);
      CargoRepository.cadastrar.mockResolvedValue({ id: 5, ...dados });

      const resultado = await CargoService.cadastrar(dados);

      expect(CargoRepository.buscarPorNome).toHaveBeenCalledWith('Analista');
      expect(CargoRepository.cadastrar).toHaveBeenCalledWith(dados);
      expect(resultado).toEqual({ id: 5, ...dados });
    });

    it('deve permitir nivel_acesso igual a zero', async () => {
      const dados = { nome_cargo: 'Estagiário', nivel_acesso: 0 };
      CargoRepository.buscarPorNome.mockResolvedValue(null);
      CargoRepository.cadastrar.mockResolvedValue({ id: 6, ...dados });

      const resultado = await CargoService.cadastrar(dados);

      expect(resultado).toEqual({ id: 6, ...dados });
    });
  });

  describe('atualizar', () => {
    it('deve lançar erro quando o cargo não é encontrado', async () => {
      CargoRepository.buscarPorId.mockResolvedValue(null);

      await expect(CargoService.atualizar(1, { nome_cargo: 'Novo' })).rejects.toThrow(
        'Cargo não encontrado.',
      );
    });

    it('deve lançar erro quando nenhum dado é informado', async () => {
      CargoRepository.buscarPorId.mockResolvedValue({ id: 1 });

      await expect(CargoService.atualizar(1, {})).rejects.toThrow(
        'Nenhum dado foi informado para atualização.',
      );
    });

    it('deve atualizar o cargo quando os dados são válidos', async () => {
      CargoRepository.buscarPorId.mockResolvedValue({ id: 1, nome_cargo: 'Antigo' });
      CargoRepository.atualizar.mockResolvedValue({ id: 1, nome_cargo: 'Novo' });

      const resultado = await CargoService.atualizar(1, { nome_cargo: 'Novo' });

      expect(CargoRepository.atualizar).toHaveBeenCalledWith(1, { nome_cargo: 'Novo' });
      expect(resultado).toEqual({ id: 1, nome_cargo: 'Novo' });
    });
  });

  describe('excluir', () => {
    it('deve lançar erro quando o cargo não é encontrado', async () => {
      CargoRepository.buscarPorId.mockResolvedValue(null);

      await expect(CargoService.excluir(1)).rejects.toThrow('Cargo não encontrado.');
    });

    it('deve excluir o cargo e retornar true', async () => {
      CargoRepository.buscarPorId.mockResolvedValue({ id: 1 });
      CargoRepository.excluir.mockResolvedValue();

      const resultado = await CargoService.excluir(1);

      expect(CargoRepository.excluir).toHaveBeenCalledWith(1);
      expect(resultado).toBe(true);
    });
  });
});
