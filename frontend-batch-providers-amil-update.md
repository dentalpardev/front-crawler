# Frontend Handoff - Amil no Batch de Provedores

Data: 2026-04-14

Este documento descreve a mudanca feita no backend para permitir que a Amil seja enviada junto com os outros provedores no endpoint de batch.

## Problema Encontrado

Ao selecionar todos os provedores no frontend, o backend retornava:

```json
{
  "errors": {
    "providers[2]": "The value you selected is not a valid choice."
  }
}
```

Isso acontecia quando o payload continha:

```json
{
  "providers": ["odontoprev", "hapvida", "amil", "sulamerica"]
}
```

O item `providers[2]` era `amil`.

## Causa

O backend ja tinha rota individual e crawler da Amil, mas o DTO do batch ainda validava apenas estes provedores:

```json
["odontoprev", "hapvida", "sulamerica"]
```

Por isso, `amil` era rejeitada antes de chegar na criacao do batch.

## Mudanca Feita

O backend agora aceita a Amil no batch.

Lista valida de provedores:

```json
["odontoprev", "hapvida", "amil", "sulamerica"]
```

## Payload Correto para Selecionar Todos

Endpoint:

```http
POST /api/v1/crawlers/batches
Authorization: Bearer <token>
Content-Type: application/json
```

Payload minimo:

```json
{
  "cidade": "Joinville",
  "uf": "SC",
  "providers": ["odontoprev", "hapvida", "amil", "sulamerica"]
}
```

O backend aplicara os filtros padrao de cada operadora quando `providerOptions` nao for enviado.

## Payload com Overrides

Se o usuario alterar algum filtro, enviar apenas o override necessario:

```json
{
  "cidade": "Joinville",
  "uf": "SC",
  "providers": ["odontoprev", "hapvida", "amil", "sulamerica"],
  "providerOptions": {
    "amil": {
      "bairro": "TODOS OS BAIRROS",
      "especialidade": "CLINICA GERAL"
    },
    "sulamerica": {
      "area": "Clinica Geral"
    }
  }
}
```

Campos omitidos continuam sendo preenchidos pelo backend com os defaults.

## Resposta Esperada

Sucesso:

```json
{
  "batchId": "018e...",
  "status": "queued",
  "jobs": [
    {
      "jobId": "018e-job-1",
      "provider": "odontoprev",
      "status": "queued",
      "options": {}
    },
    {
      "jobId": "018e-job-2",
      "provider": "hapvida",
      "status": "queued",
      "options": {}
    },
    {
      "jobId": "018e-job-3",
      "provider": "amil",
      "status": "queued",
      "options": {}
    },
    {
      "jobId": "018e-job-4",
      "provider": "sulamerica",
      "status": "queued",
      "options": {}
    }
  ],
  "message": "Crawl batch queued."
}
```

Observacao: em ambiente real, `options` pode vir preenchido com os filtros efetivamente usados pelo backend.

## Polling

Depois de criar o batch:

```http
GET /api/v1/crawlers/batches/{batchId}
```

Para buscar resultados do batch:

```http
GET /api/v1/crawlers/batches/{batchId}/dentists
```

## Acao Necessaria no Frontend

- Garantir que o valor enviado para Amil seja exatamente `amil`.
- Garantir que o array de todos os provedores seja:

```json
["odontoprev", "hapvida", "amil", "sulamerica"]
```

- Nao usar labels visuais como valor do provider.
- Labels podem ser exibidas na UI, mas o payload deve usar os IDs acima.

Sugestao de mapeamento:

```ts
const providers = [
  { id: 'odontoprev', label: 'OdontoPrev' },
  { id: 'hapvida', label: 'Hapvida' },
  { id: 'amil', label: 'Amil' },
  { id: 'sulamerica', label: 'SulAmerica' },
]
```

## Checklist

- [ ] Checkbox da Amil envia `amil`.
- [ ] Selecionar todos envia os 4 IDs validos.
- [ ] Batch com todos os provedores retorna `202`.
- [ ] Frontend faz polling pelo `batchId`.
- [ ] Em caso de falha individual, mostrar erro daquele job e permitir retry manual.
