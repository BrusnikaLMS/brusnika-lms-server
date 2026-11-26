import { useState } from 'react'
import type { TrueFalseComponent } from '../types/course'
import { usePlayerT } from '../i18n'

interface Props {
  component: TrueFalseComponent
  onAnswer?: (correct: boolean) => void
}

export function TrueFalseComponent({ component, onAnswer }: Props) {
  const t = usePlayerT()
  const [answered, setAnswered] = useState<boolean | null>(null)
  const submitted = answered !== null
  const isCorrect = answered === component.correct

  function handleAnswer(value: boolean) {
    if (submitted || component.disabled) return
    setAnswered(value)
    onAnswer?.(value === component.correct)
  }

  return (
    <div className="cs-component cs-component--true-false">
      <p className="cs-quiz__question">{component.statement}</p>
      <div className="cs-tf__buttons">
        {([true, false] as const).map((val) => {
          let state = ''
          if (submitted) {
            if (component.correct === val) state = 'correct'
            else if (answered === val) state = 'incorrect'
          }
          return (
            <button
              key={String(val)}
              className={`cs-tf__btn ${state ? `cs-quiz__option--${state}` : ''}`}
              onClick={() => handleAnswer(val)}
              disabled={submitted || component.disabled}
            >
              {val ? t('true_label') : t('false_label')}
            </button>
          )
        })}
      </div>
      {submitted && (
        <div className={`cs-quiz__feedback cs-quiz__feedback--${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect
            ? t('correct')
            : `${t('answer_is')} ${component.correct ? t('true_label') : t('false_label')}.`}
          {component.explanation && (
            <p className="cs-quiz__explanation">{component.explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}
