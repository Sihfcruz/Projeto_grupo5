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

swaggerAutogen(outputFile, endpointsFiles, document)
