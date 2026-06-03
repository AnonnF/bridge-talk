/**
 * Post-migration polish for known option patterns.
 * Run: node scripts/polish-question-bank.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const UNCERTAINTY_FEEDBACK =
  'It is okay not to know everything. You could add one small detail or ask a short question so the other person can help you.'

const UNCERTAINTY_SCORES = {
  clarity: 2,
  empathy: 2,
  appropriateness: 3,
  confidence: 2,
  safety: 4,
}

const DEMANDING_SOFT_SCORES = {
  clarity: 2,
  empathy: 1,
  appropriateness: 2,
  confidence: 2,
  safety: 2,
}

const DEMANDING_SOFT_FEEDBACK =
  'This is a bit vague or direct. Naming what you need (for example, a check-up or more time) can sound clearer and more respectful.'

const root = dirname(fileURLToPath(import.meta.url))
const path = join(root, '../server/data/questionBank.json')
const bank = JSON.parse(readFileSync(path, 'utf8'))

let changes = 0

for (const scenario of bank.scenarios) {
  for (const question of scenario.questions) {
    for (const option of question.options) {
      const text = option.text
        .trim()
        .toLowerCase()
        .replace(/\u2019/g, "'")

      if (
        /^i don'?t know\.?$/.test(text) ||
        text === "i don't know anything."
      ) {
        option.scores = { ...UNCERTAINTY_SCORES }
        option.feedback = UNCERTAINTY_FEEDBACK
        changes += 1
      }

      if (text === 'can you just check me?') {
        option.scores = { ...DEMANDING_SOFT_SCORES }
        option.feedback = DEMANDING_SOFT_FEEDBACK
        changes += 1
      }

      if (text === 'i understand.' && option.id === 'B') {
        option.scores = {
          clarity: 2,
          empathy: 1,
          appropriateness: 2,
          confidence: 2,
          safety: 3,
        }
        option.feedback =
          'Pretending you understand can hide confusion. A short question is often better than saying you understand.'
        changes += 1
      }
    }
  }
}

writeFileSync(path, `${JSON.stringify(bank, null, 2)}\n`, 'utf8')
console.log(`Polished ${changes} options in ${path}`)
