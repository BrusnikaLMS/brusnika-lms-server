import { useState } from 'react'
import type { ScreenSimulationComponent as ScreenSimType } from '../types/course'
import { usePlayerT } from '../i18n'

interface Props {
  component: ScreenSimType
}

export function ScreenSimulationComponent({ component }: Props) {
  const t = usePlayerT()
  const { steps, title } = component
  const [stepIndex, setStepIndex] = useState(0)
  const [clicked, setClicked] = useState(false)
  const [showHotspot, setShowHotspot] = useState(false)

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  if (!step) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-400">
        No steps configured
      </div>
    )
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!step.hotspot) {
      advance()
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const hs = step.hotspot
    const inHotspot =
      x >= hs.x && x <= hs.x + hs.w &&
      y >= hs.y && y <= hs.y + hs.h
    if (inHotspot) {
      setClicked(true)
      setTimeout(advance, 600)
    } else {
      setShowHotspot(true)
      setTimeout(() => setShowHotspot(false), 1200)
    }
  }

  function advance() {
    if (!isLast) {
      setStepIndex((i) => i + 1)
      setClicked(false)
    }
  }

  if (isLast && clicked) {
    return (
      <div className="cs-screen-sim rounded-xl border border-gray-200 bg-white overflow-hidden">
        {title && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</span>
          </div>
        )}
        <div className="p-8 text-center space-y-3">
          <div className="text-3xl">✅</div>
          <p className="text-sm font-medium text-gray-700">Simulation complete!</p>
          <button
            onClick={() => { setStepIndex(0); setClicked(false) }}
            className="px-4 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Restart
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cs-screen-sim rounded-xl border border-gray-200 bg-white overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</span>
        </div>
      )}

      {/* Progress */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-100">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < stepIndex ? 'w-4 bg-green-400' :
                i === stepIndex ? 'w-4 bg-primary' :
                'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{stepIndex + 1} / {steps.length}</span>
      </div>

      {/* Instruction */}
      <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
        <p className="text-sm text-indigo-800 font-medium">{step.instruction}</p>
        {step.hotspot && !clicked && (
          <p className="text-xs text-indigo-500 mt-0.5">Click the correct area to proceed</p>
        )}
      </div>

      {/* Screenshot */}
      <div
        className="relative cursor-crosshair select-none"
        onClick={handleImageClick}
      >
        {step.image ? (
          <img
            src={step.image}
            alt={`Step ${stepIndex + 1}`}
            className="w-full object-contain max-h-80"
            draggable={false}
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            {t('no_screenshot')}
          </div>
        )}

        {/* Hotspot overlay */}
        {step.hotspot && (
          <div
            className={`absolute border-2 rounded transition-all pointer-events-none ${
              clicked ? 'border-green-400 bg-green-400/20' :
              showHotspot ? 'border-red-400 bg-red-400/20 animate-pulse' :
              'border-transparent'
            }`}
            style={{
              left: `${step.hotspot.x}%`,
              top: `${step.hotspot.y}%`,
              width: `${step.hotspot.w}%`,
              height: `${step.hotspot.h}%`,
            }}
          />
        )}

        {/* Click success flash */}
        {clicked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-green-400 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl shadow-lg animate-bounce">
              ✓
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
