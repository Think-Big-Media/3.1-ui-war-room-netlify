import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      // Bundle analyzer - only in production with analyze flag
      env.ANALYZE &&
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // IMPORTANT: Never use process.env in define section - it breaks browser builds!
    // Vite automatically handles VITE_ prefixed env vars via import.meta.env
    // No define section needed for env vars
    build: {
      // Optimize bundle size and performance
      chunkSizeWarningLimit: 800,
      target: 'es2020', // Modern browsers for better optimization
      rollupOptions: {
        output: {
          // Optimized manual chunks for better caching and loading
          manualChunks: (id) => {
            // Core React bundle - highest priority
            if (
              ['react', 'react-dom', 'react-router-dom'].some((pkg) =>
                id.includes(pkg)
              )
            ) {
              return 'react-core';
            }

            // Remove framer-motion from bundle (not used anymore)
            // Heavy animation library replaced with CSS animations

            // UI and state management
            if (
              ['@reduxjs/toolkit', 'react-redux', 'zustand'].some((pkg) =>
                id.includes(pkg)
              )
            ) {
              return 'state-management';
            }

            // Forms and validation
            if (
              ['react-hook-form', '@hookform/resolvers', 'yup', 'zod'].some(
                (pkg) => id.includes(pkg)
              )
            ) {
              return 'forms';
            }

            // Charts - lazy load for dashboard
            if (['recharts', 'd3-scale'].some((pkg) => id.includes(pkg))) {
              return 'charts';
            }

            // Authentication
            if (id.includes('@supabase/')) {
              return 'auth';
            }

            // Icons - separate chunk as they're used everywhere
            if (id.includes('lucide-react')) {
              return 'icons';
            }

            // Utilities
            if (
              [
                'date-fns',
                'clsx',
                'tailwind-merge',
                'class-variance-authority',
              ].some((pkg) => id.includes(pkg))
            ) {
              return 'utils';
            }

            // Large individual packages
            if (id.includes('react-beautiful-dnd')) return 'dnd';
            if (id.includes('react-simple-maps')) return 'maps';
            if (id.includes('posthog-js')) return 'analytics';

            // Node modules as vendor chunk
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
      // Disable source maps in production for performance
      sourcemap: false,
      // Use esbuild for fastest minification
      minify: 'esbuild',
      // CSS optimization
      cssMinify: true,
    },
    server: {
      port: env.VITE_PORT ? parseInt(env.VITE_PORT) : 5173,
      open: false, // Disable auto-browser opening in headless environments
      host: true, // Listen on all addresses
      watch: {
        // Exclude directories that shouldn't be watched to prevent ENOSPC errors
        ignored: [
          '**/src/backend/**',
          '**/venv/**',
          '**/.venv/**',
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/build/**',
          '**/__pycache__/**',
          '**/*.pyc',
          '**/env/**',
          '**/migrations/**',
          '**/logs/**',
          '**/tmp/**',
          '**/temp/**',
        ],
      },
    },
  };
});
