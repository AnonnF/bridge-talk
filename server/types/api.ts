import type { StoredAnswer } from './answers.js'
import type {
  DimensionKey,
  DimensionScores,
  ScenarioLevel,
} from './questionBank.js'

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

export type SubmitAnswerRequestBody = {
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

export type DimensionAveragesRequestBody = {
  userId: string
  answers: StoredAnswer[]
}

export type DimensionAveragesResponse = {
  averages: DimensionScores
}

export type ScenarioResultRequestBody = {
  userId: string
  answers: StoredAnswer[]
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

export type { StoredAnswer } from './answers.js'
