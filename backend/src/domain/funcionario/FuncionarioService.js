const FuncionarioRepository = require('./FuncionariosRepository');
const bcrypt = require("bcrypt");
const AppError = require("../../shared/errors/AppError");

const { dataISO, texto } = require('../../shared/lib/validators');
const { traduzirErroBanco } = require('../../shared/lib/crud');

function validarNascimento(valor) {
  try { dataISO('dataNascimento')(valor); } catch { throw new AppError('Data de nascimento inválida', 400); }
  const hoje = new Date();
  const limite = new Date(hoje.getFullYear() - 14, hoje.getMonth(), hoje.getDate());
  const nascimento = new Date(valor + 'T00:00:00');
  if (nascimento > limite) throw new AppError('O funcionario deve ter no mínimo 14 anos de idade', 422);
  return valor;
}

function validarSenha(senha) {
  if (typeof senha !== 'string' || senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
    throw new AppError('A senha deve ter no mínimo 8 caracteres e no máximo 72 bytes', 400);
  }
  return senha;
}

class FuncionarioService {
  #EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  #SALT_ROUNDS = 10;

  async listarFuncionarios() {
    const funcionarios = await FuncionarioRepository.buscarTodosFuncionarios();

    const dadosSanitizados = (funcionarios || []).map(
      ({ senha, ...resto }) => resto,
    );

    return {
      sucesso: true,
      dados: dadosSanitizados,
      total: dadosSanitizados.length,
    };
  }

  async buscarFuncionarioPorId(id) {
    const idNumerico = Number(id);
    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
      throw new AppError("ID inválido", 400);
    }

    const funcionario =
      await FuncionarioRepository.buscarFuncionarioUnico(idNumerico);

    if (!funcionario || !funcionario.ativo) {
      throw new AppError("Funcionario não encontrado", 404);
    }

    const { senha, ...funcionarioSanitizado } = funcionario;

    return {
      sucesso: true,
      dados: funcionarioSanitizado,
    };
  }

  async cadastrarFuncionario(dados) {
    const { nome, dataNascimento, senha, email, idCargo } = dados || {};

    if (
      (typeof nome !== "string" || !nome.trim()) ||
      !dataNascimento ||
      (typeof senha !== "string" || !senha) ||
      (typeof email !== "string" || !email.trim()) ||
      !idCargo
    ) {
      throw new AppError(
        "Nome, data de nascimento, senha, email, id do cargo são obrigatórios",
        400,
      );
    }

    const emailFormatado = email.trim().toLowerCase();

    if (!this.#EMAIL_REGEX.test(emailFormatado)) {
      throw new AppError("Formato de e-mail inválido", 400);
    }

    validarNascimento(dataNascimento);
    validarSenha(senha);
    texto("nome", { max: 100 })(nome);
    texto("email", { max: 150 })(email);

    if (!Number.isInteger(Number(idCargo)) || Number(idCargo) <= 0) {
      throw new AppError("ID de cargo inválido", 400);
    }
    const cargoExistente =
      await FuncionarioRepository.buscarCargoPorId(Number(idCargo));
    if (!cargoExistente) throw new AppError("Cargo informado não existe", 404);

    const emailEmUso = await FuncionarioRepository.buscarPorEmail(emailFormatado);
    if (emailEmUso) throw new AppError("E-mail já está em uso", 409);

    const senhaHash = await bcrypt.hash(senha, this.#SALT_ROUNDS);

    const novoFuncionario = {
      nome: nome.trim(),
      dataNascimento: dataNascimento,
      senha: senhaHash,
      email: emailFormatado,
      idCargo: Number(idCargo),
      ativo: true,
    };

    let resultado;
    try { resultado = await FuncionarioRepository.cadastrarFuncionario(novoFuncionario); }
    catch (error) { throw traduzirErroBanco(error, "Funcionário"); }

    return {
      sucesso: true,
      mensagem: "Funcionário cadastrado com sucesso!",
      id: resultado?.id || resultado?.insertId || resultado,
    };
  }

  async atualizarFuncionario(id, dados) {
    const idNumerico = Number(id);
    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
      throw new AppError("Id inválido", 400);
    }

    const funcionarioExistente =
      await FuncionarioRepository.buscarFuncionarioUnico(idNumerico);

    if (!funcionarioExistente || !funcionarioExistente.ativo) {
      throw new AppError("Funcionario não encontrado ou inativo", 404);
    }

    const payloadAtualizacao = {};
    const { nome, dataNascimento, senha, email, idCargo } = dados || {};

    if (nome !== undefined) payloadAtualizacao.nome = texto("nome", { max: 100 })(nome);
    if (dataNascimento !== undefined) payloadAtualizacao.dataNascimento = validarNascimento(dataNascimento);
    if (email !== undefined) {
      const emailFormatted = texto("email", { max: 150 })(email).toLowerCase();
      if (!this.#EMAIL_REGEX.test(emailFormatted)) {
        throw new AppError("Formato de e-mail inválido", 400);
      }

      if (emailFormatted !== funcionarioExistente.email) {
        const emailEmUso =
          await FuncionarioRepository.buscarPorEmail(emailFormatted);
        if (emailEmUso) throw new AppError("Novo e-mail já está em uso", 409);
      }
      payloadAtualizacao.email = emailFormatted;
    }
    if (senha !== undefined) {
      validarSenha(senha);
      payloadAtualizacao.senha = await bcrypt.hash(
        senha,
        this.#SALT_ROUNDS,
      );
    }

    if (idCargo !== undefined) {
      const idCargoNum = Number(idCargo);
      if (!Number.isInteger(idCargoNum) || idCargoNum <= 0)
        throw new AppError("ID de cargo deve ser um número", 400);

      const cargoExistente =
        await FuncionarioRepository.buscarCargoPorId(idCargoNum);
      if (!cargoExistente)
        throw new AppError("Cargo informado não existe", 404);

      payloadAtualizacao.idCargo = idCargoNum;
    }

    if (Object.keys(payloadAtualizacao).length === 0) {
      throw new AppError("Nenhum dado válido enviado para atualização", 400);
    }

    try { await FuncionarioRepository.atualizarFuncionario(idNumerico, payloadAtualizacao); }
    catch (error) { throw traduzirErroBanco(error, "Funcionário"); }

    return {
      sucesso: true,
      mensagem: "Funcionario atualizado com sucesso",
    };
  }

  async deletarFuncionario(id) {
    const idNumerico = Number(id);
    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
      throw new AppError("ID inválido", 400);
    }

    const now = new Date()

    const funcionarioExistente =
      await FuncionarioRepository.buscarFuncionarioUnico(idNumerico);
    if (!funcionarioExistente || !funcionarioExistente.ativo) {
      throw new AppError("Funcionário não encontrado ou inativo", 404);
    }

    await FuncionarioRepository.softDeleteFuncionario(idNumerico, now);

    return {
      sucesso: true,
      mensagem: "Funcionario desativado com sucesso",
    };
  }

  async deletarFuncionarioPermanentemente(id) {
    const idNumerico = Number(id);
    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
      throw new AppError("ID inválido", 400);
    }

    const funcionarioExistente =
      await FuncionarioRepository.buscarFuncionarioPorIdIncluindoInativos(idNumerico);
    if (!funcionarioExistente) {
      throw new AppError("Funcionário não encontrado", 404);
    }

    try {
      await FuncionarioRepository.excluirPermanentemente(idNumerico);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new AppError(
          "Funcionário possui vendas/entradas registradas e não pode ser excluído permanentemente. Use a desativação.",
          409,
        );
      }
      throw error;
    }

    return {
      sucesso: true,
      mensagem: "Funcionario excluído permanentemente",
    };
  }
}

module.exports = new FuncionarioService();
