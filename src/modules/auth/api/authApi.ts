import { apiRequest } from '@/shared/api'

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
}

export type RegisterPayload = {
  email: string
  password: string
}

export type RegisteredUser = {
  id: number
  email: string
}

export type ForgotPasswordPayload = {
  email: string
}

export type ForgotPasswordResponse = {
  message: string
  expiresInSeconds?: number
  debug?: {
    previewFile?: string
    mailSent?: boolean
  }
}

export type ResetPasswordPayload = {
  token: string
  password: string
}

export type ResetPasswordResponse = {
  message: string
}

export function loginUser(payload: LoginPayload) {
  return apiRequest<LoginResponse>('/auth/login', {
    body: payload,
    method: 'POST',
  })
}

export function registerUser(payload: RegisterPayload) {
  return apiRequest<RegisteredUser>('/users/register', {
    body: payload,
    method: 'POST',
  })
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return apiRequest<ForgotPasswordResponse>('/auth/forgot-password', {
    body: payload,
    method: 'POST',
  })
}

export function resetPassword(payload: ResetPasswordPayload) {
  return apiRequest<ResetPasswordResponse>('/auth/reset-password', {
    body: payload,
    method: 'POST',
  })
}
