import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  Question,
  QuestionBank,
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

function parseQuestion(raw: unknown, context: string): Question {
  if (!isRecord(raw)) {
    throw new Error(`${context}: question must be an object`)
  }

  const optionsRaw = raw.options
  if (!Array.isArray(optionsRaw) || optionsRaw.length !== 4) {
    throw new Error(`${context}: "options" must be an array of 4 strings`)
  }

  const options = optionsRaw.map((option, index) => {
    if (typeof option !== 'string' || option.trim() === '') {
      throw new Error(
        `${context}.options[${index}]: option must be a non-empty string`,
      )
    }
    return option
  })

  const optionTexts = new Set<string>()
  for (const option of options) {
    if (optionTexts.has(option)) {
      throw new Error(`${context}: duplicate option text "${option}"`)
    }
    optionTexts.add(option)
  }

  return {
    id: requireString(raw, 'id', context),
    prompt: requireString(raw, 'prompt', context),
    options,
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
