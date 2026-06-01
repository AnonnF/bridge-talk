import type { StoredAnswer } from '../types/answers.js'
import {
  DIMENSION_KEYS,
  type DimensionKey,
  type DimensionScores,
} from '../types/questionBank.js'

export type { StoredAnswer }

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  clarity: 'Clarity',
  empathy: 'Empathy',
  appropriateness: 'Appropriateness',
  confidence: 'Confidence',
  safety: 'Safety',
}

export function roundDimensionAverage(value: number): number {
  return Math.round(value * 10) / 10
}

export function averageDimensionScores(
  answers: Pick<StoredAnswer, 'scores'>[],
): DimensionScores {
  if (answers.length === 0) {
    throw new Error('NO_ANSWERS')
  }

  const totals = Object.fromEntries(
    DIMENSION_KEYS.map((key) => [key, 0]),
  ) as DimensionScores

  for (const answer of answers) {
    for (const key of DIMENSION_KEYS) {
      totals[key] += answer.scores[key]
    }
  }

  const count = answers.length
  return Object.fromEntries(
    DIMENSION_KEYS.map((key) => [
      key,
      roundDimensionAverage(totals[key] / count),
    ]),
  ) as DimensionScores
}

function compareDimensionScore(
  leftKey: DimensionKey,
  leftScore: number,
  rightKey: DimensionKey,
  rightScore: number,
): number {
  if (leftScore !== rightScore) {
    return rightScore - leftScore
  }
  return DIMENSION_KEYS.indexOf(leftKey) - DIMENSION_KEYS.indexOf(rightKey)
}

export function findStrongestWeakest(averages: DimensionScores): {
  strongest: DimensionKey
  weakest: DimensionKey
} {
  let strongest: DimensionKey = DIMENSION_KEYS[0]
  let weakest: DimensionKey = DIMENSION_KEYS[0]

  for (const key of DIMENSION_KEYS) {
    if (
      compareDimensionScore(
        key,
        averages[key],
        strongest,
        averages[strongest],
      ) < 0
    ) {
      strongest = key
    }
    if (
      compareDimensionScore(key, averages[key], weakest, averages[weakest]) > 0
    ) {
      weakest = key
    }
  }

  return { strongest, weakest }
}

export function buildScenarioFeedback(
  averages: DimensionScores,
  strongest: DimensionKey,
  weakest: DimensionKey,
): { summary: string; suggestions: string[] } {
  const suggestions: string[] = []

  if (averages.empathy < 3.5) {
    suggestions.push(
      'Try adding a friendly opener or a brief acknowledgement before your main point.',
    )
  }
  if (averages.confidence < 3.5) {
    suggestions.push(
      'Practice short phrases like “I would like…” or “Could I…” to sound more assured.',
    )
  }
  if (averages.clarity < 3.5) {
    suggestions.push(
      'Include one extra detail (what, when, or how) to make your meaning clearer.',
    )
  }
  if (averages.appropriateness < 3.5) {
    suggestions.push(
      'Match your tone to the situation — polite requests often work better than very short replies.',
    )
  }
  if (averages.safety < 3.5) {
    suggestions.push(
      'Soften direct or abrupt wording so others can stay engaged in the conversation.',
    )
  }

  if (suggestions.length === 0) {
    suggestions.push(
      `Your strongest area is ${DIMENSION_LABELS[strongest].toLowerCase()} — notice what felt natural and reuse it in similar situations.`,
    )
    suggestions.push(
      `You can still grow ${DIMENSION_LABELS[weakest].toLowerCase()} with small tweaks in your next practice session.`,
    )
  } else if (suggestions.length === 1) {
    suggestions.push(
      `You are doing well with ${DIMENSION_LABELS[strongest].toLowerCase()} — keep building on that strength.`,
    )
  }

  const clarityAndSafetyStrong =
    averages.clarity >= 3.8 && averages.safety >= 3.8
  const empathyOrConfidenceLow =
    averages.empathy < 3.5 || averages.confidence < 3.5

  let summary: string
  if (clarityAndSafetyStrong && empathyOrConfidenceLow) {
    summary =
      'Your answers are generally clear and safe. You are good at giving understandable responses, but you could improve by using warmer and more confident phrases.'
  } else if (clarityAndSafetyStrong) {
    summary =
      'Your communication comes across as clear and respectful. You explain yourself in ways others can follow.'
  } else if (averages.empathy >= 3.8) {
    summary =
      'You show warmth and consideration in your responses. With a bit more structure or detail, your messages can be even easier to follow.'
  } else {
    summary =
      'You are building useful communication habits. Small changes in clarity, tone, or confidence can make a big difference over time.'
  }

  return {
    summary,
    suggestions: suggestions.slice(0, 2),
  }
}

export function buildScenarioResult(answers: StoredAnswer[]) {
  const averages = averageDimensionScores(answers)
  const { strongest, weakest } = findStrongestWeakest(averages)
  const { summary, suggestions } = buildScenarioFeedback(
    averages,
    strongest,
    weakest,
  )

  return {
    averages,
    strongest,
    weakest,
    strongestLabel: DIMENSION_LABELS[strongest],
    weakestLabel: DIMENSION_LABELS[weakest],
    summary,
    suggestions,
  }
}
