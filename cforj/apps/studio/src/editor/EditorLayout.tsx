import { useState, useEffect, useRef } from 'react'
import { Header } from './Header'
import { ScreensPanel } from './ScreensPanel'
import { Canvas } from './Canvas'
import { CourseSettings } from './CourseSettings'
import { ToastContainer } from './ToastContainer'
import { useEditorStore } from '../store/editorStore'
import { embedApi } from '../api/client'

export function EditorLayout() {
  const { editorStep, app } = useEditorStore()
  const [mobileScreensOpen, setMobileScreensOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaved = useRef<string>('')

  useEffect(() => {
    const serialized = JSON.stringify(app)
    if (!app.id || serialized === lastSaved.current) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')

    saveTimer.current = setTimeout(async () => {
      try {
        await embedApi.update(app.id, { title: app.title, content: app })
        lastSaved.current = serialized
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    }, 1200)

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [app])

  return (
    <div className="flex flex-col h-screen bg-surface-app overflow-hidden">
      <Header />

      {/* Mobile-only top bar */}
      <div className="md:hidden flex items-center gap-3 px-3 py-1.5 bg-surface-base border-b border-border-base shrink-0">
        <button
          onClick={() => setMobileScreensOpen(true)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          Screens
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: ScreensPanel in normal flex flow */}
        <div className="hidden md:flex shrink-0">
          <ScreensPanel />
        </div>

        {/* Mobile: slide-over overlay */}
        {mobileScreensOpen && (
          <div className="md:hidden fixed inset-0 z-30">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileScreensOpen(false)}
            />
            <div className="absolute top-0 bottom-0 left-0">
              <ScreensPanel />
            </div>
          </div>
        )}

        {editorStep === 2 ? <CourseSettings /> : <Canvas />}
      </div>
      {saveStatus !== 'idle' && (
        <div className={`fixed bottom-4 right-4 z-50 text-xs font-medium px-3 py-1.5 rounded-full shadow ${
          saveStatus === 'saved' ? 'bg-green-100 text-green-700' :
          saveStatus === 'error' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Save failed'}
        </div>
      )}
      <ToastContainer />
    </div>
  )
}
