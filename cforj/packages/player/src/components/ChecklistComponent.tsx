import { useState } from 'react'
import type { ChecklistComponent } from '../types/course'
import { usePlayerT } from '../i18n'

interface Props {
  component: ChecklistComponent
}

export function ChecklistComponent({ component }: Props) {
  const t = usePlayerT()
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    if (component.disabled) return
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = component.items.length > 0 && checked.size === component.items.length

  return (
    <div className="cs-component cs-component--checklist">
      {component.title && (
        <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '12px' }}>{component.title}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {component.items.map((item) => {
          const isChecked = checked.has(item.id)
          return (
            <label
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                borderRadius: '8px', border: '2px solid ' + (isChecked ? '#6ee7b7' : '#e5e7eb'),
                background: isChecked ? '#f0fdf4' : '#fff',
                cursor: component.disabled ? 'default' : 'pointer', transition: 'all 0.15s',
                fontSize: '14px',
              }}
              onClick={() => toggle(item.id)}
            >
              <span style={{
                width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                border: '2px solid ' + (isChecked ? '#059669' : '#d1d5db'),
                background: isChecked ? '#059669' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '13px', fontWeight: 700,
              }}>
                {isChecked && '✓'}
              </span>
              <span style={{
                textDecoration: isChecked ? 'line-through' : 'none',
                color: isChecked ? '#6b7280' : '#1f2937',
              }}>
                {item.label}
              </span>
            </label>
          )
        })}
      </div>
      {allChecked && (
        <div style={{
          marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
          background: '#d1fae5', color: '#065f46', fontSize: '14px', fontWeight: 600,
        }}>
          {t('all_items_completed')}
        </div>
      )}
    </div>
  )
}
