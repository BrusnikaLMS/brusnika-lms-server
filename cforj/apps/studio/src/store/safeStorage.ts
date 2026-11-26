import type { StateStorage } from 'zustand/middleware'

let available: boolean | null = null
function canUseLocalStorage(): boolean {
  if (available !== null) return available
  try {
    const k = '__cforj_test__'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    available = true
  } catch {
    available = false
  }
  return available
}

export const safeStorage: StateStorage = {
  getItem(name) {
    if (!canUseLocalStorage()) return null
    return localStorage.getItem(name)
  },
  setItem(name, value) {
    if (!canUseLocalStorage()) return
    localStorage.setItem(name, value)
  },
  removeItem(name) {
    if (!canUseLocalStorage()) return
    localStorage.removeItem(name)
  },
}
