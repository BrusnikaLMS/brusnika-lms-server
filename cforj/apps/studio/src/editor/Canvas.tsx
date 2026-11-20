import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useT } from '../i18n'
import { toast } from '../store/toastStore'
import { AddComponentMenu } from './AddComponentMenu'
import type { Component } from '@course-studio/player'
import { TextEditor } from './component-editors/TextEditor'
import { ImageEditor } from './component-editors/ImageEditor'
import { VideoEditor } from './component-editors/VideoEditor'
import { ButtonEditor } from './component-editors/ButtonEditor'
import { QuizSingleEditor } from './component-editors/QuizSingleEditor'
import { QuizMultiEditor } from './component-editors/QuizMultiEditor'
import { TrueFalseEditor } from './component-editors/TrueFalseEditor'
import { FlashcardsEditor } from './component-editors/FlashcardsEditor'
import { BranchingEditor } from './component-editors/BranchingEditor'
import { DragDropEditor } from './component-editors/DragDropEditor'
import { HotspotsEditor } from './component-editors/HotspotsEditor'
import { ComponentLogicInline } from './ComponentLogicInline'
import { AIComponentModal } from './AIComponentModal'
import { DialogTrainerEditor } from './component-editors/DialogTrainerEditor'
import { ScreenSimulationEditor } from './component-editors/ScreenSimulationEditor'
import { MatchingEditor } from './component-editors/MatchingEditor'
import { SequenceEditor } from './component-editors/SequenceEditor'
import { FillBlankEditor } from './component-editors/FillBlankEditor'
import { ChecklistEditor } from './component-editors/ChecklistEditor'

const COMPONENT_HINT_KEYS: Record<Component['type'], string> = {
  text: 'hint_text',
  image: 'hint_image',
  video: 'hint_video',
  button: 'hint_button',
  'quiz-single': 'hint_quiz_single',
  'quiz-multi': 'hint_quiz_multi',
  'true-false': 'hint_true_false',
  flashcards: 'hint_flashcards',
  branching: 'hint_branching',
  'drag-drop': 'hint_drag_drop',
  hotspots: 'hint_hotspots',
  'dialog-trainer': 'hint_dialog_trainer',
  'screen-simulation': 'hint_screen_simulation',
  'matching': 'hint_matching',
  'sequence': 'hint_sequence',
  'fill-blank': 'hint_fill_blank',
  'checklist': 'hint_checklist',
}

const TYPE_LABEL_KEYS: Record<Component['type'], string> = {
  text: 'comp_text_label',
  image: 'comp_image_label',
  video: 'comp_video_label',
  button: 'comp_button_label',
  'quiz-single': 'comp_quiz_single_label',
  'quiz-multi': 'comp_quiz_multi_label',
  'true-false': 'comp_true_false_label',
  flashcards: 'comp_flashcards_label',
  branching: 'comp_branching_label',
  'drag-drop': 'comp_drag_drop_label',
  hotspots: 'comp_hotspots_label',
  'dialog-trainer': 'comp_dialog_trainer_label',
  'screen-simulation': 'comp_screen_sim_label',
  'matching': 'comp_matching_label',
  'sequence': 'comp_sequence_label',
  'fill-blank': 'comp_fill_blank_label',
  'checklist': 'comp_checklist_label',
}

const TYPE_ICONS: Record<Component['type'], string> = {
  text: 'T', image: '🖼', video: '▶', button: '⬛',
  'quiz-single': '◉', 'quiz-multi': '☑', 'true-false': '✓✗',
  flashcards: '🃏', branching: '⑂', 'drag-drop': '↔', hotspots: '📍',
  'dialog-trainer': '💬', 'screen-simulation': '🖥',
  'matching': '⇄', 'sequence': '↕', 'fill-blank': '___',
  'checklist': '☐',
}

export function Canvas() {
  const t = useT()
  const {
    app, currentScreenId, selectedComponentId,
    setSelectedComponent, addComponent, updateComponent,
    removeComponent, moveComponentUp, moveComponentDown,
    duplicateComponent, reorderComponents, updateScreen,
  } = useEditorStore()

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [hintOpen, setHintOpen] = useState(true)
  const [aiModalComponentId, setAiModalComponentId] = useState<string | null>(null)
  const [activeHintId, setActiveHintId] = useState<string | null>(null)
  const dragIndex = useRef<number>(-1)
  const componentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const prevComponentCount = useRef(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const currentScreen = app.screens.find((s) => s.id === currentScreenId)

  // Auto-scroll to newly added component
  useEffect(() => {
    if (!currentScreen) return
    const count = currentScreen.components.length
    if (count > prevComponentCount.current && count > 0) {
      const lastId = currentScreen.components[count - 1]?.id
      if (lastId) {
        setTimeout(() => {
          componentRefs.current[lastId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 50)
      }
    }
    prevComponentCount.current = count
  }, [currentScreen?.components.length])

  // Keyboard shortcuts: Ctrl+D duplicate, Delete/Backspace remove selected
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (!selectedComponentId || !currentScreen) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        duplicateComponent(currentScreen.id, selectedComponentId)
        toast(t('toast_component_duplicated'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedComponentId, currentScreen, duplicateComponent, removeComponent])

  if (!currentScreen) {
    return (
      <div className="flex-1 flex items-center justify-center text-txt-muted text-sm bg-surface-app">
        {t('no_screen_selected')}
      </div>
    )
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleUpdate(componentId: string, updates: Partial<Component>) {
    updateComponent(currentScreen!.id, componentId, updates)
  }

  function handleDragStart(e: React.DragEvent, id: string, index: number) {
    setDraggingId(id)
    dragIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(id)
  }

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault()
    if (dragIndex.current !== -1 && dragIndex.current !== toIndex) {
      reorderComponents(currentScreen!.id, dragIndex.current, toIndex)
    }
    setDraggingId(null)
    setDragOverId(null)
    dragIndex.current = -1
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverId(null)
    dragIndex.current = -1
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-app">
      {/* Onboarding hint */}
      <div className="bg-primary/5 border-b border-primary/10 px-4 shrink-0">
        {hintOpen ? (
          <div className="flex items-center gap-2 text-xs text-primary py-2">
            <span className="font-semibold shrink-0">{t('quick_start')}</span>
            <span className="flex items-center gap-1.5 flex-wrap">
              <Step n={1} label={t('step_add_screen')} />
              <Arrow />
              <Step n={2} label={t('step_add_components')} />
              <Arrow />
              <Step n={3} label={t('step_add_logic')} />
              <Arrow />
              <Step n={4} label={t('step_settings')} />
              <Arrow />
              <Step n={5} label={t('step_export')} />
            </span>
            <button
              onClick={() => setHintOpen(false)}
              className="ml-auto shrink-0 text-primary/60 hover:text-primary text-base leading-none"
              title="Collapse"
            >▾</button>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 text-xs text-primary/70 py-1.5 cursor-pointer hover:text-primary transition-colors"
            onClick={() => setHintOpen(true)}
          >
            <span className="text-[10px]">▸</span>
            <span className="font-semibold">{t('quick_start')}</span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-surface-base border-b border-border-base px-4 py-2 flex items-center gap-3 shrink-0">
        <input
          className="text-sm font-semibold text-txt-base border-b border-transparent hover:border-border-base focus:border-primary outline-none bg-transparent flex-1 max-w-xs"
          value={currentScreen.title}
          onChange={(e) => updateScreen(currentScreen.id, { title: e.target.value })}
        />

        <div className="ml-auto flex items-center gap-2">
          {currentScreen.components.length > 0 && (
            <button
              onClick={() => {
                const allIds = new Set(currentScreen.components.map((c) => c.id))
                if (collapsed.size === allIds.size) setCollapsed(new Set())
                else setCollapsed(allIds)
              }}
              className="text-xs text-gray-400 hover:text-gray-700 px-2"
            >
              {collapsed.size === currentScreen.components.length ? t('expand_all') : t('collapse_all')}
            </button>
          )}
          <AddComponentMenu onAdd={(c) => { addComponent(currentScreen.id, c); toast(t('toast_component_added')) }} />
        </div>
      </div>

      {/* Components */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-2">
          {currentScreen.components.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border-base rounded-xl text-center">
              <div className="text-4xl mb-3 opacity-30">+</div>
              <p className="text-sm text-txt-muted font-medium">{t('canvas_empty_title')}</p>
              <p className="text-xs text-txt-faint mt-1">{t('canvas_empty_sub')}</p>
            </div>
          )}

          {currentScreen.components.map((component, index) => {
            const isSelected = component.id === selectedComponentId
            const isCollapsed = collapsed.has(component.id)
            const isDragging = component.id === draggingId
            const isDragOver = component.id === dragOverId && component.id !== draggingId

            return (
              <div
                key={component.id}
                ref={(el) => { componentRefs.current[component.id] = el }}
                draggable
                onDragStart={(e) => handleDragStart(e, component.id, index)}
                onDragOver={(e) => handleDragOver(e, component.id)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`bg-surface-base rounded-xl border-2 transition-colors ${
                  isDragOver ? 'border-primary/60 shadow-md' :
                  isSelected ? 'border-primary shadow-sm' :
                  'border-border-base hover:border-border-base/80'
                } ${isDragging ? 'opacity-40' : ''}`}
              >
                {/* Component header */}
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
                  onClick={() => {
                    setSelectedComponent(component.id)
                    toggleCollapse(component.id)
                  }}
                >
                  {/* Drag handle */}
                  <span
                    className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing text-xs shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ⠿
                  </span>

                  <span className="text-xl w-8 text-center leading-none">{TYPE_ICONS[component.type]}</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">
                    {t(TYPE_LABEL_KEYS[component.type])}
                  </span>

                  {/* Preview text for collapsed state */}
                  {isCollapsed && (
                    <span className="text-xs text-gray-400 truncate max-w-[180px]">
                      {getPreviewText(component)}
                    </span>
                  )}

                  <div className="flex items-center gap-0.5 ml-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setActiveHintId(activeHintId === component.id ? null : component.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        title={t('comp_what_is_this')}
                      >?</button>
                      {activeHintId === component.id && (
                        <div className="absolute right-0 top-6 z-30 w-56 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl leading-relaxed">
                          {t(COMPONENT_HINT_KEYS[component.type])}
                          <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setAiModalComponentId(component.id)}
                      className="p-1 text-gray-400 hover:text-indigo-500 text-xs"
                      title={t('comp_generate_ai')}
                    >✨</button>
                    <button
                      onClick={() => { duplicateComponent(currentScreen.id, component.id); toast(t('toast_component_duplicated')) }}
                      className="p-1 text-gray-400 hover:text-gray-600 text-xs"
                      title={t('comp_duplicate_title')}
                    >⧉</button>
                    <button
                      onClick={() => moveComponentUp(currentScreen.id, component.id)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs"
                    >↑</button>
                    <button
                      onClick={() => moveComponentDown(currentScreen.id, component.id)}
                      disabled={index === currentScreen.components.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs"
                    >↓</button>
                    <button
                      onClick={() => { removeComponent(currentScreen.id, component.id); toast(t('toast_component_removed')) }}
                      className="p-1 text-gray-400 hover:text-red-400 text-sm ml-1"
                    >×</button>
                    <span className="text-gray-400 text-xs ml-1">{isCollapsed ? '▸' : '▾'}</span>
                  </div>
                </div>

                {/* Editor body */}
                {!isCollapsed && (
                  <div
                    className="px-3 pb-3 border-t border-gray-100 dark:border-gray-800 pt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ComponentEditor
                      component={component}
                      onChange={(updates) => handleUpdate(component.id, updates)}
                    />
                    <ComponentLogicInline
                      component={component}
                      screenId={currentScreen.id}
                      screenEvents={currentScreen.events ?? []}
                      screens={app.screens.map((s) => ({ id: s.id, title: s.title }))}
                      onUpdateEvents={(events) => updateScreen(currentScreen.id, { events })}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-component AI modal */}
      {aiModalComponentId && currentScreen && (() => {
        const comp = currentScreen.components.find((c) => c.id === aiModalComponentId)
        if (!comp) return null
        return (
          <AIComponentModal
            componentId={comp.id}
            componentType={comp.type}
            screenId={currentScreen.id}
            onClose={() => setAiModalComponentId(null)}
          />
        )
      })()}
    </div>
  )
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="w-4 h-4 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">{n}</span>
      <span>{label}</span>
    </span>
  )
}

function Arrow() {
  return <span className="text-primary/40">→</span>
}

function getPreviewText(component: Component): string {
  switch (component.type) {
    case 'text': return component.content.replace(/<[^>]+>/g, '').slice(0, 60)
    case 'image': return component.src || component.alt || 'Image'
    case 'video': return component.src || 'Video'
    case 'button': return component.label
    case 'quiz-single':
    case 'quiz-multi': return component.question.slice(0, 60)
    case 'true-false': return component.statement.slice(0, 60)
    case 'flashcards': return `${component.cards.length} cards`
    case 'branching': return component.scenario.slice(0, 60)
    case 'matching': return `${component.pairs.length} pairs`
    case 'sequence': return `${component.items.length} items`
    case 'fill-blank': return component.text.slice(0, 60)
    case 'checklist': return `${component.items.length} items`
    default: return ''
  }
}

interface ComponentEditorProps {
  component: Component
  onChange: (updates: Partial<Component>) => void
}

function ComponentEditor({ component, onChange }: ComponentEditorProps) {
  switch (component.type) {
    case 'text': return <TextEditor component={component} onChange={onChange as never} />
    case 'image': return <ImageEditor component={component} onChange={onChange as never} />
    case 'video': return <VideoEditor component={component} onChange={onChange as never} />
    case 'button': return <ButtonEditor component={component} onChange={onChange as never} />
    case 'quiz-single': return <QuizSingleEditor component={component} onChange={onChange as never} />
    case 'quiz-multi': return <QuizMultiEditor component={component} onChange={onChange as never} />
    case 'true-false': return <TrueFalseEditor component={component} onChange={onChange as never} />
    case 'flashcards': return <FlashcardsEditor component={component} onChange={onChange as never} />
    case 'branching': return <BranchingEditor component={component} onChange={onChange as never} />
    case 'drag-drop': return <DragDropEditor component={component} onChange={onChange as never} />
    case 'hotspots': return <HotspotsEditor component={component} onChange={onChange as never} />
    case 'dialog-trainer': return <DialogTrainerEditor component={component} onChange={onChange as never} />
    case 'screen-simulation': return <ScreenSimulationEditor component={component} onChange={onChange as never} />
    case 'matching': return <MatchingEditor component={component} onChange={onChange as never} />
    case 'sequence': return <SequenceEditor component={component} onChange={onChange as never} />
    case 'fill-blank': return <FillBlankEditor component={component} onChange={onChange as never} />
    case 'checklist': return <ChecklistEditor component={component} onChange={onChange as never} />
    default:
      return <div className="text-xs text-gray-400 py-1">Editor coming soon</div>
  }
}
