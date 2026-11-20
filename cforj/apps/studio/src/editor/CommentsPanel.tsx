import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { commentsApi, type CommentOut } from '../api/client'
import { useT } from '../i18n'

const PRO_PLANS = new Set(['pro', 'enterprise', 'admin'])

interface Props {
  courseId: string
  screenId: string
  onClose: () => void
}

export function CommentsPanel({ courseId, screenId, onClose }: Props) {
  const { user } = useAuthStore()
  const t = useT()
  const isPro = user && PRO_PLANS.has(user.plan)
  const [comments, setComments] = useState<CommentOut[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isPro || !courseId || !screenId) return
    setLoading(true)
    commentsApi.list(courseId, screenId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [courseId, screenId, isPro])

  async function submit() {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const c = await commentsApi.create(courseId, screenId, text.trim())
      setComments((p) => [...p, c])
      setText('')
    } catch { /* ignore */ }
    finally { setSubmitting(false) }
  }

  async function toggleResolve(c: CommentOut) {
    const updated = await commentsApi.resolve(c.id, !c.resolved).catch(() => null)
    if (updated) setComments((p) => p.map((x) => x.id === c.id ? updated : x))
  }

  async function del(c: CommentOut) {
    await commentsApi.delete(c.id).catch(() => {})
    setComments((p) => p.filter((x) => x.id !== c.id))
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('comment_title')}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      {!isPro ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-2xl mb-2">💬</div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">{t('comment_pro_title')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('comment_pro_desc')}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">{t('comment_no_comments')}</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className={`rounded-xl p-3 group ${c.resolved ? 'bg-gray-50 dark:bg-gray-800/30 opacity-60' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.author_name || 'Anonymous'}</span>
                    <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className={`text-xs text-gray-700 dark:text-gray-200 mb-2 ${c.resolved ? 'line-through text-gray-400' : ''}`}>{c.content}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleResolve(c)}
                      className="text-xs text-gray-400 hover:text-primary transition-colors"
                    >
                      {c.resolved ? '↩ ' + t('comment_unresolve') : '✓ ' + t('comment_resolve')}
                    </button>
                    {(user?.id === c.author_id) && (
                      <button onClick={() => del(c)} className="text-xs text-gray-300 hover:text-red-400 transition-colors ml-auto">
                        {t('comment_delete')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit() }}
              placeholder={t('comment_add_placeholder')}
              rows={2}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-xs resize-none focus:border-primary outline-none"
            />
            <button
              onClick={submit}
              disabled={!text.trim() || submitting}
              className="mt-2 w-full py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '…' : t('comment_btn')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
