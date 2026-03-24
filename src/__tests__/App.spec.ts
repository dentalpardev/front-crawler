import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mount } from '@vue/test-utils'

import AppShell from '@/app/AppShell.vue'
import { createAppRouter } from '@/app/router'

describe('App shell', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn()
  })

  it('renders the home module through the app router', async () => {
    const router = createAppRouter()

    router.push('/')
    await router.isReady()

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Base modular pronta para crescer')
    expect(wrapper.text()).toContain('src/modules/home')
  })
})
