import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useT } from '../i18n'
import { analyticsApi, type CourseAnalyticsData } from '../api/client'

const PRO_PLANS = new Set(['pro', 'enterprise', 'admin'])

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return '—'
  const diff = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  if (diff < 0) return '—'
  const totalSeconds = Math.floor(diff / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  courseId: string
  courseTitle: string
  onBack: () => void
}

export function AnalyticsDashboard({ courseId, courseTitle, onBack }: Props) {
  const { user } = useAuthStore()
  const t = useT()
  const [data, setData] = useState<CourseAnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [csvLoading, setCsvLoading] = useState(false)

  const isPro = user ? PRO_PLANS.has(user.plan) : false

  useEffect(() => {
    if (!isPro) return
    setLoading(true)
    setError('')
    analyticsApi.getCourse(courseId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [courseId, isPro])

  async function handleExportCsv() {
    setCsvLoading(true)
    try {
      const token = localStorage.getItem('cs_token')
      const url = analyticsApi.exportCsvUrl(courseId)
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `analytics_${courseId}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setCsvLoading(false)
    }
  }

  if (!isPro) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('an_pro_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('an_pro_desc')}</p>
          <a
            href="https://cforj.studio/#pricing"
            target="_blank"
            rel="noreferrer"
            className="inline-block px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 h-14 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <span className="text-gray-300 dark:text-gray-700">|</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{courseTitle}</span>
        <span className="ml-auto text-sm font-medium text-gray-600 dark:text-gray-300">{t('an_title')}</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400 dark:text-gray-500">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t('an_loading')}</span>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && !data && (
          <div className="text-center py-20">
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('an_no_data')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('an_no_data_hint')}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { icon: '👁', label: t('an_views'), value: data.view_count },
                { icon: '👤', label: t('an_starts'), value: data.total_starts },
                { icon: '✓', label: t('an_completions'), value: data.total_completions },
                { icon: '%', label: t('an_rate'), value: `${data.completion_rate}%` },
                { icon: '★', label: t('an_avg_score'), value: `${data.avg_score} pts` },
              ].map((s) => (
                <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{s.value}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Screen Funnel */}
            {data.screen_funnel.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('an_funnel')}</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.screen_funnel.map((row) => {
                    const barColor = row.pct >= 70
                      ? 'bg-green-500'
                      : row.pct >= 40
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    return (
                      <div key={row.screen_id} className="px-5 py-2.5 flex items-center gap-3">
                        <span className="text-xs text-gray-600 dark:text-gray-300 w-40 shrink-0 truncate">{row.title}</span>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${Math.min(row.pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right shrink-0">{row.visits}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 w-12 text-right shrink-0">{row.pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Avg time per screen */}
            {data.avg_screen_times && data.avg_screen_times.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('an_avg_time')}</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-5 py-2 text-left font-medium">{t('an_time_screen')}</th>
                      <th className="px-5 py-2 text-right font-medium">{t('an_time_avg')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.avg_screen_times.map((row) => {
                      const totalS = Math.floor(row.avg_ms / 1000)
                      const mins = Math.floor(totalS / 60)
                      const secs = totalS % 60
                      const formatted = `${mins}m ${secs}s`
                      return (
                        <tr key={row.screen_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-5 py-2.5 text-gray-700 dark:text-gray-200 max-w-xs truncate">{row.title}</td>
                          <td className="px-5 py-2.5 text-right text-gray-600 dark:text-gray-300 font-mono text-xs">{formatted}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Quiz Results */}
            {data.quiz_breakdown.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('an_quiz')}</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-5 py-2 text-left font-medium">{t('an_question')}</th>
                      <th className="px-4 py-2 text-right font-medium">{t('an_correct')}</th>
                      <th className="px-4 py-2 text-right font-medium">{t('an_total')}</th>
                      <th className="px-5 py-2 text-right font-medium">{t('an_score_pct')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.quiz_breakdown.map((q) => {
                      const rowBg = q.pct_correct >= 70
                        ? 'bg-green-50/50 dark:bg-green-900/10'
                        : q.pct_correct >= 40
                          ? 'bg-amber-50/50 dark:bg-amber-900/10'
                          : 'bg-red-50/50 dark:bg-red-900/10'
                      const pctColor = q.pct_correct >= 70
                        ? 'text-green-700 dark:text-green-400'
                        : q.pct_correct >= 40
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      return (
                        <tr key={q.question_id} className={rowBg}>
                          <td className="px-5 py-2.5 text-gray-700 dark:text-gray-200 max-w-xs truncate">{q.question_text}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">{q.correct_count}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">{q.total_answers}</td>
                          <td className={`px-5 py-2.5 text-right font-semibold ${pctColor}`}>{q.pct_correct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Learners table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('an_learners')}</h2>
                <button
                  onClick={handleExportCsv}
                  disabled={csvLoading}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  {t('an_export_csv')}
                </button>
              </div>
              {data.learners.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  {t('an_no_data')}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-5 py-2 text-left font-medium">{t('an_name')}</th>
                      <th className="px-4 py-2 text-right font-medium">Score</th>
                      <th className="px-4 py-2 text-center font-medium">{t('an_completed')}</th>
                      <th className="px-4 py-2 text-right font-medium">{t('an_started')}</th>
                      <th className="px-5 py-2 text-right font-medium">{t('an_duration')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.learners.map((l, i) => (
                      <tr key={l.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-2.5 text-gray-700 dark:text-gray-200">
                          {l.name || <span className="text-gray-400 dark:text-gray-500 italic">{t('an_anonymous')}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {l.max_score > 0 ? `${l.score}/${l.max_score}` : `${l.score}`}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {l.completed ? (
                            <span className="inline-block w-4 h-4 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center leading-none">✓</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400 text-xs">
                          {formatDate(l.started_at)}
                        </td>
                        <td className="px-5 py-2.5 text-right text-gray-500 dark:text-gray-400 text-xs">
                          {formatDuration(l.started_at, l.completed_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
