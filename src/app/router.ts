import type { Pinia } from 'pinia'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { authRoutes } from '@/modules/auth'
import { HOME_ROUTE_NAME } from '@/modules/home'
import { LOGIN_ROUTE_NAME } from '@/modules/auth'
import { useAuthStore } from '@/modules/auth/store'
import { homeRoutes } from '@/modules/home'
import { appPinia } from './pinia'

export const appRoutes: RouteRecordRaw[] = [...homeRoutes, ...authRoutes]

function installAuthGuards(router: ReturnType<typeof createRouter>, pinia: Pinia) {
  router.beforeEach((to) => {
    const authStore = useAuthStore(pinia)

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return {
        name: LOGIN_ROUTE_NAME,
        query: {
          redirect: to.fullPath,
        },
      }
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return {
        name: HOME_ROUTE_NAME,
      }
    }

    return true
  })
}

export function createAppRouter(pinia: Pinia = appPinia) {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: appRoutes,
    scrollBehavior() {
      return { top: 0 }
    },
  })

  installAuthGuards(router, pinia)

  return router
}

const router = createAppRouter()

export default router
