import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@modules': resolve(__dirname, 'src/modules'),
            '@shared': resolve(__dirname, 'src/shared')
        }
    },

    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test-setup.ts'],
        include: ['src/**/*.{test,spec}.{js,ts}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{js,ts,vue}'],
            exclude: [
                'src/**/*.{test,spec}.{js,ts}',
                'src/web/**/*'
            ]
        }
    }
}) 