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
const JWT_EXPIRATION_GRACE_MS = 30_000

type AuthSession = {
  email: string
  token: string
}

type LogoutReason = 'expired' | 'manual'

type AuthStoreState = {
  ensureActiveSession: () => boolean
  expiresAt: ComputedRef<number | null>
  isAuthenticated: ComputedRef<boolean>
  isSessionExpired: ComputedRef<boolean>
  lastLogoutReason: Ref<LogoutReason | null>
  session: Ref<AuthSession | null>
  token: ComputedRef<string | null>
  userEmail: ComputedRef<string>
  setSession: (nextSession: AuthSession) => void
  login: (credentials: LoginPayload) => Promise<LoginResponse>
  register: (payload: RegisterPayload) => Promise<RegisteredUser>
  logout: (reason?: LogoutReason) => void
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')

  return window.atob(paddedBase64)
}

function getJwtExpiresAt(token: string): number | null {
  const [, payload] = token.split('.')

  if (!payload) {
    return null
  }

  try {
    const parsedPayload = JSON.parse(decodeBase64Url(payload)) as unknown

    if (
      !parsedPayload ||
      typeof parsedPayload !== 'object' ||
      !('exp' in parsedPayload) ||
      typeof parsedPayload.exp !== 'number'
    ) {
      return null
    }

    return parsedPayload.exp * 1000
  } catch {
    return null
  }
}

function isExpiredToken(token: string): boolean {
  const expiresAt = getJwtExpiresAt(token)

  return expiresAt !== null && expiresAt <= Date.now() + JWT_EXPIRATION_GRACE_MS
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
  const lastLogoutReason = ref<LogoutReason | null>(null)

  const expiresAt = computed(() => (session.value?.token ? getJwtExpiresAt(session.value.token) : null))
  const isSessionExpired = computed(() => Boolean(session.value?.token && isExpiredToken(session.value.token)))
  const isAuthenticated = computed(() => Boolean(session.value?.token && !isSessionExpired.value))
  const token = computed(() => session.value?.token ?? null)
  const userEmail = computed(() => session.value?.email ?? '')

  function ensureActiveSession(): boolean {
    if (!session.value?.token) {
      return false
    }

    if (isExpiredToken(session.value.token)) {
      logout('expired')
      return false
    }

    return true
  }

  async function login(credentials: LoginPayload): Promise<LoginResponse> {
    const response = await loginUser(credentials)

    const nextSession = normalizeSession({
      email: credentials.email.trim(),
      token: response.token,
    })

    if (!nextSession) {
      throw new Error('Nao foi possivel iniciar a sessao.')
    }

    if (isExpiredToken(nextSession.token)) {
      throw new Error('A sessao recebida esta expirada.')
    }

    session.value = nextSession
    lastLogoutReason.value = null

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

    if (isExpiredToken(normalizedSession.token)) {
      logout('expired')
      return
    }

    session.value = normalizedSession
    lastLogoutReason.value = null

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedSession))
    }
  }

  async function register(payload: RegisterPayload): Promise<RegisteredUser> {
    return registerUser(payload)
  }

  function logout(reason: LogoutReason = 'manual'): void {
    session.value = null
    lastLogoutReason.value = reason

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  return {
    ensureActiveSession,
    expiresAt,
    isAuthenticated,
    isSessionExpired,
    lastLogoutReason,
    session,
    token,
    userEmail,
    setSession,
    login,
    register,
    logout,
  }
})
