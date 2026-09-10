import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { App } from './App'
import { EmbedPlayer } from './embed/EmbedPlayer'
import { useEditorStore, saveNow, getCourseSnapshot } from './store/editorStore'
import { useThemeStore, applyTheme } from './store/themeStore'
import { useLocaleStore } from './store/localeStore'
import { embedApi } from './api/client'
import { useLmsUserStore } from './store/lmsUserStore'
import './styles/global.css'

applyTheme(useThemeStore.getState().theme)

/**
 * postMessage API for LMS integration (H5P-style, by courseId):
 *
 * LMS → Editor:
 *   CS_CREATE_COURSE  { title?: string }             — create new course
 *   CS_LOAD_COURSE    { courseId: string }            — load existing course by ID
 *   CS_SAVE_COURSE    {}                              — force save now (manual trigger)
 *   CS_GET_COURSE     {}                              — request current course data
 *   CS_SET_CONFIG     { locale?, theme?, themePalette?, userId? } — set language / theme / palette / LMS user
 *
 * Editor → LMS:
 *   CS_READY            {}                            — editor mounted and ready
 *   CS_COURSE_CREATED   { courseId }                  — new course created
 *   CS_COURSE_LOADED    { courseId }                  — course loaded in editor
 *   CS_COURSE_SAVED     { courseId }                  — course saved to API
 *   CS_SAVE_ERROR       { courseId, error }           — save failed
 *   CS_COURSE_DATA      { courseId, content }         — response to CS_GET_COURSE
 *   CS_ERROR            { error }                     — general error
 *
 * Player:
 *   Just use URL: /player/{courseId} — no postMessage needed
 */

/**
 * Apply LMS theme palette to CSS custom properties.
 * Maps LMS color roles to our CSS variables:
 *   primary   → --color-primary (main accent)
 *   secondary → --color-primary-dark (secondary accent / hover)
 *   dark      → --bg-app (page background)
 *   info      → --bg-surface (card/panel background)
 *   negative  → --bg-hover (input background)
 *   accent    → --text-base (primary text)
 *   positive  → --text-muted (secondary text)
 *   warning   → --color-error (warning/error)
 *   success   → --color-success
 */
function applyThemePalette(palette: Record<string, string>) {
  const root = document.documentElement

  // Colors that need RGB channels (for Tailwind opacity support like bg-primary/10)
  const rgbMap: Record<string, string> = {
    primary: '--color-primary-rgb',
    secondary: '--color-primary-dark-rgb',
    warning: '--color-error-rgb',
    success: '--color-success-rgb',
  }
  for (const [key, cssVar] of Object.entries(rgbMap)) {
    if (palette[key]) {
      root.style.setProperty(cssVar, hexToRgbChannels(palette[key]))
      // Also set the composed var for global.css usage
      const baseVar = cssVar.replace('-rgb', '')
      root.style.setProperty(baseVar, `rgb(${hexToRgbChannels(palette[key])})`)
    }
  }

  // Surface / text tokens (no alpha needed)
  const directMap: Record<string, string> = {
    dark: '--bg-app',
    info: '--bg-surface',
    negative: '--bg-hover',
    accent: '--text-base',
    positive: '--text-muted',
  }
  for (const [key, cssVar] of Object.entries(directMap)) {
    if (palette[key]) {
      root.style.setProperty(cssVar, palette[key])
    }
  }

  // Derive additional tokens
  if (palette.info) {
    root.style.setProperty('--bg-subtle', palette.info)
  }
  if (palette.accent) {
    root.style.setProperty('--text-secondary', adjustAlpha(palette.accent, 0.85))
    root.style.setProperty('--text-faint', adjustAlpha(palette.accent, 0.35))
    root.style.setProperty('--border-base', adjustAlpha(palette.accent, 0.12))
    root.style.setProperty('--border-subtle', adjustAlpha(palette.accent, 0.06))
  }

  console.log('[cforj] LMS theme palette applied:', palette)
}

/** Convert "#6699FF" → "102 153 255" (space-separated RGB channels for Tailwind) */
function hexToRgbChannels(hex: string): string {
  const h = hex.replace('#', '')
  return `${parseInt(h.slice(0, 2), 16)} ${parseInt(h.slice(2, 4), 16)} ${parseInt(h.slice(4, 6), 16)}`
}

/** Apply alpha to a hex color → rgba string */
function adjustAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Persist user config (locale, theme, palette) keyed by LMS userId */
function saveUserConfig(userId: string | number, config: { locale?: string; theme?: string; themePalette?: Record<string, string> }) {
  try {
    const key = `cforj-user-config-${userId}`
    const existing = JSON.parse(localStorage.getItem(key) || '{}')
    const merged = { ...existing, ...config }
    localStorage.setItem(key, JSON.stringify(merged))
  } catch { /* ignore */ }
}

/** Restore saved config for a given userId and apply it */
function restoreUserConfig(userId: string | number) {
  try {
    const raw = localStorage.getItem(`cforj-user-config-${userId}`)
    if (!raw) return
    const cfg = JSON.parse(raw)
    if (cfg.locale) useLocaleStore.getState().setLocale(cfg.locale)
    if (cfg.theme) { useThemeStore.getState().setTheme(cfg.theme); applyTheme(cfg.theme) }
    if (cfg.themePalette) applyThemePalette(cfg.themePalette)
    console.log('[cforj] Restored saved config for user:', userId)
  } catch { /* ignore */ }
}

function AppRoot() {
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const msg = e.data
      if (!msg || typeof msg !== 'object' || !msg.type) return

      // ── Create new course ──────────────────────────────────────────
      if (msg.type === 'CS_CREATE_COURSE') {
        if (msg.userId != null) {
          useLmsUserStore.getState().setUserId(msg.userId)
          restoreUserConfig(msg.userId)
        }
        embedApi.create(msg.title || 'Untitled Course').then((course) => {
          useEditorStore.getState().setApp(course.content as unknown as import('@course-studio/player').CourseApp)
          window.history.replaceState(null, '', `/editor/${course.id}`)
          window.parent?.postMessage({ type: 'CS_COURSE_CREATED', courseId: course.id }, '*')
        }).catch((err) => {
          console.error('[cforj] CS_CREATE_COURSE failed:', err)
          window.parent?.postMessage({ type: 'CS_ERROR', error: err.message }, '*')
        })
      }

      // ── Load existing course by ID ─────────────────────────────────
      if (msg.type === 'CS_LOAD_COURSE' && msg.courseId) {
        if (msg.userId != null) {
          useLmsUserStore.getState().setUserId(msg.userId)
          restoreUserConfig(msg.userId)
        }
        embedApi.get(msg.courseId).then((course) => {
          useEditorStore.getState().setApp(course.content as unknown as import('@course-studio/player').CourseApp)
          window.history.replaceState(null, '', `/editor/${msg.courseId}`)
          window.parent?.postMessage({ type: 'CS_COURSE_LOADED', courseId: msg.courseId }, '*')
        }).catch((err) => {
          console.error('[cforj] CS_LOAD_COURSE failed:', err)
          window.parent?.postMessage({ type: 'CS_ERROR', error: err.message }, '*')
        })
      }

      // ── Manual save (LMS triggers explicit save) ───────────────────
      if (msg.type === 'CS_SAVE_COURSE') {
        saveNow()
      }

      // ── Get current course data ────────────────────────────────────
      if (msg.type === 'CS_GET_COURSE') {
        const snap = getCourseSnapshot()
        window.parent?.postMessage({ type: 'CS_COURSE_DATA', courseId: snap.courseId, content: snap.content }, '*')
      }

      // ── Config (locale, theme, themePalette, userId) ───────────────
      if (msg.type === 'CS_SET_CONFIG') {
        // Support both flat format { locale, theme, themePalette, userId }
        // and nested format { config: { locale, theme, userId } }
        const cfg = msg.config || msg

        if (cfg.locale) {
          useLocaleStore.getState().setLocale(cfg.locale)
        }
        if (cfg.theme) {
          useThemeStore.getState().setTheme(cfg.theme)
          applyTheme(cfg.theme)
        }
        if (cfg.themePalette) {
          applyThemePalette(cfg.themePalette)
        }
        if (cfg.userId != null) {
          console.log('[cforj] LMS userId set:', cfg.userId)
          useLmsUserStore.getState().setUserId(cfg.userId)
          // Persist config per user so it restores on next visit
          const toSave: Record<string, unknown> = {}
          if (cfg.locale) toSave.locale = cfg.locale
          if (cfg.theme) toSave.theme = cfg.theme
          if (cfg.themePalette) toSave.themePalette = cfg.themePalette
          if (Object.keys(toSave).length) saveUserConfig(cfg.userId, toSave as Parameters<typeof saveUserConfig>[1])
        }
      }
    }

    window.addEventListener('message', onMessage)
    window.parent?.postMessage({ type: 'CS_READY' }, '*')

    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/editor" element={<App />} />
        <Route path="/editor/:id" element={<App />} />
        <Route path="/player" element={<EmbedPlayer />} />
        <Route path="/player/:id" element={<EmbedPlayer />} />
        <Route path="/embed/:id" element={<EmbedPlayer />} />
        <Route path="/share/:id" element={<EmbedPlayer />} />
      </Routes>
    </BrowserRouter>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>
)
