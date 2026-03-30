<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'

import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
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
import type { DentistSpecialty } from '../api'
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
    return `${selectedProviders.value.length} providers serao executados em lote para a mesma cidade e UF.`
  }

  if (primaryProvider.value === 'odontoprev') {
    return 'Fluxo mais simples: basta informar cidade e UF.'
  }

  if (primaryProvider.value === 'hapvida') {
    return 'Os parametros internos da busca agora sao resolvidos pelo backend.'
  }

  return 'Cidade e UF ja sao suficientes para iniciar a coleta.'
})

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

const searchButtonLabel = computed(() => (isSubmitting.value ? 'Buscando...' : 'Buscar'))

const displayDentists = computed(() => {
  if (currentBatch.value) {
    return currentBatchResults.value.flatMap((result) => result.dentists)
  }

  return currentDentists.value
})

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

function normalizeSpecialtyLabel(specialty: DentistSpecialty) {
  if (typeof specialty === 'string') {
    return specialty
  }

  return specialty.nome ?? specialty.descricao ?? ''
}

function getDentistSpecialties(dentist: (typeof displayDentists.value)[number]) {
  return dentist.especialidades
    .map((specialty) => normalizeSpecialtyLabel(specialty))
    .filter((value): value is string => Boolean(value))
}

function buildDentistLegendFlags(dentist: (typeof displayDentists.value)[number]) {
  return [
    dentist.programaAcreditacao ? 'Acreditacao' : null,
    dentist.qualidadeMonitorada ? 'Qualidade Monitorada' : null,
    dentist.posGraduadoLatoSenso ? 'Lato Sensu' : null,
    dentist.mestrado ? 'Mestrado' : null,
    dentist.comunicacaoEventosAdversos ? 'Eventos Adversos' : null,
    dentist.certificacoesEntidadesGestoras ? 'Entidade Gestora' : null,
    dentist.certificacaoIso9001 ? 'ISO 9001' : null,
    dentist.residencia ? 'Residencia' : null,
    dentist.tituloEspecialista || dentist.possuiTituloEspecialidade ? 'Especialista' : null,
    dentist.doutoradoPosGraduacao ? 'Doutorado' : null,
  ].filter((value): value is string => Boolean(value))
}

function hasDentistMetadata(dentist: (typeof displayDentists.value)[number]) {
  return (
    buildDentistHighlights(dentist).length > 0 ||
    buildDentistLegendFlags(dentist).length > 0 ||
    dentist.acessibilidadeCadeirante
  )
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
    'telefone',
    'whatsapp',
    'email',
    'logradouro',
    'bairro',
    'cidade',
    'uf',
    'especialidades',
    'tipo_pessoa',
    'tipo_prestador',
    'acessibilidade',
    'perfil_url',
  ]

  const escapeValue = (value: string | number | boolean | null | undefined) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`

  const rows = displayDentists.value.map((dentist) =>
    [
      formatProviderLabel(dentist.provider),
      dentist.nome,
      dentist.nomeFantasia,
      dentist.cro,
      dentist.telefone,
      dentist.whatsapp,
      dentist.email,
      dentist.logradouro,
      dentist.bairro,
      dentist.cidade,
      dentist.uf,
      getDentistSpecialties(dentist).join(' | '),
      formatProfessionalType(dentist.tipoPessoa),
      dentist.tipoPrestador,
      dentist.acessibilidadeCadeirante,
      dentist.boaconsultaUrl,
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

async function handleStartCrawl() {
  if (!authStore.token) {
    await router.push('/login')
    return
  }

  try {
    const result = await homeSearchStore.startCrawl(authStore.token)

    if (!result) {
      return
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
      await homeSearchStore.refreshCurrentBatch(authStore.token)
    } else {
      await homeSearchStore.refreshCurrentJob(authStore.token)
    }

    await loadResultsForCurrentSearch(true)
  } catch (error) {
    if (await handleUnauthorized(error)) {
      return
    }

    if (isApiError(error) && !error.validationErrors) {
      toast.add({
        severity: 'error',
        summary: error.message,
        life: 3500,
      })
    }
  }
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
              Pesquise por cidade e estado para encontrar profissionais credenciados de cada
              provider ou rode varios providers ao mesmo tempo em lote.
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
                  <InputGroup class="city-group">
                    <InputGroupAddon>
                      <i class="pi pi-send" aria-hidden="true" />
                    </InputGroupAddon>
                    <InputText
                      v-model="city"
                      :disabled="selectedProviders.length === 0"
                      :invalid="Boolean(formErrors.cidade)"
                      aria-label="Cidade"
                      autocomplete="address-level2"
                      fluid
                      placeholder="Digite a cidade..."
                    />
                  </InputGroup>

                  <Select
                    v-model="selectedState"
                    :disabled="selectedProviders.length === 0"
                    :invalid="Boolean(formErrors.uf)"
                    :options="stateOptions"
                    aria-label="Estado"
                    class="state-select"
                    fluid
                    option-label="code"
                    placeholder="Estado"
                  />

                  <Button
                    :disabled="!canSearch"
                    :label="searchButtonLabel"
                    :loading="isSubmitting"
                    class="search-submit"
                    icon="pi pi-search"
                    @click="handleStartCrawl"
                  />
                </div>

                <Message v-if="formError" severity="error" variant="outlined">
                  {{ formError }}
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

        <div v-else-if="displayDentists.length > 0" class="results-grid">
          <article
            v-for="dentist in displayDentists"
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
                <span class="tag-group-label">Legendas</span>
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
                  <Tag
                    v-for="flag in buildDentistLegendFlags(dentist)"
                    :key="flag"
                    :value="flag"
                    rounded
                    severity="secondary"
                  />
                </div>
              </div>
            </div>
          </article>
        </div>

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
  width: min(100%, 74rem);
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

.search-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 7rem auto;
  gap: 0.65rem;
  align-items: center;
}

.city-group,
.state-select,
.search-submit {
  min-height: 3rem;
}

.city-group :deep(.p-inputtext),
.state-select :deep(.p-select-label) {
  font-size: 0.98rem;
}

.city-group :deep(.p-inputgroupaddon) {
  color: var(--p-text-muted-color);
}

.search-submit {
  padding-inline: 1.2rem;
  white-space: nowrap;
}

.inline-errors {
  display: grid;
  gap: 0.35rem;
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
  width: min(100%, 56rem);
  margin: 0 auto;
  display: grid;
  gap: 1rem;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
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
  padding: 0.95rem;
  display: grid;
  gap: 0.85rem;
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

@media (max-width: 960px) {
  .results-grid {
    grid-template-columns: 1fr;
  }

  .search-submit {
    width: 100%;
    justify-content: center;
  }

  .results-header,
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

  .dentist-card-header {
    flex-direction: column;
  }
}
</style>
