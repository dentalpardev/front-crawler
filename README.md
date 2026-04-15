# Dentalpar Frontend

Frontend da plataforma de busca odontologica da Dentalpar.

A aplicacao concentra autenticacao, recuperacao de senha, disparo de crawlers por provider, acompanhamento assíncrono de `jobs` e `batches` e exibicao paginada dos dentistas retornados pelo backend.

## Stack

- Vue 3 + TypeScript
- Vite
- PrimeVue 4 em `styled mode`
- Tema `Aura`
- Pinia
- Vue Router
- Vitest
- Playwright

## O Que o Projeto Faz

- login, cadastro e recuperacao de senha integrados ao backend
- rotas publicas e protegidas com controle de sessao JWT
- busca principal guiada por `UF -> municipio`
- selecao de um ou varios providers na mesma busca
- filtros especificos por provider
- criacao de `job` individual ou `batch` multi-provider
- polling de status ate conclusao
- listagem de resultados com paginacao
- exportacao dos resultados em CSV
- suporte a light mode e dark mode

## Providers Suportados

- `OdontoPrev`
  fluxo mais simples, com rede ou plano e filtros opcionais adicionais.
- `Hapvida`
  fluxo em cascata com tipo de contrato, produto, servico, especialidade e bairro opcional.
- `Amil`
  fluxo dental em cascata com rede ou plano, bairro e especialidade; `tipoServico` e enviado como `DENTAL`.
- `SulAmerica`
  fluxo com produto, plano e refinamento opcional de horario.

Os contratos de backend e as regras de cada provider estao documentados em [frontend-handoff.md](/home/gabrielayala/Workspace/Advize/front-crawler/frontend-handoff.md).

## Fluxos Principais

### Autenticacao

- `POST /auth/login`
- `POST /users/register`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Em desenvolvimento local, o fluxo de recuperacao de senha pode ser validado via Mailpit, conforme o handoff do backend.

### Busca e Coleta

- o usuario escolhe primeiro a `UF`
- depois escolhe o `municipio` em um `Select`, evitando erro de digitacao
- em seguida configura os filtros do provider ativo
- com um provider selecionado, o frontend cria um `job`
- com varios providers selecionados, o frontend cria um `batch`
- a tela faz polling de status antes de buscar os dentistas finais

### Resultados

- cards responsivos para dentistas
- paginacao com PrimeVue `Paginator`
- exportacao da lista completa em CSV
- exibicao de `area` quando o backend informar esse campo

## Estrutura

```text
src/
  app/         bootstrap da aplicacao, router, tema e shell
  modules/
    auth/      paginas publicas, formularios e store de sessao
    home/      busca, filtros por provider, jobs, batches e resultados
  shared/      client HTTP, tipos e UI reutilizavel
```

Arquivos de referencia:

- [src/app/main.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/app/main.ts)
- [src/app/router.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/app/router.ts)
- [src/app/primevue.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/app/primevue.ts)
- [src/modules/auth/store/useAuthStore.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/modules/auth/store/useAuthStore.ts)
- [src/modules/home/store/useHomeSearchStore.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/modules/home/store/useHomeSearchStore.ts)
- [src/modules/home/api/crawlersApi.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/modules/home/api/crawlersApi.ts)
- [src/modules/home/pages/HomePage.vue](/home/gabrielayala/Workspace/Advize/front-crawler/src/modules/home/pages/HomePage.vue)

## Tema e UI

O projeto usa PrimeVue da forma nativa recomendada:

- `styled mode`
- preset `Aura`
- `inputVariant: 'filled'`
- `darkModeSelector: '.app-dark'`
- customizacao de tokens em [src/app/primevue.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/app/primevue.ts)

Sempre que houver implementacao de componentes PrimeVue no projeto, a referencia local de componentes esta em [primevue-full-docs.txt](/home/gabrielayala/Workspace/Advize/front-crawler/primevue-full-docs.txt).

## Requisitos

- Node.js `^20.19.0 || >=22.12.0`
- npm
- backend da Dentalpar rodando localmente

## Configuracao

Instale as dependencias:

```sh
npm install
```

Crie um arquivo `.env` na raiz se quiser sobrescrever a URL padrao da API:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Se a variavel nao existir, o frontend usa `http://localhost:8000/api/v1` por padrao.

## Executando o Projeto

Modo desenvolvimento:

```sh
npm run dev
```

Build de producao:

```sh
npm run build
```

Preview local da build:

```sh
npm run preview
```

## Scripts Disponiveis

```sh
npm run dev
npm run build
npm run preview
npm run type-check
npm run lint
npm run test:unit -- --run
npm run test:e2e
npm run format
```

## Qualidade

Type-check:

```sh
npm run type-check
```

Lint:

```sh
npm run lint
```

Testes unitarios:

```sh
npm run test:unit -- --run
```

Testes end-to-end:

```sh
npm run test:e2e
```

Na primeira execucao do Playwright, pode ser necessario instalar os browsers:

```sh
npx playwright install
```

## Integracao com o Backend

O frontend usa um client compartilhado em [httpClient.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/shared/api/httpClient.ts) e segue o contrato documentado em [frontend-handoff.md](/home/gabrielayala/Workspace/Advize/front-crawler/frontend-handoff.md).

Rotas principais atualmente consumidas:

- `POST /auth/login`
- `POST /users/register`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /crawlers/odontoprev`
- `POST /crawlers/hapvida`
- `POST /crawlers/amil`
- `POST /crawlers/sulamerica`
- `POST /crawlers/batches`
- `GET /crawlers/jobs/{id}`
- `GET /crawlers/jobs/{id}/dentists`
- `GET /crawlers/batches/{id}`
- `GET /crawlers/batches/{id}/dentists`

Catalogos por provider e regras de payload devem ser considerados fonte de verdade no handoff, nao neste README.

## Observacoes

- a sessao do usuario e persistida em `localStorage`
- a tela principal hoje usa municipios carregados por UF para reduzir erro humano na busca
- os resultados sao paginados para evitar scroll excessivo em listas grandes
- na Amil, a busca local pode demorar mais porque o backend usa automacao de navegador na etapa final
