export type ScenarioLevel = 'beginner' | 'intermediate' | 'advanced'

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

export type CheckAnswerRequest = {
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

export type QuizQuestionsResponse = {
  questions: QuizQuestion[]
}
