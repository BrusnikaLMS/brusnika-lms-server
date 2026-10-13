import { useState } from 'react'
import type { HotspotsComponent as HotspotsComponentType } from '../types/course'

interface Props {
  component: HotspotsComponentType
}

export function HotspotsComponent({ component }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [visited, setVisited] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setVisited((prev) => new Set([...prev, id]))
    setActiveId((prev) => (prev === id ? null : id))
  }

  const activeHotspot = component.hotspots.find((h) => h.id === activeId)

  return (
    <div className="cs-component cs-hotspots">
      <div className="cs-hotspots__image-wrap" style={{ position: 'relative', paddingTop: '56.25%' }}>
        <img
          src={component.image}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
        />
        {component.hotspots.map((hs, idx) => (
          <button
            key={hs.id}
            onClick={() => toggle(hs.id)}
            title={hs.label}
            style={{ position: 'absolute', left: `${hs.x}%`, top: `${hs.y}%`, transform: 'translate(-50%, -50%)' }}
            className={`cs-hotspots__pin ${visited.has(hs.id) ? 'cs-hotspots__pin--visited' : ''} ${activeId === hs.id ? 'cs-hotspots__pin--active' : ''}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {activeHotspot && (
        <div className="cs-hotspots__popup">
          <div className="cs-hotspots__popup-header">
            <strong>{activeHotspot.label}</strong>
            <button onClick={() => setActiveId(null)} className="cs-hotspots__popup-close">×</button>
          </div>
          <p className="cs-hotspots__popup-content">{activeHotspot.content}</p>
        </div>
      )}

      <div className="cs-hotspots__progress">
        {visited.size} / {component.hotspots.length} explored
      </div>
    </div>
  )
}
