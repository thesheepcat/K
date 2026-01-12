import * as path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Use relative paths for Electron, absolute paths for web
  base: mode === 'web' ? '/' : './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "K",
        short_name: "K",
        description: "K: Your voice. Your ideas. Uncensored.",
        theme_color: "#ffffffff",
        background_color: "#ffffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            "src": "pwa-64x64.png",
            "sizes": "64x64",
            "type": "image/png"
          },
          {
            "src": "pwa-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "pwa-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
          },
          {
            "src": "maskable-icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          }
        ]
      },
      workbox: {
        // 20 mb
        maximumFileSizeToCacheInBytes: 20000000,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
   build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-avatar', '@radix-ui/react-slot', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
  },
  esbuild: {
    keepNames: true,
  },
  server: {
    host: true,
    port: 5173,
    fs: {
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['buffer']
  }
}))


