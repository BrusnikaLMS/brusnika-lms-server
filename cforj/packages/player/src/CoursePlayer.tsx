import React, { useState, useCallback, useEffect, useRef } from 'react'
import type {
  CourseApp,
  Component,
  PlayerProgress,
  StateMap,
} from './types/course'
import { fireEvent } from './engine/eventEngine'
import {
  TextComponent,
  ImageComponent,
  VideoComponent,
  ButtonComponent,
  QuizSingleComponent,
  QuizMultiComponent,
  TrueFalseComponent,
  FlashcardsComponent,
  BranchingComponent,
  DragDropComponent,
  HotspotsComponent,
  DialogTrainerComponent,
  ScreenSimulationComponent,
  MatchingComponent,
  SequenceComponent,
  FillBlankComponent,
  ChecklistComponent,
} from './components'
import { PlayerLocaleContext, usePlayerT, type PlayerLocale } from './i18n'

interface Props {
  app: CourseApp
  initialProgress?: Partial<PlayerProgress>
  onProgress?: (progress: PlayerProgress) => void
  onComplete?: (progress: PlayerProgress) => void
  showBranding?: boolean // default true — set false in Pro
  customLogo?: string // custom logo URL shown when branding is hidden
  locale?: PlayerLocale
}

function createProgress(app: CourseApp, partial?: Partial<PlayerProgress>): PlayerProgress {
  const now = new Date().toISOString()
  return {
    appId: app.id,
    currentScreenId: app.screens[0]?.id ?? '',
    visitedScreens: [],
    completedScreens: [],
    quizAnswers: {},
    screenTimes: {},
    state: { ...app.state },
    score: 0,
    completed: false,
    startedAt: now,
    updatedAt: now,
    ...partial,
  }
}

export function CoursePlayer({ app, initialProgress, onProgress, onComplete, showBranding = true, customLogo, locale = 'en' }: Props) {
  return (
    <PlayerLocaleContext.Provider value={locale}>
      <CoursePlayerInner
        app={app}
        initialProgress={initialProgress}
        onProgress={onProgress}
        onComplete={onComplete}
        showBranding={showBranding}
        customLogo={customLogo}
      />
    </PlayerLocaleContext.Provider>
  )
}

function CoursePlayerInner({ app, initialProgress, onProgress, onComplete, showBranding = true, customLogo }: Omit<Props, 'locale'>) {
  const t = usePlayerT()
  const [progress, setProgress] = useState<PlayerProgress>(() =>
    createProgress(app, initialProgress)
  )
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null)

  // Per-component overrides (disabled, hidden) driven by events
  const [componentOverrides, setComponentOverrides] = useState<
    Record<string, { disabled?: boolean; hidden?: boolean }>
  >({})

  // Fullscreen state
  const [fullscreenId, setFullscreenId] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)

  // Screen time tracking: timestamp when the current screen became active
  const screenEnteredAtRef = useRef<number>(Date.now())

  const currentScreen = app.screens.find((s) => s.id === progress.currentScreenId)
    ?? app.screens[0]

  const updateProgress = useCallback(
    (updates: Partial<PlayerProgress>) => {
      setProgress((prev) => {
        const next = { ...prev, ...updates, updatedAt: new Date().toISOString() }
        onProgress?.(next)
        return next
      })
    },
    [onProgress]
  )

  // Close fullscreen on Escape
  useEffect(() => {
    if (!fullscreenId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setFullscreenId(null); setRotation(0) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreenId])

  // Fire SCREEN_ENTER on screen change and track time spent on previous screen
  useEffect(() => {
    if (!currentScreen) return
    setComponentOverrides({})
    setFullscreenId(null)
    setRotation(0)

    // Calculate time spent on the previous screen and update screenTimes
    const now = Date.now()
    const elapsedMs = now - screenEnteredAtRef.current
    screenEnteredAtRef.current = now

    setProgress((prev) => {
      const prevScreenId = prev.currentScreenId
      const prevTimes = prev.screenTimes ?? {}
      const updatedTimes = prevScreenId
        ? { ...prevTimes, [prevScreenId]: (prevTimes[prevScreenId] ?? 0) + elapsedMs }
        : prevTimes

      const next = {
        ...prev,
        screenTimes: updatedTimes,
        visitedScreens: prev.visitedScreens.includes(currentScreen.id)
          ? prev.visitedScreens
          : [...prev.visitedScreens, currentScreen.id],
        updatedAt: new Date().toISOString(),
      }
      onProgress?.(next)
      return next
    })

    handleEvent('SCREEN_ENTER', undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen?.id])

  function handleEvent(trigger: Parameters<typeof fireEvent>[0], componentId: string | undefined) {
    if (!currentScreen) return
    fireEvent(trigger, componentId, currentScreen, progress, {
      onGoToScreen: (screenId) => goToScreen(screenId),
      onSetState: (key, value) => {
        updateProgress({ state: { ...progress.state, [key]: value } })
      },
      onEnableComponent: (id) =>
        setComponentOverrides((prev) => ({ ...prev, [id]: { ...prev[id], disabled: false } })),
      onDisableComponent: (id) =>
        setComponentOverrides((prev) => ({ ...prev, [id]: { ...prev[id], disabled: true } })),
      onShowComponent: (id) =>
        setComponentOverrides((prev) => ({ ...prev, [id]: { ...prev[id], hidden: false } })),
      onHideComponent: (id) =>
        setComponentOverrides((prev) => ({ ...prev, [id]: { ...prev[id], hidden: true } })),
      onShowMessage: (text, variant = 'info') => {
        setMessage({ text, variant })
        setTimeout(() => setMessage(null), 3000)
      },
    })
  }

  function goToScreen(screenId: string) {
    const exists = app.screens.find((s) => s.id === screenId)
    if (!exists) return
    updateProgress({ currentScreenId: screenId })
  }

  function handleNext() {
    if (!currentScreen) return
    const completedScreens = progress.completedScreens.includes(currentScreen.id)
      ? progress.completedScreens
      : [...progress.completedScreens, currentScreen.id]

    handleEvent('SCREEN_EXIT', undefined)

    const nextId = currentScreen.navigation?.next
      ?? app.screens[app.screens.indexOf(currentScreen) + 1]?.id

    if (!nextId) {
      const final: PlayerProgress = {
        ...progress,
        completedScreens,
        completed: true,
        updatedAt: new Date().toISOString(),
      }
      setProgress(final)
      onComplete?.(final)
    } else {
      updateProgress({ completedScreens, currentScreenId: nextId })
    }
  }

  function handlePrev() {
    if (!currentScreen) return
    const prevId = currentScreen.navigation?.prev
      ?? app.screens[app.screens.indexOf(currentScreen) - 1]?.id
    if (prevId) updateProgress({ currentScreenId: prevId })
  }

  function handleQuizAnswer(componentId: string, correct: boolean) {
    handleEvent(correct ? 'QUIZ_CORRECT' : 'QUIZ_INCORRECT', componentId)
    handleEvent('QUIZ_COMPLETE', componentId)
    updateProgress({
      quizAnswers: { ...progress.quizAnswers, [componentId]: correct },
      score: correct ? progress.score + 1 : progress.score,
    })
  }

  const currentIndex = currentScreen ? app.screens.indexOf(currentScreen) : 0
  const isFirst = currentIndex === 0
  const isLast = currentIndex === app.screens.length - 1

  if (progress.completed) {
    return (
      <div className="cs-player cs-player--complete">
        <h2>{t('complete')}</h2>
        {app.settings.showResults && (
          <p className="cs-player__score">
            {t('score')}: {progress.score} / {Object.keys(progress.quizAnswers).length}
          </p>
        )}
      </div>
    )
  }

  if (!currentScreen) {
    return <div className="cs-player cs-player--empty">{t('no_screens')}</div>
  }

  return (
    <div className="cs-player">
      <header className="cs-player__header">
        <h1 className="cs-player__title">{app.title}</h1>
        <span className="cs-player__progress">
          {currentIndex + 1} / {app.screens.length}
        </span>
      </header>

      <main className="cs-player__screen">
        <h2 className="cs-player__screen-title">{currentScreen.title}</h2>

        <div className="cs-player__components">
          {currentScreen.components.map((component) => {
            const overrides = componentOverrides[component.id] ?? {}
            const merged = { ...component, ...overrides }
            if (merged.hidden) return null
            return (
              <FullscreenWrapper
                key={component.id}
                onFullscreen={() => { setFullscreenId(component.id); setRotation(0) }}
              >
                <ComponentRenderer
                  component={merged as Component}
                  onQuizAnswer={(correct) => handleQuizAnswer(component.id, correct)}
                  onEvent={(trigger) => handleEvent(trigger, component.id)}
                  onNavigate={goToScreen}
                />
              </FullscreenWrapper>
            )
          })}
        </div>
      </main>

      {message && (
        <div className={`cs-player__message cs-player__message--${message.variant}`}>
          {message.text}
        </div>
      )}

      <footer className="cs-player__footer">
        {!isFirst && app.settings.allowNavigation !== 'locked' && (
          <button className="cs-btn cs-btn--secondary" onClick={handlePrev}>
            {t('back')}
          </button>
        )}
        <button className="cs-btn cs-btn--primary" onClick={handleNext}>
          {isLast ? t('finish') : t('next')}
        </button>
      </footer>

      {showBranding && (
        <a
          href="https://cforj.studio"
          target="_blank"
          rel="noopener noreferrer"
          className="cs-player__branding"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '8px 0',
            fontSize: '11px',
            color: '#9ca3af',
            textDecoration: 'none',
            borderTop: '1px solid #e5e7eb',
            marginTop: '8px',
          }}
        >
          Built with <strong style={{ color: '#6b7280', fontWeight: 600 }}>cforj</strong>
        </a>
      )}
      {!showBranding && (customLogo ?? app.settings.customLogo) && (
        <div className="cs-player__custom-logo" style={{ textAlign: 'center', padding: '8px 0' }}>
          <img
            src={customLogo ?? app.settings.customLogo}
            alt="Logo"
            className="cs-player__custom-logo-img"
            style={{ maxHeight: '24px', opacity: 0.7 }}
          />
        </div>
      )}

      {/* Fullscreen overlay */}
      {fullscreenId && (() => {
        const comp = currentScreen.components.find((c) => c.id === fullscreenId)
        if (!comp) return null
        const merged = { ...comp, ...(componentOverrides[comp.id] ?? {}) }
        const rotated = rotation === 90 || rotation === 270
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 1 }}>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="Rotate 90°"
                style={overlayBtnStyle}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                  <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                </svg>
              </button>
              <button
                onClick={() => { setFullscreenId(null); setRotation(0) }}
                title="Close (Esc)"
                style={overlayBtnStyle}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <div style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease',
              width: rotated ? '100vh' : '100vw',
              height: rotated ? '100vw' : '100vh',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: rotated ? 0 : '64px 24px 24px',
              boxSizing: 'border-box',
            }}>
              <div style={{
                width: '100%', maxWidth: 1100,
                background: '#fff', borderRadius: 16,
                padding: '28px 32px',
                maxHeight: '100%', overflowY: 'auto',
                boxSizing: 'border-box',
              }}>
                <ComponentRenderer
                  component={merged as Component}
                  onQuizAnswer={(correct) => handleQuizAnswer(comp.id, correct)}
                  onEvent={(trigger) => handleEvent(trigger, comp.id)}
                  onNavigate={goToScreen}
                />
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

const overlayBtnStyle: React.CSSProperties = {
  width: 40, height: 40,
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(4px)',
}

function FullscreenWrapper({ children, onFullscreen }: { children: React.ReactNode; onFullscreen: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <button
        onClick={(e) => { e.stopPropagation(); onFullscreen() }}
        title="Fullscreen"
        style={{
          position: 'absolute', top: 6, right: 6,
          width: 28, height: 28,
          background: hovered ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.2)',
          color: '#fff',
          border: 'none', borderRadius: 6,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
          transition: 'background 0.15s',
          padding: 0,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
          <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
          <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
          <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
        </svg>
      </button>
    </div>
  )
}

interface RendererProps {
  component: Component
  onQuizAnswer: (correct: boolean) => void
  onEvent: (trigger: Parameters<typeof fireEvent>[0]) => void
  onNavigate: (screenId: string) => void
}

function ComponentRenderer({ component, onQuizAnswer, onEvent, onNavigate }: RendererProps) {
  switch (component.type) {
    case 'text':
      return <TextComponent component={component} />
    case 'image':
      return <ImageComponent component={component} />
    case 'video':
      return <VideoComponent component={component} onEnd={() => onEvent('VIDEO_END')} onStart={() => onEvent('VIDEO_START')} />
    case 'button':
      return <ButtonComponent component={component} onClick={() => onEvent('BUTTON_CLICK')} />
    case 'quiz-single':
      return <QuizSingleComponent component={component} onAnswer={onQuizAnswer} />
    case 'quiz-multi':
      return <QuizMultiComponent component={component} onAnswer={onQuizAnswer} />
    case 'true-false':
      return <TrueFalseComponent component={component} onAnswer={onQuizAnswer} />
    case 'flashcards':
      return <FlashcardsComponent component={component} />
    case 'branching':
      return <BranchingComponent component={component} onNavigate={onNavigate} onEvent={onEvent} />
    case 'drag-drop':
      return <DragDropComponent component={component} onAnswer={onQuizAnswer} />
    case 'hotspots':
      return <HotspotsComponent component={component} />
    case 'dialog-trainer':
      return <DialogTrainerComponent component={component} />
    case 'screen-simulation':
      return <ScreenSimulationComponent component={component} />
    case 'matching':
      return <MatchingComponent component={component} onAnswer={onQuizAnswer} />
    case 'sequence':
      return <SequenceComponent component={component} onAnswer={onQuizAnswer} />
    case 'fill-blank':
      return <FillBlankComponent component={component} onAnswer={onQuizAnswer} />
    case 'checklist':
      return <ChecklistComponent component={component} />
    default:
      return null
  }
}
