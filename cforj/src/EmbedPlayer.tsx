import { useState, useEffect, useRef, useCallback } from 'react'
import { notifyReady, notifyProgress, notifyComplete, notifyResize, listenForCommands, type ProgressPayload } from './postMessage'

/**
 * Embed Player — loads course.json from server and renders it.
 *
 * For Brusnika LMS integration:
 * - Communicates via postMessage
 * - Auto-resizes iframe
 * - Sends completion data
 *
 * The course.json format follows cforj CourseApp schema.
 * This is a lightweight player that handles:
 * - Text, Image, Video, Quiz, TrueFalse, Flashcards, Branching, DragDrop, Hotspots
 */

interface CourseApp {
  id: string
  title: string
  screens: Screen[]
  state: Record<string, unknown>
  settings?: {
    theme?: { primary?: string; background?: string; font?: string }
  }
  language?: string
}

interface Screen {
  id: string
  title: string
  components: Component[]
  events?: EventRule[]
}

interface Component {
  id: string
  type: string
  props: Record<string, unknown>
}

interface EventRule {
  event: string
  action: string
  target?: string
  value?: unknown
}

// ── Main Component ────────────────────────────────────────────────────────

export function EmbedPlayer() {
  const [course, setCourse] = useState<CourseApp | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [visited, setVisited] = useState<Set<string>>(new Set())
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, unknown>>({})
  const startTime = useRef(Date.now())
  const containerRef = useRef<HTMLDivElement>(null)

  // Load course
  useEffect(() => {
    const courseId = (window as any).__CFORJ_COURSE_ID__
    const apiBase = (window as any).__CFORJ_API__ || ''
    if (!courseId) {
      setError('No course ID specified')
      setLoading(false)
      return
    }
    fetch(`${apiBase}/api/courses/${courseId}`)
      .then(r => { if (!r.ok) throw new Error('Course not found'); return r.json() })
      .then(data => {
        setCourse(data)
        setVisited(new Set([data.screens[0]?.id]))
        notifyReady(data.id)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  // Auto-resize
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        notifyResize(entry.contentRect.height)
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [course])

  // Listen for LMS commands
  const goToScreen = useCallback((screenId: string) => {
    if (!course) return
    const idx = course.screens.findIndex(s => s.id === screenId)
    if (idx >= 0) setCurrentIdx(idx)
  }, [course])

  useEffect(() => {
    listenForCommands({
      onGoToScreen: goToScreen,
      onGetProgress: () => { if (course) sendProgress(false) },
    })
  }, [goToScreen, course])

  function getProgress(isComplete: boolean): ProgressPayload {
    return {
      courseId: course!.id,
      currentScreenId: course!.screens[currentIdx]?.id || '',
      visitedScreens: [...visited],
      completedScreens: [...completed],
      score,
      maxScore,
      completed: isComplete,
      timeSpent: Math.floor((Date.now() - startTime.current) / 1000),
    }
  }

  function sendProgress(isComplete: boolean) {
    const p = getProgress(isComplete)
    notifyProgress(p)
    if (isComplete) notifyComplete(p)
  }

  function handleNext() {
    if (!course) return
    const nextIdx = currentIdx + 1
    if (nextIdx < course.screens.length) {
      setCurrentIdx(nextIdx)
      setVisited(prev => new Set([...prev, course.screens[nextIdx].id]))
      sendProgress(false)
    } else {
      // Course complete
      sendProgress(true)
    }
  }

  function handlePrev() {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1)
  }

  function handleQuizAnswer(componentId: string, answer: unknown, correct: boolean, points: number) {
    setQuizAnswers(prev => ({ ...prev, [componentId]: answer }))
    if (correct) setScore(s => s + points)
    setMaxScore(m => m + points)
    setCompleted(prev => new Set([...prev, course!.screens[currentIdx].id]))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#9ca3af' }}>Loading course...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', color: '#ef4444' }}>
        <p style={{ fontSize: 48 }}>:(</p>
        <p style={{ marginTop: 12 }}>{error}</p>
      </div>
    </div>
  )

  if (!course) return null

  const screen = course.screens[currentIdx]
  const isLast = currentIdx === course.screens.length - 1
  const isFirst = currentIdx === 0
  const primary = course.settings?.theme?.primary || '#6C63FF'

  return (
    <div ref={containerRef} style={{ fontFamily: course.settings?.theme?.font || 'system-ui, sans-serif', background: course.settings?.theme?.background || '#fff', minHeight: '100vh' }}>
      {/* Progress bar */}
      <div style={{ height: 4, background: '#e5e7eb' }}>
        <div style={{ height: '100%', background: primary, width: `${((currentIdx + 1) / course.screens.length) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{course.title}</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{currentIdx + 1} / {course.screens.length}</span>
      </div>

      {/* Screen content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 24 }}>{screen.title}</h2>

        {screen.components.map(comp => (
          <div key={comp.id} style={{ marginBottom: 20 }}>
            <ComponentRenderer
              component={comp}
              primary={primary}
              onAnswer={(answer, correct, points) => handleQuizAnswer(comp.id, answer, correct, points)}
              answered={comp.id in quizAnswers}
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 800, margin: '0 auto' }}>
        <button
          onClick={handlePrev}
          disabled={isFirst}
          style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', color: isFirst ? '#d1d5db' : '#374151', cursor: isFirst ? 'default' : 'pointer', fontSize: 14, fontWeight: 500 }}
        >
          &larr; Back
        </button>
        <button
          onClick={handleNext}
          style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: primary, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          {isLast ? 'Complete' : 'Next \u2192'}
        </button>
      </div>

      {/* Branding */}
      <div style={{ textAlign: 'center', padding: '8px 0 16px', fontSize: 11, color: '#d1d5db' }}>
        Powered by <a href="https://cforj.studio" target="_blank" rel="noopener" style={{ color: '#9ca3af' }}>cforj</a>
      </div>
    </div>
  )
}

// ── Component Renderer ────────────────────────────────────────────────────

function ComponentRenderer({ component, primary, onAnswer, answered }: {
  component: Component
  primary: string
  onAnswer: (answer: unknown, correct: boolean, points: number) => void
  answered: boolean
}) {
  const { type, props } = component

  switch (type) {
    case 'text':
      return <div style={{ fontSize: 15, lineHeight: 1.7, color: '#374151' }} dangerouslySetInnerHTML={{ __html: (props.html as string) || (props.text as string) || '' }} />

    case 'image':
      return (
        <figure>
          <img src={props.src as string} alt={props.alt as string || ''} style={{ maxWidth: '100%', borderRadius: 8 }} />
          {props.caption && <figcaption style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'center' }}>{props.caption as string}</figcaption>}
        </figure>
      )

    case 'video':
      return (
        <video
          src={props.src as string}
          controls
          style={{ maxWidth: '100%', borderRadius: 8 }}
          poster={props.poster as string}
        />
      )

    case 'quiz-single':
    case 'quiz-multi':
    case 'true-false':
      return <QuizRenderer component={component} primary={primary} onAnswer={onAnswer} answered={answered} />

    case 'button':
      return (
        <button style={{ padding: '12px 28px', borderRadius: 8, border: 'none', background: primary, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          {props.label as string || 'Button'}
        </button>
      )

    default:
      return <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, color: '#6b7280', fontSize: 13 }}>[{type}] component</div>
  }
}

// ── Quiz Renderer ─────────────────────────────────────────────────────────

function QuizRenderer({ component, primary, onAnswer, answered }: {
  component: Component
  primary: string
  onAnswer: (answer: unknown, correct: boolean, points: number) => void
  answered: boolean
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const { props } = component
  const options = (props.options || props.choices || []) as { text: string; correct?: boolean }[]
  const question = (props.question || props.text || '') as string
  const points = (props.points as number) || 1

  function submit() {
    if (selected === null) return
    const correct = !!options[selected]?.correct
    setSubmitted(true)
    onAnswer(selected, correct, points)
  }

  if (component.type === 'true-false') {
    const correctAnswer = props.correct as boolean
    return (
      <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20 }}>
        <p style={{ fontWeight: 600, marginBottom: 12 }}>{question}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[true, false].map(val => {
            const isSelected = selected === (val ? 1 : 0)
            const isCorrect = submitted && val === correctAnswer
            const isWrong = submitted && isSelected && val !== correctAnswer
            return (
              <button
                key={String(val)}
                onClick={() => { if (!submitted) setSelected(val ? 1 : 0) }}
                disabled={submitted}
                style={{
                  flex: 1, padding: '12px', borderRadius: 8, border: `2px solid ${isCorrect ? '#10b981' : isWrong ? '#ef4444' : isSelected ? primary : '#e5e7eb'}`,
                  background: isCorrect ? '#ecfdf5' : isWrong ? '#fef2f2' : isSelected ? `${primary}10` : 'white',
                  cursor: submitted ? 'default' : 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >
                {val ? 'True' : 'False'}
              </button>
            )
          })}
        </div>
        {!submitted && selected !== null && (
          <button onClick={submit} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none', background: primary, color: 'white', cursor: 'pointer', fontSize: 13 }}>Check</button>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20 }}>
      <p style={{ fontWeight: 600, marginBottom: 12 }}>{question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = submitted && opt.correct
          const isWrong = submitted && isSelected && !opt.correct
          return (
            <button
              key={i}
              onClick={() => { if (!submitted) setSelected(i) }}
              disabled={submitted}
              style={{
                textAlign: 'left', padding: '12px 16px', borderRadius: 8,
                border: `2px solid ${isCorrect ? '#10b981' : isWrong ? '#ef4444' : isSelected ? primary : '#e5e7eb'}`,
                background: isCorrect ? '#ecfdf5' : isWrong ? '#fef2f2' : isSelected ? `${primary}10` : 'white',
                cursor: submitted ? 'default' : 'pointer', fontSize: 14,
              }}
            >
              {opt.text}
            </button>
          )
        })}
      </div>
      {!submitted && selected !== null && (
        <button onClick={submit} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none', background: primary, color: 'white', cursor: 'pointer', fontSize: 13 }}>Check</button>
      )}
      {submitted && (
        <p style={{ marginTop: 12, fontSize: 13, color: options[selected!]?.correct ? '#10b981' : '#ef4444', fontWeight: 600 }}>
          {options[selected!]?.correct ? '✓ Correct!' : '✗ Incorrect'}
        </p>
      )}
    </div>
  )
}
