# Integração da API

A revisão alinhou accessToken, rotação de refreshToken, campos camelCase de cargos/marcas/modelos, categoria obrigatória no modelo, permissões administrativas e URL via VITE_API_URL.

As operações implementadas foram habilitadas em src/services/config.js. A demonstração continua sem gravações. CORS e portas são configurados no backend; não há proxy obrigatório no Vite.

A referência atual está em [ROTAS.md](../ROTAS.md). Instalação e testes estão nos READMEs. Testes com persistência simulada não comprovam transações ou concorrência no MySQL real.
