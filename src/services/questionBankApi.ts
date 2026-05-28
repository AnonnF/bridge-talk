import type {
  QuizQuestionsResponse,
  ScenarioSummary,
  SubmitAnswer,
  SubmitResponse,
} from '../types/questionBank'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init)

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function getScenarios(): Promise<ScenarioSummary[]> {
  return apiFetch<ScenarioSummary[]>('/api/scenarios')
}

export function getScenarioQuestions(
  scenarioId: string,
): Promise<QuizQuestionsResponse> {
  return apiFetch<QuizQuestionsResponse>(
    `/api/scenarios/${encodeURIComponent(scenarioId)}/questions`,
  )
}

export function submitQuiz(
  scenarioId: string,
  answers: SubmitAnswer[],
): Promise<SubmitResponse> {
  return apiFetch<SubmitResponse>(
    `/api/scenarios/${encodeURIComponent(scenarioId)}/submit`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    },
  )
}
