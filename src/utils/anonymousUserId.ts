const STORAGE_KEY = 'bridge-talk:user-id'

export function getOrCreateUserId(): string {
  if (typeof localStorage === 'undefined') {
    return 'anonymous'
  }

  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing && existing.trim() !== '') {
    return existing
  }

  const userId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `user-${Date.now()}`
  localStorage.setItem(STORAGE_KEY, userId)
  return userId
}
