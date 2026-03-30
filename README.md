# Dentalpar Frontend

Frontend da plataforma de busca odontológica da Dentalpar.

O projeto permite autenticação com JWT, busca de dentistas por cidade e UF, seleção de um ou múltiplos providers e acompanhamento do processamento assíncrono do backend até a exibição dos resultados.

## Stack

- Vue 3 + TypeScript
- Vite
- PrimeVue 4 em `styled mode`
- Tema `Aura` com `primary` blue e `surface` gray
- Pinia
- Vue Router
- Vitest
- Playwright

## Principais Fluxos

- Login e cadastro integrados ao backend
- Rotas protegidas com guard de autenticação
- Busca por cidade + UF
- Seleção de um provider para execução via `job`
- Seleção de múltiplos providers para execução via `batch`
- Polling de status até conclusão
- Listagem dos dentistas retornados pela API
- Exportação dos resultados em CSV
- Suporte a light mode e dark mode com tokens do tema do PrimeVue

## Tema e UI

O projeto usa PrimeVue da forma nativa recomendada:

- `styled mode`
- preset `Aura`
- `inputVariant: 'filled'`
- `darkModeSelector: '.app-dark'`
- customização de design tokens em [src/app/primevue.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/app/primevue.ts)

## Estrutura

```text
src/
  app/         bootstrap da aplicação, router, tema e shell
  modules/
    auth/      autenticação, páginas públicas e store de sessão
    home/      busca, integração com crawlers/jobs/batches e resultados
  shared/      API client, componentes reutilizáveis, assets e composables
```

## Requisitos

- Node.js `^20.19.0 || >=22.12.0`
- npm
- Backend da Dentalpar rodando localmente

## Configuração

Instale as dependências:

```sh
npm install
```

Crie um arquivo `.env` na raiz do projeto se quiser sobrescrever a URL padrão da API:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Se a variável não existir, o frontend usa `http://localhost:8000/api/v1` por padrão.

## Executando o Projeto

Suba o frontend em modo desenvolvimento:

```sh
npm run dev
```

Gere a build de produção:

```sh
npm run build
```

Abra a build localmente:

```sh
npm run preview
```

## Scripts Disponíveis

```sh
npm run dev
npm run build
npm run preview
npm run lint
npm run test:unit
npm run test:e2e
npm run format
```

## Qualidade

Lint:

```sh
npm run lint
```

Testes unitários:

```sh
npm run test:unit -- --run
```

Testes end-to-end:

```sh
npm run test:e2e
```

Na primeira execução do Playwright, pode ser necessário instalar os browsers:

```sh
npx playwright install
```

## Integração com o Backend

O frontend conversa com a API da Dentalpar por meio de um client compartilhado em [src/shared/api/httpClient.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/shared/api/httpClient.ts) e segue o contrato documentado em [frontend-handoff.md](/home/gabrielayala/Workspace/Advize/front-crawler/frontend-handoff.md).

Fluxos atualmente suportados:

- `POST /auth/login`
- `POST /users/register`
- `POST /crawlers/{provider}`
- `POST /crawlers/batches`
- `GET /crawlers/jobs/{id}`
- `GET /crawlers/jobs/{id}/dentists`
- `GET /crawlers/batches/{id}`
- `GET /crawlers/batches/{id}/dentists`

## Arquivos Importantes

- [src/app/main.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/app/main.ts)
- [src/app/router.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/app/router.ts)
- [src/app/primevue.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/app/primevue.ts)
- [src/modules/auth/store/useAuthStore.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/modules/auth/store/useAuthStore.ts)
- [src/modules/home/store/useHomeSearchStore.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/modules/home/store/useHomeSearchStore.ts)
- [src/modules/home/api/crawlersApi.ts](/home/gabrielayala/Workspace/Advize/front-crawler/src/modules/home/api/crawlersApi.ts)

## Observações

- Com um provider selecionado, o frontend cria um `job`.
- Com múltiplos providers selecionados, o frontend cria um `batch`.
- O frontend faz polling de status antes de buscar os dentistas finais.
- A sessão é persistida em `localStorage`.
