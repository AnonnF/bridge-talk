export type ScenarioLevel = 'beginner' | 'intermediate' | 'advanced'

export const DIMENSION_KEYS = [
  'clarity',
  'empathy',
  'appropriateness',
  'confidence',
  'safety',
] as const

export type DimensionKey = (typeof DIMENSION_KEYS)[number]

export type DimensionScores = Record<DimensionKey, number>

export type OptionId = 'A' | 'B' | 'C' | 'D'

export type QuestionOption = {
  id: OptionId
  text: string
  scores: DimensionScores
  feedback: string
}

export type Question = {
  id: string
  prompt: string
  options: QuestionOption[]
  explanation: string
}

export type Scenario = {
  id: string
  title: string
  description: string
  level: ScenarioLevel
  questions: Question[]
}

export type QuestionBank = {
  scenarios: Scenario[]
}
