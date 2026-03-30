import { apiRequest } from '@/shared/api'
import type { CrawlBatchStatus, CrawlJobStatus, CrawlProvider } from '@/shared/types'

export type QueueJobResponse = {
  jobId: string
  status: 'queued'
  message: string
}

export type QueueBatchResponse = {
  batchId: string
  status: 'queued'
  jobs: Array<{
    jobId: string
    provider: CrawlProvider
    status: 'queued'
  }>
  message: string
}

export type CrawlJobResponse = {
  jobId: string
  provider: CrawlProvider
  cidade: string
  uf: string
  batchId: string | null
  status: CrawlJobStatus
  totalDentists: number | null
  errorMessage: string | null
  options: Record<string, unknown>
  queuedAt: string
  startedAt: string | null
  finishedAt: string | null
}

export type CrawlBatchResponse = {
  batchId: string
  cidade: string
  uf: string
  status: CrawlBatchStatus
  totalJobs: number
  completedJobs: number
  failedJobs: number
  totalDentists: number
  jobs: CrawlJobResponse[]
}

export type DentistSpecialty =
  | string
  | {
      nome?: string | null
      descricao?: string | null
      [key: string]: unknown
    }

export type JobDentist = {
  provider: CrawlProvider
  externalId: string | null
  nome: string
  cro: string | null
  nomeFantasia: string | null
  email: string | null
  telefone: string | null
  whatsapp: string | null
  atendeWhatsapp: boolean
  tipoPessoa: string | null
  tipoPrestador: string | null
  cnpj: string | null
  logradouro: string | null
  bairro: string | null
  cep: string | null
  cidade: string
  uf: string
  latitude: string | null
  longitude: string | null
  especialidades: DentistSpecialty[]
  possuiTituloEspecialidade: boolean
  programaAcreditacao: boolean
  qualidadeMonitorada: boolean
  posGraduadoLatoSenso: boolean
  mestrado: boolean
  comunicacaoEventosAdversos: boolean
  certificacoesEntidadesGestoras: boolean
  certificacaoIso9001: boolean
  residencia: boolean
  tituloEspecialista: boolean
  doutoradoPosGraduacao: boolean
  acessibilidadeCadeirante: boolean
  boaconsultaUrl: string | null
}

export type JobDentistsResponse = {
  jobId: string
  total: number
  dentists: JobDentist[]
}

export type BatchDentistsProviderResult = {
  provider: CrawlProvider
  total: number
  dentists: JobDentist[]
}

export type BatchDentistsResponse = {
  batchId: string
  totalProviders: number
  totalDentists: number
  results: BatchDentistsProviderResult[]
}

export type OdontoprevPayload = {
  cidade: string
  uf: string
}

export type HapvidaPayload = {
  cidade: string
  uf: string
}

export type SulamericaPayload = {
  cidade: string
  uf: string
}

export type QueueBatchPayload = {
  cidade: string
  uf: string
  providers: CrawlProvider[]
}

type QueuePayloadMap = {
  odontoprev: OdontoprevPayload
  hapvida: HapvidaPayload
  sulamerica: SulamericaPayload
}

export function queueCrawler<P extends CrawlProvider>(
  provider: P,
  payload: QueuePayloadMap[P],
  token: string,
) {
  return apiRequest<QueueJobResponse>(`/crawlers/${provider}`, {
    body: payload,
    method: 'POST',
    token,
  })
}

export function queueCrawlerBatch(payload: QueueBatchPayload, token: string) {
  return apiRequest<QueueBatchResponse>('/crawlers/batches', {
    body: payload,
    method: 'POST',
    token,
  })
}

export function getCrawlJob(jobId: string, token: string) {
  return apiRequest<CrawlJobResponse>(`/crawlers/jobs/${jobId}`, {
    token,
  })
}

export function getCrawlBatch(batchId: string, token: string) {
  return apiRequest<CrawlBatchResponse>(`/crawlers/batches/${batchId}`, {
    token,
  })
}

export function getJobDentists(jobId: string, token: string) {
  return apiRequest<JobDentistsResponse>(`/crawlers/jobs/${jobId}/dentists`, {
    token,
  })
}

export function getBatchDentists(batchId: string, token: string) {
  return apiRequest<BatchDentistsResponse>(`/crawlers/batches/${batchId}/dentists`, {
    token,
  })
}
