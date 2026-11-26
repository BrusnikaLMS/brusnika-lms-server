import { useEffect } from 'react'
import type { FillBlankComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: FillBlankComponent
  onChange: (updates: Partial<FillBlankComponent>) => void
}

export function FillBlankEditor({ component, onChange }: Props) {
  const t = useT()

  // Auto-sync blanks array with {{blank}} count in text
  useEffect(() => {
    const count = (component.text.match(/\{\{blank\}\}/g) || []).length
    if (count !== component.blanks.length) {
      const blanks = Array.from({ length: count }, (_, i) =>
        component.blanks[i] ?? { id: `b-${Date.now()}-${i}`, answer: '' }
      )
      onChange({ blanks })
    }
  }, [component.text])

  function updateBlank(idx: number, field: 'answer', value: string) {
    const blanks = [...component.blanks]
    blanks[idx] = { ...blanks[idx]!, [field]: value }
    onChange({ blanks })
  }

  function updateAlternatives(idx: number, value: string) {
    const blanks = [...component.blanks]
    blanks[idx] = { ...blanks[idx]!, alternatives: value ? value.split(',').map((s) => s.trim()) : undefined }
    onChange({ blanks })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-600 mb-1 block">{t('fill_blank_text')}</label>
        <p className="text-[10px] text-gray-400 mb-1">{t('fill_blank_hint')}</p>
        <textarea
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none resize-y min-h-[80px]"
          placeholder={t('fill_blank_placeholder')}
          value={component.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={3}
        />
      </div>

      {component.blanks.length > 0 && (
        <div>
          <label className="text-xs text-gray-600 mb-1 block">{t('fill_blank_answers')}</label>
          <div className="space-y-2">
            {component.blanks.map((blank, i) => (
              <div key={blank.id} className="border border-gray-100 rounded-lg p-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 shrink-0">{t('blank')} {i + 1}:</span>
                  <input
                    className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                    placeholder={t('correct_answer')}
                    value={blank.answer}
                    onChange={(e) => updateBlank(i, 'answer', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 shrink-0">{t('alternatives')}:</span>
                  <input
                    className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                    placeholder={t('alternatives_hint')}
                    value={blank.alternatives?.join(', ') ?? ''}
                    onChange={(e) => updateAlternatives(i, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
