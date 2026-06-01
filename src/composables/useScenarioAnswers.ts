import { ref, watch, type MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import type { StoredAnswer } from '../types/questionBank'

function storageKey(userId: string, scenarioId: string): string {
  return `bridge-talk:answers:${userId}:${scenarioId}`
}

function loadFromSession(key: string): StoredAnswer[] {
  if (typeof sessionStorage === 'undefined') {
    return []
  }

  const raw = sessionStorage.getItem(key)
  if (!raw) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StoredAnswer[]) : []
  } catch {
    return []
  }
}

export function useScenarioAnswers(
  userId: string,
  scenarioId: MaybeRefOrGetter<string>,
) {
  const answers = ref<StoredAnswer[]>(
    loadFromSession(storageKey(userId, toValue(scenarioId))),
  )

  function currentKey(): string {
    return storageKey(userId, toValue(scenarioId))
  }

  function persist(): void {
    if (typeof sessionStorage === 'undefined') {
      return
    }
    sessionStorage.setItem(currentKey(), JSON.stringify(answers.value))
  }

  function clearAnswers(): void {
    answers.value = []
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(currentKey())
    }
  }

  function upsertAnswer(answer: StoredAnswer): void {
    const withoutCurrent = answers.value.filter(
      (existing) => existing.questionId !== answer.questionId,
    )
    answers.value = [...withoutCurrent, answer]
    persist()
  }

  watch(
    () => toValue(scenarioId),
    (nextId, previousId) => {
      if (nextId === previousId) {
        return
      }
      answers.value = loadFromSession(storageKey(userId, nextId))
    },
  )

  return {
    answers,
    clearAnswers,
    upsertAnswer,
  }
}
