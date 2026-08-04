import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { collaboratorsApi, type CollaboratorOut } from '../api/client'
import { useT } from '../i18n'
import { toast } from '../store/toastStore'

const PRO_PLANS = new Set(['pro', 'enterprise', 'admin'])

function Avatar({ name, email }: { name: string | null; email: string }) {
  const label = name ? name[0].toUpperCase() : email[0].toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
      {label}
    </div>
  )
}

export function CollaboratorsModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const { user } = useAuthStore()
  const t = useT()
  const overlayRef = useRef<HTMLDivElement>(null)

  const [collabs, setCollabs] = useState<CollaboratorOut[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const isPro = user && PRO_PLANS.has(user.plan)
  const embedUrl = `${window.location.origin}/embed/${courseId}`

  useEffect(() => {
    if (!isPro) { setLoading(false); return }
    collaboratorsApi.list(courseId)
      .then(setCollabs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [courseId, isPro])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(false)
    try {
      const c = await collaboratorsApi.invite(courseId, inviteEmail.trim(), inviteRole)
      setCollabs((prev) => {
        const exists = prev.find((x) => x.id === c.id)
        return exists ? prev : [...prev, c]
      })
      setInviteEmail('')
      setInviteSuccess(true)
      toast(t('toast_collab_invited'))
      setTimeout(() => setInviteSuccess(false), 3000)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Error')
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(collab: CollaboratorOut, role: string) {
    try {
      const updated = await collaboratorsApi.updateRole(courseId, collab.id, role)
      setCollabs((prev) => prev.map((c) => c.id === updated.id ? updated : c))
      toast(t('toast_collab_role_updated'))
    } catch { /* ignore */ }
  }

  async function handleRemove(collab: CollaboratorOut) {
    try {
      await collaboratorsApi.remove(courseId, collab.id)
      setCollabs((prev) => prev.filter((c) => c.id !== collab.id))
      toast(t('toast_collab_removed'))
    } catch { /* ignore */ }
  }

  function copyLink() {
    navigator.clipboard.writeText(embedUrl).then(() => {
      setCopied(true)
      toast(t('toast_copied'))
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6-4a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('collab_title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {!isPro ? (
          /* Pro gate */
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-5 text-center">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">{t('collab_pro_title')}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">{t('collab_pro_desc')}</p>
            <button className="text-xs bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700">
              {t('upgrade_pro')}
            </button>
          </div>
        ) : (
          <>
            {/* Invite form */}
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t('collab_email_placeholder')}
                className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 text-sm focus:border-primary outline-none"
              >
                <option value="editor">{t('collab_role_editor')}</option>
                <option value="viewer">{t('collab_role_viewer')}</option>
              </select>
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 shrink-0"
              >
                {inviting ? '…' : t('collab_invite_btn')}
              </button>
            </form>

            {inviteError && (
              <p className="text-xs text-red-500 -mt-3">{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="text-xs text-green-600 -mt-3">Invited successfully!</p>
            )}

            {/* Collaborators list */}
            <div className="space-y-2">
              {/* Owner row */}
              {user && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <Avatar name={user.name} email={user.email} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium shrink-0">
                    {t('collab_owner')}
                  </span>
                </div>
              )}

              {loading ? (
                <p className="text-xs text-gray-400 text-center py-4">Loading…</p>
              ) : collabs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">{t('collab_no_collabs')}</p>
              ) : (
                collabs.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <Avatar name={c.user_name} email={c.invited_email} />
                    <div className="flex-1 min-w-0">
                      {c.user_name && (
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.user_name}</p>
                      )}
                      <p className="text-xs text-gray-400 truncate">{c.invited_email}</p>
                    </div>
                    {!c.accepted_at && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                        {t('collab_pending')}
                      </span>
                    )}
                    <select
                      value={c.role}
                      onChange={(e) => handleRoleChange(c, e.target.value)}
                      className="text-xs border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-2 py-1 outline-none"
                    >
                      <option value="editor">{t('collab_role_editor')}</option>
                      <option value="viewer">{t('collab_role_viewer')}</option>
                    </select>
                    <button
                      onClick={() => handleRemove(c)}
                      className="text-gray-300 hover:text-red-400 text-lg leading-none ml-1"
                      title={t('collab_remove')}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Share link */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('collab_share_link')}</p>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 font-mono text-gray-500 dark:text-gray-400 truncate">
                  {embedUrl}
                </code>
                <button
                  onClick={copyLink}
                  className="text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium shrink-0"
                >
                  {copied ? t('collab_copied') : t('collab_copy')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
