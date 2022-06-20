export default {
  build: {
    sourcemap: true,
  }
}

// vite.config.js

const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        administrator: resolve(__dirname, 'administrator/index.html')
      }
    }
  }
})

