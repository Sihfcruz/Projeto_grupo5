

**Testes:**
Comandos de testes para executar no terminal

Rodar toda a suíte de testes:

Bash
npm test

Rodar apenas um arquivo específico:

Bash
npx jest src/modules/users/user.spec.ts
Rodar testes no modo continuo (reexecuta ao salvar o arquivo):

Bash
npm run test:watch
Gerar relatório de cobertura de código:

Bash
npm run test:coverage

## Documentação da API

A especificação OpenAPI é gerada automaticamente antes de iniciar o backend:

```bash
cd backend
npm start
```

A interface interativa Scalar fica disponível em `http://localhost:3000/api-docs`, e o contrato OpenAPI em `http://localhost:3000/api-docs/openapi.json`. Para gerar o contrato sem iniciar o servidor, execute `npm run docs:generate` dentro da pasta `backend`.
