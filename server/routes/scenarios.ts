import { Router } from 'express'
import { loadQuestionBank } from '../data/loadQuestionBank.js'
import type {
  CheckAnswerRequestBody,
  QuestionResult,
  QuizQuestion,
  ScenarioSummary,
  SubmitAnswer,
  SubmitRequestBody,
} from '../types/api.js'
import type { Scenario } from '../types/questionBank.js'

function findScenario(scenarioId: string): Scenario | undefined {
  const bank = loadQuestionBank()
  return bank.scenarios.find((scenario) => scenario.id === scenarioId)
}

function toScenarioSummary(scenario: Scenario): ScenarioSummary {
  return {
    id: scenario.id,
    title: scenario.title,
    description: scenario.description,
    level: scenario.level,
    questionCount: scenario.questions.length,
  }
}

function toQuizQuestions(scenario: Scenario): QuizQuestion[] {
  return scenario.questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options,
  }))
}

function isSubmitAnswer(value: unknown): value is SubmitAnswer {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.questionId === 'string' &&
    record.questionId.trim() !== '' &&
    typeof record.selectedOptionId === 'string' &&
    record.selectedOptionId.trim() !== ''
  )
}

function parseSubmitBody(body: unknown): SubmitAnswer[] | null {
  if (typeof body !== 'object' || body === null) {
    return null
  }
  const answers = (body as SubmitRequestBody).answers
  if (!Array.isArray(answers) || answers.length === 0) {
    return null
  }
  if (!answers.every(isSubmitAnswer)) {
    return null
  }
  return answers
}

function parseCheckAnswerBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return null
  }
  const selectedOptionId = (body as CheckAnswerRequestBody).selectedOptionId
  if (typeof selectedOptionId !== 'string' || selectedOptionId.trim() === '') {
    return null
  }
  return selectedOptionId
}

function gradeQuestion(
  scenario: Scenario,
  questionId: string,
  selectedOptionId: string,
): QuestionResult | null {
  const question = scenario.questions.find(
    (candidate) => candidate.id === questionId,
  )
  if (!question) {
    return null
  }

  const selectedOptionExists = question.options.some(
    (option) => option.id === selectedOptionId,
  )
  if (!selectedOptionExists) {
    throw new Error('UNKNOWN_OPTION_ID')
  }

  return {
    questionId: question.id,
    correct: selectedOptionId === question.correctOptionId,
    selectedOptionId,
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
  }
}

function gradeSubmission(
  scenario: Scenario,
  answers: SubmitAnswer[],
): QuestionResult[] {
  const answersByQuestionId = new Map<string, string>()
  for (const answer of answers) {
    if (answersByQuestionId.has(answer.questionId)) {
      throw new Error('DUPLICATE_QUESTION_ID')
    }
    answersByQuestionId.set(answer.questionId, answer.selectedOptionId)
  }

  const questionIds = new Set(scenario.questions.map((question) => question.id))
  for (const questionId of answersByQuestionId.keys()) {
    if (!questionIds.has(questionId)) {
      throw new Error('UNKNOWN_QUESTION_ID')
    }
  }

  return scenario.questions.map((question) => {
    const selectedOptionId = answersByQuestionId.get(question.id) ?? ''
    const result = gradeQuestion(scenario, question.id, selectedOptionId)
    if (!result) {
      throw new Error('UNKNOWN_QUESTION_ID')
    }
    return result
  })
}

export function createScenariosRouter() {
  const router = Router()

  router.get('/scenarios', (_req, res) => {
    const bank = loadQuestionBank()
    res.json(bank.scenarios.map(toScenarioSummary))
  })

  router.get('/scenarios/:scenarioId/questions', (req, res) => {
    const scenario = findScenario(req.params.scenarioId)
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' })
      return
    }
    res.json({ questions: toQuizQuestions(scenario) })
  })

  router.post(
    '/scenarios/:scenarioId/questions/:questionId/check',
    (req, res) => {
      const scenario = findScenario(req.params.scenarioId)
      if (!scenario) {
        res.status(404).json({ error: 'Scenario not found' })
        return
      }

      const selectedOptionId = parseCheckAnswerBody(req.body)
      if (!selectedOptionId) {
        res.status(400).json({ error: 'Invalid check body' })
        return
      }

      let result: QuestionResult | null
      try {
        result = gradeQuestion(
          scenario,
          req.params.questionId,
          selectedOptionId,
        )
      } catch (error) {
        if (error instanceof Error && error.message === 'UNKNOWN_OPTION_ID') {
          res.status(400).json({ error: 'Invalid selected option' })
          return
        }
        throw error
      }

      if (!result) {
        res.status(404).json({ error: 'Question not found' })
        return
      }

      res.json(result)
    },
  )

  router.post('/scenarios/:scenarioId/submit', (req, res) => {
    const scenario = findScenario(req.params.scenarioId)
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' })
      return
    }

    const answers = parseSubmitBody(req.body)
    if (!answers) {
      res.status(400).json({ error: 'Invalid submit body' })
      return
    }

    if (answers.length !== scenario.questions.length) {
      res.status(400).json({
        error: 'Submit one answer per question',
      })
      return
    }

    let results: QuestionResult[]
    try {
      results = gradeSubmission(scenario, answers)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'DUPLICATE_QUESTION_ID' ||
          error.message === 'UNKNOWN_QUESTION_ID')
      ) {
        res.status(400).json({ error: 'Invalid answers payload' })
        return
      }
      throw error
    }

    const score = results.filter((result) => result.correct).length
    res.json({
      score,
      total: scenario.questions.length,
      results,
    })
  })

  return router
}
