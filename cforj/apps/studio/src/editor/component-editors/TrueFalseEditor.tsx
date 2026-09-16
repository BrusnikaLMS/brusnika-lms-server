import type { TrueFalseComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: TrueFalseComponent
  onChange: (updates: Partial<TrueFalseComponent>) => void
}

export function TrueFalseEditor({ component, onChange }: Props) {
  const t = useT()
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">{t('statement')}</label>
        <textarea
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none resize-none"
          rows={2}
          placeholder={t('statement_placeholder')}
          value={component.statement}
          onChange={(e) => onChange({ statement: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-2 block">{t('correct_answer')}</label>
        <div className="flex gap-2">
          {([true, false] as const).map((val) => (
            <button
              key={String(val)}
              onClick={() => onChange({ correct: val })}
              className={`flex-1 py-1.5 rounded border text-sm font-medium ${
                component.correct === val
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {val ? t('true_label') : t('false_label')}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">{t('explanation')}</label>
        <input
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
          placeholder={t('shown_after')}
          value={component.explanation ?? ''}
          onChange={(e) => onChange({ explanation: e.target.value })}
        />
      </div>
    </div>
  )
}
