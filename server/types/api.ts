import type { ScenarioLevel } from './questionBank.js'

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
  options: string[]
}

export type SubmitAnswer = {
  questionId: string
  selectedOptionText: string
}

export type SubmitRequestBody = {
  answers: SubmitAnswer[]
}

export type CheckAnswerRequestBody = {
  selectedOptionText: string
}

export type QuestionResult = {
  questionId: string
  correct: boolean
  selectedOptionText: string
  correctOptionText: string
  explanation: string
}

export type SubmitResponse = {
  score: number
  total: number
  results: QuestionResult[]
}
