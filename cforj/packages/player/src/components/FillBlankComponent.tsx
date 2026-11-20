import { useState, useCallback } from 'react'
import type { FillBlankComponent } from '../types/course'
import { usePlayerT } from '../i18n'

interface Props {
  component: FillBlankComponent
  onAnswer?: (correct: boolean) => void
}

export function FillBlankComponent({ component, onAnswer }: Props) {
  const t = usePlayerT()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const parts = component.text.split(/(\{\{blank\}\})/g)
  let blankIdx = 0

  const handleChange = useCallback((blankId: string, value: string) => {
    if (submitted || component.disabled) return
    setAnswers((prev) => ({ ...prev, [blankId]: value }))
  }, [submitted, component.disabled])

  const isBlankCorrect = useCallback((blank: { id: string; answer: string; alternatives?: string[] }, userAnswer: string): boolean => {
    const normalize = (s: string) => s.trim().toLowerCase()
    const correct = normalize(blank.answer)
    if (normalize(userAnswer) === correct) return true
    return blank.alternatives?.some((alt) => normalize(alt) === normalize(userAnswer)) ?? false
  }, [])

  const handleSubmit = useCallback(() => {
    const allCorrect = component.blanks.every((blank) => isBlankCorrect(blank, answers[blank.id] ?? ''))
    setSubmitted(true)
    onAnswer?.(allCorrect)
  }, [answers, component.blanks, isBlankCorrect, onAnswer])

  const allFilled = component.blanks.every((b) => (answers[b.id] ?? '').trim() !== '')
  const isCorrect = submitted && component.blanks.every((blank) => isBlankCorrect(blank, answers[blank.id] ?? ''))

  return (
    <div className="cs-component cs-component--quiz">
      <div style={{ fontSize: '15px', lineHeight: '2.2', margin: '8px 0 16px' }}>
        {parts.map((part, i) => {
          if (part === '{{blank}}') {
            const blank = component.blanks[blankIdx]
            blankIdx++
            if (!blank) return null
            const userVal = answers[blank.id] ?? ''
            const correct = submitted && isBlankCorrect(blank, userVal)
            const incorrect = submitted && !isBlankCorrect(blank, userVal)
            return (
              <span key={i} style={{ display: 'inline-block', margin: '0 4px' }}>
                <input
                  value={userVal}
                  onChange={(e) => handleChange(blank.id, e.target.value)}
                  disabled={submitted || component.disabled}
                  placeholder="..."
                  style={{
                    width: `${Math.max(blank.answer.length * 10, 80)}px`,
                    padding: '4px 8px', fontSize: '14px', borderRadius: '6px',
                    border: correct ? '2px solid #6ee7b7' : incorrect ? '2px solid #fca5a5' : '2px solid #d1d5db',
                    background: correct ? '#d1fae5' : incorrect ? '#fee2e2' : '#fff',
                    outline: 'none', textAlign: 'center',
                  }}
                />
                {incorrect && (
                  <span style={{ fontSize: '12px', color: '#059669', marginLeft: '4px' }}>
                    {blank.answer}
                  </span>
                )}
              </span>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </div>
      {!submitted && (
        <button onClick={handleSubmit} disabled={!allFilled}
          style={{ padding: '8px 20px', borderRadius: '6px', background: allFilled ? '#6366f1' : '#e5e7eb', color: allFilled ? '#fff' : '#9ca3af', border: 'none', cursor: allFilled ? 'pointer' : 'default', fontWeight: 600 }}>
          {t('check')}
        </button>
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
