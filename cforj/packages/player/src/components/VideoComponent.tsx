import type { VideoComponent } from '../types/course'

interface Props {
  component: VideoComponent
  onEnd?: () => void
  onStart?: () => void
}

function getEmbedUrl(src: string): string | null {
  if (!src) return null

  // YouTube
  const ytMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Rutube
  const rtMatch = src.match(/rutube\.ru\/video\/([\w]+)/)
  if (rtMatch) return `https://rutube.ru/play/embed/${rtMatch[1]}`

  // VK Video
  const vkMatch = src.match(/vk\.com\/video(-?\d+_\d+)/)
  if (vkMatch) return `https://vk.com/video_ext.php?oid=${vkMatch[1].split('_')[0]}&id=${vkMatch[1].split('_')[1]}`

  return null
}

export function VideoComponent({ component, onEnd, onStart }: Props) {
  const embedUrl = getEmbedUrl(component.src ?? '')

  if (embedUrl) {
    return (
      <figure className="cs-component cs-component--video">
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
          <iframe
            src={embedUrl}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        </div>
        {component.caption && <figcaption>{component.caption}</figcaption>}
      </figure>
    )
  }

  return (
    <figure className="cs-component cs-component--video">
      <video
        src={component.src}
        poster={component.poster}
        controls
        autoPlay={component.autoplay ?? false}
        onEnded={onEnd}
        onPlay={onStart}
        style={{ opacity: component.disabled ? 0.5 : 1 }}
      />
      {component.caption && <figcaption>{component.caption}</figcaption>}
    </figure>
  )
}
