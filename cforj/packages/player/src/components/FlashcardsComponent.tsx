import { useState } from 'react'
import type { FlashcardsComponent } from '../types/course'
import { usePlayerT } from '../i18n'

interface Props {
  component: FlashcardsComponent
}

export function FlashcardsComponent({ component }: Props) {
  const t = usePlayerT()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = component.cards[index]

  if (!card) return null

  return (
    <div className="cs-component cs-component--flashcards">
      <div
        className={`cs-card ${flipped ? 'cs-card--flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
      >
        <div className="cs-card__face cs-card__front">{card.front}</div>
        <div className="cs-card__face cs-card__back">{card.back}</div>
      </div>
      <div className="cs-card__nav">
        <button
          onClick={() => { setFlipped(false); setIndex((i) => i - 1) }}
          disabled={index === 0}
        >
          {t('previous')}
        </button>
        <span>{index + 1} / {component.cards.length}</span>
        <button
          onClick={() => { setFlipped(false); setIndex((i) => i + 1) }}
          disabled={index === component.cards.length - 1}
        >
          {t('next')}
        </button>
      </div>
    </div>
  )
}
