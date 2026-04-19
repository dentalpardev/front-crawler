import { onBeforeUnmount, ref, type Ref } from 'vue'

export function useJobPolling(options: {
  token: Ref<string | null>
  isTrackingRunning: Ref<boolean>
  refreshCurrentStatus: () => Promise<void>
  intervalMs?: number
}) {
  const isPolling = ref(false)
  const intervalMs = options.intervalMs ?? 3000
  let pollingTimer: ReturnType<typeof setTimeout> | null = null

  function stopPolling(): void {
    if (pollingTimer) {
      clearTimeout(pollingTimer)
      pollingTimer = null
    }

    isPolling.value = false
  }

  function startPolling(): void {
    stopPolling()

    if (!options.isTrackingRunning.value || !options.token.value) {
      return
    }

    isPolling.value = true
    pollingTimer = setTimeout(async () => {
      await options.refreshCurrentStatus()
      startPolling()
    }, intervalMs)
  }

  onBeforeUnmount(stopPolling)

  return {
    isPolling,
    startPolling,
    stopPolling,
  }
}
