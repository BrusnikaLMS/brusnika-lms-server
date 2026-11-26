import type { ButtonComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: ButtonComponent
  onChange: (updates: Partial<ButtonComponent>) => void
}

export function ButtonEditor({ component, onChange }: Props) {
  const t = useT()
  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">{t('btn_label')}</label>
        <input
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
          value={component.label}
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">{t('btn_variant')}</label>
        <div className="flex gap-2">
          {(['primary', 'secondary'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onChange({ variant: v })}
              className={`flex-1 py-1 rounded border text-xs font-medium capitalize ${
                (component.variant ?? 'primary') === v
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
