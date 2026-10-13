import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CoursePlayer } from '@course-studio/player'
import type { CourseApp, PlayerLocale } from '@course-studio/player'
import { embedApi } from '../api/client'
import { useLocaleStore } from '../store/localeStore'

function getParentOrigin(): string {
  try {
    if (document.referrer) return new URL(document.referrer).origin
  } catch { /* ignore */ }
  return '*'
}

export function EmbedPlayer() {
  const { id } = useParams<{ id: string }>()
  const [app, setApp] = useState<CourseApp | null>(null)
  const [error, setError] = useState<string | null>(null)
  const locale = useLocaleStore((s) => s.locale) as PlayerLocale

  useEffect(() => {
    if (!id) {
      // No ID in URL — wait for postMessage
      function onMessage(e: MessageEvent) {
        if (e.data?.type === 'CS_LOAD_PLAYER' && e.data.courseId) {
          if (e.data.locale) useLocaleStore.getState().setLocale(e.data.locale)
          embedApi.get(e.data.courseId)
            .then((c) => setApp(c.content as unknown as CourseApp))
            .catch((err) => setError(err.message))
        }
        if (e.data?.type === 'CS_SET_CONFIG') {
          const cfg = e.data.config || e.data
          if (cfg.locale) useLocaleStore.getState().setLocale(cfg.locale)
        }
      }
      window.addEventListener('message', onMessage)
      window.parent?.postMessage({ type: 'CS_PLAYER_READY', courseId: null }, getParentOrigin())
      return () => window.removeEventListener('message', onMessage)
    }

    // ID in URL — load directly
    embedApi.get(id)
      .then((c) => setApp(c.content as unknown as CourseApp))
      .catch((e) => setError(e.message))
  }, [id])

  if (error) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">{error}</div>
  )

  if (!app) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const parentOrigin = getParentOrigin()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto p-4 md:p-6">
        <CoursePlayer
          app={app}
          locale={locale}
          onProgress={(p) => {
            window.parent?.postMessage({ type: 'CS_PROGRESS', appId: app.id, progress: p }, parentOrigin)
          }}
          onComplete={(p) => {
            window.parent?.postMessage({ type: 'CS_COMPLETE', appId: app.id, score: p.score }, parentOrigin)
          }}
        />
      </div>
    </div>
  )
}
