import { expect, test, type Page } from '@playwright/test'

type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
  deletedAt: string | null
}

const apiOrigin = 'http://localhost:3001'

function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    headers: {
      'access-control-allow-headers': 'authorization, content-type',
      'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
      'access-control-allow-origin': '*',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}

async function setupChatApi(page: Page) {
  let sentMessageIndex = 0
  let createdConversationIndex = 0
  const reports: string[] = []

  const recentMessages: ChatMessage[] = [
    {
      id: 'message-2',
      conversationId: 'conversation-1',
      senderId: 'user-2',
      body: 'Can we practise a phone appointment?',
      createdAt: '2026-06-11T10:01:00.000Z',
      deletedAt: null,
    },
    {
      id: 'message-3',
      conversationId: 'conversation-1',
      senderId: 'user-1',
      body: 'Yes, I can help you rehearse.',
      createdAt: '2026-06-11T10:02:00.000Z',
      deletedAt: null,
    },
  ]

  const olderMessages: ChatMessage[] = [
    {
      id: 'message-1',
      conversationId: 'conversation-1',
      senderId: 'user-2',
      body: 'I am nervous about calling reception.',
      createdAt: '2026-06-11T09:59:00.000Z',
      deletedAt: null,
    },
  ]

  const conversations = [
    {
      id: 'conversation-1',
      title: 'Check-in with Sam',
      description: 'Practise preparing for a GP call.',
      participants: [
        { id: 'user-1', name: 'Test Learner', role: 'user', status: 'online' },
        { id: 'user-2', name: 'Sam Peer', role: 'user', status: 'offline' },
      ],
      unreadCount: 1,
      lastMessage: recentMessages[1],
      createdAt: '2026-06-11T09:58:00.000Z',
      updatedAt: '2026-06-11T10:02:00.000Z',
    },
  ]

  await page.route(`${apiOrigin}/api/chat/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (request.method() === 'OPTIONS') {
      await route.fulfill(jsonResponse(null, 204))
      return
    }

    if (request.method() === 'GET' && path === '/api/chat/conversations') {
      await route.fulfill(jsonResponse({ conversations }))
      return
    }

    if (request.method() === 'GET' && path === '/api/chat/participants') {
      await route.fulfill(
        jsonResponse({
          participants: [
            { id: 'user-2', name: 'Sam Peer', role: 'user', status: 'offline' },
            {
              id: 'user-3',
              name: 'Avery Peer',
              role: 'user',
              status: 'offline',
            },
          ],
        }),
      )
      return
    }

    if (
      request.method() === 'GET' &&
      path === '/api/chat/conversations/conversation-1/messages'
    ) {
      const before = url.searchParams.get('before')
      await route.fulfill(
        jsonResponse(
          before
            ? { messages: olderMessages, nextBefore: null }
            : {
                messages: recentMessages,
                nextBefore: recentMessages[0].createdAt,
              },
        ),
      )
      return
    }

    if (
      request.method() === 'POST' &&
      path === '/api/chat/conversations/conversation-1/messages'
    ) {
      const body = (await request.postDataJSON()) as { body: string }
      sentMessageIndex += 1
      const message = {
        id: `sent-message-${sentMessageIndex}`,
        conversationId: 'conversation-1',
        senderId: 'user-1',
        body: body.body,
        createdAt: `2026-06-11T10:0${sentMessageIndex + 2}:00.000Z`,
        deletedAt: null,
      }
      recentMessages.push(message)
      conversations[0].lastMessage = message
      await route.fulfill(jsonResponse({ message }))
      return
    }

    if (
      request.method() === 'PATCH' &&
      path === '/api/chat/conversations/conversation-1/read'
    ) {
      conversations[0].unreadCount = 0
      await route.fulfill(
        jsonResponse({
          conversationId: 'conversation-1',
          readAt: '2026-06-11T10:03:00.000Z',
        }),
      )
      return
    }

    if (request.method() === 'POST' && path === '/api/chat/conversations') {
      const body = (await request.postDataJSON()) as {
        title: string
        description?: string
        participantIds?: string[]
      }
      createdConversationIndex += 1
      const conversation = {
        id: `created-conversation-${createdConversationIndex}`,
        title: body.title,
        description: body.description ?? '',
        participants: [
          {
            id: 'user-1',
            name: 'Test Learner',
            role: 'user',
            status: 'online',
          },
          ...(body.participantIds ?? []).map((id) => ({
            id,
            name: id === 'user-3' ? 'Avery Peer' : 'Sam Peer',
            role: 'user',
            status: 'offline',
          })),
        ],
        unreadCount: 0,
        lastMessage: null,
        createdAt: '2026-06-11T10:10:00.000Z',
        updatedAt: '2026-06-11T10:10:00.000Z',
      }
      conversations.unshift(conversation)
      await route.fulfill(jsonResponse({ conversation }))
      return
    }

    if (
      request.method() === 'POST' &&
      path === '/api/chat/messages/message-2/report'
    ) {
      reports.push('message-2')
      await route.fulfill(jsonResponse({ reportId: 'report-1' }))
      return
    }

    await route.fulfill(
      jsonResponse(
        {
          error: {
            code: 'chat_not_found',
            message: `Unhandled e2e route: ${request.method()} ${path}`,
          },
        },
        404,
      ),
    )
  })

  return { reports }
}

test.beforeEach(async ({ page }) => {
  await setupChatApi(page)
})

test('loads chat history, pages older messages, sends, reports, and receives realtime', async ({
  page,
}) => {
  await page.goto('/chat')

  await expect(
    page.getByRole('heading', { name: 'Live chat practice' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Check-in with Sam/ }),
  ).toBeVisible()
  await expect(
    page.getByText('Can we practise a phone appointment?'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Load earlier messages' }).click()
  await expect(
    page.getByText('I am nervous about calling reception.'),
  ).toBeVisible()

  await page
    .getByRole('textbox', { name: 'Message' })
    .fill('Let us practise the opening line.')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(
    page.getByText('Let us practise the opening line.'),
  ).toBeVisible()

  const reportedBubble = page
    .locator('.message-bubble')
    .filter({ hasText: 'Can we practise a phone appointment?' })
  await reportedBubble.getByRole('button', { name: 'Report' }).click()
  await expect(
    reportedBubble.getByRole('button', { name: 'Reported' }),
  ).toBeVisible()

  await page.evaluate(() => {
    window.__bridgeTalkEmitChatMessage?.({
      id: 'message-4',
      conversation_id: 'conversation-1',
      sender_id: 'user-2',
      body: 'A realtime reply arrived.',
      created_at: '2026-06-11T10:05:00.000Z',
      deleted_at: null,
    })
  })
  await expect(page.getByText('A realtime reply arrived.')).toBeVisible()
})

test('creates a new conversation with selected participants', async ({
  page,
}) => {
  await page.goto('/chat')

  await page.getByRole('button', { name: 'New chat' }).click()
  await page.getByLabel('Title').fill('Practise pharmacy questions')
  await page
    .getByLabel('Description')
    .fill('Prepare for asking about medication.')
  await page.getByLabel(/Avery Peer/).check()
  await page.getByRole('button', { name: 'Create' }).click()

  await expect(
    page.getByRole('heading', { name: 'Practise pharmacy questions' }),
  ).toBeVisible()
  await expect(
    page
      .getByLabel('Practise pharmacy questions')
      .getByText('Prepare for asking about medication.'),
  ).toBeVisible()
  await expect(page.getByText('Start the conversation below.')).toBeVisible()
})
