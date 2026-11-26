import { useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useLocaleStore } from '../store/localeStore'
import { useT } from '../i18n'
import { toast } from '../store/toastStore'
import { postTokenSpent, readSpentFromHeaders } from '../utils/lmsBridge'
import type { CourseApp } from '@course-studio/player'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export function AIPanel() {
  const { app, setApp } = useEditorStore()
  const { locale } = useLocaleStore()
  const t = useT()

  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    setStatus(t('ai_course_gen_status'))

    try {
      const res = await fetch(`${API_BASE}/embed/courses/ai/generate-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language: locale, screen_count: 5 }),
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const spent = readSpentFromHeaders(res.headers)
      if (spent) postTokenSpent(spent.amount, spent.operation)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let raw = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream: true })
        setStatus(`${t('ai_generating')} ${raw.length}`)
      }

      const courseData = JSON.parse(raw) as CourseApp
      setApp({ ...courseData, id: app.id })
      setStatus(t('ai_course_gen_done'))
      setPrompt('')
      toast(t('toast_ai_course_generated'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      toast(t('toast_ai_error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">{t('ai_course_label')}</label>
        <textarea
          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2.5 py-2 text-sm focus:border-primary outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500"
          rows={4}
          placeholder={t('ai_course_placeholder')}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="w-full py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <><span className="animate-spin text-base">⟳</span> {t('ai_generating')}</>
        ) : (
          <><span>✨</span> {t('ai_gen_course')}</>
        )}
      </button>

      {status && !error && (
        <div className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded px-2 py-1.5">
          {status}
        </div>
      )}
      {error && (
        <div className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-2 py-1.5">
          {error}
        </div>
      )}

      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
        <div className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1.5">{t('ai_tips')}</div>
        <ul className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
          <li>• {t('ai_tip_course_1')}</li>
          <li>• {t('ai_tip_course_2')}</li>
          <li>• {t('ai_tip_course_3')}</li>
        </ul>
      </div>
    </div>
  )
}
