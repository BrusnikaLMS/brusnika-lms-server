import type { DragDropComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: DragDropComponent
  onChange: (updates: Partial<DragDropComponent>) => void
}

export function DragDropEditor({ component, onChange }: Props) {
  const t = useT()
  function updateItem(idx: number, label: string) {
    const items = component.items.map((item, i) => i === idx ? { ...item, label } : item)
    onChange({ items })
  }

  function addItem() {
    const id = `item-${Date.now()}`
    onChange({ items: [...component.items, { id, label: t('new_item') }] })
  }

  function removeItem(idx: number) {
    onChange({ items: component.items.filter((_, i) => i !== idx) })
  }

  function updateTarget(idx: number, field: 'label' | 'acceptsItem', value: string) {
    const targets = component.targets.map((t, i) => i === idx ? { ...t, [field]: value } : t)
    onChange({ targets })
  }

  function addTarget() {
    const id = `target-${Date.now()}`
    onChange({ targets: [...component.targets, { id, label: t('new_target'), acceptsItem: '' }] })
  }

  function removeTarget(idx: number) {
    onChange({ targets: component.targets.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block font-medium">{t('instruction')}</label>
        <input
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
          value={component.instruction}
          onChange={(e) => onChange({ instruction: e.target.value })}
          placeholder={t('instruction_placeholder')}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500 font-medium">{t('items_to_drag')}</label>
          <button onClick={addItem} className="text-xs text-primary hover:text-primary-dark">{t('add')}</button>
        </div>
        <div className="space-y-1">
          {component.items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-1.5">
              <input
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                value={item.label}
                onChange={(e) => updateItem(idx, e.target.value)}
                placeholder={`${t('new_item')} ${idx + 1}`}
              />
              <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-400 text-sm px-1">×</button>
            </div>
          ))}
          {component.items.length === 0 && (
            <div className="text-xs text-gray-300 italic">{t('no_items')}</div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500 font-medium">{t('drop_targets')}</label>
          <button onClick={addTarget} className="text-xs text-primary hover:text-primary-dark">{t('add')}</button>
        </div>
        <div className="space-y-2">
          {component.targets.map((target, idx) => (
            <div key={target.id} className="bg-gray-50 rounded p-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <input
                  className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                  value={target.label}
                  onChange={(e) => updateTarget(idx, 'label', e.target.value)}
                  placeholder={t('target_label')}
                />
                <button onClick={() => removeTarget(idx)} className="text-gray-400 hover:text-red-400 text-sm px-1">×</button>
              </div>
              <div>
                <select
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                  value={target.acceptsItem}
                  onChange={(e) => updateTarget(idx, 'acceptsItem', e.target.value)}
                >
                  <option value="">{t('accepts_item')}</option>
                  {component.items.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {component.targets.length === 0 && (
            <div className="text-xs text-gray-300 italic">{t('no_targets')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
