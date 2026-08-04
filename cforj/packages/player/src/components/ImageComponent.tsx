import type { ImageComponent } from '../types/course'

interface Props {
  component: ImageComponent
}

export function ImageComponent({ component }: Props) {
  return (
    <figure className="cs-component cs-component--image">
      <img src={component.src} alt={component.alt ?? ''} />
      {component.caption && <figcaption>{component.caption}</figcaption>}
    </figure>
  )
}
