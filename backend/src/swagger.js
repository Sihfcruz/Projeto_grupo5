const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const swaggerAutogen = require('swagger-autogen')({
    openapi: '3.0.0'
})

const toSwaggerPath = (filePath) => filePath.replaceAll(path.sep, '/')
const outputFile = toSwaggerPath(path.join(__dirname, 'swagger-output.json'))
const endpointsFiles = [toSwaggerPath(path.join(__dirname, 'app.js'))]

const document = {
    info: {
        title: 'API Nômade',
        description: 'Documentação da API de gestão de estoque.',
        version: '1.0.0'
    },
    servers: [
        {
            url: `http://localhost:${process.env.PORT || 3000}`,
            description: 'Servidor local'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    }
}

// Os helpers CRUD montam rotas dinamicamente; declaramos essas rotas no contrato.
swaggerAutogen(outputFile, endpointsFiles, document).then((resultado) => {
    if (!resultado || !resultado.success) throw new Error('Falha ao gerar documentação')
    const fs = require('fs')
    const spec = JSON.parse(fs.readFileSync(outputFile, 'utf8'))
    const operacao = (resumo, protegido = true, criacao = false) => ({
        summary: resumo,
        ...(protegido ? { security: [{ bearerAuth: [] }] } : {}),
        responses: { [criacao ? '201' : '200']: { description: 'Operação concluída' }, '400': { description: 'Dados inválidos' } }
    })
    for (const recurso of ['cargo', 'marca', 'categoria', 'modelo', 'fornecedor', 'cliente', 'sku']) {
        const nome = recurso[0].toUpperCase() + recurso.slice(1)
        const config = require('./domain/' + recurso + '/' + nome + 'Config')
        const obrigatorios = Object.entries(config.schema).filter(([, regra]) => regra.obrigatorio && !regra.somenteCriacao).map(([campo]) => campo)
        const campos = Object.fromEntries(Object.entries(config.schema).filter(([, regra]) => !regra.somenteCriacao).map(([campo]) => [campo, {
            type: /^(id|nivelAcesso|estoqueMinimo|tamanho|preco)/.test(campo) ? 'number' : 'string'
        }]))
        const body = (criacao) => ({ required: true, content: { 'application/json': { schema: {
            type: 'object', properties: campos, ...(criacao ? { required: obrigatorios } : {})
        } } } })
        spec.paths['/' + recurso] = {
            get: operacao('Listar ' + recurso),
            post: { ...operacao('Cadastrar ' + recurso, true, true), requestBody: body(true) }
        }
        spec.paths['/' + recurso + '/{id}'] = {
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
            get: operacao('Buscar ' + recurso),
            put: { ...operacao('Atualizar ' + recurso), requestBody: body(false) },
            patch: { ...operacao('Atualizar ' + recurso), requestBody: body(false) },
            delete: operacao('Excluir ' + recurso + ' (admin)')
        }
    }
    for (const [rota, metodos] of Object.entries(spec.paths)) {
        if (rota.startsWith('/api-docs')) { delete spec.paths[rota]; continue }
        for (const [metodo, op] of Object.entries(metodos)) {
            if (!['get', 'post', 'put', 'patch', 'delete'].includes(metodo)) continue
            op.security = rota === '/' || rota.startsWith('/auth/') ? [] : [{ bearerAuth: [] }]
        }
    }
    for (const rota of Object.keys(spec.paths)) {
        if (rota !== '/' && rota.endsWith('/')) {
            spec.paths[rota.slice(0, -1)] = spec.paths[rota]
            delete spec.paths[rota]
        }
    }
    fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2) + '\n')
}).catch((error) => {
    console.error(error.message)
    process.exitCode = 1
})
