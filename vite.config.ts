import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const phosaiUrl = (process.env.VITE_PHOSAI_TTS_URL || env.VITE_PHOSAI_TTS_URL)?.trim()

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
      host: true,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'agents.phosaico.com',
        '.phosaico.com',
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
