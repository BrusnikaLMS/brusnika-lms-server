import type { MatchingComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: MatchingComponent
  onChange: (updates: Partial<MatchingComponent>) => void
}

export function MatchingEditor({ component, onChange }: Props) {
  const t = useT()

  function updatePair(idx: number, field: 'left' | 'right', value: string) {
    const pairs = [...component.pairs]
    pairs[idx] = { ...pairs[idx]!, [field]: value }
    onChange({ pairs })
  }

  function addPair() {
    onChange({ pairs: [...component.pairs, { id: `p-${Date.now()}`, left: '', right: '' }] })
  }

  function removePair(idx: number) {
    if (component.pairs.length <= 1) return
    onChange({ pairs: component.pairs.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-600 mb-1 block">{t('instruction')}</label>
        <input
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
          placeholder={t('matching_instruction_placeholder')}
          value={component.instruction}
          onChange={(e) => onChange({ instruction: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs text-gray-600 mb-1 block">{t('matching_pairs')}</label>
        <div className="space-y-2">
          {component.pairs.map((pair, i) => (
            <div key={pair.id} className="flex items-start gap-2">
              <span className="text-xs text-gray-400 mt-2 shrink-0">{i + 1}.</span>
              <input
                className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
                placeholder={t('matching_left')}
                value={pair.left}
                onChange={(e) => updatePair(i, 'left', e.target.value)}
              />
              <span className="text-gray-400 mt-1.5">⇄</span>
              <input
                className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
                placeholder={t('matching_right')}
                value={pair.right}
                onChange={(e) => updatePair(i, 'right', e.target.value)}
              />
              <button
                onClick={() => removePair(i)}
                className="text-gray-400 hover:text-red-400 text-sm mt-1 shrink-0"
              >×</button>
            </div>
          ))}
        </div>
        <button onClick={addPair} className="mt-2 text-xs text-primary hover:underline">
          + {t('matching_add_pair')}
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
