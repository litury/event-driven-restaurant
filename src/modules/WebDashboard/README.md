# 🎨 WebDashboard Module - Ресторанный интерфейс

Модуль реализует **образовательный веб-интерфейс** для демонстрации принципов CEP через метафору ресторана быстрого питания. Создан для **домашнего задания №2** по лекции Александра Шолупова.

## 🎯 Назначение модуля (ДЗ-2)

Этот модуль отвечает за **презентационный слой** приложения и служит **образовательным инструментом** для понимания событийных систем через интуитивную ресторанную метафору.

### 🔥 Новые возможности ДЗ-2:

- **🍕 Ресторанная метафора** - CEP принципы объяснены через понятную аналогию кухни
- **👑 VIP заказы** - визуализация приоритетных клиентов с особыми требованиями
- **🚨 Обработка ошибок** - показ 6 типов отказов поваров в реальном времени
- **📊 Образовательный UI** - интерфейс максимально объясняет принципы CEP
- **🎮 Интерактивность** - кнопки управления для демонстрации изменений метрик
- **🎨 Стратегические цвета** - акценты только там, где несут смысловую нагрузку

## 🍔 Ресторанная метафора в UI

### Трансформация абстрактных концептов:

| CEP Система              | Ресторан                                     | UI Компонент                |
| ------------------------ | -------------------------------------------- | --------------------------- |
| **События**              | Заказы клиентов                              | `RestaurantOrderCard.vue`   |
| **Приоритетные очереди** | Очереди поваров                              | `PipelineStep.vue`          |
| **ZIP-процессор**        | Диспетчер кухни                              | Анимированный конвейер      |
| **Фильтр**               | Распределение по специализации               | Разделение Pizza/Burger     |
| **Обработчики**          | Повара (А: пицца/салаты, Б: бургеры/десерты) | Параллельные очереди        |
| **Результаты**           | Готовые блюда                                | Счетчик завершенных заказов |

## 📊 Образовательные элементы

### 🧠 Объяснения принципов CEP:

```vue
<!-- JSON структура заказов показана в интерфейсе -->
<pre>{{`{
  "orderNumber": 42,
  "customerType": "VIP",
  "dishType": "пицца", 
  "priority": 2.5,
  "deadline": "2024-01-15T14:35:00Z",
  "specialRequests": ["Без лука", "Дополнительный сыр"]
}`}}</pre>

<!-- Формула приоритета объяснена -->
<div class="formula-explanation">
  priority = (deadline - now) / cookingTime
  VIP модификатор: priority × 0.5
</div>
```

### 📈 Живые метрики с расшифровкой:

- **Эффективность 96%** = `(Готовые блюда ÷ Принятые заказы) × 100`
- **Пропускная способность** = скорость обработки заказов в единицу времени
- **Рост +12%** = система набирает обороты, клиенты продолжают заказывать
- **Прирост событий +8%** = повара "разогреваются", работают быстрее

## 🧩 Архитектура компонентов

### Главный компонент: `ModernDashboard.vue`

```typescript
// Интегрирует все образовательные элементы
<ModernDashboard>
  <!-- Образовательный блок с CEP принципами -->
  <EducationalSection />

  <!-- Живые метрики с объяснениями -->
  <StatCard title="ЭФФЕКТИВНОСТЬ" :formula="efficiencyFormula" />

  <!-- JSON структура заказов -->
  <JSONStructureSection v-if="isRunning" />

  <!-- CEP конвейер с принципами -->
  <PipelineStep
    v-for="step in cepSteps"
    :cepPrinciple="step.principle"
  />

  <!-- Активные заказы ресторана -->
  <RestaurantOrderCard
    v-for="order in currentOrders"
    :order="order"
  />
</ModernDashboard>
```

### Карточка заказа: `RestaurantOrderCard.vue`

```vue
<template>
  <!-- VIP индикаторы -->
  <Crown v-if="order.customerType === 'VIP'" />

  <!-- Статус приоритета -->
  <div :style="{ backgroundColor: priorityColor }">
    {{ priorityLabel }}
    <!-- КРИТИЧНО, ВЫСОКИЙ, СРЕДНИЙ -->
  </div>

  <!-- Детали заказа с иконками -->
  <component :is="dishIcon" />
  <!-- Pizza, Beef, Salad, Cake -->

  <!-- Дедлайн статус -->
  <span :style="{ color: deadlineStatusColor }">
    {{ deadlineStatus }}
    <!-- В НОРМЕ, СКОРО, СРОЧНО, ПРОСРОЧЕН -->
  </span>

  <!-- Образовательный блок CEP -->
  <div class="cep-principles">
    <BookOpen /> CEP ПРИНЦИПЫ:
    <div>• Событие неизменяемо после создания</div>
    <div>• Меньший приоритет = выше в очереди</div>
    <div>• Время обработки влияет на расчет приоритета</div>
  </div>
</template>
```

### Этап конвейера: `PipelineStep.vue`

```vue
<template>
  <!-- Иконка этапа -->
  <component :is="icon" />

  <!-- Статус обработки -->
  <div>{{ getStatusText() }}</div>
  <!-- ОБРАБОТКА, ПИКОВАЯ НАГРУЗКА -->

  <!-- CEP принцип для этого этапа -->
  <div v-if="cepPrinciple" class="principle">
    <BookOpen /> CEP ПРИНЦИП:
    <p>{{ cepPrinciple }}</p>
  </div>
</template>
```

## 🔄 Композаблы (Адаптационный слой)

### `useRestaurantVisualizer.ts` - Основной композабл ДЗ-2

```typescript
export function useRestaurantVisualizer() {
  // Ресторанная система с приоритетными заказами
  const restaurantOrderGenerator = createRestaurantOrderGenerator({
    orderTypes: ["пицца", "бургер", "салат", "десерт"],
    customerTypes: ["VIP", "обычный", "доставка"],
    vipProbability: 0.3, // 30% VIP клиентов
    errorProbability: 0.1, // 10% ошибок поваров
  });

  // Приоритетные очереди с обработкой ошибок
  const restaurantPriorityQueue = new RestaurantPriorityQueue();
  const restaurantErrorHandler = new RestaurantErrorHandler();

  return {
    // Управление рестораном
    openRestaurant, // Начать прием заказов
    closeRestaurant, // Закрыть ресторан

    // Статистика ресторана
    restaurantStats: {
      ordersReceived, // Всего принято заказов
      dishesCompleted, // Готовых блюд
      vipOrders, // VIP заказов в системе
      overdueOrders, // Просроченных заказов
      errorRecoveries, // Восстановлений после ошибок
    },

    // Текущие заказы по поварам
    currentOrders: {
      newOrders, // Новые заказы в очереди
      pizzaOrders, // У повара пиццы
      burgerOrders, // У повара бургеров
      readyOrders, // Готовые к выдаче
    },

    // Эффективность кухни
    kitchenEfficiency, // Процент успешно обработанных
    systemStatus, // АКТИВЕН / ОСТАНОВЛЕН / ВОССТАНОВЛЕНИЕ
  };
}
```

### `useWorkloadVisualizer.ts` - Базовый адаптер

```typescript
// Адаптирует бизнес-систему для UI
export function useWorkloadVisualizer() {
  // Создаем бизнес-систему
  const businessSystem = createWorkloadSystem({
    workGenerationIntervalMs: 1500, // Каждые 1.5 сек новый заказ
    maxWorks: 100, // Лимит для демонстрации
    autoStart: false, // Управляем из UI
  });

  // UI состояние (реактивные данные)
  const queueSizes = ref({
    newOrders: 0, // Новые заказы
    assignments: 0, // Назначения поварам
    pizzaCook: 0, // Очередь повара пиццы
    burgerCook: 0, // Очередь повара бургеров
    readyDishes: 0, // Готовые блюда
  });

  return { queueSizes, start, stop, isRunning, stats };
}
```

## 🎨 Дизайн-система (ДЗ-2)

### Монохромная основа с стратегическими акцентами:

```scss
// Основная палитра (12 оттенков серого)
--bg-primary: #fafafa; // Светлый фон
--fg-primary: #0a0a0a; // Основной текст
--border-primary: #d4d4d8; // Границы

// Стратегические акценты (только с смыслом!)
--state-critical: #dc2626; // Красный: ошибки, просрочка
--state-caution: #d97706; // Янтарный: VIP, предупреждения
--state-positive: #16a34a; // Зеленый: успех, готовые блюда
--state-informative: #2563eb; // Синий: информация, метрики
```

### Типографика:

```scss
// Моноширинный шрифт для всего интерфейса
font-family: "Fira Code", "JetBrains Mono", monospace;

// Без скруглений
border-radius: 0;

// Четкие линии
border-width: 1px;
```

## 🧪 Тестирование UI логики

### Тесты композаблов:

```typescript
// src/modules/WebDashboard/__tests__/useWorkloadVisualizer.test.ts
describe("useWorkloadVisualizer", () => {
  it("должен адаптировать бизнес-данные для UI", () => {
    const { queueSizes, start } = useWorkloadVisualizer();

    start();

    expect(queueSizes.value.newOrders).toBeGreaterThan(0);
  });

  it("должен рассчитывать эффективность кухни", () => {
    const { efficiency } = useWorkloadVisualizer();

    expect(efficiency.value).toBeBetween(0, 100);
  });
});
```

## 🔌 API модуля

### Экспорты ДЗ-2:

```typescript
// Компоненты ресторанного дашборда
export { default as ModernDashboard } from "./components/ModernDashboard.vue";
export { default as RestaurantOrderCard } from "./components/RestaurantOrderCard.vue";
export { default as StatCard } from "./components/StatCard.vue";
export { default as PipelineStep } from "./components/PipelineStep.vue";

// Композаблы
export { useRestaurantVisualizer } from "./composables/useRestaurantVisualizer";
export { useWorkloadVisualizer } from "./composables/useWorkloadVisualizer";

// Интерфейсы
export type * from "./interfaces";
```

### Использование:

```typescript
// main.ts
import { createApp } from "vue";
import ModernDashboard from "./modules/WebDashboard/components/ModernDashboard.vue";

const app = createApp(ModernDashboard);
app.mount("#app");
```

## 📚 Образовательная ценность

### 🎯 Для понимания CEP:

- **Живая демонстрация** всех принципов через ресторан
- **Формулы и расчеты** показаны прямо в интерфейсе
- **JSON структуры** событий видны в реальном времени
- **Принципы каждого этапа** объяснены отдельно

### 🔧 Для изучения Vue.js:

- **Composition API** для реактивности
- **Computed свойства** для производных данных
- **Композаблы** для переиспользования логики
- **TypeScript интеграция** для надежности

### 🏗️ Для архитектуры:

- **Разделение ответственности** (UI ≠ бизнес-логика)
- **Адаптационный слой** через композаблы
- **Реактивная архитектура** с Vue
- **Модульная структура** для масштабируемости

---

**Модуль создан специально для домашнего задания №2**  
**🎓 "CEP принципы через ресторанную метафору" - Александр Шолупов**
