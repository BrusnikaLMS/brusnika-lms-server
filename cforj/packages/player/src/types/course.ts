// course.json specification — App > Screens architecture

// ─── App ─────────────────────────────────────────────────────────────────────

export interface CourseApp {
  id: string
  version: string
  title: string
  description?: string
  thumbnail?: string
  language?: string
  settings: AppSettings
  state: StateMap
  screens: Screen[]
}

export interface AppSettings {
  showResults: boolean
  allowNavigation: 'free' | 'linear' | 'locked'
  completionCriteria: 'allScreens' | 'allQuizzes' | 'manual'
  passingScore?: number // 0-100
  removeBranding?: boolean
  customLogo?: string
}

// Global state variables (string keys, primitive values)
export type StateMap = Record<string, string | number | boolean>

// ─── Screen ──────────────────────────────────────────────────────────────────

export interface Screen {
  id: string
  title: string
  components: Component[]
  events?: ScreenEvent[]
  navigation?: ScreenNavigation
}

export interface ScreenNavigation {
  next?: string // screen id
  prev?: string // screen id
}

// ─── Components ──────────────────────────────────────────────────────────────

export type Component =
  | TextComponent
  | ImageComponent
  | VideoComponent
  | ButtonComponent
  | QuizSingleComponent
  | QuizMultiComponent
  | TrueFalseComponent
  | FlashcardsComponent
  | BranchingComponent
  | DragDropComponent
  | HotspotsComponent
  | DialogTrainerComponent
  | ScreenSimulationComponent
  | MatchingComponent
  | SequenceComponent
  | FillBlankComponent
  | ChecklistComponent

export interface BaseComponent {
  id: string
  disabled?: boolean
  hidden?: boolean
}

export interface TextComponent extends BaseComponent {
  type: 'text'
  content: string // TipTap HTML
}

export interface ImageComponent extends BaseComponent {
  type: 'image'
  src: string
  alt?: string
  caption?: string
}

export interface VideoComponent extends BaseComponent {
  type: 'video'
  src: string
  poster?: string
  caption?: string
  autoplay?: boolean
}

export interface ButtonComponent extends BaseComponent {
  type: 'button'
  label: string
  variant?: 'primary' | 'secondary'
  action?: Action // action to fire on click
}

export interface QuizSingleComponent extends BaseComponent {
  type: 'quiz-single'
  question: string
  options: string[]
  correct: number
  explanation?: string
  feedback?: { correct: string; incorrect: string }
}

export interface QuizMultiComponent extends BaseComponent {
  type: 'quiz-multi'
  question: string
  options: string[]
  correct: number[]
  explanation?: string
  feedback?: { correct: string; incorrect: string }
}

export interface TrueFalseComponent extends BaseComponent {
  type: 'true-false'
  statement: string
  correct: boolean
  explanation?: string
}

export interface FlashcardsComponent extends BaseComponent {
  type: 'flashcards'
  cards: Array<{ front: string; back: string }>
}

export interface BranchingComponent extends BaseComponent {
  type: 'branching'
  scenario: string
  choices: Array<{
    id: string
    label: string
    consequence?: string
    actions?: Action[]
  }>
}

export interface DragDropComponent extends BaseComponent {
  type: 'drag-drop'
  instruction: string
  items: Array<{ id: string; label: string }>
  targets: Array<{ id: string; label: string; acceptsItem: string }>
}

export interface HotspotsComponent extends BaseComponent {
  type: 'hotspots'
  image: string
  hotspots: Array<{
    id: string
    x: number // percent 0-100
    y: number // percent 0-100
    label: string
    content: string
  }>
}

export interface DialogCharacter {
  id: string
  name: string
  avatar?: string // URL or initials fallback
  color?: string  // accent color hex
}

export interface DialogMessage {
  id: string
  characterId: string
  text: string
}

export interface DialogChoice {
  id: string
  text: string
  nextMessageId?: string | null // null = end conversation
  isCorrect?: boolean
  feedback?: string
}

export interface DialogNode {
  messageId: string
  choices?: DialogChoice[] // if present — learner picks; otherwise auto-advances
}

export interface DialogTrainerComponent extends BaseComponent {
  type: 'dialog-trainer'
  title?: string
  characters: DialogCharacter[]
  // messages keyed by id for easy lookup
  messages: DialogMessage[]
  // conversation flow: messageId → DialogNode
  flow: Record<string, DialogNode>
  startMessageId: string
}

export interface SimulationStep {
  id: string
  image: string  // screenshot URL
  instruction: string
  hotspot?: { x: number; y: number; w: number; h: number } // percent-based click target
}

export interface ScreenSimulationComponent extends BaseComponent {
  type: 'screen-simulation'
  title?: string
  steps: SimulationStep[]
}

export interface MatchingComponent extends BaseComponent {
  type: 'matching'
  instruction: string
  pairs: Array<{ id: string; left: string; right: string }>
  feedback?: { correct: string; incorrect: string }
}

export interface SequenceComponent extends BaseComponent {
  type: 'sequence'
  instruction: string
  items: Array<{ id: string; label: string }> // items in correct order
  feedback?: { correct: string; incorrect: string }
}

export interface FillBlankComponent extends BaseComponent {
  type: 'fill-blank'
  text: string // text with {{blank}} placeholders
  blanks: Array<{ id: string; answer: string; alternatives?: string[] }>
  feedback?: { correct: string; incorrect: string }
}

export interface ChecklistComponent extends BaseComponent {
  type: 'checklist'
  title: string
  items: Array<{ id: string; label: string }>
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventTrigger =
  | 'VIDEO_END'
  | 'VIDEO_START'
  | 'QUIZ_CORRECT'
  | 'QUIZ_INCORRECT'
  | 'QUIZ_COMPLETE'
  | 'BUTTON_CLICK'
  | 'SCREEN_ENTER'
  | 'SCREEN_EXIT'
  | 'CHOICE_SELECTED'

export interface ScreenEvent {
  on: EventTrigger
  componentId?: string // if omitted — fires for any component
  condition?: EventCondition
  actions: Action[]
}

export interface EventCondition {
  state: string // state key
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte'
  value: string | number | boolean
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export type Action =
  | GoToScreenAction
  | SetStateAction
  | EnableComponentAction
  | DisableComponentAction
  | ShowComponentAction
  | HideComponentAction
  | ShowMessageAction

export interface GoToScreenAction {
  type: 'GO_TO_SCREEN'
  screenId: string
}

export interface SetStateAction {
  type: 'SET_STATE'
  key: string
  value: string | number | boolean | '+1' | '-1'
}

export interface EnableComponentAction {
  type: 'ENABLE_COMPONENT'
  componentId: string
}

export interface DisableComponentAction {
  type: 'DISABLE_COMPONENT'
  componentId: string
}

export interface ShowComponentAction {
  type: 'SHOW_COMPONENT'
  componentId: string
}

export interface HideComponentAction {
  type: 'HIDE_COMPONENT'
  componentId: string
}

export interface ShowMessageAction {
  type: 'SHOW_MESSAGE'
  message: string
  variant?: 'info' | 'success' | 'error'
}

// ─── Player state ─────────────────────────────────────────────────────────────

export interface PlayerProgress {
  appId: string
  currentScreenId: string
  visitedScreens: string[]
  completedScreens: string[]
  quizAnswers: Record<string, unknown>
  screenTimes: Record<string, number>
  state: StateMap
  score: number
  completed: boolean
  startedAt: string
  updatedAt: string
}
