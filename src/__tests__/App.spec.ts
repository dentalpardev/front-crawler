import { beforeEach, describe, expect, it, vi } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'

import AppShell from '@/app/AppShell.vue'
import { primeVueOptions } from '@/app/primevue'
import { createAppRouter } from '@/app/router'

function toBase64Url(value: string): string {
  return window.btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '')
}

function createJwt(payload: Record<string, unknown>): string {
  return [
    toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    toBase64Url(JSON.stringify(payload)),
    'signature',
  ].join('.')
}

describe('App shell', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.scrollTo = vi.fn()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('renders the home module through the app router', async () => {
    window.localStorage.setItem(
      'dentalpar-auth-session',
      JSON.stringify({
        email: 'user@example.com',
        token: 'jwt-token',
      }),
    )

    const pinia = createPinia()
    const router = createAppRouter(pinia)

    router.push('/')
    await router.isReady()

    const wrapper = mount(AppShell, {
      global: {
        plugins: [pinia, [PrimeVue, primeVueOptions], ToastService, router],
      },
    })

    expect(wrapper.text()).toContain('Encontre dentistas credenciados')
    expect(wrapper.text()).toContain('Provedores')
    expect(wrapper.text()).toContain('Buscar')
  })

  it('redirects unauthenticated users from protected routes to login', async () => {
    const router = createAppRouter(createPinia())

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/')
  })

  it('expires persisted JWT sessions before entering protected routes', async () => {
    window.localStorage.setItem(
      'dentalpar-auth-session',
      JSON.stringify({
        email: 'user@example.com',
        token: createJwt({ exp: Math.floor((Date.now() - 60_000) / 1000) }),
      }),
    )

    const pinia = createPinia()
    const router = createAppRouter(pinia)

    await router.push('/')
    await router.isReady()

    const wrapper = mount(AppShell, {
      global: {
        plugins: [pinia, [PrimeVue, primeVueOptions], ToastService, router],
      },
    })

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/')
    expect(router.currentRoute.value.query.expired).toBe('1')
    expect(window.localStorage.getItem('dentalpar-auth-session')).toBeNull()
    expect(wrapper.text()).toContain('Sua sessao expirou. Faca login novamente.')
  })

  it('redirects authenticated users away from guest-only routes', async () => {
    window.localStorage.setItem(
      'dentalpar-auth-session',
      JSON.stringify({
        email: 'user@example.com',
        token: 'jwt-token',
      }),
    )

    const router = createAppRouter(createPinia())

    await router.push('/login')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('ignores malformed persisted sessions when resolving protected routes', async () => {
    window.localStorage.setItem(
      'dentalpar-auth-session',
      JSON.stringify({
        email: 'user@example.com',
        token: '   ',
      }),
    )

    const router = createAppRouter(createPinia())

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('login')
    expect(window.localStorage.getItem('dentalpar-auth-session')).toBeNull()
  })

  it('renders the login screen from the auth module', async () => {
    const pinia = createPinia()
    const router = createAppRouter(pinia)

    await router.push('/login')
    await router.isReady()

    const wrapper = mount(AppShell, {
      global: {
        plugins: [pinia, [PrimeVue, primeVueOptions], ToastService, router],
      },
    })

    expect(wrapper.text()).toContain('Dentalpar Busca Odontológica')
    expect(wrapper.text()).toContain('Entre na sua conta')
    expect(wrapper.text()).toContain('Esqueceu a senha?')
    expect(wrapper.text()).toContain('Criar conta')
  })

  it('renders the register screen from the auth module', async () => {
    const pinia = createPinia()
    const router = createAppRouter(pinia)

    await router.push('/register')
    await router.isReady()

    const wrapper = mount(AppShell, {
      global: {
        plugins: [pinia, [PrimeVue, primeVueOptions], ToastService, router],
      },
    })

    expect(wrapper.text()).toContain('Criar Conta')
    expect(wrapper.text()).toContain('Preencha seus dados para começar')
    expect(wrapper.text()).toContain('E-mail')
    expect(wrapper.text()).toContain('Confirmar senha')
    expect(wrapper.text()).toContain('Já tem uma conta?')
  })

  it('renders the forgot password screen from the auth module', async () => {
    const pinia = createPinia()
    const router = createAppRouter(pinia)

    await router.push('/forgot-password')
    await router.isReady()

    const wrapper = mount(AppShell, {
      global: {
        plugins: [pinia, [PrimeVue, primeVueOptions], ToastService, router],
      },
    })

    expect(wrapper.text()).toContain('Recuperar Senha')
    expect(wrapper.text()).toContain('Informe seu e-mail para redefinir a senha')
    expect(wrapper.text()).toContain('Enviar link de recuperação')
    expect(wrapper.text()).toContain('Voltar para o login')
  })

  it('renders the reset password screen from the auth module', async () => {
    const pinia = createPinia()
    const router = createAppRouter(pinia)

    await router.push('/reset-password?token=plain-token')
    await router.isReady()

    const wrapper = mount(AppShell, {
      global: {
        plugins: [pinia, [PrimeVue, primeVueOptions], ToastService, router],
      },
    })

    expect(wrapper.text()).toContain('Redefinir Senha')
    expect(wrapper.text()).toContain('Nova senha')
    expect(wrapper.text()).toContain('Confirmar nova senha')
    expect(wrapper.text()).toContain('Redefinir senha')
  })

  it('redirects reset password without token back to forgot password', async () => {
    const pinia = createPinia()
    const router = createAppRouter(pinia)

    await router.push('/reset-password')
    await router.isReady()

    mount(AppShell, {
      global: {
        plugins: [pinia, [PrimeVue, primeVueOptions], ToastService, router],
      },
    })

    await flushPromises()

    expect(router.currentRoute.value.name).toBe('forgot-password')
  })
})
