import type { QuestionOption, ScenarioLevel } from './questionBank.js'

export type ScenarioSummary = {
  id: string
  title: string
  description: string
  level: ScenarioLevel
  questionCount: number
}

export type QuizQuestion = {
  id: string
  prompt: string
  options: QuestionOption[]
}

export type SubmitAnswer = {
  questionId: string
  selectedOptionId: string
}

export type SubmitRequestBody = {
  answers: SubmitAnswer[]
}

export type QuestionResult = {
  questionId: string
  correct: boolean
  selectedOptionId: string
  correctOptionId: string
  explanation: string
}

export type SubmitResponse = {
  score: number
  total: number
  results: QuestionResult[]
}
