import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useLocaleStore } from '../store/localeStore'
import { useT } from '../i18n'
import { analyticsApi, aiApi, type CourseAnalyticsData } from '../api/client'
import { toast } from '../store/toastStore'

const SPIRAL_PATH = 'M32 36 Q32 10 8 10 Q-16 10 -16 36 Q-16 62 32 62 Q80 62 80 36 Q80 10 32 10'

export function AnalyticsDashboard() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { locale } = useLocaleStore()
  const t = useT()
  const [data, setData] = useState<CourseAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const LOCALE_MAP: Record<string, string> = { en: 'en', ru: 'ru', es: 'es', pt: 'pt', zh: 'zh-CN' }
  const dateFmt = (d: string) => new Date(d).toLocaleDateString(LOCALE_MAP[locale] ?? 'en', { month: 'short', day: 'numeric', year: 'numeric' })

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!courseId) return
    analyticsApi.getCourse(courseId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [courseId, user])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 h-14 flex items-center gap-4">
        <Link to="/dashboard" className="hover:opacity-80 transition-opacity shrink-0">
          <svg width="100" height="32" viewBox="0 0 220 72" fill="none" className="text-gray-900 dark:text-white">
            <defs>
              <linearGradient id="adg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399"/>
                <stop offset="100%" stopColor="#818cf8"/>
              </linearGradient>
            </defs>
            <path d={SPIRAL_PATH} fill="none" stroke="url(#adg)" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="32" cy="36" r="4" fill="url(#adg)"/>
            <text x="68" y="40" fontFamily="'SF Pro Display',-apple-system,sans-serif" fontWeight="700" fontSize="30" fill="currentColor" letterSpacing="-0.5">cforj</text>
            <text x="68" y="56" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#999" letterSpacing="1.5">COURSE FORGE STUDIO</text>
          </svg>
        </Link>
        <Link to="/dashboard" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
          ← {t('an_back')}
        </Link>
        <span className="text-sm text-gray-300 dark:text-gray-600">/</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('an_title')}</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 h-24 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label={t('an_total_starts')} value={data.total_starts} icon="👥" goodLabel={t('an_good')} />
              <StatCard label={t('an_completions')} value={data.total_completions} icon="✅" goodLabel={t('an_good')} />
              <StatCard label={t('an_completion_rate')} value={`${data.completion_rate}%`} icon="📈" highlight={data.completion_rate >= 70} goodLabel={t('an_good')} />
              <StatCard label={t('an_avg_score')} value={`${data.avg_score}%`} icon="🎯" highlight={data.avg_score >= 70} goodLabel={t('an_good')} />
            </div>

            {/* Screen funnel + avg time */}
            {(data.screen_funnel.length > 0 || data.avg_screen_times.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {data.screen_funnel.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('an_screen_funnel')}</h2>
                    <div className="space-y-2">
                      {data.screen_funnel.map((s) => (
                        <div key={s.screen_id}>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            <span className="truncate flex-1 mr-2">{s.title}</span>
                            <span className="shrink-0 font-medium text-gray-700 dark:text-gray-300">{s.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${s.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.avg_screen_times.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('an_avg_time')}</h2>
                    <div className="space-y-2">
                      {data.avg_screen_times.map((s) => {
                        const secs = Math.round(s.avg_ms / 1000)
                        const mins = Math.floor(secs / 60)
                        const label = mins > 0 ? `${mins}m ${secs % 60}s` : `${secs}s`
                        const maxMs = Math.max(...data.avg_screen_times.map((x) => x.avg_ms), 1)
                        return (
                          <div key={s.screen_id}>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                              <span className="truncate flex-1 mr-2">{s.title}</span>
                              <span className="shrink-0 font-medium text-gray-700 dark:text-gray-300">{label}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(s.avg_ms / maxMs) * 100}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quiz breakdown */}
            {data.quiz_breakdown.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('an_quiz_breakdown')}</h2>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {data.quiz_breakdown.map((q) => (
                    <div key={q.question_id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-4 mb-1.5">
                        <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{q.question_text}</p>
                        <span className={`text-xs font-semibold shrink-0 ${q.pct_correct >= 70 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {q.pct_correct}% {t('an_correct')}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden w-full">
                        <div
                          className={`h-full rounded-full ${q.pct_correct >= 70 ? 'bg-green-400' : 'bg-amber-400'}`}
                          style={{ width: `${q.pct_correct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{q.correct_count}/{q.total_answers} {t('an_answered_correctly')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Report */}
            <AIReportSection data={data} />

            {/* Export button */}
            <div className="flex justify-end mb-4">
              <a
                href={analyticsApi.exportCsvUrl(courseId!)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-primary border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                download
              >
                {t('an_export_csv')} ↓
              </a>
            </div>

            {/* Learners table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('an_learners')}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{data.learners.length} {t('an_total')}</p>
              </div>

              {data.learners.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-gray-400 dark:text-gray-500">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-sm">{t('an_no_learners')}</div>
                  <div className="text-xs mt-1">{t('an_no_learners_sub')}</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left px-5 py-2 font-medium">{t('an_learner')}</th>
                        <th className="text-left px-5 py-2 font-medium">{t('an_score')}</th>
                        <th className="text-left px-5 py-2 font-medium">{t('an_status')}</th>
                        <th className="text-left px-5 py-2 font-medium">{t('an_started')}</th>
                        <th className="text-left px-5 py-2 font-medium">{t('an_completed')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {data.learners.map((learner, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-5 py-3">
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              {learner.name ?? t('an_anonymous')}
                            </div>
                            {learner.id && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{learner.id.slice(0, 8)}</div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${learner.max_score > 0 ? (learner.score / learner.max_score) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {learner.score}/{learner.max_score}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              learner.completed
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}>
                              {learner.completed ? t('an_completed') : t('an_in_progress')}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">
                            {dateFmt(learner.started_at)}
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">
                            {learner.completed_at ? dateFmt(learner.completed_at) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function AIReportSection({ data }: { data: CourseAnalyticsData }) {
  const t = useT()
  const [prompt, setPrompt] = useState('')
  const [report, setReport] = useState('')
  const [generating, setGenerating] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  async function generateReport() {
    if (!prompt.trim()) return
    setGenerating(true)
    setReport('')

    const summary = [
      `Total starts: ${data.total_starts}`,
      `Completions: ${data.total_completions}`,
      `Completion rate: ${data.completion_rate}%`,
      `Avg score: ${data.avg_score}%`,
      data.screen_funnel.length > 0
        ? `Screen funnel: ${data.screen_funnel.map((s) => `${s.title}: ${s.pct}%`).join(', ')}`
        : '',
      data.quiz_breakdown.length > 0
        ? `Quiz breakdown: ${data.quiz_breakdown.map((q) => `"${q.question_text}": ${q.pct_correct}% correct`).join(', ')}`
        : '',
      data.avg_screen_times.length > 0
        ? `Avg time per screen: ${data.avg_screen_times.map((s) => `${s.title}: ${Math.round(s.avg_ms / 1000)}s`).join(', ')}`
        : '',
      `Learners: ${data.learners.length} total, ${data.learners.filter((l) => l.completed).length} completed`,
    ].filter(Boolean).join('\n')

    const systemPrompt = `You are an analytics expert for an e-learning platform. Analyze the following course analytics data and answer the user's question. Be specific, give actionable recommendations. Write in the same language as the user's question. Use markdown formatting.\n\nAnalytics data:\n${summary}`

    try {
      const res = await aiApi.report(prompt, summary)
      setReport(res.report)
      toast(t('an_ai_report'))
    } catch {
      setReport(t('an_ai_error'))
      toast(t('an_ai_error'), 'error')
    } finally {
      setGenerating(false)
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span className="text-lg">✨</span> {t('an_ai_report')}
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {t('an_ai_report_sub')}
        </p>
      </div>

      <div className="p-5 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
            {t('an_ai_prompt_label')}
          </label>
          <textarea
            rows={2}
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500"
            placeholder={t('an_ai_placeholder')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generateReport()
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={generateReport}
            disabled={generating || !prompt.trim()}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? t('an_ai_generating') : t('an_ai_generate')}
          </button>
          {generating && (
            <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">{t('an_ai_analyzing')}</span>
          )}
        </div>

        {report && (
          <div
            ref={reportRef}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 prose prose-sm max-w-none text-gray-700 dark:text-gray-300"
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{report}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
  goodLabel,
}: {
  label: string
  value: string | number
  icon: string
  highlight?: boolean
  goodLabel: string
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        {highlight && (
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">
            {goodLabel}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold mt-2 ${highlight ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
