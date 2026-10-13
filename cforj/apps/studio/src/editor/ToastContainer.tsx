import { useToastStore } from '../store/toastStore'

const TYPE_STYLES = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-800 text-white',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-down ${TYPE_STYLES[t.type]}`}
        >
          {t.type === 'success' && <span>&#10003;</span>}
          {t.type === 'error' && <span>&#10007;</span>}
          {t.message}
          <button
            onClick={() => removeToast(t.id)}
            className="ml-1 opacity-70 hover:opacity-100 text-xs leading-none"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}
