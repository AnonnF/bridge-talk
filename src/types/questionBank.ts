export type ScenarioLevel = 'beginner' | 'intermediate' | 'advanced'

export type DimensionKey =
  | 'clarity'
  | 'empathy'
  | 'appropriateness'
  | 'confidence'
  | 'safety'

export type DimensionScores = Record<DimensionKey, number>

export type ScoreBand = {
  min: number
  max: number
  label: string
  color: string
}

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

export const DIMENSION_DESCRIPTIONS: Record<DimensionKey, string> = {
  clarity: 'How easy your message is to understand.',
  empathy: "How well you acknowledge the other person's perspective.",
  appropriateness:
    'How well your response fits the situation and relationship.',
  confidence: 'How clearly and steadily you express yourself.',
  safety:
    'How well your response avoids escalation, harm, or unnecessary risk.',
}

export const SCORE_BANDS: ScoreBand[] = [
  { min: 0, max: 2, label: 'Needs support', color: '#f6ebe8' },
  { min: 2, max: 3, label: 'Developing', color: '#f7f1df' },
  { min: 3, max: 4, label: 'Fair', color: '#eef2e4' },
  { min: 4, max: 4.5, label: 'Strong', color: '#e8f1ea' },
  { min: 4.5, max: 5, label: 'Excellent', color: '#e7f0f2' },
]

export function getScoreBand(score: number): ScoreBand {
  if (!Number.isFinite(score)) return SCORE_BANDS[0]

  const clampedScore = Math.min(Math.max(score, 0), 5)
  return (
    SCORE_BANDS.find((band, index) => {
      const isLast = index === SCORE_BANDS.length - 1
      return (
        clampedScore >= band.min &&
        (isLast ? clampedScore <= band.max : clampedScore < band.max)
      )
    }) ?? SCORE_BANDS[0]
  )
}

export function formatScore(score: number): string {
  return score.toFixed(1)
}

export function scoreBandRangeLabel(band: ScoreBand): string {
  return `${band.min}-${band.max}`
}
