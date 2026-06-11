import type {
  ChatConversationSummary,
  ChatMessage,
  ChatParticipant,
} from '../../src/types/chat.js'
import type { Database } from '../types/database.js'
import type { ChatMessagesQuery } from './chatValidation.js'
import { getAdminClient } from './supabase.js'

type Tables = Database['public']['Tables']
type ProfileRow = Tables['profiles']['Row']
type ConversationRow = Tables['chat_conversations']['Row']
type MembershipRow = Tables['chat_memberships']['Row']
type MembershipInsert = Tables['chat_memberships']['Insert']
type MessageRow = Pick<
  Tables['chat_messages']['Row'],
  'id' | 'conversation_id' | 'sender_id' | 'body' | 'created_at' | 'deleted_at'
>

export class ChatForbiddenError extends Error {
  constructor(message = 'You do not have access to this conversation') {
    super(message)
  }
}

export class ChatNotFoundError extends Error {
  constructor(message = 'Chat resource not found') {
    super(message)
  }
}

export class ChatConflictError extends Error {
  constructor(message = 'Chat resource conflict') {
    super(message)
  }
}

function toMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  }
}

function toParticipant(profile: ProfileRow): ChatParticipant {
  return {
    id: profile.id,
    name: profile.display_name ?? 'Learner',
    role: profile.role,
    status: 'offline',
  }
}

async function loadProfiles(
  userIds: string[],
): Promise<Map<string, ProfileRow>> {
  if (userIds.length === 0) return new Map()

  const { data, error } = await getAdminClient()
    .from('profiles')
    .select('id, role, display_name')
    .in('id', userIds)

  if (error) throw error

  return new Map((data as ProfileRow[]).map((profile) => [profile.id, profile]))
}

async function loadMembership(
  conversationId: string,
  userId: string,
): Promise<MembershipRow | null> {
  const { data, error } = await getAdminClient()
    .from('chat_memberships')
    .select(
      'conversation_id, user_id, role, joined_at, last_read_at, blocked_at',
    )
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as MembershipRow | null
}

async function requireActiveMembership(
  conversationId: string,
  userId: string,
): Promise<MembershipRow> {
  const membership = await loadMembership(conversationId, userId)
  if (!membership || membership.blocked_at) {
    throw new ChatForbiddenError()
  }

  return membership
}

async function loadConversationMemberships(
  conversationIds: string[],
): Promise<MembershipRow[]> {
  if (conversationIds.length === 0) return []

  const { data, error } = await getAdminClient()
    .from('chat_memberships')
    .select(
      'conversation_id, user_id, role, joined_at, last_read_at, blocked_at',
    )
    .in('conversation_id', conversationIds)
    .is('blocked_at', null)

  if (error) throw error
  return data as MembershipRow[]
}

async function loadLastMessage(
  conversationId: string,
): Promise<ChatMessage | null> {
  const { data, error } = await getAdminClient()
    .from('chat_messages')
    .select('id, conversation_id, sender_id, body, created_at, deleted_at')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? toMessage(data as MessageRow) : null
}

async function loadUnreadCount(
  membership: MembershipRow,
  viewerId: string,
): Promise<number> {
  const since = membership.last_read_at ?? membership.joined_at
  const { count, error } = await getAdminClient()
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', membership.conversation_id)
    .neq('sender_id', viewerId)
    .is('deleted_at', null)
    .gt('created_at', since)

  if (error) throw error
  return count ?? 0
}

async function toConversationSummary(
  conversation: ConversationRow,
  viewerMembership: MembershipRow,
  conversationMemberships: MembershipRow[],
  profiles: Map<string, ProfileRow>,
): Promise<ChatConversationSummary> {
  const participants = conversationMemberships
    .filter((membership) => membership.conversation_id === conversation.id)
    .map((membership) => profiles.get(membership.user_id))
    .filter((profile): profile is ProfileRow => profile !== undefined)
    .map(toParticipant)

  const [lastMessage, unreadCount] = await Promise.all([
    loadLastMessage(conversation.id),
    loadUnreadCount(viewerMembership, viewerMembership.user_id),
  ])

  return {
    id: conversation.id,
    title: conversation.title,
    description: conversation.description,
    participants,
    unreadCount,
    lastMessage,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
  }
}

export async function listChatConversations(
  viewerId: string,
): Promise<ChatConversationSummary[]> {
  const { data: membershipsData, error: membershipsError } =
    await getAdminClient()
      .from('chat_memberships')
      .select(
        'conversation_id, user_id, role, joined_at, last_read_at, blocked_at',
      )
      .eq('user_id', viewerId)
      .is('blocked_at', null)

  if (membershipsError) throw membershipsError

  const viewerMemberships = membershipsData as MembershipRow[]
  const conversationIds = viewerMemberships.map(
    (membership) => membership.conversation_id,
  )
  if (conversationIds.length === 0) return []

  const { data: conversationsData, error: conversationsError } =
    await getAdminClient()
      .from('chat_conversations')
      .select('id, title, description, created_by, created_at, updated_at')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

  if (conversationsError) throw conversationsError

  const conversations = conversationsData as ConversationRow[]
  const allMemberships = await loadConversationMemberships(conversationIds)
  const profileIds = [...new Set(allMemberships.map((item) => item.user_id))]
  const profiles = await loadProfiles(profileIds)
  const membershipByConversation = new Map(
    viewerMemberships.map((membership) => [
      membership.conversation_id,
      membership,
    ]),
  )

  return Promise.all(
    conversations.map((conversation) => {
      const viewerMembership = membershipByConversation.get(conversation.id)
      if (!viewerMembership) {
        throw new ChatForbiddenError()
      }

      return toConversationSummary(
        conversation,
        viewerMembership,
        allMemberships,
        profiles,
      )
    }),
  )
}

export async function listChatParticipants(
  viewerId: string,
): Promise<ChatParticipant[]> {
  const { data, error } = await getAdminClient()
    .from('profiles')
    .select('id, role, display_name')
    .neq('id', viewerId)
    .order('display_name', { ascending: true, nullsFirst: false })

  if (error) throw error

  return (data as ProfileRow[]).map(toParticipant)
}

export async function createChatConversation(
  viewerId: string,
  title: string,
  description: string,
  participantIds: string[],
): Promise<ChatConversationSummary> {
  const uniqueParticipantIds = [...new Set([viewerId, ...participantIds])]
  const profiles = await loadProfiles(uniqueParticipantIds)
  if (profiles.size !== uniqueParticipantIds.length) {
    throw new ChatNotFoundError('One or more participants were not found')
  }

  const { data: conversationData, error: conversationError } =
    await getAdminClient()
      .from('chat_conversations')
      .insert({ title, description, created_by: viewerId })
      .select('id, title, description, created_by, created_at, updated_at')
      .single()

  if (conversationError) throw conversationError

  const conversation = conversationData as ConversationRow
  const membershipRows: MembershipInsert[] = uniqueParticipantIds.map(
    (userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: userId === viewerId ? 'moderator' : 'member',
    }),
  )

  const { data: insertedMemberships, error: membershipError } =
    await getAdminClient()
      .from('chat_memberships')
      .insert(membershipRows)
      .select(
        'conversation_id, user_id, role, joined_at, last_read_at, blocked_at',
      )

  if (membershipError) {
    await getAdminClient()
      .from('chat_conversations')
      .delete()
      .eq('id', conversation.id)
    throw membershipError
  }

  const memberships = insertedMemberships as MembershipRow[]
  const viewerMembership = memberships.find(
    (membership) => membership.user_id === viewerId,
  )
  if (!viewerMembership) {
    throw new ChatConflictError('Creator membership was not created')
  }

  return toConversationSummary(
    conversation,
    viewerMembership,
    memberships,
    profiles,
  )
}

export async function listChatMessages(
  viewerId: string,
  conversationId: string,
  query: ChatMessagesQuery,
): Promise<{ messages: ChatMessage[]; nextBefore: string | null }> {
  await requireActiveMembership(conversationId, viewerId)

  let request = getAdminClient()
    .from('chat_messages')
    .select('id, conversation_id, sender_id, body, created_at, deleted_at')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)

  if (query.before) {
    request = request.lt('created_at', query.before)
  }

  if (query.after) {
    request = request.gt('created_at', query.after)
  }

  const newestFirst = !query.after
  const { data, error } = await request
    .order('created_at', { ascending: !newestFirst })
    .order('id', { ascending: !newestFirst })
    .limit(query.limit)

  if (error) throw error

  const rows = data as MessageRow[]
  const orderedRows = newestFirst ? [...rows].reverse() : rows
  const messages = orderedRows.map(toMessage)

  return {
    messages,
    nextBefore:
      newestFirst && rows.length === query.limit
        ? (messages[0]?.createdAt ?? null)
        : null,
  }
}

export async function sendChatMessage(
  viewerId: string,
  conversationId: string,
  body: string,
): Promise<ChatMessage> {
  await requireActiveMembership(conversationId, viewerId)

  const { data, error } = await getAdminClient()
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: viewerId,
      body,
    })
    .select('id, conversation_id, sender_id, body, created_at, deleted_at')
    .single()

  if (error) throw error
  return toMessage(data as MessageRow)
}

export async function markChatConversationRead(
  viewerId: string,
  conversationId: string,
): Promise<string> {
  await requireActiveMembership(conversationId, viewerId)

  const readAt = new Date().toISOString()
  const { error } = await getAdminClient()
    .from('chat_memberships')
    .update({ last_read_at: readAt })
    .eq('conversation_id', conversationId)
    .eq('user_id', viewerId)

  if (error) throw error
  return readAt
}

export async function reportChatMessage(
  viewerId: string,
  messageId: string,
  reason: string,
): Promise<string> {
  const { data: messageData, error: messageError } = await getAdminClient()
    .from('chat_messages')
    .select('id, conversation_id, sender_id, body, created_at, deleted_at')
    .eq('id', messageId)
    .is('deleted_at', null)
    .maybeSingle()

  if (messageError) throw messageError
  if (!messageData) throw new ChatNotFoundError('Message not found')

  const message = messageData as MessageRow
  await requireActiveMembership(message.conversation_id, viewerId)

  const { data, error } = await getAdminClient()
    .from('chat_reports')
    .upsert(
      {
        message_id: messageId,
        reporter_id: viewerId,
        reason,
      },
      { onConflict: 'message_id,reporter_id' },
    )
    .select('id')
    .single()

  if (error) throw error
  return (data as { id: string }).id
}
