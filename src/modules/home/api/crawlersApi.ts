import { apiRequest } from '@/shared/api'
import type { CrawlBatchStatus, CrawlJobStatus, CrawlProvider } from '@/shared/types'

export type SelectOption = {
  codigo: string
  nome: string
}

export type AmilPlanApiOption = {
  codigoRede: string
  codigoPlano: string | null
  nome: string
  operadora: string | null
  linha: string | null
  uri: string | null
  tipo: 'rede' | 'plano'
}

export type AmilPlanOption = AmilPlanApiOption & {
  key: string
  displayName: string
}

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
    options?: Record<string, unknown>
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
  area: string | null
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
  codigoRede?: string
  codigoPlano?: string
  codigoEspecialidade?: string
  isEspecialista?: boolean
  isAtendeWhatsApp?: boolean
  nomeDentista?: string
  acessibilidade?: string
  idioma?: string
  forceRefresh?: boolean
}

export type HapvidaPayload = {
  cidade: string
  uf: string
  tipoContrato?: string
  produto?: string
  servico?: string
  especialidade?: string
  bairro?: string
  forceRefresh?: boolean
}

export type SulamericaPayload = {
  cidade: string
  uf: string
  produto?: string
  plano?: string
  bairro?: string
  area?: string
  horarioInicial?: string
  horarioFinal?: string
  forceRefresh?: boolean
}

export type AmilPayload = {
  cidade: string
  uf: string
  codigoRede?: string
  codigoPlano?: string
  identificacao?: string
  bairro?: string
  tipoServico?: string
  especialidade?: string
  forceRefresh?: boolean
}

export type OdontoprevProviderOptions = Omit<OdontoprevPayload, 'cidade' | 'uf'>
export type HapvidaProviderOptions = Omit<HapvidaPayload, 'cidade' | 'uf'>
export type AmilProviderOptions = Omit<AmilPayload, 'cidade' | 'uf'>
export type SulamericaProviderOptions = Omit<SulamericaPayload, 'cidade' | 'uf'>

export type ProviderOptionsMap = {
  odontoprev: OdontoprevProviderOptions
  hapvida: HapvidaProviderOptions
  amil: AmilProviderOptions
  sulamerica: SulamericaProviderOptions
}

export type QueueBatchProviderOptions = Partial<{
  [K in CrawlProvider]: ProviderOptionsMap[K]
}>

export type QueueBatchPayload = {
  cidade: string
  uf: string
  providers: CrawlProvider[]
  providerOptions?: QueueBatchProviderOptions
}

export type OdontoprevFiltersResponse = {
  redes: SelectOption[]
  planos: SelectOption[]
  especialidades: SelectOption[]
  planosPorCodigo: Record<string, string[]>
  totalRedes?: number
  totalPlanos?: number
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>

type HapvidaProductsQuery = {
  tipoContrato: string
}

type HapvidaStatesQuery = {
  produto: string
}

type HapvidaCitiesQuery = {
  produto: string
  uf: string
}

type HapvidaServicesQuery = {
  produto: string
  uf: string
  cidade: string
}

type HapvidaSpecialtiesQuery = {
  produto: string
  uf: string
  cidade: string
  servico: string
}

type HapvidaNeighborhoodsQuery = {
  produto: string
  uf: string
  cidade: string
  servico: string
  especialidade: string
}

type SulamericaPlansQuery = {
  produto: string
}

type SulamericaCitiesQuery = {
  uf: string
  produto: string
  plano: string
}

type SulamericaNeighborhoodsQuery = {
  uf: string
  cidade: string
  produto: string
  plano: string
}

type SulamericaAreasQuery = {
  uf: string
  cidade: string
  produto: string
  plano: string
  bairro?: string
}

type AmilBaseQuery = {
  codigoRede: string
  codigoPlano?: string
  identificacao?: string
}

type AmilStatesQuery = AmilBaseQuery

type AmilCitiesQuery = AmilBaseQuery & {
  uf: string
}

type AmilNeighborhoodsQuery = AmilBaseQuery & {
  uf: string
  cidade: string
}

type AmilServiceTypesQuery = AmilBaseQuery & {
  uf: string
  cidade: string
  bairro: string
}

type AmilSpecialtiesQuery = AmilBaseQuery & {
  uf: string
  cidade: string
  bairro: string
  tipoServico: string
}

type QueuePayloadMap = {
  odontoprev: OdontoprevPayload
  hapvida: HapvidaPayload
  amil: AmilPayload
  sulamerica: SulamericaPayload
}

function buildPathWithQuery(path: string, params?: QueryParams) {
  if (!params) {
    return path
  }

  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    searchParams.set(key, String(value))
  }

  const query = searchParams.toString()

  return query ? `${path}?${query}` : path
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

export function getOdontoprevFilters(token: string) {
  return apiRequest<OdontoprevFiltersResponse>('/crawlers/odontoprev/filters', { token })
}

export function getOdontoprevNetworks(token: string) {
  return apiRequest<SelectOption[]>('/crawlers/odontoprev/filters/networks', { token })
}

export function getOdontoprevPlans(token: string) {
  return apiRequest<SelectOption[]>('/crawlers/odontoprev/filters/plans', { token })
}

export function getOdontoprevSpecialties(token: string) {
  return apiRequest<SelectOption[]>('/crawlers/odontoprev/filters/specialties', { token })
}

export function getHapvidaContractTypes(token: string) {
  return apiRequest<SelectOption[]>('/crawlers/hapvida/filters/contract-types', { token })
}

export function getHapvidaProducts(params: HapvidaProductsQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/hapvida/filters/products', params),
    { token },
  )
}

export function getHapvidaStates(params: HapvidaStatesQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/hapvida/filters/states', params),
    { token },
  )
}

export function getHapvidaCities(params: HapvidaCitiesQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/hapvida/filters/cities', params),
    { token },
  )
}

export function getHapvidaServices(params: HapvidaServicesQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/hapvida/filters/services', params),
    { token },
  )
}

export function getHapvidaSpecialties(params: HapvidaSpecialtiesQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/hapvida/filters/specialties', params),
    { token },
  )
}

export function getHapvidaNeighborhoods(params: HapvidaNeighborhoodsQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/hapvida/filters/neighborhoods', params),
    { token },
  )
}

export function getAmilPlans(params: Pick<AmilBaseQuery, 'identificacao'>, token: string) {
  return apiRequest<AmilPlanApiOption[]>(
    buildPathWithQuery('/crawlers/amil/filters/plans', params),
    { token },
  )
}

export function getAmilStates(params: AmilStatesQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/amil/filters/states', params),
    { token },
  )
}

export function getAmilCities(params: AmilCitiesQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/amil/filters/cities', params),
    { token },
  )
}

export function getAmilNeighborhoods(params: AmilNeighborhoodsQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/amil/filters/neighborhoods', params),
    { token },
  )
}

export function getAmilServiceTypes(params: AmilServiceTypesQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/amil/filters/service-types', params),
    { token },
  )
}

export function getAmilSpecialties(params: AmilSpecialtiesQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/amil/filters/specialties', params),
    { token },
  )
}

export function getSulamericaProducts(token: string) {
  return apiRequest<SelectOption[]>('/crawlers/sulamerica/filters/products', { token })
}

export function getSulamericaPlans(params: SulamericaPlansQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/sulamerica/filters/plans', params),
    { token },
  )
}

export function getSulamericaCities(params: SulamericaCitiesQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/sulamerica/filters/cities', params),
    { token },
  )
}

export function getSulamericaNeighborhoods(params: SulamericaNeighborhoodsQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/sulamerica/filters/neighborhoods', params),
    { token },
  )
}

export function getSulamericaAreas(params: SulamericaAreasQuery, token: string) {
  return apiRequest<SelectOption[]>(
    buildPathWithQuery('/crawlers/sulamerica/filters/areas', params),
    { token },
  )
}

export function getSulamericaHours(token: string) {
  return apiRequest<SelectOption[]>('/crawlers/sulamerica/filters/hours', { token })
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
