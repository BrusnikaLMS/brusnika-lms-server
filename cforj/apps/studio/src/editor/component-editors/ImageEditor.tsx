import { useRef, useState } from 'react'
import type { ImageComponent } from '@course-studio/player'
import { useT } from '../../i18n'
import { uploadsApi } from '../../api/client'

interface Props {
  component: ImageComponent
  onChange: (updates: Partial<ImageComponent>) => void
}

export function ImageEditor({ component, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const t = useT()
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadsApi.upload(file)
      onChange({ src: url, alt: component.alt || file.name.replace(/\.[^.]+$/, '') })
    } catch {
      // Fallback to data URL (local mode / API offline)
      const reader = new FileReader()
      reader.onload = (ev) => {
        onChange({ src: ev.target?.result as string, alt: component.alt || file.name.replace(/\.[^.]+$/, '') })
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs text-gray-600 mb-1 block">{t('upload_image')}</label>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded px-3 py-2 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors text-center"
        >
          {uploading ? t('uploading_label') : component.src ? t('replace_image') : t('choose_file')}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      <div>
        <label className="text-xs text-gray-600 mb-1 block">{t('or_paste_url')}</label>
        <input
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
          placeholder="https://..."
          value={component.src?.startsWith('data:') ? '' : (component.src ?? '')}
          onChange={(e) => onChange({ src: e.target.value })}
        />
      </div>

      {component.src && (
        <div className="relative group">
          <img src={component.src} alt={component.alt} className="w-full rounded max-h-40 object-cover" />
          <button
            onClick={() => onChange({ src: '' })}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/50 text-white rounded px-1.5 py-0.5 text-xs"
          >
            {t('remove')}
          </button>
        </div>
      )}

      <div>
        <label className="text-xs text-gray-600 mb-1 block">{t('alt_text')}</label>
        <input
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
          placeholder={t('describe_image')}
          value={component.alt ?? ''}
          onChange={(e) => onChange({ alt: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs text-gray-600 mb-1 block">{t('caption')}</label>
        <input
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
          placeholder={t('optional_caption')}
          value={component.caption ?? ''}
          onChange={(e) => onChange({ caption: e.target.value })}
        />
      </div>
    </div>
  )
}
