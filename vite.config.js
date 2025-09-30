import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/oss-proxy': {
          target: 'https://sunhe197428.oss-cn-beijing.aliyuncs.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/oss-proxy/, ''),
          headers: {
            Referer: 'https://sunhe197428.oss-cn-beijing.aliyuncs.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Origin': 'https://sunhe197428.oss-cn-beijing.aliyuncs.com'
          }
        },
        '/api': {
          // target: 'https://bishe.asia',
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/api/, '')
        }
    }
  },

  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
