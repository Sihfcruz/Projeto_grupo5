const AuthRepository = require('./AuthFuncionarioRepository')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

class AuthService {

    gerarAcessToken(user) {
        // user.role para papel (admin, funcionario) ou apenas id_cargo
        const papel = user.id_cargo === 1 ? 'admin' : 'funcionario';
        return jwt.sign(
            { id: user.id, papel: papel },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        )
    } 

    gerarRefreshToken(user){
        return jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        )
    }

    async login(email, senha) {
        const funcionario = await AuthRepository.findByEmail(email)
        if(!funcionario) {
            const error = new Error('Credenciais inválidas');
            error.statusCode = 401;
            throw error;
        }

        const senhaValida = await bcrypt.compare(senha, funcionario.senha)
        if(!senhaValida) {
            const error = new Error('Credenciais inválidas');
            error.statusCode = 401;
            throw error;
        }

        const acessToken = this.gerarAcessToken(funcionario)
        const refreshToken = this.gerarRefreshToken(funcionario)

        const expiraEm = new Date()
        expiraEm.setDate(expiraEm.getDate() + 7)
        await AuthRepository.salvarRefresh(funcionario.id_funcionario || funcionario.id, refreshToken, expiraEm)

        return {
            funcionario: { id: funcionario.id_funcionario || funcionario.id, nome: funcionario.nome, email: funcionario.email, role: funcionario.id_cargo },
            acessToken,
            refreshToken,
        }
    }

    async renovarToken(refreshTokenRecebido) {
        const registro = await AuthRepository.buscarRefreshToken(refreshTokenRecebido)
        if(!registro) {
            const error = new Error('Refresh token inválido ou expirado');
            error.statusCode = 401;
            throw error;
        }

        try {
            const payload = jwt.verify(refreshTokenRecebido, process.env.JWT_REFRESH_SECRET)
            const funcionario = await AuthRepository.findById(payload.id)
            if(!funcionario) {
                throw new Error('Funcionário não encontrado')
            }

            const novoAccessToken = this.gerarAcessToken(funcionario)
            return { acessToken: novoAccessToken }
        } catch(error) {
            const err = new Error('Refresh token expirado ou inválido');
            err.statusCode = 401;
            throw err;
        }
    }

    async logout(refreshToken){
        await AuthRepository.removerRefreshToken(refreshToken)
    }
}

module.exports = new AuthService()