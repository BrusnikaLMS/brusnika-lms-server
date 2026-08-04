import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEditorStore } from '../store/editorStore'
import { useLocalCoursesStore, type LocalCourseMeta } from '../store/localCoursesStore'
import { useLocaleStore } from '../store/localeStore'
import { LOCALE_NAMES, useT } from '../i18n'
import { translations } from '../i18n/translations'
import { coursesApi, type CourseListItem } from '../api/client'
import { generateThumbnailDataUrl } from '../utils/thumbnail'
import { AnalyticsDashboard } from '../editor/AnalyticsDashboard'
import { ImportDocumentModal } from '../editor/ImportDocumentModal'
import { CollaboratorsModal } from '../editor/CollaboratorsModal'
import type { CourseApp } from '@course-studio/player'

const LOCALES = Object.entries(LOCALE_NAMES) as [string, string][]

function newBlankApp(): CourseApp {
  const id = `app-${Date.now()}`
  return {
    id,
    version: '1.0.0',
    title: 'Untitled Course',
    language: 'en',
    settings: { showResults: true, allowNavigation: 'linear', completionCriteria: 'allScreens' },
    state: {},
    screens: [{ id: `s-${Date.now()}`, title: `${(translations[useLocaleStore.getState().locale] ?? translations.en).screen_default_name} 1`, components: [], events: [], navigation: {} }],
  }
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { setApp } = useEditorStore()
  const { courses: localCourses, init, load, remove: removeLocal } = useLocalCoursesStore()
  const { locale, setLocale } = useLocaleStore()
  const t = useT()
  const [cloudCourses, setCloudCourses] = useState<CourseListItem[]>([])
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState<'local' | 'cloud'>(user ? 'cloud' : 'local')
  const [search, setSearch] = useState('')
  const [analyticsFor, setAnalyticsFor] = useState<{ id: string; title: string } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [collabFor, setCollabFor] = useState<string | null>(null)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (user) loadCloud()
  }, [user])

  async function loadCloud() {
    try {
      const data = await coursesApi.list()
      setCloudCourses(data)
      setTab('cloud')
    } catch { /* API offline */ }
  }

  async function createCourse() {
    setCreating(true)
    const app = newBlankApp()
    setApp(app)
    navigate('/')
    setCreating(false)
  }

  async function openLocal(meta: LocalCourseMeta) {
    const course = await load(meta.id)
    if (course) {
      setApp(course)
      navigate('/')
    }
  }

  async function openCloud(item: CourseListItem) {
    try {
      const data = await coursesApi.get(item.id)
      setApp(data.content as CourseApp)
      navigate('/')
    } catch (e) {
      alert(`Failed to load: ${e instanceof Error ? e.message : 'Error'}`)
    }
  }

  async function deleteCloud(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this course?')) return
    try {
      await coursesApi.delete(id)
      setCloudCourses((p) => p.filter((c) => c.id !== id))
    } catch { /* ignore */ }
  }

  async function deleteLocal(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete?')) return
    await removeLocal(id)
  }

  async function togglePublishCloud(id: string, published: boolean, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await coursesApi.togglePublish(id, !published)
      setCloudCourses((p) => p.map((c) => c.id === id ? { ...c, published: !published } : c))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    }
  }

  const atCommunityLimit = user?.plan === 'community' && cloudCourses.length >= 3

  const allCourses = tab === 'local' ? localCourses : cloudCourses
  const courses = search.trim()
    ? allCourses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : allCourses

  if (analyticsFor) {
    return (
      <AnalyticsDashboard
        courseId={analyticsFor.id}
        courseTitle={analyticsFor.title}
        onBack={() => setAnalyticsFor(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
        <svg width="110" height="36" viewBox="0 0 220 72" fill="none">
          <defs>
            <linearGradient id="dg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399"/>
              <stop offset="100%" stopColor="#818cf8"/>
            </linearGradient>
          </defs>
          <path d="M32 36 Q32 10 8 10 Q-16 10 -16 36 Q-16 62 32 62 Q80 62 80 36 Q80 10 32 10"
                fill="none" stroke="url(#dg)" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="32" cy="36" r="4" fill="url(#dg)"/>
          <text x="68" y="40" fontFamily="'SF Pro Display',-apple-system,sans-serif" fontWeight="700" fontSize="30" fill="#0f0f13" letterSpacing="-0.5">cforj</text>
          <text x="68" y="56" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#999" letterSpacing="1.5">COURSE FORGE STUDIO</text>
        </svg>
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as typeof locale)}
            className="text-xs text-gray-500 border border-gray-200 rounded-md px-2 py-1 bg-white hover:border-gray-300 outline-none cursor-pointer"
          >
            {LOCALES.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>

          <div className="w-px h-4 bg-gray-200" />

          {/* User / Sign in */}
          {user ? (
            <>
              <span className="text-sm text-gray-500">{user.name}</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                {user.plan}
              </span>
              <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-700">
                {t('sign_out')}
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm text-primary hover:underline font-medium">
              {t('sign_in_to_sync')}
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Title + Search + Create */}
        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-xl font-bold text-gray-900">{t('dash_title')}</h1>
          <input
            type="search"
            placeholder={t('dash_search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-xs border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-primary outline-none"
          />
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {t('doc_import_title')}
          </button>
          <button
            onClick={createCourse}
            disabled={creating || atCommunityLimit}
            title={atCommunityLimit ? 'Community plan is limited to 3 courses' : undefined}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <span className="text-lg leading-none">+</span>
            {t('dash_new')}
          </button>
        </div>

        {/* Community plan limit banner */}
        {atCommunityLimit && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-amber-800">{t('limit_reached_title')}</span>
              <p className="text-xs text-amber-600 mt-0.5">{t('limit_reached_sub')}</p>
            </div>
            <button className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-amber-700 shrink-0 ml-4">
              {t('upgrade_pro')}
            </button>
          </div>
        )}

        {/* Tabs */}
        {user && (
          <div className="flex gap-1 mb-5 border-b border-gray-200">
            {(['cloud', 'local'] as const).map((tabId) => (
              <button
                key={tabId}
                onClick={() => setTab(tabId)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === tabId ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {tabId === 'cloud' ? t('tab_cloud') : t('tab_local')}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {courses.length === 0 ? (
          <EmptyState onCreate={createCourse} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tab === 'local'
              ? (courses as LocalCourseMeta[]).map((course) => (
                  <CourseCard
                    key={course.id}
                    title={course.title}
                    autoThumbnailId={course.id}
                    updatedAt={new Date(course.updatedAt).toISOString()}
                    onClick={() => openLocal(course)}
                    onDelete={(e) => deleteLocal(course.id, e)}
                    analyticsId={course.id}
                  />
                ))
              : (courses as CourseListItem[]).map((course) => (
                  <CourseCard
                    key={course.id}
                    title={course.title}
                    thumbnail={course.thumbnail ?? undefined}
                    autoThumbnailId={course.id}
                    updatedAt={course.updated_at}
                    published={course.published}
                    onClick={() => openCloud(course)}
                    onDelete={(e) => deleteCloud(course.id, e)}
                    onTogglePublish={(e) => togglePublishCloud(course.id, course.published, e)}
                    analyticsId={course.id}
                    onAnalytics={(e) => { e.stopPropagation(); setAnalyticsFor({ id: course.id, title: course.title }) }}
                    onShare={(e) => { e.stopPropagation(); setCollabFor(course.id) }}
                  />
                ))}
          </div>
        )}
      </main>

      {importOpen && (
        <ImportDocumentModal
          onClose={() => setImportOpen(false)}
          onImport={(app) => {
            setApp(app)
            navigate('/')
          }}
        />
      )}
      {collabFor && (
        <CollaboratorsModal courseId={collabFor} onClose={() => setCollabFor(null)} />
      )}
    </div>
  )
}

function CourseCard({
  title, thumbnail, autoThumbnailId, updatedAt, published, onClick, onDelete, onTogglePublish, analyticsId, onAnalytics, onShare,
}: {
  title: string
  thumbnail?: string
  autoThumbnailId?: string
  updatedAt: string
  published?: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
  onTogglePublish?: (e: React.MouseEvent) => void
  analyticsId: string
  onAnalytics?: (e: React.MouseEvent) => void
  onShare?: (e: React.MouseEvent) => void
}) {
  const autoThumb = !thumbnail && autoThumbnailId
    ? generateThumbnailDataUrl({ id: autoThumbnailId, title, version: '1', settings: { showResults: true, allowNavigation: 'linear', completionCriteria: 'allScreens' }, state: {}, screens: [] })
    : null

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary hover:shadow-sm cursor-pointer transition-all"
    >
      <div className="h-32 overflow-hidden relative">
        <img src={thumbnail ?? autoThumb ?? ''} alt="" className="w-full h-full object-cover" />
        {onTogglePublish && (
          <button
            onClick={onTogglePublish}
            className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium transition-colors opacity-0 group-hover:opacity-100 ${
              published
                ? 'bg-green-600 text-white hover:bg-red-500'
                : 'bg-gray-800/70 text-white hover:bg-primary'
            }`}
            title={published ? 'Click to unpublish' : 'Click to publish'}
          >
            {published ? '🟢 Live' : 'Publish'}
          </button>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-800 truncate flex-1">{title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            {onShare && (
              <button
                onClick={onShare}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-primary transition-opacity"
                title="Share & Collaborate"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6-4a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
            )}
            {onAnalytics ? (
              <button
                onClick={onAnalytics}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-primary text-sm transition-opacity"
                title="Analytics"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </button>
            ) : (
              <Link
                to={`/analytics/${analyticsId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-gray-300 hover:text-primary text-sm"
                title="Analytics"
              >📊</Link>
            )}
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-base leading-none ml-0.5"
            >×</button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(updatedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const t = useT()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mb-4">📚</div>
      <h2 className="text-base font-semibold text-gray-700 mb-1">{t('dash_empty_title')}</h2>
      <p className="text-sm text-gray-400 mb-5">{t('dash_empty_sub')}</p>
      <button
        onClick={onCreate}
        className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
      >
        {t('dash_empty_cta')}
      </button>
    </div>
  )
}
