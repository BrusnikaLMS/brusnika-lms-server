/**
 * PostMessage API for communication with parent LMS (Brusnika).
 *
 * Messages sent TO parent:
 *   cforj:ready      — player loaded and course rendered
 *   cforj:progress   — learner progress update (screen change, quiz answer)
 *   cforj:complete   — course completed
 *   cforj:resize     — content height changed (for auto-resize iframe)
 */

export interface ProgressPayload {
  courseId: string
  currentScreenId: string
  visitedScreens: string[]
  completedScreens: string[]
  score: number
  maxScore: number
  completed: boolean
  timeSpent: number // seconds
}

function send(type: string, data: Record<string, unknown>) {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type, ...data }, '*')
  }
}

export function notifyReady(courseId: string) {
  send('cforj:ready', { courseId })
}

export function notifyProgress(payload: ProgressPayload) {
  send('cforj:progress', payload)
}

export function notifyComplete(payload: ProgressPayload) {
  send('cforj:complete', {
    courseId: payload.courseId,
    score: payload.score,
    maxScore: payload.maxScore,
    completedAt: new Date().toISOString(),
  })
}

export function notifyResize(height: number) {
  send('cforj:resize', { height })
}

/**
 * Listen for commands FROM parent LMS:
 *   cforj:goToScreen  — navigate to specific screen
 *   cforj:getProgress — request current progress (reply via cforj:progress)
 */
export function listenForCommands(handlers: {
  onGoToScreen?: (screenId: string) => void
  onGetProgress?: () => void
}) {
  window.addEventListener('message', (e) => {
    const { type, screenId } = e.data || {}
    if (type === 'cforj:goToScreen' && screenId && handlers.onGoToScreen) {
      handlers.onGoToScreen(screenId)
    }
    if (type === 'cforj:getProgress' && handlers.onGetProgress) {
      handlers.onGetProgress()
    }
  })
}
