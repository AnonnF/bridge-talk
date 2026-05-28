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

- `npm run type-check`
- `npm run lint`
- `npm run format:check`
- `npm run build`

Workflow file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

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

| Variable            | When                      | Value                                                                        |
| ------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | Local dev only (optional) | `http://localhost:3001` — see [`.env.development`](.env.development)         |
| `CORS_ORIGIN`       | Optional                  | Override API CORS origin (defaults to Vercel URL or `http://localhost:5173`) |

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
