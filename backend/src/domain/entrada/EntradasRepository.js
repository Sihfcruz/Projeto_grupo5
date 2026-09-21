const EntradasRepository = require('./EntradasRepository')
const SkuRepository = require('../sku/SkuRepository') // precisa expor findById(idSku)

class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message)
        this.statusCode = statusCode
    }
}

const ehInteiroPositivo = (valor) => Number.isInteger(valor) && valor > 0

class EntradaService {

    async listarEntradas() {
        const entradas = await EntradasRepository.buscarTodasEntradas()

        // buscarTodasEntradas retorna um array; array vazio também é "nenhum resultado"
        if (!entradas || entradas.length === 0) {
            throw new AppError('Nenhuma entrada encontrada', 404)
        }

        return {
            sucesso: true,
            dados: entradas,
            total: entradas.length
        }
    }

    async listarEntradaPorId(id) {
        const idNumerico = Number(id)

        if (!ehInteiroPositivo(idNumerico)) {
            throw new AppError('Id inválido', 400)
        }

        const entrada = await EntradasRepository.buscarEntradaPorId(idNumerico)

        if (!entrada) {
            throw new AppError('Entrada não encontrada', 404)
        }

        return {
            sucesso: true,
            dados: entrada
        }
    }

    async criarEntrada(dados) {
        const {
            idFuncionario,
            idSku,
            idFornecedor = null,
            quantidade,
            valorTotal,
            dataEntrada,
            lote,
            notaFiscal = null
        } = dados || {}

        // 1. Campos obrigatórios (idFornecedor e notaFiscal são opcionais)
        const obrigatorios = { idFuncionario, idSku, quantidade, valorTotal, dataEntrada, lote }

        for (const [campo, valorCampo] of Object.entries(obrigatorios)) {
            if (valorCampo === undefined || valorCampo === null || valorCampo === '') {
                throw new AppError(`O campo '${campo}' é obrigatório e deve ser preenchido.`)
            }
        }

        // 2. Inteiros positivos (ids e quantidade)
        for (const [campo, valorCampo] of Object.entries({ idFuncionario, idSku, quantidade })) {
            if (!ehInteiroPositivo(valorCampo)) {
                throw new AppError(`O campo '${campo}' deve ser um número inteiro maior que zero.`)
            }
        }

        if (idFornecedor !== null && !ehInteiroPositivo(idFornecedor)) {
            throw new AppError("O campo 'idFornecedor' deve ser um número inteiro maior que zero.")
        }

        // 3. Valor total (decimal positivo, máx. 2 casas)
        if (typeof valorTotal !== 'number' || !Number.isFinite(valorTotal) || valorTotal <= 0) {
            throw new AppError("O campo 'valorTotal' deve ser um número válido e maior que zero.")
        }

        // 4. Textos e tamanhos máximos das colunas
        if (typeof lote !== 'string' || lote.trim() === '' || lote.length > 20) {
            throw new AppError("O campo 'lote' deve ser um texto de até 20 caracteres.")
        }

        if (notaFiscal !== null && (typeof notaFiscal !== 'string' || notaFiscal.length > 44)) {
            throw new AppError("O campo 'notaFiscal' deve ser um texto de até 44 caracteres.")
        }

        // 5. Data de entrada
        const data = new Date(dataEntrada)

        if (Number.isNaN(data.getTime())) {
            throw new AppError('A data de entrada é inválida.')
        }

        const dataFormatada = data.toISOString().split('T')[0]

        // 6. O SKU (tamanho + cor do tênis) precisa existir
        const skuExiste = await SkuRepository.findById(idSku)

        if (!skuExiste) {
            throw new AppError(`SKU ${idSku} não foi encontrado.`, 404)
        }

        // 7. Grava e traduz erros do MySQL em mensagens amigáveis
        try {
            const idEntrada = await EntradasRepository.create({
                idFuncionario,
                idFornecedor,
                idSku,
                quantidade,
                valorTotal,
                dataEntrada: dataFormatada,
                lote: lote.trim(),
                notaFiscal
            })

            const entrada = await EntradasRepository.buscarEntradaPorId(idEntrada)

            return {
                sucesso: true,
                mensagem: 'Entrada cadastrada com sucesso!',
                dados: entrada
            }
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new AppError('Já existe uma entrada com este lote para este SKU.', 409)
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new AppError('Funcionário, fornecedor ou SKU informado não existe.', 400)
            }
            throw error
        }
    }
}

module.exports = new EntradaService()