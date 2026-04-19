# Home Module

## Proposito

Orquestra a busca odontologica autenticada: selecao de provedores, filtros por catalogo, enfileiramento de crawlers, acompanhamento de jobs/lotes, exibicao de dentistas e exportacao CSV.

## Rotas

- `/` (`home`): tela principal de busca, protegida por `meta.requiresAuth = true`.

## API Publica

O arquivo `index.ts` exporta apenas:

- `homeRoutes`
- `HOME_ROUTE_NAME`

Submodulos com API interna do modulo:

- `api/index.ts`: requests dos crawlers, localidades e tipos de payload/resposta.
- `store/index.ts`: `useHomeSearchStore` e tipos de opcoes globais.
- `composables/index.ts`: composables de resultados, polling e catalogos por provider.
- `utils/index.ts`: formatters, helpers de dentistas e exportacao CSV.

## Dependencias Importantes

- `shared/api` para `apiRequest` e tratamento de `ApiError`.
- `shared/types` para `CrawlProvider` e status de jobs/lotes.
- `shared/utils` para normalizacao, formatacao generica e download.
- PrimeVue para controles de formulario, cards, mensagens, tags e paginacao.
- Pinia para persistir o estado principal da busca entre componentes.

## Pontos de Extensao

- Novo provider deve atualizar `CrawlProvider`, `providerOptions`, tipos de payload em `api/crawlersApi.ts` e o fluxo de montagem em `HomePage.vue`.
- Novo catalogo de provider deve ficar em `composables/use<Provider>Catalog.ts`.
- Nova UI de filtros por provider deve ser um componente em `components/`, recebendo dados por props e emitindo mudancas.
- Helpers reutilizaveis da Home devem ficar em `utils/`; apenas utilidades genericas devem subir para `shared/`.
