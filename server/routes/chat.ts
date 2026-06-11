import { Router, type Response } from 'express'
import type {
  ChatApiError,
  ChatApiErrorCode,
  CreateChatConversationResponse,
  ListChatConversationsResponse,
  ListChatMessagesResponse,
  ListChatParticipantsResponse,
  MarkChatConversationReadResponse,
  ReportChatMessageResponse,
  SendChatMessageResponse,
} from '../../src/types/chat.js'
import {
  ChatConflictError,
  ChatForbiddenError,
  ChatNotFoundError,
  createChatConversation,
  listChatConversations,
  listChatMessages,
  listChatParticipants,
  markChatConversationRead,
  reportChatMessage,
  sendChatMessage,
} from '../services/chatRepository.js'
import {
  isUuid,
  parseCreateConversationBody,
  parseMessagesQuery,
  parseReportMessageBody,
  parseSendMessageBody,
} from '../services/chatValidation.js'
import { getUserFromRequest } from '../services/supabase.js'

function sendError(
  res: Response,
  status: number,
  code: ChatApiErrorCode,
  message: string,
): void {
  const payload: ChatApiError = { error: { code, message } }
  res.status(status).json(payload)
}

function sendUnknownError(res: Response, error: unknown): void {
  if (error instanceof ChatForbiddenError) {
    sendError(res, 403, 'chat_forbidden', error.message)
    return
  }

  if (error instanceof ChatNotFoundError) {
    sendError(res, 404, 'chat_not_found', error.message)
    return
  }

  if (error instanceof ChatConflictError) {
    sendError(res, 409, 'chat_conflict', error.message)
    return
  }

  console.error('Chat API error:', error)
  sendError(res, 500, 'chat_server_error', 'Chat service unavailable')
}

function validateId(id: string, res: Response, label: string): boolean {
  if (isUuid(id)) return true

  sendError(res, 400, 'chat_bad_request', `${label} must be a valid ID`)
  return false
}

export function createChatRouter() {
  const router = Router()

  router.use(async (req, res, next) => {
    try {
      const user = await getUserFromRequest(req)
      if (!user) {
        sendError(res, 401, 'auth_required', 'Sign in to use chat')
        return
      }

      res.locals.userId = user.id
      next()
    } catch (error) {
      sendUnknownError(res, error)
    }
  })

  router.get('/chat/conversations', async (_req, res) => {
    try {
      const conversations = await listChatConversations(res.locals.userId)
      const payload: ListChatConversationsResponse = { conversations }
      res.json(payload)
    } catch (error) {
      sendUnknownError(res, error)
    }
  })

  router.get('/chat/participants', async (_req, res) => {
    try {
      const participants = await listChatParticipants(res.locals.userId)
      const payload: ListChatParticipantsResponse = { participants }
      res.json(payload)
    } catch (error) {
      sendUnknownError(res, error)
    }
  })

  router.post('/chat/conversations', async (req, res) => {
    const parsed = parseCreateConversationBody(req.body)
    if (!parsed.ok) {
      sendError(res, 400, parsed.code, parsed.message)
      return
    }

    try {
      const conversation = await createChatConversation(
        res.locals.userId,
        parsed.value.title,
        parsed.value.description ?? '',
        parsed.value.participantIds ?? [],
      )
      const payload: CreateChatConversationResponse = { conversation }
      res.status(201).json(payload)
    } catch (error) {
      sendUnknownError(res, error)
    }
  })

  router.get(
    '/chat/conversations/:conversationId/messages',
    async (req, res) => {
      if (!validateId(req.params.conversationId, res, 'conversationId')) return

      const parsed = parseMessagesQuery(req.query)
      if (!parsed.ok) {
        sendError(res, 400, parsed.code, parsed.message)
        return
      }

      try {
        const payload: ListChatMessagesResponse = await listChatMessages(
          res.locals.userId,
          req.params.conversationId,
          parsed.value,
        )
        res.json(payload)
      } catch (error) {
        sendUnknownError(res, error)
      }
    },
  )

  router.post(
    '/chat/conversations/:conversationId/messages',
    async (req, res) => {
      if (!validateId(req.params.conversationId, res, 'conversationId')) return

      const parsed = parseSendMessageBody(req.body)
      if (!parsed.ok) {
        sendError(res, 400, parsed.code, parsed.message)
        return
      }

      try {
        const message = await sendChatMessage(
          res.locals.userId,
          req.params.conversationId,
          parsed.value.body,
        )
        const payload: SendChatMessageResponse = { message }
        res.status(201).json(payload)
      } catch (error) {
        sendUnknownError(res, error)
      }
    },
  )

  router.patch('/chat/conversations/:conversationId/read', async (req, res) => {
    if (!validateId(req.params.conversationId, res, 'conversationId')) return

    try {
      const readAt = await markChatConversationRead(
        res.locals.userId,
        req.params.conversationId,
      )
      const payload: MarkChatConversationReadResponse = {
        conversationId: req.params.conversationId,
        readAt,
      }
      res.json(payload)
    } catch (error) {
      sendUnknownError(res, error)
    }
  })

  router.post('/chat/messages/:messageId/report', async (req, res) => {
    if (!validateId(req.params.messageId, res, 'messageId')) return

    const parsed = parseReportMessageBody(req.body)
    if (!parsed.ok) {
      sendError(res, 400, parsed.code, parsed.message)
      return
    }

    try {
      const reportId = await reportChatMessage(
        res.locals.userId,
        req.params.messageId,
        parsed.value.reason,
      )
      const payload: ReportChatMessageResponse = { reportId }
      res.status(201).json(payload)
    } catch (error) {
      sendUnknownError(res, error)
    }
  })

  return router
}
