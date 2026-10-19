const pool = require('../../config/database')
const AppError = require('../errors/AppError')

/**
 * Repository genérico (somente colunas declaradas -> sem mass assignment).
 * colunas: { campoCamel: 'coluna_sql' } (inclua a chave primária, ex.: idMarca)
 * gravaveis: campos que podem ser inseridos/alterados
 */
function criarRepository({ tabela, pk, colunas, gravaveis, softDelete = false, ordem }) {
    const select = Object.entries(colunas).map(([camel, col]) => `${col} AS ${camel}`).join(', ')
    const filtroAtivo = softDelete ? ' AND deleted_at IS NULL' : ''
    const orderBy = ordem || pk

    return {
        async listar() {
            const [rows] = await pool.query(
                `SELECT ${select} FROM ${tabela} WHERE 1=1${filtroAtivo} ORDER BY ${orderBy}`
            )
            return rows
        },

        async buscarPorId(id) {
            const [rows] = await pool.query(
                `SELECT ${select} FROM ${tabela} WHERE ${pk} = ?${filtroAtivo}`, [id]
            )
            return rows[0] || null
        },

        async criar(dados) {
            const campos = gravaveis.filter((c) => dados[c] !== undefined)
            const sql = `INSERT INTO ${tabela} (${campos.map((c) => colunas[c]).join(', ')}) VALUES (${campos.map(() => '?').join(', ')})`
            const [result] = await pool.query(sql, campos.map((c) => dados[c]))
            return result.insertId
        },

        async atualizar(id, dados) {
            const campos = gravaveis.filter((c) => dados[c] !== undefined)
            if (campos.length === 0) return 0
            const sql = `UPDATE ${tabela} SET ${campos.map((c) => `${colunas[c]} = ?`).join(', ')} WHERE ${pk} = ?${filtroAtivo}`
            const [result] = await pool.query(sql, [...campos.map((c) => dados[c]), id])
            return result.affectedRows
        },

        async excluir(id) {
            const sql = softDelete
                ? `UPDATE ${tabela} SET ativo = FALSE, deleted_at = NOW() WHERE ${pk} = ? AND deleted_at IS NULL`
                : `DELETE FROM ${tabela} WHERE ${pk} = ?`
            const [result] = await pool.query(sql, [id])
            return result.affectedRows
        }
    }
}

// Traduz erros comuns do MySQL em erros HTTP
function traduzirErroBanco(error, entidade) {
    if (error instanceof AppError) return error
    if (error.code === 'ER_DUP_ENTRY') return new AppError(`Já existe ${entidade} com estes dados.`, 409)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return new AppError('Um dos registros relacionados informados não existe.', 400)
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return new AppError(`Não é possível excluir: ${entidade} está em uso por outros registros.`, 409)
    if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return new AppError('Algum valor informado viola as regras do banco de dados.', 400)
    return error
}

/**
 * Service genérico.
 * schema: { campo: { valida: fn, obrigatorio: bool, somenteCriacao: bool } }
 */
function criarService({ repository, entidade, schema }) {
    const ehId = (id) => {
        const n = Number(id)
        if (!Number.isInteger(n) || n <= 0) throw new AppError('Id inválido', 400)
        return n
    }

    function validar(dados, criacao) {
        const limpo = {}
        for (const [campo, regra] of Object.entries(schema)) {
            const valor = (dados || {})[campo]
            if (valor === undefined) {
                if (criacao && regra.obrigatorio) {
                    throw new AppError(`O campo '${campo}' é obrigatório.`)
                }
                continue
            }
            if (!criacao && regra.somenteCriacao) continue
            limpo[campo] = regra.valida(valor)
        }
        return limpo
    }

    return {
        ehId,

        async listar() {
            const dados = await repository.listar()
            return { sucesso: true, dados, total: dados.length }
        },

        async buscarPorId(id) {
            const registro = await repository.buscarPorId(ehId(id))
            if (!registro) throw new AppError(`${entidade} não encontrado(a)`, 404)
            return { sucesso: true, dados: registro }
        },

        async cadastrar(dados) {
            const limpo = validar(dados, true)
            try {
                const id = await repository.criar(limpo)
                const criado = await repository.buscarPorId(id)
                return { sucesso: true, mensagem: `${entidade} cadastrado(a) com sucesso!`, dados: criado }
            } catch (error) {
                throw traduzirErroBanco(error, entidade)
            }
        },

        async atualizar(id, dados) {
            const idNum = ehId(id)
            const limpo = validar(dados, false)
            if (Object.keys(limpo).length === 0) {
                throw new AppError('Nenhum dado válido enviado para atualização')
            }
            if (!(await repository.buscarPorId(idNum))) {
                throw new AppError(`${entidade} não encontrado(a)`, 404)
            }
            try {
                await repository.atualizar(idNum, limpo)
            } catch (error) {
                throw traduzirErroBanco(error, entidade)
            }
            return { sucesso: true, mensagem: `${entidade} atualizado(a) com sucesso`, dados: await repository.buscarPorId(idNum) }
        },

        async excluir(id) {
            const idNum = ehId(id)
            if (!(await repository.buscarPorId(idNum))) {
                throw new AppError(`${entidade} não encontrado(a)`, 404)
            }
            try {
                await repository.excluir(idNum)
            } catch (error) {
                throw traduzirErroBanco(error, entidade)
            }
            return { sucesso: true, mensagem: `${entidade} removido(a) com sucesso` }
        }
    }
}

/**
 * Controller genérico. injetaFuncionario: nome do campo que recebe req.usuario.id no cadastro.
 */
function criarController(service, { injetaFuncionario } = {}) {
    return {
        async listar(req, res, next) {
            try { res.status(200).json(await service.listar()) } catch (e) { next(e) }
        },
        async buscarPorId(req, res, next) {
            try { res.status(200).json(await service.buscarPorId(req.params.id)) } catch (e) { next(e) }
        },
        async cadastrar(req, res, next) {
            try {
                const dados = { ...(req.body || {}) }
                if (injetaFuncionario) dados[injetaFuncionario] = req.usuario.id
                res.status(201).json(await service.cadastrar(dados))
            } catch (e) { next(e) }
        },
        async atualizar(req, res, next) {
            try { res.status(200).json(await service.atualizar(req.params.id, req.body)) } catch (e) { next(e) }
        },
        async excluir(req, res, next) {
            try { res.status(200).json(await service.excluir(req.params.id)) } catch (e) { next(e) }
        }
    }
}

// Monta as rotas REST. adminEscrita: POST/PUT/PATCH/DELETE só admin. adminExcluir: DELETE só admin.
function criarRotas(controller, { adminEscrita = false, adminExcluir = true } = {}) {
    const express = require('express')
    const { verificarAdmin } = require('../middlewares/authMiddleware')
    const router = express.Router()
    const escrita = adminEscrita ? [verificarAdmin] : []
    const exclusao = adminEscrita || adminExcluir ? [verificarAdmin] : []

    router.get('/', controller.listar)
    router.get('/:id', controller.buscarPorId)
    router.post('/', ...escrita, controller.cadastrar)
    router.put('/:id', ...escrita, controller.atualizar)
    router.patch('/:id', ...escrita, controller.atualizar)
    router.delete('/:id', ...exclusao, controller.excluir)
    return router
}

module.exports = { criarRepository, criarService, criarController, criarRotas, traduzirErroBanco }
