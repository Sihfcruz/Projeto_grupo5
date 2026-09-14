// src/domain/funcionario/FuncionarioService.test.js

jest.mock('../../config/database', () => ({
  query: jest.fn(),
  execute: jest.fn(),
}));

// Mocka o repositório e todos os seus métodos utilizados no Service
jest.mock('./FuncionariosRepository', () => ({
  buscarTodosFuncionarios: jest.fn(),
  buscarFuncionarioUnico: jest.fn(),
  cadastrarFuncionario: jest.fn(),
  buscarPorEmail: jest.fn(),
  buscarCargoPorId: jest.fn(),
  atualizarFuncionario: jest.fn(),
  softDeleteFuncionario: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const FuncionarioRepository = require('./FuncionariosRepository');
const bcrypt = require('bcrypt');
const FuncionarioService = require('./FuncionarioService');

const dadosValidos = () => ({
  nome: 'Maria Silva',
  dataNascimento: new Date(
    new Date().setFullYear(new Date().getFullYear() - 25),
  ).toISOString(),
  senha: 'senha123',
  email: 'Maria@Email.com',
  idCargo: 1,
});

describe('FuncionarioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarFuncionarios', () => {
    it('deve remover o campo senha de cada funcionário retornado', async () => {
      FuncionarioRepository.buscarTodosFuncionarios.mockResolvedValue([
        { id: 1, nome: 'Ana', senha: 'hash-secreto' },
        { id: 2, nome: 'Bruno', senha: 'outro-hash' },
      ]);

      const resultado = await FuncionarioService.listarFuncionarios();

      expect(resultado).toEqual({
        sucesso: true,
        dados: [
          { id: 1, nome: 'Ana' },
          { id: 2, nome: 'Bruno' },
        ],
        total: 2,
      });
    });

    it('deve retornar lista vazia quando o repositório não retorna dados', async () => {
      FuncionarioRepository.buscarTodosFuncionarios.mockResolvedValue(null);

      const resultado = await FuncionarioService.listarFuncionarios();

      expect(resultado).toEqual({ sucesso: true, dados: [], total: 0 });
    });
  });

  describe('buscarFuncionarioPorId', () => {
    it.each([0, 'abc', -1])('deve lançar erro quando o id é inválido (%p)', async (id) => {
      await expect(FuncionarioService.buscarFuncionarioPorId(id)).rejects.toMatchObject({
        message: 'ID inválido',
        statusCode: 400,
      });
    });

    it('deve lançar erro 404 quando o funcionário não é encontrado', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue(null);

      await expect(FuncionarioService.buscarFuncionarioPorId(1)).rejects.toMatchObject({
        message: 'Funcionario não encontrado',
        statusCode: 404,
      });
    });

    it('deve lançar erro 404 quando o funcionário está inativo', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue({
        id: 1,
        ativo: false,
      });

      await expect(FuncionarioService.buscarFuncionarioPorId(1)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('deve retornar o funcionário sem o campo senha quando encontrado e ativo', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue({
        id: 1,
        nome: 'Ana',
        senha: 'hash-secreto',
        ativo: true,
      });

      const resultado = await FuncionarioService.buscarFuncionarioPorId(1);

      expect(resultado).toEqual({
        sucesso: true,
        dados: { id: 1, nome: 'Ana', ativo: true },
      });
    });
  });

  describe('cadastrarFuncionario', () => {
    it.each(['nome', 'dataNascimento', 'senha', 'email', 'idCargo'])(
      'deve lançar erro quando o campo obrigatório "%s" não é informado',
      async (campo) => {
        const dados = dadosValidos();
        delete dados[campo];

        await expect(FuncionarioService.cadastrarFuncionario(dados)).rejects.toMatchObject({
          statusCode: 400,
        });
      },
    );

    it('deve lançar erro quando o e-mail tem formato inválido', async () => {
      const dados = { ...dadosValidos(), email: 'email-invalido' };

      await expect(FuncionarioService.cadastrarFuncionario(dados)).rejects.toThrow(
        'Formato de e-mail inválido',
      );
    });

    it('deve lançar erro quando a data de nascimento é inválida', async () => {
      const dados = { ...dadosValidos(), dataNascimento: 'data-invalida' };

      await expect(FuncionarioService.cadastrarFuncionario(dados)).rejects.toMatchObject({
        message: 'Data de nascimento inválida',
        statusCode: 400,
      });
    });

    it('deve lançar erro quando o funcionário tem menos de 14 anos', async () => {
      const dataNascimento = new Date(
        new Date().setFullYear(new Date().getFullYear() - 10),
      ).toISOString();
      const dados = { ...dadosValidos(), dataNascimento };

      await expect(FuncionarioService.cadastrarFuncionario(dados)).rejects.toMatchObject({
        message: 'O funcionario deve ter no mínimo 14 anos de idade',
        statusCode: 422,
      });
    });

    it('deve formatar e-mail (trim + minúsculas) e gerar hash da senha antes de salvar', async () => {
      bcrypt.hash.mockResolvedValue('senha-hasheada');
      FuncionarioRepository.cadastrarFuncionario.mockResolvedValue({ id: 99 });

      const resultado = await FuncionarioService.cadastrarFuncionario(dadosValidos());

      expect(resultado).toEqual({
        sucesso: true,
        mensagem: 'Funcionário cadastrado com sucesso!',
        id: 99,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('senha123', 10);
      expect(FuncionarioRepository.cadastrarFuncionario).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Maria Silva',
          email: 'maria@email.com',
          cargo: 1,
          senha: 'senha-hasheada',
          ativo: true,
        }),
      );
    });
  });

  describe('atualizarFuncionario', () => {
    it.each([0, 'abc', -1])('deve lançar erro quando o id é inválido (%p)', async (id) => {
      await expect(
        FuncionarioService.atualizarFuncionario(id, { nome: 'Novo Nome' }),
      ).rejects.toMatchObject({ message: 'Id inválido', statusCode: 400 });
    });

    it('deve lançar erro quando o funcionário não existe ou está inativo', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue(null);

      await expect(
        FuncionarioService.atualizarFuncionario(1, { nome: 'Novo Nome' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('deve lançar erro quando nenhum dado válido é enviado', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue({
        id: 1,
        ativo: true,
        email: 'ana@email.com',
      });

      await expect(FuncionarioService.atualizarFuncionario(1, {})).rejects.toMatchObject({
        message: 'Nenhum dado válido enviado para atualização',
        statusCode: 400,
      });
    });

    it('deve lançar erro quando o novo e-mail tem formato inválido', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue({
        id: 1,
        ativo: true,
        email: 'ana@email.com',
      });

      await expect(
        FuncionarioService.atualizarFuncionario(1, { email: 'invalido' }),
      ).rejects.toMatchObject({ message: 'Formato de e-mail inválido', statusCode: 400 });
    });

    it('deve lançar erro quando o novo e-mail já está em uso por outro funcionário', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue({
        id: 1,
        ativo: true,
        email: 'antigo@email.com',
      });
      FuncionarioRepository.buscarPorEmail.mockResolvedValue({ id: 2 });

      await expect(
        FuncionarioService.atualizarFuncionario(1, { email: 'novo@email.com' }),
      ).rejects.toMatchObject({ message: 'Novo e-mail já está em uso', statusCode: 409 });
    });

    it('não deve verificar duplicidade quando o e-mail informado é o mesmo já cadastrado', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue({
        id: 1,
        ativo: true,
        email: 'mesmo@email.com',
      });
      FuncionarioRepository.atualizarFuncionario.mockResolvedValue();

      await FuncionarioService.atualizarFuncionario(1, { email: 'MESMO@Email.com' });

      expect(FuncionarioRepository.buscarPorEmail).not.toHaveBeenCalled();
    });

    it('deve gerar hash ao atualizar a senha', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue({
        id: 1,
        ativo: true,
        email: 'ana@email.com',
      });
      bcrypt.hash.mockResolvedValue('nova-senha-hash');
      FuncionarioRepository.atualizarFuncionario.mockResolvedValue();

      await FuncionarioService.atualizarFuncionario(1, { senha: 'novaSenha123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('novaSenha123', 10);
      expect(FuncionarioRepository.atualizarFuncionario).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ senha: 'nova-senha-hash' }),
      );
    });

    it('deve lançar erro quando idCargo não é um número', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue({
        id: 1,
        ativo: true,
        email: 'ana@email.com',
      });

      await expect(
        FuncionarioService.atualizarFuncionario(1, { idCargo: 'abc' }),
      ).rejects.toMatchObject({ message: 'ID de cargo deve ser um número', statusCode: 400 });
    });

    it('deve lançar erro quando o cargo informado não existe', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue({
        id: 1,
        ativo: true,
        email: 'ana@email.com',
      });
      FuncionarioRepository.buscarCargoPorId.mockResolvedValue(null);

      await expect(
        FuncionarioService.atualizarFuncionario(1, { idCargo: 5 }),
      ).rejects.toMatchObject({ message: 'Cargo informado não existe', statusCode: 404 });
    });

    it('deve atualizar o funcionário quando os dados são válidos', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue({
        id: 1,
        ativo: true,
        email: 'ana@email.com',
      });
      FuncionarioRepository.buscarCargoPorId.mockResolvedValue({ id: 5 });
      FuncionarioRepository.atualizarFuncionario.mockResolvedValue();

      const resultado = await FuncionarioService.atualizarFuncionario(1, {
        nome: 'Ana Paula',
        idCargo: 5,
      });

      expect(FuncionarioRepository.atualizarFuncionario).toHaveBeenCalledWith(1, {
        nome: 'Ana Paula',
        idCargo: 5,
      });
      expect(resultado).toEqual({
        sucesso: true,
        mensagem: 'Funcionario atualizado com sucesso',
      });
    });
  });

  describe('deletarFuncionario', () => {
    it.each([0, 'abc', -1])('deve lançar erro quando o id é inválido (%p)', async (id) => {
      await expect(FuncionarioService.deletarFuncionario(id)).rejects.toMatchObject({
        message: 'ID inválido',
        statusCode: 400,
      });
    });

    it('deve lançar erro quando o funcionário não existe ou já está inativo', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue(null);

      await expect(FuncionarioService.deletarFuncionario(1)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('deve desativar o funcionário com sucesso', async () => {
      FuncionarioRepository.buscarFuncionarioUnico.mockResolvedValue({ id: 1, ativo: true });
      FuncionarioRepository.softDeleteFuncionario.mockResolvedValue();

      const resultado = await FuncionarioService.deletarFuncionario(1);

      expect(FuncionarioRepository.softDeleteFuncionario).toHaveBeenCalledWith(
        1,
        expect.any(Date),
      );
      expect(resultado).toEqual({
        sucesso: true,
        mensagem: 'Funcionario desativado com sucesso',
      });
    });
  });
});