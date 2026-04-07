import type { RouteRecordRaw } from 'vue-router'

export const LOGIN_ROUTE_NAME = 'login'
export const REGISTER_ROUTE_NAME = 'register'
export const FORGOT_PASSWORD_ROUTE_NAME = 'forgot-password'
export const RESET_PASSWORD_ROUTE_NAME = 'reset-password'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: LOGIN_ROUTE_NAME,
    component: () => import('./pages/LoginPage.vue'),
    meta: {
      module: 'auth',
      public: true,
      guestOnly: true,
    },
  },
  {
    path: '/register',
    name: REGISTER_ROUTE_NAME,
    component: () => import('./pages/RegisterPage.vue'),
    meta: {
      module: 'auth',
      public: true,
      guestOnly: true,
    },
  },
  {
    path: '/forgot-password',
    name: FORGOT_PASSWORD_ROUTE_NAME,
    component: () => import('./pages/ForgotPasswordPage.vue'),
    meta: {
      module: 'auth',
      public: true,
      guestOnly: true,
    },
  },
  {
    path: '/reset-password',
    name: RESET_PASSWORD_ROUTE_NAME,
    component: () => import('./pages/ResetPasswordPage.vue'),
    meta: {
      module: 'auth',
      public: true,
    },
  },
]
