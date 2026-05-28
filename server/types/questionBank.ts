export type ScenarioLevel = 'beginner' | 'intermediate' | 'advanced'

export type QuestionOption = {
  id: string
  text: string
}

export type Question = {
  id: string
  prompt: string
  options: QuestionOption[]
  correctOptionId: string
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
