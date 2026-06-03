import { Router } from 'express'
import { loadQuestionBank } from '../data/loadQuestionBank.js'
import {
  averageDimensionScores,
  buildScenarioResult,
} from '../services/dimensions.js'
import {
  findOption,
  findQuestion,
  isOptionId,
} from '../services/questionLookup.js'
import type { StoredAnswer } from '../types/answers.js'
import type {
  DimensionAveragesRequestBody,
  QuizQuestion,
  ScenarioResultRequestBody,
  ScenarioSummary,
  SubmitAnswerRequestBody,
} from '../types/api.js'
import {
  DIMENSION_KEYS,
  type DimensionScores,
  type QuestionOption,
  type Scenario,
} from '../types/questionBank.js'

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

function shuffleOptions(options: QuestionOption[]): QuestionOption[] {
  const shuffled = [...options]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentOption = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = currentOption
  }
  return shuffled
}

function toQuizQuestions(scenario: Scenario): QuizQuestion[] {
  return scenario.questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: shuffleOptions(question.options).map((option) => ({
      id: option.id,
      text: option.text,
    })),
  }))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseDimensionScores(raw: unknown): DimensionScores | null {
  if (!isRecord(raw)) {
    return null
  }

  const scores = {} as DimensionScores
  for (const key of DIMENSION_KEYS) {
    const value = raw[key]
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      return null
    }
    if (value < 0 || value > 5) {
      return null
    }
    scores[key] = value
  }

  return scores
}

function parseStoredAnswer(
  raw: unknown,
  scenarioId: string,
): StoredAnswer | null {
  if (!isRecord(raw)) {
    return null
  }

  const userId = raw.userId
  const questionId = raw.questionId
  const selectedOptionId = raw.selectedOptionId
  const selectedOptionText = raw.selectedOptionText
  const timestamp = raw.timestamp

  if (
    typeof userId !== 'string' ||
    userId.trim() === '' ||
    typeof questionId !== 'string' ||
    questionId.trim() === '' ||
    typeof selectedOptionId !== 'string' ||
    !isOptionId(selectedOptionId) ||
    typeof selectedOptionText !== 'string' ||
    selectedOptionText.trim() === '' ||
    typeof timestamp !== 'string' ||
    timestamp.trim() === ''
  ) {
    return null
  }

  const scores = parseDimensionScores(raw.scores)
  if (!scores) {
    return null
  }

  if (raw.scenarioId !== undefined && raw.scenarioId !== scenarioId) {
    return null
  }

  return {
    userId: userId.trim(),
    scenarioId,
    questionId: questionId.trim(),
    selectedOptionId,
    selectedOptionText: selectedOptionText.trim(),
    scores,
    timestamp: timestamp.trim(),
  }
}

function parseStoredAnswersBody(
  body: unknown,
  scenarioId: string,
): { userId: string; answers: StoredAnswer[] } | null {
  if (!isRecord(body)) {
    return null
  }

  const userId = body.userId
  const answersRaw = body.answers

  if (typeof userId !== 'string' || userId.trim() === '') {
    return null
  }

  if (!Array.isArray(answersRaw) || answersRaw.length === 0) {
    return null
  }

  const answers: StoredAnswer[] = []
  for (const raw of answersRaw) {
    const parsed = parseStoredAnswer(raw, scenarioId)
    if (!parsed) {
      return null
    }
    answers.push(parsed)
  }

  const questionIds = new Set<string>()
  for (const answer of answers) {
    if (questionIds.has(answer.questionId)) {
      return null
    }
    questionIds.add(answer.questionId)
  }

  return { userId: userId.trim(), answers }
}

function validateAnswersForScenario(
  scenario: Scenario,
  answers: StoredAnswer[],
): boolean {
  const questionIds = new Set(scenario.questions.map((question) => question.id))

  for (const answer of answers) {
    if (answer.scenarioId !== scenario.id) {
      return false
    }
    if (!questionIds.has(answer.questionId)) {
      return false
    }

    const question = findQuestion(scenario, answer.questionId)
    if (!question) {
      return false
    }

    const option = findOption(question, answer.selectedOptionId)
    if (!option) {
      return false
    }

    if (option.text !== answer.selectedOptionText) {
      return false
    }

    for (const key of DIMENSION_KEYS) {
      if (option.scores[key] !== answer.scores[key]) {
        return false
      }
    }
  }

  return true
}

function parseSubmitAnswerBody(body: unknown): SubmitAnswerRequestBody | null {
  if (!isRecord(body)) {
    return null
  }

  const userId = body.userId
  const questionId = body.questionId
  const selectedOptionId = body.selectedOptionId

  if (
    typeof userId !== 'string' ||
    userId.trim() === '' ||
    typeof questionId !== 'string' ||
    questionId.trim() === '' ||
    typeof selectedOptionId !== 'string' ||
    !isOptionId(selectedOptionId)
  ) {
    return null
  }

  return {
    userId: userId.trim(),
    questionId: questionId.trim(),
    selectedOptionId,
  }
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

  router.post('/scenarios/:scenarioId/answers', (req, res) => {
    const scenario = findScenario(req.params.scenarioId)
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' })
      return
    }

    const body = parseSubmitAnswerBody(req.body)
    if (!body) {
      res.status(400).json({ error: 'Invalid submit answer body' })
      return
    }

    const question = findQuestion(scenario, body.questionId)
    if (!question) {
      res.status(404).json({ error: 'Question not found' })
      return
    }

    const option = findOption(question, body.selectedOptionId)
    if (!option) {
      res.status(400).json({ error: 'Invalid selected option' })
      return
    }

    res.json({
      questionId: question.id,
      selectedOptionId: option.id,
      selectedOptionText: option.text,
      scores: option.scores,
      feedback: option.feedback,
      explanation: question.explanation,
    })
  })

  router.post('/scenarios/:scenarioId/dimension-averages', (req, res) => {
    const scenario = findScenario(req.params.scenarioId)
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' })
      return
    }

    const parsed = parseStoredAnswersBody(
      req.body as DimensionAveragesRequestBody,
      scenario.id,
    )
    if (!parsed) {
      res.status(400).json({ error: 'Invalid answers payload' })
      return
    }

    if (!validateAnswersForScenario(scenario, parsed.answers)) {
      res.status(400).json({ error: 'Invalid answers payload' })
      return
    }

    try {
      const averages = averageDimensionScores(parsed.answers)
      res.json({ averages })
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_ANSWERS') {
        res.status(400).json({ error: 'No answers provided' })
        return
      }
      throw error
    }
  })

  router.post('/scenarios/:scenarioId/result', (req, res) => {
    const scenario = findScenario(req.params.scenarioId)
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' })
      return
    }

    const parsed = parseStoredAnswersBody(
      req.body as ScenarioResultRequestBody,
      scenario.id,
    )
    if (!parsed) {
      res.status(400).json({ error: 'Invalid answers payload' })
      return
    }

    if (!validateAnswersForScenario(scenario, parsed.answers)) {
      res.status(400).json({ error: 'Invalid answers payload' })
      return
    }

    try {
      res.json(buildScenarioResult(parsed.answers))
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_ANSWERS') {
        res.status(400).json({ error: 'No answers provided' })
        return
      }
      throw error
    }
  })

  return router
}
