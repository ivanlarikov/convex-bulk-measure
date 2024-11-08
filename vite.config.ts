import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ngrok } from 'vite-plugin-ngrok'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // ngrok('2nHbNlquvQHRVCFjJ8DNaQGcotp_zt8dwy7j4XiJvGo7Gph7')
  ],
})
