import { computed, ref } from 'vue'

import { defineStore } from 'pinia'

import { isApiError } from '@/shared/api'
import type { CrawlProvider } from '@/shared/types'

import {
  getBatchDentists,
  getCrawlBatch,
  getCrawlJob,
  getJobDentists,
  queueCrawler,
  queueCrawlerBatch,
  type BatchDentistsProviderResult,
  type CrawlBatchResponse,
  type CrawlJobResponse,
  type JobDentist,
  type ProviderOptionsMap,
  type QueueBatchProviderOptions,
  type QueueBatchResponse,
  type QueueJobResponse,
} from '../api'

export type StateOption = {
  name: string
  code: string
}

export type ProviderOption = {
  label: string
  value: CrawlProvider
}

export type StartCrawlResult =
  | {
      type: 'job'
      response: QueueJobResponse
    }
  | {
      type: 'batch'
      response: QueueBatchResponse
    }

export type StartCrawlOptions = {
  providerOptions?: QueueBatchProviderOptions
}

const stateOptions: StateOption[] = [
  { name: 'Acre', code: 'AC' },
  { name: 'Alagoas', code: 'AL' },
  { name: 'Amapa', code: 'AP' },
  { name: 'Amazonas', code: 'AM' },
  { name: 'Bahia', code: 'BA' },
  { name: 'Ceara', code: 'CE' },
  { name: 'Distrito Federal', code: 'DF' },
  { name: 'Espirito Santo', code: 'ES' },
  { name: 'Goias', code: 'GO' },
  { name: 'Maranhao', code: 'MA' },
  { name: 'Mato Grosso', code: 'MT' },
  { name: 'Mato Grosso do Sul', code: 'MS' },
  { name: 'Minas Gerais', code: 'MG' },
  { name: 'Para', code: 'PA' },
  { name: 'Paraiba', code: 'PB' },
  { name: 'Parana', code: 'PR' },
  { name: 'Pernambuco', code: 'PE' },
  { name: 'Piaui', code: 'PI' },
  { name: 'Rio de Janeiro', code: 'RJ' },
  { name: 'Rio Grande do Norte', code: 'RN' },
  { name: 'Rio Grande do Sul', code: 'RS' },
  { name: 'Rondonia', code: 'RO' },
  { name: 'Roraima', code: 'RR' },
  { name: 'Santa Catarina', code: 'SC' },
  { name: 'Sao Paulo', code: 'SP' },
  { name: 'Sergipe', code: 'SE' },
  { name: 'Tocantins', code: 'TO' },
]

const providerOptions: ProviderOption[] = [
  { label: 'OdontoPrev', value: 'odontoprev' },
  { label: 'Hapvida', value: 'hapvida' },
  { label: 'SulAmerica', value: 'sulamerica' },
]

type FormErrors = Record<string, string>

function isFilled(value: string) {
  return value.trim().length > 0
}

function orderProviders(values: CrawlProvider[]) {
  const order = new Map(providerOptions.map((option, index) => [option.value, index]))

  return [...values].sort((left, right) => (order.get(left) ?? 0) - (order.get(right) ?? 0))
}

export const useHomeSearchStore = defineStore('home-search', () => {
  const selectedProviders = ref<CrawlProvider[]>([])
  const city = ref('')
  const selectedState = ref<StateOption | null>(null)

  const currentJobId = ref('')
  const currentBatchId = ref('')

  const currentJob = ref<CrawlJobResponse | null>(null)
  const currentBatch = ref<CrawlBatchResponse | null>(null)

  const currentDentists = ref<JobDentist[]>([])
  const currentDentistsTotal = ref<number | null>(null)
  const dentistsJobId = ref('')

  const currentBatchResults = ref<BatchDentistsProviderResult[]>([])
  const currentBatchDentistsTotal = ref<number | null>(null)
  const batchDentistsBatchId = ref('')

  const isSubmitting = ref(false)
  const isRefreshingJob = ref(false)
  const isRefreshingBatch = ref(false)
  const isRefreshingDentists = ref(false)
  const isRefreshingBatchDentists = ref(false)

  const formErrors = ref<FormErrors>({})
  const formError = ref('')

  const canSearch = computed(() => {
    return isFilled(city.value) && Boolean(selectedState.value) && selectedProviders.value.length > 0
  })

  const isBatchSelection = computed(() => selectedProviders.value.length > 1)
  const hasJob = computed(() => Boolean(currentJobId.value))
  const hasBatch = computed(() => Boolean(currentBatchId.value))
  const hasDentists = computed(() => currentDentists.value.length > 0)
  const hasBatchDentists = computed(() =>
    currentBatchResults.value.some((result) => result.dentists.length > 0),
  )
  const hasAnyDentists = computed(() => hasDentists.value || hasBatchDentists.value)

  const isJobRunning = computed(
    () => currentJob.value?.status === 'queued' || currentJob.value?.status === 'running',
  )
  const isBatchRunning = computed(
    () => currentBatch.value?.status === 'queued' || currentBatch.value?.status === 'running',
  )
  const isTrackingRunning = computed(() => isJobRunning.value || isBatchRunning.value)
  const primaryProvider = computed<CrawlProvider>(() => selectedProviders.value[0] ?? 'odontoprev')

  const activeLocationLabel = computed(() => {
    if (currentBatch.value) {
      return `${currentBatch.value.cidade}, ${currentBatch.value.uf}`
    }

    if (currentJob.value) {
      return `${currentJob.value.cidade}, ${currentJob.value.uf}`
    }

    return selectedState.value ? `${city.value.trim()}, ${selectedState.value.code}` : ''
  })

  function resetFeedback() {
    formErrors.value = {}
    formError.value = ''
  }

  function clearCurrentDentists() {
    currentDentists.value = []
    currentDentistsTotal.value = null
    dentistsJobId.value = ''
  }

  function clearCurrentBatchDentists() {
    currentBatchResults.value = []
    currentBatchDentistsTotal.value = null
    batchDentistsBatchId.value = ''
  }

  function clearCurrentResults() {
    clearCurrentDentists()
    clearCurrentBatchDentists()
  }

  function clearCurrentTracking() {
    currentJob.value = null
    currentJobId.value = ''
    currentBatch.value = null
    currentBatchId.value = ''
  }

  function validateForm() {
    const errors: FormErrors = {}

    if (!isFilled(city.value)) {
      errors.cidade = 'Informe a cidade.'
    }

    if (!selectedState.value) {
      errors.uf = 'Selecione a UF.'
    }

    if (selectedProviders.value.length === 0) {
      errors.providers = 'Selecione pelo menos um provider.'
    }

    formErrors.value = errors

    return Object.keys(errors).length === 0
  }

  function buildProviderPayload<K extends keyof ProviderOptionsMap>(
    provider: K,
    providerOptions?: QueueBatchProviderOptions,
  ) {
    return {
      cidade: city.value.trim(),
      uf: selectedState.value?.code ?? '',
      ...providerOptions?.[provider],
    } as {
      cidade: string
      uf: string
    } & ProviderOptionsMap[K]
  }

  function createQueuedJobSnapshot(jobId: string, providerValue: CrawlProvider) {
    currentJob.value = {
      jobId,
      provider: providerValue,
      cidade: city.value.trim(),
      uf: selectedState.value?.code ?? '',
      batchId: null,
      status: 'queued',
      totalDentists: null,
      errorMessage: null,
      options: {},
      queuedAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
    }
  }

  function createQueuedBatchSnapshot(response: QueueBatchResponse) {
    currentBatch.value = {
      batchId: response.batchId,
      cidade: city.value.trim(),
      uf: selectedState.value?.code ?? '',
      status: 'queued',
      totalJobs: response.jobs.length,
      completedJobs: 0,
      failedJobs: 0,
      totalDentists: 0,
      jobs: response.jobs.map((job) => ({
        jobId: job.jobId,
        provider: job.provider,
        cidade: city.value.trim(),
        uf: selectedState.value?.code ?? '',
        batchId: response.batchId,
        status: 'queued',
        totalDentists: null,
        errorMessage: null,
        options: job.options ?? {},
        queuedAt: new Date().toISOString(),
        startedAt: null,
        finishedAt: null,
      })),
    }
  }

  function toggleProviderSelection(providerValue: CrawlProvider) {
    if (selectedProviders.value.includes(providerValue)) {
      selectedProviders.value = selectedProviders.value.filter((value) => value !== providerValue)
      return
    }

    selectedProviders.value = orderProviders([...selectedProviders.value, providerValue])
  }

  async function startCrawl(
    token: string,
    options: StartCrawlOptions = {},
  ): Promise<StartCrawlResult | null> {
    resetFeedback()
    clearCurrentResults()
    clearCurrentTracking()

    if (!validateForm()) {
      return null
    }

    isSubmitting.value = true

    try {
      if (selectedProviders.value.length === 1) {
        const providerValue = selectedProviders.value[0]!
        const response = await queueCrawler(
          providerValue,
          buildProviderPayload(providerValue, options.providerOptions),
          token,
        )

        currentJobId.value = response.jobId
        createQueuedJobSnapshot(response.jobId, providerValue)

        return {
          type: 'job',
          response,
        }
      }

      const response = await queueCrawlerBatch(
        {
          cidade: city.value.trim(),
          uf: selectedState.value?.code ?? '',
          providers: selectedProviders.value,
          providerOptions: options.providerOptions,
        },
        token,
      )

      currentBatchId.value = response.batchId
      createQueuedBatchSnapshot(response)

      return {
        type: 'batch',
        response,
      }
    } catch (error) {
      if (isApiError(error)) {
        formErrors.value = error.validationErrors
        formError.value = error.message
      }

      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  async function refreshCurrentJob(token: string) {
    if (!currentJobId.value) {
      return null
    }

    isRefreshingJob.value = true

    try {
      const response = await getCrawlJob(currentJobId.value, token)

      currentJob.value = response
      return response
    } catch (error) {
      if (isApiError(error)) {
        formError.value = error.message
      }

      throw error
    } finally {
      isRefreshingJob.value = false
    }
  }

  async function refreshCurrentBatch(token: string) {
    if (!currentBatchId.value) {
      return null
    }

    isRefreshingBatch.value = true

    try {
      const response = await getCrawlBatch(currentBatchId.value, token)

      currentBatch.value = response
      return response
    } catch (error) {
      if (isApiError(error)) {
        formError.value = error.message
      }

      throw error
    } finally {
      isRefreshingBatch.value = false
    }
  }

  async function refreshCurrentDentists(token: string, jobId = currentJobId.value) {
    if (!jobId) {
      return null
    }

    isRefreshingDentists.value = true

    try {
      const response = await getJobDentists(jobId, token)

      currentDentists.value = response.dentists
      currentDentistsTotal.value = response.total
      dentistsJobId.value = response.jobId

      return response
    } catch (error) {
      if (isApiError(error)) {
        formError.value = error.message
      }

      throw error
    } finally {
      isRefreshingDentists.value = false
    }
  }

  async function refreshCurrentBatchDentists(token: string, batchId = currentBatchId.value) {
    if (!batchId) {
      return null
    }

    isRefreshingBatchDentists.value = true

    try {
      const response = await getBatchDentists(batchId, token)

      currentBatchResults.value = response.results
      currentBatchDentistsTotal.value = response.totalDentists
      batchDentistsBatchId.value = response.batchId

      return response
    } catch (error) {
      if (isApiError(error)) {
        formError.value = error.message
      }

      throw error
    } finally {
      isRefreshingBatchDentists.value = false
    }
  }

  function clearCurrentSearch() {
    clearCurrentTracking()
    clearCurrentResults()
  }

  return {
    activeLocationLabel,
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
    batchDentistsBatchId,
    formError,
    formErrors,
    hasAnyDentists,
    hasBatch,
    hasBatchDentists,
    hasDentists,
    hasJob,
    isBatchRunning,
    isBatchSelection,
    isJobRunning,
    isRefreshingBatch,
    isRefreshingBatchDentists,
    isRefreshingDentists,
    isRefreshingJob,
    isSubmitting,
    isTrackingRunning,
    primaryProvider,
    providerOptions,
    selectedProviders,
    selectedState,
    stateOptions,
    clearCurrentSearch,
    clearCurrentResults,
    refreshCurrentBatch,
    refreshCurrentBatchDentists,
    refreshCurrentDentists,
    refreshCurrentJob,
    startCrawl,
    toggleProviderSelection,
  }
})
