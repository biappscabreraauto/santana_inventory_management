import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022', // Add this line to support top-level await
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          azure: ['@azure/msal-browser', '@azure/msal-react', '@microsoft/microsoft-graph-client'],
          charts: ['recharts'],
          utils: ['axios', 'date-fns', 'lucide-react']
        }
      }
    }
  },
  preview: {
    port: 4173,
    host: true
  },
  define: {
    // Ensure compatibility with Azure Static Web Apps
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
})