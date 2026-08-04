import { useState } from 'react'
import type { QuizSingleComponent } from '../types/course'
import { usePlayerT } from '../i18n'

interface Props {
  component: QuizSingleComponent
  onAnswer?: (correct: boolean) => void
}

export function QuizSingleComponent({ component, onAnswer }: Props) {
  const t = usePlayerT()
  const [selected, setSelected] = useState<number | null>(null)
  const submitted = selected !== null
  const isCorrect = selected === component.correct

  function handleSelect(index: number) {
    if (submitted || component.disabled) return
    setSelected(index)
    onAnswer?.(index === component.correct)
  }

  return (
    <div className="cs-component cs-component--quiz">
      <p className="cs-quiz__question">{component.question}</p>
      <ul className="cs-quiz__options">
        {component.options.map((option, i) => {
          let state = ''
          if (submitted) {
            if (i === component.correct) state = 'correct'
            else if (i === selected) state = 'incorrect'
          }
          return (
            <li key={i}>
              <button
                className={`cs-quiz__option ${state ? `cs-quiz__option--${state}` : ''}`}
                onClick={() => handleSelect(i)}
                disabled={submitted || component.disabled}
              >
                {option}
              </button>
            </li>
          )
        })}
      </ul>
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
