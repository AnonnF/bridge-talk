import { supabase } from '@/lib/supabase'
import type {
  ChatApiError,
  ChatApiErrorCode,
  ChatConversationSummary,
  ChatParticipant,
  ChatMessage,
  CreateChatConversationRequest,
  CreateChatConversationResponse,
  ListChatConversationsResponse,
  ListChatMessagesResponse,
  ListChatParticipantsResponse,
  MarkChatConversationReadResponse,
  ReportChatMessageRequest,
  ReportChatMessageResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
} from '@/types/chat'

/** Same-origin on Vercel; localhost API in dev unless VITE_API_BASE_URL is set. */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? '' : 'http://localhost:3001')

const REQUEST_TIMEOUT_MS = 15_000

export type ChatApiClientErrorCode = ChatApiErrorCode | 'chat_network_error'

export class ChatApiRequestError extends Error {
  readonly status: number
  readonly code: ChatApiClientErrorCode

  constructor(status: number, code: ChatApiClientErrorCode, message: string) {
    super(message)
    this.name = 'ChatApiRequestError'
    this.status = status
    this.code = code
  }
}

export type ListChatMessagesOptions = {
  limit?: number
  before?: string
  after?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isChatApiError(value: unknown): value is ChatApiError {
  if (!isRecord(value) || !isRecord(value.error)) return false

  return (
    typeof value.error.code === 'string' &&
    typeof value.error.message === 'string'
  )
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    throw new ChatApiRequestError(401, 'auth_required', error.message)
  }

  const token = data.session?.access_token
  if (!token) {
    throw new ChatApiRequestError(401, 'auth_required', 'Sign in to use chat')
  }

  return token
}

function buildJsonRequest(token: string, init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  const rawBody = await response.text()

  if (!rawBody.trim()) {
    return null
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(rawBody) as unknown
  }

  return rawBody
}

function responsePreview(body: unknown): string | null {
  if (typeof body !== 'string') return null

  const trimmed = body.trim()
  if (!trimmed) return null

  return trimmed.slice(0, 120)
}

async function readError(response: Response): Promise<ChatApiRequestError> {
  let body: unknown = null

  try {
    body = await readResponseBody(response)
  } catch {
    // Non-JSON failures still get wrapped into a structured client error.
  }

  if (isChatApiError(body)) {
    return new ChatApiRequestError(
      response.status,
      body.error.code,
      body.error.message,
    )
  }

  const preview = responsePreview(body)
  if (preview) {
    return new ChatApiRequestError(
      response.status,
      'chat_server_error',
      `Chat API request failed: ${response.status} (${preview})`,
    )
  }

  return new ChatApiRequestError(
    response.status,
    'chat_server_error',
    `Chat API request failed: ${response.status}`,
  )
}

async function chatApiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  try {
    const token = await getAccessToken()
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      buildJsonRequest(token, init),
    )

    if (!response.ok) {
      throw await readError(response)
    }

    return (await readResponseBody(response)) as T
  } catch (error) {
    if (error instanceof ChatApiRequestError) {
      throw error
    }

    throw new ChatApiRequestError(
      0,
      'chat_network_error',
      error instanceof Error ? error.message : 'Chat request failed',
    )
  }
}

function buildMessagesQuery(options: ListChatMessagesOptions = {}): string {
  const query = new URLSearchParams()

  if (options.limit !== undefined) {
    query.set('limit', String(options.limit))
  }

  if (options.before) {
    query.set('before', options.before)
  }

  if (options.after) {
    query.set('after', options.after)
  }

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export async function getChatConversations(): Promise<
  ChatConversationSummary[]
> {
  const response = await chatApiFetch<ListChatConversationsResponse>(
    '/api/chat/conversations',
  )
  return response.conversations
}

export async function getChatParticipants(): Promise<ChatParticipant[]> {
  const response = await chatApiFetch<ListChatParticipantsResponse>(
    '/api/chat/participants',
  )
  return response.participants
}

export async function createChatConversation(
  body: CreateChatConversationRequest,
): Promise<ChatConversationSummary> {
  const response = await chatApiFetch<CreateChatConversationResponse>(
    '/api/chat/conversations',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
  return response.conversation
}

export function getChatMessages(
  conversationId: string,
  options?: ListChatMessagesOptions,
): Promise<ListChatMessagesResponse> {
  return chatApiFetch<ListChatMessagesResponse>(
    `/api/chat/conversations/${encodeURIComponent(
      conversationId,
    )}/messages${buildMessagesQuery(options)}`,
  )
}

export async function sendChatMessage(
  conversationId: string,
  body: SendChatMessageRequest,
): Promise<ChatMessage> {
  const response = await chatApiFetch<SendChatMessageResponse>(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
  return response.message
}

export function markChatConversationRead(
  conversationId: string,
): Promise<MarkChatConversationReadResponse> {
  return chatApiFetch<MarkChatConversationReadResponse>(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/read`,
    { method: 'PATCH' },
  )
}

export function reportChatMessage(
  messageId: string,
  body: ReportChatMessageRequest = {},
): Promise<ReportChatMessageResponse> {
  return chatApiFetch<ReportChatMessageResponse>(
    `/api/chat/messages/${encodeURIComponent(messageId)}/report`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}
