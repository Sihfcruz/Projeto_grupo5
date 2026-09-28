const DevolucaoRepository = require('./DevolucaoRepository');

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

const ehInteiroPositivo = (valor) => Number.isInteger(valor) && valor > 0;
const REGEX_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

class DevolucaoService {
  async listarDevolucoes() {
    const devolucoes = await DevolucaoRepository.buscarTodasDevolucoes();

    if (!devolucoes || devolucoes.length === 0) {
      throw new AppError('Nenhuma devolução encontrada', 404);
    }

    return {
      sucesso: true,
      dados: devolucoes,
      total: devolucoes.length
    };
  }

  async listarDevolucaoPorId(id) {
    const idNumerico = Number(id);

    if (!ehInteiroPositivo(idNumerico)) {
      throw new AppError('Id inválido', 400);
    }

    const devolucao = await DevolucaoRepository.buscarDevolucoesPorId(idNumerico);

    if (!devolucao) {
      throw new AppError('Devolução não encontrada', 404);
    }

    return {
      sucesso: true,
      dados: devolucao
    };
  }

  async criarDevolucao(dados) {
    const {
      idFuncionario,
      idItemVenda,
      tipo,
      quantidade,
      motivo,
      reutilizavel,
      valorReembolso = 0,
      idVendaTroca = null,
      dataDevolucao
    } = dados || {};

    // 1. Validação de Ids e Quantidade (Inteiros Positivos)
    if (!ehInteiroPositivo(idFuncionario)) {
      throw new AppError("O campo 'idFuncionario' deve ser um número inteiro positivo.");
    }
    if (!ehInteiroPositivo(idItemVenda)) {
      throw new AppError("O campo 'idItemVenda' deve ser um número inteiro positivo.");
    }
    if (!ehInteiroPositivo(quantidade)) {
      throw new AppError("O campo 'quantidade' deve ser um número inteiro positivo.");
    }

    // 2. Validação do Enum TIPO ('DEVOLUCAO' ou 'TROCA')
    const tiposValidos = ['DEVOLUCAO', 'TROCA'];
    if (!tipo || !tiposValidos.includes(tipo)) {
      throw new AppError("O campo 'tipo' é obrigatório e deve ser 'DEVOLUCAO' ou 'TROCA'.");
    }

    // 3. Regra de Negócio: Tratamento do idVendaTroca baseado no tipo
    let idVendaTrocaTratado = null;
    if (tipo === 'TROCA') {
      if (!ehInteiroPositivo(idVendaTroca)) {
        throw new AppError("Para operações do tipo 'TROCA', o campo 'idVendaTroca' é obrigatório.");
      }
      idVendaTrocaTratado = idVendaTroca;
    } else if (idVendaTroca !== null && idVendaTroca !== undefined) {
      throw new AppError("O campo 'idVendaTroca' não deve ser informado em devoluções simples.");
    }

    // 4. Validação do Motivo (Até 500 caracteres)
    if (typeof motivo !== 'string' || !motivo.trim() || motivo.trim().length > 500) {
      throw new AppError("O campo 'motivo' é obrigatório e deve ter no máximo 500 caracteres.");
    }

    // 5. Validação do Flag Reutilizável (Booleano)
    if (typeof reutilizavel !== 'boolean') {
      throw new AppError("O campo 'reutilizavel' deve ser do tipo booleano (true ou false).");
    }

    // 6. Validação do Valor de Reembolso
    if (typeof valorReembolso !== 'number' || !Number.isFinite(valorReembolso) || valorReembolso < 0) {
      throw new AppError("O campo 'valorReembolso' deve ser um número válido e maior ou igual a zero.");
    }

    // 7. Validação da Data (Formato AAAA-MM-DD)
    if (typeof dataDevolucao !== 'string' || !REGEX_DATA_ISO.test(dataDevolucao) || Number.isNaN(Date.parse(dataDevolucao))) {
      throw new AppError("A 'dataDevolucao' é obrigatória e deve estar no formato AAAA-MM-DD.");
    }

    // 8. Persistência e captura de validações registradas no SGBD (Triggers e FKs)
    try {
      const insertId = await DevolucaoRepository.cadastrarDevolucao({
        id_funcionario: idFuncionario,
        id_item_venda: idItemVenda,
        tipo,
        quantidade,
        motivo: motivo.trim(),
        reutilizavel,
        valor_reembolso: valorReembolso,
        id_venda_troca: idVendaTrocaTratado,
        data_devolucao: dataDevolucao
      });

      const devolucaoCadastrada = await DevolucaoRepository.buscarDevolucoesPorId(insertId);

      return {
        sucesso: true,
        mensagem: `${tipo === 'TROCA' ? 'Troca' : 'Devolução'} realizada com sucesso!`,
        dados: devolucaoCadastrada
      };
    } catch (error) {
      // Captura exception lançada pela TRIGGER trg_devolucao_valida
      if (error.sqlState === '45000') {
        throw new AppError(error.message || 'Quantidade devolvida excede o total vendido no item.', 400);
      }
      // Captura erros de FK indisponível
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new AppError('Funcionário, Item de Venda ou Venda de Troca referenciado não existe no banco.', 400);
      }

      throw error;
    }
  }
}

module.exports = new DevolucaoService();