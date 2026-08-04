import { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Underline } from '@tiptap/extension-underline'
import { Link } from '@tiptap/extension-link'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Image as TiptapImage } from '@tiptap/extension-image'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import type { TextComponent } from '@course-studio/player'
import { useT } from '../../i18n'

interface Props {
  component: TextComponent
  onChange: (updates: Partial<TextComponent>) => void
}

const TEXT_COLORS = [
  '#111827', '#6b7280', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
]
const HIGHLIGHT_COLORS = [
  '#fef08a', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#fecaca', '#fed7aa',
]

const CALLOUT_TYPES = [
  { emoji: '💡', labelKey: 'te_callout_tip', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' },
  { emoji: 'ℹ️', labelKey: 'te_callout_info', bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' },
  { emoji: '⚠️', labelKey: 'te_callout_warning', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800' },
  { emoji: '🚫', labelKey: 'te_callout_danger', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' },
  { emoji: '✅', labelKey: 'te_callout_success', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' },
]

export function TextEditor({ component, onChange }: Props) {
  const t = useT()
  const [linkPopup, setLinkPopup] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [imagePopup, setImagePopup] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [colorPickerOpen, setColorPickerOpen] = useState<'text' | 'highlight' | null>(null)
  const [activeTab, setActiveTab] = useState<'editor' | 'source'>('editor')
  const [sourceValue, setSourceValue] = useState(component.content)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Placeholder.configure({ placeholder: t('te_placeholder') }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline cursor-pointer' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      TaskList,
      TaskItem.configure({ nested: true }),
      TiptapImage.configure({ inline: false, HTMLAttributes: { class: 'max-w-full rounded-lg' } }),
      Subscript,
      Superscript,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: component.content,
    onUpdate: ({ editor }) => {
      onChange({ content: editor.getHTML() })
    },
  })

  useEffect(() => {
    if (editor && editor.getHTML() !== component.content) {
      editor.commands.setContent(component.content, false)
    }
  }, [component.content])

  const setLink = useCallback(() => {
    if (!editor) return
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run()
    } else {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
      editor.chain().focus().setLink({ href: url }).run()
    }
    setLinkPopup(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImagePopup(false)
    setImageUrl('')
  }, [editor, imageUrl])

  function insertCallout(emoji: string, label: string) {
    if (!editor) return
    editor.chain().focus()
      .insertContent(`<blockquote><p>${emoji} <strong>${label}:</strong> </p></blockquote>`)
      .run()
  }

  function getCurrentBlockType(): string {
    if (!editor) return 'paragraph'
    if (editor.isActive('heading', { level: 1 })) return 'h1'
    if (editor.isActive('heading', { level: 2 })) return 'h2'
    if (editor.isActive('heading', { level: 3 })) return 'h3'
    if (editor.isActive('heading', { level: 4 })) return 'h4'
    if (editor.isActive('blockquote')) return 'blockquote'
    if (editor.isActive('codeBlock')) return 'codeBlock'
    return 'paragraph'
  }

  function setBlockType(type: string) {
    if (!editor) return
    switch (type) {
      case 'paragraph': editor.chain().focus().setParagraph().run(); break
      case 'h1': editor.chain().focus().toggleHeading({ level: 1 }).run(); break
      case 'h2': editor.chain().focus().toggleHeading({ level: 2 }).run(); break
      case 'h3': editor.chain().focus().toggleHeading({ level: 3 }).run(); break
      case 'h4': editor.chain().focus().toggleHeading({ level: 4 }).run(); break
      case 'blockquote': editor.chain().focus().toggleBlockquote().run(); break
      case 'codeBlock': editor.chain().focus().toggleCodeBlock().run(); break
    }
  }

  if (!editor) return null

  return (
    <div className="cs-text-editor">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-2 border-b border-gray-100 dark:border-gray-800">
        {(['editor', 'source'] as const).map((tab) => (
          <button
            key={tab}
            onMouseDown={(e) => {
              e.preventDefault()
              if (tab === 'source') setSourceValue(editor.getHTML())
              setActiveTab(tab)
            }}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab === 'editor' ? t('te_tab_visual') : t('te_tab_html')}
          </button>
        ))}
      </div>

      {activeTab === 'source' ? (
        <textarea
          rows={8}
          className="w-full font-mono text-xs border border-gray-200 dark:border-gray-700 rounded-lg p-3 focus:border-primary outline-none resize-none bg-gray-950 text-green-400"
          value={sourceValue}
          onChange={(e) => setSourceValue(e.target.value)}
          onBlur={() => {
            onChange({ content: sourceValue })
            editor.commands.setContent(sourceValue, false)
          }}
        />
      ) : (
        <>
          {/* ── TOOLBAR ── */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-1 bg-white dark:bg-gray-900 shadow-sm">
            {/* Row 1: Block type + text formatting */}
            <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-gray-100 dark:border-gray-800 flex-wrap">
              {/* Block type selector */}
              <select
                className="text-xs border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 focus:border-primary outline-none bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 mr-1"
                value={getCurrentBlockType()}
                onChange={(e) => setBlockType(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <option value="paragraph">{t('te_paragraph')}</option>
                <option value="h1">{t('te_heading')} 1</option>
                <option value="h2">{t('te_heading')} 2</option>
                <option value="h3">{t('te_heading')} 3</option>
                <option value="h4">{t('te_heading')} 4</option>
                <option value="blockquote">{t('te_quote')}</option>
                <option value="codeBlock">{t('te_code_block')}</option>
              </select>

              <Sep />

              <Btn title={`${t('te_bold')} (Ctrl+B)`} active={editor.isActive('bold')}
                onMouseDown={() => editor.chain().focus().toggleBold().run()}>
                <strong>B</strong>
              </Btn>
              <Btn title={`${t('te_italic')} (Ctrl+I)`} active={editor.isActive('italic')}
                onMouseDown={() => editor.chain().focus().toggleItalic().run()}>
                <em>I</em>
              </Btn>
              <Btn title={`${t('te_underline')} (Ctrl+U)`} active={editor.isActive('underline')}
                onMouseDown={() => editor.chain().focus().toggleUnderline().run()}>
                <span className="underline">U</span>
              </Btn>
              <Btn title={t('te_strikethrough')} active={editor.isActive('strike')}
                onMouseDown={() => editor.chain().focus().toggleStrike().run()}>
                <span className="line-through">S</span>
              </Btn>
              <Btn title={t('te_inline_code')} active={editor.isActive('code')}
                onMouseDown={() => editor.chain().focus().toggleCode().run()}>
                <code className="text-[10px]">`x`</code>
              </Btn>
              <Btn title={t('te_subscript')} active={editor.isActive('subscript')}
                onMouseDown={() => editor.chain().focus().toggleSubscript().run()}>
                X<sub className="text-[8px]">2</sub>
              </Btn>
              <Btn title={t('te_superscript')} active={editor.isActive('superscript')}
                onMouseDown={() => editor.chain().focus().toggleSuperscript().run()}>
                X<sup className="text-[8px]">2</sup>
              </Btn>

              <Sep />

              {/* Text color */}
              <div className="relative">
                <Btn title={t('te_text_color')} active={false}
                  onMouseDown={() => setColorPickerOpen(colorPickerOpen === 'text' ? null : 'text')}>
                  <span className="flex flex-col items-center gap-0.5">
                    <span className="text-xs font-bold">A</span>
                    <span
                      className="w-4 h-0.5 rounded-full"
                      style={{ backgroundColor: editor.getAttributes('textStyle').color ?? '#111827' }}
                    />
                  </span>
                </Btn>
                {colorPickerOpen === 'text' && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg z-50 flex flex-wrap gap-1 w-40">
                    <button
                      onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setColorPickerOpen(null) }}
                      className="w-5 h-5 rounded border border-gray-200 bg-gray-50 text-[9px] text-gray-500 flex items-center justify-center hover:bg-gray-100"
                      title={t('te_remove_color')}
                    >✕</button>
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c}
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); setColorPickerOpen(null) }}
                        className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Highlight */}
              <div className="relative">
                <Btn title={t('te_highlight')} active={editor.isActive('highlight')}
                  onMouseDown={() => setColorPickerOpen(colorPickerOpen === 'highlight' ? null : 'highlight')}>
                  <span className="flex flex-col items-center gap-0.5">
                    <span className="text-xs">ab</span>
                    <span className="w-4 h-0.5 rounded-full bg-yellow-400" />
                  </span>
                </Btn>
                {colorPickerOpen === 'highlight' && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg z-50 flex flex-wrap gap-1 w-36">
                    <button
                      onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setColorPickerOpen(null) }}
                      className="w-5 h-5 rounded border border-gray-200 bg-gray-50 text-[9px] text-gray-500 flex items-center justify-center hover:bg-gray-100"
                      title={t('te_remove_highlight')}
                    >✕</button>
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c}
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setHighlight({ color: c }).run(); setColorPickerOpen(null) }}
                        className="w-5 h-5 rounded border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Alignment + lists + blocks + insert */}
            <div className="flex items-center gap-0.5 px-1.5 py-1 flex-wrap">
              {/* Alignment */}
              <Btn title={t('te_align_left')} active={editor.isActive({ textAlign: 'left' })}
                onMouseDown={() => editor.chain().focus().setTextAlign('left').run()}>
                ≡
              </Btn>
              <Btn title={t('te_align_center')} active={editor.isActive({ textAlign: 'center' })}
                onMouseDown={() => editor.chain().focus().setTextAlign('center').run()}>
                ≡
              </Btn>
              <Btn title={t('te_align_right')} active={editor.isActive({ textAlign: 'right' })}
                onMouseDown={() => editor.chain().focus().setTextAlign('right').run()}>
                ≡
              </Btn>

              <Sep />

              {/* Lists */}
              <Btn title={t('te_bullet_list')} active={editor.isActive('bulletList')}
                onMouseDown={() => editor.chain().focus().toggleBulletList().run()}>
                • ≡
              </Btn>
              <Btn title={t('te_ordered_list')} active={editor.isActive('orderedList')}
                onMouseDown={() => editor.chain().focus().toggleOrderedList().run()}>
                1. ≡
              </Btn>
              <Btn title={t('te_task_list')} active={editor.isActive('taskList')}
                onMouseDown={() => editor.chain().focus().toggleTaskList().run()}>
                ☑
              </Btn>

              <Sep />

              {/* Horizontal rule */}
              <Btn title={t('te_divider')} active={false}
                onMouseDown={() => editor.chain().focus().setHorizontalRule().run()}>
                ─
              </Btn>

              {/* Table */}
              <Btn title={t('te_table')} active={editor.isActive('table')}
                onMouseDown={() => {
                  if (editor.isActive('table')) {
                    editor.chain().focus().deleteTable().run()
                  } else {
                    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                  }
                }}>
                ⊞
              </Btn>

              <Sep />

              {/* Link */}
              <Btn title={t('te_insert_link')} active={editor.isActive('link')}
                onMouseDown={() => {
                  const prev = editor.getAttributes('link').href ?? ''
                  setLinkUrl(prev)
                  setLinkPopup(true)
                }}>
                🔗
              </Btn>

              {/* Image */}
              <Btn title={t('te_insert_image')} active={false}
                onMouseDown={() => setImagePopup(true)}>
                🖼
              </Btn>
            </div>

            {/* Row 3: Callouts */}
            <div className="flex items-center gap-1 px-2 py-1.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex-wrap">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mr-1 shrink-0">{t('te_callout')}:</span>
              {CALLOUT_TYPES.map((c) => (
                <button
                  key={c.labelKey}
                  onMouseDown={(e) => { e.preventDefault(); insertCallout(c.emoji, t(c.labelKey)) }}
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors hover:opacity-80 ${c.bg} ${c.border} ${c.text}`}
                  title={t(c.labelKey)}
                >
                  {c.emoji} {t(c.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Link popup */}
          {linkPopup && (
            <div className="mb-2 flex items-center gap-1.5 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="text-xs text-blue-700 dark:text-blue-400 shrink-0">🔗</span>
              <input
                autoFocus
                className="flex-1 text-xs border border-blue-200 dark:border-blue-700 rounded px-2 py-1 focus:border-blue-400 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setLink()
                  if (e.key === 'Escape') { setLinkPopup(false); setLinkUrl('') }
                }}
              />
              <button
                onMouseDown={(e) => { e.preventDefault(); setLink() }}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                {linkUrl ? t('te_link_set') : t('te_link_remove')}
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); setLinkPopup(false); setLinkUrl('') }}
                className="text-xs text-blue-400 hover:text-blue-600 px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Image popup */}
          {imagePopup && (
            <div className="mb-2 flex items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="text-xs text-gray-500 shrink-0">🖼</span>
              <input
                autoFocus
                className="flex-1 text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-1 focus:border-primary outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                placeholder={t('te_image_url_placeholder')}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') insertImage()
                  if (e.key === 'Escape') { setImagePopup(false); setImageUrl('') }
                }}
              />
              <button
                onMouseDown={(e) => { e.preventDefault(); insertImage() }}
                className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary-dark font-medium"
              >
                {t('te_insert')}
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); setImagePopup(false); setImageUrl('') }}
                className="text-xs text-gray-400 hover:text-gray-600 px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Editor content */}
          <EditorContent
            editor={editor}
            className={`
              prose prose-sm max-w-none min-h-[100px]
              border border-gray-200 dark:border-gray-700
              rounded-xl p-3
              focus-within:border-primary dark:focus-within:border-primary
              outline-none
              bg-white dark:bg-gray-900
              text-gray-900 dark:text-gray-100
              [&_.ProseMirror]:outline-none
              [&_.ProseMirror]:min-h-[80px]
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-2.5 [&_h2]:mb-1
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
              [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-1.5 [&_h4]:mb-0.5
              [&_p]:my-1
              [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5
              [&_li]:my-0.5
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:my-2 [&_blockquote]:rounded-r-md [&_blockquote]:bg-gray-50 dark:[&_blockquote]:bg-gray-800/50 [&_blockquote]:py-1
              [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:text-red-500 dark:[&_code]:text-red-400 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.8em] [&_code]:font-mono
              [&_pre]:bg-gray-900 [&_pre]:text-green-400 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:text-xs [&_pre]:font-mono
              [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0
              [&_hr]:border-gray-200 dark:[&_hr]:border-gray-700 [&_hr]:my-4
              [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2
              [&_table]:border-collapse [&_table]:w-full [&_table]:my-2
              [&_td]:border [&_td]:border-gray-200 dark:[&_td]:border-gray-700 [&_td]:p-2 [&_td]:text-sm
              [&_th]:border [&_th]:border-gray-200 dark:[&_th]:border-gray-700 [&_th]:p-2 [&_th]:text-sm [&_th]:font-semibold [&_th]:bg-gray-50 dark:[&_th]:bg-gray-800
              [&_.is-empty::before]:content-[attr(data-placeholder)] [&_.is-empty::before]:text-gray-400 dark:[&_.is-empty::before]:text-gray-600 [&_.is-empty::before]:float-left [&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:h-0
              [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-1
              [&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2
              [&_li[data-type=taskItem]_label]:flex [&_li[data-type=taskItem]_label]:items-center [&_li[data-type=taskItem]_label]:gap-1.5 [&_li[data-type=taskItem]_label]:mt-0.5
            `}
          />
        </>
      )}
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Btn({
  title, active, onMouseDown, children,
}: {
  title: string
  active: boolean
  onMouseDown: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onMouseDown() }}
      title={title}
      className={`px-1.5 py-1 rounded text-xs transition-colors min-w-[26px] flex items-center justify-center ${
        active
          ? 'bg-primary text-white'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5 shrink-0" />
}
