# Bridge Talk

Vue 3 + TypeScript website built with [Vite](https://vite.dev/).

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm

## Setup

```bash
npm install
```

## Scripts

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start the Vite dev server               |
| `npm run dev:api`      | Start the question bank API (port 3001) |
| `npm run dev:full`     | Start Vite + API together               |
| `npm run build`        | Type-check and build for production     |
| `npm run preview`      | Preview the production build locally    |
| `npm run type-check`   | Run TypeScript checks only              |
| `npm run lint`         | Run ESLint                              |
| `npm run lint:fix`     | Run ESLint with auto-fix                |
| `npm run format`       | Format code with Prettier               |
| `npm run format:check` | Verify formatting without writing files |

## CI

On every push and pull request, GitHub Actions runs:

- `npm run type-check` — `src/`, `server/`, and `api/` (via TypeScript project references)
- `npm run lint` — ESLint on frontend and backend TypeScript/Vue
- `npm run format:check` — Prettier on the repo (including `server/` and `server/data/*.json`)
- `npm run build` — production frontend build (`dist/`); Vercel bundles `api/` separately at deploy time

Workflow file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## Supabase Setup

Bridge Talk uses [Supabase](https://supabase.com) for authentication and persistent storage.

### 1. Create a Supabase project

Sign in at [supabase.com](https://supabase.com), create a new project, and wait for it to provision.

### 2. Run the database schema

In the Supabase dashboard go to **SQL Editor → New query** and run the following blocks in order.

**Tables:**

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'counsellor')),
  display_name text,
  created_at timestamptz default now()
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  situation text,
  went_well text,
  was_hard text,
  do_differently text,
  shared_with_counsellor boolean default false,
  created_at timestamptz default now()
);

create table quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  scenario_id text not null,
  clarity numeric,
  empathy numeric,
  appropriateness numeric,
  confidence numeric,
  safety numeric,
  completed_at timestamptz default now()
);
```

**Row Level Security:**

```sql
alter table profiles enable row level security;
alter table journal_entries enable row level security;
alter table quiz_results enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can manage own journals"
  on journal_entries for all using (auth.uid() = user_id);

create policy "Counsellors can view shared journals"
  on journal_entries for select using (
    shared_with_counsellor = true
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'counsellor'
    )
  );

create policy "Users can manage own results"
  on quiz_results for all using (auth.uid() = user_id);

create policy "Counsellors can view all results"
  on quiz_results for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'counsellor'
    )
  );
```

**Auto-create profile on signup trigger:**

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

### 3. Configure environment variables

**Local development** — fill in `.env.development` (never committed):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key-here
```

**Production (Vercel)** — go to **Vercel → Project → Settings → Environment Variables** and add the same two keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) for the Production environment. See `.env.example` for reference.

Both values are found in the Supabase dashboard under **Project Settings → API**.

## Deploy to Vercel

Vercel builds and hosts the site from GitHub. GitHub Actions CI and Vercel deploys run separately: CI validates code on every push/PR; Vercel builds and publishes when you connect the repo.

### One-time setup

1. Push this repository to GitHub.
2. Sign in at [vercel.com](https://vercel.com) and choose **Add New → Project**.
3. Import the `bridge-talk` GitHub repository and grant Vercel access.
4. Confirm project settings (Vercel usually auto-detects Vite):

   | Setting          | Value                                   |
   | ---------------- | --------------------------------------- |
   | Framework Preset | Vite                                    |
   | Build Command    | `npm run build`                         |
   | Output Directory | `dist`                                  |
   | Install Command  | `npm ci` (recommended) or `npm install` |

5. Click **Deploy**.

**Question bank API on Vercel:** The Express app in `server/` is deployed as a serverless function at `/api` (see [`api/index.ts`](api/index.ts)). The production frontend calls `/api/...` on the same host — you do **not** need `VITE_API_BASE_URL` unless the API is hosted elsewhere.

| Variable               | When                      | Value                                                                        |
| ---------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`    | Local dev only (optional) | `http://localhost:3001` — see [`.env.development`](.env.development)         |
| `CORS_ORIGIN`          | Optional                  | Override API CORS origin (defaults to Vercel URL or `http://localhost:5173`) |
| `VITE_SUPABASE_URL`    | **Required**              | Your Supabase project URL — set in Vercel dashboard for production           |
| `VITE_SUPABASE_ANON_KEY` | **Required**            | Your Supabase publishable key — set in Vercel dashboard for production       |

### Branch behavior

| Branch / event | Vercel behavior                                       |
| -------------- | ----------------------------------------------------- |
| Push to `main` | **Production** deployment (your live URL)             |
| Pull request   | **Preview** deployment (unique URL per PR)            |
| Other branches | Preview deployment when pushed (if enabled in Vercel) |

Set **Production Branch** to `main` under **Project → Settings → Git**.

### SPA routing and API

[`vercel.json`](vercel.json) routes `/api/*` to the serverless API and sends all other paths to `index.html` for Vue Router.

### Local production preview

```bash
npm run build
npm run preview
```

## Project structure

- `src/` — application source (Vue SFCs, TypeScript)
- `public/` — static assets served as-is
- `dist/` — production build output (generated)
