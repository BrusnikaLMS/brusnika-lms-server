import { useState } from 'react'
import type { Component, EventTrigger, ScreenEvent, Action } from '@course-studio/player'
import { useT } from '../i18n'

interface Props {
  component: Component
  screenId: string
  screenEvents: ScreenEvent[]
  screens: Array<{ id: string; title: string }>
  onUpdateEvents: (events: ScreenEvent[]) => void
}

type SimpleAction = 'GO_TO_SCREEN' | 'SHOW_MESSAGE' | 'SET_STATE' | 'none'

function buildAction(type: SimpleAction, target: string, value?: string): Action | null {
  switch (type) {
    case 'GO_TO_SCREEN': return { type, screenId: target }
    case 'SHOW_MESSAGE': return { type, message: target }
    case 'SET_STATE': return { type, key: target, value: value ?? '+1' }
    default: return null
  }
}

function getActionSummary(action: Action | undefined, screens: Props['screens']): string {
  if (!action) return '—'
  switch (action.type) {
    case 'GO_TO_SCREEN': return `→ ${screens.find((s) => s.id === action.screenId)?.title ?? action.screenId}`
    case 'SHOW_MESSAGE': return `💬 "${action.message}"`
    case 'SET_STATE': return `var ${action.key} = ${action.value}`
    default: return action.type
  }
}

export function ComponentLogicInline({ component, screenEvents, screens, onUpdateEvents }: Props) {
  const t = useT()

  const TRIGGERS_BY_TYPE: Partial<Record<Component['type'], Array<{ trigger: EventTrigger; label: string }>>> = {
    'quiz-single': [
      { trigger: 'QUIZ_CORRECT', label: t('logic_correct') },
      { trigger: 'QUIZ_INCORRECT', label: t('logic_wrong') },
    ],
    'quiz-multi': [
      { trigger: 'QUIZ_CORRECT', label: t('logic_correct') },
      { trigger: 'QUIZ_INCORRECT', label: t('logic_wrong') },
    ],
    'true-false': [
      { trigger: 'QUIZ_CORRECT', label: t('logic_correct') },
      { trigger: 'QUIZ_INCORRECT', label: t('logic_wrong') },
    ],
    'drag-drop': [
      { trigger: 'QUIZ_CORRECT', label: t('logic_correct') },
      { trigger: 'QUIZ_INCORRECT', label: t('logic_wrong') },
    ],
    button: [{ trigger: 'BUTTON_CLICK', label: t('logic_on_click') }],
    video: [{ trigger: 'VIDEO_END', label: t('logic_on_video_end') }],
    branching: [{ trigger: 'CHOICE_SELECTED', label: t('logic_on_choice') }],
  }

  const ACTION_LABELS: Record<SimpleAction, string> = {
    none: t('logic_continue'),
    GO_TO_SCREEN: t('logic_go_to_screen'),
    SHOW_MESSAGE: t('logic_show_message'),
    SET_STATE: t('logic_set_variable'),
  }

  const triggers = TRIGGERS_BY_TYPE[component.type] ?? []
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<{
    trigger: EventTrigger
    actionType: SimpleAction
    target: string
    value: string
  } | null>(null)

  function getEvent(trigger: EventTrigger): ScreenEvent | undefined {
    return screenEvents.find((e) => e.on === trigger && e.componentId === component.id)
  }

  function saveEvent(trigger: EventTrigger, actionType: SimpleAction, target: string, value: string) {
    const filtered = screenEvents.filter((e) => !(e.on === trigger && e.componentId === component.id))
    if (actionType === 'none') {
      onUpdateEvents(filtered)
    } else {
      const action = buildAction(actionType, target, value)
      if (!action) return
      onUpdateEvents([...filtered, { on: trigger, componentId: component.id, actions: [action] }])
    }
    setEditing(null)
  }

  function removeEvent(trigger: EventTrigger) {
    onUpdateEvents(screenEvents.filter((e) => !(e.on === trigger && e.componentId === component.id)))
  }

  return (
    <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary w-full text-left"
      >
        <span className="text-[10px]">{open ? '▾' : '▸'}</span>
        <span className="font-medium">{t('logic_title')}</span>
        {triggers.some((tr) => getEvent(tr.trigger)) && (
          <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
            {triggers.filter((tr) => getEvent(tr.trigger)).length} {triggers.filter((tr) => getEvent(tr.trigger)).length !== 1 ? t('logic_rules') : t('logic_rule')}
          </span>
        )}
      </button>

      {open && triggers.length === 0 && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 italic">
          {t('logic_no_events')}
        </p>
      )}

      {open && triggers.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {triggers.map(({ trigger, label }) => {
            const existing = getEvent(trigger)
            const isEditing = editing?.trigger === trigger

            return (
              <div key={trigger} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-20 shrink-0">{label}</span>

                  {!isEditing ? (
                    <>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-1 truncate">
                        {existing
                          ? getActionSummary(existing.actions[0], screens)
                          : t('logic_continue')
                        }
                      </span>
                      <button
                        onClick={() => setEditing({
                          trigger,
                          actionType: (existing?.actions[0]?.type as SimpleAction) ?? 'none',
                          target: getTarget(existing?.actions[0]) ?? '',
                          value: getValue(existing?.actions[0]) ?? '+1',
                        })}
                        className="text-[10px] text-gray-400 hover:text-primary shrink-0"
                      >{t('logic_edit')}</button>
                      {existing && (
                        <button
                          onClick={() => removeEvent(trigger)}
                          className="text-[10px] text-gray-300 hover:text-red-400 shrink-0"
                        >✕</button>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 space-y-1.5">
                      <select
                        className="w-full border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:border-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        value={editing.actionType}
                        onChange={(e) => setEditing({ ...editing, actionType: e.target.value as SimpleAction, target: '' })}
                      >
                        {(Object.entries(ACTION_LABELS) as [SimpleAction, string][]).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>

                      {editing.actionType === 'GO_TO_SCREEN' && (
                        <select
                          className="w-full border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:border-primary outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          value={editing.target}
                          onChange={(e) => setEditing({ ...editing, target: e.target.value })}
                        >
                          <option value="">{t('logic_select_screen')}</option>
                          {screens.map((s) => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                      )}

                      {editing.actionType === 'SHOW_MESSAGE' && (
                        <input
                          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                          placeholder={t('logic_message_placeholder')}
                          value={editing.target}
                          onChange={(e) => setEditing({ ...editing, target: e.target.value })}
                        />
                      )}

                      {editing.actionType === 'SET_STATE' && (
                        <div className="flex gap-1">
                          <input
                            className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                            placeholder={t('logic_var_name')}
                            value={editing.target}
                            onChange={(e) => setEditing({ ...editing, target: e.target.value })}
                          />
                          <input
                            className="w-16 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                            placeholder="+1"
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="flex gap-1">
                        <button
                          onClick={() => saveEvent(trigger, editing.actionType, editing.target, editing.value)}
                          disabled={editing.actionType !== 'none' && !editing.target}
                          className="flex-1 bg-primary text-white rounded py-1 text-xs font-medium hover:bg-primary-dark disabled:opacity-40"
                        >{t('logic_save')}</button>
                        <button
                          onClick={() => setEditing(null)}
                          className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded"
                        >{t('logic_cancel')}</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getTarget(action: Action | undefined): string | null {
  if (!action) return null
  if ('screenId' in action) return action.screenId
  if ('message' in action) return action.message
  if ('key' in action) return action.key
  return null
}

function getValue(action: Action | undefined): string | null {
  if (!action) return null
  if ('value' in action) return String(action.value)
  return null
}
