import type { BranchingComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: BranchingComponent
  onChange: (updates: Partial<BranchingComponent>) => void
}

export function BranchingEditor({ component, onChange }: Props) {
  const t = useT()
  function updateChoice(id: string, field: 'label' | 'consequence', value: string) {
    const choices = component.choices.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    onChange({ choices })
  }

  function addChoice() {
    const choices = [
      ...component.choices,
      { id: `ch-${Date.now()}`, label: `${t('choice_n')} ${component.choices.length + 1}`, consequence: '' },
    ]
    onChange({ choices })
  }

  function removeChoice(id: string) {
    if (component.choices.length <= 2) return
    onChange({ choices: component.choices.filter((c) => c.id !== id) })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">{t('scenario')}</label>
        <textarea
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none resize-none"
          rows={2}
          placeholder={t('scenario_placeholder')}
          value={component.scenario}
          onChange={(e) => onChange({ scenario: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-2 block">{t('choices')}</label>
        <div className="space-y-2">
          {component.choices.map((choice) => (
            <div key={choice.id} className="border border-gray-200 rounded p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{t('choice')}</span>
                <button onClick={() => removeChoice(choice.id)} className="text-gray-400 hover:text-red-400 text-xs">{t('remove')}</button>
              </div>
              <input
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                placeholder={t('choice_label')}
                value={choice.label}
                onChange={(e) => updateChoice(choice.id, 'label', e.target.value)}
              />
              <input
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:border-primary outline-none bg-gray-50"
                placeholder={t('consequence_placeholder')}
                value={choice.consequence ?? ''}
                onChange={(e) => updateChoice(choice.id, 'consequence', e.target.value)}
              />
            </div>
          ))}
        </div>
        <button onClick={addChoice} className="mt-2 text-xs text-primary hover:underline">
          {t('add_choice')}
        </button>
      </div>
    </div>
  )
}
