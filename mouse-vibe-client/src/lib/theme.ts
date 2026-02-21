export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/**
 * Read the persisted preference.
 * If nothing is stored yet, auto-detect from the OS and persist that choice.
 */
export function getStoredTheme(): Theme {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'light' || raw === 'dark') return raw

  // First visit: detect from OS
  const detected: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
  localStorage.setItem(STORAGE_KEY, detected)
  return detected
}

/** Persist a preference. */
export function storeTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme)
}

/** Apply the theme by toggling the `dark` class on <html>. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}
