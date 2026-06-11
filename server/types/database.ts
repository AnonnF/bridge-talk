export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'user' | 'counsellor'
          display_name: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          role: 'user' | 'counsellor'
          display_name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          role?: 'user' | 'counsellor'
          display_name?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          id: string
          title: string
          description: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_memberships: {
        Row: {
          conversation_id: string
          user_id: string
          role: 'member' | 'moderator'
          joined_at: string
          last_read_at: string | null
          muted_at: string | null
          blocked_at: string | null
        }
        Insert: {
          conversation_id: string
          user_id: string
          role?: 'member' | 'moderator'
          joined_at?: string
          last_read_at?: string | null
          muted_at?: string | null
          blocked_at?: string | null
        }
        Update: {
          conversation_id?: string
          user_id?: string
          role?: 'member' | 'moderator'
          joined_at?: string
          last_read_at?: string | null
          muted_at?: string | null
          blocked_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          created_at: string
          edited_at: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body: string
          created_at?: string
          edited_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          body?: string
          created_at?: string
          edited_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: []
      }
      chat_reports: {
        Row: {
          id: string
          message_id: string
          reporter_id: string
          reason: string
          created_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          message_id: string
          reporter_id: string
          reason?: string
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          reporter_id?: string
          reason?: string
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
