import { useRef, useState } from 'react'
import type { DialogTrainerComponent, DialogCharacter, DialogMessage, DialogChoice } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: DialogTrainerComponent
  onChange: (updates: Partial<DialogTrainerComponent>) => void
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']

export function DialogTrainerEditor({ component, onChange }: Props) {
  const t = useT()
  const [activeTab, setActiveTab] = useState<'characters' | 'flow'>('characters')
  const [avatarUrlInput, setAvatarUrlInput] = useState<Record<string, string>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(
    component.startMessageId ?? component.messages[0]?.id ?? null
  )

  const charMap = Object.fromEntries(component.characters.map((c) => [c.id, c]))
  const msgMap = Object.fromEntries(component.messages.map((m) => [m.id, m]))

  function addCharacter() {
    const id = `char-${Date.now()}`
    onChange({
      characters: [
        ...component.characters,
        { id, name: `${t('dlg_tab_characters')} ${component.characters.length + 1}`, color: COLORS[component.characters.length % COLORS.length] },
      ],
    })
  }

  function updateChar(id: string, patch: Partial<DialogCharacter>) {
    onChange({ characters: component.characters.map((c) => c.id === id ? { ...c, ...patch } : c) })
  }

  function removeChar(id: string) {
    onChange({ characters: component.characters.filter((c) => c.id !== id) })
  }

  function addMessage() {
    const id = `msg-${Date.now()}`
    const newMsg: DialogMessage = { id, characterId: component.characters[0]?.id ?? 'player', text: '' }
    const updatedFlow = { ...component.flow, [id]: { messageId: id } }
    const start = component.startMessageId || id
    onChange({ messages: [...component.messages, newMsg], flow: updatedFlow, startMessageId: start })
    setSelectedMsgId(id)
  }

  function updateMessage(id: string, patch: Partial<DialogMessage>) {
    onChange({ messages: component.messages.map((m) => m.id === id ? { ...m, ...patch } : m) })
  }

  function removeMessage(id: string) {
    const newFlow = { ...component.flow }
    delete newFlow[id]
    const newMsgs = component.messages.filter((m) => m.id !== id)
    const newStart = component.startMessageId === id ? (newMsgs[0]?.id ?? '') : component.startMessageId
    if (selectedMsgId === id) setSelectedMsgId(newMsgs[0]?.id ?? null)
    onChange({ messages: newMsgs, flow: newFlow, startMessageId: newStart })
  }

  function addChoice(msgId: string) {
    const choiceId = `ch-${Date.now()}`
    const newChoice: DialogChoice = { id: choiceId, text: '' }
    const node = component.flow[msgId] ?? { messageId: msgId }
    const choices = [...(node.choices ?? []), newChoice]
    onChange({ flow: { ...component.flow, [msgId]: { ...node, choices } } })
  }

  function updateChoice(msgId: string, choiceId: string, patch: Partial<DialogChoice>) {
    const node = component.flow[msgId]
    if (!node) return
    onChange({
      flow: {
        ...component.flow,
        [msgId]: {
          ...node,
          choices: node.choices?.map((c) => c.id === choiceId ? { ...c, ...patch } : c),
        },
      },
    })
  }

  function removeChoice(msgId: string, choiceId: string) {
    const node = component.flow[msgId]
    if (!node) return
    onChange({
      flow: {
        ...component.flow,
        [msgId]: { ...node, choices: node.choices?.filter((c) => c.id !== choiceId) },
      },
    })
  }

  const selectedMsg = selectedMsgId ? msgMap[selectedMsgId] : null
  const selectedNode = selectedMsgId ? component.flow[selectedMsgId] : null

  const TABS = [
    { key: 'characters' as const, label: t('dlg_tab_characters') },
    { key: 'flow' as const, label: t('dlg_tab_flow') },
  ]

  return (
    <div className="space-y-3">
      {/* Title */}
      <div>
        <label className="text-xs text-gray-500 mb-0.5 block">{t('dlg_title_label')}</label>
        <input
          className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:border-primary outline-none"
          placeholder={t('dlg_title_placeholder')}
          value={component.title ?? ''}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Characters tab */}
      {activeTab === 'characters' && (
        <div className="space-y-2">
          {component.characters.map((char) => (
            <div key={char.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 space-y-2">
              <div className="flex items-center gap-2">
                {char.avatar ? (
                  <img
                    src={char.avatar}
                    alt={char.name}
                    className="w-8 h-8 rounded-full shrink-0 object-cover border border-gray-200"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: char.color ?? '#6366f1' }}
                  >
                    {char.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <input
                  className="flex-1 text-sm border-b border-transparent hover:border-gray-300 focus:border-primary outline-none bg-transparent dark:text-gray-200"
                  value={char.name}
                  onChange={(e) => updateChar(char.id, { name: e.target.value })}
                />
                <div className="flex gap-0.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateChar(char.id, { color: c })}
                      className={`w-4 h-4 rounded-full border-2 ${char.color === c ? 'border-gray-600 dark:border-gray-300' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => removeChar(char.id)}
                  className="text-gray-400 hover:text-red-400 text-base leading-none"
                >×</button>
              </div>

              {/* Avatar upload */}
              <div className="flex items-center gap-1.5">
                <input
                  className="flex-1 text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded px-2 py-1 focus:border-primary outline-none placeholder-gray-400"
                  placeholder={t('dlg_avatar_url_placeholder')}
                  value={avatarUrlInput[char.id] ?? char.avatar ?? ''}
                  onChange={(e) => setAvatarUrlInput((prev) => ({ ...prev, [char.id]: e.target.value }))}
                  onBlur={() => {
                    const url = avatarUrlInput[char.id]
                    if (url !== undefined) updateChar(char.id, { avatar: url || undefined })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const url = avatarUrlInput[char.id]
                      if (url !== undefined) updateChar(char.id, { avatar: url || undefined })
                    }
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => { fileInputRefs.current[char.id] = el }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      const dataUrl = reader.result as string
                      updateChar(char.id, { avatar: dataUrl })
                      setAvatarUrlInput((prev) => ({ ...prev, [char.id]: '' }))
                    }
                    reader.readAsDataURL(file)
                  }}
                />
                <button
                  onClick={() => fileInputRefs.current[char.id]?.click()}
                  className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 shrink-0"
                  title={t('dlg_upload_title')}
                >
                  {t('dlg_upload_btn')}
                </button>
                {char.avatar && (
                  <button
                    onClick={() => { updateChar(char.id, { avatar: undefined }); setAvatarUrlInput((prev) => ({ ...prev, [char.id]: '' })) }}
                    className="text-xs text-red-400 hover:text-red-600 shrink-0"
                  >×</button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={addCharacter}
            className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-800 border border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            {t('dlg_add_character')}
          </button>
        </div>
      )}

      {/* Flow tab */}
      {activeTab === 'flow' && (
        <div className="flex gap-2">
          {/* Message list */}
          <div className="w-32 shrink-0 space-y-1">
            {component.messages.map((msg, i) => {
              const char = charMap[msg.characterId]
              return (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMsgId(msg.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                    selectedMsgId === msg.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="shrink-0 text-[10px] text-gray-400">#{i + 1}</span>
                  <span className="truncate">{char?.name ?? '?'}</span>
                  {msg.id === component.startMessageId && (
                    <span className="ml-auto text-[9px] text-green-500 font-bold shrink-0">{t('dlg_start_badge')}</span>
                  )}
                </button>
              )
            })}
            <button
              onClick={addMessage}
              className="w-full py-1 text-xs text-gray-400 hover:text-primary border border-dashed border-gray-200 rounded-lg hover:border-primary/40"
            >{t('dlg_add_message')}</button>
          </div>

          {/* Selected message editor */}
          {selectedMsg && selectedNode ? (
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-1">
                <select
                  className="text-xs border border-gray-200 rounded px-1.5 py-1 focus:border-primary outline-none"
                  value={selectedMsg.characterId}
                  onChange={(e) => updateMessage(selectedMsg.id, { characterId: e.target.value })}
                >
                  {component.characters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => onChange({ startMessageId: selectedMsg.id })}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                    selectedMsg.id === component.startMessageId
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : 'text-gray-400 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {selectedMsg.id === component.startMessageId ? t('dlg_is_start') : t('dlg_set_start')}
                </button>
                <button
                  onClick={() => removeMessage(selectedMsg.id)}
                  className="ml-auto text-gray-400 hover:text-red-400 text-sm"
                >×</button>
              </div>

              <textarea
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:border-primary outline-none resize-none"
                value={selectedMsg.text}
                onChange={(e) => updateMessage(selectedMsg.id, { text: e.target.value })}
                placeholder={t('dlg_message_placeholder')}
              />

              {/* Choices */}
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {t('dlg_choices_label')}
                </div>
                {(selectedNode.choices ?? []).map((choice) => (
                  <div key={choice.id} className="mb-1.5 bg-gray-50 rounded-lg p-2 space-y-1">
                    <div className="flex items-center gap-1">
                      <input
                        className="flex-1 text-xs border-b border-transparent hover:border-gray-300 focus:border-primary outline-none bg-transparent"
                        value={choice.text}
                        onChange={(e) => updateChoice(selectedMsg.id, choice.id, { text: e.target.value })}
                        placeholder={t('dlg_choice_placeholder')}
                      />
                      <button
                        onClick={() => removeChoice(selectedMsg.id, choice.id)}
                        className="text-gray-400 hover:text-red-400 text-sm shrink-0"
                      >×</button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">→</span>
                      <select
                        className="text-[10px] border border-gray-200 rounded px-1 py-0.5 focus:border-primary outline-none flex-1"
                        value={choice.nextMessageId ?? ''}
                        onChange={(e) => updateChoice(selectedMsg.id, choice.id, {
                          nextMessageId: e.target.value || null
                        })}
                      >
                        <option value="">{t('dlg_end_conversation')}</option>
                        {component.messages
                          .filter((m) => m.id !== selectedMsg.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {charMap[m.characterId]?.name}: {m.text.slice(0, 25)}
                            </option>
                          ))
                        }
                      </select>
                      <select
                        className="text-[10px] border border-gray-200 rounded px-1 py-0.5 outline-none"
                        value={choice.isCorrect === true ? 'correct' : choice.isCorrect === false ? 'incorrect' : 'neutral'}
                        onChange={(e) => updateChoice(selectedMsg.id, choice.id, {
                          isCorrect: e.target.value === 'correct' ? true : e.target.value === 'incorrect' ? false : undefined
                        })}
                      >
                        <option value="neutral">{t('dlg_neutral')}</option>
                        <option value="correct">{t('dlg_correct')}</option>
                        <option value="incorrect">{t('dlg_incorrect')}</option>
                      </select>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addChoice(selectedMsg.id)}
                  className="w-full py-1 text-[10px] text-gray-400 hover:text-primary border border-dashed border-gray-200 rounded hover:border-primary/40"
                >
                  {t('dlg_add_choice')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 text-xs text-gray-400 flex items-center justify-center">
              {t('dlg_select_message')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
