import { useState } from 'react'
import type { DialogTrainerComponent as DialogTrainerType } from '../types/course'
import { usePlayerT } from '../i18n'

interface Props {
  component: DialogTrainerType
}

export function DialogTrainerComponent({ component }: Props) {
  const t = usePlayerT()
  const { characters, messages, flow, startMessageId, title } = component
  const [currentMessageId, setCurrentMessageId] = useState(startMessageId)
  const [history, setHistory] = useState<string[]>([startMessageId])
  const [done, setDone] = useState(false)
  const [choiceResult, setChoiceResult] = useState<{ feedback?: string; isCorrect?: boolean } | null>(null)

  const charMap = Object.fromEntries(characters.map((c) => [c.id, c]))
  const msgMap = Object.fromEntries(messages.map((m) => [m.id, m]))

  const currentMessage = msgMap[currentMessageId]
  const currentNode = flow[currentMessageId]
  const currentChar = currentMessage ? charMap[currentMessage.characterId] : undefined

  function pickChoice(choice: { id: string; text: string; nextMessageId?: string | null; isCorrect?: boolean; feedback?: string }) {
    if (choice.feedback || choice.isCorrect !== undefined) {
      setChoiceResult({ feedback: choice.feedback, isCorrect: choice.isCorrect })
      setTimeout(() => {
        setChoiceResult(null)
        advance(choice.nextMessageId ?? null)
      }, 1800)
    } else {
      advance(choice.nextMessageId ?? null)
    }
  }

  function advance(nextId: string | null) {
    if (!nextId) {
      setDone(true)
      return
    }
    setHistory((h) => [...h, nextId])
    setCurrentMessageId(nextId)
  }

  function restart() {
    setCurrentMessageId(startMessageId)
    setHistory([startMessageId])
    setDone(false)
    setChoiceResult(null)
  }

  function getInitials(name: string) {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  function Avatar({ char }: { char: typeof currentChar }) {
    if (!char) return null
    if (char.avatar) {
      return (
        <img
          src={char.avatar}
          alt={char.name}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
      )
    }
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: char.color ?? '#6366f1' }}
      >
        {getInitials(char.name)}
      </div>
    )
  }

  if (done) {
    return (
      <div className="cs-dialog-trainer cs-dialog-trainer--done rounded-xl border border-gray-200 bg-white p-6 text-center space-y-3">
        {title && <h3 className="text-sm font-semibold text-gray-700">{title}</h3>}
        <div className="text-2xl">✅</div>
        <p className="text-sm text-gray-600">Conversation complete.</p>
        <button
          onClick={restart}
          className="mt-2 px-4 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Restart
        </button>
      </div>
    )
  }

  return (
    <div className="cs-dialog-trainer rounded-xl border border-gray-200 bg-white overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</span>
        </div>
      )}

      {/* Message history */}
      <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
        {history.map((msgId) => {
          const msg = msgMap[msgId]
          if (!msg) return null
          const char = charMap[msg.characterId]
          const isPlayer = msg.characterId === 'player'
          return (
            <div key={msgId} className={`flex gap-2.5 ${isPlayer ? 'flex-row-reverse' : ''}`}>
              <Avatar char={char} />
              <div className={`max-w-[75%] ${isPlayer ? 'items-end' : 'items-start'} flex flex-col`}>
                {char && <span className="text-[10px] text-gray-400 mb-0.5 font-medium">{char.name}</span>}
                <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  isPlayer
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Choice result feedback */}
      {choiceResult && (
        <div className={`mx-4 mb-2 px-3 py-2 rounded-lg text-xs font-medium ${
          choiceResult.isCorrect === false
            ? 'bg-red-50 text-red-700 border border-red-200'
            : choiceResult.isCorrect === true
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {choiceResult.isCorrect === true && '✓ '}
          {choiceResult.isCorrect === false && '✗ '}
          {choiceResult.feedback ?? (choiceResult.isCorrect ? t('correct') : t('try_again'))}
        </div>
      )}

      {/* Choices */}
      {currentNode?.choices && !choiceResult && (
        <div className="px-4 pb-4 space-y-2">
          {currentNode.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => pickChoice(choice)}
              className="w-full text-left px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 hover:bg-primary/5 hover:border-primary/40 transition-colors"
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}

      {/* Auto-advance */}
      {currentNode && !currentNode.choices && !choiceResult && (
        <div className="px-4 pb-4">
          <button
            onClick={() => advance(null)}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 text-center"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
