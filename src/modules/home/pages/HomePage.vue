<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/modules/auth/store'
import { isApiError } from '@/shared/api'
import { trimValue } from '@/shared/utils'
import type { CrawlBatchStatus, CrawlJobStatus, CrawlProvider } from '@/shared/types'
import { AppTopbar } from '@/shared/ui'
import { getMunicipalitiesByState } from '../api'
import type {
  MunicipalityOption,
  QueueBatchProviderOptions,
} from '../api'
import {
  useDentistResults,
  useAmilCatalog,
  useHapvidaCatalog,
  useJobPolling,
  useOdontoprevCatalog,
  useSulamericaCatalog,
} from '../composables'
import CompletedSummary from '../components/CompletedSummary.vue'
import DentistResultsSection from '../components/DentistResultsSection.vue'
import AmilFiltersPanel from '../components/AmilFiltersPanel.vue'
import HapvidaFiltersPanel from '../components/HapvidaFiltersPanel.vue'
import OdontoprevFiltersPanel from '../components/OdontoprevFiltersPanel.vue'
import ProviderFilterSwitcher from '../components/ProviderFilterSwitcher.vue'
import ProviderPicker from '../components/ProviderPicker.vue'
import SearchFormPanel from '../components/SearchFormPanel.vue'
import SearchStatusCard from '../components/SearchStatusCard.vue'
import SulamericaFiltersPanel from '../components/SulamericaFiltersPanel.vue'
import { useHomeSearchStore } from '../store'
import {
  exportDentistsAsCsv as downloadDentistsCsv,
  formatDentistCount,
  formatProviderLabel,
  formatStatusLabel,
} from '../utils'

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

type StartCrawlUiOptions = {
  forceRefresh?: boolean
  preferBatch?: boolean
  providers?: CrawlProvider[]
}

type SearchSubmissionResult = Awaited<ReturnType<typeof homeSearchStore.startCrawl>>

const providerErrors = ref<Record<CrawlProvider, ProviderFieldErrors>>({
  odontoprev: {},
  hapvida: {},
  amil: {},
  sulamerica: {},
})

const activeProviderPanel = ref<CrawlProvider | null>(null)
const isLoadingMunicipalities = ref(false)
const municipalityLoadError = ref('')
const municipalityOptions = ref<MunicipalityOption[]>([])
const municipalityOptionsByState = ref<Record<string, MunicipalityOption[]>>({})
let municipalityRequestId = 0

const providerLoadErrors = ref<Record<CrawlProvider, string>>({
  odontoprev: '',
  hapvida: '',
  amil: '',
  sulamerica: '',
})

const {
  buildPayload: buildOdontoprevPayload,
  catalog: odontoprevCatalog,
  form: odontoprevForm,
  getSelectionError: getOdontoprevSelectionError,
  handleNetworkChange: handleOdontoprevNetworkChange,
  handlePlanChange: handleOdontoprevPlanChange,
  isLoadingFilters: isLoadingOdontoprevFilters,
  loadCatalog: loadOdontoprevCatalog,
  resetForm: resetOdontoprevForm,
} = useOdontoprevCatalog({
  token: computed(() => authStore.token),
  clearLoadError: () => clearProviderLoadError('odontoprev'),
  handleLoadError: (error, fallbackMessage) =>
    handleCatalogFailure('odontoprev', error, fallbackMessage),
})

const {
  buildPayload: buildHapvidaPayload,
  catalog: hapvidaCatalog,
  form: hapvidaForm,
  isCityCompatible: isHapvidaCityCompatible,
  isLoading: isLoadingHapvidaCatalog,
  loadCityOptions: loadHapvidaCityOptions,
  loadContractTypeOptions: loadHapvidaContractTypeOptions,
  loadNeighborhoodOptions: loadHapvidaNeighborhoodOptions,
  loadProductsOptions: loadHapvidaProductsOptions,
  loadServiceOptions: loadHapvidaServiceOptions,
  loadSpecialtyOptions: loadHapvidaSpecialtyOptions,
  loadStateOptions: loadHapvidaStateOptions,
  loading: hapvidaLoadingState,
  resetForm: resetHapvidaForm,
  resetNeighborhoods: resetHapvidaNeighborhoods,
  resetProductsAndBelow: resetHapvidaProductsAndBelow,
  resetServicesAndBelow: resetHapvidaServicesAndBelow,
  resetSpecialtiesAndBelow: resetHapvidaSpecialtiesAndBelow,
  resetStatesAndBelow: resetHapvidaStatesAndBelow,
  retryCatalog: retryHapvidaCatalog,
} = useHapvidaCatalog({
  token: computed(() => authStore.token),
  selectedProviders,
  selectedStateCode: computed(() => selectedState.value?.code ?? ''),
  city,
  clearLoadError: () => clearProviderLoadError('hapvida'),
  handleLoadError: (error, fallbackMessage) =>
    handleCatalogFailure('hapvida', error, fallbackMessage),
})

const {
  buildPayload: buildAmilPayload,
  catalog: amilCatalog,
  form: amilForm,
  isCityCompatible: isAmilCityCompatible,
  isLoading: isLoadingAmilCatalog,
  loadCityOptions: loadAmilCityOptions,
  loadNeighborhoodOptions: loadAmilNeighborhoodOptions,
  loadPlanOptions: loadAmilPlanOptions,
  loadSpecialtyOptions: loadAmilSpecialtyOptions,
  loadStateOptions: loadAmilStateOptions,
  loading: amilLoadingState,
  planSelectionOptions: amilPlanSelectionOptions,
  resetCitiesAndBelow: resetAmilCitiesAndBelow,
  resetForm: resetAmilForm,
  resetNeighborhoodsAndBelow: resetAmilNeighborhoodsAndBelow,
  resetSpecialties: resetAmilSpecialties,
  resetStatesAndBelow: resetAmilStatesAndBelow,
  retryCatalog: retryAmilCatalog,
  selectedPlan: selectedAmilPlan,
} = useAmilCatalog({
  token: computed(() => authStore.token),
  selectedProviders,
  selectedStateCode: computed(() => selectedState.value?.code ?? ''),
  city,
  clearLoadError: () => clearProviderLoadError('amil'),
  handleLoadError: (error, fallbackMessage) =>
    handleCatalogFailure('amil', error, fallbackMessage),
})

const {
  buildPayload: buildSulamericaPayload,
  catalog: sulamericaCatalog,
  form: sulamericaForm,
  isCityCompatible: isSulamericaCityCompatible,
  isLoading: isLoadingSulamericaCatalog,
  loadCityOptions: loadSulamericaCityOptions,
  loadHourOptions: loadSulamericaHourOptions,
  loadPlanOptions: loadSulamericaPlanOptions,
  loadProductOptions: loadSulamericaProductOptions,
  loading: sulamericaLoadingState,
  resetCitiesAndBelow: resetSulamericaCitiesAndBelow,
  resetForm: resetSulamericaForm,
  resetPlansAndBelow: resetSulamericaPlansAndBelow,
  retryCatalog: retrySulamericaCatalog,
} = useSulamericaCatalog({
  token: computed(() => authStore.token),
  selectedProviders,
  selectedStateCode: computed(() => selectedState.value?.code ?? ''),
  city,
  clearLoadError: () => clearProviderLoadError('sulamerica'),
  handleLoadError: (error, fallbackMessage) =>
    handleCatalogFailure('sulamerica', error, fallbackMessage),
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

const {
  displayDentists,
  first: resultsFirst,
  paginatedDentists,
  resetFirst: resetResultsFirst,
  rows: resultsRows,
  shouldShowPaginator: shouldShowResultsPaginator,
} = useDentistResults({
  currentBatch,
  currentBatchResults,
  currentDentists,
  resetKeys: computed(() => [dentistsJobId.value, batchDentistsBatchId.value]),
})

const { startPolling: schedulePolling, stopPolling } = useJobPolling({
  token: computed(() => authStore.token),
  isTrackingRunning,
  refreshCurrentStatus,
})

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
    providerErrors.value[provider] = {}
    return
  }

  providerErrors.value = {
    odontoprev: {},
    hapvida: {},
    amil: {},
    sulamerica: {},
  }
}

function clearProviderLoadError(provider: CrawlProvider) {
  providerLoadErrors.value[provider] = ''
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
  providerLoadErrors.value[provider] = message

  toast.add({
    severity: 'error',
    summary: message,
    life: 4000,
  })
}

async function loadMunicipalityOptions(stateCode: string) {
  municipalityLoadError.value = ''

  if (municipalityOptionsByState.value[stateCode]) {
    municipalityOptions.value = municipalityOptionsByState.value[stateCode]
    return
  }

  const currentRequestId = ++municipalityRequestId
  isLoadingMunicipalities.value = true

  try {
    const options = await getMunicipalitiesByState(stateCode)

    if (currentRequestId !== municipalityRequestId || selectedState.value?.code !== stateCode) {
      return
    }

    municipalityOptionsByState.value[stateCode] = options
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

function resetProviderFilters() {
  resetOdontoprevForm()
  resetHapvidaForm()
  resetAmilForm()
  resetSulamericaForm()
}

function clearProviderFeedback() {
  providerLoadErrors.value = {
    odontoprev: '',
    hapvida: '',
    amil: '',
    sulamerica: '',
  }
  resetProviderErrors()
}

function isProviderCatalogLoading(provider: CrawlProvider) {
  if (provider === 'odontoprev') {
    return isLoadingOdontoprevFilters.value
  }

  if (provider === 'hapvida') {
    return isLoadingHapvidaCatalog.value
  }

  if (provider === 'amil') {
    return isLoadingAmilCatalog.value
  }

  return isLoadingSulamericaCatalog.value
}

function isProviderPanelActive(provider: CrawlProvider) {
  return activeProviderPanel.value === provider
}

async function handleRetryProviderCatalog(provider: CrawlProvider) {
  const token = await getActiveAuthToken()

  if (!token || isProviderCatalogLoading(provider)) {
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
      const selectionError = getOdontoprevSelectionError()

      if (selectionError) {
        providerErrors.value.odontoprev.selection = selectionError
      }
    }
  }

  return (
    Object.keys(providerErrors.value.odontoprev).length === 0 &&
    Object.keys(providerErrors.value.hapvida).length === 0 &&
    Object.keys(providerErrors.value.amil).length === 0 &&
    Object.keys(providerErrors.value.sulamerica).length === 0
  )
}

function buildProviderOptionsPayload(options: StartCrawlUiOptions = {}): QueueBatchProviderOptions | undefined {
  const nextOptions: QueueBatchProviderOptions = {}
  const providers = options.providers ?? selectedProviders.value
  const shouldForceRefresh = (provider: CrawlProvider) =>
    Boolean(options.forceRefresh && (options.preferBatch || provider === 'amil'))

  if (providers.includes('odontoprev')) {
    const odontoprevOptions = buildOdontoprevPayload({
      forceRefresh: shouldForceRefresh('odontoprev'),
    })

    if (odontoprevOptions) {
      nextOptions.odontoprev = odontoprevOptions
    }
  }

  if (providers.includes('hapvida')) {
    const hapvidaOptions = buildHapvidaPayload({
      forceRefresh: shouldForceRefresh('hapvida'),
    })

    if (hapvidaOptions) {
      nextOptions.hapvida = hapvidaOptions
    }
  }

  if (providers.includes('amil')) {
    const amilOptions = buildAmilPayload({
      forceRefresh: shouldForceRefresh('amil'),
    })

    if (amilOptions) {
      nextOptions.amil = amilOptions
    }
  }

  if (providers.includes('sulamerica')) {
    const sulamericaOptions = buildSulamericaPayload({
      forceRefresh: shouldForceRefresh('sulamerica'),
    })

    if (sulamericaOptions) {
      nextOptions.sulamerica = sulamericaOptions
    }
  }

  return Object.keys(nextOptions).length > 0 ? nextOptions : undefined
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

function exportDentistsAsCsv() {
  downloadDentistsCsv({
    dentists: displayDentists.value,
    providers: selectedProviders.value,
    city: city.value,
  })
}

async function redirectToExpiredSessionLogin(): Promise<void> {
  await router.push({
    path: '/login',
    query: {
      redirect: router.currentRoute.value.fullPath,
      expired: '1',
    },
  })
}

async function getActiveAuthToken(): Promise<string | null> {
  if (authStore.ensureActiveSession()) {
    return authStore.token
  }

  await redirectToExpiredSessionLogin()

  return null
}

async function loadResultsForCurrentSearch(force = false) {
  const token = await getActiveAuthToken()

  if (!token) {
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
      await homeSearchStore.refreshCurrentBatchDentists(token, currentBatch.value.batchId)
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
      await homeSearchStore.refreshCurrentDentists(token, currentJob.value.jobId)
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

  authStore.logout('expired')

  toast.add({
    severity: 'warn',
    summary: 'Sua sessao expirou. Faca login novamente.',
    life: 3500,
  })

  await redirectToExpiredSessionLogin()

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
  resetResultsFirst()
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
  const token = await getActiveAuthToken()

  if (!token) {
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
  const token = await getActiveAuthToken()

  if (!token) {
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

    let finalError = error
    const failedProvider = shouldRetryWithoutProvider(finalError, options)

    if (failedProvider && isApiError(finalError)) {
      try {
        await retrySearchWithoutProvider(failedProvider, options, finalError.message)
        return
      } catch (retryError) {
        if (await handleUnauthorized(retryError)) {
          return
        }

        finalError = retryError
      }
    }

    if (isApiError(finalError) && Object.keys(finalError.validationErrors).length === 0) {
      toast.add({
        severity: 'error',
        summary: finalError.message,
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
  const token = await getActiveAuthToken()

  if (!token) {
    return
  }

  try {
    if (currentBatchId.value) {
      await homeSearchStore.refreshCurrentBatch(token)
      return
    }

    if (currentJobId.value) {
      await homeSearchStore.refreshCurrentJob(token)
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
    municipalityOptions.value = value ? municipalityOptionsByState.value[value] ?? [] : []

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

let lastStatus: string | null = null

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
          <ProviderPicker v-model="selectedProviders" :options="providerOptions" />

          <SearchFormPanel
            v-model:city="city"
            v-model:selected-state="selectedState"
            :can-clear-screen="canClearScreen"
            :can-submit-search="canSubmitSearch"
            :form-error="formError"
            :form-errors="formErrors"
            :is-loading-municipalities="isLoadingMunicipalities"
            :is-submitting="isSubmitting"
            :municipality-load-error="municipalityLoadError"
            :municipality-options="municipalityOptions"
            :municipality-placeholder="municipalityPlaceholder"
            :search-button-label="searchButtonLabel"
            :search-state-options="searchStateOptions"
            :selected-providers-count="selectedProviders.length"
            @clear="handleClearScreen"
            @retry="handleRetrySearch"
            @retry-municipalities="selectedState?.code && loadMunicipalityOptions(selectedState.code)"
            @search="handleStartCrawl"
          />

          <div v-if="selectedProviders.length > 0" class="provider-panels">
            <ProviderFilterSwitcher
              :active-provider="activeProviderPanel"
              :options="selectedProviderOptions"
              @select="handleOpenProviderPanel"
            />

            <OdontoprevFiltersPanel
              v-if="activeProviderPanel === 'odontoprev'"
              v-model:acessibilidade="odontoprevForm.acessibilidade"
              v-model:codigo-especialidade="odontoprevForm.codigoEspecialidade"
              v-model:idioma="odontoprevForm.idioma"
              v-model:is-atende-whats-app="odontoprevForm.isAtendeWhatsApp"
              v-model:is-especialista="odontoprevForm.isEspecialista"
              v-model:nome-dentista="odontoprevForm.nomeDentista"
              :codigo-plano="odontoprevForm.codigoPlano"
              :codigo-rede="odontoprevForm.codigoRede"
              :especialidades="odontoprevCatalog.especialidades"
              :is-loading="isLoadingOdontoprevFilters"
              :load-error="providerLoadErrors.odontoprev"
              :planos="odontoprevCatalog.planos"
              :redes="odontoprevCatalog.redes"
              :selection-error="providerErrors.odontoprev.selection ?? ''"
              @network-change="handleOdontoprevNetworkChange"
              @plan-change="handleOdontoprevPlanChange"
              @retry="handleRetryProviderCatalog('odontoprev')"
            />

            <HapvidaFiltersPanel
              v-if="activeProviderPanel === 'hapvida'"
              v-model:bairro="hapvidaForm.bairro"
              v-model:especialidade="hapvidaForm.especialidade"
              v-model:produto="hapvidaForm.produto"
              v-model:servico="hapvidaForm.servico"
              v-model:tipo-contrato="hapvidaForm.tipoContrato"
              :cities="hapvidaCatalog.cities"
              :contract-types="hapvidaCatalog.contractTypes"
              :errors="providerErrors.hapvida"
              :has-location="Boolean(trimValue(city) && selectedState)"
              :is-city-compatible="isHapvidaCityCompatible"
              :is-retrying="isRetryingActiveProvider"
              :load-error="providerLoadErrors.hapvida"
              :loading="hapvidaLoadingState"
              :neighborhoods="hapvidaCatalog.neighborhoods"
              :products="hapvidaCatalog.products"
              :services="hapvidaCatalog.services"
              :specialties="hapvidaCatalog.specialties"
              @retry="handleRetryProviderCatalog('hapvida')"
            />

            <AmilFiltersPanel
              v-if="activeProviderPanel === 'amil'"
              v-model:bairro="amilForm.bairro"
              v-model:especialidade="amilForm.especialidade"
              v-model:selected-plan-key="amilForm.selectedPlanKey"
              :cities="amilCatalog.cities"
              :errors="providerErrors.amil"
              :has-location="Boolean(trimValue(city) && selectedState)"
              :is-city-compatible="isAmilCityCompatible"
              :is-retrying="isRetryingActiveProvider"
              :load-error="providerLoadErrors.amil"
              :loading="amilLoadingState"
              :neighborhoods="amilCatalog.neighborhoods"
              :plan-options="amilPlanSelectionOptions"
              :selected-plan="selectedAmilPlan"
              :specialties="amilCatalog.specialties"
              @retry="handleRetryProviderCatalog('amil')"
            />

            <SulamericaFiltersPanel
              v-if="activeProviderPanel === 'sulamerica'"
              v-model:horario-final="sulamericaForm.horarioFinal"
              v-model:horario-inicial="sulamericaForm.horarioInicial"
              v-model:plano="sulamericaForm.plano"
              v-model:produto="sulamericaForm.produto"
              :cities="sulamericaCatalog.cities"
              :errors="providerErrors.sulamerica"
              :hours="sulamericaCatalog.hours"
              :is-city-compatible="isSulamericaCityCompatible"
              :is-retrying="isRetryingActiveProvider"
              :load-error="providerLoadErrors.sulamerica"
              :loading="sulamericaLoadingState"
              :plans="sulamericaCatalog.plans"
              :products="sulamericaCatalog.products"
              @retry="handleRetryProviderCatalog('sulamerica')"
            />
          </div>

          <SearchStatusCard
            v-if="showStatusCard"
            :can-submit-search="canSubmitSearch"
            :is-batch="Boolean(currentBatch)"
            :is-refreshing="isRefreshingJob || isRefreshingBatch"
            :is-submitting="isSubmitting"
            :is-tracking-running="isTrackingRunning"
            :show-retry="activeStatus === 'failed'"
            :status-label="statusLabel"
            :status-rows="statusRows"
            :status-severity="statusSeverity"
            @refresh="refreshCurrentStatus"
            @retry="handleRetrySearch"
          />

          <CompletedSummary
            v-if="showCompletedBanner"
            :is-submitting="isSubmitting"
            :items="completedSummaryItems"
            :show-retry="isPartialFailedState"
            @retry="handleRetrySearch"
          />
        </div>
      </section>

      <DentistResultsSection
        v-if="showResultsSection"
        v-model:first="resultsFirst"
        v-model:rows="resultsRows"
        :dentists="displayDentists"
        :helper-text="providerHelperText"
        :is-loading="isRefreshingDentists || isRefreshingBatchDentists"
        :is-terminal-state="isTerminalState"
        :location-summary="locationSummary"
        :paginated-dentists="paginatedDentists"
        :paginator-template="resultsPaginatorTemplate"
        :should-show-paginator="shouldShowResultsPaginator"
        @export-csv="exportDentistsAsCsv"
      />
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
.hero-copy h1 {
  margin: 0;
  color: var(--app-page-heading-color);
  font-size: clamp(2.2rem, 4vw, 3rem);
  line-height: 1.08;
}

.hero-copy p {
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

.provider-panels {
  display: grid;
  gap: 0.9rem;
}

@media (max-width: 640px) {
  .home-shell {
    padding-inline: 0.9rem;
    padding-top: 1.5rem;
  }

  .hero-copy h1 {
    font-size: 2rem;
  }

  .search-stage-body {
    width: 100%;
  }
}
</style>
