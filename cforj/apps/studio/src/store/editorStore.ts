import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from './safeStorage'
import { immer } from 'zustand/middleware/immer'
import type { CourseApp, Screen, Component } from '@course-studio/player'
import { DEMO_COURSE } from '../data/demo-course'
import { useLocaleStore } from './localeStore'
import { translations } from '../i18n/translations'
import { embedApi } from '../api/client'

function getLocalizedName(key: 'screen_default_name' | 'module_default_name'): string {
  const locale = useLocaleStore.getState().locale
  const dict = translations[locale] ?? translations.en
  return (dict as Record<string, string>)[key] ?? translations.en[key]
}

const MAX_HISTORY = 50

export interface CourseModule {
  id: string
  title: string
  screenIds: string[]
  expanded: boolean
}

interface EditorState {
  app: CourseApp
  currentScreenId: string | null
  selectedComponentId: string | null
  past: CourseApp[]
  future: CourseApp[]
  modules: CourseModule[]
  editorStep: 1 | 2 | 3

  // App
  setApp: (app: CourseApp) => void
  updateAppTitle: (title: string) => void
  updateAppMeta: (updates: { description?: string; thumbnail?: string; language?: string }) => void

  // Screens
  setCurrentScreen: (id: string) => void
  addScreen: () => void
  removeScreen: (id: string) => void
  updateScreen: (id: string, updates: Partial<Omit<Screen, 'id'>>) => void
  reorderScreens: (fromIndex: number, toIndex: number) => void

  // Components
  setSelectedComponent: (id: string | null) => void
  addComponent: (screenId: string, component: Component) => void
  updateComponent: (screenId: string, componentId: string, updates: Partial<Component>) => void
  removeComponent: (screenId: string, componentId: string) => void
  moveComponentUp: (screenId: string, componentId: string) => void
  moveComponentDown: (screenId: string, componentId: string) => void
  duplicateComponent: (screenId: string, componentId: string) => void
  reorderComponents: (screenId: string, fromIndex: number, toIndex: number) => void

  // Modules
  addModule: () => void
  updateModuleTitle: (moduleId: string, title: string) => void
  removeModule: (moduleId: string) => void
  toggleModuleExpanded: (moduleId: string) => void
  addScreenToModule: (screenId: string, moduleId: string) => void
  reorderModuleScreens: (moduleId: string, fromIndex: number, toIndex: number) => void

  // Editor step
  setEditorStep: (step: 1 | 2 | 3) => void

  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

function snapshot(app: CourseApp): CourseApp {
  return JSON.parse(JSON.stringify(app))
}

function pushHistory(state: EditorState) {
  state.past = [...state.past, snapshot(state.app)].slice(-MAX_HISTORY)
  state.future = []
}

export const useEditorStore = create<EditorState>()(
  persist(
    immer((set, get) => ({
      app: DEMO_COURSE,
      currentScreenId: DEMO_COURSE.screens[0]?.id ?? null,
      selectedComponentId: null,
      past: [],
      future: [],
      modules: [],
      editorStep: 1,

      setApp: (app) => set((s) => {
        pushHistory(s)
        const isSameCourse = s.app.id === app.id
        s.app = app
        s.currentScreenId = app.screens[0]?.id ?? null
        s.selectedComponentId = null
        if (!isSameCourse) s.modules = []
        s.editorStep = 1
      }),

      updateAppTitle: (title) => set((s) => { s.app.title = title }),

      updateAppMeta: (updates) => set((s) => {
        if (updates.description !== undefined) s.app.description = updates.description
        if (updates.thumbnail !== undefined) s.app.thumbnail = updates.thumbnail
        if (updates.language !== undefined) s.app.language = updates.language
      }),

      setCurrentScreen: (id) => set((s) => {
        s.currentScreenId = id
        s.selectedComponentId = null
        s.future = []
      }),

      addScreen: () => set((s) => {
        pushHistory(s)
        const id = `s-${Date.now()}`
        const newScreen: Screen = {
          id,
          title: `${getLocalizedName('screen_default_name')} ${s.app.screens.length + 1}`,
          components: [],
          events: [],
          navigation: {},
        }
        s.app.screens.push(newScreen)
        s.currentScreenId = id
        // Add to the module that contains the current screen, if any
        if (s.modules.length > 0 && s.currentScreenId) {
          const parentModule = s.modules.find((m) => m.screenIds.includes(s.currentScreenId!))
          if (parentModule) parentModule.screenIds.push(id)
          else s.modules[s.modules.length - 1]!.screenIds.push(id)
        }
      }),

      removeScreen: (id) => set((s) => {
        const idx = s.app.screens.findIndex((sc) => sc.id === id)
        if (idx === -1 || s.app.screens.length === 1) return
        pushHistory(s)
        s.app.screens.splice(idx, 1)
        if (s.currentScreenId === id) {
          s.currentScreenId = s.app.screens[Math.max(0, idx - 1)]?.id ?? null
        }
        // Remove from modules
        for (const m of s.modules) {
          m.screenIds = m.screenIds.filter((sid) => sid !== id)
        }
      }),

      updateScreen: (id, updates) => set((s) => {
        const screen = s.app.screens.find((sc) => sc.id === id)
        if (screen) Object.assign(screen, updates)
      }),

      reorderScreens: (fromIndex, toIndex) => set((s) => {
        pushHistory(s)
        const [removed] = s.app.screens.splice(fromIndex, 1)
        if (removed) s.app.screens.splice(toIndex, 0, removed)
      }),

      setSelectedComponent: (id) => set((s) => { s.selectedComponentId = id }),

      addComponent: (screenId, component) => set((s) => {
        pushHistory(s)
        const screen = s.app.screens.find((sc) => sc.id === screenId)
        if (screen) {
          screen.components.push(component as never)
          s.selectedComponentId = component.id
        }
      }),

      updateComponent: (screenId, componentId, updates) => set((s) => {
        const screen = s.app.screens.find((sc) => sc.id === screenId)
        if (!screen) return
        const idx = screen.components.findIndex((c) => c.id === componentId)
        if (idx !== -1) Object.assign(screen.components[idx]!, updates)
      }),

      removeComponent: (screenId, componentId) => set((s) => {
        const screen = s.app.screens.find((sc) => sc.id === screenId)
        if (!screen) return
        pushHistory(s)
        screen.components = screen.components.filter((c) => c.id !== componentId) as never
        if (s.selectedComponentId === componentId) s.selectedComponentId = null
      }),

      moveComponentUp: (screenId, componentId) => set((s) => {
        const screen = s.app.screens.find((sc) => sc.id === screenId)
        if (!screen) return
        const idx = screen.components.findIndex((c) => c.id === componentId)
        if (idx <= 0) return
        pushHistory(s)
        const [item] = screen.components.splice(idx, 1)
        if (item) screen.components.splice(idx - 1, 0, item)
      }),

      moveComponentDown: (screenId, componentId) => set((s) => {
        const screen = s.app.screens.find((sc) => sc.id === screenId)
        if (!screen) return
        const idx = screen.components.findIndex((c) => c.id === componentId)
        if (idx === -1 || idx === screen.components.length - 1) return
        pushHistory(s)
        const [item] = screen.components.splice(idx, 1)
        if (item) screen.components.splice(idx + 1, 0, item)
      }),

      duplicateComponent: (screenId, componentId) => set((s) => {
        const screen = s.app.screens.find((sc) => sc.id === screenId)
        if (!screen) return
        const idx = screen.components.findIndex((c) => c.id === componentId)
        if (idx === -1) return
        pushHistory(s)
        const original = screen.components[idx]!
        const copy = { ...JSON.parse(JSON.stringify(original)), id: `c-${Date.now()}` }
        screen.components.splice(idx + 1, 0, copy as never)
        s.selectedComponentId = copy.id
      }),

      reorderComponents: (screenId, fromIndex, toIndex) => set((s) => {
        const screen = s.app.screens.find((sc) => sc.id === screenId)
        if (!screen) return
        pushHistory(s)
        const [item] = screen.components.splice(fromIndex, 1)
        if (item) screen.components.splice(toIndex, 0, item)
      }),

      // Modules
      addModule: () => set((s) => {
        const id = `mod-${Date.now()}`
        // Collect all screenIds not already in any module
        const assignedIds = new Set(s.modules.flatMap((m) => m.screenIds))
        const unassigned = s.app.screens.map((sc) => sc.id).filter((id) => !assignedIds.has(id))
        s.modules.push({ id, title: `${getLocalizedName('module_default_name')} ${s.modules.length + 1}`, screenIds: unassigned, expanded: true })
      }),

      updateModuleTitle: (moduleId, title) => set((s) => {
        const m = s.modules.find((m) => m.id === moduleId)
        if (m) m.title = title
      }),

      removeModule: (moduleId) => set((s) => {
        s.modules = s.modules.filter((m) => m.id !== moduleId)
      }),

      toggleModuleExpanded: (moduleId) => set((s) => {
        const m = s.modules.find((m) => m.id === moduleId)
        if (m) m.expanded = !m.expanded
      }),

      addScreenToModule: (screenId, moduleId) => set((s) => {
        // Remove from any existing module first
        for (const m of s.modules) {
          m.screenIds = m.screenIds.filter((id) => id !== screenId)
        }
        const target = s.modules.find((m) => m.id === moduleId)
        if (target) target.screenIds.push(screenId)
      }),

      reorderModuleScreens: (moduleId, fromIndex, toIndex) => set((s) => {
        const m = s.modules.find((m) => m.id === moduleId)
        if (!m) return
        const [item] = m.screenIds.splice(fromIndex, 1)
        if (item) m.screenIds.splice(toIndex, 0, item)
      }),

      setEditorStep: (step: 1 | 2 | 3) => set((s) => { s.editorStep = step }),

      undo: () => set((s) => {
        const prev = s.past[s.past.length - 1]
        if (!prev) return
        s.future = [snapshot(s.app), ...s.future].slice(0, MAX_HISTORY)
        s.app = prev
        s.past = s.past.slice(0, -1)
      }),

      redo: () => set((s) => {
        const next = s.future[0]
        if (!next) return
        s.past = [...s.past, snapshot(s.app)].slice(-MAX_HISTORY)
        s.app = next
        s.future = s.future.slice(1)
      }),

      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,
    })),
    {
      name: 'cs-current-editor',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        app: s.app,
        currentScreenId: s.currentScreenId,
        modules: s.modules,
      }),
    }
  )
)

function getCourseIdFromUrl(): string {
  const match = window.location.pathname.match(/\/editor\/([^/]+)/)
  return match ? match[1] : ''
}

export function getCourseSnapshot(): { courseId: string; content: unknown } {
  const app = useEditorStore.getState().app
  const courseId = getCourseIdFromUrl()
  return { courseId, content: app }
}

export async function saveNow(): Promise<void> {
  const snap = getCourseSnapshot()
  if (!snap.courseId) return
  try {
    await embedApi.update(snap.courseId, { content: snap.content })
    window.parent?.postMessage({ type: 'CS_COURSE_SAVED', courseId: snap.courseId }, '*')
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err)
    window.parent?.postMessage({ type: 'CS_SAVE_ERROR', courseId: snap.courseId, error }, '*')
  }
}
