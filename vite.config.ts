import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const srcAlias = fileURLToPath(new URL('./src', import.meta.url))
  const alias =
    mode === 'e2e'
      ? [
          {
            find: '@/lib/supabase',
            replacement: fileURLToPath(
              new URL('./tests/e2e/mocks/supabase.ts', import.meta.url),
            ),
          },
          { find: '@', replacement: srcAlias },
        ]
      : [{ find: '@', replacement: srcAlias }]

  return {
    plugins: [vue()],
    resolve: {
      alias,
    },
  }
})
