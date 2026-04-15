import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'

import { useHomeSearchStore } from '@/modules/home/store'

const apiMocks = vi.hoisted(() => ({
  queueCrawler: vi.fn(),
  queueCrawlerBatch: vi.fn(),
}))

vi.mock('@/modules/home/api', () => ({
  getBatchDentists: vi.fn(),
  getCrawlBatch: vi.fn(),
  getCrawlJob: vi.fn(),
  getJobDentists: vi.fn(),
  queueCrawler: apiMocks.queueCrawler,
  queueCrawlerBatch: apiMocks.queueCrawlerBatch,
}))

describe('home search store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    apiMocks.queueCrawler.mockReset()
    apiMocks.queueCrawlerBatch.mockReset()
  })

  it('queues all providers in the backend batch order including Amil', async () => {
    apiMocks.queueCrawlerBatch.mockResolvedValueOnce({
      batchId: 'batch-1',
      status: 'queued',
      message: 'Crawl batch queued.',
      jobs: [
        { jobId: 'job-1', provider: 'odontoprev', status: 'queued', options: {} },
        { jobId: 'job-2', provider: 'hapvida', status: 'queued', options: {} },
        { jobId: 'job-3', provider: 'amil', status: 'queued', options: {} },
        { jobId: 'job-4', provider: 'sulamerica', status: 'queued', options: {} },
      ],
    })

    const store = useHomeSearchStore()
    store.city = 'Joinville'
    store.selectedState = { name: 'Santa Catarina', code: 'SC' }
    store.selectedProviders = ['sulamerica', 'amil', 'hapvida', 'odontoprev']

    await store.startCrawl('jwt-token')

    expect(apiMocks.queueCrawler).not.toHaveBeenCalled()
    expect(apiMocks.queueCrawlerBatch).toHaveBeenCalledWith(
      {
        cidade: 'Joinville',
        uf: 'SC',
        providers: ['odontoprev', 'hapvida', 'amil', 'sulamerica'],
      },
      'jwt-token',
    )
  })
})
