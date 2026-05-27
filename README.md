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

## Project structure

- `src/` — application source (Vue SFCs, TypeScript)
- `public/` — static assets served as-is
- `dist/` — production build output (generated)
