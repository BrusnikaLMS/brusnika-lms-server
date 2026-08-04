import { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useT } from '../i18n'
import { toast } from '../store/toastStore'

export function ExportMenu() {
  const { app } = useEditorStore()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const [showScormGuide, setShowScormGuide] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function exportJson() {
    const blob = new Blob([JSON.stringify(app, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${app.title.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
    toast(t('toast_export_json'))
  }

  async function exportScorm(version: '1.2' | '2004' = '1.2') {
    const { exportScorm: doExport } = await import('@course-studio/scorm-export')
    const blob = await doExport(app, { scormVersion: version })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${app.title.replace(/\s+/g, '-').toLowerCase()}-scorm${version === '2004' ? '-2004' : ''}.zip`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
    setShowScormGuide(true)
    toast(t('toast_export_scorm'))
  }

  async function exportHtml() {
    const { exportHtml: doExport } = await import('@course-studio/scorm-export')
    const blob = await doExport(app)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${app.title.replace(/\s+/g, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
    toast(t('toast_export_html'))
  }

  async function exportXApi() {
    const JSZip = (await import('jszip')).default
    const { generateTinCanXml, generateXApiIndexHtml } = await import('@course-studio/scorm-export')
    const zip = new JSZip()
    zip.file('tincan.xml', generateTinCanXml(app))
    zip.file('index.html', generateXApiIndexHtml(app))
    zip.file('course.json', JSON.stringify(app, null, 2))
    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${app.title.replace(/\s+/g, '-').toLowerCase()}-xapi.zip`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
    toast(t('toast_export_xapi'))
  }

  async function exportXlsx() {
    alert('Excel export will be available in a future update')
    setOpen(false)
  }

  // Embed URL: in production this would be the hosted player URL.
  // For now generate a data-uri embed snippet pointing to the local dev server.
  const embedUrl = `${window.location.origin}/embed/${app.id}`
  const embedCode = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  allow="autoplay; fullscreen"\n  allowfullscreen\n></iframe>`

  function copyEmbed() {
    navigator.clipboard.writeText(embedCode)
    setEmbedCopied(true)
    toast(t('toast_copied'))
    setTimeout(() => setEmbedCopied(false), 2000)
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
        >
          {t('export')}
          <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full right-0 mt-1 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
            <button
              onClick={exportJson}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
            >
              <span className="text-base">{ }</span>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('export_json')}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{t('export_json_desc')}</div>
              </div>
            </button>

            <button
              onClick={() => exportScorm('1.2')}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left border-t border-gray-100 dark:border-gray-800"
            >
              <span className="text-base">📦</span>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('export_scorm12')}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{t('export_scorm_desc')}</div>
              </div>
            </button>

            <button
              onClick={() => exportScorm('2004')}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left border-t border-gray-100 dark:border-gray-800"
            >
              <span className="text-base">📦</span>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Export SCORM 2004</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{t('export_scorm_desc')}</div>
              </div>
            </button>

            <button
              onClick={exportXApi}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left border-t border-gray-100 dark:border-gray-800"
            >
              <span className="text-base">🎯</span>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Export xAPI (Tin Can)</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">.zip for LRS / xAPI LMS</div>
              </div>
            </button>

            <button
              onClick={exportHtml}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left border-t border-gray-100 dark:border-gray-800"
            >
              <span className="text-base">🌐</span>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Export HTML</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">standalone .html file</div>
              </div>
            </button>

            <button
              onClick={exportXlsx}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left border-t border-gray-100 dark:border-gray-800"
            >
              <span className="text-base">📊</span>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('export_xlsx')}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{t('export_xlsx_desc')}</div>
              </div>
            </button>

            <button
              onClick={() => { setShowEmbed(true); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left border-t border-gray-100 dark:border-gray-800"
            >
              <span className="text-base">🔗</span>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('embed_website')}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{t('embed_desc')}</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Embed modal */}
      {showEmbed && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-gray-200">{t('embed_title')}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('embed_subtitle')}</p>
              </div>
              <button
                onClick={() => setShowEmbed(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
              >×</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <pre className="text-green-400 text-xs font-mono whitespace-pre overflow-x-auto">
                  {embedCode}
                </pre>
                <button
                  onClick={copyEmbed}
                  className={`absolute top-2 right-2 px-2 py-1 text-xs rounded font-medium transition-colors ${
                    embedCopied
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {embedCopied ? t('copied') : t('copy')}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: '📋', label: t('embed_step1') },
                  { icon: '📄', label: t('embed_step2') },
                  { icon: '✅', label: t('embed_step3') },
                ].map((step, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl mb-1">{step.icon}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{i + 1}. {step.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  {t('embed_works_with')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCORM Import Guide */}
      {showScormGuide && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-gray-200">{t('scorm_guide_title')}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('scorm_guide_subtitle')}</p>
              </div>
              <button
                onClick={() => setShowScormGuide(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
              >×</button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Moodle */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span className="text-lg">📚</span> Moodle
                </h3>
                <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                  <li>{t('scorm_moodle_1')}</li>
                  <li>{t('scorm_moodle_2')}</li>
                  <li>{t('scorm_moodle_3')}</li>
                  <li>{t('scorm_moodle_4')}</li>
                </ol>
              </div>

              {/* Canvas */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span className="text-lg">🎨</span> Canvas LMS
                </h3>
                <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                  <li>{t('scorm_canvas_1')}</li>
                  <li>{t('scorm_canvas_2')}</li>
                  <li>{t('scorm_canvas_3')}</li>
                  <li>{t('scorm_canvas_4')}</li>
                </ol>
              </div>

              {/* Blackboard */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span className="text-lg">⬛</span> Blackboard
                </h3>
                <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                  <li>{t('scorm_bb_1')}</li>
                  <li>{t('scorm_bb_2')}</li>
                  <li>{t('scorm_bb_3')}</li>
                  <li>{t('scorm_bb_4')}</li>
                </ol>
              </div>

              {/* Generic */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">{t('scorm_generic_title')}</p>
                <p className="text-xs text-blue-600 dark:text-blue-500">{t('scorm_generic_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
