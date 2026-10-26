const AuthService = require('./AuthFuncionarioService')
const AppError = require('../../shared/errors/AppError')

class AuthController {

    async login(req, res, next) {
        try {
            const { email, senha } = req.body || {}
            const resultado = await AuthService.login(email, senha)
            return res.status(200).json(resultado)
        } catch (error) {
            next(error)
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body || {}
            if (!refreshToken) throw new AppError('Refresh token não enviado', 400)

            const resultado = await AuthService.renovarToken(refreshToken)
            return res.status(200).json(resultado)
        } catch (error) {
            next(error)
        }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body || {}
            await AuthService.logout(refreshToken)
            return res.status(204).send()
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new AuthController()
