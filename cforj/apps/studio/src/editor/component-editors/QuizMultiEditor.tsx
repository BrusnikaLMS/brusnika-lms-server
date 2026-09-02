import type { QuizMultiComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: QuizMultiComponent
  onChange: (updates: Partial<QuizMultiComponent>) => void
}

export function QuizMultiEditor({ component, onChange }: Props) {
  const t = useT()
  function updateOption(index: number, value: string) {
    const options = [...component.options]
    options[index] = value
    onChange({ options })
  }

  function toggleCorrect(index: number) {
    const correct = component.correct.includes(index)
      ? component.correct.filter((i) => i !== index)
      : [...component.correct, index].sort()
    onChange({ correct })
  }

  function addOption() {
    onChange({ options: [...component.options, `${t('option_n')} ${component.options.length + 1}`] })
  }

  function removeOption(index: number) {
    if (component.options.length <= 2) return
    const options = component.options.filter((_, i) => i !== index)
    const correct = component.correct.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    onChange({ options, correct })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">{t('question')}</label>
        <textarea
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none resize-none"
          rows={2}
          placeholder={t('your_question')}
          value={component.question}
          onChange={(e) => onChange({ question: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-2 block">{t('options_multi')}</label>
        <div className="space-y-1.5">
          {component.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => toggleCorrect(i)}
                className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
                  component.correct.includes(i) ? 'border-primary bg-primary text-white' : 'border-gray-300'
                }`}
              >
                {component.correct.includes(i) && <span className="text-white text-xs leading-none">✓</span>}
              </button>
              <input
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
              <button onClick={() => removeOption(i)} className="text-gray-400 hover:text-red-400 text-sm">×</button>
            </div>
          ))}
        </div>
        <button onClick={addOption} className="mt-2 text-xs text-primary hover:underline">
          {t('add_option')}
        </button>
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
