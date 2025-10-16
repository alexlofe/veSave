import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(projectRoot, 'node_modules/react'),
      'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
})
