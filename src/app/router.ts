import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { homeRoutes } from '@/modules/home'

export const appRoutes: RouteRecordRaw[] = [...homeRoutes]

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: appRoutes,
    scrollBehavior() {
      return { top: 0 }
    },
  })
}

const router = createAppRouter()

export default router
