import { useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useT } from '../i18n'
import { toast } from '../store/toastStore'
import type { Screen } from '@course-studio/player'

export function ScreensPanel() {
  const {
    app, currentScreenId, setCurrentScreen, addScreen, removeScreen, reorderScreens,
    modules, addModule, updateModuleTitle, removeModule, toggleModuleExpanded,
    reorderModuleScreens,
  } = useEditorStore()
  const t = useT()

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [emptyScreenWarning, setEmptyScreenWarning] = useState<{ screenNumber: number } | null>(null)

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragIndex = useRef<number>(-1)
  const dragContext = useRef<{ moduleId?: string }>({})

  function handleAddScreen() {
    const currentScreen = app.screens.find(s => s.id === currentScreenId)
    if (currentScreen && currentScreen.components.length === 0 && app.screens.length > 0) {
      const screenNumber = app.screens.indexOf(currentScreen) + 1
      setEmptyScreenWarning({ screenNumber })
      return
    }
    doAddScreen()
  }

  function doAddScreen() {
    setEmptyScreenWarning(null)
    addScreen()
    toast(t('toast_screen_added'))
  }

  function handleRemoveScreen(id: string) {
    removeScreen(id)
    toast(t('toast_screen_removed'))
  }

  const hasModules = modules.length > 0

  // Screens assigned to any module
  const assignedIds = new Set(modules.flatMap((m) => m.screenIds))
  const unassigned = app.screens.filter((s) => !assignedIds.has(s.id))

  function startEditModule(id: string, title: string) {
    setEditingModuleId(id)
    setEditingTitle(title)
  }

  function finishEditModule() {
    if (editingModuleId && editingTitle.trim()) {
      updateModuleTitle(editingModuleId, editingTitle.trim())
    }
    setEditingModuleId(null)
  }

  function handleFlatDragStart(e: React.DragEvent, id: string, index: number) {
    setDraggingId(id)
    dragIndex.current = index
    dragContext.current = {}
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleModuleDragStart(e: React.DragEvent, id: string, index: number, moduleId: string) {
    setDraggingId(id)
    dragIndex.current = index
    dragContext.current = { moduleId }
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(id)
  }

  function handleFlatDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault()
    if (dragIndex.current !== -1 && dragIndex.current !== toIndex) {
      reorderScreens(dragIndex.current, toIndex)
    }
    setDraggingId(null)
    setDragOverId(null)
    dragIndex.current = -1
  }

  function handleModuleDrop(e: React.DragEvent, toIndex: number, moduleId: string) {
    e.preventDefault()
    if (dragContext.current.moduleId === moduleId && dragIndex.current !== -1 && dragIndex.current !== toIndex) {
      reorderModuleScreens(moduleId, dragIndex.current, toIndex)
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

  function ScreenRow({
    screen, index, isNested = false, moduleId,
  }: {
    screen: Screen; index: number; isNested?: boolean; moduleId?: string
  }) {
    const isActive = screen.id === currentScreenId
    const isDragging = screen.id === draggingId
    const isDragOver = screen.id === dragOverId && screen.id !== draggingId

    return (
      <div
        draggable
        onDragStart={(e) => moduleId
          ? handleModuleDragStart(e, screen.id, index, moduleId)
          : handleFlatDragStart(e, screen.id, index)
        }
        onDragOver={(e) => handleDragOver(e, screen.id)}
        onDrop={(e) => moduleId
          ? handleModuleDrop(e, index, moduleId)
          : handleFlatDrop(e, index)
        }
        onDragEnd={handleDragEnd}
        onClick={() => setCurrentScreen(screen.id)}
        className={`group flex items-center gap-1.5 py-2 cursor-pointer select-none border-l-2 transition-all ${
          isNested ? 'pl-7 pr-3' : 'px-3'
        } ${
          isDragOver ? 'border-primary bg-primary/5' :
          isActive ? 'border-primary bg-primary/10' :
          'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
        } ${isDragging ? 'opacity-40' : ''}`}
      >
        <span className="text-gray-300 group-hover:text-gray-400 cursor-grab active:cursor-grabbing text-xs shrink-0 select-none">⠿</span>

        {!isNested && (
          <span className="text-xs text-gray-400 w-4 shrink-0 text-center">{index + 1}</span>
        )}

        <span className={`text-sm truncate flex-1 ${isActive ? 'text-primary font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
          {screen.title}
        </span>

        {screen.components.length > 0 && (
          <span className="text-xs text-gray-300 group-hover:opacity-0 shrink-0">
            {screen.components.length}
          </span>
        )}

        {app.screens.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleRemoveScreen(screen.id) }}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-base leading-none shrink-0"
            title={t('remove_screen_title')}
          >×</button>
        )}
      </div>
    )
  }

  return (
    <aside className="w-56 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-1 shrink-0">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('screens_label')}</span>
        <div className="flex items-center gap-1">
          {!hasModules && (
            <button
              onClick={addModule}
              className="text-xs text-gray-400 hover:text-primary hover:bg-primary/5 rounded px-1.5 py-0.5 transition-colors"
              title="Organize screens into modules"
            >
              + {t('add_module')}
            </button>
          )}
          <button
            onClick={handleAddScreen}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800 text-xl leading-none"
            title={t('add_screen_title')}
          >+</button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {hasModules ? (
          <>
            {modules.map((mod) => {
              const modScreens = mod.screenIds
                .map((sid) => app.screens.find((s) => s.id === sid))
                .filter((s): s is Screen => !!s)

              return (
                <div key={mod.id} className="mb-0.5">
                  {/* Module header */}
                  <div className="group flex items-center gap-1 px-2 py-1.5 select-none">
                    <button
                      onClick={() => toggleModuleExpanded(mod.id)}
                      className="text-gray-400 hover:text-gray-700 w-4 h-4 flex items-center justify-center text-[10px] shrink-0"
                    >
                      {mod.expanded ? '▾' : '▸'}
                    </button>

                    {editingModuleId === mod.id ? (
                      <input
                        autoFocus
                        className="flex-1 text-xs font-semibold text-gray-700 bg-transparent border-b border-primary outline-none"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={finishEditModule}
                        onKeyDown={(e) => { if (e.key === 'Enter') finishEditModule() }}
                      />
                    ) : (
                      <span
                        className="flex-1 text-xs font-semibold text-gray-600 truncate cursor-pointer hover:text-gray-900"
                        onDoubleClick={() => startEditModule(mod.id, mod.title)}
                        title="Double-click to rename"
                      >
                        {mod.title}
                      </span>
                    )}

                    <span className="text-xs text-gray-300 group-hover:hidden shrink-0">{modScreens.length}</span>
                    <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={handleAddScreen}
                        className="text-gray-300 hover:text-gray-700 text-base leading-none px-0.5"
                        title="Add screen"
                      >+</button>
                      <button
                        onClick={() => removeModule(mod.id)}
                        className="text-gray-300 hover:text-red-400 text-base leading-none px-0.5"
                        title="Remove module (screens stay)"
                      >×</button>
                    </div>
                  </div>

                  {/* Screens inside module */}
                  {mod.expanded && (
                    <div>
                      {modScreens.map((screen, index) => (
                        <ScreenRow
                          key={screen.id}
                          screen={screen}
                          index={index}
                          isNested
                          moduleId={mod.id}
                        />
                      ))}
                      {modScreens.length === 0 && (
                        <div className="pl-8 py-1.5 text-xs text-gray-300 italic">No screens</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Unassigned screens */}
            {unassigned.length > 0 && (
              <div className="mt-1">
                <div className="px-3 py-1 text-xs text-gray-400 font-medium">Unassigned</div>
                {unassigned.map((screen, index) => (
                  <ScreenRow key={screen.id} screen={screen} index={index} />
                ))}
              </div>
            )}

            {/* Add another module */}
            <button
              onClick={addModule}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 border-l-2 border-transparent mt-1 transition-colors"
            >
              <span className="w-4 text-center">+</span>
              {t('add_module')}
            </button>
          </>
        ) : (
          <>
            {app.screens.map((screen, index) => (
              <ScreenRow key={screen.id} screen={screen} index={index} />
            ))}

            <button
              onClick={handleAddScreen}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 border-l-2 border-transparent mt-1"
            >
              <span className="w-4 text-center">+</span>
              {t('add_screen')}
            </button>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {app.screens.length} {app.screens.length !== 1 ? t('screen_plural') : t('screen_singular')}
          {hasModules && ` · ${modules.length} module${modules.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Empty screen warning dialog */}
      {emptyScreenWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {t('empty_screen_warning_title')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('empty_screen_warning_body').replace('{n}', String(emptyScreenWarning.screenNumber))}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEmptyScreenWarning(null)}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('empty_screen_warning_cancel')}
              </button>
              <button
                onClick={doAddScreen}
                className="px-4 py-2 text-sm rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
              >
                {t('empty_screen_warning_continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
