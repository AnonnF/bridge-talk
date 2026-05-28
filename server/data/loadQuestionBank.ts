import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  Question,
  QuestionBank,
  QuestionOption,
  Scenario,
  ScenarioLevel,
} from '../types/questionBank.js'

const SCENARIO_LEVELS: ScenarioLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
]

const dataDir = dirname(fileURLToPath(import.meta.url))

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const value = record[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${context}: "${key}" must be a non-empty string`)
  }
  return value
}

function parseOption(raw: unknown, context: string): QuestionOption {
  if (!isRecord(raw)) {
    throw new Error(`${context}: option must be an object`)
  }
  return {
    id: requireString(raw, 'id', context),
    text: requireString(raw, 'text', context),
  }
}

function parseQuestion(raw: unknown, context: string): Question {
  if (!isRecord(raw)) {
    throw new Error(`${context}: question must be an object`)
  }

  const optionsRaw = raw.options
  if (!Array.isArray(optionsRaw) || optionsRaw.length < 2) {
    throw new Error(
      `${context}: "options" must be an array with at least 2 items`,
    )
  }

  const options = optionsRaw.map((option, index) =>
    parseOption(option, `${context}.options[${index}]`),
  )

  const optionIds = new Set<string>()
  for (const option of options) {
    if (optionIds.has(option.id)) {
      throw new Error(`${context}: duplicate option id "${option.id}"`)
    }
    optionIds.add(option.id)
  }

  const correctOptionId = requireString(raw, 'correctOptionId', context)
  if (!optionIds.has(correctOptionId)) {
    throw new Error(
      `${context}: "correctOptionId" must match one of the option ids`,
    )
  }

  return {
    id: requireString(raw, 'id', context),
    prompt: requireString(raw, 'prompt', context),
    options,
    correctOptionId,
    explanation: requireString(raw, 'explanation', context),
  }
}

function parseScenario(raw: unknown, index: number): Scenario {
  const context = `scenarios[${index}]`
  if (!isRecord(raw)) {
    throw new Error(`${context}: scenario must be an object`)
  }

  const level = requireString(raw, 'level', context)
  if (!SCENARIO_LEVELS.includes(level as ScenarioLevel)) {
    throw new Error(
      `${context}: "level" must be one of ${SCENARIO_LEVELS.join(', ')}`,
    )
  }

  const questionsRaw = raw.questions
  if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
    throw new Error(`${context}: "questions" must be a non-empty array`)
  }

  const questions = questionsRaw.map((question, questionIndex) =>
    parseQuestion(question, `${context}.questions[${questionIndex}]`),
  )

  const questionIds = new Set<string>()
  for (const question of questions) {
    if (questionIds.has(question.id)) {
      throw new Error(`${context}: duplicate question id "${question.id}"`)
    }
    questionIds.add(question.id)
  }

  return {
    id: requireString(raw, 'id', context),
    title: requireString(raw, 'title', context),
    description: requireString(raw, 'description', context),
    level: level as ScenarioLevel,
    questions,
  }
}

function parseQuestionBank(raw: unknown): QuestionBank {
  if (!isRecord(raw)) {
    throw new Error('Question bank root must be an object')
  }

  const scenariosRaw = raw.scenarios
  if (!Array.isArray(scenariosRaw) || scenariosRaw.length === 0) {
    throw new Error('"scenarios" must be a non-empty array')
  }

  const scenarios = scenariosRaw.map((scenario, index) =>
    parseScenario(scenario, index),
  )

  const scenarioIds = new Set<string>()
  for (const scenario of scenarios) {
    if (scenarioIds.has(scenario.id)) {
      throw new Error(`duplicate scenario id "${scenario.id}"`)
    }
    scenarioIds.add(scenario.id)
  }

  return { scenarios }
}

let cachedBank: QuestionBank | null = null

export function loadQuestionBank(): QuestionBank {
  if (cachedBank) {
    return cachedBank
  }

  const filePath = join(dataDir, 'questionBank.json')
  const fileContents = readFileSync(filePath, 'utf8')
  const parsed: unknown = JSON.parse(fileContents)
  cachedBank = parseQuestionBank(parsed)
  return cachedBank
}
