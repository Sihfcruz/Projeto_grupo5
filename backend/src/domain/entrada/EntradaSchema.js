const AppError = require('../../errors/AppError');

const REGEX_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

class EntradaValidator {
    static validarCriacao(dados) {
        const {
            idFuncionario,
            idSku,
            idFornecedor,
            quantidade,
            valorTotal,
            dataEntrada,
            lote,
            notaFiscal
        } = dados || {};

        if (!idFuncionario || !Number.isInteger(idFuncionario) || idFuncionario <= 0) {
            throw new AppError("O campo 'idFuncionario' deve ser um inteiro positivo.");
        }
        if (!idSku || !Number.isInteger(idSku) || idSku <= 0) {
            throw new AppError("O campo 'idSku' deve ser um inteiro positivo.");
        }
        if (idFornecedor !== undefined && idFornecedor !== null && (!Number.isInteger(idFornecedor) || idFornecedor <= 0)) {
            throw new AppError("O campo 'idFornecedor' deve ser um inteiro positivo.");
        }
        if (!quantidade || !Number.isInteger(quantidade) || quantidade <= 0) {
            throw new AppError("O campo 'quantidade' deve ser um inteiro positivo.");
        }
        if (typeof valorTotal !== 'number' || !Number.isFinite(valorTotal) || valorTotal <= 0) {
            throw new AppError("O campo 'valorTotal' deve ser um número decimal maior que zero.");
        }
        if (typeof lote !== 'string' || !lote.trim() || lote.trim().length > 20) {
            throw new AppError("O campo 'lote' é obrigatório e deve ter até 20 caracteres.");
        }
        if (notaFiscal && (typeof notaFiscal !== 'string' || notaFiscal.length > 44)) {
            throw new AppError("O campo 'notaFiscal' deve ter até 44 caracteres.");
        }
        if (typeof dataEntrada !== 'string' || !REGEX_DATA_ISO.test(dataEntrada) || Number.isNaN(Date.parse(dataEntrada))) {
            throw new AppError("A 'dataEntrada' deve estar no formato AAAA-MM-DD válido.");
        }
    }
}

module.exports = EntradaValidator;