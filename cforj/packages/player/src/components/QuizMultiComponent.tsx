import { useState } from 'react'
import type { QuizMultiComponent } from '../types/course'
import { usePlayerT } from '../i18n'

interface Props {
  component: QuizMultiComponent
  onAnswer?: (correct: boolean) => void
}

export function QuizMultiComponent({ component, onAnswer }: Props) {
  const t = usePlayerT()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  function toggleOption(index: number) {
    if (submitted || component.disabled) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function handleSubmit() {
    if (submitted || selected.size === 0) return
    const correct =
      component.correct.every((i) => selected.has(i)) &&
      selected.size === component.correct.length
    setSubmitted(true)
    onAnswer?.(correct)
  }

  const isCorrect =
    submitted &&
    component.correct.every((i) => selected.has(i)) &&
    selected.size === component.correct.length

  return (
    <div className="cs-component cs-component--quiz">
      <p className="cs-quiz__question">{component.question}</p>
      <ul className="cs-quiz__options">
        {component.options.map((option, i) => {
          let state = ''
          if (submitted) {
            if (component.correct.includes(i)) state = 'correct'
            else if (selected.has(i)) state = 'incorrect'
          }
          return (
            <li key={i}>
              <label className={`cs-quiz__option ${state ? `cs-quiz__option--${state}` : ''}`}>
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleOption(i)}
                  disabled={submitted || component.disabled}
                />
                {option}
              </label>
            </li>
          )
        })}
      </ul>
      {!submitted && (
        <button
          className="cs-quiz__submit"
          onClick={handleSubmit}
          disabled={selected.size === 0 || component.disabled}
        >
          {t('submit')}
        </button>
      )}
      {submitted && (
        <div className={`cs-quiz__feedback cs-quiz__feedback--${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect
            ? (component.feedback?.correct ?? t('correct'))
            : (component.feedback?.incorrect ?? t('incorrect'))}
          {component.explanation && (
            <p className="cs-quiz__explanation">{component.explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}
