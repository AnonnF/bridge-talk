import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import type { JournalEntry } from '@/types/journal'

type DbRow = Record<string, unknown>

function toEntry(row: DbRow): JournalEntry {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    situation: (row.situation as string) ?? '',
    wentWell: (row.went_well as string) ?? '',
    wasHard: (row.was_hard as string) ?? '',
    doDifferently: (row.do_differently as string) ?? '',
    sharedWithCounsellor: (row.shared_with_counsellor as boolean) ?? false,
  }
}

const entries = ref<JournalEntry[]>([])
const loading = ref(false)

export function useJournal() {
  const { user } = useAuth()

  async function fetchEntries() {
    if (!user.value) return
    loading.value = true
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
    entries.value = (data ?? []).map((row) => toEntry(row as DbRow))
    loading.value = false
  }

  async function addEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'sharedWithCounsellor'>) {
    if (!user.value) return
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.value.id,
        situation: entry.situation,
        went_well: entry.wentWell,
        was_hard: entry.wasHard,
        do_differently: entry.doDifferently,
        shared_with_counsellor: false,
      })
      .select()
      .single()
    if (!error && data) {
      entries.value.unshift(toEntry(data as DbRow))
    }
  }

  async function deleteEntry(id: string) {
    await supabase.from('journal_entries').delete().eq('id', id)
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  async function toggleShare(id: string) {
    const entry = entries.value.find((e) => e.id === id)
    if (!entry) return
    const newValue = !entry.sharedWithCounsellor
    await supabase
      .from('journal_entries')
      .update({ shared_with_counsellor: newValue })
      .eq('id', id)
    entry.sharedWithCounsellor = newValue
  }

  return { entries, loading, fetchEntries, addEntry, deleteEntry, toggleShare }
}
