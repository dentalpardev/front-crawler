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
