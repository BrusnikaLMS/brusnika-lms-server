import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useLocaleStore } from '../store/localeStore'
import { useThemeStore, type Theme } from '../store/themeStore'
import { LOCALE_NAMES, useT } from '../i18n'
import { ssoApi, whiteLabelApi, auditApi, collaboratorsApi, type CourseListItem, type SSOConfig, type WhiteLabelConfig, type AuditLogEntry, type CollaboratorOut } from '../api/client'
import { getActivityLog, formatLogTime, type ActivityEntry } from '../utils/activityLog'

type SettingsTab = 'account' | 'language' | 'theme' | 'collaboration' | 'roles' | 'logs' | 'sso' | 'white_label'

const LOCALES = Object.entries(LOCALE_NAMES) as [string, string][]
const HOME_URL = import.meta.env.VITE_HOME_URL || ''

const SETTINGS_TABS: Array<{ id: SettingsTab; labelKey: string }> = [
  { id: 'account', labelKey: 'settings_account' },
  { id: 'language', labelKey: 'settings_language' },
  { id: 'theme', labelKey: 'settings_theme' },
  { id: 'collaboration', labelKey: 'settings_collaboration' },
  { id: 'roles', labelKey: 'settings_roles' },
  { id: 'sso', labelKey: 'settings_sso' },
  { id: 'white_label', labelKey: 'settings_white_label' },
  { id: 'logs', labelKey: 'settings_logs' },
]

function getActionIcon(action: string): string {
  if (action.includes('created')) return '✨'
  if (action.includes('opened')) return '📂'
  if (action.includes('published')) return '🟢'
  if (action.includes('unpublished')) return '⚫'
  if (action.includes('deleted')) return '🗑️'
  if (action.includes('saved')) return '💾'
  if (action.includes('exported')) return '📦'
  return '📝'
}

export function SettingsSection({ cloudCourses, onOpenPlans }: { cloudCourses: CourseListItem[]; onOpenPlans: () => void }) {
  const t = useT()
  const { user, logout, initialized } = useAuthStore()
  const { locale, setLocale } = useLocaleStore()
  const { theme, setTheme } = useThemeStore()

  const [settingsTab, setSettingsTab] = useState<SettingsTab>('account')
  const isEnterprise = user?.plan && ['enterprise', 'admin'].includes(user.plan)
  const isPro = user?.plan && ['pro', 'enterprise', 'admin'].includes(user.plan)

  // SSO state
  const [ssoConfig, setSsoConfig] = useState<SSOConfig>({ provider: 'saml', entity_id: '', sso_url: '', certificate: '', enabled: false })
  const [ssoSaved, setSsoSaved] = useState(false)

  // White-label state
  const [wlConfig, setWlConfig] = useState<WhiteLabelConfig>({ app_name: 'cforj', logo_url: null, primary_color: '#34d399', remove_branding: false, custom_domain: null })
  const [wlSaved, setWlSaved] = useState(false)

  // Logs state
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([])
  const [serverLog, setServerLog] = useState<AuditLogEntry[]>([])

  // Roles state
  const [rolesCourseId, setRolesCourseId] = useState('')
  const [rolesCollabs, setRolesCollabs] = useState<CollaboratorOut[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesInviteEmail, setRolesInviteEmail] = useState('')
  const [rolesInviteRole, setRolesInviteRole] = useState('editor')
  const [rolesInviting, setRolesInviting] = useState(false)

  useEffect(() => { setActivityLog(getActivityLog()) }, [])
  useEffect(() => {
    if (!isEnterprise) return
    auditApi.list().then(setServerLog).catch(() => {})
    ssoApi.getConfig().then(setSsoConfig).catch(() => {})
    whiteLabelApi.get().then(setWlConfig).catch(() => {})
  }, [isEnterprise])

  function refreshLog() { setActivityLog(getActivityLog()) }

  async function saveSso() {
    await ssoApi.saveConfig(ssoConfig).catch(() => {})
    setSsoSaved(true); setTimeout(() => setSsoSaved(false), 2000)
  }

  async function saveWhiteLabel() {
    const updated = await whiteLabelApi.save(wlConfig).catch(() => null)
    if (updated) setWlConfig(updated)
    setWlSaved(true); setTimeout(() => setWlSaved(false), 2000)
  }

  async function loadRolesCollabs(courseId: string) {
    if (!courseId) { setRolesCollabs([]); return }
    setRolesLoading(true)
    try { setRolesCollabs(await collaboratorsApi.list(courseId)) }
    catch { setRolesCollabs([]) }
    finally { setRolesLoading(false) }
  }

  async function handleRolesSelectCourse(courseId: string) {
    setRolesCourseId(courseId)
    setRolesInviteEmail('')
    await loadRolesCollabs(courseId)
  }

  async function handleRolesChangeRole(collabId: number, role: string) {
    if (!rolesCourseId) return
    await collaboratorsApi.updateRole(rolesCourseId, collabId, role).catch(() => {})
    await loadRolesCollabs(rolesCourseId)
  }

  async function handleRolesRemove(collabId: number) {
    if (!rolesCourseId) return
    await collaboratorsApi.remove(rolesCourseId, collabId).catch(() => {})
    await loadRolesCollabs(rolesCourseId)
  }

  async function handleRolesInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!rolesCourseId || !rolesInviteEmail) return
    setRolesInviting(true)
    try {
      await collaboratorsApi.invite(rolesCourseId, rolesInviteEmail, rolesInviteRole)
      setRolesInviteEmail('')
      await loadRolesCollabs(rolesCourseId)
    } catch {}
    finally { setRolesInviting(false) }
  }

  return (
    <div className="flex gap-6 max-w-4xl">
      {/* Settings sidebar */}
      <div className="w-44 shrink-0">
        <nav className="space-y-0.5">
          {SETTINGS_TABS.map((st) => (
            <button
              key={st.id}
              onClick={() => setSettingsTab(st.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                settingsTab === st.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t(st.labelKey)}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings content */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {settingsTab === 'account' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('settings_account')}</h2>
            {user ? (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">{t('settings_name')}</label>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{user.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">{t('settings_email')}</label>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">{t('settings_plan')}</label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">{user.plan}</span>
                    <button onClick={onOpenPlans} className="text-xs text-primary hover:underline">{t('settings_upgrade')}</button>
                  </div>
                </div>
                <hr className="border-gray-100 dark:border-gray-800" />
                <button
                  onClick={() => { logout(); if (HOME_URL) window.location.href = HOME_URL }}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
                >{t('settings_sign_out')}</button>
              </>
            ) : initialized ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <Link to="/login" className="text-primary hover:underline font-medium">{t('sign_in')}</Link>
              </div>
            ) : null}
          </div>
        )}

        {settingsTab === 'language' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('settings_interface_language')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {LOCALES.map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => setLocale(code as typeof locale)}
                  className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    locale === code
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >{name}</button>
              ))}
            </div>
          </div>
        )}

        {settingsTab === 'theme' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('settings_theme')}</h2>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'light', labelKey: 'theme_light', preview: 'bg-white border border-gray-200' },
                { value: 'dark', labelKey: 'theme_dark', preview: 'bg-gray-900' },
                { value: 'system', labelKey: 'theme_system', preview: 'bg-gradient-to-r from-white to-gray-900' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value as Theme)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-colors ${
                    theme === opt.value ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-16 h-10 rounded-lg mb-2 ${opt.preview}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(opt.labelKey)}</span>
                  {theme === opt.value && <span className="text-xs text-primary mt-0.5">{t('theme_active')}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {settingsTab === 'collaboration' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('settings_collaboration')}</h2>
            {isPro ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings_collab_desc')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('collab_pro_desc')}</p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('collab_manage')} — {t('collab_invite')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('settings_collab_open_course')}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
                  <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">{t('settings_collab_pro')}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t('settings_collab_desc')}</p>
                </div>
                <button onClick={onOpenPlans} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">{t('upgrade_pro')}</button>
              </>
            )}
          </div>
        )}

        {settingsTab === 'roles' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('settings_roles')}</h2>
            {!isPro ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">{t('settings_collab_pro')}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t('collab_pro_desc')}</p>
                <button onClick={onOpenPlans} className="mt-2 text-xs font-medium text-white bg-primary rounded-lg px-3 py-1.5">{t('upgrade_pro')}</button>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">{t('roles_select_course')}</label>
                  <select
                    value={rolesCourseId}
                    onChange={(e) => handleRolesSelectCourse(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">{t('roles_choose_course')}</option>
                    {cloudCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                {rolesCourseId && (
                  <>
                    <form onSubmit={handleRolesInvite} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('collab_invite_email')}</label>
                        <input type="email" required value={rolesInviteEmail} onChange={e => setRolesInviteEmail(e.target.value)} placeholder="user@example.com" className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('collab_role')}</label>
                        <select value={rolesInviteRole} onChange={e => setRolesInviteRole(e.target.value)} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
                          <option value="editor">{t('collab_role_editor')}</option>
                          <option value="viewer">{t('collab_role_viewer')}</option>
                        </select>
                      </div>
                      <button type="submit" disabled={rolesInviting} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                        {rolesInviting ? '…' : t('collab_invite_btn')}
                      </button>
                    </form>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold">
                            {user?.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{user?.name}</p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                          </div>
                        </div>
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">{t('role_owner')}</span>
                      </div>

                      {rolesLoading ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">{t('loading')}</div>
                      ) : rolesCollabs.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">{t('roles_no_members')}</div>
                      ) : (
                        rolesCollabs.map(c => (
                          <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-bold">
                                {(c.user_name ?? c.invited_email)?.[0]?.toUpperCase() ?? '?'}
                              </div>
                              <div>
                                {c.user_name && <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{c.user_name}</p>}
                                <p className="text-xs text-gray-400">{c.invited_email}</p>
                                {!c.accepted_at && <p className="text-xs text-amber-500">{t('collab_pending')}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select value={c.role} onChange={e => handleRolesChangeRole(c.id, e.target.value)} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-primary">
                                <option value="editor">{t('collab_role_editor')}</option>
                                <option value="viewer">{t('collab_role_viewer')}</option>
                              </select>
                              <button onClick={() => handleRolesRemove(c.id)} className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors" title={t('collab_remove')}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {settingsTab === 'sso' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('sso_title')}</h2>
            {!isEnterprise ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('sso_enterprise_title')}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t('sso_enterprise_desc')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={ssoConfig.enabled} onChange={(e) => setSsoConfig({ ...ssoConfig, enabled: e.target.checked })} className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('sso_enable')}</span>
                </label>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('sso_idp_url')}</label>
                  <input value={ssoConfig.sso_url} onChange={(e) => setSsoConfig({ ...ssoConfig, sso_url: e.target.value })} placeholder="https://idp.example.com/sso/saml" className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('sso_entity_id')}</label>
                  <input value={ssoConfig.entity_id} onChange={(e) => setSsoConfig({ ...ssoConfig, entity_id: e.target.value })} placeholder="https://app.cforj.studio" className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('sso_certificate')}</label>
                  <textarea value={ssoConfig.certificate} onChange={(e) => setSsoConfig({ ...ssoConfig, certificate: e.target.value })} rows={4} placeholder="-----BEGIN CERTIFICATE-----" className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-xs font-mono focus:border-primary outline-none resize-none" />
                </div>
                {ssoConfig.enabled && ssoConfig.sso_url && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('sso_login_url')}</p>
                    <code className="text-xs text-primary font-mono">{window.location.origin}/api/sso/saml/login</code>
                  </div>
                )}
                <button onClick={saveSso} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">
                  {ssoSaved ? t('sso_saved') : t('sso_save')}
                </button>
              </div>
            )}
          </div>
        )}

        {settingsTab === 'white_label' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('wl_title')}</h2>
            {!isEnterprise ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('wl_enterprise_title')}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t('wl_enterprise_desc')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('wl_app_name')}</label>
                  <input value={wlConfig.app_name} onChange={(e) => setWlConfig({ ...wlConfig, app_name: e.target.value })} className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('wl_logo_url')}</label>
                  <input value={wlConfig.logo_url ?? ''} onChange={(e) => setWlConfig({ ...wlConfig, logo_url: e.target.value || null })} placeholder="https://your-logo.png" className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                  {wlConfig.logo_url && <img src={wlConfig.logo_url} alt="Logo preview" className="mt-2 h-10 object-contain rounded" />}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('wl_primary_color')}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={wlConfig.primary_color} onChange={(e) => setWlConfig({ ...wlConfig, primary_color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                    <input value={wlConfig.primary_color} onChange={(e) => setWlConfig({ ...wlConfig, primary_color: e.target.value })} className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-primary outline-none" />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={wlConfig.remove_branding} onChange={(e) => setWlConfig({ ...wlConfig, remove_branding: e.target.checked })} className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('wl_remove_branding')}</span>
                </label>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('wl_custom_domain')}</label>
                  <input value={wlConfig.custom_domain ?? ''} onChange={(e) => setWlConfig({ ...wlConfig, custom_domain: e.target.value || null })} placeholder={t('wl_custom_domain_placeholder')} className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                  <p className="text-xs text-gray-400 mt-1">{t('wl_domain_hint')}</p>
                </div>
                <button onClick={saveWhiteLabel} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">
                  {wlSaved ? t('wl_saved') : t('wl_save')}
                </button>
              </div>
            )}
          </div>
        )}

        {settingsTab === 'logs' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('settings_logs_title')}</h2>

            {isEnterprise && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('log_server_title')}</h3>
                {serverLog.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">{t('log_server_empty')}</p>
                ) : (
                  <div className="space-y-0 max-h-48 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-lg">
                    {serverLog.map((entry) => (
                      <div key={entry.id} className="flex items-start justify-between gap-3 px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="mt-0.5 shrink-0 text-base">{getActionIcon(entry.action)}</span>
                          <div className="min-w-0">
                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{entry.action}</span>
                            {entry.resource_name && <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{entry.resource_type}: {entry.resource_name}</p>}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                          {new Date(entry.created_at).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('log_local_title')}</h3>
                {activityLog.length > 0 && (
                  <button onClick={() => { localStorage.removeItem('cs_activity_log'); refreshLog() }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">{t('log_clear')}</button>
                )}
              </div>
              {activityLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="text-3xl mb-3 opacity-30">📋</div>
                  <p className="text-sm text-gray-400">{t('log_empty')}</p>
                  <p className="text-xs text-gray-300 mt-1">{t('log_empty_hint')}</p>
                </div>
              ) : (
                <div className="space-y-0 max-h-64 overflow-y-auto -mx-1">
                  {activityLog.map((entry, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 px-1 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="mt-0.5 shrink-0 text-base">{getActionIcon(entry.action)}</span>
                        <div className="min-w-0">
                          <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{entry.action}</span>
                          {entry.detail && <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{entry.detail}</p>}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">{formatLogTime(entry.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
