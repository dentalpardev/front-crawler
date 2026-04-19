import { computed, ref, type ComputedRef, type Ref } from 'vue'

import { defineStore } from 'pinia'

import {
  loginUser,
  registerUser,
  type LoginPayload,
  type LoginResponse,
  type RegisteredUser,
  type RegisterPayload,
} from '../api'

const AUTH_STORAGE_KEY = 'dentalpar-auth-session'

type AuthSession = {
  email: string
  token: string
}

type AuthStoreState = {
  isAuthenticated: ComputedRef<boolean>
  session: Ref<AuthSession | null>
  token: ComputedRef<string | null>
  userEmail: ComputedRef<string>
  setSession: (nextSession: AuthSession) => void
  login: (credentials: LoginPayload) => Promise<LoginResponse>
  register: (payload: RegisterPayload) => Promise<RegisteredUser>
  logout: () => void
}

function normalizeSession(session: unknown): AuthSession | null {
  if (!session || typeof session !== 'object') {
    return null
  }

  const email = 'email' in session && typeof session.email === 'string' ? session.email.trim() : ''
  const token = 'token' in session && typeof session.token === 'string' ? session.token.trim() : ''

  if (!email || !token) {
    return null
  }

  return { email, token }
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    const parsedSession = normalizeSession(JSON.parse(rawSession))

    if (!parsedSession) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return parsedSession
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export const useAuthStore = defineStore('auth', (): AuthStoreState => {
  const session = ref<AuthSession | null>(readStoredSession())

  const isAuthenticated = computed(() => Boolean(session.value?.token))
  const token = computed(() => session.value?.token ?? null)
  const userEmail = computed(() => session.value?.email ?? '')

  async function login(credentials: LoginPayload): Promise<LoginResponse> {
    const response = await loginUser(credentials)

    const nextSession = normalizeSession({
      email: credentials.email.trim(),
      token: response.token,
    })

    if (!nextSession) {
      throw new Error('Nao foi possivel iniciar a sessao.')
    }

    session.value = nextSession

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session.value))
    }

    return response
  }

  function setSession(nextSession: AuthSession): void {
    const normalizedSession = normalizeSession(nextSession)

    if (!normalizedSession) {
      logout()
      return
    }

    session.value = normalizedSession

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedSession))
    }
  }

  async function register(payload: RegisterPayload): Promise<RegisteredUser> {
    return registerUser(payload)
  }

  function logout(): void {
    session.value = null

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  return {
    isAuthenticated,
    session,
    token,
    userEmail,
    setSession,
    login,
    register,
    logout,
  }
})
