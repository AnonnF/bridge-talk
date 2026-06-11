type Profile = {
  id: string
  role: 'user' | 'counsellor'
  display_name: string
}

type RealtimeCallback = (payload: { new: unknown }) => void

const user = {
  id: 'user-1',
  email: 'learner@example.com',
}

const session = {
  access_token: 'e2e-access-token',
  user,
}

const profile: Profile = {
  id: user.id,
  role: 'user',
  display_name: 'Test Learner',
}

const realtimeCallbacks = new Set<RealtimeCallback>()

function createProfilesQuery() {
  let selectedId = ''

  return {
    select() {
      return this
    },
    eq(column: string, value: string) {
      if (column === 'id') {
        selectedId = value
      }
      return this
    },
    async single() {
      return {
        data: selectedId === profile.id ? profile : null,
        error: null,
      }
    },
  }
}

if (typeof window !== 'undefined') {
  window.__bridgeTalkEmitChatMessage = (message: unknown) => {
    for (const callback of realtimeCallbacks) {
      callback({ new: message })
    }
  }
}

export const supabase = {
  auth: {
    async getSession() {
      return { data: { session }, error: null }
    },
    onAuthStateChange() {
      return {
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      }
    },
    async signInWithPassword() {
      return { data: { session }, error: null }
    },
    async signOut() {
      return { error: null }
    },
  },
  from(table: string) {
    if (table === 'profiles') {
      return createProfilesQuery()
    }

    throw new Error(`Unexpected Supabase table in e2e mock: ${table}`)
  },
  realtime: {
    setAuth() {},
  },
  channel() {
    const channel = {
      on(
        _event: string,
        _filter: Record<string, unknown>,
        callback: RealtimeCallback,
      ) {
        realtimeCallbacks.add(callback)
        return channel
      },
      subscribe(callback?: (status: string) => void) {
        callback?.('SUBSCRIBED')
        return channel
      },
    }

    return channel
  },
  async removeChannel(channel: { on: unknown }) {
    void channel
    realtimeCallbacks.clear()
    return 'ok'
  },
}

declare global {
  interface Window {
    __bridgeTalkEmitChatMessage?: (message: unknown) => void
  }
}
