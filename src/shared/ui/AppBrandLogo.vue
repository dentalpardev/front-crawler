<script setup lang="ts">
import { computed } from 'vue'

import dentalparDarkMode from '@/shared/assets/branding/dentalpar-dark-mode.png'
import dentalparLightMode from '@/shared/assets/branding/dentalpar-light-mode.png'
import { useColorMode } from '@/shared/composables/useColorMode'

withDefaults(
  defineProps<{
    alt?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    alt: 'Dentalpar',
    size: 'md',
  },
)

const { isDarkMode } = useColorMode()
const logoSrc = computed(() => (isDarkMode.value ? dentalparDarkMode : dentalparLightMode))
</script>

<template>
  <span :class="['brand-logo', `brand-logo--${size}`]">
    <img :alt="alt" :src="logoSrc" class="brand-logo-image" />
  </span>
</template>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.brand-logo-image {
  display: block;
  width: auto;
}

.brand-logo--xs .brand-logo-image {
  height: 1.1rem;
}

.brand-logo--sm .brand-logo-image {
  height: 2.5rem;
}

.brand-logo--md .brand-logo-image {
  height: 3.25rem;
}

.brand-logo--lg .brand-logo-image {
  height: 4.25rem;
}

.brand-logo--xl .brand-logo-image {
  height: 6rem;
}
</style>
