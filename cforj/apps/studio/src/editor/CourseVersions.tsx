import { useState, useEffect, useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'
import { useT } from '../i18n'
import { toast } from '../store/toastStore'
import { versionsApi } from '../api/client'
import type { VersionOut, VersionWithContent } from '../api/client'
import type { CourseApp } from '@course-studio/player'

const PRO_PLANS = new Set(['pro', 'enterprise', 'admin'])

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: days > 365 ? 'numeric' : undefined })
}

export function CourseVersions() {
  const { app, setApp } = useEditorStore()
  const { user } = useAuthStore()
  const t = useT()

  const [versions, setVersions] = useState<VersionOut[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [labelInput, setLabelInput] = useState('')
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewVersion, setPreviewVersion] = useState<VersionWithContent | null>(null)
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null)
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null)

  const isPro = user ? PRO_PLANS.has(user.plan) : false
  const isCloud = !!user

  const loadVersions = useCallback(async () => {
    if (!isPro || !isCloud) return
    setLoading(true)
    setError('')
    try {
      const data = await versionsApi.list(app.id)
      setVersions(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load versions')
    } finally {
      setLoading(false)
    }
  }, [app.id, isPro, isCloud])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  async function handleSave() {
    if (!isPro) return
    setSaving(true)
    setError('')
    try {
      const newVersion = await versionsApi.save(app.id, labelInput.trim() || undefined)
      setVersions((prev) => [newVersion, ...prev])
      setLabelInput('')
      setShowLabelInput(false)
      showSuccess('Version saved!')
      toast(t('toast_version_saved'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save version')
    } finally {
      setSaving(false)
    }
  }

  async function handleRestore(version: VersionOut) {
    setRestoringId(version.id)
    setConfirmRestoreId(null)
    setError('')
    try {
      await versionsApi.restore(app.id, version.id)
      // Fetch the version content and apply to editor
      const full = await versionsApi.get(app.id, version.id)
      setApp(full.content as unknown as CourseApp)
      showSuccess(`Restored to v${version.version_number}${version.label ? ` "${version.label}"` : ''}`)
      toast(t('toast_version_restored'))
      // Reload list — a safety snapshot was auto-created
      await loadVersions()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to restore version')
    } finally {
      setRestoringId(null)
    }
  }

  async function handleDelete(versionId: string) {
    setDeletingId(versionId)
    setError('')
    try {
      await versionsApi.delete(app.id, versionId)
      setVersions((prev) => prev.filter((v) => v.id !== versionId))
      if (previewVersion?.id === versionId) setPreviewVersion(null)
      toast(t('toast_version_deleted'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete version')
    } finally {
      setDeletingId(null)
    }
  }

  async function handlePreview(version: VersionOut) {
    if (previewVersion?.id === version.id) {
      setPreviewVersion(null)
      return
    }
    setLoadingPreviewId(version.id)
    try {
      const full = await versionsApi.get(app.id, version.id)
      setPreviewVersion(full)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load preview')
    } finally {
      setLoadingPreviewId(null)
    }
  }

  function showSuccess(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  // ── Upsell for non-pro ──────────────────────────────────────────────────────
  if (!isCloud) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('ver_signin_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('ver_signin_desc')}</p>
          <a href="/login" className="inline-block px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  if (!isPro) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('ver_upsell_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('ver_upsell_desc')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{t('ver_upsell_limits')}</p>
          <a
            href="https://cforj.studio/#pricing"
            target="_blank"
            rel="noreferrer"
            className="inline-block px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    )
  }

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Left panel — version list */}
      <div className="w-72 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('ver_title')}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-medium">
              {versions.length} {t('ver_saved_count')}
            </span>
          </div>

          {/* Save button */}
          {showLabelInput ? (
            <div className="space-y-1.5">
              <input
                autoFocus
                type="text"
                placeholder={t('ver_label_placeholder')}
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowLabelInput(false) }}
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-primary"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-1.5 text-xs bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? t('ver_saving') : t('ver_save')}
                </button>
                <button
                  onClick={() => { setShowLabelInput(false); setLabelInput('') }}
                  className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  {t('ver_cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLabelInput(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              {t('ver_save_btn')}
            </button>
          )}
        </div>

        {/* Feedback */}
        {error && (
          <div className="mx-3 mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-3 mt-2 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-2.5 py-1.5">
            {success}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('ver_no_versions')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('ver_no_versions_hint')}</p>
            </div>
          ) : (
            versions.map((v) => {
              const isActive = previewVersion?.id === v.id
              const isRestoring = restoringId === v.id
              const isDeleting = deletingId === v.id
              const isLoadingPreview = loadingPreviewId === v.id

              return (
                <div
                  key={v.id}
                  onClick={() => handlePreview(v)}
                  className={`mx-2 mb-1 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
                    isActive
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                          v{v.version_number}
                        </span>
                        {v.is_auto && (
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded shrink-0">
                            {t('ver_auto')}
                          </span>
                        )}
                        {isLoadingPreview && (
                          <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                        {v.label || `Version ${v.version_number}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(v.created_at)}</span>
                        <span className="text-[10px] text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{v.screen_count} {t('ver_screens')}</span>
                        <span className="text-[10px] text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatBytes(v.size_bytes)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmRestoreId(v.id) }}
                        disabled={isRestoring}
                        title={t('ver_restore')}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors"
                      >
                        {isRestoring ? (
                          <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(v.id) }}
                        disabled={isDeleting}
                        title={t('ver_delete')}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        {isDeleting ? (
                          <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm restore */}
                  {confirmRestoreId === v.id && (
                    <div
                      className="mt-2 pt-2 border-t border-primary/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[10px] text-gray-600 dark:text-gray-300 mb-1.5">
                        {t('ver_confirm_msg')}
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleRestore(v)}
                          className="flex-1 py-1 text-[10px] bg-primary text-white rounded font-medium hover:bg-primary-dark"
                        >
                          {t('ver_restore')}
                        </button>
                        <button
                          onClick={() => setConfirmRestoreId(null)}
                          className="flex-1 py-1 text-[10px] text-gray-500 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          {t('ver_cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Right panel — preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {previewVersion ? (
          <>
            {/* Preview header */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    v{previewVersion.version_number}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {previewVersion.label || `Version ${previewVersion.version_number}`}
                  </span>
                  {previewVersion.is_auto && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{t('ver_auto_saved')}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatDate(previewVersion.created_at)} · {previewVersion.screen_count} screens · {formatBytes(previewVersion.size_bytes)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmRestoreId(previewVersion.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                  </svg>
                  {t('ver_restore')}
                </button>
                <button
                  onClick={() => setPreviewVersion(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Version content overview */}
            <div className="flex-1 overflow-y-auto p-5">
              <VersionPreviewContent version={previewVersion} currentApp={app} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('ver_select_prompt')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Version preview — shows screens/components diff ─────────────────────────

interface PreviewProps {
  version: VersionWithContent
  currentApp: CourseApp
}

function VersionPreviewContent({ version, currentApp }: PreviewProps) {
  const t = useT()
  const vApp = version.content as unknown as CourseApp
  const vScreens = vApp.screens ?? []
  const cScreens = currentApp.screens ?? []

  const addedScreens = vScreens.filter((vs) => !cScreens.find((cs) => cs.id === vs.id))
  const removedScreens = cScreens.filter((cs) => !vScreens.find((vs) => vs.id === cs.id))
  const changedScreens = vScreens.filter((vs) => {
    const cs = cScreens.find((s) => s.id === vs.id)
    if (!cs) return false
    return JSON.stringify(vs) !== JSON.stringify(cs)
  })
  const unchangedCount = vScreens.length - addedScreens.length - changedScreens.length

  const totalComponents = vScreens.reduce((n, s) => n + (s.components?.length ?? 0), 0)

  return (
    <div className="max-w-2xl space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t('ver_stats_screens'), value: vScreens.length, color: 'text-gray-800 dark:text-gray-100' },
          { label: t('ver_stats_components'), value: totalComponents, color: 'text-gray-800 dark:text-gray-100' },
          { label: t('ver_size'), value: formatBytes(version.size_bytes), color: 'text-gray-800 dark:text-gray-100' },
          { label: t('ver_saved_time'), value: formatDate(version.created_at), color: 'text-gray-800 dark:text-gray-100' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Diff summary */}
      {(addedScreens.length > 0 || removedScreens.length > 0 || changedScreens.length > 0) && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wide">{t('ver_changes_vs_current')}</h4>
          <div className="space-y-1.5">
            {addedScreens.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                <span className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-bold">+</span>
                {addedScreens.length} screen{addedScreens.length !== 1 ? 's' : ''} in this version (not in current)
              </div>
            )}
            {removedScreens.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <span className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-[10px] font-bold">−</span>
                {removedScreens.length} screen{removedScreens.length !== 1 ? 's' : ''} removed in current
              </div>
            )}
            {changedScreens.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <span className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[10px] font-bold">~</span>
                {changedScreens.length} screen{changedScreens.length !== 1 ? 's' : ''} modified
              </div>
            )}
            {unchangedCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <span className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px]">=</span>
                {unchangedCount} screen{unchangedCount !== 1 ? 's' : ''} unchanged
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{t('ver_screens_in_version')}</h4>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {vScreens.map((screen, idx) => {
            const current = cScreens.find((s) => s.id === screen.id)
            const isNew = !current
            const isChanged = current && JSON.stringify(screen) !== JSON.stringify(current)
            const componentCount = screen.components?.length ?? 0
            return (
              <div key={screen.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs text-gray-400 dark:text-gray-600 w-5 text-right shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate block">{screen.title || 'Untitled'}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{componentCount} component{componentCount !== 1 ? 's' : ''}</span>
                </div>
                {isNew && (
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded shrink-0">{t('ver_new_badge')}</span>
                )}
                {isChanged && (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded shrink-0">{t('ver_modified')}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
