export interface ActivityEntry {
  action: string
  detail?: string
  timestamp: string
}

const KEY = 'cs_activity_log'
const MAX_ENTRIES = 100

export function logActivity(action: string, detail?: string): void {
  const entry: ActivityEntry = { action, detail, timestamp: new Date().toISOString() }
  try {
    const existing = getActivityLog()
    localStorage.setItem(KEY, JSON.stringify([entry, ...existing].slice(0, MAX_ENTRIES)))
  } catch { /* storage full */ }
}

export function getActivityLog(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : []
  } catch {
    return []
  }
}

export function formatLogTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  if (diffH < 48) return 'yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
