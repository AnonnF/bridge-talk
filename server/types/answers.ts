import type { DimensionScores } from './questionBank.js'

export type StoredAnswer = {
  userId: string
  scenarioId: string
  questionId: string
  selectedOptionId: string
  selectedOptionText: string
  scores: DimensionScores
  timestamp: string
}
