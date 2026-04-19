import type { CrawlBatchStatus, CrawlJobStatus } from '@/shared/types'

const providerLabels: Record<string, string> = {
  odontoprev: 'OdontoPrev',
  hapvida: 'Hapvida',
  amil: 'Amil',
  sulamerica: 'SulAmerica',
}

/**
 * Traduz status de job ou lote para o texto apresentado na Home.
 */
export function formatStatusLabel(status: CrawlBatchStatus | CrawlJobStatus | null | undefined): string {
  switch (status) {
    case 'queued':
      return 'Na fila'
    case 'running':
      return 'Coletando...'
    case 'done':
      return 'Concluida'
    case 'failed':
      return 'Falhou'
    case 'partial_failed':
      return 'Parcialmente concluida'
    default:
      return 'Sem coleta'
  }
}

/**
 * Formata contagens de dentistas incluindo o estado pendente usado durante polling.
 */
export function formatDentistCount(total: number | null): string {
  if (total === null) {
    return 'Contagem pendente'
  }

  return `${total} dentista${total === 1 ? '' : 's'}`
}

/**
 * Resolve o nome exibido de um provider conhecido, preservando valores desconhecidos.
 */
export function formatProviderLabel(value: string): string {
  return providerLabels[value] ?? value
}

/**
 * Traduz os codigos de tipo de pessoa retornados pelos crawlers.
 */
export function formatProfessionalType(value: string | null): string {
  if (!value) {
    return ''
  }

  if (value === 'F') {
    return 'Pessoa fisica'
  }

  if (value === 'J') {
    return 'Pessoa juridica'
  }

  return value
}
