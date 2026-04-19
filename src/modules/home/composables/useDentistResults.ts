import { computed, ref, watch, type Ref } from 'vue'

import type {
  BatchDentistsProviderResult,
  CrawlBatchResponse,
  JobDentist,
} from '../api'

export function useDentistResults(options: {
  currentBatch: Ref<CrawlBatchResponse | null>
  currentDentists: Ref<JobDentist[]>
  currentBatchResults: Ref<BatchDentistsProviderResult[]>
  resetKeys?: Ref<readonly unknown[]>
  initialRows?: number
}) {
  const first = ref(0)
  const rows = ref(options.initialRows ?? 12)

  const displayDentists = computed(() => {
    if (options.currentBatch.value) {
      return options.currentBatchResults.value.flatMap((result) => result.dentists)
    }

    return options.currentDentists.value
  })

  const paginatedDentists = computed(() =>
    displayDentists.value.slice(first.value, first.value + rows.value),
  )

  const shouldShowPaginator = computed(() => displayDentists.value.length > rows.value)

  function resetFirst(): void {
    first.value = 0
  }

  if (options.resetKeys) {
    watch(options.resetKeys, resetFirst)
  }

  watch(
    () => [displayDentists.value.length, rows.value] as const,
    ([total, currentRows]) => {
      if (total === 0) {
        first.value = 0
        return
      }

      if (first.value >= total) {
        first.value = Math.max(0, Math.floor((total - 1) / currentRows) * currentRows)
      }
    },
  )

  return {
    displayDentists,
    first,
    paginatedDentists,
    resetFirst,
    rows,
    shouldShowPaginator,
  }
}
