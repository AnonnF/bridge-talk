<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

type ChatParticipant = {
  id: string
  name: string
  role: string
  status: 'online' | 'away' | 'offline'
}

type ChatMessage = {
  id: string
  senderId: string
  body: string
  sentAt: string
}

type ChatThread = {
  id: string
  title: string
  description: string
  participants: ChatParticipant[]
  unreadCount: number
  messages: ChatMessage[]
}

const { user, profile } = useAuth()
const draftMessage = ref('')

const currentUserId = computed(() => user.value?.id ?? 'current-user')
const currentDisplayName = computed(() => profile.value?.display_name ?? 'You')

// TODO(chat-backend): Replace this placeholder state with conversations loaded
// from the backend for the signed-in user.
const threads = ref<ChatThread[]>([
  {
    id: 'peer-practice',
    title: 'Peer practice room',
    description: 'Practise everyday situations with other learners.',
    unreadCount: 2,
    participants: [
      {
        id: 'maya',
        name: 'Maya',
        role: 'Learner',
        status: 'online',
      },
      {
        id: 'sam',
        name: 'Sam',
        role: 'Learner',
        status: 'away',
      },
    ],
    messages: [
      {
        id: 'm1',
        senderId: 'maya',
        body: 'Does anyone want to practise joining a group conversation?',
        sentAt: '09:42',
      },
      {
        id: 'm2',
        senderId: 'sam',
        body: 'I can. I want to work on opening lines that feel natural.',
        sentAt: '09:44',
      },
      {
        id: 'm3',
        senderId: currentUserId.value,
        body: 'I can join for a few rounds too.',
        sentAt: '09:46',
      },
    ],
  },
  {
    id: 'check-in',
    title: 'Daily check-in',
    description: 'Share goals before a real conversation.',
    unreadCount: 0,
    participants: [
      {
        id: 'alex',
        name: 'Alex',
        role: 'Learner',
        status: 'online',
      },
    ],
    messages: [
      {
        id: 'm4',
        senderId: 'alex',
        body: 'Today I am going to ask one follow-up question instead of ending the conversation early.',
        sentAt: '08:15',
      },
    ],
  },
  {
    id: 'moderated-room',
    title: 'Moderated support room',
    description: 'A safer space for sensitive or difficult interactions.',
    unreadCount: 0,
    participants: [
      {
        id: 'riley',
        name: 'Riley',
        role: 'Peer mentor',
        status: 'offline',
      },
    ],
    messages: [
      {
        id: 'm5',
        senderId: 'riley',
        body: 'Leave a note here and a mentor can help you shape the conversation.',
        sentAt: 'Yesterday',
      },
    ],
  },
])

const activeThreadId = ref(threads.value[0]?.id ?? '')

const activeThread = computed(() =>
  threads.value.find((thread) => thread.id === activeThreadId.value),
)

const activeParticipants = computed(
  () => activeThread.value?.participants ?? [],
)

const activeMessages = computed(() => activeThread.value?.messages ?? [])

function participantFor(senderId: string): ChatParticipant | null {
  if (senderId === currentUserId.value) {
    return {
      id: currentUserId.value,
      name: currentDisplayName.value,
      role: 'Learner',
      status: 'online',
    }
  }

  return (
    activeParticipants.value.find((person) => person.id === senderId) ?? null
  )
}

function selectThread(threadId: string) {
  activeThreadId.value = threadId
  const thread = threads.value.find((item) => item.id === threadId)
  if (thread) thread.unreadCount = 0

  // TODO(chat-backend): Mark the selected conversation as read on the backend.
}

function startNewChat() {
  const threadId = `local-thread-${Date.now()}`
  threads.value.unshift({
    id: threadId,
    title: 'New practice chat',
    description: 'Draft a conversation before backend rooms are connected.',
    unreadCount: 0,
    participants: [],
    messages: [],
  })
  activeThreadId.value = threadId

  // TODO(chat-backend): Replace this with room creation/invitation once the
  // backend exposes conversation membership.
}

function sendMessage() {
  const body = draftMessage.value.trim()
  if (!body || !activeThread.value) return

  activeThread.value.messages.push({
    id: `local-${Date.now()}`,
    senderId: currentUserId.value,
    body,
    sentAt: new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  })
  draftMessage.value = ''

  // TODO(chat-backend): Send this message through the real chat API or realtime
  // channel, then replace the optimistic local message with the persisted one.
}
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
          <button class="chat-shell__new" type="button" @click="startNewChat">
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
            New chat
          </button>
        </div>

        <div class="chat-layout">
          <aside class="thread-panel" aria-label="Conversation list">
            <div class="thread-panel__header">
              <h2>Conversations</h2>
              <span>{{ threads.length }}</span>
            </div>

            <ul class="thread-list">
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

            <ol class="message-list" aria-live="polite">
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
                  <time>{{ message.sentAt }}</time>
                </div>
              </li>
            </ol>

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
                :disabled="!draftMessage.trim()"
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
                Send
              </button>
            </form>
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
