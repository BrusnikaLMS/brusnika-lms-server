import { useEditorStore } from '../store/editorStore'
import { useT } from '../i18n'

export function PropertiesPanel() {
  const { app, currentScreenId, selectedComponentId, updateScreen, updateComponent } = useEditorStore()
  const t = useT()

  const currentScreen = app.screens.find((s) => s.id === currentScreenId)
  const selectedComponent = currentScreen?.components.find((c) => c.id === selectedComponentId)

  if (!currentScreen) {
    return (
      <aside className="w-64 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex items-center justify-center shrink-0">
        <span className="text-sm text-gray-400 dark:text-gray-500">{t('select_screen_prompt')}</span>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('panel_properties')}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Screen title */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block font-medium">{t('screen_title_label')}</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-primary outline-none"
            value={currentScreen.title}
            onChange={(e) => updateScreen(currentScreen.id, { title: e.target.value })}
          />
        </div>

        {/* Navigation */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">{t('navigation')}</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">{t('nav_next')}</span>
            <select
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:border-primary outline-none"
              value={currentScreen.navigation?.next ?? ''}
              onChange={(e) => updateScreen(currentScreen.id, {
                navigation: { ...currentScreen.navigation, next: e.target.value || undefined }
              })}
            >
              <option value="">{t('nav_auto')}</option>
              {app.screens.filter((s) => s.id !== currentScreen.id).map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Component visibility */}
        {selectedComponent && (
          <div className="border-t border-gray-100 pt-4">
            <label className="text-xs text-gray-500 mb-2 block font-medium">
              {t('selected_component')}
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selectedComponent.hidden}
                  onChange={(e) => updateComponent(currentScreen.id, selectedComponent.id, { hidden: e.target.checked })}
                  className="w-3.5 h-3.5 accent-primary"
                />
                <span className="text-xs text-gray-600">{t('hidden_initial')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selectedComponent.disabled}
                  onChange={(e) => updateComponent(currentScreen.id, selectedComponent.id, { disabled: e.target.checked })}
                  className="w-3.5 h-3.5 accent-primary"
                />
                <span className="text-xs text-gray-600">{t('disabled_initial')}</span>
              </label>
            </div>
          </div>
        )}

        {/* Hint */}
        {!selectedComponent && (
          <div className="text-xs text-gray-300 dark:text-gray-600 text-center py-4">
            {t('panel_click_hint')}
          </div>
        )}
      </div>
    </aside>
  )
}
