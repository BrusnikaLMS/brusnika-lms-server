import { useState } from 'react'
import type { BranchingComponent, EventTrigger } from '../types/course'

interface Props {
  component: BranchingComponent
  onNavigate?: (screenId: string) => void
  onEvent?: (trigger: EventTrigger) => void
}

export function BranchingComponent({ component, onNavigate, onEvent }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)
  const choice = component.choices.find((c) => c.id === chosen)

  function handleChoice(choiceId: string) {
    setChosen(choiceId)
    onEvent?.('CHOICE_SELECTED')
    const c = component.choices.find((x) => x.id === choiceId)
    if (c?.actions) {
      c.actions.forEach((action) => {
        if (action.type === 'GO_TO_SCREEN') onNavigate?.(action.screenId)
      })
    }
  }

  return (
    <div className="cs-component cs-component--branching">
      <p className="cs-branching__scenario">{component.scenario}</p>
      {!chosen ? (
        <ul className="cs-branching__choices">
          {component.choices.map((c) => (
            <li key={c.id}>
              <button
                className="cs-branching__choice"
                onClick={() => handleChoice(c.id)}
                disabled={component.disabled}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="cs-branching__consequence">
          {choice?.consequence && <p>{choice.consequence}</p>}
          <button className="cs-branching__reset" onClick={() => setChosen(null)}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
