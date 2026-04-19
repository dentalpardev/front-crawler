import { computed, nextTick, ref } from 'vue'

import { describe, expect, it } from 'vitest'

import type { BatchDentistsProviderResult, CrawlBatchResponse, JobDentist } from '../../api'
import { useDentistResults } from '..'

function createDentist(nome: string): JobDentist {
  return {
    provider: 'odontoprev',
    externalId: nome,
    nome,
    area: null,
    cro: null,
    nomeFantasia: null,
    email: null,
    telefone: null,
    whatsapp: null,
    atendeWhatsapp: false,
    tipoPessoa: null,
    tipoPrestador: null,
    cnpj: null,
    logradouro: null,
    bairro: null,
    cep: null,
    cidade: 'Barueri',
    uf: 'SP',
    latitude: null,
    longitude: null,
    especialidades: [],
    possuiTituloEspecialidade: false,
    programaAcreditacao: false,
    qualidadeMonitorada: false,
    posGraduadoLatoSenso: false,
    mestrado: false,
    comunicacaoEventosAdversos: false,
    certificacoesEntidadesGestoras: false,
    certificacaoIso9001: false,
    residencia: false,
    tituloEspecialista: false,
    doutoradoPosGraduacao: false,
    acessibilidadeCadeirante: false,
    boaconsultaUrl: null,
  }
}

function createBatch(): CrawlBatchResponse {
  return {
    batchId: 'batch-1',
    cidade: 'Barueri',
    uf: 'SP',
    status: 'done',
    totalJobs: 1,
    completedJobs: 1,
    failedJobs: 0,
    totalDentists: 2,
    jobs: [],
  }
}

describe('useDentistResults', () => {
  it('uses job dentists when there is no active batch', () => {
    const currentBatch = ref<CrawlBatchResponse | null>(null)
    const currentDentists = ref([createDentist('Job 1'), createDentist('Job 2')])
    const currentBatchResults = ref<BatchDentistsProviderResult[]>([])

    const results = useDentistResults({
      currentBatch,
      currentDentists,
      currentBatchResults,
      initialRows: 1,
    })

    expect(results.displayDentists.value.map((dentist) => dentist.nome)).toEqual(['Job 1', 'Job 2'])
    expect(results.paginatedDentists.value.map((dentist) => dentist.nome)).toEqual(['Job 1'])
    expect(results.shouldShowPaginator.value).toBe(true)
  })

  it('uses flattened batch results when there is an active batch', () => {
    const currentBatch = ref<CrawlBatchResponse | null>(createBatch())
    const currentDentists = ref([createDentist('Job')])
    const currentBatchResults = ref<BatchDentistsProviderResult[]>([
      { provider: 'odontoprev', total: 1, dentists: [createDentist('Batch 1')] },
      { provider: 'amil', total: 1, dentists: [createDentist('Batch 2')] },
    ])

    const results = useDentistResults({
      currentBatch,
      currentDentists,
      currentBatchResults,
    })

    expect(results.displayDentists.value.map((dentist) => dentist.nome)).toEqual(['Batch 1', 'Batch 2'])
  })

  it('keeps first inside the available page range', async () => {
    const currentBatch = ref<CrawlBatchResponse | null>(null)
    const currentDentists = ref([createDentist('1'), createDentist('2'), createDentist('3')])
    const currentBatchResults = ref<BatchDentistsProviderResult[]>([])

    const results = useDentistResults({
      currentBatch,
      currentDentists,
      currentBatchResults,
      initialRows: 2,
    })

    results.first.value = 4
    currentDentists.value = [createDentist('1')]

    await nextTick()

    expect(results.first.value).toBe(0)
  })

  it('resets first when reset keys change', async () => {
    const currentBatch = ref<CrawlBatchResponse | null>(null)
    const currentDentists = ref([createDentist('1')])
    const currentBatchResults = ref<BatchDentistsProviderResult[]>([])
    const resetKey = ref('job-1')

    const results = useDentistResults({
      currentBatch,
      currentDentists,
      currentBatchResults,
      resetKeys: computed(() => [resetKey.value]),
    })

    results.first.value = 12
    resetKey.value = 'job-2'

    await nextTick()

    expect(results.first.value).toBe(0)
  })
})
