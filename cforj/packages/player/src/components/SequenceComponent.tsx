import { useState, useCallback } from 'react'
import type { SequenceComponent } from '../types/course'
import { usePlayerT } from '../i18n'

interface Props {
  component: SequenceComponent
  onAnswer?: (correct: boolean) => void
}

export function SequenceComponent({ component, onAnswer }: Props) {
  const t = usePlayerT()
  const [items, setItems] = useState(() =>
    [...component.items].sort(() => Math.random() - 0.5)
  )
  const [submitted, setSubmitted] = useState(false)

  const moveUp = useCallback((idx: number) => {
    if (idx === 0 || submitted || component.disabled) return
    setItems((prev) => {
      const next = [...prev]
      ;[next[idx - 1]!, next[idx]!] = [next[idx]!, next[idx - 1]!]
      return next
    })
  }, [submitted, component.disabled])

  const moveDown = useCallback((idx: number) => {
    if (submitted || component.disabled) return
    setItems((prev) => {
      if (idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx]!, next[idx + 1]!] = [next[idx + 1]!, next[idx]!]
      return next
    })
  }, [submitted, component.disabled])

  const handleSubmit = useCallback(() => {
    const isCorrect = items.every((item, i) => item.id === component.items[i]?.id)
    setSubmitted(true)
    onAnswer?.(isCorrect)
  }, [items, component.items, onAnswer])

  const isCorrect = submitted && items.every((item, i) => item.id === component.items[i]?.id)

  return (
    <div className="cs-component cs-component--quiz">
      <p className="cs-quiz__question">{component.instruction}</p>
      <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, idx) => {
          let bg = '#f3f4f6'
          let border = '#e5e7eb'
          if (submitted) {
            if (item.id === component.items[idx]?.id) { bg = '#d1fae5'; border = '#6ee7b7' }
            else { bg = '#fee2e2'; border = '#fca5a5' }
          }
          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
              borderRadius: '8px', background: bg, border: `2px solid ${border}`,
            }}>
              <span style={{ fontWeight: 700, color: '#9ca3af', fontSize: '13px', minWidth: '20px' }}>{idx + 1}.</span>
              <span style={{ flex: 1, fontSize: '14px' }}>{item.label}</span>
              {!submitted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button onClick={() => moveUp(idx)} disabled={idx === 0}
                    style={{ border: 'none', background: 'none', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '14px', color: idx === 0 ? '#d1d5db' : '#6b7280', padding: '0 4px' }}>
                    ▲
                  </button>
                  <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1}
                    style={{ border: 'none', background: 'none', cursor: idx === items.length - 1 ? 'default' : 'pointer', fontSize: '14px', color: idx === items.length - 1 ? '#d1d5db' : '#6b7280', padding: '0 4px' }}>
                    ▼
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {!submitted && (
        <button onClick={handleSubmit}
          style={{ padding: '8px 20px', borderRadius: '6px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {t('check')}
        </button>
      )}
      {submitted && (
        <div className={`cs-quiz__feedback cs-quiz__feedback--${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect
            ? (component.feedback?.correct ?? t('correct_order'))
            : (component.feedback?.incorrect ?? t('incorrect_order'))}
        </div>
      )}
    </div>
  )
}
