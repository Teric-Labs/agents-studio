import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const phosaiUrl = (env.VITE_PHOSAI_TTS_URL || 'https://laurine-unappropriable-unvolcanically.ngrok-free.app').trim()

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
      allowedHosts: env.VITE_NGROK_HOST ? [env.VITE_NGROK_HOST] : [],
      proxy: {
        '/phosai-api': {
          target: phosaiUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/phosai-api/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
            });
          }
        }
      }
    }
  }
})
