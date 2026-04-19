import { defineComponent, ref } from 'vue'

import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useJobPolling } from '..'

describe('useJobPolling', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not start polling without token or active tracking', () => {
    vi.useFakeTimers()
    const refreshCurrentStatus = vi.fn().mockResolvedValue(undefined)
    let polling!: ReturnType<typeof useJobPolling>

    mount(defineComponent({
      setup() {
        polling = useJobPolling({
          token: ref(null),
          isTrackingRunning: ref(true),
          refreshCurrentStatus,
          intervalMs: 10,
        })

        return {}
      },
      template: '<div />',
    }))

    polling.startPolling()

    expect(polling.isPolling.value).toBe(false)
    expect(refreshCurrentStatus).not.toHaveBeenCalled()
  })

  it('refreshes status on an interval while tracking is active', async () => {
    vi.useFakeTimers()
    const refreshCurrentStatus = vi.fn().mockResolvedValue(undefined)
    const isTrackingRunning = ref(true)
    let polling!: ReturnType<typeof useJobPolling>

    mount(defineComponent({
      setup() {
        polling = useJobPolling({
          token: ref('jwt-token'),
          isTrackingRunning,
          refreshCurrentStatus,
          intervalMs: 10,
        })

        return {}
      },
      template: '<div />',
    }))

    polling.startPolling()

    expect(polling.isPolling.value).toBe(true)

    await vi.advanceTimersByTimeAsync(10)

    expect(refreshCurrentStatus).toHaveBeenCalledTimes(1)
    expect(polling.isPolling.value).toBe(true)

    isTrackingRunning.value = false
    await vi.advanceTimersByTimeAsync(10)

    expect(refreshCurrentStatus).toHaveBeenCalledTimes(2)
    expect(polling.isPolling.value).toBe(false)
  })

  it('stops polling and clears pending refreshes', async () => {
    vi.useFakeTimers()
    const refreshCurrentStatus = vi.fn().mockResolvedValue(undefined)
    let polling!: ReturnType<typeof useJobPolling>

    mount(defineComponent({
      setup() {
        polling = useJobPolling({
          token: ref('jwt-token'),
          isTrackingRunning: ref(true),
          refreshCurrentStatus,
          intervalMs: 10,
        })

        return {}
      },
      template: '<div />',
    }))

    polling.startPolling()
    polling.stopPolling()

    await vi.advanceTimersByTimeAsync(10)

    expect(polling.isPolling.value).toBe(false)
    expect(refreshCurrentStatus).not.toHaveBeenCalled()
  })
})
