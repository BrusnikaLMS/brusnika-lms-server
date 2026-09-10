import { create } from 'zustand'
import { authApi } from '../api/client'

interface User {
  id: string
  email: string
  name: string
  plan: string
  avatar_url?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  initialized: boolean

  loginWithToken: (accessToken: string, refreshToken: string) => Promise<void>
  logout: () => void
  init: () => Promise<void>
  refreshAccessToken: () => Promise<string | null>
}

// ── Cookie helpers (shared across subdomains via .cforj.studio) ──────────────
const COOKIE_NAME = 'cs_token'
const REFRESH_COOKIE = 'cs_refresh'
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const isAuthSubdomain = !isLocalhost && window.location.hostname.startsWith('auth.')
const COOKIE_DOMAIN = isLocalhost ? '' : '.cforj.studio'
const COOKIE_SECURE = location.protocol === 'https:' ? '; secure' : ''
const COOKIE_DOMAIN_ATTR = COOKIE_DOMAIN ? `; domain=${COOKIE_DOMAIN}` : ''

const ACCESS_MAX_AGE = 20 * 60
const REFRESH_MAX_AGE = 30 * 24 * 3600

function setTokenCookie(name: string, token: string, maxAge: number) {
  document.cookie = `${name}=${token}; path=/${COOKIE_DOMAIN_ATTR}; max-age=${maxAge}; samesite=strict${COOKIE_SECURE}`
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/${COOKIE_DOMAIN_ATTR}; max-age=0${COOKIE_SECURE}`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function getToken(): string | null {
  if (isAuthSubdomain) return getCookie(COOKIE_NAME)
  return localStorage.getItem(COOKIE_NAME) || getCookie(COOKIE_NAME)
}

function getRefreshToken(): string | null {
  if (isAuthSubdomain) return getCookie(REFRESH_COOKIE)
  return localStorage.getItem(REFRESH_COOKIE) || getCookie(REFRESH_COOKIE)
}

export function saveTokens(accessToken: string, refreshToken: string) {
  if (!isAuthSubdomain) {
    localStorage.setItem(COOKIE_NAME, accessToken)
    localStorage.setItem(REFRESH_COOKIE, refreshToken)
  }
  setTokenCookie(COOKIE_NAME, accessToken, ACCESS_MAX_AGE)
  setTokenCookie(REFRESH_COOKIE, refreshToken, REFRESH_MAX_AGE)
}

function removeAllTokens() {
  localStorage.removeItem(COOKIE_NAME)
  localStorage.removeItem(REFRESH_COOKIE)
  clearCookie(COOKIE_NAME)
  clearCookie(REFRESH_COOKIE)
}

// ── Fetch /auth/me helper (eliminates duplication) ───────────────────────────
const API_BASE = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL ?? '/api'

async function fetchMe(token: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getToken(),
  loading: false,
  initialized: false,

  init: async () => {
    let token = getToken()

    // No access token — try refresh before giving up
    if (!token) {
      if (getRefreshToken()) {
        token = await get().refreshAccessToken()
      }
      if (!token) {
        set({ initialized: true })
        return
      }
    }

    // Try fetching user profile
    let user = await fetchMe(token)
    if (!user) {
      // Access token expired — try refresh once
      const newToken = await get().refreshAccessToken()
      if (newToken) {
        user = await fetchMe(newToken)
        token = newToken
      }
    }

    if (user) {
      set({ user, token, initialized: true })
    } else {
      removeAllTokens()
      set({ user: null, token: null, initialized: true })
    }
  },

  refreshAccessToken: async () => {
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      const rt = getRefreshToken()
      if (!rt) return null
      try {
        const res = await authApi.refresh(rt)
        saveTokens(res.access_token, res.refresh_token)
        set({ token: res.access_token })
        return res.access_token
      } catch {
        removeAllTokens()
        set({ user: null, token: null })
        return null
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  },

  loginWithToken: async (accessToken: string, refreshToken: string) => {
    set({ loading: true })
    try {
      saveTokens(accessToken, refreshToken)
      const user = await authApi.me()
      set({ user, token: accessToken, loading: false })
    } catch (e) {
      removeAllTokens()
      set({ loading: false })
      throw e
    }
  },

  logout: () => {
    const rt = getRefreshToken()
    if (rt) authApi.logoutToken(rt).catch(() => {})
    removeAllTokens()
    set({ user: null, token: null })
  },
}))
