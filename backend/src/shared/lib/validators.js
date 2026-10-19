const AppError = require('../errors/AppError')

// Cada validador recebe o valor já presente (não undefined) e devolve o valor limpo.

const texto = (campo, { max = 255, min = 1 } = {}) => (valor) => {
    if (typeof valor !== 'string' || valor.trim().length < min) {
        throw new AppError(`O campo '${campo}' é obrigatório e deve ser um texto.`)
    }
    if (valor.trim().length > max) {
        throw new AppError(`O campo '${campo}' deve ter no máximo ${max} caracteres.`)
    }
    return valor.trim()
}

const textoOpcional = (campo, { max = 255 } = {}) => (valor) => {
    if (valor === null || valor === '') return null
    return texto(campo, { max })(valor)
}

const inteiroPositivo = (campo) => (valor) => {
    if (!Number.isInteger(valor) || valor <= 0) {
        throw new AppError(`O campo '${campo}' deve ser um número inteiro positivo.`)
    }
    return valor
}

const inteiroPositivoOpcional = (campo) => (valor) =>
    valor === null ? null : inteiroPositivo(campo)(valor)

const inteiroMin = (campo, min) => (valor) => {
    if (!Number.isInteger(valor) || valor < min) {
        throw new AppError(`O campo '${campo}' deve ser um número inteiro maior ou igual a ${min}.`)
    }
    return valor
}

const decimalPositivo = (campo) => (valor) => {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
        throw new AppError(`O campo '${campo}' deve ser um número maior que zero.`)
    }
    if (Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-6) {
        throw new AppError(`O campo '${campo}' aceita no máximo 2 casas decimais.`)
    }
    return valor
}

const enumerado = (campo, lista) => (valor) => {
    if (!lista.includes(valor)) {
        throw new AppError(`O campo '${campo}' deve ser um de: ${lista.join(', ')}.`)
    }
    return valor
}

const emailValido = (campo = 'email', { opcional = false } = {}) => (valor) => {
    if (opcional && (valor === null || valor === '')) return null
    const email = texto(campo, { max: 150 })(valor).toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError('Formato de e-mail inválido')
    }
    return email
}

const apenasDigitos = (campo, tamanhos) => (valor) => {
    const digitos = texto(campo, { max: 20 })(String(valor)).replace(/\D/g, '')
    if (!tamanhos.includes(digitos.length)) {
        throw new AppError(`O campo '${campo}' deve ter ${tamanhos.join(' ou ')} dígitos.`)
    }
    return digitos
}

module.exports = {
    texto, textoOpcional, inteiroPositivo, inteiroPositivoOpcional, inteiroMin,
    decimalPositivo, enumerado, emailValido, apenasDigitos
}
