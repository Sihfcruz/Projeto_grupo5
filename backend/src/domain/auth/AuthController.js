const AuthService = require('./AuthFuncionarioService')

class AuthController {

    async login(req, res, next) {
        try {
            const { email, senha } = req.body;
            const usuario = await AuthService.login(email, senha)
            return res.status(201).json(usuario)
        } catch (error) {
            next(error)
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body
            if(!refreshToken) {
                const err = new Error('Refresh token não enviado');
                err.statusCode = 400;
                throw err;
            }

            const resultado = await AuthService.renovarToken(refreshToken)
            return res.status(200).json(resultado)
        } catch (error) {
            next(error)
        }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body
            await AuthService.logout(refreshToken)
            return res.status(200).send()
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new AuthController()