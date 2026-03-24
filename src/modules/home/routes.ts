import type { RouteRecordRaw } from 'vue-router'

export const HOME_ROUTE_NAME = 'home'

export const homeRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: HOME_ROUTE_NAME,
    component: () => import('./pages/HomePage.vue'),
    meta: {
      module: 'home',
    },
  },
]
