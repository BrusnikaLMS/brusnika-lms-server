import type { TextComponent } from '../types/course'

interface Props {
  component: TextComponent
}

export function TextComponent({ component }: Props) {
  return (
    <div
      className="cs-component cs-component--text"
      dangerouslySetInnerHTML={{ __html: component.content }}
    />
  )
}
