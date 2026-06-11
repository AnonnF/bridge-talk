create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null check (
    char_length(trim(title)) between 1 and 80
  ),
  description text not null default '' check (
    char_length(description) <= 180
  ),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_memberships (
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'moderator')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  muted_at timestamptz,
  blocked_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (
    char_length(trim(body)) between 1 and 1000
  ),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.chat_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 300),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  unique (message_id, reporter_id)
);

create index if not exists chat_memberships_user_id_idx
  on public.chat_memberships (user_id, conversation_id);

create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages (conversation_id, created_at desc, id desc)
  where deleted_at is null;

create index if not exists chat_messages_sender_idx
  on public.chat_messages (sender_id, created_at desc);

create index if not exists chat_reports_message_idx
  on public.chat_reports (message_id, created_at desc);

alter table public.chat_conversations enable row level security;
alter table public.chat_memberships enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_reports enable row level security;

create or replace function public.is_chat_member(
  target_conversation_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_memberships
    where conversation_id = target_conversation_id
      and user_id = target_user_id
      and blocked_at is null
  );
$$;

create or replace function public.is_chat_moderator(
  target_conversation_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_memberships
    where conversation_id = target_conversation_id
      and user_id = target_user_id
      and role = 'moderator'
      and blocked_at is null
  );
$$;

create or replace function public.touch_chat_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'chat_messages_touch_conversation'
  ) then
    create trigger chat_messages_touch_conversation
      after insert on public.chat_messages
      for each row execute procedure public.touch_chat_conversation();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_conversations'
      and policyname = 'Chat members can view conversations'
  ) then
    create policy "Chat members can view conversations"
      on public.chat_conversations for select
      using (public.is_chat_member(id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_conversations'
      and policyname = 'Users can create conversations'
  ) then
    create policy "Users can create conversations"
      on public.chat_conversations for insert
      with check (created_by = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_conversations'
      and policyname = 'Conversation moderators can update conversations'
  ) then
    create policy "Conversation moderators can update conversations"
      on public.chat_conversations for update
      using (created_by = auth.uid() or public.is_chat_moderator(id))
      with check (created_by = auth.uid() or public.is_chat_moderator(id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_memberships'
      and policyname = 'Chat members can view memberships'
  ) then
    create policy "Chat members can view memberships"
      on public.chat_memberships for select
      using (public.is_chat_member(conversation_id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_memberships'
      and policyname = 'Creators and moderators can add memberships'
  ) then
    create policy "Creators and moderators can add memberships"
      on public.chat_memberships for insert
      with check (
        user_id = auth.uid()
        or public.is_chat_moderator(conversation_id)
        or exists (
          select 1 from public.chat_conversations
          where chat_conversations.id = conversation_id
            and chat_conversations.created_by = auth.uid()
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_memberships'
      and policyname = 'Users and moderators can update memberships'
  ) then
    create policy "Users and moderators can update memberships"
      on public.chat_memberships for update
      using (user_id = auth.uid() or public.is_chat_moderator(conversation_id))
      with check (user_id = auth.uid() or public.is_chat_moderator(conversation_id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
      and policyname = 'Chat members can view messages'
  ) then
    create policy "Chat members can view messages"
      on public.chat_messages for select
      using (deleted_at is null and public.is_chat_member(conversation_id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
      and policyname = 'Chat members can send own messages'
  ) then
    create policy "Chat members can send own messages"
      on public.chat_messages for insert
      with check (
        sender_id = auth.uid()
        and public.is_chat_member(conversation_id)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
      and policyname = 'Senders and moderators can update messages'
  ) then
    create policy "Senders and moderators can update messages"
      on public.chat_messages for update
      using (sender_id = auth.uid() or public.is_chat_moderator(conversation_id))
      with check (sender_id = auth.uid() or public.is_chat_moderator(conversation_id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_reports'
      and policyname = 'Reporters and moderators can view reports'
  ) then
    create policy "Reporters and moderators can view reports"
      on public.chat_reports for select
      using (
        reporter_id = auth.uid()
        or exists (
          select 1
          from public.chat_messages
          where chat_messages.id = message_id
            and public.is_chat_moderator(chat_messages.conversation_id)
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_reports'
      and policyname = 'Chat members can report visible messages'
  ) then
    create policy "Chat members can report visible messages"
      on public.chat_reports for insert
      with check (
        reporter_id = auth.uid()
        and exists (
          select 1
          from public.chat_messages
          where chat_messages.id = message_id
            and chat_messages.deleted_at is null
            and public.is_chat_member(chat_messages.conversation_id)
        )
      );
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
