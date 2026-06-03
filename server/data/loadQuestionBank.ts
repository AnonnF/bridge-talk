import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DIMENSION_KEYS,
  type DimensionKey,
  type DimensionScores,
  type OptionId,
  type Question,
  type QuestionBank,
  type QuestionOption,
  type Scenario,
  type ScenarioLevel,
} from '../types/questionBank.js'

const SCENARIO_LEVELS: ScenarioLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
]

const OPTION_IDS: OptionId[] = ['A', 'B', 'C', 'D']

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

function parseDimensionScores(raw: unknown, context: string): DimensionScores {
  if (!isRecord(raw)) {
    throw new Error(`${context}: "scores" must be an object`)
  }

  const scores = {} as DimensionScores
  for (const key of DIMENSION_KEYS) {
    const value = raw[key]
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw new Error(`${context}: "scores.${key}" must be an integer`)
    }
    if (value < 0 || value > 5) {
      throw new Error(`${context}: "scores.${key}" must be between 0 and 5`)
    }
    scores[key as DimensionKey] = value
  }

  return scores
}

function parseQuestionOption(raw: unknown, context: string): QuestionOption {
  if (!isRecord(raw)) {
    throw new Error(`${context}: option must be an object`)
  }

  const id = requireString(raw, 'id', context)
  if (!OPTION_IDS.includes(id as OptionId)) {
    throw new Error(`${context}: "id" must be one of ${OPTION_IDS.join(', ')}`)
  }

  return {
    id: id as OptionId,
    text: requireString(raw, 'text', context),
    scores: parseDimensionScores(raw.scores, context),
    feedback: requireString(raw, 'feedback', context),
  }
}

function parseQuestion(raw: unknown, context: string): Question {
  if (!isRecord(raw)) {
    throw new Error(`${context}: question must be an object`)
  }

  const optionsRaw = raw.options
  if (!Array.isArray(optionsRaw) || optionsRaw.length !== 4) {
    throw new Error(
      `${context}: "options" must be an array of 4 option objects`,
    )
  }

  const options = optionsRaw.map((option, index) =>
    parseQuestionOption(option, `${context}.options[${index}]`),
  )

  const optionIds = new Set<OptionId>()
  const optionTexts = new Set<string>()
  for (const option of options) {
    if (optionIds.has(option.id)) {
      throw new Error(`${context}: duplicate option id "${option.id}"`)
    }
    optionIds.add(option.id)

    if (optionTexts.has(option.text)) {
      throw new Error(`${context}: duplicate option text "${option.text}"`)
    }
    optionTexts.add(option.text)
  }

  for (const expectedId of OPTION_IDS) {
    if (!optionIds.has(expectedId)) {
      throw new Error(`${context}: missing option id "${expectedId}"`)
    }
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

export function clearQuestionBankCache(): void {
  cachedBank = null
}
