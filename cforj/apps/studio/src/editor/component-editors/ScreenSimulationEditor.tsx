import { useState } from 'react'
import type { ScreenSimulationComponent, SimulationStep } from '@course-studio/player'
import { ScreenRecorderModal } from '../ScreenRecorderModal'
import { useT } from '../../i18n'

interface Props {
  component: ScreenSimulationComponent
  onChange: (updates: Partial<ScreenSimulationComponent>) => void
}

export function ScreenSimulationEditor({ component, onChange }: Props) {
  const t = useT()
  const [selectedStep, setSelectedStep] = useState<number>(0)
  const [editingHotspot, setEditingHotspot] = useState(false)
  const [recorderOpen, setRecorderOpen] = useState(false)

  const step = component.steps[selectedStep]

  function addStep() {
    const id = `step-${Date.now()}`
    const newStep: SimulationStep = {
      id,
      image: '',
      instruction: `${t('sim_step_n')} ${component.steps.length + 1}`,
    }
    const newSteps = [...component.steps, newStep]
    onChange({ steps: newSteps })
    setSelectedStep(newSteps.length - 1)
  }

  function updateStep(index: number, patch: Partial<SimulationStep>) {
    const steps = component.steps.map((s, i) => i === index ? { ...s, ...patch } : s)
    onChange({ steps })
  }

  function removeStep(index: number) {
    const steps = component.steps.filter((_, i) => i !== index)
    onChange({ steps })
    if (selectedStep >= steps.length) setSelectedStep(Math.max(0, steps.length - 1))
  }

  function moveStep(from: number, to: number) {
    const steps = [...component.steps]
    const [item] = steps.splice(from, 1)
    if (item) steps.splice(to, 0, item)
    onChange({ steps })
    setSelectedStep(to)
  }

  return (
    <div className="space-y-3">
      {recorderOpen && (
        <ScreenRecorderModal
          onImportSimulation={(steps) => {
            onChange({ steps })
            setSelectedStep(0)
            setRecorderOpen(false)
          }}
          onAddVideo={() => setRecorderOpen(false)}
          onClose={() => setRecorderOpen(false)}
        />
      )}

      {/* Title + Record button */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-0.5 block">{t('sim_title_label')}</label>
          <input
            className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:border-primary outline-none"
            placeholder={t('sim_title_placeholder')}
            value={component.title ?? ''}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
        <button
          onClick={() => setRecorderOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 text-gray-600 transition-colors shrink-0"
          title={t('sim_record_title')}
        >
          🎬 {t('sim_record_btn')}
        </button>
      </div>

      {/* Step list + editor */}
      <div className="flex gap-2">
        {/* Steps list */}
        <div className="w-28 shrink-0 space-y-1">
          {component.steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 group">
              <button
                onClick={() => setSelectedStep(i)}
                className={`flex-1 text-left px-2 py-1.5 rounded-lg text-xs transition-colors truncate ${
                  selectedStep === i
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t('sim_step_n')} {i + 1}
              </button>
              <div className="hidden group-hover:flex flex-col">
                <button
                  onClick={() => i > 0 && moveStep(i, i - 1)}
                  disabled={i === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-[10px] leading-none"
                >▲</button>
                <button
                  onClick={() => i < component.steps.length - 1 && moveStep(i, i + 1)}
                  disabled={i === component.steps.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-[10px] leading-none"
                >▼</button>
              </div>
              <button
                onClick={() => removeStep(i)}
                className="hidden group-hover:block text-gray-400 hover:text-red-400 text-sm leading-none"
              >×</button>
            </div>
          ))}
          <button
            onClick={addStep}
            className="w-full py-1 text-xs text-gray-400 hover:text-primary border border-dashed border-gray-200 rounded-lg hover:border-primary/40"
          >
            {t('sim_add_step')}
          </button>
        </div>

        {/* Step editor */}
        {step ? (
          <div className="flex-1 space-y-2 min-w-0">
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">{t('sim_screenshot_url')}</label>
              <input
                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:border-primary outline-none"
                placeholder="https://..."
                value={step.image}
                onChange={(e) => updateStep(selectedStep, { image: e.target.value })}
              />
              {step.image && (
                <div className="mt-1.5 relative">
                  <img
                    src={step.image}
                    alt=""
                    className="w-full h-24 object-cover rounded border border-gray-200"
                  />
                  {step.hotspot && (
                    <div
                      className="absolute border-2 border-primary bg-primary/20 rounded pointer-events-none"
                      style={{
                        left: `${step.hotspot.x}%`,
                        top: `${step.hotspot.y}%`,
                        width: `${step.hotspot.w}%`,
                        height: `${step.hotspot.h}%`,
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">{t('sim_instruction_label')}</label>
              <textarea
                rows={2}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:border-primary outline-none resize-none"
                placeholder={t('sim_instruction_placeholder')}
                value={step.instruction}
                onChange={(e) => updateStep(selectedStep, { instruction: e.target.value })}
              />
            </div>

            {/* Hotspot */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-gray-400 font-medium">{t('sim_hotspot_label')}</label>
                <button
                  onClick={() => {
                    if (step.hotspot) {
                      updateStep(selectedStep, { hotspot: undefined })
                    } else {
                      updateStep(selectedStep, { hotspot: { x: 30, y: 30, w: 20, h: 20 } })
                    }
                  }}
                  className="text-[10px] text-gray-400 hover:text-primary"
                >
                  {step.hotspot ? t('sim_remove_hotspot') : t('sim_add_hotspot')}
                </button>
              </div>
              {step.hotspot && (
                <div className="grid grid-cols-4 gap-1">
                  {(['x', 'y', 'w', 'h'] as const).map((key) => (
                    <div key={key}>
                      <label className="text-[9px] text-gray-400 block text-center">{key.toUpperCase()}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full text-xs border border-gray-200 rounded px-1 py-0.5 text-center focus:border-primary outline-none"
                        value={step.hotspot?.[key] ?? 0}
                        onChange={(e) => {
                          if (!step.hotspot) return
                          updateStep(selectedStep, {
                            hotspot: { ...step.hotspot, [key]: Number(e.target.value) }
                          })
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              {!step.hotspot && (
                <p className="text-[10px] text-gray-300 italic">{t('sim_no_hotspot_hint')}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 text-xs text-gray-400 flex items-center justify-center">
            {t('sim_add_step_to_start')}
          </div>
        )}
      </div>

      {component.steps.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-400 mb-2">{t('sim_no_steps_hint')}</p>
          <button
            onClick={addStep}
            className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            {t('sim_add_first_step')}
          </button>
        </div>
      )}
    </div>
  )
}
