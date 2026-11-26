import type { ButtonComponent } from '../types/course'

interface Props {
  component: ButtonComponent
  onClick?: () => void
}

export function ButtonComponent({ component, onClick }: Props) {
  return (
    <div className="cs-component cs-component--button">
      <button
        className={`cs-btn cs-btn--${component.variant ?? 'primary'}`}
        disabled={component.disabled ?? false}
        onClick={onClick}
      >
        {component.label}
      </button>
    </div>
  )
}
