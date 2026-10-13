import type { FlashcardsComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: FlashcardsComponent
  onChange: (updates: Partial<FlashcardsComponent>) => void
}

export function FlashcardsEditor({ component, onChange }: Props) {
  const t = useT()
  function updateCard(index: number, field: 'front' | 'back', value: string) {
    const cards = component.cards.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    onChange({ cards })
  }

  function addCard() {
    onChange({ cards: [...component.cards, { front: t('default_term'), back: t('default_definition') }] })
  }

  function removeCard(index: number) {
    if (component.cards.length <= 1) return
    onChange({ cards: component.cards.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-500 block">{t('cards_label')} ({component.cards.length})</label>
      {component.cards.map((card, i) => (
        <div key={i} className="border border-gray-200 rounded p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{t('card_n')} {i + 1}</span>
            <button onClick={() => removeCard(i)} className="text-gray-400 hover:text-red-400 text-xs">{t('remove')}</button>
          </div>
          <input
            className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:border-primary outline-none"
            placeholder={t('front_term')}
            value={card.front}
            onChange={(e) => updateCard(i, 'front', e.target.value)}
          />
          <input
            className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:border-primary outline-none bg-gray-50"
            placeholder={t('back_definition')}
            value={card.back}
            onChange={(e) => updateCard(i, 'back', e.target.value)}
          />
        </div>
      ))}
      <button onClick={addCard} className="text-xs text-primary hover:underline">
        {t('add_card')}
      </button>
    </div>
  )
}
