import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import legacyPlugin from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(), 
    legacyPlugin({
      targets: ['IE >= 11']
    })
  ]
})
