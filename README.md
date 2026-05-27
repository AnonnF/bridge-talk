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
| `npm run dev`          | Start the development server            |
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

No environment variables are required for the current app. When you add API keys or public config later, set them under **Project → Settings → Environment Variables** in Vercel (and use `import.meta.env` in the app).

### Branch behavior

| Branch / event | Vercel behavior                                       |
| -------------- | ----------------------------------------------------- |
| Push to `main` | **Production** deployment (your live URL)             |
| Pull request   | **Preview** deployment (unique URL per PR)            |
| Other branches | Preview deployment when pushed (if enabled in Vercel) |

Set **Production Branch** to `main` under **Project → Settings → Git**.

### SPA routing

[`vercel.json`](vercel.json) rewrites unknown paths to `index.html` so client-side routes work once you add Vue Router.

### Local production preview

```bash
npm run build
npm run preview
```

## Project structure

- `src/` — application source (Vue SFCs, TypeScript)
- `public/` — static assets served as-is
- `dist/` — production build output (generated)
