import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Docker Compose sets process.env; loadEnv only reads .env files
  const phosaiUrl = (process.env.VITE_PHOSAI_TTS_URL || env.VITE_PHOSAI_TTS_URL)?.trim()
  const extraAllowedHosts = (process.env.VITE_ALLOWED_HOSTS || env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ['firebase/app', 'firebase/auth'],
    },
    server: {
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'agents.atekervoices.com',
        '.atekervoices.com',
        ...extraAllowedHosts,
      ],
      ...(phosaiUrl
        ? {
            proxy: {
              '/phosai-api': {
                target: phosaiUrl,
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/phosai-api/, ''),
              },
            },
          }
        : {}),
    },
  }
})
