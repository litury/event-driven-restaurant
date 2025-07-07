import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig(({ command }) => ({
    plugins: [vue(), tailwindcss()],

    // Алиасы для удобного импорта
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@modules': resolve(__dirname, 'src/modules'),
            '@shared': resolve(__dirname, 'src/shared')
        }
    },

    // Конфигурация для веб-демо
    root: 'src/web',

    // GitHub Pages base path (название репозитория)
    base: command === 'build' ? '/event-driven-restaurant/' : '/',

    // Настройки разработки
    server: {
        port: 3002,
        open: true,
        host: true
    },

    // Настройки preview
    preview: {
        port: 3002,
        host: true
    },

    // Сборка
    build: {
        outDir: '../../dist',
        emptyOutDir: true,
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/web/index.html')
            }
        }
    },

    // Настройки для тестов
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test-setup.ts']
    }
})) 