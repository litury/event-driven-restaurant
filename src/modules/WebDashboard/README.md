# 🎨 WebDashboard Module

Модуль реализует **веб-интерфейс и визуализацию** для событийной системы балансировки работы. Предоставляет два современных интерфейса на Tailwind CSS для наблюдения за CEP системой в реальном времени.

## 🎯 Назначение модуля

Этот модуль отвечает за **презентационный слой** приложения - адаптирует бизнес-логику модуля `WorkloadBalancing` для человеческого восприятия через интуитивные метафоры и живую визуализацию.

### Ключевые принципы:

- **🎨 Separation of Concerns** - UI логика отделена от бизнес-логики
- **⚡ Реактивность** - Vue 3 Composition API для отзывчивого интерфейса
- **🔄 Адаптационный слой** - композаблы адаптируют бизнес-данные для UI
- **🎮 Интерактивность** - живое управление и наблюдение за системой
- **📱 Современный дизайн** - Tailwind CSS для профессионального вида

## 🖼️ Интерфейсы

### 🍕 Кухня ресторана (TailwindRestaurant.vue)

**Минималистичный интерфейс** для наблюдения за процессом приготовления:

```typescript
// Метафоры ресторана
📱 Новые заказы     → workQueue (генератор работ)
🤝 Назначения       → assignmentQueue (ZIP процессор)
🍕 Повар пиццы      → worker1Queue (четные заказы)
🍔 Повар бургеров   → worker2Queue (нечетные заказы)
🎯 Готовые блюда    → resultQueue (результаты)
```

**Особенности:**

- Живые карточки очередей с анимацией
- Лог событий в реальном времени
- Простая статистика (заказы/готовые блюда)
- Цветовая кодировка состояний

### 📊 Аналитический дашборд (TailwindDashboard.vue)

**Подробная визуализация** всей CEP системы:

```typescript
// Детальная аналитика
📊 Статистические карты    → общая производительность
🔄 Конвейер обработки     → анимированный pipeline
📈 Метрики в реальном времени → эффективность системы
📝 Полный лог событий     → трассировка всех операций
```

**Особенности:**

- Анимированный конвейер обработки данных
- Цветовая кодировка заказов (синие четные/красные нечетные)
- Детальная статистика и метрики производительности
- Полный лог событий с фильтрацией
- Визуализация потока частицами

## 📂 Структура модуля

```
src/modules/WebDashboard/
├── components/                   # Vue компоненты (Tailwind CSS)
│   ├── InterfaceSelector.vue    # 🏠 Стартовая страница выбора
│   ├── TailwindRestaurant.vue   # 🍕 Интерфейс кухни ресторана
│   ├── TailwindDashboard.vue    # 📊 Аналитический дашборд
│   ├── StatCard.vue             # 📈 Карточка статистики
│   ├── PipelineStep.vue         # 🔄 Шаг конвейера обработки
│   ├── QueueVisualization.vue   # 🔗 Визуализация очереди
│   └── index.ts                 # Экспорт компонентов
├── composables/                 # UI логика и адаптация
│   ├── useWorkloadVisualizer.ts # 🔧 Адаптер для системы балансировки
│   ├── useRestaurantVisualizer.ts # 🍕 Адаптер для метафоры ресторана
│   └── index.ts                 # Экспорт композаблов
├── interfaces/                  # TypeScript интерфейсы UI
│   ├── IWebDashboardConfig.ts   # Конфигурация веб-интерфейса
│   └── index.ts                 # Экспорт интерфейсов
├── __tests__/                   # TDD тесты UI логики
│   └── useWorkloadVisualizer.test.ts # Тесты композаблов
└── index.ts                     # Публичный API модуля
```

## 🧩 Композаблы (Адаптационный слой)

### useWorkloadVisualizer.ts

**Основной композабл** для адаптации бизнес-системы под UI:

```typescript
const {
  isRunning, // Статус системы (реактивный)
  queueSizes, // Размеры всех 5 очередей
  stats, // Статистика (сгенерировано/обработано)
  start, // Запуск системы
  stop, // Остановка системы
  totalQueueItems, // Общая загрузка (computed)
  efficiency, // Эффективность в % (computed)
  systemStatus, // Текстовый статус (computed)
} = useWorkloadVisualizer({
  updateIntervalMs: 100, // Частота обновления UI
  maxDisplayItems: 10, // Лимит для производительности
  animationEnabled: true, // Включить анимации
  autoStart: false, // Ручной запуск
});
```

### useRestaurantVisualizer.ts

**Специализированный композабл** для метафоры ресторана:

```typescript
const {
  isRunning, // Работает ли ресторан
  queueSizes: {
    // Очереди в терминах ресторана
    newOrders, // 📱 Новые заказы
    assignments, // 🤝 Назначения поварам
    pizzaCook, // 🍕 Очередь повара пиццы
    burgerCook, // 🍔 Очередь повара бургеров
    readyDishes, // 🎯 Готовые блюда
  },
  restaurantStats, // Статистика ресторана
  openRestaurant, // Открыть ресторан
  closeRestaurant, // Закрыть ресторан
  totalOrdersInProcess, // Заказы в работе
  kitchenEfficiency, // Эффективность кухни
} = useRestaurantVisualizer();
```

## 🎨 UI компоненты

### InterfaceSelector.vue - Стартовая страница

```vue
<template>
  <div class="interface-selector">
    <!-- Красивый выбор между интерфейсами -->
    <div @click="selectInterface('restaurant')">🍕 Кухня ресторана</div>
    <div @click="selectInterface('dashboard')">📊 Аналитический дашборд</div>
  </div>
</template>
```

### StatCard.vue - Карточка метрики

```vue
<template>
  <div class="stat-card">
    <span class="icon">{{ icon }}</span>
    <h3>{{ title }}</h3>
    <p class="value">{{ value }}</p>
    <p class="description">{{ description }}</p>
  </div>
</template>
```

### PipelineStep.vue - Шаг конвейера

```vue
<template>
  <div class="pipeline-step">
    <!-- Анимированная визуализация этапа обработки -->
    <div class="step-content">{{ title }}</div>
    <div class="queue-indicators">
      <!-- Анимированные индикаторы активности -->
    </div>
  </div>
</template>
```

## 🔄 Поток данных

### Архитектура адаптации:

```
WorkloadBalancing (бизнес) → Композаблы (адаптация) → Vue компоненты (UI)
        ↓                            ↓                       ↓
   Чистая логика              Реактивное состояние     Пользовательский
   События/очереди           Vue ref/computed          интерфейс
```

### Пример потока:

```typescript
// 1. Бизнес-система генерирует события
const businessState = workloadSystem.getState()

// 2. Композабл адаптирует для UI
const uiState = ref({
  newOrders: businessState.queues.workQueue.size(),
  assignments: businessState.queues.assignmentQueue.size(),
  // ... остальные адаптации
})

// 3. Vue компонент отображает
<StatCard :value="uiState.newOrders" title="Новые заказы" />
```

## 🧪 Тестирование

UI логика покрыта комплексными тестами:

```bash
# Тесты композаблов
npm test src/modules/WebDashboard

# Конкретно композаблы
npm test useWorkloadVisualizer.test.ts
```

### Покрытие тестами:

- ✅ **useWorkloadVisualizer** - все состояния и переходы
- ✅ **Реактивные свойства** - computed значения
- ✅ **Жизненный цикл** - запуск/остановка системы
- ✅ **Конфигурация** - кастомные настройки
- ✅ **Обработка ошибок** - восстановление состояния

## 🔌 API модуля

### Основные экспорты:

```typescript
// Компоненты
export { default as InterfaceSelector } from "./components/InterfaceSelector.vue";
export { default as TailwindDashboard } from "./components/TailwindDashboard.vue";
export { default as TailwindRestaurant } from "./components/TailwindRestaurant.vue";

// Композаблы
export { useWorkloadVisualizer } from "./composables/useWorkloadVisualizer";
export { useRestaurantVisualizer } from "./composables/useRestaurantVisualizer";

// Интерфейсы
export type { IWebDashboardConfig } from "./interfaces";
```

### Пример использования:

```typescript
// main.ts - точка входа
import { createApp } from "vue";
import InterfaceSelector from "./modules/WebDashboard/components/InterfaceSelector.vue";

const app = createApp(InterfaceSelector);
app.mount("#app");
```

## 🎨 Дизайн система

### Tailwind CSS конфигурация:

```typescript
// Цветовая схема
colors: {
  primary: 'blue',      // 🔵 Четные заказы
  secondary: 'red',     // 🔴 Нечетные заказы
  success: 'green',     // ✅ Готовые блюда
  warning: 'orange',    // ⚠️ В процессе
  info: 'purple'        // 💜 Статистика
}

// Анимации
animations: {
  'pulse-dot': 'pulse 1s ease-in-out infinite',
  'bounce-gentle': 'bounce 2s ease-in-out infinite',
  'flow-particles': 'flow 3s linear infinite'
}
```

## 🚀 Производительность UI

### Оптимизации:

- **Vue 3 Composition API** - эффективная реактивность
- **Computed свойства** - кэширование вычислений
- **onUnmounted** - автоматическая очистка ресурсов
- **Throttling** - ограничение частоты обновлений (100мс)
- **Lazy loading** - компоненты по требованию

### Мониторинг производительности:

```typescript
// Отслеживание FPS анимаций
const performanceMonitor = {
  updateInterval: 100, // Частота обновления
  animationFrames: 0, // Счетчик кадров
  memoryUsage: () => performance.memory?.usedJSHeapSize,
};
```

## 🔗 Связь с бизнес-модулем

Модуль **использует** `WorkloadBalancing`, но **НЕ влияет** на него:

```typescript
// ✅ Правильная зависимость
import { createWorkloadSystem } from "../../WorkloadBalancing";

// Адаптируем бизнес-данные для UI
const adaptBusinessData = (businessState) => ({
  newOrders: businessState.queues.workQueue.size(),
  // ... другие адаптации
});
```

Это обеспечивает:

- **Слабую связанность** модулей
- **Возможность замены UI** без изменения бизнес-логики
- **Легкость тестирования** каждого модуля отдельно

---

**Модуль:** UI и визуализация CEP системы • Vue 3 + Tailwind CSS • Реактивная архитектура
