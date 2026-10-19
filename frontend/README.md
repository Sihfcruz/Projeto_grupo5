# Nômade — front-end React

Conversão direta da versão HTML para **React + Vite**, sem alterações no backend. As telas agora usam JSX, componentes, estado e efeitos do React. Não há execução dos antigos scripts que montavam as páginas com `innerHTML`.

O cliente de API, a sessão, os dados de demonstração, as flags de disponibilidade e o CSS foram preservados integralmente. Os contratos e as limitações da API permanecem os mesmos.

## Páginas incluídas

| Endereço            | Tela                                                          |
| ------------------- | ------------------------------------------------------------- |
| `index.html`        | Entrada para a tela de login.                                 |
| `login.html`        | Login e acesso à demonstração.                                |
| `dashboard.html`    | Visão geral, indicadores, alertas e recebimentos recentes.    |
| `inventory.html`    | Estoque, busca, filtros, paginação, detalhes e CSV.           |
| `registration.html` | Marcas e modelos.                                             |
| `movements.html`    | Recebimentos, vendas, devoluções/trocas, ajustes e histórico. |
| `reports.html`      | Relatório do estoque atual e exportação.                      |
| `users.html`        | Equipe e cargos.                                              |

São as mesmas páginas da entrega anterior, correspondentes aos recursos encontrados no backend. Cadastro de SKU, clientes, fornecedores, categorias e outros recursos sem rotas continuam indisponíveis; a conversão não acrescenta endpoints fictícios.

## Executar para desenvolver

Requer Node.js **20.19+ ou 22.12+** compatível com Vite 7 e npm.

Na pasta `frontend`:

```bash
npm ci
npm run dev
```

Abra `http://localhost:5173/login.html`. A API continua configurada em `http://localhost:3000`, em `src/services/config.js`. Inicie o backend separadamente depois de corrigir seus bloqueios, ou use **Visualizar demonstração** para consultar a interface com dados fictícios.

Os endereços terminados em `.html` foram mantidos. Cada um é uma entrada HTML para a mesma aplicação React, com o componente da página correspondente. Isso conserva os links e evita adicionar um roteador apenas para esta conversão.

## Compilar

```bash
npm run build
```

A pasta `dist` contém a versão compilada das oito entradas e já acompanha o ZIP. Para testar essa versão com Vite:

```bash
npm run preview
```

Abra `http://localhost:4173/login.html`. Essa porta serve para avaliar a compilação. Para acessar a API nesse endereço, a origem também precisa estar permitida no CORS do backend; para usar a configuração atual do backend, prefira desenvolvimento na porta 5173.

Também é possível servir a versão já compilada sem instalar as dependências:

```bash
cd dist
python -m http.server 5173
```

No Windows, substitua `python` por `py` se necessário. Não abra os arquivos diretamente por `file://`.

Alterações no código-fonte ou em `src/services/config.js` exigem nova compilação para atualizar `dist`. O pacote não inclui `node_modules` nem arquivos de backend.

## Estrutura

- `src/pages/`: componentes das sete telas, incluindo login.
- `src/components/`: navegação, tabelas, formulários, mensagens, detalhes e componentes das movimentações.
- `src/services/api.js`: requisições, token Bearer, renovação e tratamento de erro; preservado da versão HTML.
- `src/services/session.js`: sessão da conta e demonstração; preservado.
- `src/services/config.js`: endereço da API e operações disponíveis; preservado.
- `src/services/data.js`: formatação, leitura, CSV e cálculos auxiliares.
- `src/services/hooks.js`: carregamento de listas com proteção contra atualização após desmontagem.
- `src/styles/global.css`: estilos originais preservados.
- `ANALISE_API.md`: análise das 30 rotas únicas, funcionamento e problemas do backend.

Usa somente React, React DOM e Vite. Não adiciona Redux, biblioteca de componentes ou gerenciador de formulários. Formulários conservam os nomes e tipos esperados pela API; valores da API são renderizados como texto pelo React.

## Comportamentos preservados e verificações

A compilação de produção passou. Foram executados **17 grupos de verificações com React em DOM simulado e API simulada**, abrangendo:

- Login, exibição de senha, sessão, renovação do token e logout com resposta sem corpo.
- Inicialização das seis páginas internas em demonstração, sem requisições reais ou gravações.
- Cálculos da visão geral, busca, filtros e detalhes do estoque.
- Tema persistente, menu e fechamento com Escape.
- Escape de conteúdo recebido da API e envio de `Authorization: Bearer`.
- Histórico vazio, detalhe de venda e aviso de consulta parcial quando o cursor é inválido.
- Cadastro de funcionário e desativação com confirmação.
- Contratos de marca, modelo, recebimento, venda com desconto/pagamento, devolução booleana e ajuste negativo.
- Rejeição de SKUs duplicados antes de enviar a venda.
- Erros de API sem substituição por dados fictícios e sem exportação de dados indisponíveis.

Os formulários bloqueados foram habilitados **somente no compilador do ambiente de testes** para verificar os payloads. As flags do código entregue e do `dist` permanecem iguais às da versão HTML.

Também foram conferidas as oito entradas compiladas, suas referências de arquivos, a formatação e a geração de CSV. O código da API, sessão, configuração, demonstração e CSS foi comparado com a entrega anterior e está idêntico.

**Limites da validação:** não houve revisão visual em navegador real nem teste integrado com MySQL. A validação do React foi feita em DOM simulado; não comprova layout/responsividade, download pelo navegador ou validação nativa de campos monetários. Os problemas existentes no backend continuam descritos em `ANALISE_API.md` e não são resolvidos pela migração.

## Referências técnicas

- [React: createRoot](https://react.dev/reference/react-dom/client/createRoot)
- [React: useEffect](https://react.dev/reference/react/useEffect)
- [Vite: aplicações com múltiplas páginas](https://vite.dev/guide/build#multi-page-app)
