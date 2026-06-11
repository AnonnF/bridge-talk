<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { supabase } from '@/lib/supabase'
import {
  ChatApiRequestError,
  createChatConversation,
  getChatConversations,
  getChatMessages,
  markChatConversationRead,
  sendChatMessage,
} from '@/services/chatApi'
import type {
  ChatConversationSummary,
  ChatMessage,
  ChatParticipant,
} from '@/types/chat'

const { user, profile } = useAuth()
const draftMessage = ref('')
const chatError = ref('')
const loadingThreads = ref(false)
const loadingMessages = ref(false)
const creatingThread = ref(false)
const sendingMessage = ref(false)

const currentUserId = computed(() => user.value?.id ?? 'current-user')
const currentDisplayName = computed(() => profile.value?.display_name ?? 'You')

const threads = ref<ChatConversationSummary[]>([])
const messagesByThread = ref<Record<string, ChatMessage[]>>({})
const loadedMessagesByThread = ref<Record<string, boolean>>({})
const activeThreadId = ref('')
let chatMessagesChannel: ReturnType<typeof supabase.channel> | null = null

type ChatMessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  deleted_at: string | null
}

const activeThread = computed(() =>
  threads.value.find((thread) => thread.id === activeThreadId.value),
)

const activeParticipants = computed(
  () => activeThread.value?.participants ?? [],
)

const activeMessages = computed(
  () => messagesByThread.value[activeThreadId.value] ?? [],
)

function participantFor(senderId: string): ChatParticipant | null {
  if (senderId === currentUserId.value) {
    return {
      id: currentUserId.value,
      name: currentDisplayName.value,
      role: profile.value?.role ?? 'user',
      status: 'online',
    }
  }

  return (
    activeParticipants.value.find((person) => person.id === senderId) ?? null
  )
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ChatApiRequestError) {
    return error.message
  }

  return error instanceof Error ? error.message : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseRealtimeMessage(value: unknown): ChatMessage | null {
  if (!isRecord(value)) return null

  const row = value as Partial<ChatMessageRow>
  if (
    typeof row.id !== 'string' ||
    typeof row.conversation_id !== 'string' ||
    typeof row.sender_id !== 'string' ||
    typeof row.body !== 'string' ||
    typeof row.created_at !== 'string'
  ) {
    return null
  }

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    deletedAt: typeof row.deleted_at === 'string' ? row.deleted_at : null,
  }
}

function formatMessageTime(timestamp: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (first, second) =>
      Date.parse(first.createdAt) - Date.parse(second.createdAt),
  )
}

function appendMessage(message: ChatMessage): boolean {
  const currentMessages = messagesByThread.value[message.conversationId] ?? []
  if (currentMessages.some((item) => item.id === message.id)) {
    return false
  }

  messagesByThread.value = {
    ...messagesByThread.value,
    [message.conversationId]: sortMessages([...currentMessages, message]),
  }

  return true
}

function updateThreadUnreadCount(threadId: string, unreadCount: number) {
  threads.value = threads.value.map((thread) =>
    thread.id === threadId ? { ...thread, unreadCount } : thread,
  )
}

function updateThreadForMessage(
  message: ChatMessage,
  incrementUnread: boolean,
) {
  threads.value = threads.value.map((thread) => {
    if (thread.id !== message.conversationId) return thread

    return {
      ...thread,
      lastMessage: message,
      updatedAt: message.createdAt,
      unreadCount: incrementUnread
        ? thread.unreadCount + 1
        : thread.unreadCount,
    }
  })
}

async function markActiveThreadRead(threadId: string) {
  updateThreadUnreadCount(threadId, 0)

  try {
    await markChatConversationRead(threadId)
  } catch (error) {
    console.error('Failed to mark chat as read:', error)
  }
}

function handleRealtimeMessage(message: ChatMessage) {
  if (message.deletedAt) return

  const isKnownThread = threads.value.some(
    (thread) => thread.id === message.conversationId,
  )
  if (!isKnownThread) {
    void loadThreads()
    return
  }

  const isActiveThread = message.conversationId === activeThreadId.value
  const isOwnMessage = message.senderId === currentUserId.value
  const shouldIncrementUnread = !isActiveThread && !isOwnMessage

  if (loadedMessagesByThread.value[message.conversationId]) {
    appendMessage(message)
  }

  updateThreadForMessage(message, shouldIncrementUnread)

  if (isActiveThread && !isOwnMessage) {
    void markActiveThreadRead(message.conversationId)
  }
}

async function loadMessages(threadId: string) {
  loadingMessages.value = true
  chatError.value = ''

  try {
    const response = await getChatMessages(threadId)
    messagesByThread.value = {
      ...messagesByThread.value,
      [threadId]: response.messages,
    }
    loadedMessagesByThread.value = {
      ...loadedMessagesByThread.value,
      [threadId]: true,
    }
    await markActiveThreadRead(threadId)
  } catch (error) {
    chatError.value = errorMessage(error, 'Could not load messages')
  } finally {
    loadingMessages.value = false
  }
}

async function loadThreads() {
  loadingThreads.value = true
  chatError.value = ''

  try {
    const loadedThreads = await getChatConversations()
    threads.value = loadedThreads

    if (
      !activeThreadId.value ||
      !loadedThreads.some((thread) => thread.id === activeThreadId.value)
    ) {
      activeThreadId.value = loadedThreads[0]?.id ?? ''
    }

    if (activeThreadId.value) {
      await loadMessages(activeThreadId.value)
    }
  } catch (error) {
    chatError.value = errorMessage(error, 'Could not load conversations')
  } finally {
    loadingThreads.value = false
  }
}

async function subscribeToMessages() {
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    supabase.realtime.setAuth(data.session.access_token)
  }

  chatMessagesChannel = supabase
    .channel('human-chat-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      },
      (payload) => {
        const message = parseRealtimeMessage(payload.new)
        if (message) handleRealtimeMessage(message)
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        chatError.value ||= 'Live chat updates are unavailable.'
      }
    })
}

async function selectThread(threadId: string) {
  activeThreadId.value = threadId

  if (!loadedMessagesByThread.value[threadId]) {
    await loadMessages(threadId)
    return
  }

  await markActiveThreadRead(threadId)
}

async function startNewChat() {
  if (creatingThread.value) return

  creatingThread.value = true
  chatError.value = ''

  try {
    const thread = await createChatConversation({
      title: 'New practice chat',
      description: 'Draft a conversation before inviting another learner.',
    })

    threads.value = [thread, ...threads.value]
    messagesByThread.value = {
      ...messagesByThread.value,
      [thread.id]: [],
    }
    loadedMessagesByThread.value = {
      ...loadedMessagesByThread.value,
      [thread.id]: true,
    }
    activeThreadId.value = thread.id
  } catch (error) {
    chatError.value = errorMessage(error, 'Could not create chat')
  } finally {
    creatingThread.value = false
  }
}

async function sendMessage() {
  const body = draftMessage.value.trim()
  const threadId = activeThread.value?.id
  if (!body || !threadId || sendingMessage.value) return

  sendingMessage.value = true
  chatError.value = ''

  try {
    const message = await sendChatMessage(threadId, { body })
    appendMessage(message)
    updateThreadForMessage(message, false)
    draftMessage.value = ''
  } catch (error) {
    chatError.value = errorMessage(error, 'Could not send message')
  } finally {
    sendingMessage.value = false
  }
}

onMounted(() => {
  void loadThreads()
  void subscribeToMessages()
})

onUnmounted(() => {
  if (chatMessagesChannel) {
    void supabase.removeChannel(chatMessagesChannel)
    chatMessagesChannel = null
  }
})
</script>

<template>
  <div class="chat-page">
    <main class="chat-main">
      <nav class="chat-nav" aria-label="Human interactions">
        <RouterLink to="/" class="chat-nav__back">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Home
        </RouterLink>
      </nav>

      <section class="chat-shell" aria-labelledby="chat-title">
        <div class="chat-shell__header">
          <div>
            <p class="chat-shell__eyebrow">Human interactions</p>
            <h1 id="chat-title">Live chat practice</h1>
          </div>
          <button
            class="chat-shell__new"
            type="button"
            :disabled="creatingThread"
            @click="startNewChat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            {{ creatingThread ? 'Creating' : 'New chat' }}
          </button>
        </div>

        <div class="chat-layout">
          <aside class="thread-panel" aria-label="Conversation list">
            <div class="thread-panel__header">
              <h2>Conversations</h2>
              <span>{{ threads.length }}</span>
            </div>

            <p v-if="chatError" class="chat-state chat-state--error">
              {{ chatError }}
            </p>

            <p v-if="loadingThreads" class="chat-state">
              Loading conversations...
            </p>

            <ul v-else-if="threads.length" class="thread-list">
              <li v-for="thread in threads" :key="thread.id">
                <button
                  class="thread-item"
                  :class="{
                    'thread-item--active': thread.id === activeThreadId,
                  }"
                  type="button"
                  @click="selectThread(thread.id)"
                >
                  <span class="thread-item__avatar" aria-hidden="true">
                    {{ thread.title.charAt(0) }}
                  </span>
                  <span class="thread-item__content">
                    <span class="thread-item__topline">
                      <span class="thread-item__title">{{ thread.title }}</span>
                      <span
                        v-if="thread.unreadCount"
                        class="thread-item__badge"
                      >
                        {{ thread.unreadCount }}
                      </span>
                    </span>
                    <span class="thread-item__description">
                      {{ thread.description }}
                    </span>
                  </span>
                </button>
              </li>
            </ul>

            <p v-else class="chat-state">No conversations yet.</p>
          </aside>

          <section
            v-if="activeThread"
            class="message-panel"
            :aria-label="activeThread.title"
          >
            <header class="message-panel__header">
              <div>
                <h2>{{ activeThread.title }}</h2>
                <p>{{ activeThread.description }}</p>
              </div>
              <div class="participant-stack" aria-label="Participants">
                <span
                  v-for="participant in activeParticipants"
                  :key="participant.id"
                  class="participant-stack__avatar"
                  :title="participant.name"
                >
                  {{ participant.name.charAt(0) }}
                </span>
              </div>
            </header>

            <div class="participant-strip" aria-label="Participant status">
              <span
                v-for="participant in activeParticipants"
                :key="participant.id"
                class="participant-chip"
              >
                <span
                  class="participant-chip__status"
                  :class="`participant-chip__status--${participant.status}`"
                  aria-hidden="true"
                />
                {{ participant.name }} · {{ participant.role }}
              </span>
            </div>

            <p v-if="loadingMessages" class="chat-state">Loading messages...</p>

            <ol
              v-else-if="activeMessages.length"
              class="message-list"
              aria-live="polite"
            >
              <li
                v-for="message in activeMessages"
                :key="message.id"
                class="message-row"
                :class="{
                  'message-row--mine': message.senderId === currentUserId,
                }"
              >
                <div class="message-bubble">
                  <span class="message-bubble__sender">
                    {{ participantFor(message.senderId)?.name ?? 'Unknown' }}
                  </span>
                  <p>{{ message.body }}</p>
                  <time>{{ formatMessageTime(message.createdAt) }}</time>
                </div>
              </li>
            </ol>

            <p v-else class="chat-state">Start the conversation below.</p>

            <form class="composer" @submit.prevent="sendMessage">
              <label class="composer__label" for="chat-message">
                Message
              </label>
              <textarea
                id="chat-message"
                v-model="draftMessage"
                class="composer__input"
                rows="2"
                placeholder="Write a supportive practice message"
              />
              <button
                class="composer__send"
                type="submit"
                :disabled="
                  !draftMessage.trim() || sendingMessage || loadingMessages
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m4 12 16-8-4 16-3-7-9-1Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ sendingMessage ? 'Sending' : 'Send' }}
              </button>
            </form>
          </section>

          <section v-else class="message-panel" aria-label="No conversation">
            <p class="chat-state">Choose or create a conversation.</p>
          </section>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.chat-page {
  min-height: 100svh;
  background: var(--color-bg);
}

.chat-main {
  min-height: 100svh;
  padding: clamp(1rem, 4vw, 1.5rem) var(--space-page-x) 2rem;
}

.chat-nav {
  width: 100%;
  max-width: var(--max-content);
  margin: 0 auto 1rem;
}

.chat-nav__back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  color: var(--color-text-strong);
  text-decoration: none;
}

.chat-nav__back svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.chat-nav__back:focus-visible,
.chat-shell__new:focus-visible,
.thread-item:focus-visible,
.composer__input:focus-visible,
.composer__send:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.chat-shell {
  width: 100%;
  max-width: var(--max-content);
  margin-inline: auto;
}

.chat-shell__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.chat-shell__eyebrow {
  margin-bottom: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #2e7d4f;
}

.chat-shell__header h1 {
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: var(--font-weight-heading);
  line-height: 1.1;
  letter-spacing: 0;
}

.chat-shell__new,
.composer__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-btn-bg);
  color: var(--color-btn-fg);
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  cursor: pointer;
}

.chat-shell__new {
  min-height: 2.625rem;
  padding: 0.5rem 1rem;
}

.chat-shell__new svg,
.composer__send svg {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

.chat-layout {
  display: grid;
  grid-template-columns: minmax(17rem, 20rem) minmax(0, 1fr);
  min-height: min(42rem, calc(100svh - 9rem));
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgb(61 69 65 / 0.1);
  border-radius: 0.5rem;
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.06);
}

.thread-panel {
  display: grid;
  grid-template-rows: auto 1fr;
  min-width: 0;
  border-right: 1px solid rgb(61 69 65 / 0.1);
  background: #fbfaf7;
}

.thread-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgb(61 69 65 / 0.1);
}

.thread-panel__header h2 {
  font-size: 1rem;
  line-height: 1.3;
}

.thread-panel__header span {
  display: grid;
  place-items: center;
  min-width: 1.75rem;
  height: 1.75rem;
  padding-inline: 0.5rem;
  border-radius: var(--radius-pill);
  background: #e8f0eb;
  color: var(--color-text-strong);
  font-size: 0.8125rem;
  font-weight: 700;
}

.thread-list {
  display: grid;
  align-content: start;
  gap: 0.25rem;
  margin: 0;
  padding: 0.5rem;
  overflow: auto;
  list-style: none;
}

.chat-state {
  align-self: start;
  margin: 1rem;
  color: var(--color-text);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.chat-state--error {
  color: #8a1f11;
}

.thread-item {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr);
  gap: 0.75rem;
  width: 100%;
  min-height: 5rem;
  padding: 0.75rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.thread-item:hover,
.thread-item--active {
  background: #efe7dc;
}

.thread-item__avatar,
.participant-stack__avatar {
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #d8f3dc;
  color: #14532d;
  font-weight: 700;
}

.thread-item__avatar {
  width: 2.5rem;
  height: 2.5rem;
}

.thread-item__content {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.thread-item__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.thread-item__title {
  overflow: hidden;
  color: var(--color-text-strong);
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-item__badge {
  display: grid;
  place-items: center;
  min-width: 1.375rem;
  height: 1.375rem;
  padding-inline: 0.375rem;
  border-radius: var(--radius-pill);
  background: #2e7d4f;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
}

.thread-item__description {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.8125rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.message-panel {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  min-width: 0;
  min-height: 0;
}

.message-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgb(61 69 65 / 0.1);
}

.message-panel__header h2 {
  font-size: 1.125rem;
  line-height: 1.3;
}

.message-panel__header p {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--color-text);
}

.participant-stack {
  display: flex;
  flex-shrink: 0;
}

.participant-stack__avatar {
  width: 2rem;
  height: 2rem;
  border: 2px solid #ffffff;
  font-size: 0.75rem;
}

.participant-stack__avatar + .participant-stack__avatar {
  margin-left: -0.5rem;
}

.participant-strip {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid rgb(61 69 65 / 0.1);
}

.participant-chip {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: var(--radius-pill);
  background: #f5f5f0;
  color: var(--color-text-strong);
  font-size: 0.8125rem;
  line-height: 1.3;
}

.participant-chip__status {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #9c9389;
}

.participant-chip__status--online {
  background: #2e7d4f;
}

.participant-chip__status--away {
  background: #b7791f;
}

.message-list {
  display: grid;
  align-content: start;
  gap: 0.75rem;
  margin: 0;
  padding: 1.25rem;
  overflow: auto;
  list-style: none;
  background: #faf8f5;
}

.message-row {
  display: flex;
}

.message-row--mine {
  justify-content: flex-end;
}

.message-bubble {
  display: grid;
  gap: 0.25rem;
  max-width: min(34rem, 78%);
  padding: 0.75rem 0.875rem;
  border-radius: 0.5rem;
  background: #ffffff;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.05);
}

.message-row--mine .message-bubble {
  background: #e8f0eb;
}

.message-bubble__sender {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-strong);
}

.message-bubble p {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--color-text-strong);
}

.message-bubble time {
  justify-self: end;
  color: var(--color-text);
  font-size: 0.75rem;
}

.composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid rgb(61 69 65 / 0.1);
}

.composer__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.composer__input {
  min-height: 3rem;
  max-height: 8rem;
  resize: vertical;
  padding: 0.75rem 0.875rem;
  border: 1px solid rgb(61 69 65 / 0.2);
  border-radius: 0.5rem;
  background: #ffffff;
  color: var(--color-text-strong);
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.45;
}

.composer__send {
  align-self: end;
  min-width: 6.5rem;
  min-height: 3rem;
  padding: 0.5rem 1rem;
}

.composer__send:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 48rem) {
  .chat-shell__header {
    align-items: stretch;
    flex-direction: column;
  }

  .chat-shell__new {
    width: fit-content;
  }

  .chat-layout {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .thread-panel {
    border-right: 0;
    border-bottom: 1px solid rgb(61 69 65 / 0.1);
  }

  .thread-list {
    grid-auto-flow: column;
    grid-auto-columns: minmax(16rem, 18rem);
    overflow-x: auto;
  }

  .message-panel {
    min-height: 34rem;
  }
}

@media (max-width: 37.5rem) {
  .chat-main {
    padding-top: 1.5rem;
  }

  .chat-shell__header h1 {
    font-size: 2rem;
  }

  .message-panel__header {
    align-items: start;
    flex-direction: column;
  }

  .message-bubble {
    max-width: 88%;
  }

  .composer {
    grid-template-columns: 1fr;
  }

  .composer__send {
    width: 100%;
  }
}
</style>
