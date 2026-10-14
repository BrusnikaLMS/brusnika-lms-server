import type { CourseApp } from '@course-studio/player'

// Palette of distinct colors for course thumbnails
const PALETTE: [string, string][] = [
  ['#5B5FED', '#818CF8'], // indigo
  ['#0EA5E9', '#38BDF8'], // sky
  ['#10B981', '#34D399'], // emerald
  ['#F59E0B', '#FCD34D'], // amber
  ['#EF4444', '#F87171'], // red
  ['#8B5CF6', '#A78BFA'], // violet
  ['#EC4899', '#F472B6'], // pink
  ['#14B8A6', '#2DD4BF'], // teal
]

function colorFromId(id: string): [string, string] {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]!
}

export function generateThumbnailSvg(app: CourseApp): string {
  const [from, to] = colorFromId(app.id)
  const componentCount = app.screens.reduce((n: number, s) => n + s.components.length, 0)
  const title = app.title.length > 28 ? app.title.slice(0, 26) + '…' : app.title
  const subtitle = `${app.screens.length} screen${app.screens.length !== 1 ? 's' : ''} · ${componentCount} component${componentCount !== 1 ? 's' : ''}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${from}"/>
      <stop offset="100%" style="stop-color:${to}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="url(#g)"/>
  <rect x="24" y="24" width="352" height="177" rx="8" fill="rgba(255,255,255,0.1)"/>
  <text x="40" y="110" font-family="-apple-system,sans-serif" font-size="22" font-weight="700" fill="white">${escSvg(title)}</text>
  <text x="40" y="140" font-family="-apple-system,sans-serif" font-size="13" fill="rgba(255,255,255,0.75)">${escSvg(subtitle)}</text>
  <text x="40" y="175" font-family="-apple-system,sans-serif" font-size="11" fill="rgba(255,255,255,0.5)">Course Studio</text>
</svg>`
}

export function generateThumbnailDataUrl(app: CourseApp): string {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(generateThumbnailSvg(app))))
}

function escSvg(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
