import type {
  DimensionAveragesResponse,
  QuizQuestionsResponse,
  ScenarioResultResponse,
  ScenarioSummary,
  StoredAnswer,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from '../types/questionBank'

/** Same-origin on Vercel; localhost API in dev unless VITE_API_BASE_URL is set. */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? '' : 'http://localhost:3001')

const REQUEST_TIMEOUT_MS = 15_000

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

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

export function submitAnswer(
  scenarioId: string,
  body: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> {
  return apiFetch<SubmitAnswerResponse>(
    `/api/scenarios/${encodeURIComponent(scenarioId)}/answers`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}

export function getUserDimensionAverages(
  scenarioId: string,
  userId: string,
  answers: StoredAnswer[],
): Promise<DimensionAveragesResponse> {
  return apiFetch<DimensionAveragesResponse>(
    `/api/scenarios/${encodeURIComponent(scenarioId)}/dimension-averages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, answers }),
    },
  )
}

export function getScenarioResult(
  scenarioId: string,
  userId: string,
  answers: StoredAnswer[],
): Promise<ScenarioResultResponse> {
  return apiFetch<ScenarioResultResponse>(
    `/api/scenarios/${encodeURIComponent(scenarioId)}/result`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, answers }),
    },
  )
}
