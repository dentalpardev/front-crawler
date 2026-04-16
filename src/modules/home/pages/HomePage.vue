<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/modules/auth/store'
import { isApiError } from '@/shared/api'
import type { CrawlBatchStatus, CrawlJobStatus, CrawlProvider } from '@/shared/types'
import { AppTopbar } from '@/shared/ui'
import {
  getAmilCities,
  getAmilNeighborhoods,
  getAmilPlans,
  getAmilSpecialties,
  getAmilStates,
  getMunicipalitiesByState,
  getHapvidaCities,
  getHapvidaContractTypes,
  getHapvidaNeighborhoods,
  getHapvidaProducts,
  getHapvidaServices,
  getHapvidaSpecialties,
  getHapvidaStates,
  getOdontoprevFilters,
  getSulamericaCities,
  getSulamericaHours,
  getSulamericaPlans,
  getSulamericaProducts,
} from '../api'
import type {
  AmilPlanOption,
  AmilProviderOptions,
  DentistSpecialty,
  HapvidaProviderOptions,
  MunicipalityOption,
  OdontoprevProviderOptions,
  QueueBatchProviderOptions,
  SelectOption,
  SulamericaProviderOptions,
} from '../api'
import { useHomeSearchStore } from '../store'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const homeSearchStore = useHomeSearchStore()
const { providerOptions, stateOptions } = homeSearchStore

const {
  activeLocationLabel,
  batchDentistsBatchId,
  canSearch,
  city,
  currentBatch,
  currentBatchDentistsTotal,
  currentBatchId,
  currentBatchResults,
  currentDentists,
  currentDentistsTotal,
  currentJob,
  currentJobId,
  dentistsJobId,
  formError,
  formErrors,
  hasAnyDentists,
  hasBatchDentists,
  hasDentists,
  isBatchSelection,
  isRefreshingBatch,
  isRefreshingBatchDentists,
  isRefreshingDentists,
  isRefreshingJob,
  isSubmitting,
  isTrackingRunning,
  primaryProvider,
  selectedProviders,
  selectedState,
} = storeToRefs(homeSearchStore)

type ProviderFieldErrors = Partial<Record<string, string>>

type DentistLegendIcon = {
  code: string
  label: string
}

type StartCrawlUiOptions = {
  forceRefresh?: boolean
  preferBatch?: boolean
  providers?: CrawlProvider[]
}

type SearchSubmissionResult = Awaited<ReturnType<typeof homeSearchStore.startCrawl>>

const DEFAULT_ODONTOPREV_REDE = '241008130'
const DEFAULT_HAPVIDA_TIPO_CONTRATO = 'Individual/Familiar'
const DEFAULT_HAPVIDA_PRODUTO = 'Personal Individual'
const DEFAULT_HAPVIDA_SERVICO = 'CONSULTORIOS/CLINICAS'
const DEFAULT_HAPVIDA_ESPECIALIDADE = 'Odontologia Clinica'
const DEFAULT_HAPVIDA_BAIRRO = 'TODOS OS BAIRROS'
const DEFAULT_AMIL_CODIGO_REDE = '844'
const DEFAULT_AMIL_PLAN_KEY = `${DEFAULT_AMIL_CODIGO_REDE}::`
const DEFAULT_AMIL_BAIRRO = 'TODOS OS BAIRROS'
const DEFAULT_AMIL_ESPECIALIDADE = 'CLINICA GERAL'
const DEFAULT_SULAMERICA_PRODUTO = '100'
const DEFAULT_SULAMERICA_PLANO = 'Odonto Mais'

const providerErrors = reactive<Record<CrawlProvider, ProviderFieldErrors>>({
  odontoprev: {},
  hapvida: {},
  amil: {},
  sulamerica: {},
})

const activeProviderPanel = ref<CrawlProvider | null>(null)
const resultsFirst = ref(0)
const resultsRows = ref(12)
const isLoadingMunicipalities = ref(false)
const municipalityLoadError = ref('')
const municipalityOptions = ref<MunicipalityOption[]>([])
const municipalityOptionsByState = reactive<Record<string, MunicipalityOption[]>>({})
let municipalityRequestId = 0

const providerLoadErrors = reactive<Record<CrawlProvider, string>>({
  odontoprev: '',
  hapvida: '',
  amil: '',
  sulamerica: '',
})

const loadingState = reactive({
  odontoprev: {
    filters: false,
  },
  hapvida: {
    contractTypes: false,
    products: false,
    states: false,
    cities: false,
    services: false,
    specialties: false,
    neighborhoods: false,
  },
  amil: {
    plans: false,
    states: false,
    cities: false,
    neighborhoods: false,
    specialties: false,
  },
  sulamerica: {
    products: false,
    plans: false,
    cities: false,
    hours: false,
  },
})

const odontoprevCatalog = reactive({
  loaded: false,
  redes: [{ codigo: DEFAULT_ODONTOPREV_REDE, nome: 'Rede Unna' }] as SelectOption[],
  planos: [] as SelectOption[],
  especialidades: [] as SelectOption[],
})

const odontoprevForm = reactive({
  codigoRede: DEFAULT_ODONTOPREV_REDE,
  codigoPlano: '',
  codigoEspecialidade: '',
  isEspecialista: false,
  isAtendeWhatsApp: false,
  nomeDentista: '',
  acessibilidade: false,
  idioma: '',
})

const hapvidaCatalog = reactive({
  contractTypes: [
    { codigo: DEFAULT_HAPVIDA_TIPO_CONTRATO, nome: DEFAULT_HAPVIDA_TIPO_CONTRATO },
  ] as SelectOption[],
  products: [{ codigo: DEFAULT_HAPVIDA_PRODUTO, nome: DEFAULT_HAPVIDA_PRODUTO }] as SelectOption[],
  states: [] as SelectOption[],
  cities: [] as SelectOption[],
  services: [{ codigo: DEFAULT_HAPVIDA_SERVICO, nome: DEFAULT_HAPVIDA_SERVICO }] as SelectOption[],
  specialties: [
    { codigo: DEFAULT_HAPVIDA_ESPECIALIDADE, nome: DEFAULT_HAPVIDA_ESPECIALIDADE },
  ] as SelectOption[],
  neighborhoods: [{ codigo: DEFAULT_HAPVIDA_BAIRRO, nome: DEFAULT_HAPVIDA_BAIRRO }] as SelectOption[],
})

const hapvidaForm = reactive({
  tipoContrato: DEFAULT_HAPVIDA_TIPO_CONTRATO,
  produto: DEFAULT_HAPVIDA_PRODUTO,
  servico: DEFAULT_HAPVIDA_SERVICO,
  especialidade: DEFAULT_HAPVIDA_ESPECIALIDADE,
  bairro: DEFAULT_HAPVIDA_BAIRRO,
})

const amilCatalog = reactive({
  plans: [
    {
      codigoRede: DEFAULT_AMIL_CODIGO_REDE,
      codigoPlano: null,
      nome: 'Rede Amil Dental',
      operadora: null,
      linha: null,
      uri: null,
      tipo: 'rede',
      key: DEFAULT_AMIL_PLAN_KEY,
      displayName: 'Rede Amil Dental · Rede',
    },
  ] as AmilPlanOption[],
  states: [] as SelectOption[],
  cities: [] as SelectOption[],
  neighborhoods: [{ codigo: DEFAULT_AMIL_BAIRRO, nome: DEFAULT_AMIL_BAIRRO }] as SelectOption[],
  specialties: [{ codigo: DEFAULT_AMIL_ESPECIALIDADE, nome: DEFAULT_AMIL_ESPECIALIDADE }] as SelectOption[],
})

const amilForm = reactive({
  selectedPlanKey: DEFAULT_AMIL_PLAN_KEY,
  bairro: DEFAULT_AMIL_BAIRRO,
  especialidade: DEFAULT_AMIL_ESPECIALIDADE,
})

const sulamericaCatalog = reactive({
  products: [{ codigo: DEFAULT_SULAMERICA_PRODUTO, nome: 'Odonto Individual' }] as SelectOption[],
  plans: [{ codigo: DEFAULT_SULAMERICA_PLANO, nome: DEFAULT_SULAMERICA_PLANO }] as SelectOption[],
  cities: [] as SelectOption[],
  hours: [] as SelectOption[],
})

const sulamericaForm = reactive({
  produto: DEFAULT_SULAMERICA_PRODUTO,
  plano: DEFAULT_SULAMERICA_PLANO,
  horarioInicial: '',
  horarioFinal: '',
})

const activeStatus = computed<CrawlBatchStatus | CrawlJobStatus | null>(() => {
  if (currentBatch.value) {
    return currentBatch.value.status
  }

  return currentJob.value?.status ?? null
})

const isDoneState = computed(() => activeStatus.value === 'done')
const isPartialFailedState = computed(() => activeStatus.value === 'partial_failed')
const isTerminalState = computed(
  () =>
    activeStatus.value === 'done' ||
    activeStatus.value === 'failed' ||
    activeStatus.value === 'partial_failed',
)

const statusSeverity = computed(() => {
  if (activeStatus.value === 'done') {
    return 'success'
  }

  if (activeStatus.value === 'partial_failed') {
    return 'warn'
  }

  if (activeStatus.value === 'failed') {
    return 'danger'
  }

  if (activeStatus.value === 'running' || activeStatus.value === 'queued') {
    return 'info'
  }

  return 'secondary'
})

const statusLabel = computed(() => formatStatusLabel(activeStatus.value))

const providerHelperText = computed(() => {
  if (isBatchSelection.value) {
    return `${selectedProviders.value.length} providers serao executados em lote para a mesma UF e municipio.`
  }

  if (primaryProvider.value === 'odontoprev') {
    return 'Fluxo mais simples: basta selecionar UF e municipio.'
  }

  if (primaryProvider.value === 'hapvida') {
    return 'Os parametros internos da busca agora sao resolvidos pelo backend.'
  }

  if (primaryProvider.value === 'amil') {
    return 'Selecione rede ou plano da Amil antes de escolher UF e municipio.'
  }

  return 'UF e municipio ja sao suficientes para iniciar a coleta.'
})

const municipalityPlaceholder = computed(() => {
  if (!selectedState.value) {
    return 'Selecione a UF primeiro'
  }

  if (isLoadingMunicipalities.value) {
    return 'Carregando municipios...'
  }

  return 'Selecione o municipio'
})

const searchStateOptions = computed(() => {
  let filteredOptions = stateOptions

  if (selectedProviders.value.includes('hapvida') && hapvidaCatalog.states.length > 0) {
    const allowedCodes = new Set(hapvidaCatalog.states.map((option) => option.codigo))
    filteredOptions = filteredOptions.filter((option) => allowedCodes.has(option.code))
  }

  if (selectedProviders.value.includes('amil') && amilCatalog.states.length > 0) {
    const allowedCodes = new Set(amilCatalog.states.map((option) => option.codigo))
    filteredOptions = filteredOptions.filter((option) => allowedCodes.has(option.code))
  }

  return filteredOptions
})

const canSubmitSearch = computed(() => canSearch.value)

const canClearScreen = computed(
  () =>
    selectedProviders.value.length > 0 ||
    Boolean(selectedState.value) ||
    Boolean(trimValue(city.value)) ||
    Boolean(currentJob.value) ||
    Boolean(currentBatch.value) ||
    hasAnyDentists.value ||
    Boolean(formError.value) ||
    Object.keys(formErrors.value).length > 0,
)

const isRetryingActiveProvider = computed(() => {
  if (!activeProviderPanel.value) {
    return false
  }

  return isProviderCatalogLoading(activeProviderPanel.value)
})

const selectedProviderOptions = computed(() =>
  providerOptions.filter((option) => selectedProviders.value.includes(option.value)),
)

const showHero = computed(
  () => !currentJob.value && !currentBatch.value && !isSubmitting.value && !hasAnyDentists.value,
)
const showStatusCard = computed(
  () => Boolean((currentJob.value || currentBatch.value) && !isDoneState.value && !isPartialFailedState.value),
)
const showCompletedBanner = computed(() => isDoneState.value || isPartialFailedState.value)
const showResultsSection = computed(() => {
  if (currentBatch.value) {
    return hasBatchDentists.value || isTerminalState.value
  }

  if (currentJob.value) {
    return hasDentists.value || isTerminalState.value
  }

  return false
})

const searchButtonLabel = computed(() => (isSubmitting.value ? 'Buscando...' : 'Buscar dentistas'))

const displayDentists = computed(() => {
  if (currentBatch.value) {
    return currentBatchResults.value.flatMap((result) => result.dentists)
  }

  return currentDentists.value
})

const paginatedDentists = computed(() =>
  displayDentists.value.slice(resultsFirst.value, resultsFirst.value + resultsRows.value),
)

const shouldShowResultsPaginator = computed(() => displayDentists.value.length > resultsRows.value)

const resultsPaginatorTemplate = {
  '640px': 'PrevPageLink CurrentPageReport NextPageLink',
  '960px': 'FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink',
  default: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown',
}

const displayDentistsTotal = computed(() => {
  if (currentBatch.value) {
    return currentBatchDentistsTotal.value ?? currentBatch.value.totalDentists
  }

  if (currentJob.value) {
    return currentDentistsTotal.value ?? currentJob.value.totalDentists
  }

  return null
})

const locationSummary = computed(() => {
  if (!activeLocationLabel.value) {
    return ''
  }

  return `${formatDentistCount(displayDentistsTotal.value)} em ${activeLocationLabel.value}`
})

const amilPlanSelectionOptions = computed(() =>
  amilCatalog.plans.map((option) => ({
    key: option.key,
    label: option.displayName,
    tipo: option.tipo,
  })),
)

const selectedAmilPlan = computed(
  () => amilCatalog.plans.find((option) => option.key === amilForm.selectedPlanKey) ?? null,
)

const completedSummaryItems = computed(() => {
  if (currentBatch.value) {
    if (currentBatchResults.value.length > 0) {
      return currentBatchResults.value.map((result) => ({
        key: result.provider,
        label: formatProviderLabel(result.provider),
        total: result.total,
        tone: getProviderTone(result.provider),
      }))
    }

    return currentBatch.value.jobs.map((job) => ({
      key: job.jobId,
      label: formatProviderLabel(job.provider),
      total: job.totalDentists,
      tone: getProviderTone(job.provider),
    }))
  }

  return currentJob.value
    ? [
        {
          key: currentJob.value.jobId,
          label: formatProviderLabel(currentJob.value.provider),
          total: displayDentistsTotal.value,
          tone: getProviderTone(currentJob.value.provider),
        },
      ]
    : []
})

const statusRows = computed(() => {
  if (currentBatch.value) {
    return currentBatch.value.jobs.map((job) => ({
      key: job.jobId,
      provider: formatProviderLabel(job.provider),
      tone: getProviderTone(job.provider),
      status: formatStatusLabel(job.status),
      total: formatDentistCount(job.totalDentists),
    }))
  }

  return currentJob.value
    ? [
        {
          key: currentJob.value.jobId,
          provider: formatProviderLabel(currentJob.value.provider),
          tone: getProviderTone(currentJob.value.provider),
          status: formatStatusLabel(currentJob.value.status),
          total: formatDentistCount(currentJob.value.totalDentists),
        },
      ]
    : []
})

function resetProviderErrors(provider?: CrawlProvider) {
  if (provider) {
    providerErrors[provider] = {}
    return
  }

  providerErrors.odontoprev = {}
  providerErrors.hapvida = {}
  providerErrors.amil = {}
  providerErrors.sulamerica = {}
}

function clearProviderLoadError(provider: CrawlProvider) {
  providerLoadErrors[provider] = ''
}

async function handleCatalogFailure(
  provider: CrawlProvider,
  error: unknown,
  fallbackMessage: string,
) {
  if (await handleUnauthorized(error)) {
    return
  }

  const message = isApiError(error) ? error.message : fallbackMessage
  providerLoadErrors[provider] = message

  toast.add({
    severity: 'error',
    summary: message,
    life: 4000,
  })
}

function trimValue(value: string) {
  return value.trim()
}

async function loadMunicipalityOptions(stateCode: string) {
  municipalityLoadError.value = ''

  if (municipalityOptionsByState[stateCode]) {
    municipalityOptions.value = municipalityOptionsByState[stateCode]
    return
  }

  const currentRequestId = ++municipalityRequestId
  isLoadingMunicipalities.value = true

  try {
    const options = await getMunicipalitiesByState(stateCode)

    if (currentRequestId !== municipalityRequestId || selectedState.value?.code !== stateCode) {
      return
    }

    municipalityOptionsByState[stateCode] = options
    municipalityOptions.value = options
  } catch {
    if (currentRequestId !== municipalityRequestId || selectedState.value?.code !== stateCode) {
      return
    }

    municipalityOptions.value = []
    municipalityLoadError.value = 'Nao foi possivel carregar os municipios desta UF.'
  } finally {
    if (currentRequestId === municipalityRequestId) {
      isLoadingMunicipalities.value = false
    }
  }
}

function handleOdontoprevNetworkChange(value: string | null) {
  odontoprevForm.codigoRede = value ?? ''

  if (odontoprevForm.codigoRede) {
    odontoprevForm.codigoPlano = ''
  }
}

function handleOdontoprevPlanChange(value: string | null) {
  odontoprevForm.codigoPlano = value ?? ''

  if (odontoprevForm.codigoPlano) {
    odontoprevForm.codigoRede = ''
  }
}

function normalizeCatalogValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase()
}

function findMatchingCatalogOption(options: SelectOption[], value: string) {
  const normalizedValue = normalizeCatalogValue(value)

  return (
    options.find(
      (option) =>
        normalizeCatalogValue(option.codigo) === normalizedValue ||
        normalizeCatalogValue(option.nome) === normalizedValue,
    ) ?? null
  )
}

function createAmilPlanKey(option: Pick<AmilPlanOption, 'codigoRede' | 'codigoPlano'>) {
  return `${option.codigoRede}::${option.codigoPlano ?? ''}`
}

function formatAmilPlanDisplay(option: Pick<AmilPlanOption, 'nome' | 'tipo' | 'linha'>) {
  if (option.tipo === 'rede') {
    return `${option.nome} · Rede`
  }

  return option.linha ? `${option.nome} · ${option.linha}` : `${option.nome} · Plano`
}

function getHapvidaResolvedCity() {
  const currentCity = trimValue(city.value)

  if (!currentCity) {
    return ''
  }

  if (hapvidaCatalog.cities.length === 0) {
    return currentCity
  }

  return findMatchingCatalogOption(hapvidaCatalog.cities, currentCity)?.codigo ?? ''
}

const isHapvidaCityCompatible = computed(() => {
  if (!selectedProviders.value.includes('hapvida') || !trimValue(city.value) || hapvidaCatalog.cities.length === 0) {
    return true
  }

  return Boolean(findMatchingCatalogOption(hapvidaCatalog.cities, city.value))
})

const isSulamericaCityCompatible = computed(() => {
  if (
    !selectedProviders.value.includes('sulamerica') ||
    !trimValue(city.value) ||
    sulamericaCatalog.cities.length === 0
  ) {
    return true
  }

  const currentCity = normalizeCatalogValue(city.value)

  return sulamericaCatalog.cities.some((option) => normalizeCatalogValue(option.codigo) === currentCity)
})

function getAmilResolvedCity() {
  const currentCity = trimValue(city.value)

  if (!currentCity) {
    return ''
  }

  if (amilCatalog.cities.length === 0) {
    return currentCity
  }

  return findMatchingCatalogOption(amilCatalog.cities, currentCity)?.codigo ?? ''
}

const isAmilCityCompatible = computed(() => {
  if (!selectedProviders.value.includes('amil') || !trimValue(city.value) || amilCatalog.cities.length === 0) {
    return true
  }

  return Boolean(findMatchingCatalogOption(amilCatalog.cities, city.value))
})

function resetHapvidaProductsAndBelow() {
  hapvidaForm.produto = DEFAULT_HAPVIDA_PRODUTO
  hapvidaForm.servico = DEFAULT_HAPVIDA_SERVICO
  hapvidaForm.especialidade = DEFAULT_HAPVIDA_ESPECIALIDADE
  hapvidaForm.bairro = DEFAULT_HAPVIDA_BAIRRO
  hapvidaCatalog.products = [{ codigo: DEFAULT_HAPVIDA_PRODUTO, nome: DEFAULT_HAPVIDA_PRODUTO }]
  hapvidaCatalog.states = []
  hapvidaCatalog.cities = []
  hapvidaCatalog.services = [{ codigo: DEFAULT_HAPVIDA_SERVICO, nome: DEFAULT_HAPVIDA_SERVICO }]
  hapvidaCatalog.specialties = [
    { codigo: DEFAULT_HAPVIDA_ESPECIALIDADE, nome: DEFAULT_HAPVIDA_ESPECIALIDADE },
  ]
  hapvidaCatalog.neighborhoods = [{ codigo: DEFAULT_HAPVIDA_BAIRRO, nome: DEFAULT_HAPVIDA_BAIRRO }]
}

function resetHapvidaStatesAndBelow() {
  hapvidaForm.servico = DEFAULT_HAPVIDA_SERVICO
  hapvidaForm.especialidade = DEFAULT_HAPVIDA_ESPECIALIDADE
  hapvidaForm.bairro = DEFAULT_HAPVIDA_BAIRRO
  hapvidaCatalog.states = []
  hapvidaCatalog.cities = []
  hapvidaCatalog.services = [{ codigo: DEFAULT_HAPVIDA_SERVICO, nome: DEFAULT_HAPVIDA_SERVICO }]
  hapvidaCatalog.specialties = [
    { codigo: DEFAULT_HAPVIDA_ESPECIALIDADE, nome: DEFAULT_HAPVIDA_ESPECIALIDADE },
  ]
  hapvidaCatalog.neighborhoods = [{ codigo: DEFAULT_HAPVIDA_BAIRRO, nome: DEFAULT_HAPVIDA_BAIRRO }]
}

function resetHapvidaServicesAndBelow() {
  hapvidaForm.servico = DEFAULT_HAPVIDA_SERVICO
  hapvidaForm.especialidade = DEFAULT_HAPVIDA_ESPECIALIDADE
  hapvidaForm.bairro = DEFAULT_HAPVIDA_BAIRRO
  hapvidaCatalog.services = [{ codigo: DEFAULT_HAPVIDA_SERVICO, nome: DEFAULT_HAPVIDA_SERVICO }]
  hapvidaCatalog.specialties = [
    { codigo: DEFAULT_HAPVIDA_ESPECIALIDADE, nome: DEFAULT_HAPVIDA_ESPECIALIDADE },
  ]
  hapvidaCatalog.neighborhoods = [{ codigo: DEFAULT_HAPVIDA_BAIRRO, nome: DEFAULT_HAPVIDA_BAIRRO }]
}

function resetHapvidaSpecialtiesAndBelow() {
  hapvidaForm.especialidade = DEFAULT_HAPVIDA_ESPECIALIDADE
  hapvidaForm.bairro = DEFAULT_HAPVIDA_BAIRRO
  hapvidaCatalog.specialties = [
    { codigo: DEFAULT_HAPVIDA_ESPECIALIDADE, nome: DEFAULT_HAPVIDA_ESPECIALIDADE },
  ]
  hapvidaCatalog.neighborhoods = [{ codigo: DEFAULT_HAPVIDA_BAIRRO, nome: DEFAULT_HAPVIDA_BAIRRO }]
}

function resetHapvidaNeighborhoods() {
  hapvidaForm.bairro = DEFAULT_HAPVIDA_BAIRRO
  hapvidaCatalog.neighborhoods = [{ codigo: DEFAULT_HAPVIDA_BAIRRO, nome: DEFAULT_HAPVIDA_BAIRRO }]
}

function resetAmilStatesAndBelow() {
  amilForm.bairro = DEFAULT_AMIL_BAIRRO
  amilForm.especialidade = DEFAULT_AMIL_ESPECIALIDADE
  amilCatalog.states = []
  amilCatalog.cities = []
  amilCatalog.neighborhoods = [{ codigo: DEFAULT_AMIL_BAIRRO, nome: DEFAULT_AMIL_BAIRRO }]
  amilCatalog.specialties = [{ codigo: DEFAULT_AMIL_ESPECIALIDADE, nome: DEFAULT_AMIL_ESPECIALIDADE }]
}

function resetAmilCitiesAndBelow() {
  amilForm.bairro = DEFAULT_AMIL_BAIRRO
  amilForm.especialidade = DEFAULT_AMIL_ESPECIALIDADE
  amilCatalog.cities = []
  amilCatalog.neighborhoods = [{ codigo: DEFAULT_AMIL_BAIRRO, nome: DEFAULT_AMIL_BAIRRO }]
  amilCatalog.specialties = [{ codigo: DEFAULT_AMIL_ESPECIALIDADE, nome: DEFAULT_AMIL_ESPECIALIDADE }]
}

function resetAmilNeighborhoodsAndBelow() {
  amilForm.bairro = DEFAULT_AMIL_BAIRRO
  amilForm.especialidade = DEFAULT_AMIL_ESPECIALIDADE
  amilCatalog.neighborhoods = [{ codigo: DEFAULT_AMIL_BAIRRO, nome: DEFAULT_AMIL_BAIRRO }]
  amilCatalog.specialties = [{ codigo: DEFAULT_AMIL_ESPECIALIDADE, nome: DEFAULT_AMIL_ESPECIALIDADE }]
}

function resetAmilSpecialties() {
  amilForm.especialidade = DEFAULT_AMIL_ESPECIALIDADE
  amilCatalog.specialties = [{ codigo: DEFAULT_AMIL_ESPECIALIDADE, nome: DEFAULT_AMIL_ESPECIALIDADE }]
}

function resetSulamericaPlansAndBelow() {
  sulamericaForm.plano = DEFAULT_SULAMERICA_PLANO
  sulamericaCatalog.plans = [{ codigo: DEFAULT_SULAMERICA_PLANO, nome: DEFAULT_SULAMERICA_PLANO }]
  sulamericaCatalog.cities = []
}

function resetSulamericaCitiesAndBelow() {
  sulamericaCatalog.cities = []
}

function resetOdontoprevForm() {
  odontoprevForm.codigoRede = DEFAULT_ODONTOPREV_REDE
  odontoprevForm.codigoPlano = ''
  odontoprevForm.codigoEspecialidade = ''
  odontoprevForm.isEspecialista = false
  odontoprevForm.isAtendeWhatsApp = false
  odontoprevForm.nomeDentista = ''
  odontoprevForm.acessibilidade = false
  odontoprevForm.idioma = ''
}

function resetProviderFilters() {
  resetOdontoprevForm()

  hapvidaForm.tipoContrato = DEFAULT_HAPVIDA_TIPO_CONTRATO
  hapvidaForm.produto = DEFAULT_HAPVIDA_PRODUTO
  hapvidaForm.servico = DEFAULT_HAPVIDA_SERVICO
  hapvidaForm.especialidade = DEFAULT_HAPVIDA_ESPECIALIDADE
  hapvidaForm.bairro = DEFAULT_HAPVIDA_BAIRRO

  amilForm.selectedPlanKey = DEFAULT_AMIL_PLAN_KEY
  amilForm.bairro = DEFAULT_AMIL_BAIRRO
  amilForm.especialidade = DEFAULT_AMIL_ESPECIALIDADE

  sulamericaForm.produto = DEFAULT_SULAMERICA_PRODUTO
  sulamericaForm.plano = DEFAULT_SULAMERICA_PLANO
  sulamericaForm.horarioInicial = ''
  sulamericaForm.horarioFinal = ''
}

function clearProviderFeedback() {
  providerLoadErrors.odontoprev = ''
  providerLoadErrors.hapvida = ''
  providerLoadErrors.amil = ''
  providerLoadErrors.sulamerica = ''
  resetProviderErrors()
}

function isProviderCatalogLoading(provider: CrawlProvider) {
  if (provider === 'odontoprev') {
    return loadingState.odontoprev.filters
  }

  if (provider === 'hapvida') {
    return Object.values(loadingState.hapvida).some(Boolean)
  }

  if (provider === 'amil') {
    return Object.values(loadingState.amil).some(Boolean)
  }

  return Object.values(loadingState.sulamerica).some(Boolean)
}

function isProviderPanelActive(provider: CrawlProvider) {
  return activeProviderPanel.value === provider
}

async function loadOdontoprevCatalog(force = false) {
  if (!authStore.token || (!force && (loadingState.odontoprev.filters || odontoprevCatalog.loaded))) {
    return
  }

  loadingState.odontoprev.filters = true
  clearProviderLoadError('odontoprev')

  try {
    const response = await getOdontoprevFilters(authStore.token)

    odontoprevCatalog.redes = response.redes
    odontoprevCatalog.planos = response.planos
    odontoprevCatalog.especialidades = response.especialidades
    odontoprevCatalog.loaded = true
  } catch (error) {
    await handleCatalogFailure('odontoprev', error, 'Nao foi possivel carregar os filtros da OdontoPrev.')
  } finally {
    loadingState.odontoprev.filters = false
  }
}

async function loadHapvidaContractTypeOptions(force = false) {
  if (!authStore.token || (!force && (loadingState.hapvida.contractTypes || hapvidaCatalog.contractTypes.length > 0))) {
    return
  }

  loadingState.hapvida.contractTypes = true
  clearProviderLoadError('hapvida')

  try {
    hapvidaCatalog.contractTypes = await getHapvidaContractTypes(authStore.token)
  } catch (error) {
    await handleCatalogFailure('hapvida', error, 'Nao foi possivel carregar os filtros da Hapvida.')
  } finally {
    loadingState.hapvida.contractTypes = false
  }
}

async function loadHapvidaProductsOptions() {
  if (!authStore.token || !hapvidaForm.tipoContrato) {
    return
  }

  loadingState.hapvida.products = true
  clearProviderLoadError('hapvida')

  try {
    hapvidaCatalog.products = await getHapvidaProducts(
      { tipoContrato: hapvidaForm.tipoContrato },
      authStore.token,
    )
  } catch (error) {
    await handleCatalogFailure('hapvida', error, 'Nao foi possivel carregar os produtos da Hapvida.')
  } finally {
    loadingState.hapvida.products = false
  }
}

async function loadHapvidaStateOptions() {
  if (!authStore.token || !hapvidaForm.produto) {
    return
  }

  loadingState.hapvida.states = true
  clearProviderLoadError('hapvida')

  try {
    hapvidaCatalog.states = await getHapvidaStates({ produto: hapvidaForm.produto }, authStore.token)
  } catch (error) {
    await handleCatalogFailure('hapvida', error, 'Nao foi possivel carregar as UFs da Hapvida.')
  } finally {
    loadingState.hapvida.states = false
  }
}

async function loadHapvidaCityOptions() {
  if (!authStore.token || !hapvidaForm.produto || !selectedState.value?.code) {
    return
  }

  loadingState.hapvida.cities = true
  clearProviderLoadError('hapvida')

  try {
    hapvidaCatalog.cities = await getHapvidaCities(
      { produto: hapvidaForm.produto, uf: selectedState.value.code },
      authStore.token,
    )

    if (getHapvidaResolvedCity()) {
      await loadHapvidaServiceOptions()
    }
  } catch (error) {
    await handleCatalogFailure('hapvida', error, 'Nao foi possivel carregar as cidades da Hapvida.')
  } finally {
    loadingState.hapvida.cities = false
  }
}

async function loadHapvidaServiceOptions() {
  if (!authStore.token || !hapvidaForm.produto || !selectedState.value?.code || !trimValue(city.value)) {
    return
  }

  const resolvedCity = getHapvidaResolvedCity()

  if (!resolvedCity) {
    hapvidaCatalog.services = []
    return
  }

  loadingState.hapvida.services = true
  clearProviderLoadError('hapvida')

  try {
    hapvidaCatalog.services = await getHapvidaServices(
      {
        produto: hapvidaForm.produto,
        uf: selectedState.value.code,
        cidade: resolvedCity,
      },
      authStore.token,
    )
  } catch (error) {
    await handleCatalogFailure('hapvida', error, 'Nao foi possivel carregar os servicos da Hapvida.')
  } finally {
    loadingState.hapvida.services = false
  }
}

async function loadHapvidaSpecialtyOptions() {
  if (
    !authStore.token ||
    !hapvidaForm.produto ||
    !selectedState.value?.code ||
    !trimValue(city.value) ||
    !hapvidaForm.servico
  ) {
    return
  }

  const resolvedCity = getHapvidaResolvedCity()

  if (!resolvedCity) {
    hapvidaCatalog.specialties = []
    return
  }

  loadingState.hapvida.specialties = true
  clearProviderLoadError('hapvida')

  try {
    hapvidaCatalog.specialties = await getHapvidaSpecialties(
      {
        produto: hapvidaForm.produto,
        uf: selectedState.value.code,
        cidade: resolvedCity,
        servico: hapvidaForm.servico,
      },
      authStore.token,
    )
  } catch (error) {
    await handleCatalogFailure('hapvida', error, 'Nao foi possivel carregar as especialidades da Hapvida.')
  } finally {
    loadingState.hapvida.specialties = false
  }
}

async function loadHapvidaNeighborhoodOptions() {
  if (
    !authStore.token ||
    !hapvidaForm.produto ||
    !selectedState.value?.code ||
    !trimValue(city.value) ||
    !hapvidaForm.servico ||
    !hapvidaForm.especialidade
  ) {
    return
  }

  const resolvedCity = getHapvidaResolvedCity()

  if (!resolvedCity) {
    hapvidaCatalog.neighborhoods = []
    return
  }

  loadingState.hapvida.neighborhoods = true
  clearProviderLoadError('hapvida')

  try {
    hapvidaCatalog.neighborhoods = await getHapvidaNeighborhoods(
      {
        produto: hapvidaForm.produto,
        uf: selectedState.value.code,
        cidade: resolvedCity,
        servico: hapvidaForm.servico,
        especialidade: hapvidaForm.especialidade,
      },
      authStore.token,
    )
  } catch (error) {
    await handleCatalogFailure('hapvida', error, 'Nao foi possivel carregar os bairros da Hapvida.')
  } finally {
    loadingState.hapvida.neighborhoods = false
  }
}

async function loadAmilPlanOptions() {
  if (!authStore.token) {
    return
  }

  loadingState.amil.plans = true
  clearProviderLoadError('amil')

  try {
    const plans = await getAmilPlans({}, authStore.token)

    amilCatalog.plans = plans.map((option) => ({
      ...option,
      key: createAmilPlanKey(option),
      displayName: formatAmilPlanDisplay(option),
    }))
  } catch (error) {
    await handleCatalogFailure('amil', error, 'Nao foi possivel carregar os catalogos da Amil.')
  } finally {
    loadingState.amil.plans = false
  }
}

async function loadAmilStateOptions() {
  if (!authStore.token || !selectedAmilPlan.value) {
    return
  }

  loadingState.amil.states = true
  clearProviderLoadError('amil')

  try {
    amilCatalog.states = await getAmilStates(
      {
        codigoRede: selectedAmilPlan.value.codigoRede,
        codigoPlano: selectedAmilPlan.value.codigoPlano ?? undefined,
      },
      authStore.token,
    )
  } catch (error) {
    await handleCatalogFailure('amil', error, 'Nao foi possivel carregar as UFs da Amil.')
  } finally {
    loadingState.amil.states = false
  }
}

async function loadAmilCityOptions() {
  if (!authStore.token || !selectedAmilPlan.value || !selectedState.value?.code) {
    return
  }

  loadingState.amil.cities = true
  clearProviderLoadError('amil')

  try {
    amilCatalog.cities = await getAmilCities(
      {
        codigoRede: selectedAmilPlan.value.codigoRede,
        codigoPlano: selectedAmilPlan.value.codigoPlano ?? undefined,
        uf: selectedState.value.code,
      },
      authStore.token,
    )

    if (getAmilResolvedCity()) {
      await loadAmilNeighborhoodOptions()
    }
  } catch (error) {
    await handleCatalogFailure('amil', error, 'Nao foi possivel carregar os municipios da Amil.')
  } finally {
    loadingState.amil.cities = false
  }
}

async function loadAmilNeighborhoodOptions() {
  if (!authStore.token || !selectedAmilPlan.value || !selectedState.value?.code || !trimValue(city.value)) {
    return
  }

  const resolvedCity = getAmilResolvedCity()

  if (!resolvedCity) {
    amilCatalog.neighborhoods = []
    return
  }

  loadingState.amil.neighborhoods = true
  clearProviderLoadError('amil')

  try {
    amilCatalog.neighborhoods = await getAmilNeighborhoods(
      {
        codigoRede: selectedAmilPlan.value.codigoRede,
        codigoPlano: selectedAmilPlan.value.codigoPlano ?? undefined,
        uf: selectedState.value.code,
        cidade: resolvedCity,
      },
      authStore.token,
    )

    const defaultNeighborhood =
      amilCatalog.neighborhoods.find(
        (option) => normalizeCatalogValue(option.codigo) === 'TODOS OS BAIRROS',
      ) ?? null

    if (!amilForm.bairro && defaultNeighborhood) {
      amilForm.bairro = defaultNeighborhood.codigo
    }
  } catch (error) {
    await handleCatalogFailure('amil', error, 'Nao foi possivel carregar os bairros da Amil.')
  } finally {
    loadingState.amil.neighborhoods = false
  }
}

async function loadAmilSpecialtyOptions() {
  if (
    !authStore.token ||
    !selectedAmilPlan.value ||
    !selectedState.value?.code ||
    !trimValue(city.value) ||
    !amilForm.bairro
  ) {
    return
  }

  const resolvedCity = getAmilResolvedCity()

  if (!resolvedCity) {
    amilCatalog.specialties = []
    return
  }

  loadingState.amil.specialties = true
  clearProviderLoadError('amil')

  try {
    amilCatalog.specialties = await getAmilSpecialties(
      {
        codigoRede: selectedAmilPlan.value.codigoRede,
        codigoPlano: selectedAmilPlan.value.codigoPlano ?? undefined,
        uf: selectedState.value.code,
        cidade: resolvedCity,
        bairro: amilForm.bairro,
        tipoServico: 'DENTAL',
      },
      authStore.token,
    )
  } catch (error) {
    await handleCatalogFailure('amil', error, 'Nao foi possivel carregar as especialidades da Amil.')
  } finally {
    loadingState.amil.specialties = false
  }
}

async function loadSulamericaProductOptions(force = false) {
  if (!authStore.token || (!force && (loadingState.sulamerica.products || sulamericaCatalog.products.length > 0))) {
    return
  }

  loadingState.sulamerica.products = true
  clearProviderLoadError('sulamerica')

  try {
    sulamericaCatalog.products = await getSulamericaProducts(authStore.token)
  } catch (error) {
    await handleCatalogFailure('sulamerica', error, 'Nao foi possivel carregar os produtos da SulAmerica.')
  } finally {
    loadingState.sulamerica.products = false
  }
}

async function loadSulamericaHourOptions(force = false) {
  if (!authStore.token || (!force && (loadingState.sulamerica.hours || sulamericaCatalog.hours.length > 0))) {
    return
  }

  loadingState.sulamerica.hours = true
  clearProviderLoadError('sulamerica')

  try {
    sulamericaCatalog.hours = await getSulamericaHours(authStore.token)
  } catch (error) {
    await handleCatalogFailure('sulamerica', error, 'Nao foi possivel carregar os horarios da SulAmerica.')
  } finally {
    loadingState.sulamerica.hours = false
  }
}

async function loadSulamericaPlanOptions() {
  if (!authStore.token || !sulamericaForm.produto) {
    return
  }

  loadingState.sulamerica.plans = true
  clearProviderLoadError('sulamerica')

  try {
    sulamericaCatalog.plans = await getSulamericaPlans(
      { produto: sulamericaForm.produto },
      authStore.token,
    )
  } catch (error) {
    await handleCatalogFailure('sulamerica', error, 'Nao foi possivel carregar os planos da SulAmerica.')
  } finally {
    loadingState.sulamerica.plans = false
  }
}

async function loadSulamericaCityOptions() {
  if (!authStore.token || !selectedState.value?.code || !sulamericaForm.produto || !sulamericaForm.plano) {
    return
  }

  loadingState.sulamerica.cities = true
  clearProviderLoadError('sulamerica')

  try {
    sulamericaCatalog.cities = await getSulamericaCities(
      {
        uf: selectedState.value.code,
        produto: sulamericaForm.produto,
        plano: sulamericaForm.plano,
      },
      authStore.token,
    )

  } catch (error) {
    await handleCatalogFailure('sulamerica', error, 'Nao foi possivel carregar as cidades da SulAmerica.')
  } finally {
    loadingState.sulamerica.cities = false
  }
}

async function retryHapvidaCatalog() {
  await loadHapvidaContractTypeOptions(true)

  if (hapvidaForm.tipoContrato) {
    await loadHapvidaProductsOptions()
  }

  if (hapvidaForm.produto) {
    await loadHapvidaStateOptions()

    if (selectedState.value?.code) {
      await loadHapvidaCityOptions()
    }
  }

  if (hapvidaForm.servico) {
    await loadHapvidaSpecialtyOptions()
  }

  if (hapvidaForm.especialidade) {
    await loadHapvidaNeighborhoodOptions()
  }
}

async function retryAmilCatalog() {
  await loadAmilPlanOptions()

  if (selectedAmilPlan.value) {
    await loadAmilStateOptions()

    if (selectedState.value?.code) {
      await loadAmilCityOptions()
    }
  }

  if (amilForm.bairro) {
    await loadAmilSpecialtyOptions()
  }
}

async function retrySulamericaCatalog() {
  await Promise.all([loadSulamericaProductOptions(true), loadSulamericaHourOptions(true)])

  if (sulamericaForm.produto) {
    await loadSulamericaPlanOptions()
  }

  if (sulamericaForm.plano && selectedState.value?.code) {
    await loadSulamericaCityOptions()
  }
}

async function handleRetryProviderCatalog(provider: CrawlProvider) {
  if (!authStore.token || isProviderCatalogLoading(provider)) {
    return
  }

  clearProviderLoadError(provider)

  if (provider === 'odontoprev') {
    await loadOdontoprevCatalog(true)
    return
  }

  if (provider === 'hapvida') {
    await retryHapvidaCatalog()
    return
  }

  if (provider === 'amil') {
    await retryAmilCatalog()
    return
  }

  await retrySulamericaCatalog()
}

function handleOpenProviderPanel(provider: CrawlProvider) {
  activeProviderPanel.value = provider

  if (provider === 'odontoprev') {
    void loadOdontoprevCatalog()
  }

  if (provider === 'hapvida') {
    void loadHapvidaContractTypeOptions()
  }

  if (provider === 'amil') {
    void loadAmilPlanOptions()
  }

  if (provider === 'sulamerica') {
    void loadSulamericaProductOptions()
    void loadSulamericaHourOptions()
  }
}

function validateProviderFilters() {
  resetProviderErrors()

  for (const provider of selectedProviders.value) {
    if (provider === 'odontoprev') {
      const hasNetwork = Boolean(odontoprevForm.codigoRede)
      const hasPlan = Boolean(odontoprevForm.codigoPlano)

      if (hasNetwork && hasPlan) {
        providerErrors.odontoprev.selection = 'Selecione rede ou plano, nao os dois.'
      }
    }
  }

  return (
    Object.keys(providerErrors.odontoprev).length === 0 &&
    Object.keys(providerErrors.hapvida).length === 0 &&
    Object.keys(providerErrors.amil).length === 0 &&
    Object.keys(providerErrors.sulamerica).length === 0
  )
}

function hasProviderOptions(options: Record<string, unknown>) {
  return Object.keys(options).length > 0
}

function buildProviderOptionsPayload(options: StartCrawlUiOptions = {}): QueueBatchProviderOptions | undefined {
  const nextOptions: QueueBatchProviderOptions = {}
  const providers = options.providers ?? selectedProviders.value
  const shouldForceRefresh = (provider: CrawlProvider) =>
    Boolean(options.forceRefresh && (options.preferBatch || provider === 'amil'))

  if (providers.includes('odontoprev')) {
    const odontoprevOptions: OdontoprevProviderOptions = {}

    if (odontoprevForm.codigoPlano) {
      odontoprevOptions.codigoPlano = odontoprevForm.codigoPlano
    } else if (odontoprevForm.codigoRede && odontoprevForm.codigoRede !== DEFAULT_ODONTOPREV_REDE) {
      odontoprevOptions.codigoRede = odontoprevForm.codigoRede
    }

    if (shouldForceRefresh('odontoprev')) {
      odontoprevOptions.forceRefresh = true
    }

    if (odontoprevForm.codigoEspecialidade) {
      odontoprevOptions.codigoEspecialidade = odontoprevForm.codigoEspecialidade
    }

    if (odontoprevForm.isEspecialista) {
      odontoprevOptions.isEspecialista = true
    }

    if (odontoprevForm.isAtendeWhatsApp) {
      odontoprevOptions.isAtendeWhatsApp = true
    }

    if (trimValue(odontoprevForm.nomeDentista)) {
      odontoprevOptions.nomeDentista = trimValue(odontoprevForm.nomeDentista)
    }

    if (odontoprevForm.acessibilidade) {
      odontoprevOptions.acessibilidade = 'S'
    }

    if (trimValue(odontoprevForm.idioma)) {
      odontoprevOptions.idioma = trimValue(odontoprevForm.idioma)
    }

    if (hasProviderOptions(odontoprevOptions)) {
      nextOptions.odontoprev = odontoprevOptions
    }
  }

  if (providers.includes('hapvida')) {
    const hapvidaOptions: HapvidaProviderOptions = {
      ...(hapvidaForm.tipoContrato && hapvidaForm.tipoContrato !== DEFAULT_HAPVIDA_TIPO_CONTRATO
        ? { tipoContrato: hapvidaForm.tipoContrato }
        : {}),
      ...(hapvidaForm.produto && hapvidaForm.produto !== DEFAULT_HAPVIDA_PRODUTO
        ? { produto: hapvidaForm.produto }
        : {}),
      ...(hapvidaForm.servico && hapvidaForm.servico !== DEFAULT_HAPVIDA_SERVICO
        ? { servico: hapvidaForm.servico }
        : {}),
      ...(hapvidaForm.especialidade && hapvidaForm.especialidade !== DEFAULT_HAPVIDA_ESPECIALIDADE
        ? { especialidade: hapvidaForm.especialidade }
        : {}),
      ...(hapvidaForm.bairro && hapvidaForm.bairro !== DEFAULT_HAPVIDA_BAIRRO
        ? { bairro: hapvidaForm.bairro }
        : {}),
      ...(shouldForceRefresh('hapvida') ? { forceRefresh: true } : {}),
    }

    if (hasProviderOptions(hapvidaOptions)) {
      nextOptions.hapvida = hapvidaOptions
    }
  }

  if (providers.includes('amil')) {
    const amilOptions: AmilProviderOptions = {}

    if (selectedAmilPlan.value && amilForm.selectedPlanKey !== DEFAULT_AMIL_PLAN_KEY) {
      amilOptions.codigoRede = selectedAmilPlan.value.codigoRede

      if (selectedAmilPlan.value.codigoPlano) {
        amilOptions.codigoPlano = selectedAmilPlan.value.codigoPlano
      }
    } else if (amilForm.selectedPlanKey && amilForm.selectedPlanKey !== DEFAULT_AMIL_PLAN_KEY) {
      const [codigoRede, codigoPlano] = amilForm.selectedPlanKey.split('::')
      amilOptions.codigoRede = codigoRede

      if (codigoPlano) {
        amilOptions.codigoPlano = codigoPlano
      }
    }

    if (amilForm.bairro && amilForm.bairro !== DEFAULT_AMIL_BAIRRO) {
      amilOptions.bairro = amilForm.bairro
    }

    if (amilForm.especialidade && amilForm.especialidade !== DEFAULT_AMIL_ESPECIALIDADE) {
      amilOptions.especialidade = amilForm.especialidade
    }

    if (shouldForceRefresh('amil')) {
      amilOptions.forceRefresh = true
    }

    if (hasProviderOptions(amilOptions)) {
      nextOptions.amil = amilOptions
    }
  }

  if (providers.includes('sulamerica')) {
    const sulamericaOptions: SulamericaProviderOptions = {
      ...(sulamericaForm.produto && sulamericaForm.produto !== DEFAULT_SULAMERICA_PRODUTO
        ? { produto: sulamericaForm.produto }
        : {}),
      ...(sulamericaForm.plano && sulamericaForm.plano !== DEFAULT_SULAMERICA_PLANO
        ? { plano: sulamericaForm.plano }
        : {}),
      ...(sulamericaForm.horarioInicial ? { horarioInicial: sulamericaForm.horarioInicial } : {}),
      ...(sulamericaForm.horarioFinal ? { horarioFinal: sulamericaForm.horarioFinal } : {}),
      ...(shouldForceRefresh('sulamerica') ? { forceRefresh: true } : {}),
    }

    if (hasProviderOptions(sulamericaOptions)) {
      nextOptions.sulamerica = sulamericaOptions
    }
  }

  return Object.keys(nextOptions).length > 0 ? nextOptions : undefined
}

function formatStatusLabel(status: CrawlBatchStatus | CrawlJobStatus | null | undefined) {
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

function formatDentistCount(total: number | null) {
  if (total === null) {
    return 'Contagem pendente'
  }

  return `${total} dentista${total === 1 ? '' : 's'}`
}

function formatProviderLabel(value: string) {
  return providerOptions.find((option) => option.value === value)?.label ?? value
}

function getProviderTone(value: CrawlProvider) {
  if (value === 'odontoprev') {
    return 'provider-tone--odontoprev'
  }

  if (value === 'hapvida') {
    return 'provider-tone--hapvida'
  }

  if (value === 'amil') {
    return 'provider-tone--amil'
  }

  return 'provider-tone--sulamerica'
}

function formatProfessionalType(value: string | null) {
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

function getDentistAddress(dentist: (typeof displayDentists.value)[number]) {
  return [dentist.logradouro, dentist.bairro, `${dentist.cidade}, ${dentist.uf}`]
    .filter((value) => Boolean(value))
    .join(' • ')
}

function buildDentistHighlights(dentist: (typeof displayDentists.value)[number]) {
  return [
    dentist.cro ? `CRO ${dentist.cro}` : null,
    formatProfessionalType(dentist.tipoPessoa),
    dentist.tipoPrestador,
  ].filter((value): value is string => Boolean(value))
}

function buildDentistLegendIcons(dentist: (typeof displayDentists.value)[number]): DentistLegendIcon[] {
  return [
    dentist.comunicacaoEventosAdversos
      ? {
          code: 'N',
          label: 'Comunicacao de eventos adversos',
        }
      : null,
    dentist.posGraduadoLatoSenso
      ? {
          code: 'P',
          label: 'Profissional com especializacao',
        }
      : null,
    dentist.residencia
      ? {
          code: 'R',
          label: 'Profissional com residencia',
        }
      : null,
    dentist.tituloEspecialista || dentist.possuiTituloEspecialidade
      ? {
          code: 'E',
          label: 'Titulo de especialista',
        }
      : null,
    dentist.qualidadeMonitorada
      ? {
          code: 'Q',
          label: 'Qualidade monitorada',
        }
      : null,
    dentist.programaAcreditacao
      ? {
          code: 'A',
          label: 'Programa de acreditacao',
        }
      : null,
    dentist.certificacoesEntidadesGestoras
      ? {
          code: 'G',
          label: 'Certificacoes de entidades gestoras',
        }
      : null,
    dentist.certificacaoIso9001
      ? {
          code: 'I',
          label: 'Certificacao ISO 9001',
        }
      : null,
    dentist.doutoradoPosGraduacao
      ? {
          code: 'D',
          label: 'Profissional com doutorado ou pos-doutorado',
        }
      : null,
  ].filter((value): value is DentistLegendIcon => Boolean(value))
}

function normalizeSpecialtyLabel(specialty: DentistSpecialty) {
  if (typeof specialty === 'string') {
    return specialty
  }

  return specialty.descricaoEspecialidade ?? ''
}

function getDentistSpecialties(dentist: (typeof displayDentists.value)[number]) {
  return dentist.especialidades
    .map((specialty) => normalizeSpecialtyLabel(specialty))
    .filter((value): value is string => Boolean(value))
}

function getDentistAreas(dentist: (typeof displayDentists.value)[number]) {
  return String(dentist.area ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is string => Boolean(value))
}

function hasDentistMetadata(dentist: (typeof displayDentists.value)[number]) {
  return (
    buildDentistHighlights(dentist).length > 0 ||
    dentist.acessibilidadeCadeirante
  )
}

function hasDentistQualificationLegends(dentist: (typeof displayDentists.value)[number]) {
  return buildDentistLegendIcons(dentist).length > 0
}

function formatBoolean(value: boolean | null | undefined) {
  return value ? 'Sim' : 'Nao'
}

function formatCnpj(value: string | null) {
  if (!value) {
    return ''
  }

  const digits = value.replace(/\D/g, '')

  if (digits.length !== 14) {
    return value
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function exportDentistsAsCsv() {
  if (typeof window === 'undefined' || displayDentists.value.length === 0) {
    return
  }

  const headers = [
    'provider',
    'nome',
    'nome_fantasia',
    'cro',
    'cnpj',
    'tipo_pessoa',
    'tipo_prestador',
    'area',
    'telefone',
    'whatsapp',
    'atende_whatsapp',
    'email',
    'perfil_url',
    'logradouro',
    'bairro',
    'cep',
    'cidade',
    'uf',
    'latitude',
    'longitude',
    'especialidades',
    'titulo_especialista',
    'pos_graduacao',
    'mestrado',
    'doutorado',
    'residencia',
    'qualidade_monitorada',
    'programa_acreditacao',
    'certificacao_iso9001',
    'certificacoes_entidades_gestoras',
    'comunicacao_eventos_adversos',
    'acessibilidade_cadeirante',
  ]

  const escapeValue = (value: string | number | boolean | null | undefined) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`

  const rows = displayDentists.value.map((dentist) =>
    [
      formatProviderLabel(dentist.provider),
      dentist.nome,
      dentist.nomeFantasia,
      dentist.cro,
      formatCnpj(dentist.cnpj),
      formatProfessionalType(dentist.tipoPessoa),
      dentist.tipoPrestador,
      dentist.area,
      dentist.telefone,
      dentist.whatsapp,
      formatBoolean(dentist.atendeWhatsapp),
      dentist.email,
      dentist.boaconsultaUrl,
      dentist.logradouro,
      dentist.bairro,
      dentist.cep,
      dentist.cidade,
      dentist.uf,
      dentist.latitude,
      dentist.longitude,
      getDentistSpecialties(dentist).join(' | '),
      formatBoolean(dentist.tituloEspecialista || dentist.possuiTituloEspecialidade),
      formatBoolean(dentist.posGraduadoLatoSenso),
      formatBoolean(dentist.mestrado),
      formatBoolean(dentist.doutoradoPosGraduacao),
      formatBoolean(dentist.residencia),
      formatBoolean(dentist.qualidadeMonitorada),
      formatBoolean(dentist.programaAcreditacao),
      formatBoolean(dentist.certificacaoIso9001),
      formatBoolean(dentist.certificacoesEntidadesGestoras),
      formatBoolean(dentist.comunicacaoEventosAdversos),
      formatBoolean(dentist.acessibilidadeCadeirante),
    ]
      .map(escapeValue)
      .join(','),
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const fileName = `dentistas-${selectedProviders.value.join('-')}-${city.value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') || 'busca'}.csv`

  link.href = url
  link.download = fileName
  link.click()

  URL.revokeObjectURL(url)
}

async function loadResultsForCurrentSearch(force = false) {
  if (!authStore.token) {
    return
  }

  if (currentBatch.value && (currentBatch.value.status === 'done' || currentBatch.value.status === 'partial_failed')) {
    if (
      !force &&
      batchDentistsBatchId.value === currentBatch.value.batchId &&
      !isRefreshingBatchDentists.value
    ) {
      return
    }

    try {
      await homeSearchStore.refreshCurrentBatchDentists(authStore.token, currentBatch.value.batchId)
    } catch (error) {
      if (await handleUnauthorized(error)) {
        return
      }

      if (isApiError(error)) {
        toast.add({
          severity: 'error',
          summary: error.message,
          life: 3500,
        })
      }
    }

    return
  }

  if (currentJob.value && currentJob.value.status === 'done') {
    if (!force && dentistsJobId.value === currentJob.value.jobId && !isRefreshingDentists.value) {
      return
    }

    try {
      await homeSearchStore.refreshCurrentDentists(authStore.token, currentJob.value.jobId)
    } catch (error) {
      if (await handleUnauthorized(error)) {
        return
      }

      if (isApiError(error)) {
        toast.add({
          severity: 'error',
          summary: error.message,
          life: 3500,
        })
      }
    }
  }
}

async function handleUnauthorized(error: unknown) {
  if (!isApiError(error) || error.status !== 401) {
    return false
  }

  authStore.logout()

  toast.add({
    severity: 'warn',
    summary: 'Sua sessao expirou. Faca login novamente.',
    life: 3500,
  })

  await router.push('/login')

  return true
}

async function handleLogout() {
  stopPolling()
  authStore.logout()

  toast.add({
    severity: 'success',
    summary: 'Logout realizado com sucesso.',
    life: 3000,
  })

  await router.push('/login')
}

function handleClearScreen() {
  stopPolling()
  homeSearchStore.clearCurrentSearch()

  selectedProviders.value = []
  selectedState.value = null
  city.value = ''
  activeProviderPanel.value = null
  resultsFirst.value = 0
  lastStatus = null

  municipalityLoadError.value = ''
  municipalityOptions.value = []
  municipalityRequestId += 1
  isLoadingMunicipalities.value = false

  formError.value = ''
  formErrors.value = {}
  clearProviderFeedback()
  resetProviderFilters()

  toast.add({
    severity: 'info',
    summary: 'Tela limpa.',
    life: 2500,
  })
}

function getFailedRetryProviders() {
  if (
    currentBatch.value &&
    (currentBatch.value.status === 'partial_failed' || currentBatch.value.status === 'failed')
  ) {
    const providers = currentBatch.value.jobs
      .filter((job) => job.status === 'failed')
      .map((job) => job.provider)

    return [...new Set(providers.length > 0 ? providers : currentBatch.value.jobs.map((job) => job.provider))]
  }

  if (currentJob.value?.status === 'failed') {
    return [currentJob.value.provider]
  }

  return selectedProviders.value
}

function getSearchProviders(options: StartCrawlUiOptions) {
  return options.providers ?? selectedProviders.value
}

function getProviderFromApiError(error: unknown, providers: CrawlProvider[]) {
  if (!isApiError(error)) {
    return null
  }

  const normalizedMessage = error.message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  return (
    providers.find((provider) => {
      const normalizedLabel = formatProviderLabel(provider)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

      return normalizedMessage.includes(provider) || normalizedMessage.includes(normalizedLabel)
    }) ?? null
  )
}

function shouldRetryWithoutProvider(error: unknown, options: StartCrawlUiOptions) {
  const providers = getSearchProviders(options)
  const failedProvider = getProviderFromApiError(error, providers)

  if (!failedProvider || providers.length <= 1) {
    return null
  }

  return failedProvider
}

async function submitSearch(options: StartCrawlUiOptions = {}): Promise<SearchSubmissionResult> {
  const token = authStore.token

  if (!token) {
    await router.push('/login')
    return null
  }

  const result = await homeSearchStore.startCrawl(token, {
    preferBatch: options.preferBatch,
    providerOptions: buildProviderOptionsPayload(options),
    providers: options.providers,
  })

  if (!result) {
    return null
  }

  toast.add({
    severity: 'success',
    summary:
      result.type === 'batch'
        ? 'Lote enviado com sucesso.'
        : 'Busca enviada com sucesso.',
    detail: result.type === 'batch' ? `Batch ${result.response.batchId}` : `Job ${result.response.jobId}`,
    life: 3000,
  })

  if (result.type === 'batch') {
    await homeSearchStore.refreshCurrentBatch(token)
  } else {
    await homeSearchStore.refreshCurrentJob(token)
  }

  await loadResultsForCurrentSearch(true)

  return result
}

async function retrySearchWithoutProvider(provider: CrawlProvider, options: StartCrawlUiOptions, reason: string) {
  const providers = getSearchProviders(options).filter((value) => value !== provider)

  if (providers.length === 0) {
    return null
  }

  formError.value = ''
  formErrors.value = {}

  toast.add({
    severity: 'warn',
    summary: `${formatProviderLabel(provider)} ficou fora desta busca.`,
    detail: reason,
    life: 5000,
  })

  return submitSearch({
    ...options,
    preferBatch: true,
    providers,
  })
}

async function handleStartCrawl(options: StartCrawlUiOptions = {}) {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  if (!validateProviderFilters()) {
    toast.add({
      severity: 'warn',
      summary: 'Revise os filtros do provider selecionado.',
      life: 3500,
    })

    return
  }

  try {
    await submitSearch(options)
  } catch (error) {
    if (await handleUnauthorized(error)) {
      return
    }

    const failedProvider = shouldRetryWithoutProvider(error, options)

    if (failedProvider && isApiError(error)) {
      try {
        await retrySearchWithoutProvider(failedProvider, options, error.message)
        return
      } catch (retryError) {
        if (await handleUnauthorized(retryError)) {
          return
        }

        error = retryError
      }
    }

    if (isApiError(error) && Object.keys(error.validationErrors).length === 0) {
      toast.add({
        severity: 'error',
        summary: error.message,
        life: 3500,
      })
    }
  }
}

async function handleRetrySearch() {
  formError.value = ''
  await handleStartCrawl({
    forceRefresh: true,
    preferBatch: Boolean(
      currentBatch.value &&
        (currentBatch.value.status === 'failed' || currentBatch.value.status === 'partial_failed'),
    ),
    providers: getFailedRetryProviders(),
  })
}

async function refreshCurrentStatus() {
  if (!authStore.token) {
    return
  }

  try {
    if (currentBatchId.value) {
      await homeSearchStore.refreshCurrentBatch(authStore.token)
      return
    }

    if (currentJobId.value) {
      await homeSearchStore.refreshCurrentJob(authStore.token)
    }
  } catch (error) {
    if (await handleUnauthorized(error)) {
      return
    }

    if (isApiError(error)) {
      toast.add({
        severity: 'error',
        summary: error.message,
        life: 3500,
      })
    }
  }
}

watch(
  () => [dentistsJobId.value, batchDentistsBatchId.value],
  () => {
    resultsFirst.value = 0
  },
)

watch(
  () => [displayDentists.value.length, resultsRows.value] as const,
  ([total, rows]) => {
    if (total === 0) {
      resultsFirst.value = 0
      return
    }

    if (resultsFirst.value >= total) {
      resultsFirst.value = Math.max(0, Math.floor((total - 1) / rows) * rows)
    }
  },
)

watch(
  () => [...selectedProviders.value],
  (providers) => {
    resetProviderErrors()

    if (providers.length === 0) {
      activeProviderPanel.value = null
    } else if (activeProviderPanel.value && !providers.includes(activeProviderPanel.value)) {
      activeProviderPanel.value = null
    }
  },
  { immediate: true },
)

watch(
  () => amilForm.selectedPlanKey,
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    resetAmilStatesAndBelow()

    if (value && selectedProviders.value.includes('amil') && isProviderPanelActive('amil')) {
      void loadAmilStateOptions()

      if (selectedState.value?.code) {
        void loadAmilCityOptions()
      }
    }
  },
)

watch(
  () => hapvidaForm.tipoContrato,
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    resetHapvidaProductsAndBelow()

    if (value && selectedProviders.value.includes('hapvida') && isProviderPanelActive('hapvida')) {
      void loadHapvidaProductsOptions()
    }
  },
)

watch(
  () => hapvidaForm.produto,
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    resetHapvidaStatesAndBelow()

    if (value && selectedProviders.value.includes('hapvida') && isProviderPanelActive('hapvida')) {
      void loadHapvidaStateOptions()

      if (selectedState.value?.code) {
        void loadHapvidaCityOptions()
      }
    }
  },
)

watch(
  () => selectedState.value?.code ?? '',
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    city.value = ''
    municipalityLoadError.value = ''
    municipalityRequestId += 1
    isLoadingMunicipalities.value = false
    municipalityOptions.value = value ? municipalityOptionsByState[value] ?? [] : []

    if (value) {
      void loadMunicipalityOptions(value)
    }

    if (hapvidaForm.produto && isProviderPanelActive('hapvida')) {
      resetHapvidaServicesAndBelow()
      void loadHapvidaCityOptions()
    }

    if (selectedAmilPlan.value && isProviderPanelActive('amil')) {
      resetAmilCitiesAndBelow()
      void loadAmilCityOptions()
    }

    if (sulamericaForm.produto && sulamericaForm.plano && isProviderPanelActive('sulamerica')) {
      resetSulamericaCitiesAndBelow()
      void loadSulamericaCityOptions()
    }
  },
)

watch(
  () => searchStateOptions.value.map((option) => option.code).join(','),
  () => {
    if (
      selectedState.value &&
      !searchStateOptions.value.some((option) => option.code === selectedState.value?.code)
    ) {
      selectedState.value = null
      city.value = ''
      municipalityOptions.value = []
    }
  },
)

watch(
  () => trimValue(city.value),
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    if (hapvidaForm.produto && selectedState.value?.code && isProviderPanelActive('hapvida')) {
      resetHapvidaServicesAndBelow()

      if (value) {
        void loadHapvidaServiceOptions()
      }
    }

    if (selectedAmilPlan.value && selectedState.value?.code && isProviderPanelActive('amil')) {
      resetAmilNeighborhoodsAndBelow()

      if (value) {
        void loadAmilNeighborhoodOptions()
      }
    }

  },
)

watch(
  () => amilForm.bairro,
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    resetAmilSpecialties()

    if (value && isProviderPanelActive('amil')) {
      void loadAmilSpecialtyOptions()
    }
  },
)

watch(
  () => hapvidaForm.servico,
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    resetHapvidaSpecialtiesAndBelow()

    if (value && isProviderPanelActive('hapvida')) {
      void loadHapvidaSpecialtyOptions()
    }
  },
)

watch(
  () => hapvidaForm.especialidade,
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    resetHapvidaNeighborhoods()

    if (value && isProviderPanelActive('hapvida')) {
      void loadHapvidaNeighborhoodOptions()
    }
  },
)

watch(
  () => sulamericaForm.produto,
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    resetSulamericaPlansAndBelow()

    if (value && selectedProviders.value.includes('sulamerica') && isProviderPanelActive('sulamerica')) {
      void loadSulamericaPlanOptions()
    }
  },
)

watch(
  () => sulamericaForm.plano,
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    resetSulamericaCitiesAndBelow()

    if (value && selectedState.value?.code && isProviderPanelActive('sulamerica')) {
      void loadSulamericaCityOptions()
    }
  },
)

let pollingTimer: ReturnType<typeof setTimeout> | null = null
let lastStatus: string | null = null

function stopPolling() {
  if (pollingTimer) {
    clearTimeout(pollingTimer)
    pollingTimer = null
  }
}

function schedulePolling() {
  stopPolling()

  if (!isTrackingRunning.value || !authStore.token) {
    return
  }

  pollingTimer = setTimeout(async () => {
    await refreshCurrentStatus()
    schedulePolling()
  }, 3000)
}

watch(
  () => activeStatus.value,
  (status) => {
    if (status && status !== lastStatus) {
      if (status === 'done') {
        toast.add({
          severity: 'success',
          summary: `Coleta concluida com ${displayDentistsTotal.value ?? 0} dentistas.`,
          life: 3500,
        })

        void loadResultsForCurrentSearch()
      }

      if (status === 'partial_failed') {
        toast.add({
          severity: 'warn',
          summary: 'Lote finalizado com falhas parciais.',
          life: 4000,
        })

        void loadResultsForCurrentSearch()
      }

      if (status === 'failed') {
        toast.add({
          severity: 'error',
          summary:
            currentBatch.value?.jobs.find((job) => job.errorMessage)?.errorMessage ??
            currentJob.value?.errorMessage ??
            'A coleta falhou.',
          life: 4000,
        })
      }

      lastStatus = status
    }

    schedulePolling()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<template>
  <main class="home-page">
    <AppTopbar title="Dentalpar">
      <template #actions>
        <Tag
          v-if="(currentJob || currentBatch) && activeLocationLabel"
          :value="activeLocationLabel"
          icon="pi pi-map-marker"
          rounded
          severity="secondary"
        />
        <Tag v-if="currentJob || currentBatch" :value="statusLabel" :severity="statusSeverity" rounded />
        <Button
          aria-label="Sair"
          icon="pi pi-sign-out"
          rounded
          severity="secondary"
          variant="text"
          @click="handleLogout"
        />
      </template>
    </AppTopbar>

    <section class="home-shell">
      <section class="search-stage" :class="{ 'search-stage--compact': !showHero }">
        <div class="hero-copy">
          <template v-if="showHero">
            <p class="hero-eyebrow">Busca odontologica</p>
            <h1>Encontre dentistas credenciados</h1>
            <p>
              Selecione primeiro a UF e depois o municipio para evitar erros de digitacao,
              encontrar profissionais credenciados de cada provider e rodar varios providers ao
              mesmo tempo em lote.
            </p>
          </template>
        </div>

        <div class="search-stage-body">
          <div class="provider-picker">
            <div class="provider-picker-header">
              <span class="section-label">Provedores</span>
              <span class="provider-picker-help">Selecione um ou mais providers</span>
            </div>
            <div class="provider-choice-group" role="group" aria-label="Provedores">
              <label
                v-for="option in providerOptions"
                :key="option.value"
                :class="[
                  'provider-choice',
                  { 'provider-choice--active': selectedProviders.includes(option.value) },
                ]"
              >
                <Checkbox
                  v-model="selectedProviders"
                  :input-id="`provider-${option.value}`"
                  :name="`provider-${option.value}`"
                  :value="option.value"
                />
                <span :class="['provider-choice-label', getProviderTone(option.value)]">
                  {{ option.label }}
                </span>
              </label>
            </div>
          </div>

          <Card class="search-card" role="search">
            <template #content>
              <div class="search-card-body">
                <div class="search-controls">
                  <Select
                    v-model="selectedState"
                    :disabled="selectedProviders.length === 0"
                    :invalid="Boolean(formErrors.uf)"
                    :options="searchStateOptions"
                    aria-label="UF"
                    class="state-select"
                    fluid
                    option-label="code"
                    placeholder="UF"
                  />

                  <Select
                    v-model="city"
                    :disabled="selectedProviders.length === 0 || !selectedState"
                    :filter="Boolean(selectedState)"
                    :invalid="Boolean(formErrors.cidade)"
                    :loading="isLoadingMunicipalities"
                    :options="municipalityOptions"
                    :virtualScrollerOptions="{ itemSize: 38 }"
                    aria-label="Municipio"
                    class="municipality-select"
                    filterPlaceholder="Busque o municipio"
                    fluid
                    option-label="name"
                    option-value="name"
                    :placeholder="municipalityPlaceholder"
                    resetFilterOnClear
                    resetFilterOnHide
                    showClear
                  />

                  <Button
                    :disabled="!canSubmitSearch"
                    :label="searchButtonLabel"
                    :loading="isSubmitting"
                    class="search-submit"
                    icon="pi pi-search"
                    @click="() => handleStartCrawl()"
                  />

                  <Button
                    v-if="canClearScreen"
                    :disabled="isSubmitting"
                    class="search-clear"
                    icon="pi pi-times"
                    label="Limpar tela"
                    severity="secondary"
                    variant="outlined"
                    @click="handleClearScreen"
                  />
                </div>

                <p v-if="selectedProviders.length > 0" class="search-submit-hint">
                  A busca final e confirmada pelo botao acima. UF e municipio definidos aqui
                  valem para todos os providers selecionados.
                </p>

                <Message v-if="formError" severity="error" variant="outlined">
                  <div class="retry-message-content">
                    <span>{{ formError }}</span>
                    <Button
                      :disabled="!canSubmitSearch"
                      :loading="isSubmitting"
                      icon="pi pi-refresh"
                      label="Tentar novamente"
                      severity="danger"
                      size="small"
                      variant="text"
                      @click="handleRetrySearch"
                    />
                  </div>
                </Message>

                <Message v-if="municipalityLoadError" severity="error" variant="outlined">
                  <div class="retry-message-content">
                    <span>{{ municipalityLoadError }}</span>
                    <Button
                      :disabled="!selectedState"
                      :loading="isLoadingMunicipalities"
                      icon="pi pi-refresh"
                      label="Tentar novamente"
                      severity="danger"
                      size="small"
                      variant="text"
                      @click="selectedState?.code && loadMunicipalityOptions(selectedState.code)"
                    />
                  </div>
                </Message>

                <div v-if="formErrors.cidade || formErrors.uf || formErrors.providers" class="inline-errors">
                  <Message v-if="formErrors.cidade" severity="error" size="small" variant="simple">
                    {{ formErrors.cidade }}
                  </Message>
                  <Message v-if="formErrors.uf" severity="error" size="small" variant="simple">
                    {{ formErrors.uf }}
                  </Message>
                  <Message v-if="formErrors.providers" severity="error" size="small" variant="simple">
                    {{ formErrors.providers }}
                  </Message>
                </div>
              </div>
            </template>
          </Card>

          <div v-if="selectedProviders.length > 0" class="provider-panels">
            <div class="provider-panel-switcher">
              <span class="section-label">Filtros por provider</span>
              <p class="provider-panel-help">
                Configure um provider por vez. Quando o catalogo do provider definir o municipio,
                ele sera sincronizado automaticamente com a busca principal.
              </p>
              <div class="provider-panel-switcher-buttons" role="tablist" aria-label="Filtros por provider">
                <Button
                  v-for="option in selectedProviderOptions"
                  :key="option.value"
                  :class="['provider-panel-trigger', { 'provider-panel-trigger--active': activeProviderPanel === option.value }]"
                  :label="option.label"
                  :severity="activeProviderPanel === option.value ? 'primary' : 'secondary'"
                  :variant="activeProviderPanel === option.value ? undefined : 'outlined'"
                  rounded
                  size="small"
                  @click="handleOpenProviderPanel(option.value)"
                />
              </div>
            </div>

            <Card v-if="activeProviderPanel === 'odontoprev'" class="provider-panel">
              <template #content>
                <div class="provider-panel-body">
                  <div class="provider-panel-header">
                    <div>
                      <h2>Filtros OdontoPrev</h2>
                      <p>Escolha exatamente uma rede ou um plano e complete os filtros opcionais.</p>
                    </div>
                    <Tag :class="getProviderTone('odontoprev')" rounded severity="secondary" value="OdontoPrev" />
                  </div>

                  <Message
                    v-if="providerLoadErrors.odontoprev"
                    severity="error"
                    size="small"
                    variant="outlined"
                  >
                    <div class="retry-message-content">
                      <span>{{ providerLoadErrors.odontoprev }}</span>
                      <Button
                        :loading="loadingState.odontoprev.filters"
                        icon="pi pi-refresh"
                        label="Tentar novamente"
                        severity="danger"
                        size="small"
                        variant="text"
                        @click="handleRetryProviderCatalog('odontoprev')"
                      />
                    </div>
                  </Message>

                  <div class="provider-fields-grid">
                    <div class="provider-field provider-field--full">
                      <label for="odontoprev-rede">Rede</label>
                      <Select
                        input-id="odontoprev-rede"
                        :disabled="Boolean(odontoprevForm.codigoPlano)"
                        :invalid="Boolean(providerErrors.odontoprev.selection)"
                        :loading="loadingState.odontoprev.filters"
                        :model-value="odontoprevForm.codigoRede || null"
                        :options="odontoprevCatalog.redes"
                        option-label="nome"
                        option-value="codigo"
                        placeholder="Selecione a rede"
                        show-clear
                        @update:model-value="handleOdontoprevNetworkChange"
                      />
                    </div>

                    <div class="provider-field provider-field--full">
                      <label for="odontoprev-plano">Plano</label>
                      <Select
                        input-id="odontoprev-plano"
                        :disabled="Boolean(odontoprevForm.codigoRede)"
                        :invalid="Boolean(providerErrors.odontoprev.selection)"
                        :loading="loadingState.odontoprev.filters"
                        :model-value="odontoprevForm.codigoPlano || null"
                        :options="odontoprevCatalog.planos"
                        option-label="nome"
                        option-value="codigo"
                        placeholder="Selecione o plano"
                        show-clear
                        @update:model-value="handleOdontoprevPlanChange"
                      />
                    </div>
                  </div>

                  <div v-if="providerErrors.odontoprev.selection" class="provider-inline-errors">
                    <small>{{ providerErrors.odontoprev.selection }}</small>
                  </div>

                  <details class="provider-subsection provider-subsection--collapsible">
                    <summary class="provider-subsection-summary">
                      <div class="provider-subsection-title">
                        <span aria-hidden="true" class="provider-subsection-title-line" />
                        <h3>Filtros opcionais</h3>
                      </div>
                      <i aria-hidden="true" class="pi pi-chevron-down provider-subsection-chevron" />
                    </summary>

                    <div class="provider-subsection-content">
                      <div class="provider-subsection-copy">
                        <p>Refine a busca com criterios complementares sem alterar UF e municipio.</p>
                      </div>

                      <div class="provider-fields-grid">
                        <div class="provider-field">
                          <label for="odontoprev-especialidade">Especialidade</label>
                          <Select
                            v-model="odontoprevForm.codigoEspecialidade"
                            input-id="odontoprev-especialidade"
                            :loading="loadingState.odontoprev.filters"
                            :options="odontoprevCatalog.especialidades"
                            option-label="nome"
                            option-value="codigo"
                            placeholder="Especialidade"
                            show-clear
                          />
                        </div>

                        <div class="provider-field">
                          <label for="odontoprev-nome">Nome do dentista</label>
                          <InputText
                            v-model="odontoprevForm.nomeDentista"
                            id="odontoprev-nome"
                            placeholder="Digite o nome do dentista"
                          />
                        </div>

                        <div class="provider-field">
                          <label for="odontoprev-idioma">Idioma</label>
                          <InputText
                            v-model="odontoprevForm.idioma"
                            id="odontoprev-idioma"
                            placeholder="Ex.: INGLES"
                          />
                        </div>
                      </div>

                      <div class="provider-binary-grid">
                        <label class="binary-option" for="odontoprev-especialista">
                          <Checkbox
                            v-model="odontoprevForm.isEspecialista"
                            binary
                            input-id="odontoprev-especialista"
                          />
                          <span>Somente especialista</span>
                        </label>

                        <label class="binary-option" for="odontoprev-whatsapp">
                          <Checkbox
                            v-model="odontoprevForm.isAtendeWhatsApp"
                            binary
                            input-id="odontoprev-whatsapp"
                          />
                          <span>Atende WhatsApp</span>
                        </label>

                        <label class="binary-option" for="odontoprev-acessibilidade">
                          <Checkbox
                            v-model="odontoprevForm.acessibilidade"
                            binary
                            input-id="odontoprev-acessibilidade"
                          />
                          <span>Acessibilidade</span>
                        </label>
                      </div>
                    </div>
                  </details>
                </div>
              </template>
            </Card>

            <Card v-if="activeProviderPanel === 'hapvida'" class="provider-panel">
              <template #content>
                <div class="provider-panel-body">
                  <div class="provider-panel-header">
                    <div>
                      <h2>Filtros Hapvida</h2>
                      <p>Configure apenas os filtros complementares. O municipio e a UF desta busca continuam vindo do topo da tela.</p>
                    </div>
                    <Tag :class="getProviderTone('hapvida')" rounded severity="secondary" value="Hapvida" />
                  </div>

                  <Message
                    v-if="providerLoadErrors.hapvida"
                    severity="error"
                    size="small"
                    variant="outlined"
                  >
                    <div class="retry-message-content">
                      <span>{{ providerLoadErrors.hapvida }}</span>
                      <Button
                        :loading="isRetryingActiveProvider"
                        icon="pi pi-refresh"
                        label="Tentar novamente"
                        severity="danger"
                        size="small"
                        variant="text"
                        @click="handleRetryProviderCatalog('hapvida')"
                      />
                    </div>
                  </Message>

                  <Message
                    v-else-if="hapvidaCatalog.cities.length > 0 && !isHapvidaCityCompatible"
                    severity="warn"
                    size="small"
                    variant="outlined"
                  >
                    O municipio selecionado no topo nao apareceu no catalogo atual da Hapvida para este produto e UF.
                  </Message>

                  <div class="provider-fields-grid">
                    <div class="provider-field provider-field--full">
                      <label for="hapvida-tipo-contrato">Tipo de contrato</label>
                      <Select
                        v-model="hapvidaForm.tipoContrato"
                        input-id="hapvida-tipo-contrato"
                        :invalid="Boolean(providerErrors.hapvida.tipoContrato)"
                        :loading="loadingState.hapvida.contractTypes"
                        :options="hapvidaCatalog.contractTypes"
                        option-label="nome"
                        option-value="codigo"
                        placeholder="Selecione"
                        show-clear
                      />
                    </div>

                    <div class="provider-field provider-field--full">
                      <label for="hapvida-produto">Produto</label>
                      <Select
                        v-model="hapvidaForm.produto"
                        input-id="hapvida-produto"
                        :disabled="!hapvidaForm.tipoContrato"
                        :invalid="Boolean(providerErrors.hapvida.produto)"
                        :loading="loadingState.hapvida.products"
                        :options="hapvidaCatalog.products"
                        option-label="nome"
                        option-value="codigo"
                        placeholder="Selecione"
                        show-clear
                      />
                    </div>

                    <div class="provider-field">
                      <label for="hapvida-servico">Servico</label>
                      <Select
                        v-model="hapvidaForm.servico"
                        input-id="hapvida-servico"
                        :disabled="
                          !trimValue(city) ||
                          !selectedState ||
                          !hapvidaForm.produto ||
                          !isHapvidaCityCompatible ||
                          loadingState.hapvida.cities
                        "
                        :invalid="Boolean(providerErrors.hapvida.servico)"
                        :loading="loadingState.hapvida.cities || loadingState.hapvida.services"
                        :options="hapvidaCatalog.services"
                        option-label="nome"
                        option-value="codigo"
                        placeholder="Selecione"
                        show-clear
                      />
                    </div>

                    <div class="provider-field">
                      <label for="hapvida-especialidade">Especialidade</label>
                      <Select
                        v-model="hapvidaForm.especialidade"
                        input-id="hapvida-especialidade"
                        :disabled="!hapvidaForm.servico"
                        :invalid="Boolean(providerErrors.hapvida.especialidade)"
                        :loading="loadingState.hapvida.specialties"
                        :options="hapvidaCatalog.specialties"
                        option-label="nome"
                        option-value="codigo"
                        placeholder="Selecione"
                        show-clear
                      />
                    </div>

                    <div class="provider-field">
                      <label for="hapvida-bairro">
                        Bairro
                        <span class="provider-field-optional">Opcional</span>
                      </label>
                      <Select
                        v-model="hapvidaForm.bairro"
                        input-id="hapvida-bairro"
                        :disabled="!hapvidaForm.especialidade"
                        :invalid="Boolean(providerErrors.hapvida.bairro)"
                        :loading="loadingState.hapvida.neighborhoods"
                        :options="hapvidaCatalog.neighborhoods"
                        option-label="nome"
                        option-value="codigo"
                        placeholder="Selecione"
                        show-clear
                      />
                    </div>
                  </div>

                  <div v-if="Object.keys(providerErrors.hapvida).length > 0" class="provider-inline-errors">
                    <small v-if="providerErrors.hapvida.tipoContrato">{{ providerErrors.hapvida.tipoContrato }}</small>
                    <small v-if="providerErrors.hapvida.produto">{{ providerErrors.hapvida.produto }}</small>
                    <small v-if="providerErrors.hapvida.servico">{{ providerErrors.hapvida.servico }}</small>
                    <small v-if="providerErrors.hapvida.especialidade">{{ providerErrors.hapvida.especialidade }}</small>
                  </div>
                </div>
              </template>
            </Card>

            <Card v-if="activeProviderPanel === 'amil'" class="provider-panel">
              <template #content>
                <div class="provider-panel-body">
                  <div class="provider-panel-header">
                    <div>
                      <h2>Filtros Amil</h2>
                      <p>Comece por rede ou plano. UF e municipio continuam vindo do topo da tela e os demais filtros seguem a cascata da Amil.</p>
                    </div>
                    <Tag :class="getProviderTone('amil')" rounded severity="secondary" value="Amil" />
                  </div>

                  <Message
                    v-if="providerLoadErrors.amil"
                    severity="error"
                    size="small"
                    variant="outlined"
                  >
                    <div class="retry-message-content">
                      <span>{{ providerLoadErrors.amil }}</span>
                      <Button
                        :loading="isRetryingActiveProvider"
                        icon="pi pi-refresh"
                        label="Tentar novamente"
                        severity="danger"
                        size="small"
                        variant="text"
                        @click="handleRetryProviderCatalog('amil')"
                      />
                    </div>
                  </Message>

                  <Message
                    v-else-if="amilCatalog.cities.length > 0 && !isAmilCityCompatible"
                    severity="warn"
                    size="small"
                    variant="outlined"
                  >
                    O municipio selecionado no topo nao apareceu no catalogo atual da Amil para a rede ou plano escolhido.
                  </Message>

                  <div class="provider-fields-grid">
                    <div class="provider-field provider-field--full">
                      <label for="amil-plan">Rede ou plano</label>
                      <Select
                        v-model="amilForm.selectedPlanKey"
                        input-id="amil-plan"
                        :invalid="Boolean(providerErrors.amil.plan)"
                        :loading="loadingState.amil.plans"
                        :options="amilPlanSelectionOptions"
                        filter
                        filterPlaceholder="Busque por rede ou plano"
                        option-label="label"
                        option-value="key"
                        placeholder="Selecione"
                        show-clear
                        :virtualScrollerOptions="{ itemSize: 38 }"
                      />
                    </div>

                    <div v-if="selectedAmilPlan" class="provider-field provider-field--full">
                      <Message severity="secondary" variant="simple">
                        {{ selectedAmilPlan.tipo === 'rede' ? 'Busca dental por rede selecionada.' : 'Busca dental por plano especifico selecionado.' }}
                        Tipo de servico definido automaticamente como DENTAL.
                      </Message>
                    </div>

                    <div class="provider-field">
                      <label for="amil-bairro">Bairro</label>
                      <Select
                        v-model="amilForm.bairro"
                        input-id="amil-bairro"
                        :disabled="!trimValue(city) || !selectedState || !selectedAmilPlan || !isAmilCityCompatible"
                        :invalid="Boolean(providerErrors.amil.bairro)"
                        :loading="loadingState.amil.cities || loadingState.amil.neighborhoods"
                        :options="amilCatalog.neighborhoods"
                        filter
                        filterPlaceholder="Busque o bairro"
                        option-label="nome"
                        option-value="codigo"
                        placeholder="Selecione"
                        show-clear
                        :virtualScrollerOptions="{ itemSize: 38 }"
                      />
                    </div>

                    <div class="provider-field">
                      <label for="amil-especialidade">Especialidade</label>
                      <Select
                        v-model="amilForm.especialidade"
                        input-id="amil-especialidade"
                        :disabled="!amilForm.bairro"
                        :invalid="Boolean(providerErrors.amil.especialidade)"
                        :loading="loadingState.amil.specialties"
                        :options="amilCatalog.specialties"
                        filter
                        filterPlaceholder="Busque a especialidade"
                        option-label="nome"
                        option-value="codigo"
                        placeholder="Selecione"
                        show-clear
                        :virtualScrollerOptions="{ itemSize: 38 }"
                      />
                    </div>
                  </div>

                  <div v-if="Object.keys(providerErrors.amil).length > 0" class="provider-inline-errors">
                    <small v-if="providerErrors.amil.plan">{{ providerErrors.amil.plan }}</small>
                    <small v-if="providerErrors.amil.bairro">{{ providerErrors.amil.bairro }}</small>
                    <small v-if="providerErrors.amil.especialidade">{{ providerErrors.amil.especialidade }}</small>
                  </div>
                </div>
              </template>
            </Card>

            <Card v-if="activeProviderPanel === 'sulamerica'" class="provider-panel">
              <template #content>
                <div class="provider-panel-body">
                  <div class="provider-panel-header">
                    <div>
                      <h2>Filtros SulAmerica</h2>
                      <p>Escolha produto e plano e, se quiser, refine apenas a janela de horario. Municipio e UF continuam vindo do topo.</p>
                    </div>
                    <Tag :class="getProviderTone('sulamerica')" rounded severity="secondary" value="SulAmerica" />
                  </div>

                  <Message
                    v-if="providerLoadErrors.sulamerica"
                    severity="error"
                    size="small"
                    variant="outlined"
                  >
                    <div class="retry-message-content">
                      <span>{{ providerLoadErrors.sulamerica }}</span>
                      <Button
                        :loading="isRetryingActiveProvider"
                        icon="pi pi-refresh"
                        label="Tentar novamente"
                        severity="danger"
                        size="small"
                        variant="text"
                        @click="handleRetryProviderCatalog('sulamerica')"
                      />
                    </div>
                  </Message>

                  <Message
                    v-else-if="sulamericaCatalog.cities.length > 0 && !isSulamericaCityCompatible"
                    severity="warn"
                    size="small"
                    variant="outlined"
                  >
                    O municipio selecionado no topo nao apareceu no catalogo atual da SulAmerica para o produto, plano e UF selecionados.
                  </Message>

                  <div class="provider-fields-grid">
                    <div class="provider-field provider-field--full">
                      <label for="sulamerica-produto">Produto</label>
                      <Select
                        v-model="sulamericaForm.produto"
                        input-id="sulamerica-produto"
                        :invalid="Boolean(providerErrors.sulamerica.produto)"
                        :loading="loadingState.sulamerica.products"
                        :options="sulamericaCatalog.products"
                        option-label="nome"
                        option-value="codigo"
                        placeholder="Selecione"
                        show-clear
                      />
                    </div>

                    <div class="provider-field provider-field--full">
                      <label for="sulamerica-plano">Plano</label>
                      <Select
                        v-model="sulamericaForm.plano"
                        input-id="sulamerica-plano"
                        :disabled="!sulamericaForm.produto"
                        :invalid="Boolean(providerErrors.sulamerica.plano)"
                        :loading="loadingState.sulamerica.plans"
                        :options="sulamericaCatalog.plans"
                        option-label="nome"
                        option-value="codigo"
                        placeholder="Selecione"
                        show-clear
                      />
                    </div>
                  </div>

                  <section class="provider-subsection">
                    <div class="provider-subsection-header">
                      <div class="provider-subsection-copy">
                        <div class="provider-subsection-title">
                          <span aria-hidden="true" class="provider-subsection-title-line" />
                          <h3>Refinar horario</h3>
                        </div>
                        <p>Opcional: limite a busca a uma janela de atendimento especifica.</p>
                      </div>
                    </div>

                    <div class="provider-fields-grid provider-fields-grid--time-range">
                      <div class="provider-field provider-field--time-range">
                        <label for="sulamerica-hora-inicial">Horario inicial</label>
                        <Select
                          v-model="sulamericaForm.horarioInicial"
                          input-id="sulamerica-hora-inicial"
                          :loading="loadingState.sulamerica.hours"
                          :options="sulamericaCatalog.hours"
                          option-label="nome"
                          option-value="codigo"
                          placeholder="Selecione"
                          show-clear
                        />
                      </div>

                      <div class="provider-field provider-field--time-range">
                        <label for="sulamerica-hora-final">Horario final</label>
                        <Select
                          v-model="sulamericaForm.horarioFinal"
                          input-id="sulamerica-hora-final"
                          :loading="loadingState.sulamerica.hours"
                          :options="sulamericaCatalog.hours"
                          option-label="nome"
                          option-value="codigo"
                          placeholder="Selecione"
                          show-clear
                        />
                      </div>
                    </div>
                  </section>

                  <div v-if="Object.keys(providerErrors.sulamerica).length > 0" class="provider-inline-errors">
                    <small v-if="providerErrors.sulamerica.produto">{{ providerErrors.sulamerica.produto }}</small>
                    <small v-if="providerErrors.sulamerica.plano">{{ providerErrors.sulamerica.plano }}</small>
                  </div>
                </div>
              </template>
            </Card>
          </div>

          <Card v-if="showStatusCard" class="status-card">
            <template #content>
              <div class="status-card-body">
                <h2>{{ currentBatch ? 'Status dos crawlers' : 'Status da coleta' }}</h2>

                <div class="status-list">
                  <div v-for="row in statusRows" :key="row.key" class="status-row">
                    <div class="status-row-main">
                      <span class="status-dot" :class="row.tone" />
                      <strong>{{ row.provider }}</strong>
                    </div>

                    <div class="status-row-meta">
                      <span class="status-row-label">{{ row.total }}</span>
                      <span class="status-row-label">{{ row.status }}</span>
                      <ProgressSpinner
                        v-if="isTrackingRunning"
                        aria-label="Atualizando status"
                        stroke-width="6"
                        style="width: 1rem; height: 1rem"
                      />
                    </div>
                  </div>
                </div>

                <div class="status-actions">
                  <Tag :value="statusLabel" :severity="statusSeverity" rounded />
                  <Button
                    :loading="isRefreshingJob || isRefreshingBatch"
                    icon="pi pi-refresh"
                    label="Atualizar status"
                    severity="secondary"
                    size="small"
                    variant="text"
                    @click="refreshCurrentStatus"
                  />
                  <Button
                    v-if="activeStatus === 'failed'"
                    :disabled="!canSubmitSearch"
                    :loading="isSubmitting"
                    icon="pi pi-replay"
                    label="Tentar novamente"
                    severity="danger"
                    size="small"
                    variant="outlined"
                    @click="handleRetrySearch"
                  />
                </div>
              </div>
            </template>
          </Card>

          <div v-if="showCompletedBanner" class="completed-banner">
            <div class="completed-banner-main">
              <template v-for="item in completedSummaryItems" :key="item.key">
                <div class="completed-banner-item">
                  <i class="pi pi-check-circle" :class="item.tone" aria-hidden="true" />
                  <strong>{{ item.label }}</strong>
                  <span>{{ formatDentistCount(item.total) }}</span>
                </div>
              </template>
            </div>
            <Button
              v-if="isPartialFailedState"
              :loading="isSubmitting"
              icon="pi pi-replay"
              label="Tentar falhas novamente"
              severity="warn"
              size="small"
              variant="outlined"
              @click="handleRetrySearch"
            />
          </div>
        </div>
      </section>

      <section v-if="showResultsSection" class="results-section">
        <div class="results-header">
          <div>
            <h2>{{ locationSummary }}</h2>
            <p>{{ providerHelperText }}</p>
          </div>

          <Button
            v-if="displayDentists.length > 0"
            icon="pi pi-download"
            label="Exportar CSV"
            severity="secondary"
            variant="outlined"
            @click="exportDentistsAsCsv"
          />
        </div>

        <div v-if="isRefreshingDentists || isRefreshingBatchDentists" class="results-grid">
          <Card v-for="index in 4" :key="index" class="result-card">
            <template #content>
              <div class="skeleton-stack">
                <Skeleton width="8rem" height="1rem" />
                <Skeleton width="100%" height="2.5rem" />
                <Skeleton width="70%" height="1rem" />
              </div>
            </template>
          </Card>
        </div>

        <template v-else-if="displayDentists.length > 0">
          <Paginator
            v-if="shouldShowResultsPaginator"
            v-model:first="resultsFirst"
            v-model:rows="resultsRows"
            :alwaysShow="false"
            :rowsPerPageOptions="[12, 24, 48]"
            :template="resultsPaginatorTemplate"
            :totalRecords="displayDentists.length"
            class="results-paginator"
            currentPageReportTemplate="{first} - {last} de {totalRecords}"
          />

          <div class="results-grid">
            <article
              v-for="dentist in paginatedDentists"
              :key="dentist.externalId ?? `${dentist.nome}-${dentist.telefone}`"
              class="dentist-card"
            >
              <div class="dentist-card-header">
                <div>
                  <h3>{{ dentist.nome }}</h3>
                  <p v-if="dentist.nomeFantasia">{{ dentist.nomeFantasia }}</p>
                </div>

                <Tag
                  :class="['dentist-provider-tag', getProviderTone(dentist.provider)]"
                  :value="formatProviderLabel(dentist.provider)"
                  rounded
                  severity="secondary"
                />
              </div>

              <div class="dentist-card-body">
                <p v-if="getDentistAddress(dentist)" class="dentist-line">
                  <i class="pi pi-map-marker" aria-hidden="true" />
                  <span>{{ getDentistAddress(dentist) }}</span>
                </p>

                <p v-if="dentist.telefone" class="dentist-line">
                  <i class="pi pi-phone" aria-hidden="true" />
                  <span>{{ dentist.telefone }}</span>
                </p>

                <p v-if="dentist.whatsapp" class="dentist-line dentist-line--success">
                  <i class="pi pi-whatsapp" aria-hidden="true" />
                  <span>{{ dentist.whatsapp }}</span>
                </p>

                <p v-if="dentist.email" class="dentist-line">
                  <i class="pi pi-envelope" aria-hidden="true" />
                  <span>{{ dentist.email }}</span>
                </p>

                <p v-if="dentist.boaconsultaUrl" class="dentist-line">
                  <i class="pi pi-external-link" aria-hidden="true" />
                  <a :href="dentist.boaconsultaUrl" rel="noreferrer" target="_blank">
                    Abrir perfil
                  </a>
                </p>
              </div>

              <div class="dentist-card-tags">
                <div v-if="getDentistAreas(dentist).length > 0" class="tag-group">
                  <span class="tag-group-label">Area de atuacao</span>
                  <div class="tag-group-list">
                    <Tag
                      v-for="area in getDentistAreas(dentist)"
                      :key="area"
                      :value="area"
                      rounded
                      severity="info"
                    />
                  </div>
                </div>

                <div class="tag-group">
                  <span class="tag-group-label">Especialidades</span>
                  <div class="tag-group-list">
                    <Tag
                      v-if="getDentistSpecialties(dentist).length === 0"
                      value="Sem especialidade informada"
                      rounded
                      severity="secondary"
                    />
                    <Tag
                      v-for="specialty in getDentistSpecialties(dentist)"
                      :key="specialty"
                      :value="specialty"
                      rounded
                      severity="warn"
                    />
                  </div>
                </div>

                <div v-if="hasDentistMetadata(dentist)" class="tag-group">
                  <span class="tag-group-label">Informacoes</span>
                  <div class="tag-group-list">
                    <Tag
                      v-for="highlight in buildDentistHighlights(dentist)"
                      :key="highlight"
                      :value="highlight"
                      rounded
                      severity="contrast"
                    />
                    <Tag
                      v-if="dentist.acessibilidadeCadeirante"
                      value="Acessivel"
                      rounded
                      severity="info"
                    />
                  </div>
                </div>

                <div v-if="hasDentistQualificationLegends(dentist)" class="tag-group">
                  <span class="tag-group-label">Legendas</span>
                  <div class="dentist-legend-list">
                    <span
                      v-for="icon in buildDentistLegendIcons(dentist)"
                      :key="`${icon.code}-${icon.label}`"
                      :aria-label="icon.label"
                      :title="icon.label"
                      class="dentist-legend-chip"
                    >
                      <span class="dentist-legend-glyph">{{ icon.code }}</span>
                      <span class="dentist-legend-text">{{ icon.label }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <Paginator
            v-if="shouldShowResultsPaginator"
            v-model:first="resultsFirst"
            v-model:rows="resultsRows"
            :alwaysShow="false"
            :rowsPerPageOptions="[12, 24, 48]"
            :template="resultsPaginatorTemplate"
            :totalRecords="displayDentists.length"
            class="results-paginator results-paginator--bottom"
            currentPageReportTemplate="{first} - {last} de {totalRecords}"
          />
        </template>

        <Message v-else-if="isTerminalState" severity="info" variant="outlined">
          A coleta terminou, mas nenhuma rota de dentistas retornou registros para esta busca.
        </Message>
      </section>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: var(--app-page-background);
  color: var(--p-text-color);
}

.home-shell {
  width: min(100%, 80rem);
  margin: 0 auto;
  padding: 1.4rem 1.25rem 4rem;
  display: grid;
  gap: 1.6rem;
}

.search-stage {
  display: grid;
  justify-items: center;
  gap: 1rem;
}

.search-stage--compact {
  gap: 0.85rem;
}

.hero-copy {
  max-width: 40rem;
  display: grid;
  gap: 0.8rem;
  text-align: center;
}

.search-stage--compact .hero-copy {
  display: none;
}

.hero-eyebrow,
.section-label {
  color: var(--p-text-muted-color);
  font-size: 0.84rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.hero-copy h1,
.results-header h2 {
  margin: 0;
  color: var(--app-page-heading-color);
  font-size: clamp(2.2rem, 4vw, 3rem);
  line-height: 1.08;
}

.hero-copy p,
.results-header p {
  margin: 0;
  color: var(--p-text-muted-color);
  line-height: 1.65;
}

.search-stage-body {
  display: flex;
  width: min(100%, 44rem);
  flex-direction: column;
  gap: 0.85rem;
}

.provider-picker {
  display: grid;
  gap: 0.45rem;
}

.provider-picker-header {
  display: grid;
  gap: 0.15rem;
}

.provider-picker-help {
  color: var(--p-text-muted-color);
  font-size: 0.88rem;
}

.provider-choice-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.provider-choice {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.5rem;
  padding: 0.5rem 0.8rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 72%, transparent);
  border-radius: 999px;
  background: var(--app-panel-background);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.provider-choice:hover {
  border-color: var(--p-primary-300);
}

.provider-choice--active {
  border-color: var(--p-primary-color);
  background: color-mix(in srgb, var(--p-primary-color) 7%, var(--app-panel-background));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--p-primary-color) 22%, transparent);
}

.provider-choice :deep(.p-checkbox) {
  flex: 0 0 auto;
}

.provider-choice-label {
  font-size: 0.94rem;
  font-weight: 600;
}

.status-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: currentColor;
  flex: 0 0 auto;
}

.provider-tone--odontoprev {
  color: var(--app-provider-odontoprev-color);
}

.provider-tone--hapvida {
  color: var(--app-provider-hapvida-color);
}

.provider-tone--amil {
  color: var(--app-provider-amil-color);
}

.provider-tone--sulamerica {
  color: var(--app-provider-sulamerica-color);
}

.search-card,
.status-card {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 65%, transparent);
  box-shadow: var(--app-panel-shadow);
}

.search-card :deep(.p-card-body),
.status-card :deep(.p-card-body) {
  gap: 0;
}

.search-card-body {
  display: grid;
  gap: 0.85rem;
}

.provider-panels {
  display: grid;
  gap: 0.9rem;
}

.provider-panel-switcher {
  display: grid;
  gap: 0.6rem;
}

.provider-panel-help {
  margin: 0;
  color: var(--p-text-muted-color);
  line-height: 1.55;
}

.provider-panel-switcher-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.provider-panel-trigger {
  min-width: 0;
}

.provider-panel-trigger--active {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--p-primary-color) 20%, transparent);
}

.provider-panel {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 65%, transparent);
  box-shadow: var(--app-panel-shadow);
}

.provider-subsection {
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 50%, transparent);
  border-radius: var(--p-content-border-radius);
  background: var(--app-panel-background-soft);
}

.provider-subsection-header {
  display: grid;
  gap: 0.45rem;
}

.provider-subsection-copy {
  display: grid;
  gap: 0.45rem;
}

.provider-subsection--collapsible {
  gap: 0;
  padding: 0.95rem 1rem 1rem;
}

.provider-subsection-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  list-style: none;
}

.provider-subsection-summary::-webkit-details-marker {
  display: none;
}

.provider-subsection-title {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.provider-subsection-title-line {
  width: 1.45rem;
  height: 1px;
  background: color-mix(in srgb, var(--p-text-color) 78%, transparent);
  flex: 0 0 auto;
}

.provider-subsection-title h3 {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.2;
}

.provider-subsection-header p {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.88rem;
  line-height: 1.55;
}

.provider-subsection-content {
  display: grid;
  gap: 0.9rem;
  padding-top: 0.9rem;
}

.provider-subsection-chevron {
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
  transition: transform 0.2s ease;
}

.provider-subsection--collapsible[open] .provider-subsection-chevron {
  transform: rotate(180deg);
}

.provider-advanced {
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 50%, transparent);
  background: var(--app-panel-background-soft);
}

.provider-advanced :deep(.p-fieldset-legend) {
  background: transparent;
}

.provider-advanced :deep(.p-fieldset-toggle-button) {
  gap: 0.45rem;
  align-items: center;
}

.provider-advanced :deep(.p-fieldset-toggleable-content) {
  display: grid;
  gap: 0.9rem;
}

.provider-advanced :deep(.p-fieldset-content) {
  padding-top: 0.2rem;
}

.provider-panel :deep(.p-card-body) {
  gap: 0;
}

.provider-panel-body {
  display: grid;
  gap: 0.95rem;
}

.provider-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.provider-panel-header h2 {
  margin: 0;
  font-size: 1rem;
}

.provider-panel-header p {
  margin: 0.35rem 0 0;
  color: var(--p-text-muted-color);
  line-height: 1.55;
}

.provider-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.provider-fields-grid--time-range {
  align-items: end;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.provider-field {
  display: grid;
  gap: 0.4rem;
  min-width: 0;
}

.provider-field label {
  color: var(--p-text-muted-color);
  font-size: 0.88rem;
  font-weight: 600;
}

.provider-field-optional {
  margin-left: 0.45rem;
  color: var(--p-text-muted-color);
  font-size: 0.78rem;
  font-weight: 500;
}

.provider-field--wide {
  grid-column: span 2;
}

.provider-field--full {
  grid-column: 1 / -1;
}

.provider-field--time-range {
  min-width: 0;
}

.provider-field :deep(.p-select),
.provider-field :deep(.p-inputtext) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.provider-field :deep(.p-select) {
  overflow: hidden;
}

.provider-field :deep(.p-select-label) {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-binary-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.binary-option {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--p-text-color);
  font-size: 0.92rem;
}

.provider-inline-errors {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.provider-inline-errors small {
  color: var(--p-red-500);
  line-height: 1.5;
}

.search-controls {
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr) auto auto;
  gap: 0.65rem;
  align-items: center;
}

.municipality-select,
.state-select,
.search-clear,
.search-submit {
  min-height: 3rem;
}

.municipality-select :deep(.p-select-label),
.state-select :deep(.p-select-label) {
  font-size: 0.98rem;
}

.municipality-select :deep(.p-select-label) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-submit {
  padding-inline: 1.2rem;
  white-space: nowrap;
}

.search-clear {
  white-space: nowrap;
}

.inline-errors {
  display: grid;
  gap: 0.35rem;
}

.retry-message-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.retry-message-content span {
  min-width: 0;
  line-height: 1.45;
}

.search-submit-hint {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
  line-height: 1.55;
}

.status-card-body {
  display: grid;
  gap: 0.9rem;
}

.status-card-body h2 {
  margin: 0;
  font-size: 1rem;
}

.status-list {
  display: grid;
  gap: 0.6rem;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: var(--p-border-radius-xl);
  background: var(--app-panel-background-soft);
}

.status-row-main,
.status-row-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.status-row-label {
  color: var(--p-text-muted-color);
  font-size: 0.92rem;
}

.status-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.results-section {
  width: 100%;
  margin: 0;
  display: grid;
  gap: 1.15rem;
}

.completed-banner {
  display: flex;
  align-items: center;
  min-height: 3.15rem;
  padding: 0.75rem 0.95rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 56%, transparent);
  border-radius: calc(var(--p-content-border-radius) + 0.2rem);
  background: var(--app-panel-background);
  box-shadow: none;
}

.completed-banner-main {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1rem;
  color: var(--p-text-muted-color);
  font-size: 0.92rem;
}

.completed-banner-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.completed-banner-item .pi {
  font-size: 1rem;
}

.completed-banner-item strong {
  color: var(--p-text-color);
  font-size: 0.95rem;
  font-weight: 600;
}

.completed-banner-item span::before {
  content: '\2014';
  margin-right: 0.45rem;
  color: var(--p-text-muted-color);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.15rem;
}

.results-paginator {
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 68%, transparent);
  border-radius: calc(var(--p-content-border-radius) + 0.1rem);
  background: var(--app-panel-background);
  box-shadow: var(--app-panel-shadow);
  padding-inline: 0.2rem;
}

.results-paginator--bottom {
  margin-top: 0.15rem;
}

.results-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.results-header h2 {
  font-size: clamp(1.1rem, 2.4vw, 1.4rem);
  margin-top: 0;
}

.skeleton-stack {
  display: grid;
  gap: 1rem;
}

.dentist-card {
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 72%, transparent);
  border-radius: var(--p-content-border-radius);
  background: var(--app-panel-background);
  box-shadow: var(--app-panel-shadow);
  padding: 1.05rem;
  display: grid;
  gap: 0.95rem;
}

.dentist-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.dentist-card-header h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.35;
  text-transform: uppercase;
}

.dentist-card-header p {
  margin: 0.35rem 0 0;
  color: var(--p-text-muted-color);
  font-size: 0.88rem;
  text-transform: uppercase;
}

.dentist-card-body {
  display: grid;
  gap: 0.45rem;
}

.dentist-line {
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  color: var(--p-text-color);
  line-height: 1.5;
}

.dentist-line--success {
  color: var(--app-success-color);
}

.dentist-line .pi {
  color: var(--p-text-muted-color);
  margin-top: 0.1rem;
}

.dentist-line--success .pi {
  color: var(--app-success-color);
}

.dentist-line a {
  color: var(--p-primary-color);
  text-decoration: none;
  font-weight: 600;
}

.dentist-card-tags {
  display: grid;
  gap: 0.65rem;
}

.tag-group {
  display: grid;
  gap: 0.4rem;
}

.tag-group-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
}

.tag-group-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dentist-legend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.dentist-legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.35rem 0.6rem 0.35rem 0.35rem;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color) 72%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-panel-background) 90%, var(--p-surface-100));
}

.dentist-legend-glyph {
  width: 1.8rem;
  height: 1.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.45rem;
  background: color-mix(in srgb, var(--p-text-color) 80%, transparent);
  color: var(--app-panel-background);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  flex: 0 0 auto;
}

.dentist-legend-text {
  min-width: 0;
  color: var(--p-text-color);
  font-size: 0.82rem;
  line-height: 1.35;
}

@media (max-width: 960px) {
  .results-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .results-paginator {
    overflow-x: auto;
  }

  .search-clear,
  .search-submit {
    width: 100%;
    justify-content: center;
  }

  .results-header,
  .retry-message-content,
  .status-row,
  .status-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .home-shell {
    padding-inline: 0.9rem;
    padding-top: 1.5rem;
  }

  .hero-copy h1 {
    font-size: 2rem;
  }

  .search-stage-body,
  .results-section {
    width: 100%;
  }

  .search-controls {
    grid-template-columns: 1fr;
  }

  .provider-fields-grid {
    grid-template-columns: 1fr;
  }

  .provider-panel-header {
    flex-direction: column;
  }

  .provider-field--wide {
    grid-column: auto;
  }

  .provider-field--full {
    grid-column: auto;
  }

  .dentist-card-header {
    flex-direction: column;
  }

  .results-grid {
    grid-template-columns: 1fr;
  }
}
</style>
