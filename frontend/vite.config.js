import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/n8n": {
        target: "http://localhost:5678",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n/, ""),
      },
    },
  },
})
