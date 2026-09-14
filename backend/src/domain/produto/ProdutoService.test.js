// Adicione no topo do arquivo de teste
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  execute: jest.fn(),
}));

jest.mock('./ProdutoRepository');

const ProdutoRepository = require('./ProdutoRepository');
const ProdutoService = require('./ProdutoService');

const dadosValidos = () => ({
  nome_produto: 'Caneta Azul',
  descricao: 'Caneta esferográfica azul',
  fornecedor: 'Fornecedor XYZ',
  quantidade: 100,
  etiqueta: 'ETQ-001',
  lote: 'LOTE-001',
  data_entrada: new Date().toISOString(),
  data_validade: null,
  valor: 2.5,
  peso: 0.01,
  fk_funcionario_cargo_id: 1,
});

describe('ProdutoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarAtivos', () => {
    it('deve retornar diretamente o que o repositório retorna', async () => {
      const produtosFake = [{ id: 1, ativo: true }];
      ProdutoRepository.findAtivos.mockResolvedValue(produtosFake);

      const resultado = await ProdutoService.listarAtivos();

      expect(resultado).toBe(produtosFake);
    });
  });

  describe('listarDesativados', () => {
    it('deve retornar diretamente o que o repositório retorna', async () => {
      const produtosFake = [{ id: 2, ativo: false }];
      ProdutoRepository.findDesativados.mockResolvedValue(produtosFake);

      const resultado = await ProdutoService.listarDesativados();

      expect(resultado).toBe(produtosFake);
    });
  });

  describe('buscarProdutoPorId', () => {
    it.each([undefined, 'abc'])('deve lançar erro quando o id é inválido (%p)', async (id) => {
      await expect(ProdutoService.buscarProdutoPorId(id)).rejects.toEqual({
        status: 400,
        mensagem: 'ID inválido.',
      });
    });

    it('deve lançar erro quando o produto não é encontrado', async () => {
      ProdutoRepository.findById.mockResolvedValue(null);

      await expect(ProdutoService.buscarProdutoPorId(1)).rejects.toEqual({
        status: 404,
        mensagem: 'Produto não encontrado.',
      });
    });

    it('deve retornar o produto quando encontrado', async () => {
      const produtoFake = { id: 1, nome_produto: 'Caneta Azul' };
      ProdutoRepository.findById.mockResolvedValue(produtoFake);

      const resultado = await ProdutoService.buscarProdutoPorId(1);

      expect(resultado).toEqual({ sucesso: true, dados: produtoFake });
    });
  });

  describe('cadastrarProduto', () => {
    it.each([
      'nome_produto',
      'etiqueta',
      'lote',
      'data_entrada',
      'fk_funcionario_cargo_id',
    ])('deve lançar erro quando o campo obrigatório "%s" não é informado', async (campo) => {
      const dados = dadosValidos();
      delete dados[campo];

      await expect(ProdutoService.cadastrarProduto(dados)).rejects.toEqual({
        status: 400,
        mensagem: 'Preencha todos os campos obrigatórios.',
      });
    });

    it('deve permitir quantidade igual a zero', async () => {
      const dados = { ...dadosValidos(), quantidade: 0 };
      ProdutoRepository.create.mockResolvedValue(1);

      await expect(ProdutoService.cadastrarProduto(dados)).resolves.toMatchObject({
        sucesso: true,
      });
    });

    it('deve lançar erro quando quantidade é negativa', async () => {
      const dados = { ...dadosValidos(), quantidade: -1 };

      await expect(ProdutoService.cadastrarProduto(dados)).rejects.toEqual({
        status: 400,
        mensagem: 'Quantidade deve ser maior ou igual a zero.',
      });
    });

    it('deve lançar erro quando valor não é maior que zero', async () => {
      const dados = { ...dadosValidos(), valor: 0 };

      await expect(ProdutoService.cadastrarProduto(dados)).rejects.toEqual({
        status: 400,
        mensagem: 'Valor deve ser maior que zero.',
      });
    });

    it('deve lançar erro quando peso não é maior que zero', async () => {
      const dados = { ...dadosValidos(), peso: 0 };

      await expect(ProdutoService.cadastrarProduto(dados)).rejects.toEqual({
        status: 400,
        mensagem: 'Peso deve ser maior que zero.',
      });
    });

    it('deve definir ativo como true quando não informado', async () => {
      const dados = dadosValidos();
      delete dados.ativo;
      ProdutoRepository.create.mockResolvedValue(1);

      await ProdutoService.cadastrarProduto(dados);

      expect(ProdutoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: true }),
      );
    });

    it('deve converter ativo em string ("false") para booleano', async () => {
      const dados = { ...dadosValidos(), ativo: 'false' };
      ProdutoRepository.create.mockResolvedValue(1);

      await ProdutoService.cadastrarProduto(dados);

      expect(ProdutoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: false }),
      );
    });

    it('deve cadastrar o produto quando os dados são válidos', async () => {
      const dados = dadosValidos();
      ProdutoRepository.create.mockResolvedValue(42);

      const resultado = await ProdutoService.cadastrarProduto(dados);

      expect(ProdutoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome_produto: 'Caneta Azul',
          quantidade: 100,
          etiqueta: 'ETQ-001',
          lote: 'LOTE-001',
          valor: 2.5,
          peso: 0.01,
          fk_funcionario_cargo_id: 1,
          ativo: true,
        }),
      );
      expect(resultado).toEqual({
        sucesso: true,
        mensagem: 'Produto cadastrado com sucesso.',
        id: 42,
      });
    });
  });

  describe('atualizarProduto', () => {
    it.each([undefined, 'abc'])('deve lançar erro quando o id é inválido (%p)', async (id) => {
      await expect(ProdutoService.atualizarProduto(id, { nome_produto: 'X' })).rejects.toEqual({
        status: 400,
        mensagem: 'ID inválido.',
      });
    });

    it('deve lançar erro quando o produto não é encontrado', async () => {
      ProdutoRepository.findById.mockResolvedValue(null);

      await expect(ProdutoService.atualizarProduto(1, { nome_produto: 'X' })).rejects.toEqual({
        status: 404,
        mensagem: 'Produto não encontrado.',
      });
    });

    it('deve lançar erro quando nenhum dado é enviado para atualização', async () => {
      ProdutoRepository.findById.mockResolvedValue({ id: 1 });

      await expect(ProdutoService.atualizarProduto(1, {})).rejects.toEqual({
        status: 400,
        mensagem: 'Nenhum dado enviado para atualização.',
      });
    });

    it('deve lançar erro quando nome_produto é enviado vazio', async () => {
      ProdutoRepository.findById.mockResolvedValue({ id: 1 });

      await expect(
        ProdutoService.atualizarProduto(1, { nome_produto: '   ' }),
      ).rejects.toEqual({ status: 400, mensagem: 'Nome do produto é obrigatório.' });
    });

    it('deve lançar erro quando quantidade é negativa', async () => {
      ProdutoRepository.findById.mockResolvedValue({ id: 1 });

      await expect(
        ProdutoService.atualizarProduto(1, { quantidade: -5 }),
      ).rejects.toEqual({ status: 400, mensagem: 'Quantidade deve ser maior ou igual a zero.' });
    });

    it('deve lançar erro quando valor não é maior que zero', async () => {
      ProdutoRepository.findById.mockResolvedValue({ id: 1 });

      await expect(ProdutoService.atualizarProduto(1, { valor: 0 })).rejects.toEqual({
        status: 400,
        mensagem: 'Valor deve ser maior que zero.',
      });
    });

    it('deve lançar erro quando peso não é maior que zero', async () => {
      ProdutoRepository.findById.mockResolvedValue({ id: 1 });

      await expect(ProdutoService.atualizarProduto(1, { peso: 0 })).rejects.toEqual({
        status: 400,
        mensagem: 'Peso deve ser maior que zero.',
      });
    });

    it('deve lançar erro quando fk_funcionario_cargo_id não é um número', async () => {
      ProdutoRepository.findById.mockResolvedValue({ id: 1 });

      await expect(
        ProdutoService.atualizarProduto(1, { fk_funcionario_cargo_id: 'abc' }),
      ).rejects.toEqual({ status: 400, mensagem: 'Funcionário inválido.' });
    });

    it('deve atualizar apenas os campos informados', async () => {
      ProdutoRepository.findById.mockResolvedValue({ id: 1, nome_produto: 'Antigo' });
      ProdutoRepository.update.mockResolvedValue();

      const resultado = await ProdutoService.atualizarProduto(1, {
        nome_produto: 'Novo Nome',
        valor: 10,
      });

      expect(ProdutoRepository.update).toHaveBeenCalledWith(1, {
        nome_produto: 'Novo Nome',
        valor: 10,
      });
      expect(resultado).toEqual({
        sucesso: true,
        mensagem: 'Produto atualizado com sucesso.',
      });
    });
  });
});
