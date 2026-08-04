import { useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useLocaleStore } from '../store/localeStore'
import { useT } from '../i18n'
import { toast } from '../store/toastStore'
import { postTokenSpent, readSpentFromHeaders } from '../utils/lmsBridge'
import type { Component } from '@course-studio/player'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

interface Props {
  componentId: string
  componentType: Component['type']
  screenId: string
  onClose: () => void
}

type SourceType = 'text' | 'course' | 'url'

const TYPE_LABEL_KEYS: Record<Component['type'], string> = {
  text: 'aic_type_text',
  image: 'aic_type_image',
  video: 'aic_type_video',
  button: 'aic_type_button',
  'quiz-single': 'aic_type_quiz_single',
  'quiz-multi': 'aic_type_quiz_multi',
  'true-false': 'aic_type_true_false',
  flashcards: 'aic_type_flashcards',
  branching: 'aic_type_branching',
  'drag-drop': 'aic_type_drag_drop',
  hotspots: 'aic_type_hotspots',
  'dialog-trainer': 'aic_type_dialog_trainer',
  'screen-simulation': 'aic_type_screen_sim',
}

function isSupportedForAI(type: Component['type']): boolean {
  return ['quiz-single', 'quiz-multi', 'true-false', 'flashcards', 'branching', 'text'].includes(type)
}

export function AIComponentModal({ componentId, componentType, screenId, onClose }: Props) {
  const { app, updateComponent, addComponent } = useEditorStore()
  const { locale } = useLocaleStore()
  const t = useT()

  const [prompt, setPrompt] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>('text')
  const [sourceUrl, setSourceUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const currentScreen = app.screens.find((s) => s.id === screenId)

  // Collect text from other components on the screen as context
  function getCourseContext(): string {
    if (!currentScreen) return ''
    return currentScreen.components
      .filter((c) => c.id !== componentId && c.type === 'text')
      .map((c) => {
        if (c.type === 'text') return c.content.replace(/<[^>]+>/g, '')
        return ''
      })
      .filter(Boolean)
      .join('\n\n')
  }

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    setStatus(t('aic_status_generating'))

    const courseContext = sourceType === 'course' ? getCourseContext() : ''
    const urlContext = sourceType === 'url' && sourceUrl ? `\n\nSource URL to reference: ${sourceUrl}` : ''
    const context = courseContext
    const fullPrompt = courseContext
      ? `${prompt}\n\nContext from course:\n${courseContext}`
      : sourceType === 'url' && sourceUrl
      ? `${prompt}\n\nUse content from this URL as source: ${sourceUrl}`
      : prompt

    try {
      if (componentType === 'quiz-single' || componentType === 'quiz-multi' || componentType === 'true-false') {
        const res = await fetch(`${API_BASE}/embed/courses/ai/generate-quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: fullPrompt, count: 1, language: locale }),
        })
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json() as { components: Component[]; tokens_spent?: number; operation?: string }
        if (data.tokens_spent) postTokenSpent(data.tokens_spent, data.operation ?? 'generate-quiz')
        const generated = data.components.find((c) => c.type === componentType) ?? data.components[0]
        if (generated) {
          updateComponent(screenId, componentId, generated as Partial<Component>)
          setStatus(t('aic_status_done'))
          toast(t('toast_ai_component_generated'))
          setTimeout(onClose, 800)
        }
      } else if (componentType === 'flashcards') {
        const res = await fetch(`${API_BASE}/embed/courses/ai/generate-flashcards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: prompt, text: context, count: 6, language: locale }),
        })
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json() as { component: Component; tokens_spent?: number; operation?: string }
        if (data.tokens_spent) postTokenSpent(data.tokens_spent, data.operation ?? 'generate-flashcards')
        updateComponent(screenId, componentId, data.component as Partial<Component>)
        setStatus('Done!')
        toast(t('toast_ai_component_generated'))
        setTimeout(onClose, 800)
      } else if (componentType === 'branching') {
        const res = await fetch(`${API_BASE}/embed/courses/ai/generate-scenario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: prompt, context, choice_count: 3, language: locale }),
        })
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json() as { component: Component; tokens_spent?: number; operation?: string }
        if (data.tokens_spent) postTokenSpent(data.tokens_spent, data.operation ?? 'generate-scenario')
        updateComponent(screenId, componentId, data.component as Partial<Component>)
        setStatus('Done!')
        toast(t('toast_ai_component_generated'))
        setTimeout(onClose, 800)
      } else if (componentType === 'text') {
        // Use quiz endpoint as a workaround — just generate and extract any text
        const res = await fetch(`${API_BASE}/embed/courses/ai/generate-course`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: `Write a short educational text block about: ${fullPrompt}`, language: locale, screen_count: 1 }),
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
        }
        try {
          const courseData = JSON.parse(raw)
          const firstScreen = courseData.screens?.[0]
          const textComponent = firstScreen?.components?.find((c: Component) => c.type === 'text')
          if (textComponent) {
            updateComponent(screenId, componentId, { content: textComponent.content } as Partial<Component>)
            setStatus(t('aic_status_done'))
            toast(t('toast_ai_component_generated'))
            setTimeout(onClose, 800)
          } else {
            throw new Error('No text content generated')
          }
        } catch {
          throw new Error('Could not parse generated content')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('aic_error_generic'))
      toast(t('toast_ai_error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <span>✨</span> {t('aic_title')}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {t(TYPE_LABEL_KEYS[componentType]) || componentType}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {!isSupportedForAI(componentType) ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">🔧</div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{t('aic_coming_soon')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('aic_not_available')}
              </div>
            </div>
          ) : (
            <>
              {/* Prompt */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">{t('aic_prompt_label')}</label>
                <textarea
                  autoFocus
                  rows={3}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={
                    componentType === 'text' ? t('aic_placeholder_text') :
                    componentType === 'flashcards' ? t('aic_placeholder_flashcards') :
                    componentType === 'branching' ? t('aic_placeholder_branching') :
                    t('aic_placeholder_quiz')
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* Source type */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">{t('aic_source_label')}</label>
                <div className="flex gap-1.5">
                  {([
                    { id: 'text' as const, labelKey: 'aic_source_prompt' },
                    { id: 'course' as const, labelKey: 'aic_source_screen' },
                    { id: 'url' as const, labelKey: 'aic_source_url' },
                  ]).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSourceType(s.id)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        sourceType === s.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {t(s.labelKey)}
                    </button>
                  ))}
                </div>

                {sourceType === 'course' && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    {t('aic_source_screen_hint')}
                  </p>
                )}

                {sourceType === 'url' && (
                  <div className="mt-1.5">
                    <input
                      className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:border-primary outline-none placeholder-gray-400"
                      placeholder={t('aic_url_placeholder')}
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                    />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      {t('aic_url_hint')}
                    </p>
                  </div>
                )}
              </div>

              {/* Status / Error */}
              {status && !error && (
                <div className={`text-xs rounded-lg px-3 py-2 ${
                  status === t('aic_status_done')
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                }`}>
                  {status === t('aic_status_done') ? '✓ ' : '⟳ '}{status}
                </div>
              )}
              {error && (
                <div className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <><span className="animate-spin">⟳</span> {t('aic_generating')}</>
                ) : (
                  <><span>✨</span> {t('aic_generate_btn')}</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
