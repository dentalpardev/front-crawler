import { ref, type Ref } from 'vue'

const COLOR_MODE_STORAGE_KEY = 'dentalpar-color-mode'

type ColorModeControls = {
  isDarkMode: Ref<boolean>
  setColorMode: (enabled: boolean) => void
  toggleColorMode: () => void
}

function getSystemPreference(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

function getStoredPreference(): 'dark' | 'light' | null {
  if (typeof window === 'undefined') {
    return null
  }

  const value = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)

  if (value === 'dark' || value === 'light') {
    return value
  }

  return null
}

function hasDarkClass(): boolean {
  return typeof document !== 'undefined'
    ? document.documentElement.classList.contains('app-dark')
    : false
}

function applyColorMode(enabled: boolean): void {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('app-dark', enabled)
}

const isDarkMode = ref(false)
let isInitialized = false
let mediaQueryList: MediaQueryList | null = null

function initializeColorMode(): void {
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

function setColorMode(enabled: boolean): void {
  isDarkMode.value = enabled
  applyColorMode(enabled)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, enabled ? 'dark' : 'light')
  }
}

export function useColorMode(): ColorModeControls {
  initializeColorMode()

  function toggleColorMode(): void {
    setColorMode(!isDarkMode.value)
  }

  return {
    isDarkMode,
    setColorMode,
    toggleColorMode,
  }
}
