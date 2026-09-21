const SaidaRepository = require('./SaidaRepository');
const ProdutoRepository = require('../produto/ProdutoRepository');
const EstoqueRepository = require('../estoque/EstoqueRepository');

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

class SaidaService {
  async listarSaidas() {
    const saidas = await SaidaRepository.buscarTodasSaidas();

    return {
      sucesso: true,
      dados: saidas,
      total: saidas.length,
    };
  }

  async listarSaidasPorId(id) {
    if (!id || isNaN(id)) {
      throw new AppError("Id inválido", 400);
    }

    const saida = await SaidaRepository.buscarSaidaPorId(id);

    if (!saida) {
      throw new AppError("Nenhuma saida encontrada", 404);
    }

    return {
      sucesso: true,
      dados: saida,
    };
  }

  async criarSaida(dados) {
    const {
      idCadastro,
      codigoProduto,
      destinatario,
      dataSaida,
      codigoCliente,
      motivo,
      valor,
      unidades,
      lote,
      etiqueta,
      codigoRastreamento,
    } = dados;

    // 1. Validação de presença (campos obrigatórios)
    const camposObrigatorios = [
      idCadastro,
      codigoProduto,
      destinatario,
      dataSaida,
      codigoCliente,
      motivo,
      valor,
      unidades,
      lote,
      etiqueta,
      codigoRastreamento,
    ];

    if (
      camposObrigatorios.some(
        (campo) => campo === undefined || campo === null || campo === "",
      )
    ) {
      throw new Error("Todos os campos devem estar preenchidos.");
    }

    // 2. Validação de strings
    if (typeof destinatario !== "string" || typeof motivo !== "string") {
      throw new Error("Os campos destinatario e motivo devem ser textos.");
    }

    // 3. Validação de números (devem ser do tipo number e maiores que zero)
    const camposNumericos = {
      idCadastro,
      codigoProduto,
      codigoCliente,
      valor,
      unidades,
      codigoRastreamento,
    };

<<<<<<< Updated upstream
    for (const [campo, valorCampo] of Object.entries(camposNumericos)) {
      if (
        typeof valorCampo !== "number" ||
        Number.isNaN(valorCampo) ||
        valorCampo <= 0
      ) {
=======
    // Se codigoRastreamento for enviado, valida também como número > 0
    if (codigoRastreamento !== undefined && codigoRastreamento !== null && codigoRastreamento !== "") {
      camposNumericos.codigoRastreamento = codigoRastreamento;
    }

    for (const [campo, val] of Object.entries(camposNumericos)) {
      if (typeof val !== "number" || Number.isNaN(val) || val <= 0) {
        throw new Error(`O campo '${campo}' deve ser um número válido e maior que zero.`);
      }
    }

    // 5. Tratamento e formatação da Data
    const dataParsed = new Date(dataSaida);
    if (Number.isNaN(dataParsed.getTime())) {
      throw new Error("A 'dataSaida' informada é inválida.");
    }
    // Formata para o padrão ISO de banco de dados (YYYY-MM-DD)
    const dataSaidaFormatada = dataParsed.toISOString().split("T")[0];

    // 6. Início da Transação no Banco de Dados
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 6.1. Verificar se o produto existe
      const produtoExiste = await ProdutoRepository.findById(codigoProduto, connection);
      if (!produtoExiste) {
        throw new Error(`Produto com o código ${codigoProduto} não foi encontrado.`);
      }

      /* 
      // 6.2. Verificar se o cliente existe
      const clienteExiste = await ClienteRepository.buscarPorCodigo(codigoCliente, connection);
      if (!clienteExiste) {
        throw new Error(`Cliente com o código ${codigoCliente} não foi encontrado.`);
      }
      */

      /* 
      // 6.3. Verificar se o lote existe
      const loteExiste = await LoteRepository.buscarPorCodigo(lote, connection);
      if (!loteExiste) {
        throw new Error(`Lote '${lote}' não foi encontrado.`);
      }
      */

      /* 
      // 6.4. Verificar se a etiqueta existe
      const etiquetaExiste = await EtiquetaRepository.buscarPorCodigo(etiqueta, connection);
      if (!etiquetaExiste) {
        throw new Error(`Etiqueta '${etiqueta}' não foi encontrada.`);
      }
      */

      // 6.5. Verificar se a quantidade no estoque (VIEW) é suficiente
      const estoque = await EstoqueRepository.listarCodigoProduto(codigoProduto)

      const saldoAtual = estoque?.saldo_estoque || 0;

      if (saldoAtual < unidades) {
>>>>>>> Stashed changes
        throw new Error(
          `O campo ${campo} deve ser um número válido e maior que zero.`,
        );
      }
    }

    /*
    // 3. Validação da Data de Saída (compara com a data atual do sistema)
    const dataAtual = new Date();
    const dataInformada = new Date(dataSaida);

    // Compara apenas Ano, Mês e Dia (formato YYYY-MM-DD)
    const dataAtualFormatada = dataAtual.toISOString().split("T")[0];
    const dataInformadaFormatada = !isNaN(dataInformada)
      ? dataInformada.toISOString().split("T")[0]
      : null;

    if (!dataInformadaFormatada) {
      throw new Error("A data de saída deve ser informada");
    }*/

    // 4. Validação de existência no Banco de Dados
    const produtoExiste = await ProdutoRepository.findById(codigoProduto);
    if (!produtoExiste) {
      throw new Error(
        `Produto com o código ${codigoProduto} não foi encontrado.`,
      );
    }

    /*
    const clienteExiste = await clienteRepository.buscarPorCodigo(codigoCliente);
    if (!clienteExiste) {
        throw new Error(`Cliente com o código ${codigoCliente} não foi encontrado.`);
    }*/ //Fazer a implementação(urgência média)

    /*
    const loteExiste = await loteRepository.buscarPorCodigo(lote);
    if (!loteExiste) {
        throw new Error(`Lote '${lote}' não foi encontrado.`);
    }*/ //Fazer a implementação(urgência média)

    const novaSaida = {
      idCadastro: idCadastro,
      codigoProduto: codigoProduto,
      destinatario: destinatario,
      dataSaida: dataSaida,
      codigoCliente: codigoCliente,
      motivo: motivo,
      valor: valor,
      unidades: unidades,
      lote: lote,
      etiqueta: etiqueta,
      codigoRastreamento: codigoRastreamento,
    };

    const resultado = await SaidaRepository.cadastrarSaida(novaSaida);

    return {
      sucesso: true,
      mensagem: "Saída cadastrada com sucesso",
      dados: resultado,
    };
  }
}


module.exports = new SaidaService()