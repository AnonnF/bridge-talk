import {
  CHAT_DESCRIPTION_MAX_LENGTH,
  CHAT_MESSAGE_MAX_LENGTH,
  CHAT_MESSAGES_DEFAULT_LIMIT,
  CHAT_MESSAGES_MAX_LIMIT,
  CHAT_PARTICIPANTS_MAX,
  CHAT_REPORT_REASON_MAX_LENGTH,
  CHAT_TITLE_MAX_LENGTH,
  type CreateChatConversationRequest,
  type ReportChatMessageRequest,
  type SendChatMessageRequest,
} from '../../src/types/chat.js'

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'chat_bad_request'; message: string }

export type ChatMessagesQuery = {
  limit: number
  before: string | null
  after: string | null
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function invalid(message: string): ValidationResult<never> {
  return { ok: false, code: 'chat_bad_request', message }
}

function trimmedString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): ValidationResult<string> {
  if (typeof value !== 'string') {
    return invalid(`${fieldName} must be a string`)
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return invalid(`${fieldName} is required`)
  }

  if (trimmed.length > maxLength) {
    return invalid(`${fieldName} must be ${maxLength} characters or fewer`)
  }

  return { ok: true, value: trimmed }
}

function optionalTrimmedString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): ValidationResult<string> {
  if (value === undefined || value === null) {
    return { ok: true, value: '' }
  }

  if (typeof value !== 'string') {
    return invalid(`${fieldName} must be a string`)
  }

  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    return invalid(`${fieldName} must be ${maxLength} characters or fewer`)
  }

  return { ok: true, value: trimmed }
}

function parseParticipantIds(value: unknown): ValidationResult<string[]> {
  if (value === undefined || value === null) {
    return { ok: true, value: [] }
  }

  if (!Array.isArray(value)) {
    return invalid('participantIds must be an array')
  }

  if (value.length > CHAT_PARTICIPANTS_MAX) {
    return invalid(
      `participantIds must contain ${CHAT_PARTICIPANTS_MAX} users or fewer`,
    )
  }

  const ids = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string' || !isUuid(item)) {
      return invalid('participantIds must contain valid user IDs')
    }
    ids.add(item)
  }

  return { ok: true, value: [...ids] }
}

export function parseCreateConversationBody(
  body: unknown,
): ValidationResult<CreateChatConversationRequest> {
  if (!isRecord(body)) {
    return invalid('Request body must be an object')
  }

  const title = trimmedString(body.title, 'title', CHAT_TITLE_MAX_LENGTH)
  if (!title.ok) return title

  const description = optionalTrimmedString(
    body.description,
    'description',
    CHAT_DESCRIPTION_MAX_LENGTH,
  )
  if (!description.ok) return description

  const participantIds = parseParticipantIds(body.participantIds)
  if (!participantIds.ok) return participantIds

  return {
    ok: true,
    value: {
      title: title.value,
      description: description.value,
      participantIds: participantIds.value,
    },
  }
}

export function parseSendMessageBody(
  body: unknown,
): ValidationResult<SendChatMessageRequest> {
  if (!isRecord(body)) {
    return invalid('Request body must be an object')
  }

  const message = trimmedString(body.body, 'body', CHAT_MESSAGE_MAX_LENGTH)
  if (!message.ok) return message

  return { ok: true, value: { body: message.value } }
}

function firstQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return firstQueryValue(value[0])
  }

  return typeof value === 'string' ? value : undefined
}

function parseCursor(
  value: unknown,
  name: string,
): ValidationResult<string | null> {
  const raw = firstQueryValue(value)
  if (raw === undefined || raw.trim() === '') {
    return { ok: true, value: null }
  }

  const timestamp = raw.trim()
  if (Number.isNaN(Date.parse(timestamp))) {
    return invalid(`${name} must be an ISO timestamp`)
  }

  return { ok: true, value: timestamp }
}

export function parseMessagesQuery(
  query: unknown,
): ValidationResult<ChatMessagesQuery> {
  if (!isRecord(query)) {
    return invalid('Query must be an object')
  }

  const rawLimit = firstQueryValue(query.limit)
  const parsedLimit =
    rawLimit === undefined ? CHAT_MESSAGES_DEFAULT_LIMIT : Number(rawLimit)

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return invalid('limit must be a positive integer')
  }

  const before = parseCursor(query.before, 'before')
  if (!before.ok) return before

  const after = parseCursor(query.after, 'after')
  if (!after.ok) return after

  if (before.value && after.value) {
    return invalid('Use either before or after, not both')
  }

  return {
    ok: true,
    value: {
      limit: Math.min(parsedLimit, CHAT_MESSAGES_MAX_LIMIT),
      before: before.value,
      after: after.value,
    },
  }
}

export function parseReportMessageBody(
  body: unknown,
): ValidationResult<Required<ReportChatMessageRequest>> {
  if (body === undefined || body === null) {
    return { ok: true, value: { reason: '' } }
  }

  if (!isRecord(body)) {
    return invalid('Request body must be an object')
  }

  const reason = optionalTrimmedString(
    body.reason,
    'reason',
    CHAT_REPORT_REASON_MAX_LENGTH,
  )
  if (!reason.ok) return reason

  return { ok: true, value: { reason: reason.value } }
}
