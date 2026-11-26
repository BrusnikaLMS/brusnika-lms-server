import { useRef, useState } from 'react'
import type { VideoComponent } from '@course-studio/player'
import { useT } from '../../i18n'
import { uploadsApi } from '../../api/client'

interface Props {
  component: VideoComponent
  onChange: (updates: Partial<VideoComponent>) => void
}

export function VideoEditor({ component, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const t = useT()
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadsApi.upload(file)
      onChange({ src: url })
    } catch {
      // Fallback to data URL
      const reader = new FileReader()
      reader.onload = (ev) => { onChange({ src: ev.target?.result as string }) }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  const isYoutube = component.src?.includes('youtube.com') || component.src?.includes('youtu.be')
  const isRutube = component.src?.includes('rutube.ru')
  const isEmbed = isYoutube || isRutube
  const isData = component.src?.startsWith('data:')

  function getEmbedUrl(src: string): string | null {
    const ytMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    const rtMatch = src.match(/rutube\.ru\/video\/([\w]+)/)
    if (rtMatch) return `https://rutube.ru/play/embed/${rtMatch[1]}`
    return null
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs text-gray-600 mb-1 block">{t('upload_video')}</label>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded px-3 py-2 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors text-center"
        >
          {uploading ? t('uploading_label') : isData ? t('replace_video') : t('choose_file')}
        </button>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      </div>

      <div>
        <label className="text-xs text-gray-600 mb-1 block">{t('or_youtube_url')}</label>
        <input
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
          placeholder="https://youtube.com/watch?v=..."
          value={isData ? '' : (component.src ?? '')}
          onChange={(e) => onChange({ src: e.target.value })}
        />
      </div>

      {component.src && isEmbed && (
        <div className="relative group">
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
            <iframe
              src={getEmbedUrl(component.src) ?? ''}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
            />
          </div>
          <button
            onClick={() => onChange({ src: '' })}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/50 text-white rounded px-1.5 py-0.5 text-xs"
          >
            {t('remove')}
          </button>
        </div>
      )}

      {component.src && !isEmbed && !isData && (
        <div className="relative group">
          <video src={component.src} controls className="w-full rounded max-h-40" />
          <button
            onClick={() => onChange({ src: '' })}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/50 text-white rounded px-1.5 py-0.5 text-xs"
          >
            {t('remove')}
          </button>
        </div>
      )}

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
