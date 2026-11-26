import { useState, useEffect, useRef } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useLocaleStore } from '../store/localeStore'
import { useT } from '../i18n'
import { CoursePlayer } from '@course-studio/player'
import type { PlayerLocale } from '@course-studio/player'
import { ExportMenu } from './ExportMenu'
import { ShortcutsModal } from './ShortcutsModal'
import { AIPanel } from './AIPanel'

const SPIRAL_PATH = 'M32 36 Q32 10 8 10 Q-16 10 -16 36 Q-16 62 32 62 Q80 62 80 36 Q80 10 32 10'

export function Header() {
  const { app, updateAppTitle, undo, redo, canUndo, canRedo, editorStep, setEditorStep } = useEditorStore()
  const locale = useLocaleStore((s) => s.locale) as PlayerLocale
  const t = useT()
  const [editingTitle, setEditingTitle] = useState(false)
  const [preview, setPreview] = useState(false)
  const [shortcuts, setShortcuts] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const aiRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (canRedo()) redo()
      }
      if (e.key === '?' && !isInput) setShortcuts(true)
      if (e.key === 'Escape') { setPreview(false); setShortcuts(false); setAiOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, canUndo, canRedo])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (aiRef.current && !aiRef.current.contains(e.target as Node)) {
        setAiOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <>
      <header className="h-14 bg-surface-base border-b border-border-base flex items-center justify-between px-3 md:px-4 shrink-0 z-10 relative">
        {/* Left */}
        <div className="flex items-center gap-1.5 md:gap-2.5">
          <div className="select-none shrink-0">
            <svg width="110" height="36" viewBox="0 0 220 72" fill="none" className="hidden sm:block">
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399"/>
                  <stop offset="100%" stopColor="#818cf8"/>
                </linearGradient>
              </defs>
              <path d={SPIRAL_PATH} fill="none" stroke="url(#hg)" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="32" cy="36" r="4" fill="url(#hg)"/>
              <text x="68" y="40" fontFamily="'SF Pro Display',-apple-system,sans-serif" fontWeight="700" fontSize="30" fill="var(--text-base)" letterSpacing="-0.5">cforj</text>
              <text x="68" y="56" fontFamily="-apple-system,sans-serif" fontSize="10" fill="#999" letterSpacing="1.5">COURSE FORGE STUDIO</text>
            </svg>
          </div>

          {editingTitle ? (
            <input
              autoFocus
              className="text-sm font-semibold text-txt-base border-b border-primary outline-none bg-transparent w-48"
              value={app.title}
              onChange={(e) => updateAppTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
            />
          ) : (
            <span
              className="text-sm font-semibold text-txt-base cursor-pointer hover:text-primary max-w-[180px] truncate"
              onClick={() => setEditingTitle(true)}
              title={t('rename_title')}
            >
              {app.title}
            </span>
          )}

          {/* Undo / Redo */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo()}
              title={t('undo_title')}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >&#8617;</button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              title={t('redo_title')}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >&#8618;</button>
            <button
              onClick={() => setShortcuts(true)}
              title={t('shortcuts_btn_title')}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-600 text-xs font-bold"
            >?</button>
          </div>
        </div>

        {/* Center: Content / Settings stepper */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center rounded-lg border border-border-base overflow-hidden">
          <button
            onClick={() => setEditorStep(1)}
            className={`px-3 md:px-4 py-1.5 text-sm font-medium transition-colors ${
              editorStep === 1
                ? 'bg-primary text-white'
                : 'bg-surface-base text-txt-muted hover:bg-surface-hover'
            }`}
          >
            1. {t('step_content')}
          </button>
          <div className="w-px h-full bg-border-base" />
          <button
            onClick={() => setEditorStep(2)}
            className={`px-3 md:px-4 py-1.5 text-sm font-medium transition-colors ${
              editorStep === 2
                ? 'bg-primary text-white'
                : 'bg-surface-base text-txt-muted hover:bg-surface-hover'
            }`}
          >
            2. {t('step_settings')}
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* AI button */}
          <div className="relative hidden sm:block" ref={aiRef}>
            <button
              onClick={() => setAiOpen(o => !o)}
              className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
                aiOpen
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              title="AI course generation"
            >
              AI
            </button>
            {aiOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('ai_panel_title')}</span>
                  <button onClick={() => setAiOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg leading-none">&times;</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <AIPanel />
                </div>
              </div>
            )}
          </div>

          <ExportMenu />

          <button
            onClick={() => setPreview(true)}
            className="hidden sm:block px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary-dark font-medium"
          >
            {t('preview')}
          </button>
        </div>
      </header>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('preview_title')} {app.title}</span>
              <button onClick={() => setPreview(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <CoursePlayer app={app} locale={locale} />
            </div>
          </div>
        </div>
      )}

      {shortcuts && <ShortcutsModal onClose={() => setShortcuts(false)} />}
    </>
  )
}
