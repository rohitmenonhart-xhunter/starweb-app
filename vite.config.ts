import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'http://localhost:3001'  // This won't be used in production, but is required for the config
          : 'http://localhost:3001', // Used in development
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    // Generate sourcemaps for better debugging
    sourcemap: true,
    // Ensure proper handling of assets
    assetsDir: 'assets',
    // Optimize chunks for better loading performance
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          ui: ['html2canvas', 'jspdf', 'docx', 'file-saver']
        }
      }
    }
  }
});