const crypto = require('crypto')
const bcrypt = require('bcrypt')
const AuthRepository = require('./AuthFuncionarioRepository')
const jwtUtils = require('../../shared/lib/jwtUtils')
const config = require('../../config/environment')
const AppError = require('../../shared/errors/AppError')

class AuthService {

    papelDoFuncionario(funcionario) {
        return Number(funcionario.nivel_acesso) >= config.nivelAdmin ? 'admin' : 'funcionario'
    }

    gerarAccessToken(funcionario) {
        return jwtUtils.gerarAccessToken({
            id: funcionario.id_funcionario,
            papel: this.papelDoFuncionario(funcionario)
        })
    }

    gerarRefreshToken(funcionario) {
        // jti garante token único mesmo em logins no mesmo segundo
        return jwtUtils.gerarRefreshToken({
            id: funcionario.id_funcionario,
            jti: crypto.randomUUID()
        })
    }

    async emitirTokens(funcionario) {
        const accessToken = this.gerarAccessToken(funcionario)
        const refreshToken = this.gerarRefreshToken(funcionario)

        const expiraEm = new Date()
        expiraEm.setDate(expiraEm.getDate() + config.jwt.refreshExpiryDays)
        await AuthRepository.salvarRefresh(funcionario.id_funcionario, refreshToken, expiraEm)

        return { accessToken, refreshToken }
    }

    async login(email, senha) {
        if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
            throw new AppError('Email e senha são obrigatórios', 400)
        }

        const funcionario = await AuthRepository.findByEmail(email.trim().toLowerCase())
        // Mesma mensagem para email inexistente e senha errada (não revela quais emails existem)
        const senhaValida = funcionario && await bcrypt.compare(senha, funcionario.senha)
        if (!senhaValida) {
            throw new AppError('Credenciais inválidas', 401)
        }

        const { accessToken, refreshToken } = await this.emitirTokens(funcionario)

        return {
            funcionario: {
                id: funcionario.id_funcionario,
                nome: funcionario.nome_completo,
                email: funcionario.email,
                idCargo: funcionario.id_cargo,
                papel: this.papelDoFuncionario(funcionario)
            },
            accessToken,
            refreshToken
        }
    }

    // Rotaciona o refresh token: o antigo é invalidado e um novo é emitido
    async renovarToken(refreshTokenRecebido) {
        const invalido = () => new AppError('Refresh token inválido ou expirado', 401)

        let payload
        try {
            payload = jwtUtils.verificarRefreshToken(refreshTokenRecebido)
        } catch {
            throw invalido()
        }

        const registro = await AuthRepository.buscarRefreshToken(refreshTokenRecebido)
        if (!registro) throw invalido()

        const funcionario = await AuthRepository.findById(payload.id)
        if (!funcionario) throw invalido()

        await AuthRepository.removerRefreshToken(refreshTokenRecebido)
        return await this.emitirTokens(funcionario)
    }

    async logout(refreshToken) {
        if (!refreshToken) throw new AppError('Refresh token não enviado', 400)
        await AuthRepository.removerRefreshToken(refreshToken)
    }
}

module.exports = new AuthService()
