export const CHAT_TITLE_MAX_LENGTH = 80
export const CHAT_DESCRIPTION_MAX_LENGTH = 180
export const CHAT_MESSAGE_MAX_LENGTH = 1000
export const CHAT_REPORT_REASON_MAX_LENGTH = 300
export const CHAT_MESSAGES_DEFAULT_LIMIT = 30
export const CHAT_MESSAGES_MAX_LIMIT = 50
export const CHAT_PARTICIPANTS_MAX = 20

export type ChatParticipantRole = 'user' | 'counsellor'
export type ChatParticipantStatus = 'online' | 'away' | 'offline'

export type ChatParticipant = {
  id: string
  name: string
  role: ChatParticipantRole
  status: ChatParticipantStatus
}

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
  deletedAt: string | null
}

export type ChatConversationSummary = {
  id: string
  title: string
  description: string
  participants: ChatParticipant[]
  unreadCount: number
  lastMessage: ChatMessage | null
  createdAt: string
  updatedAt: string
}

export type CreateChatConversationRequest = {
  title: string
  description?: string
  participantIds?: string[]
}

export type CreateChatConversationResponse = {
  conversation: ChatConversationSummary
}

export type ListChatConversationsResponse = {
  conversations: ChatConversationSummary[]
}

export type ListChatMessagesResponse = {
  messages: ChatMessage[]
  nextBefore: string | null
}

export type SendChatMessageRequest = {
  body: string
}

export type SendChatMessageResponse = {
  message: ChatMessage
}

export type MarkChatConversationReadResponse = {
  conversationId: string
  readAt: string
}

export type ReportChatMessageRequest = {
  reason?: string
}

export type ReportChatMessageResponse = {
  reportId: string
}

export type ChatApiErrorCode =
  | 'auth_required'
  | 'chat_bad_request'
  | 'chat_forbidden'
  | 'chat_not_found'
  | 'chat_conflict'
  | 'chat_server_error'

export type ChatApiError = {
  error: {
    code: ChatApiErrorCode
    message: string
  }
}
