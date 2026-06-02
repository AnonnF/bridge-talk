import { ref, watch } from 'vue'
import type { JournalEntry } from '@/types/journal'

const STORAGE_KEY = 'bridge-talk-journal'

function load(): JournalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

const entries = ref<JournalEntry[]>(load())

watch(
  entries,
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
  { deep: true },
)

export function useJournal() {
  function addEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>) {
    entries.value.unshift({
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      sharedWithCounsellor: false,
    })
  }

  function deleteEntry(id: string) {
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  function toggleShare(id: string) {
    const e = entries.value.find((e) => e.id === id)
    if (e) e.sharedWithCounsellor = !e.sharedWithCounsellor
  }

  return { entries, addEntry, deleteEntry, toggleShare }
}
