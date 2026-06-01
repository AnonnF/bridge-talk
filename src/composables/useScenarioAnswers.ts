import { ref } from 'vue'
import type { StoredAnswer } from '../types/questionBank'

function storageKey(userId: string, scenarioId: string): string {
  return `bridge-talk:answers:${userId}:${scenarioId}`
}

export function useScenarioAnswers(userId: string, scenarioId: string) {
  const key = storageKey(userId, scenarioId)
  const answers = ref<StoredAnswer[]>(loadFromSession())

  function loadFromSession(): StoredAnswer[] {
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

  function persist(): void {
    if (typeof sessionStorage === 'undefined') {
      return
    }
    sessionStorage.setItem(key, JSON.stringify(answers.value))
  }

  function clearAnswers(): void {
    answers.value = []
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key)
    }
  }

  function upsertAnswer(answer: StoredAnswer): void {
    const withoutCurrent = answers.value.filter(
      (existing) => existing.questionId !== answer.questionId,
    )
    answers.value = [...withoutCurrent, answer]
    persist()
  }

  return {
    answers,
    clearAnswers,
    upsertAnswer,
  }
}
