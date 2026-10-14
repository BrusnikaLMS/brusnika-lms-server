import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEditorStore } from '../store/editorStore'
import { useLocalCoursesStore, type LocalCourseMeta } from '../store/localCoursesStore'
import { useLocaleStore } from '../store/localeStore'
import { useT } from '../i18n'
import { coursesApi, type CourseListItem } from '../api/client'
import { generateThumbnailDataUrl } from '../utils/thumbnail'
import { logActivity } from '../utils/activityLog'
import { DocsPage } from './DocsPage'
import { SettingsSection } from './SettingsSection'
import type { CourseApp } from '@course-studio/player'

const SPIRAL_PATH = 'M32 36 Q32 10 8 10 Q-16 10 -16 36 Q-16 62 32 62 Q80 62 80 36 Q80 10 32 10'
const HOME_URL = import.meta.env.VITE_HOME_URL || ''

type NavSection = 'studio' | 'dashboards' | 'settings' | 'docs'

function newBlankApp(): CourseApp {
  const id = `app-${Date.now()}`
  return {
    id,
    version: '1.0.0',
    title: 'Untitled Course',
    language: 'en',
    settings: { showResults: true, allowNavigation: 'linear', completionCriteria: 'allScreens' },
    state: {},
    screens: [{ id: `s-${Date.now()}`, title: 'Screen 1', components: [], events: [], navigation: {} }],
  }
}

export function StudioHome() {
  const navigate = useNavigate()
  const { user, logout, initialized } = useAuthStore()
  const { setApp } = useEditorStore()
  const { courses: localCourses, init, load, remove: removeLocal } = useLocalCoursesStore()
  const { locale } = useLocaleStore()
  const t = useT()

  const [section, setSection] = useState<NavSection>('studio')
  const [docsSection, setDocsSection] = useState('getting-started')
  const [cloudCourses, setCloudCourses] = useState<CourseListItem[]>([])
  const [tab, setTab] = useState<'local' | 'cloud'>(user ? 'cloud' : 'local')
  const [search, setSearch] = useState('')
  const [userDropOpen, setUserDropOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [plansOpen, setPlansOpen] = useState(false)

  const userDropRef = useState<HTMLDivElement>(null)[1]

  useEffect(() => { init() }, [])
  useEffect(() => { if (user) loadCloud() }, [user])

  // Handle URL query params
  useEffect(() => {
    if (searchParams.get('plans') === '1') {
      setPlansOpen(true)
      searchParams.delete('plans')
      setSearchParams(searchParams, { replace: true })
    }
    const sec = searchParams.get('section')
    if (sec === 'docs') {
      setSection('docs')
      searchParams.delete('section')
      setSearchParams(searchParams, { replace: true })
    } else if (sec === 'settings') {
      setSection('settings')
      searchParams.delete('section')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

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
    logActivity('Course created', app.title || 'Untitled Course')
    navigate('/')
    setCreating(false)
  }

  async function openLocal(meta: LocalCourseMeta) {
    const course = await load(meta.id)
    if (course) {
      setApp(course)
      logActivity('Course opened', meta.title)
      navigate('/')
    }
  }

  async function openCloud(course: CourseListItem) {
    const full = await coursesApi.get(course.id)
    setApp(full.content)
    logActivity('Course opened', full.title)
    navigate('/')
  }

  async function removeLocalCourse(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    await removeLocal(id)
    loadCloud()
  }

  async function removeCloudCourse(id: string, title: string) {
    if (!confirm(`Delete "${title}" from cloud?`)) return
    await coursesApi.remove(id)
    loadCloud()
  }

  async function duplicateCourse(meta: LocalCourseMeta | CourseListItem) {
    const source = 'content' in meta
      ? meta.content
      : await load(meta.id)
    const dup = newBlankApp()
    dup.title = `${source?.title || 'Course'} (Copy)`
    dup.content = source?.content || {}
    dup.screens = source?.screens || []
    dup.state = source?.state || {}
    dup.events = source?.events || []
    setApp(dup)
    logActivity('Course duplicated', dup.title)
    navigate('/')
  }

  async function exportToLocal(app: CourseApp) {
    const meta: LocalCourseMeta = {
      id: app.id,
      title: app.title,
      thumbnail: generateThumbnailDataUrl(app),
      updatedAt: Date.now(),
      version: 1,
    }
    await load(app.id)
    setApp(app)
    logActivity('Course exported to local', app.title)
  }

  const filteredLocal = localCourses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )
  const filteredCloud = cloudCourses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const atCommunityLimit = tab === 'local' ? localCourses.length >= 3 : cloudCourses.length >= 3

  // Close user dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (userDropRef.current && !userDropRef.current.contains(e.target as Node)) {
        setUserDropOpen(false)
      }
    }
    if (userDropOpen) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [userDropOpen, userDropRef])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <svg width="90" height="30" viewBox="0 0 220 72" fill="none">
                <defs>
                  <linearGradient id="nav" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#34d399"/>
                    <stop offset="100%" stopColor="#818cf8"/>
                  </linearGradient>
                </defs>
                <path d="M32 36 Q32 10 8 10 Q-16 10 -16 36 Q-16 62 32 62 Q80 62 80 36 Q80 10 32 10"
                      fill="none" stroke="url(#nav)" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="32" cy="36" r="4" fill="url(#nav)"/>
                <text x="68" y="40" fontFamily="'SF Pro Display',-apple-system,sans-serif" fontWeight="700" fontSize="30" fill="currentColor" letterSpacing="-0.5">cforj</text>
              </svg>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSection('studio')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  section === 'studio'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Studio
              </button>
              <button
                onClick={() => setSection('docs')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  section === 'docs'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Docs
              </button>
              <button
                onClick={() => setSection('settings')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  section === 'settings'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('settings')}
              </button>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="relative" ref={userDropRef}>
                  <button
                    onClick={() => setUserDropOpen(o => !o)}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  {userDropOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-50 min-w-[180px]">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                      </div>
                      <button
                        onClick={() => { setPlansOpen(true); setUserDropOpen(false) }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t('plans')}
                      </button>
                      <button
                        onClick={() => { navigate('/dashboard?section=settings'); setUserDropOpen(false) }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t('settings')}
                      </button>
                      <button
                        onClick={() => { logout(); navigate('/'); setUserDropOpen(false) }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {t('sign_out')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      {section === 'docs' ? (
        <DocsPage section={docsSection} setSection={setDocsSection} onBack={() => setSection('studio')} />
      ) : section === 'settings' ? (
        <SettingsSection />
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tab === 'local' ? t('dash_title') : 'Cloud Courses'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {tab === 'local'
                  ? 'Locally stored courses'
                  : 'Cloud-synced courses'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <input
                type="search"
                placeholder={t('dash_search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:border-primary outline-none"
              />

              {/* Create button */}
              <button
                onClick={createCourse}
                disabled={creating || atCommunityLimit}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-base leading-none">+</span>
                {t('dash_new')}
              </button>

              {/* Tab switcher */}
              {user && (
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setTab('local')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      tab === 'local'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Local
                  </button>
                  <button
                    onClick={() => setTab('cloud')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      tab === 'cloud'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Cloud
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Course grid */}
          {tab === 'local' ? (
            filteredLocal.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 dark:text-gray-400">
                  {search ? 'No courses match your search' : t('dash_empty_title')}
                </p>
                {!search && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('dash_empty_sub')}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLocal.map(meta => (
                  <div
                    key={meta.id}
                    className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
                  >
                    <div
                      onClick={() => openLocal(meta)}
                      className="aspect-video bg-gradient-to-br from-emerald-400 to-indigo-500 cursor-pointer flex items-center justify-center"
                    >
                      <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                      </svg>
                    </div>
                    <div className="p-4">
                      <h3
                        onClick={() => openLocal(meta)}
                        className="font-semibold text-gray-900 dark:text-white cursor-pointer truncate"
                      >
                        {meta.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(meta.updatedAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => duplicateCourse(meta)}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => removeLocalCourse(meta.id, meta.title)}
                          className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredCloud.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 dark:text-gray-400">
                  {search ? 'No courses match your search' : 'No cloud courses yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCloud.map(course => (
                  <div
                    key={course.id}
                    className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
                  >
                    <div
                      onClick={() => openCloud(course)}
                      className="aspect-video bg-gradient-to-br from-emerald-400 to-indigo-500 cursor-pointer flex items-center justify-center"
                    >
                      <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                      </svg>
                    </div>
                    <div className="p-4">
                      <h3
                        onClick={() => openCloud(course)}
                        className="font-semibold text-gray-900 dark:text-white cursor-pointer truncate"
                      >
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(course.updated_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => duplicateCourse(course)}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => removeCloudCourse(course.id, course.title)}
                          className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Plans modal */}
      {plansOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPlansOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('plans_title')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {user ? `${t('plans_on_plan')} ${user.plan} ${t('plans_plan_suffix')}` : t('plans_sign_in_unlock')}
                </p>
              </div>
              <button onClick={() => setPlansOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                Plans & pricing coming soon. Contact hello@cforj.studio for access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
