const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1'

export type ApiValidationErrors = Record<string, string>

type RequestOptions = {
  body?: unknown
  headers?: HeadersInit
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  token?: string | null
}

type ApiErrorPayload = {
  error?: string
  errors?: Record<string, unknown>
  message?: string
}

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toValidationErrors(errors: Record<string, unknown> | undefined): ApiValidationErrors {
  if (!errors) {
    return {}
  }

  return Object.entries(errors).reduce<ApiValidationErrors>((accumulator, [field, value]) => {
    accumulator[field] = String(value)
    return accumulator
  }, {})
}

function getErrorMessage(
  payload: ApiErrorPayload | null,
  validationErrors: ApiValidationErrors,
  status: number,
) {
  if (Object.keys(validationErrors).length > 0) {
    return Object.values(validationErrors)[0] ?? 'Falha de validacao.'
  }

  if (payload?.error) {
    return payload.error
  }

  if (payload?.message) {
    return payload.message
  }

  if (status === 401) {
    return 'Sua sessao expirou ou as credenciais sao invalidas.'
  }

  return 'Nao foi possivel concluir a requisicao.'
}

export class ApiError extends Error {
  status: number
  validationErrors: ApiValidationErrors

  constructor(status: number, message: string, validationErrors: ApiValidationErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.validationErrors = validationErrors
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const rawResponse = await response.text()
  const parsedResponse = rawResponse ? JSON.parse(rawResponse) as unknown : null

  if (!response.ok) {
    const payload = isRecord(parsedResponse) ? (parsedResponse as ApiErrorPayload) : null
    const validationErrors = toValidationErrors(payload?.errors)
    const message = getErrorMessage(payload, validationErrors, response.status)

    throw new ApiError(response.status, message, validationErrors)
  }

  return parsedResponse as T
}
