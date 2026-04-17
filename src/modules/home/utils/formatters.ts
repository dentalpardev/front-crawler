import type { CrawlBatchStatus, CrawlJobStatus } from '@/shared/types'

const providerLabels: Record<string, string> = {
  odontoprev: 'OdontoPrev',
  hapvida: 'Hapvida',
  amil: 'Amil',
  sulamerica: 'SulAmerica',
}

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

export function formatDentistCount(total: number | null): string {
  if (total === null) {
    return 'Contagem pendente'
  }

  return `${total} dentista${total === 1 ? '' : 's'}`
}

export function formatProviderLabel(value: string): string {
  return providerLabels[value] ?? value
}

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
