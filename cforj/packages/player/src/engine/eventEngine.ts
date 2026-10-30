import type {
  Action,
  EventCondition,
  EventTrigger,
  PlayerProgress,
  Screen,
  StateMap,
} from '../types/course'

export interface EngineCallbacks {
  onGoToScreen: (screenId: string) => void
  onSetState: (key: string, value: StateMap[string]) => void
  onEnableComponent: (componentId: string) => void
  onDisableComponent: (componentId: string) => void
  onShowComponent: (componentId: string) => void
  onHideComponent: (componentId: string) => void
  onShowMessage: (message: string, variant?: 'info' | 'success' | 'error') => void
}

export function fireEvent(
  trigger: EventTrigger,
  componentId: string | undefined,
  screen: Screen,
  progress: PlayerProgress,
  callbacks: EngineCallbacks
) {
  const matchingEvents = (screen.events ?? []).filter((e) => {
    if (e.on !== trigger) return false
    if (e.componentId && e.componentId !== componentId) return false
    if (e.condition && !evaluateCondition(e.condition, progress.state)) return false
    return true
  })

  for (const event of matchingEvents) {
    for (const action of event.actions) {
      executeAction(action, progress, callbacks)
    }
  }
}

function evaluateCondition(condition: EventCondition, state: StateMap): boolean {
  const val = state[condition.state]
  const target = condition.value
  switch (condition.operator) {
    case 'eq':  return val === target
    case 'neq': return val !== target
    case 'gt':  return Number(val) > Number(target)
    case 'lt':  return Number(val) < Number(target)
    case 'gte': return Number(val) >= Number(target)
    case 'lte': return Number(val) <= Number(target)
    default:    return false
  }
}

function executeAction(
  action: Action,
  progress: PlayerProgress,
  cb: EngineCallbacks
) {
  switch (action.type) {
    case 'GO_TO_SCREEN':
      cb.onGoToScreen(action.screenId)
      break
    case 'SET_STATE': {
      const current = progress.state[action.key] ?? 0
      const value =
        action.value === '+1' ? Number(current) + 1
        : action.value === '-1' ? Number(current) - 1
        : action.value
      cb.onSetState(action.key, value)
      break
    }
    case 'ENABLE_COMPONENT':
      cb.onEnableComponent(action.componentId)
      break
    case 'DISABLE_COMPONENT':
      cb.onDisableComponent(action.componentId)
      break
    case 'SHOW_COMPONENT':
      cb.onShowComponent(action.componentId)
      break
    case 'HIDE_COMPONENT':
      cb.onHideComponent(action.componentId)
      break
    case 'SHOW_MESSAGE':
      cb.onShowMessage(action.message, action.variant)
      break
  }
}
