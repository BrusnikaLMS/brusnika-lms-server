import { useT } from '../i18n'

interface Props {
  onClose: () => void
}

export function ShortcutsModal({ onClose }: Props) {
  const t = useT()

  const SHORTCUTS = [
    { key: 'Ctrl+Z', label: t('shortcut_undo') },
    { key: 'Ctrl+Y / Ctrl+Shift+Z', label: t('shortcut_redo') },
    { key: 'Ctrl+D', label: t('shortcut_duplicate') },
    { key: '?', label: t('shortcut_help') },
    { key: 'Esc', label: t('shortcut_close') },
  ]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('shortcuts_title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none">×</button>
        </div>
        <div className="p-4">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {SHORTCUTS.map(({ key, label }) => (
                <tr key={key}>
                  <td className="py-2 pr-4">
                    <kbd className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono font-medium">
                      {key}
                    </kbd>
                  </td>
                  <td className="py-2 text-gray-600 dark:text-gray-400 text-xs">{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
