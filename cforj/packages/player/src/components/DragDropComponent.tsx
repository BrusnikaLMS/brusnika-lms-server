import { useState } from 'react'
import type { DragDropComponent as DragDropComponentType } from '../types/course'
import { usePlayerT } from '../i18n'

interface Props {
  component: DragDropComponentType
  onAnswer?: (correct: boolean) => void
}

export function DragDropComponent({ component, onAnswer }: Props) {
  const t = usePlayerT()
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [placements, setPlacements] = useState<Record<string, string>>({}) // targetId -> itemId
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)

  const placedItemIds = new Set(Object.values(placements))

  function handleDragStart(e: React.DragEvent, itemId: string) {
    setDraggingItemId(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!draggingItemId) return
    // Remove item from any previous target
    const newPlacements = Object.fromEntries(
      Object.entries(placements).filter(([, v]) => v !== draggingItemId)
    )
    newPlacements[targetId] = draggingItemId
    setPlacements(newPlacements)
    setDraggingItemId(null)
    setChecked(false)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function removeFromTarget(targetId: string) {
    const next = { ...placements }
    delete next[targetId]
    setPlacements(next)
    setChecked(false)
  }

  function checkAnswers() {
    const allCorrect = component.targets.every((target) => {
      const placed = placements[target.id]
      return placed === target.acceptsItem
    })
    setChecked(true)
    setCorrect(allCorrect)
    onAnswer?.(allCorrect)
  }

  const allPlaced = component.targets.every((t) => placements[t.id])

  return (
    <div className="cs-component cs-drag-drop">
      <p className="cs-drag-drop__instruction">{component.instruction}</p>

      {/* Item bank */}
      <div className="cs-drag-drop__bank">
        {component.items
          .filter((item) => !placedItemIds.has(item.id))
          .map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              className="cs-drag-drop__item"
            >
              {item.label}
            </div>
          ))}
        {component.items.every((i) => placedItemIds.has(i.id)) && (
          <span className="cs-drag-drop__bank-empty">All items placed</span>
        )}
      </div>

      {/* Targets */}
      <div className="cs-drag-drop__targets">
        {component.targets.map((target) => {
          const placedItem = component.items.find((i) => i.id === placements[target.id])
          const isCorrect = checked && placements[target.id] === target.acceptsItem
          const isWrong = checked && placements[target.id] && placements[target.id] !== target.acceptsItem

          return (
            <div key={target.id} className="cs-drag-drop__target-row">
              <span className="cs-drag-drop__target-label">{target.label}</span>
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, target.id)}
                className={`cs-drag-drop__target-zone ${isCorrect ? 'cs-drag-drop__target-zone--correct' : ''} ${isWrong ? 'cs-drag-drop__target-zone--wrong' : ''}`}
              >
                {placedItem ? (
                  <div className="cs-drag-drop__item cs-drag-drop__item--placed">
                    {placedItem.label}
                    {!checked && (
                      <button
                        onClick={() => removeFromTarget(target.id)}
                        className="cs-drag-drop__remove"
                      >×</button>
                    )}
                  </div>
                ) : (
                  <span className="cs-drag-drop__drop-hint">{t('drop_here')}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {checked && (
        <div className={`cs-feedback ${correct ? 'cs-feedback--correct' : 'cs-feedback--incorrect'}`}>
          {correct ? t('correct') : t('not_quite')}
        </div>
      )}

      <div className="cs-drag-drop__actions">
        {checked && !correct && (
          <button
            className="cs-btn cs-btn--secondary"
            onClick={() => { setPlacements({}); setChecked(false) }}
          >
            {t('reset')}
          </button>
        )}
        {!checked && (
          <button
            className="cs-btn cs-btn--primary"
            disabled={!allPlaced}
            onClick={checkAnswers}
          >
            {t('check')}
          </button>
        )}
      </div>
    </div>
  )
}
