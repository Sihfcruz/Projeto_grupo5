const EntradasRepository = require('./EntradasRepository');
const SkuRepository = require('../sku/SkuRepository');
const EntradaValidator = require('./EntradaSchema');
const AppError = require('../../errors/AppError');

class EntradaService {
    /**
     * Suporte a Injeção de Dependências para Facilidade de Testes Unitários
     */
    constructor(
        entradasRepo = EntradasRepository,
        skuRepo = SkuRepository
    ) {
        this.entradasRepo = entradasRepo;
        this.skuRepo = skuRepo;
    }

    async listarEntradas() {
        const entradas = await this.entradasRepo.buscarTodasEntradas();

        if (!entradas || entradas.length === 0) {
            throw new AppError('Nenhuma entrada encontrada', 404);
        }

        return {
            sucesso: true,
            dados: entradas,
            total: entradas.length
        };
    }

    async listarEntradaPorId(id) {
        const idNumerico = Number(id);

        if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
            throw new AppError('Id inválido', 400);
        }

        const entrada = await this.entradasRepo.buscarEntradaPorId(idNumerico);

        if (!entrada) {
            throw new AppError('Entrada não encontrada', 404);
        }

        return {
            sucesso: true,
            dados: entrada
        };
    }

    async criarEntrada(dados) {
        // 1. Validação de Sintaxe/Schema (Lança AppError 400 se falhar)
        EntradaValidator.validarCriacao(dados);

        const {
            idFuncionario,
            idSku,
            idFornecedor = null,
            quantidade,
            valorTotal,
            dataEntrada,
            lote,
            notaFiscal = null
        } = dados;

        // 2. Validação de Regra de Negócio (Existência de Entidades Relacionadas)
        const skuExiste = await this.skuRepo.findById(idSku);
        if (!skuExiste) {
            throw new AppError(`SKU ${idSku} não foi encontrado.`, 404);
        }

        // 3. Persistência e Tratamento de Exceções de Infraestrutura
        try {
            const idEntrada = await this.entradasRepo.create({
                idFuncionario,
                idFornecedor,
                idSku,
                quantidade,
                valorTotal,
                dataEntrada,
                lote: lote.trim(),
                notaFiscal
            });

            const entrada = await this.entradasRepo.buscarEntradaPorId(idEntrada);

            return {
                sucesso: true,
                mensagem: 'Entrada cadastrada com sucesso!',
                dados: entrada
            };
        } catch (error) {
            // Mapeamento de erros conhecidos do driver MySQL para erros de domínio
            if (error.code === 'ER_DUP_ENTRY') {
                throw new AppError('Já existe uma entrada com este lote para este SKU.', 409);
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new AppError('Funcionário ou Fornecedor informado não existe.', 400);
            }

            // Erros inesperados sobem para o middleware de infraestrutura (500)
            throw error;
        }
    }
}

module.exports = new EntradaService();