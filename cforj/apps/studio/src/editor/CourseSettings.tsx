import { useEditorStore } from '../store/editorStore'
import { useT } from '../i18n'

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'zh', label: '中文' },
  { value: 'pt', label: 'Português' },
  { value: 'it', label: 'Italiano' },
  { value: 'ar', label: 'العربية' },
  { value: 'ja', label: '日本語' },
]

export function CourseSettings() {
  const { app, updateAppTitle, updateAppMeta } = useEditorStore()
  const t = useT()

  function patchSettings(patch: Partial<typeof app.settings>) {
    useEditorStore.getState().setApp({
      ...app,
      settings: { ...app.settings, ...patch },
    })
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('cs_title')}</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('cs_subtitle')}</p>
        </div>

        {/* General */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 pb-1 border-b border-gray-100 dark:border-gray-800">{t('cs_general')}</h3>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{t('cs_title_label')}</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
              value={app.title}
              onChange={(e) => updateAppTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{t('cs_desc_label')}</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none resize-none"
              placeholder={t('cs_desc_placeholder')}
              value={app.description ?? ''}
              onChange={(e) => updateAppMeta({ description: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{t('cs_thumbnail')}</label>
            <input
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
              placeholder="https://..."
              value={app.thumbnail ?? ''}
              onChange={(e) => updateAppMeta({ thumbnail: e.target.value })}
            />
            {app.thumbnail && (
              <img src={app.thumbnail} alt="" className="mt-2 w-full h-36 object-cover rounded-lg" />
            )}
          </div>
        </section>

        {/* Language */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 pb-1 border-b border-gray-100 dark:border-gray-800">{t('cs_lang_section')}</h3>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">{t('cs_course_lang')}</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
              value={app.language ?? 'en'}
              onChange={(e) => updateAppMeta({ language: e.target.value })}
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('cs_lang_hint')}</p>
          </div>
        </section>

        {/* Navigation */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 pb-1 border-b border-gray-100 dark:border-gray-800">{t('cs_navigation')}</h3>
          <div className="space-y-2.5">
            {([
              { value: 'linear', labelKey: 'cs_nav_linear', descKey: 'cs_nav_linear_desc' },
              { value: 'free', labelKey: 'cs_nav_free', descKey: 'cs_nav_free_desc' },
              { value: 'locked', labelKey: 'cs_nav_locked', descKey: 'cs_nav_locked_desc' },
            ] as const).map((opt) => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="navigation"
                  value={opt.value}
                  checked={app.settings.allowNavigation === opt.value}
                  onChange={() => patchSettings({ allowNavigation: opt.value })}
                  className="mt-0.5 accent-primary shrink-0"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{t(opt.labelKey)}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{t(opt.descKey)}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Completion */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 pb-1 border-b border-gray-100 dark:border-gray-800">{t('cs_completion')}</h3>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={app.settings.showResults}
              onChange={(e) => patchSettings({ showResults: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-primary shrink-0"
            />
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{t('cs_show_results')}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{t('cs_show_results_desc')}</div>
            </div>
          </label>
        </section>

        {/* Course ID */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 pb-1 border-b border-gray-100 dark:border-gray-800 mb-3">{t('cs_course_id')}</h3>
          <div className="flex items-center gap-2">
            <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 flex-1 font-mono truncate">
              {app.id}
            </code>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{t('cs_course_id_hint')}</p>
        </section>
      </div>
    </div>
  )
}
