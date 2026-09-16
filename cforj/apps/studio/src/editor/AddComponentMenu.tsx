import { useState, useRef, useEffect } from 'react'
import type { Component } from '@course-studio/player'
import { useT } from '../i18n'

type ComponentDef = { type: Component['type']; icon: string; labelKey: string; descKey: string; group?: string }

const COMPONENT_TYPE_DEFS: ComponentDef[] = [
  { type: 'text', icon: 'T', labelKey: 'comp_text_label', descKey: 'comp_text_desc', group: 'Content' },
  { type: 'image', icon: '🖼', labelKey: 'comp_image_label', descKey: 'comp_image_desc', group: 'Content' },
  { type: 'video', icon: '▶', labelKey: 'comp_video_label', descKey: 'comp_video_desc', group: 'Content' },
  { type: 'button', icon: '⬛', labelKey: 'comp_button_label', descKey: 'comp_button_desc', group: 'Content' },
  { type: 'quiz-single', icon: '◉', labelKey: 'comp_quiz_single_label', descKey: 'comp_quiz_single_desc', group: 'Quiz' },
  { type: 'quiz-multi', icon: '☑', labelKey: 'comp_quiz_multi_label', descKey: 'comp_quiz_multi_desc', group: 'Quiz' },
  { type: 'true-false', icon: '✓✗', labelKey: 'comp_true_false_label', descKey: 'comp_true_false_desc', group: 'Quiz' },
  { type: 'matching', icon: '⇄', labelKey: 'comp_matching_label', descKey: 'comp_matching_desc', group: 'Quiz' },
  { type: 'sequence', icon: '↕', labelKey: 'comp_sequence_label', descKey: 'comp_sequence_desc', group: 'Quiz' },
  { type: 'fill-blank', icon: '___', labelKey: 'comp_fill_blank_label', descKey: 'comp_fill_blank_desc', group: 'Quiz' },
  { type: 'checklist', icon: '☐', labelKey: 'comp_checklist_label', descKey: 'comp_checklist_desc', group: 'Interactive' },
  { type: 'flashcards', icon: '🃏', labelKey: 'comp_flashcards_label', descKey: 'comp_flashcards_desc', group: 'Interactive' },
  { type: 'branching', icon: '⑂', labelKey: 'comp_branching_label', descKey: 'comp_branching_desc', group: 'Interactive' },
  { type: 'drag-drop', icon: '↔', labelKey: 'comp_drag_drop_label', descKey: 'comp_drag_drop_desc', group: 'Interactive' },
  { type: 'hotspots', icon: '📍', labelKey: 'comp_hotspots_label', descKey: 'comp_hotspots_desc', group: 'Interactive' },
  { type: 'dialog-trainer', icon: '💬', labelKey: 'comp_dialog_trainer_label', descKey: 'comp_dialog_trainer_desc', group: 'Simulation' },
  { type: 'screen-simulation', icon: '🖥', labelKey: 'comp_screen_sim_label', descKey: 'comp_screen_sim_desc', group: 'Simulation' },
]

function makeDefaultComponent(type: Component['type'], t: (k: string) => string): Component {
  const id = `c-${Date.now()}`
  switch (type) {
    case 'text':
      return { id, type, content: '' }
    case 'image':
      return { id, type, src: '', alt: '' }
    case 'video':
      return { id, type, src: '' }
    case 'button':
      return { id, type, label: '', variant: 'primary' }
    case 'quiz-single':
      return { id, type, question: '', options: ['', ''], correct: 0 }
    case 'quiz-multi':
      return { id, type, question: '', options: ['', '', ''], correct: [0] }
    case 'true-false':
      return { id, type, statement: '', correct: true }
    case 'flashcards':
      return { id, type, cards: [{ front: '', back: '' }] }
    case 'branching':
      return {
        id, type, scenario: '',
        choices: [
          { id: `ch-${Date.now()}-1`, label: '', consequence: '' },
          { id: `ch-${Date.now()}-2`, label: '', consequence: '' },
        ],
      }
    case 'drag-drop':
      return {
        id, type, instruction: '',
        items: [{ id: 'i1', label: '' }],
        targets: [{ id: 't1', label: '', acceptsItem: 'i1' }],
      }
    case 'hotspots':
      return { id, type, image: '', hotspots: [] }
    case 'dialog-trainer': {
      const charId = `char-${Date.now()}`
      const msg1Id = `msg-${Date.now()}`
      const msg2Id = `msg-${Date.now() + 1}`
      return {
        id, type,
        title: '',
        characters: [
          { id: charId, name: t('dlg_default_trainer'), color: '#6366f1' },
          { id: 'player', name: t('dlg_default_you'), color: '#10b981' },
        ],
        messages: [
          { id: msg1Id, characterId: charId, text: '' },
          { id: msg2Id, characterId: 'player', text: '' },
        ],
        flow: {
          [msg1Id]: {
            messageId: msg1Id,
            choices: [
              { id: `ch-${Date.now()}`, text: '', nextMessageId: null },
            ],
          },
        },
        startMessageId: msg1Id,
      }
    }
    case 'screen-simulation':
      return {
        id, type,
        title: '',
        steps: [
          {
            id: `step-${Date.now()}`,
            image: '',
            instruction: '',
          },
        ],
      }
    case 'matching':
      return {
        id, type, instruction: '',
        pairs: [
          { id: `p-${Date.now()}-1`, left: '', right: '' },
          { id: `p-${Date.now()}-2`, left: '', right: '' },
        ],
      }
    case 'sequence':
      return {
        id, type, instruction: '',
        items: [
          { id: `seq-${Date.now()}-1`, label: '' },
          { id: `seq-${Date.now()}-2`, label: '' },
          { id: `seq-${Date.now()}-3`, label: '' },
        ],
      }
    case 'fill-blank':
      return {
        id, type,
        text: 'The capital of France is {{blank}}.',
        blanks: [{ id: `b-${Date.now()}`, answer: 'Paris' }],
      }
    case 'checklist':
      return {
        id, type, title: '',
        items: [
          { id: `cl-${Date.now()}-1`, label: '' },
          { id: `cl-${Date.now()}-2`, label: '' },
        ],
      }
  }
}

interface Props {
  onAdd: (component: Component) => void
}

export function AddComponentMenu({ onAdd }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleAdd(type: Component['type']) {
    onAdd(makeDefaultComponent(type, t))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-primary-dark font-medium"
      >
        <span className="text-base leading-none">+</span> {t('add_component').replace(/^\+ /, '')}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-surface-base border border-border-base rounded-lg shadow-lg z-20 overflow-hidden max-h-[70vh] overflow-y-auto">
          {(['Content', 'Quiz', 'Interactive', 'Simulation'] as const).map((group) => {
            const items = COMPONENT_TYPE_DEFS.filter((d) => d.group === group)
            if (!items.length) return null
            return (
              <div key={group}>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-txt-muted uppercase tracking-wide bg-surface-subtle border-b border-border-subtle">
                  {group}
                </div>
                {items.map((item) => {
                  const label = t(item.labelKey) || item.labelKey.replace('comp_', '').replace('_label', '').replace(/_/g, ' ')
                  const desc = t(item.descKey) || ''
                  return (
                    <button
                      key={item.type}
                      onClick={() => handleAdd(item.type)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-hover text-left"
                    >
                      <span className="w-7 h-7 flex items-center justify-center bg-surface-hover rounded text-sm font-mono shrink-0">
                        {item.icon}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-txt-base capitalize">{label}</div>
                        {desc && <div className="text-xs text-txt-faint">{desc}</div>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
