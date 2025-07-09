/**
 * Точка входа для веб-демонстрации событийной системы балансировки
 * 
 * @description Демонстрирует принципы CEP и событийных архитектур
 * Использует модульную архитектуру: WebDashboard (UI) + WorkloadBalancing (бизнес)
 */

import { createApp } from 'vue'
import './style.css'
import ModernDashboard from '../modules/WebDashboard/components/ModernDashboard.vue'

// Создаем Vue приложение только с современным дашбордом (согласно требованию)
const app = createApp(ModernDashboard)

// Монтируем приложение
app.mount('#app')

// Логирование для отладки
console.log('🚀 Современный аналитический дашборд запущен!')
console.log('📊 Система готова к мониторингу CEP событий') 