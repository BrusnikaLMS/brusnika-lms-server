import type { SequenceComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: SequenceComponent
  onChange: (updates: Partial<SequenceComponent>) => void
}

export function SequenceEditor({ component, onChange }: Props) {
  const t = useT()

  function updateItem(idx: number, label: string) {
    const items = [...component.items]
    items[idx] = { ...items[idx]!, label }
    onChange({ items })
  }

  function addItem() {
    onChange({ items: [...component.items, { id: `seq-${Date.now()}`, label: '' }] })
  }

  function removeItem(idx: number) {
    if (component.items.length <= 2) return
    onChange({ items: component.items.filter((_, i) => i !== idx) })
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    const items = [...component.items]
    ;[items[idx - 1]!, items[idx]!] = [items[idx]!, items[idx - 1]!]
    onChange({ items })
  }

  function moveDown(idx: number) {
    if (idx >= component.items.length - 1) return
    const items = [...component.items]
    ;[items[idx]!, items[idx + 1]!] = [items[idx + 1]!, items[idx]!]
    onChange({ items })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-600 mb-1 block">{t('instruction')}</label>
        <input
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
          placeholder={t('sequence_instruction_placeholder')}
          value={component.instruction}
          onChange={(e) => onChange({ instruction: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs text-gray-600 mb-1 block">{t('sequence_items')}</label>
        <p className="text-[10px] text-gray-400 mb-1">{t('sequence_hint')}</p>
        <div className="space-y-1.5">
          {component.items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 shrink-0 w-4 text-right">{i + 1}.</span>
              <input
                className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
                placeholder={`${t('item')} ${i + 1}`}
                value={item.label}
                onChange={(e) => updateItem(i, e.target.value)}
              />
              <button onClick={() => moveUp(i)} disabled={i === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs">↑</button>
              <button onClick={() => moveDown(i)} disabled={i === component.items.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs">↓</button>
              <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-400 text-sm">×</button>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-2 text-xs text-primary hover:underline">
          + {t('sequence_add_item')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">{t('feedback_correct')}</label>
          <input
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
            placeholder={t('optional')}
            value={component.feedback?.correct ?? ''}
            onChange={(e) => onChange({ feedback: { correct: e.target.value, incorrect: component.feedback?.incorrect ?? '' } })}
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">{t('feedback_incorrect')}</label>
          <input
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
            placeholder={t('optional')}
            value={component.feedback?.incorrect ?? ''}
            onChange={(e) => onChange({ feedback: { correct: component.feedback?.correct ?? '', incorrect: e.target.value } })}
          />
        </div>
      </div>
    </div>
  )
}
