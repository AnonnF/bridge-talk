create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'counsellor')),
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  situation text,
  went_well text,
  was_hard text,
  do_differently text,
  shared_with_counsellor boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scenario_id text not null,
  clarity numeric,
  empathy numeric,
  appropriateness numeric,
  confidence numeric,
  safety numeric,
  completed_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.journal_entries enable row level security;
alter table public.quiz_results enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can view own profile'
  ) then
    create policy "Users can view own profile"
      on public.profiles for select using (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journal_entries'
      and policyname = 'Users can manage own journals'
  ) then
    create policy "Users can manage own journals"
      on public.journal_entries for all using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journal_entries'
      and policyname = 'Counsellors can view shared journals'
  ) then
    create policy "Counsellors can view shared journals"
      on public.journal_entries for select using (
        shared_with_counsellor = true
        and exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'counsellor'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quiz_results'
      and policyname = 'Users can manage own results'
  ) then
    create policy "Users can manage own results"
      on public.quiz_results for all using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quiz_results'
      and policyname = 'Counsellors can view all results'
  ) then
    create policy "Counsellors can view all results"
      on public.quiz_results for select using (
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'counsellor'
        )
      );
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;
