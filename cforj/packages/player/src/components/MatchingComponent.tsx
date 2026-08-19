import { useState, useCallback } from 'react'
import type { MatchingComponent } from '../types/course'
import { usePlayerT } from '../i18n'

interface Props {
  component: MatchingComponent
  onAnswer?: (correct: boolean) => void
}

export function MatchingComponent({ component, onAnswer }: Props) {
  const t = usePlayerT()
  const [selected, setSelected] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  // Shuffled right-side options
  const [shuffledRight] = useState(() =>
    [...component.pairs].sort(() => Math.random() - 0.5).map((p) => ({ id: p.id, right: p.right }))
  )

  const handleLeftClick = useCallback((pairId: string) => {
    if (submitted || component.disabled) return
    setSelected(pairId)
  }, [submitted, component.disabled])

  const handleRightClick = useCallback((pairId: string) => {
    if (submitted || component.disabled || !selected) return
    setMatches((prev) => ({ ...prev, [selected]: pairId }))
    setSelected(null)
  }, [submitted, component.disabled, selected])

  const handleSubmit = useCallback(() => {
    const allCorrect = component.pairs.every((p) => matches[p.id] === p.id)
    setSubmitted(true)
    onAnswer?.(allCorrect)
  }, [matches, component.pairs, onAnswer])

  const handleReset = useCallback(() => {
    setMatches({})
    setSelected(null)
  }, [])

  const allMatched = Object.keys(matches).length === component.pairs.length
  const isCorrect = submitted && component.pairs.every((p) => matches[p.id] === p.id)

  return (
    <div className="cs-component cs-component--quiz">
      <p className="cs-quiz__question">{component.instruction}</p>
      <div style={{ display: 'flex', gap: '24px', margin: '16px 0' }}>
        {/* Left column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {component.pairs.map((pair) => {
            const isActive = selected === pair.id
            const isMatched = pair.id in matches
            let bg = '#f3f4f6'
            if (isActive) bg = '#dbeafe'
            else if (submitted && matches[pair.id] === pair.id) bg = '#d1fae5'
            else if (submitted && isMatched) bg = '#fee2e2'
            else if (isMatched) bg = '#e0e7ff'
            return (
              <button
                key={pair.id}
                onClick={() => handleLeftClick(pair.id)}
                disabled={submitted || component.disabled}
                style={{
                  padding: '10px 14px', borderRadius: '8px', border: isActive ? '2px solid #6366f1' : '2px solid #e5e7eb',
                  background: bg, textAlign: 'left', cursor: submitted ? 'default' : 'pointer', fontSize: '14px',
                }}
              >
                {pair.left}
              </button>
            )
          })}
        </div>
        {/* Right column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {shuffledRight.map((item) => {
            const matchedBy = Object.entries(matches).find(([, v]) => v === item.id)?.[0]
            const isUsed = !!matchedBy
            let bg = '#f3f4f6'
            if (submitted && matchedBy && matches[matchedBy] === matchedBy) bg = '#d1fae5'
            else if (submitted && isUsed) bg = '#fee2e2'
            else if (isUsed) bg = '#e0e7ff'
            return (
              <button
                key={item.id}
                onClick={() => handleRightClick(item.id)}
                disabled={submitted || component.disabled || !selected || isUsed}
                style={{
                  padding: '10px 14px', borderRadius: '8px', border: '2px solid #e5e7eb',
                  background: bg, textAlign: 'left', cursor: (submitted || !selected || isUsed) ? 'default' : 'pointer',
                  fontSize: '14px', opacity: isUsed && !submitted ? 0.6 : 1,
                }}
              >
                {item.right}
              </button>
            )
          })}
        </div>
      </div>
      {!submitted && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="cs-quiz__option" onClick={handleSubmit} disabled={!allMatched}
            style={{ padding: '8px 20px', borderRadius: '6px', background: allMatched ? '#6366f1' : '#e5e7eb', color: allMatched ? '#fff' : '#9ca3af', border: 'none', cursor: allMatched ? 'pointer' : 'default', fontWeight: 600 }}>
            {t('check')}
          </button>
          {Object.keys(matches).length > 0 && (
            <button onClick={handleReset} style={{ padding: '8px 16px', borderRadius: '6px', background: '#f3f4f6', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '14px' }}>
              {t('reset')}
            </button>
          )}
        </div>
      )}
      {submitted && (
        <div className={`cs-quiz__feedback cs-quiz__feedback--${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect
            ? (component.feedback?.correct ?? t('correct'))
            : (component.feedback?.incorrect ?? t('incorrect'))}
        </div>
      )}
    </div>
  )
}
