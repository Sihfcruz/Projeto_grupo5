const { criarService } = require('../../shared/lib/crud')
const CargoRepository = require('./CargoRepository')
const { entidade, schema } = require('./CargoConfig')
const AppError = require('../../shared/errors/AppError')

class CargoService {

    /**
     * Valida e converte o ID recebido para número.
     */
    validarId(id) {
        const idNumerico = Number(id)
        if (!id || isNaN(idNumerico) || idNumerico <= 0 || !Number.isInteger(idNumerico)) {
            throw new AppError('ID inválido', 400)
        }
        return idNumerico
    }

    async listar() {
        const dados = await CargoRepository.listar()
        return { sucesso: true, dados, total: dados.length }
    }

    async buscarPorId(id) {
        const idNum = this.validarId(id)
        const cargo = await CargoRepository.buscarPorId(idNum)

        if (!cargo) {
            throw new AppError(`${entidade || 'Cargo'} não encontrado(a)`, 404)
        }

        return { sucesso: true, dados: cargo }
    }

    async cadastrar(dados) {
        const { nome, nivelAcesso } = dados || {}

        if (!nome || nivelAcesso === undefined || nivelAcesso === null) {
            throw new AppError('Nome e nível de acesso são obrigatórios', 400)
        }

        const nomeTrimmed = String(nome).trim()
        const nivelAcessoNum = Number(nivelAcesso)

        if (nomeTrimmed.length < 2) {
            throw new AppError('O nome do cargo deve conter mais de dois caracteres', 400)
        }

        if (isNaN(nivelAcessoNum) || nivelAcessoNum < 0) {
            throw new AppError('O nível de acesso do cargo deve ser um número maior ou igual a zero', 400)
        }

        // Verificar existência prévia do cargo pelo nome (devido à constraint UNIQUE)
        const cargoExistente = await CargoRepository.buscarPorNome(nomeTrimmed)
        if (cargoExistente) {
            throw new AppError('Já existe um cargo cadastrado com este nome', 400)
        }

        try {
            const idCriado = await CargoRepository.cadastrar({
                nome_cargo: nomeTrimmed,
                nivel_acesso: nivelAcessoNum
            })
            return {
                sucesso: true,
                mensagem: `Cargo criado com sucesso!`,
            }
        } catch (error) {
            if (error instanceof AppError) throw error
            throw new AppError(`Erro ao cadastrar ${entidade || 'cargo'}: ${error.message}`, 500)
        }
    }

    async atualizar(id, dados) {
        const idNum = this.validarId(id)
        const cargoExistente = await CargoRepository.buscarPorId(idNum)

        if (!cargoExistente) {
            throw new AppError(`${entidade || 'Cargo'} não encontrado(a)`, 404)
        }

        const { nome, nivelAcesso } = dados || {}
        const dadosAtualizacao = {}

        if (nome !== undefined) {
            const nomeTrimmed = String(nome).trim()
            if (nomeTrimmed.length <= 2) {
                throw new AppError('O nome do cargo deve conter mais de dois caracteres', 400)
            }

            // Garante que não haverá conflito de UNIQUE nome_cargo com outro ID
            const cargoComMesmoNome = await CargoRepository.buscarPorNome(nomeTrimmed)
            if (cargoComMesmoNome && cargoComMesmoNome.id_cargo !== idNum) {
                throw new AppError('Já existe outro cargo cadastrado com este nome', 400)
            }

            dadosAtualizacao.nome_cargo = nomeTrimmed
        }

        if (nivelAcesso !== undefined) {
            const nivelAcessoNum = Number(nivelAcesso)
            if (isNaN(nivelAcessoNum) || nivelAcessoNum < 0) {
                throw new AppError('O nível de acesso do cargo deve ser um número maior ou igual a zero', 400)
            }
            dadosAtualizacao.nivel_acesso = nivelAcessoNum
        }

        if (Object.keys(dadosAtualizacao).length === 0) {
            throw new AppError('Nenhum dado válido enviado para atualização', 400)
        }

        try {
            await CargoRepository.atualizar(idNum, dadosAtualizacao)
            const atualizado = await CargoRepository.buscarPorId(idNum)

            return {
                sucesso: true,
                mensagem: `${entidade || 'Cargo'} atualizado(a) com sucesso`,
                dados: atualizado
            }
        } catch (error) {
            if (error instanceof AppError) throw error
            throw new AppError(`Erro ao atualizar ${entidade || 'cargo'}: ${error.message}`, 500)
        }
    }

    async excluir(id) {
        const idNum = this.validarId(id)
        const cargoExistente = await CargoRepository.buscarPorId(idNum)

        if (!cargoExistente) {
            throw new AppError(`${entidade || 'Cargo'} não encontrado(a)`, 404)
        }

        try {
            await CargoRepository.excluir(idNum)
            return {
                sucesso: true,
                mensagem: `${entidade || 'Cargo'} removido(a) com sucesso`
            }
        } catch (error) {
            if (error instanceof AppError) throw error
            throw new AppError(`Erro ao excluir ${entidade || 'cargo'}: ${error.message}`, 500)
        }
    }
}

module.exports = criarService({ repository: CargoRepository, entidade, schema, serviceClass: CargoService })