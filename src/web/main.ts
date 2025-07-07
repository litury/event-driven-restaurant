/**
 * Точка входа для веб-демонстрации событийной системы балансировки
 * 
 * @description Демонстрирует принципы CEP и событийных архитектур
 * Использует модульную архитектуру: WebDashboard (UI) + WorkloadBalancing (бизнес)
 */

import { createApp } from 'vue'
import InterfaceSelector from '../modules/WebDashboard/components/InterfaceSelector.vue'

// Создаем Vue приложение с селектором интерфейсов
const app = createApp(InterfaceSelector)

// Монтируем приложение
app.mount('#app')

// Логирование для отладки
console.log('🚀 Событийная система ресторана запущена!')
console.log('🍕 Выберите интерфейс: Кухня ресторана или Аналитический дашборд') 