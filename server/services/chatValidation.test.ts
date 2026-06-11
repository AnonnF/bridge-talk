import assert from 'node:assert/strict'
import test from 'node:test'
import { CHAT_MESSAGE_MAX_LENGTH } from '../../src/types/chat.js'
import {
  parseCreateConversationBody,
  parseMessagesQuery,
  parseReportMessageBody,
  parseSendMessageBody,
} from './chatValidation.js'

const userId = '11111111-1111-4111-8111-111111111111'

test('parseCreateConversationBody trims text and deduplicates participants', () => {
  const parsed = parseCreateConversationBody({
    title: '  Practice room  ',
    description: '  Follow-up questions  ',
    participantIds: [userId, userId],
  })

  assert.equal(parsed.ok, true)
  if (!parsed.ok) return

  assert.deepEqual(parsed.value, {
    title: 'Practice room',
    description: 'Follow-up questions',
    participantIds: [userId],
  })
})

test('parseCreateConversationBody rejects invalid participant IDs', () => {
  const parsed = parseCreateConversationBody({
    title: 'Practice room',
    participantIds: ['not-a-user-id'],
  })

  assert.equal(parsed.ok, false)
})

test('parseSendMessageBody trims messages and rejects empty bodies', () => {
  const valid = parseSendMessageBody({ body: '  Hello there  ' })
  assert.equal(valid.ok, true)
  if (valid.ok) {
    assert.equal(valid.value.body, 'Hello there')
  }

  const empty = parseSendMessageBody({ body: '    ' })
  assert.equal(empty.ok, false)
})

test('parseSendMessageBody enforces the message length limit', () => {
  const parsed = parseSendMessageBody({
    body: 'x'.repeat(CHAT_MESSAGE_MAX_LENGTH + 1),
  })

  assert.equal(parsed.ok, false)
})

test('parseMessagesQuery caps limit and allows one cursor direction', () => {
  const capped = parseMessagesQuery({ limit: '500' })
  assert.equal(capped.ok, true)
  if (capped.ok) {
    assert.equal(capped.value.limit, 50)
  }

  const bothDirections = parseMessagesQuery({
    before: '2026-06-11T12:00:00.000Z',
    after: '2026-06-11T12:01:00.000Z',
  })
  assert.equal(bothDirections.ok, false)
})

test('parseReportMessageBody accepts an empty body and trims a reason', () => {
  const empty = parseReportMessageBody(undefined)
  assert.equal(empty.ok, true)
  if (empty.ok) {
    assert.deepEqual(empty.value, { reason: '' })
  }

  const reason = parseReportMessageBody({ reason: '  Needs review  ' })
  assert.equal(reason.ok, true)
  if (reason.ok) {
    assert.equal(reason.value.reason, 'Needs review')
  }
})
