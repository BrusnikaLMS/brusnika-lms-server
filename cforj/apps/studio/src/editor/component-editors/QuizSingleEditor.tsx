import type { QuizSingleComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: QuizSingleComponent
  onChange: (updates: Partial<QuizSingleComponent>) => void
}

export function QuizSingleEditor({ component, onChange }: Props) {
  const t = useT()
  function updateOption(index: number, value: string) {
    const options = [...component.options]
    options[index] = value
    onChange({ options })
  }

  function addOption() {
    onChange({ options: [...component.options, `${t('option_n')} ${component.options.length + 1}`] })
  }

  function removeOption(index: number) {
    if (component.options.length <= 2) return
    const options = component.options.filter((_, i) => i !== index)
    onChange({ options, correct: component.correct >= options.length ? 0 : component.correct })
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
        <label className="text-xs text-gray-500 mb-2 block">{t('options_single')}</label>
        <div className="space-y-1.5">
          {component.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => onChange({ correct: i })}
                className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                  i === component.correct ? 'border-primary bg-primary' : 'border-gray-300'
                }`}
              />
              <input
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
              <button
                onClick={() => removeOption(i)}
                className="text-gray-400 hover:text-red-400 text-sm"
              >×</button>
            </div>
          ))}
        </div>
        <button
          onClick={addOption}
          className="mt-2 text-xs text-primary hover:underline"
        >
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
