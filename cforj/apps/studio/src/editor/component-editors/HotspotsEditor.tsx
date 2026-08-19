import { useRef } from 'react'
import type { HotspotsComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: HotspotsComponent
  onChange: (updates: Partial<HotspotsComponent>) => void
}

export function HotspotsEditor({ component, onChange }: Props) {
  const imageRef = useRef<HTMLDivElement>(null)
  const t = useT()

  function updateHotspot(idx: number, updates: Partial<HotspotsComponent['hotspots'][number]>) {
    const hotspots = component.hotspots.map((h, i) => i === idx ? { ...h, ...updates } : h)
    onChange({ hotspots })
  }

  function removeHotspot(idx: number) {
    onChange({ hotspots: component.hotspots.filter((_, i) => i !== idx) })
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    const newHotspot = {
      id: `hs-${Date.now()}`,
      x, y,
      label: `Hotspot ${component.hotspots.length + 1}`,
      content: '',
    }
    onChange({ hotspots: [...component.hotspots, newHotspot] })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block font-medium">{t('bg_image_url')}</label>
        <input
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
          value={component.image}
          onChange={(e) => onChange({ image: e.target.value })}
          placeholder="https://..."
        />
      </div>

      {component.image && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block font-medium">
            {t('click_to_add_hotspots')}
          </label>
          <div
            ref={imageRef}
            className="relative rounded overflow-hidden border border-gray-200 cursor-crosshair"
            style={{ paddingTop: '56.25%' }}
            onClick={handleImageClick}
          >
            <img
              src={component.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
            {component.hotspots.map((hs, idx) => (
              <div
                key={hs.id}
                className="absolute w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-110 transition-transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                onClick={(e) => e.stopPropagation()}
                title={hs.label}
              >
                {idx + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {component.hotspots.length > 0 && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block font-medium">{t('hotspot_details')}</label>
          <div className="space-y-2">
            {component.hotspots.map((hs, idx) => (
              <div key={hs.id} className="bg-gray-50 rounded p-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                    value={hs.label}
                    onChange={(e) => updateHotspot(idx, { label: e.target.value })}
                    placeholder={t('hotspot_label')}
                  />
                  <button onClick={() => removeHotspot(idx)} className="text-gray-400 hover:text-red-400 text-sm px-1">×</button>
                </div>
                <textarea
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:border-primary outline-none resize-none"
                  rows={2}
                  value={hs.content}
                  onChange={(e) => updateHotspot(idx, { content: e.target.value })}
                  placeholder={t('hotspot_popup')}
                />
                <div className="text-xs text-gray-300">
                  {t('hotspot_position')} {hs.x}%, {hs.y}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!component.image && (
        <div className="text-xs text-gray-400 italic text-center py-2">
          {t('enter_image_url')}
        </div>
      )}
    </div>
  )
}
