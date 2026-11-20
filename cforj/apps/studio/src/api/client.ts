const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
const _rawAuthUrl = import.meta.env.VITE_AUTH_URL || '/login'
// Only allow same-origin or cforj.studio subdomains for auth redirect
const AUTH_URL = (() => {
  try {
    const u = new URL(_rawAuthUrl, window.location.origin)
    if (u.origin === window.location.origin || u.hostname.endsWith('.cforj.studio')) return _rawAuthUrl
  } catch { /* relative path is safe */ }
  return _rawAuthUrl.startsWith('/') ? _rawAuthUrl : '/login'
})()

function getToken(): string | null {
  const lsToken = localStorage.getItem('cs_token')
  if (lsToken) return lsToken
  const match = document.cookie.match(/(?:^|; )cs_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

function clearAllTokens() {
  localStorage.removeItem('cs_token')
  localStorage.removeItem('cs_refresh')
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const domainAttr = isLocalhost ? '' : '; domain=.cforj.studio'
  document.cookie = `cs_token=; path=/; max-age=0${domainAttr}`
  document.cookie = `cs_refresh=; path=/; max-age=0${domainAttr}`
}

// Track if a token refresh is in flight to prevent concurrent refreshes
let _refreshing: Promise<string | null> | null = null

async function _tryRefresh(): Promise<string | null> {
  if (_refreshing) return _refreshing
  _refreshing = (async () => {
    try {
      const rt = localStorage.getItem('cs_refresh') || (() => {
        const m = document.cookie.match(/(?:^|; )cs_refresh=([^;]*)/)
        return m ? decodeURIComponent(m[1]) : null
      })()
      if (!rt) return null
      // Direct fetch to avoid recursion through request()
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      })
      if (!res.ok) return null
      const data = await res.json()
      // Save tokens via shared helper (single source of truth)
      const { saveTokens, useAuthStore } = await import('../store/authStore')
      saveTokens(data.access_token, data.refresh_token)
      useAuthStore.setState({ token: data.access_token })
      return data.access_token as string
    } catch {
      return null
    } finally {
      _refreshing = null
    }
  })()
  return _refreshing
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  // 401 on auth endpoints is a business error (wrong password/code) — show it,
  // don't redirect. Only redirect for 401 on protected endpoints (session expired).
  if (res.status === 401 && !path.startsWith('/auth/')) {
    // Try to refresh the access token before giving up
    const newToken = await _tryRefresh()
    if (newToken) {
      // Retry the original request with the new token
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` }
      const retry = await fetch(`${API_BASE}${path}`, { ...options, headers: retryHeaders })
      if (retry.ok) {
        if (retry.status === 204) return undefined as T
        return retry.json()
      }
      if (retry.status !== 401) {
        const err = await retry.json().catch(() => ({ detail: retry.statusText }))
        throw new Error(err.detail ?? `Request failed: ${retry.status}`)
      }
    }
    // Refresh failed or retry still 401 — clear everything and redirect
    clearAllTokens()
    window.location.href = AUTH_URL
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `Request failed: ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface VerificationRequired {
  requires_verification: true
  email: string
}

export const authApi = {
  register: (email: string, password: string, name: string) =>
    request<VerificationRequired>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<VerificationRequired>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  sendCode: (email: string) =>
    request<{ detail: string }>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyCode: (email: string, code: string) =>
    request<{ access_token: string; refresh_token: string }>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  googleLogin: (credential: string) =>
    request<{ access_token: string; refresh_token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),

  refresh: (refresh_token: string) =>
    request<{ access_token: string; refresh_token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    }),

  logoutToken: (refresh_token: string) =>
    request<{ detail: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    }),

  me: () => request<{ id: string; email: string; name: string; plan: string; avatar_url?: string }>('/auth/me', { cache: 'no-store' }),

  forgotPassword: (email: string) =>
    request<{ detail: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    request<{ detail: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    }),
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export interface CourseListItem {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  published: boolean
  updated_at: string
}

export interface CourseOut {
  id: string
  owner_id: string
  title: string
  content: Record<string, unknown>
  published: boolean
  updated_at: string
}

export const coursesApi = {
  list: () => request<CourseListItem[]>('/courses'),

  create: (id: string, title: string, content: unknown, thumbnail?: string) =>
    request<CourseOut>('/courses', {
      method: 'POST',
      body: JSON.stringify({ id, title, content, thumbnail }),
    }),

  get: (id: string) => request<CourseOut>(`/courses/${id}`),

  update: (id: string, data: { title?: string; content?: unknown; published?: boolean; thumbnail?: string }) =>
    request<CourseOut>(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => request<void>(`/courses/${id}`, { method: 'DELETE' }),

  togglePublish: async (id: string, published: boolean) =>
    request<CourseOut>(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ published }),
    }),
}

// ─── Uploads ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string
  key: string
  size_bytes: number
}

export interface AssetItem {
  key: string
  url: string
  original_name: string | null
  mime_type: string | null
  size_bytes: number
  created_at: string
}

export interface AssetsListResult {
  assets: AssetItem[]
  total_size_bytes: number
  count: number
}

export const uploadsApi = {
  upload: async (file: File): Promise<UploadResult> => {
    const form = new FormData()
    form.append('file', file)
    const token = getToken()
    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail ?? 'Upload failed')
    }
    return res.json() as Promise<UploadResult>
  },

  listAssets: (): Promise<AssetsListResult> =>
    request<AssetsListResult>('/uploads/assets'),

  deleteAsset: (key: string): Promise<void> =>
    request<void>(`/uploads/assets/${key}`, { method: 'DELETE' }),
}

// ─── Versions ─────────────────────────────────────────────────────────────────

export interface VersionOut {
  id: string
  course_id: string
  version_number: number
  label: string | null
  screen_count: number
  size_bytes: number
  is_auto: boolean
  created_at: string
}

export interface VersionWithContent extends VersionOut {
  content: Record<string, unknown>
}

export const versionsApi = {
  list: (courseId: string) =>
    request<VersionOut[]>(`/courses/${courseId}/versions`),

  save: (courseId: string, label?: string) =>
    request<VersionOut>(`/courses/${courseId}/versions`, {
      method: 'POST',
      body: JSON.stringify({ label: label ?? null }),
    }),

  get: (courseId: string, versionId: string) =>
    request<VersionWithContent>(`/courses/${courseId}/versions/${versionId}`),

  restore: (courseId: string, versionId: string) =>
    request<VersionOut>(`/courses/${courseId}/versions/${versionId}/restore`, {
      method: 'POST',
    }),

  delete: (courseId: string, versionId: string) =>
    request<void>(`/courses/${courseId}/versions/${versionId}`, {
      method: 'DELETE',
    }),
}

// ─── Collaborators ────────────────────────────────────────────────────────────

export interface CollaboratorOut {
  id: number
  course_id: string
  user_id: string | null
  invited_email: string
  role: string
  accepted_at: string | null
  created_at: string
  user_name: string | null
}

export const collaboratorsApi = {
  list: (courseId: string) =>
    request<CollaboratorOut[]>(`/courses/${courseId}/collaborators`),
  invite: (courseId: string, email: string, role: string) =>
    request<CollaboratorOut>(`/courses/${courseId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  updateRole: (courseId: string, collabId: number, role: string) =>
    request<CollaboratorOut>(`/courses/${courseId}/collaborators/${collabId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  remove: (courseId: string, collabId: number) =>
    request<void>(`/courses/${courseId}/collaborators/${collabId}`, { method: 'DELETE' }),
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AvgScreenTime {
  screen_id: string
  title: string
  avg_ms: number
}

export interface CourseAnalyticsData {
  course_id: string
  view_count: number
  total_starts: number
  total_completions: number
  completion_rate: number
  avg_score: number
  quiz_breakdown: Array<{ question_id: string; question_text: string; correct_count: number; total_answers: number; pct_correct: number }>
  screen_funnel: Array<{ screen_id: string; title: string; visits: number; pct: number }>
  avg_screen_times: AvgScreenTime[]
  learners: Array<{ id: string | null; name: string | null; score: number; max_score: number; completed: boolean; started_at: string; completed_at: string | null }>
}

export const analyticsApi = {
  getCourse: (courseId: string) =>
    request<CourseAnalyticsData>(`/analytics/courses/${courseId}`),

  exportCsvUrl: (courseId: string) => `${API_BASE}/analytics/courses/${courseId}/export.csv`,

  recordCompletion: (data: {
    course_id: string
    learner_id?: string
    learner_name?: string
    score: number
    max_score: number
    completed: boolean
    progress: unknown
  }) =>
    request('/analytics/completions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface CommentOut {
  id: number
  course_id: string
  screen_id: string
  author_id: string
  author_name: string
  content: string
  resolved: boolean
  created_at: string
}

export const commentsApi = {
  list: (courseId: string, screenId: string) =>
    request<CommentOut[]>(`/courses/${courseId}/screens/${screenId}/comments`),

  create: (courseId: string, screenId: string, content: string) =>
    request<CommentOut>(`/courses/${courseId}/screens/${screenId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  resolve: (commentId: number, resolved: boolean) =>
    request<CommentOut>(`/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ resolved }),
    }),

  delete: (commentId: number) =>
    request<void>(`/comments/${commentId}`, { method: 'DELETE' }),
}

// ─── SSO ──────────────────────────────────────────────────────────────────────

export interface SSOConfig {
  provider: string
  entity_id: string
  sso_url: string
  certificate: string
  enabled: boolean
}

export const ssoApi = {
  getConfig: () => request<SSOConfig>('/sso/config'),
  saveConfig: (config: SSOConfig) =>
    request<SSOConfig>('/sso/config', { method: 'POST', body: JSON.stringify(config) }),
}

// ─── White-label ──────────────────────────────────────────────────────────────

export interface WhiteLabelConfig {
  app_name: string
  logo_url: string | null
  primary_color: string
  remove_branding: boolean
  custom_domain: string | null
}

export const whiteLabelApi = {
  get: () => request<WhiteLabelConfig>('/white-label'),
  save: (data: Partial<WhiteLabelConfig>) =>
    request<WhiteLabelConfig>('/white-label', { method: 'PUT', body: JSON.stringify(data) }),
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: number
  action: string
  resource_type: string
  resource_name: string | null
  created_at: string
}

export const auditApi = {
  list: () => request<AuditLogEntry[]>('/audit-log'),
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export const aiApi = {
  report: (prompt: string, analytics_summary: string) =>
    request<{ report: string }>('/ai/report', {
      method: 'POST',
      body: JSON.stringify({ prompt, analytics_summary }),
    }),
}

// ─── Blog ──────────────────────────────────────────────────────────

export interface BlogPostItem {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_image: string | null
  author_name: string
  tags: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export const blogApi = {
  list: () => request<BlogPostItem[]>('/blog/admin/posts'),

  create: (data: { title: string; content: string; excerpt?: string; cover_image?: string; tags?: string; published?: boolean }) =>
    request<BlogPostItem>('/blog/admin/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { title?: string; content?: string; excerpt?: string; cover_image?: string; tags?: string; published?: boolean }) =>
    request<BlogPostItem>(`/blog/admin/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/blog/admin/posts/${id}`, { method: 'DELETE' }),
}

// ─── Embed API (no auth, for LMS integration) ──────────────────────────────

export interface EmbedCourseOut {
  id: string
  title: string
  content: Record<string, unknown>
  created_at: string
  updated_at: string
}

function embedRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return fetch(`${API_BASE}/embed/courses${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  }).then(async (r) => {
    if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`)
    if (r.status === 204) return undefined as T
    return r.json() as T
  })
}

function _getLmsUserId(): string | number | null {
  try {
    // Dynamic import to avoid circular deps — store is simple enough
    const { useLmsUserStore } = require('../store/lmsUserStore')
    return useLmsUserStore.getState().userId
  } catch { return null }
}

export const embedApi = {
  create: (title?: string, content?: unknown) =>
    embedRequest<EmbedCourseOut>('', {
      method: 'POST',
      body: JSON.stringify({ title: title || 'Untitled Course', content, lms_user_id: _getLmsUserId() }),
    }),

  list: () => embedRequest<Array<{ id: string; title: string; updated_at: string }>>(''),

  get: (id: string) => embedRequest<EmbedCourseOut>(`/${id}`),

  update: (id: string, data: { title?: string; content?: unknown }) =>
    embedRequest<EmbedCourseOut>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, lms_user_id: _getLmsUserId() }),
    }),

  delete: (id: string) => embedRequest<void>(`/${id}`, { method: 'DELETE' }),
}
