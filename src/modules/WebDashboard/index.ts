/**
 * WebDashboard модуль - визуализация событийной системы балансировки
 * 
 * @description Реализует веб-интерфейс для демонстрации принципов CEP:
 * "Событийные системы состоят из одинаковых компонентов, которые работают по одинаковым принципам"
 * 
 * Архитектура модуля:
 * - UI логика (не бизнес!) в composables
 * - Адаптация бизнес-модуля WorkloadBalancing для веба
 * - Реактивная визуализация 4 участков и 5 очередей
 * 
 * ДОМАШНЕЕ ЗАДАНИЕ №2 - РЕСТОРАННАЯ МЕТАФОРА:
 * - Полноценные заказы ресторана вместо простых чисел
 * - VIP клиенты с приоритетными заказами  
 * - Обработка ошибок поваров (заболел, нет ингредиентов)
 * - Приоритетные очереди с дедлайнами
 * - Образовательный интерфейс с объяснениями CEP принципов
 */

// Современные компоненты ресторанного дашборда
export { default as ModernDashboard } from './components/ModernDashboard.vue'
export { default as StatCard } from './components/StatCard.vue'
export { default as PipelineStep } from './components/PipelineStep.vue'
export { default as RestaurantOrderCard } from './components/RestaurantOrderCard.vue'

// Композаблы (UI логика)
export { useWorkloadVisualizer } from './composables/useWorkloadVisualizer'
export { useRestaurantVisualizer } from './composables/useRestaurantVisualizer'

// Интерфейсы и конфигурация
export type * from './interfaces' 