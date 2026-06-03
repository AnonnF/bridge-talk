export interface JournalEntry {
  id: string
  createdAt: string // ISO date string
  situation: string // "What was the situation?"
  wentWell: string // "What went well?"
  wasHard: string // "What was hard?"
  doDifferently: string // "What would I do differently?"
  sharedWithCounsellor: boolean
}
