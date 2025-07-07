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
 */

// Компоненты для визуализации (Tailwind CSS)
export { default as InterfaceSelector } from './components/InterfaceSelector.vue'
export { default as TailwindDashboard } from './components/TailwindDashboard.vue'
export { default as TailwindRestaurant } from './components/TailwindRestaurant.vue'
export { default as QueueVisualization } from './components/QueueVisualization.vue'

// Композаблы (UI логика)
export { useWorkloadVisualizer } from './composables/useWorkloadVisualizer'

// Интерфейсы и типы
export type { IWebDashboardConfig } from './interfaces' 