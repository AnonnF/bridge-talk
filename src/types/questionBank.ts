export type ScenarioLevel = 'beginner' | 'intermediate' | 'advanced'

export type DimensionKey =
  | 'clarity'
  | 'empathy'
  | 'appropriateness'
  | 'confidence'
  | 'safety'

export type DimensionScores = Record<DimensionKey, number>

export type ScenarioSummary = {
  id: string
  title: string
  description: string
  level: ScenarioLevel
  questionCount: number
}

export type QuizOption = {
  id: string
  text: string
}

export type QuizQuestion = {
  id: string
  prompt: string
  options: QuizOption[]
}

export type QuizQuestionsResponse = {
  questions: QuizQuestion[]
}

export type StoredAnswer = {
  userId: string
  scenarioId: string
  questionId: string
  selectedOptionId: string
  selectedOptionText: string
  scores: DimensionScores
  timestamp: string
}

export type SubmitAnswerRequest = {
  userId: string
  questionId: string
  selectedOptionId: string
}

export type SubmitAnswerResponse = {
  questionId: string
  selectedOptionId: string
  selectedOptionText: string
  scores: DimensionScores
  feedback: string
  explanation: string
}

export type DimensionAveragesResponse = {
  averages: DimensionScores
}

export type ScenarioResultResponse = {
  averages: DimensionScores
  strongest: DimensionKey
  weakest: DimensionKey
  strongestLabel: string
  weakestLabel: string
  summary: string
  suggestions: string[]
}

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  clarity: 'Clarity',
  empathy: 'Empathy',
  appropriateness: 'Appropriateness',
  confidence: 'Confidence',
  safety: 'Safety',
}
