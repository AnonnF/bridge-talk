/**
 * One-off migration: string options → scored option objects (A–D).
 * Run: node scripts/upgrade-question-bank.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OPTION_IDS = ['A', 'B', 'C', 'D']

const RUDE_PATTERNS =
  /\b(go away|shut up|be quiet|you decide|you answer|don't care|too confusing|not funny|sounds fake|why would you|no one lets|speaking now|stop talking|give food|change it\.|wrong\.)\b/i

const DISMISSIVE_PATTERNS =
  /\b(never mind|forget it|next question|do whatever|i don't want)\b/i

const DEMANDING_PATTERNS = /\b(just check|all the information now|need all)\b/i

const VERY_SHORT_PATTERNS = /^[^.!?]{1,18}[.!?]?$/

function clampScore(value) {
  return Math.max(0, Math.min(5, Math.round(value)))
}

function scoreProfile(text, index) {
  const lower = text.toLowerCase().trim()
  const wordCount = lower.split(/\s+/).filter(Boolean).length
  const isRude = RUDE_PATTERNS.test(lower)
  const isDismissive = DISMISSIVE_PATTERNS.test(lower)
  const isDemanding = DEMANDING_PATTERNS.test(lower)
  const isVeryShort = VERY_SHORT_PATTERNS.test(text.trim()) && wordCount <= 3
  const hasPlease = /\bplease\b/i.test(text)
  const hasSorry = /\bsorry\b/i.test(text)
  const hasQuestion = text.includes('?')
  const isHonestUncertainty =
    /\b(don't know|not sure|not completely sure|feel nervous|missed that)\b/i.test(
      lower,
    ) && index > 0

  if (index === 0) {
    return {
      clarity: wordCount >= 4 ? 5 : 4,
      empathy: hasSorry || /\b(nice|fun|interesting)\b/i.test(lower) ? 4 : 3,
      appropriateness: 5,
      confidence: hasPlease || hasQuestion ? 4 : 4,
      safety: 5,
    }
  }

  if (isRude || isDemanding) {
    return {
      clarity: index === 3 ? 1 : 2,
      empathy: 0,
      appropriateness: 0,
      confidence: index === 3 ? 1 : 2,
      safety: 0,
    }
  }

  if (index === 1) {
    const clarity = isVeryShort ? 2 : wordCount <= 5 ? 3 : 3
    return {
      clarity,
      empathy: hasSorry ? 3 : 2,
      appropriateness: isDismissive ? 2 : 3,
      confidence: isVeryShort ? 2 : 3,
      safety: 4,
    }
  }

  if (index === 2) {
    if (
      isHonestUncertainty ||
      lower === "i don't know." ||
      lower === "i don't know"
    ) {
      return {
        clarity: 2,
        empathy: 2,
        appropriateness: 3,
        confidence: 2,
        safety: 4,
      }
    }
    if (isDismissive) {
      return {
        clarity: 2,
        empathy: 1,
        appropriateness: 2,
        confidence: 2,
        safety: 3,
      }
    }
    return {
      clarity: 2,
      empathy: 2,
      appropriateness: 2,
      confidence: 2,
      safety: 3,
    }
  }

  // index === 3
  if (isDismissive) {
    return {
      clarity: 2,
      empathy: 1,
      appropriateness: 1,
      confidence: 2,
      safety: 2,
    }
  }
  return {
    clarity: 1,
    empathy: 1,
    appropriateness: 1,
    confidence: 1,
    safety: isRude ? 0 : 2,
  }
}

function buildFeedback(text, index, explanation) {
  if (index === 0) {
    const detail = explanation
      .replace(/^Good choice\.\s*/i, '')
      .replace(/^This answer /i, 'It ')
      .replace(/^This is /i, 'It is ')
      .replace(/^This /i, 'It ')
    return `This is a strong response. ${detail}`
  }

  const lower = text.toLowerCase().trim()
  if (RUDE_PATTERNS.test(lower) || DEMANDING_PATTERNS.test(lower)) {
    return 'This may come across as abrupt or demanding. A calmer, more specific phrase usually keeps the conversation going.'
  }
  if (DISMISSIVE_PATTERNS.test(lower)) {
    return 'Ending the topic quickly can feel dismissive. A short clarifying question or request is often more helpful.'
  }
  if (/\b(don't know|not sure)\b/i.test(lower)) {
    return 'It is okay not to know everything. You could add one small detail or ask a short question so the other person can help you.'
  }
  if (
    VERY_SHORT_PATTERNS.test(text.trim()) &&
    text.trim().split(/\s+/).length <= 3
  ) {
    return 'This is understandable, but adding a bit more detail (what, when, or how) usually makes your message clearer.'
  }
  if (text.includes('?') && index > 0) {
    return 'You are asking something, which is good. Softer wording or a little context can sound more natural in conversation.'
  }
  return 'This is partly understandable. With a little more detail or warmer phrasing, it could fit the situation better.'
}

function upgradeOption(text, index, explanation) {
  const rawScores = scoreProfile(text, index)
  const scores = Object.fromEntries(
    Object.entries(rawScores).map(([key, value]) => [key, clampScore(value)]),
  )
  return {
    id: OPTION_IDS[index],
    text: text.trim(),
    scores,
    feedback: buildFeedback(text, index, explanation),
  }
}

function upgradeQuestion(question) {
  const explanation = question.explanation
  const options = question.options.map((text, index) => {
    if (typeof text === 'object' && text !== null && 'scores' in text) {
      return text
    }
    return upgradeOption(text, index, explanation)
  })
  return {
    id: question.id,
    prompt: question.prompt,
    options,
    explanation,
  }
}

const root = dirname(fileURLToPath(import.meta.url))
const inputPath = join(root, '../server/data/questionBank.json')
const bank = JSON.parse(readFileSync(inputPath, 'utf8'))

const firstOption = bank.scenarios[0]?.questions[0]?.options[0]
if (
  typeof firstOption === 'object' &&
  firstOption !== null &&
  'scores' in firstOption
) {
  console.log('questionBank.json already upgraded; skipping.')
  process.exit(0)
}

const upgraded = {
  scenarios: bank.scenarios.map((scenario) => ({
    ...scenario,
    questions: scenario.questions.map(upgradeQuestion),
  })),
}

writeFileSync(inputPath, `${JSON.stringify(upgraded, null, 2)}\n`, 'utf8')
console.log(`Upgraded ${inputPath}`)
