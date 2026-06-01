import type {
  OptionId,
  Question,
  QuestionOption,
  Scenario,
} from '../types/questionBank.js'

export function findQuestion(
  scenario: Scenario,
  questionId: string,
): Question | undefined {
  return scenario.questions.find((question) => question.id === questionId)
}

export function findOption(
  question: Question,
  optionId: string,
): QuestionOption | undefined {
  return question.options.find((option) => option.id === optionId)
}

export function isOptionId(value: string): value is OptionId {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D'
}
