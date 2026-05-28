export type ScenarioLevel = 'beginner' | 'intermediate' | 'advanced'

export type Question = {
  id: string
  prompt: string
  options: string[]
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
