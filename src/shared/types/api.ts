export type CrawlProvider = 'odontoprev' | 'hapvida' | 'amil' | 'sulamerica'

export type CrawlJobStatus = 'queued' | 'running' | 'done' | 'failed'

export type CrawlBatchStatus = CrawlJobStatus | 'partial_failed'
