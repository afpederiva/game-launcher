const path = require('path');
const react = require('@vitejs/plugin-react');

/** @type {import('vite').UserConfig} */
module.exports = {
  root: path.resolve(__dirname, 'src', 'renderer'),
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist', 'renderer'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
};
