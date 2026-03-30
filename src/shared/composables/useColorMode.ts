import { ref } from 'vue'

const COLOR_MODE_STORAGE_KEY = 'dentalpar-color-mode'

function getSystemPreference() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

function getStoredPreference() {
  if (typeof window === 'undefined') {
    return null
  }

  const value = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)

  if (value === 'dark' || value === 'light') {
    return value
  }

  return null
}

function hasDarkClass() {
  return typeof document !== 'undefined'
    ? document.documentElement.classList.contains('app-dark')
    : false
}

function applyColorMode(enabled: boolean) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('app-dark', enabled)
}

const isDarkMode = ref(false)
let isInitialized = false
let mediaQueryList: MediaQueryList | null = null

function initializeColorMode() {
  if (isInitialized) {
    return
  }

  const storedPreference = getStoredPreference()
  isDarkMode.value =
    storedPreference === 'dark'
      ? true
      : storedPreference === 'light'
        ? false
        : hasDarkClass()
          ? true
          : getSystemPreference()

  applyColorMode(isDarkMode.value)

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQueryList.addEventListener('change', (event) => {
      if (getStoredPreference()) {
        return
      }

      isDarkMode.value = event.matches
      applyColorMode(event.matches)
    })
  }

  isInitialized = true
}

function setColorMode(enabled: boolean) {
  isDarkMode.value = enabled
  applyColorMode(enabled)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, enabled ? 'dark' : 'light')
  }
}

export function useColorMode() {
  initializeColorMode()

  function toggleColorMode() {
    setColorMode(!isDarkMode.value)
  }

  return {
    isDarkMode,
    setColorMode,
    toggleColorMode,
  }
}
