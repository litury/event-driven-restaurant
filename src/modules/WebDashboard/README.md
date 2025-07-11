# 🎨 WebDashboard Module - Ресторанный интерфейс

Модуль реализует **образовательный веб-интерфейс** для демонстрации принципов CEP через метафору ресторана быстрого питания. Создан для **домашних заданий №1, №2, №3**.

## 🎯 Назначение модуля (ДЗ-1+2+3)

Этот модуль отвечает за **презентационный слой** приложения и служит **образовательным инструментом** для понимания событийных систем через интуитивную ресторанную метафору.

### 🔥 Возможности всех ДЗ:

**🏭 ДЗ-1: Базовая CEP визуализация**

- **🍕 Ресторанная метафора** - CEP принципы через понятную аналогию кухни
- **📊 Живые очереди** - визуализация 5 очередей событий в реальном времени
- **🔄 Конвейер обработки** - 4 этапа от заказа до готового блюда

**👑 ДЗ-2: Приоритеты и ошибки**

- **👑 VIP заказы** - визуализация приоритетных клиентов с особыми требованиями
- **🚨 Обработка ошибок** - показ 6 типов отказов поваров в реальном времени
- **📊 Образовательный UI** - интерфейс максимально объясняет принципы CEP
- **🎮 Интерактивность** - кнопки управления для демонстрации изменений метрик

**🔄 ДЗ-3: Событийная синхронизация** ⭐ _Новое!_

**Согласно лекции №3 - полная визуализация событийной архитектуры:**

- ✅ **Dual-система UI** - отображение CEP конвейера И событийных зон одновременно
- ✅ **RestaurantZoneVisualizer** - визуализация VIP и обычной зон с столиками
- ✅ **Детальные логи систем** - раздельные логи CEP и ZoneSync с переключением
- ✅ **Event Sourcing визуализация** - показ восстановления состояния из событий
- ✅ **ChangeLog отображение** - журнал всех событий с версионностью
- ✅ **Sync статус** - индикаторы синхронизации между компонентами
- ✅ **Snapshot мониторинг** - отображение создания и использования снимков
- ✅ **Recovery процесс** - визуализация восстановления после рассинхронизации
- ✅ **Буферизация очередей** - показ заказов в ожидании свободных столов

### 🎨 Стратегические цвета ДЗ-3:

- **🎨 Стратегические цвета** - акценты только там, где несут смысловую нагрузку:
  - 🔴 **Критические**: ошибки синхронизации, рассинхронизация
  - 🟡 **Предупреждения**: конфликты версий, полные очереди
  - 🟢 **Успех**: успешная синхронизация, snapshot создан
  - 🔵 **Информация**: версии ChangeLog, статистика sync

## 🍔 Ресторанная метафора в UI (ДЗ-3)

### Трансформация абстрактных концептов согласно лекции №3:

| **CEP Система (ДЗ-3)**              | **Ресторан**                                 | **UI Компонент**                 |
| ----------------------------------- | -------------------------------------------- | -------------------------------- |
| **События ChangeLog**               | Журнал заказов и операций кухни              | `EventLogDisplay.vue`            |
| **Приоритетные очереди**            | Очереди поваров                              | `PipelineStep.vue`               |
| **ZIP-процессор**                   | Диспетчер кухни                              | Анимированный конвейер           |
| **Фильтр**                          | Распределение по специализации               | Разделение Pizza/Burger          |
| **Обработчики**                     | Повара (А: пицца/салаты, Б: бургеры/десерты) | Параллельные очереди             |
| **RestaurantZoneAPI**               | Система бронирования столиков                | `ZoneAPIControls.vue`            |
| **Синхронизация зон**               | Управляющий залом                            | `RestaurantZoneVisualizer.vue`   |
| **VIP зона (5 столов)**             | Премиум зал                                  | VIP столики с особым оформлением |
| **Обычная зона (10 столов)**        | Основной зал                                 | Стандартные столики              |
| **Буферизация заказов**             | Очередь на вход при отсутствии мест          | `OrderQueueDisplay.vue`          |
| **Snapshot системы**                | Моментальные фото состояния зала             | `SnapshotIndicator.vue`          |
| **Recovery после рассинхронизации** | Восстановление порядка после сбоя            | `SyncRecoveryDisplay.vue`        |

## 📊 Образовательные элементы (ДЗ-3)

### 🧠 Объяснения принципов CEP согласно лекции №3:

```vue
<!-- Структура ChangeLog события показана в интерфейсе -->
<pre>{{`{
  "id": "evt_1672531200001",
  "timestamp": "2024-01-15T14:35:00Z",
  "eventType": "order_added",
  "version": 42,
  "payload": {
    "orderId": 123,
    "isVipCustomer": true,
    "dishDescription": "Пицца Маргарита",
    "tablePreference": "VIP"
  },
  "previousHash": "a7b8c9d..."
}`}}</pre>

<!-- Процесс синхронизации объяснен -->
<div class="sync-explanation">
  API → ChangeLog → ZoneSync → UI
  Иммутабельные события → Версионность → Согласованность состояний
</div>

<!-- Восстановление после рассинхронизации -->
<div class="recovery-process">
  Обнаружение конфликта → Replay событий → Синхронизация достигнута
</div>
```

### 📈 Живые метрики с расшифровкой ДЗ-3:

- **Версия ChangeLog: v.127** = текущая версия событийного журнала
- **Синхронизация: 100%** = все зоны согласованы с ChangeLog
- **Snapshot: 30s назад** = последний моментальный снимок состояния
- **Recovery: 0 случаев** = рассинхронизаций не было
- **VIP занято: 3/5** = столиков занято в премиум зоне
- **Очередь: 7 заказов** = заказов ожидает свободные столы
- **События/мин: 45** = интенсивность обновлений ChangeLog

## 🧩 Архитектура компонентов (ДЗ-3)

### Главный компонент: `ModernDashboard.vue` (обновленный)

```typescript
// Интегрирует все образовательные элементы включая ДЗ-3
<ModernDashboard>
  <!-- Образовательный блок с CEP принципами -->
  <EducationalSection />

  <!-- Переключатель между системами ДЗ-3 -->
  <SystemToggle v-model="currentSystem" />
  <!-- CEP_PIPELINE | EVENT_SYNC | DUAL_VIEW -->

  <!-- CEP Конвейер (ДЗ-1+2) -->
  <CEPPipelineView v-if="showCEP">
    <StatCard title="ЭФФЕКТИВНОСТЬ" :formula="efficiencyFormula" />
    <PipelineStep v-for="step in cepSteps" :cepPrinciple="step.principle" />
    <RestaurantOrderCard v-for="order in currentOrders" :order="order" />
  </CEPPipelineView>

  <!-- Событийная синхронизация (ДЗ-3) -->
  <EventSyncView v-if="showSync">
    <RestaurantZoneVisualizer :zones="syncedZones" />
    <ChangeLogDisplay :events="changeLogEvents" />
    <SyncStatusIndicator :status="syncStatus" />
    <OrderQueueDisplay :queuedOrders="bufferOrders" />
  </EventSyncView>

  <!-- Объединенный вид (ДЗ-3) -->
  <DualSystemView v-if="showDual">
    <!-- Показывает оба потока данных одновременно -->
    <CEPPipelineSection />
    <EventSyncSection />
  </DualSystemView>
</ModernDashboard>
```

### Новый компонент: `RestaurantZoneVisualizer.vue` (ДЗ-3)

```vue
<template>
  <!-- VIP зона -->
  <div class="vip-zone">
    <Crown /> VIP ЗОНА (5 СТОЛОВ)

    <div class="tables-grid">
      <TableComponent
        v-for="table in vipTables"
        :key="table.tableId"
        :table="table"
        :isVip="true"
      />
    </div>

    <!-- Метрики VIP зоны -->
    <div class="zone-metrics">
      Занято: {{ occupiedVipTables }}/5 Средняя загрузка: {{ vipUtilization }}%
    </div>
  </div>

  <!-- Обычная зона -->
  <div class="regular-zone">
    <Users /> ОБЫЧНАЯ ЗОНА (10 СТОЛОВ)

    <div class="tables-grid">
      <TableComponent
        v-for="table in regularTables"
        :key="table.tableId"
        :table="table"
        :isVip="false"
      />
    </div>

    <!-- Метрики обычной зоны -->
    <div class="zone-metrics">
      Занято: {{ occupiedRegularTables }}/10 Средняя загрузка:
      {{ regularUtilization }}%
    </div>
  </div>

  <!-- Очередь буферизации (ДЗ-3) -->
  <div class="buffer-queue">
    <Clock /> ОЧЕРЕДЬ ОЖИДАНИЯ

    <div class="queued-orders">
      <OrderCard
        v-for="order in queuedOrders"
        :key="order.orderId"
        :order="order"
        :waitTime="order.waitTime"
      />
    </div>

    <!-- Принцип буферизации -->
    <div class="educational-note">
      <BookOpen /> CEP ПРИНЦИП:
      <p>При отсутствии свободных столов заказы буферизируются в очереди</p>
      <p>Система автоматически размещает заказы при освобождении мест</p>
    </div>
  </div>
</template>
```

### Новый компонент: `ChangeLogDisplay.vue` (ДЗ-3)

```vue
<template>
  <!-- Заголовок ChangeLog -->
  <div class="changelog-header">
    <FileText /> CHANGELOG КУХНИ
    <span class="version">v.{{ currentVersion }}</span>
  </div>

  <!-- События в хронологическом порядке -->
  <div class="events-list">
    <div
      v-for="event in recentEvents"
      :key="event.id"
      :class="['event-entry', `event-${event.eventType}`]"
    >
      <!-- Временная метка -->
      <span class="timestamp">{{ formatTime(event.timestamp) }}</span>

      <!-- Тип события -->
      <component :is="getEventIcon(event.eventType)" />

      <!-- Описание события -->
      <span class="event-description">
        {{ formatEventDescription(event) }}
      </span>

      <!-- Версия события -->
      <span class="event-version">#{{ event.version }}</span>
    </div>
  </div>

  <!-- Статистика ChangeLog -->
  <div class="changelog-stats">
    <div>Всего событий: {{ totalEvents }}</div>
    <div>События/мин: {{ eventsPerMinute }}</div>
    <div>Целостность: {{ integrityStatus ? "✅" : "❌" }}</div>
  </div>

  <!-- Образовательный блок -->
  <div class="educational-changelog">
    <BookOpen /> CEP ПРИНЦИПЫ CHANGELOG:
    <ul>
      <li>События неизменяемы после записи</li>
      <li>Строгая хронологическая последовательность</li>
      <li>Версионность предотвращает конфликты</li>
      <li>Хеширование обеспечивает целостность цепочки</li>
    </ul>
  </div>
</template>
```

## 🔄 Композаблы (обновленные для ДЗ-3)

### `useRestaurantSync.ts` - Новый композабл ДЗ-3

```typescript
export function useRestaurantSync() {
  // Система событийной синхронизации
  const restaurantZoneAPI = createRestaurantZoneAPI({
    versioningEnabled: true,
    validationStrict: true,
  });

  const kitchenChangeLog = createKitchenChangeLog({
    integrityCheckEnabled: true,
    snapshotInterval: 30000,
  });

  const restaurantZoneSync = createRestaurantZoneSync({
    vipZoneCapacity: 5,
    regularZoneCapacity: 10,
    bufferCapacity: 50,
  });

  return {
    // Управление системой синхронизации
    startSynchronization, // Начать событийную синхронизацию
    stopSynchronization, // Остановить синхронизацию

    // Зоны ресторана (ДЗ-3)
    vipZone: {
      tables: vipTables, // Состояние VIP столов
      occupancy: vipOccupancy, // Процент занятости
      queuedOrders: vipQueuedOrders, // Заказы в очереди VIP
    },

    regularZone: {
      tables: regularTables, // Состояние обычных столов
      occupancy: regularOccupancy, // Процент занятости
      queuedOrders: regularQueuedOrders, // Заказы в очереди
    },

    // ChangeLog система
    changeLog: {
      events: recentEvents, // Последние события
      currentVersion: changeLogVersion, // Текущая версия
      totalEvents: totalEventsCount, // Всего событий
      integrityStatus: chainIntegrity, // Целостность цепочки
    },

    // Синхронизация
    syncStatus: {
      isHealthy: syncHealthy, // Здоровое состояние
      lastSync: lastSyncTime, // Время последней синхронизации
      conflictsResolved: resolvedConflicts, // Разрешенных конфликтов
      recoveryOperations: recoveryCount, // Операций восстановления
    },

    // Снимки состояния
    snapshots: {
      lastSnapshot: lastSnapshotTime, // Последний снимок
      snapshotFrequency: snapshotInterval, // Частота создания
      snapshotSize: lastSnapshotSize, // Размер последнего снимка
    },

    // Действия API (для демонстрации)
    addOrderToAPI, // Добавить заказ через API
    moveOrderToAPI, // Переместить заказ через API
    removeOrderFromAPI, // Удалить заказ через API
    createManualSnapshot, // Создать снимок вручную
    triggerRecovery, // Запустить восстановление
  };
}
```

### `useRestaurantVisualizer.ts` - Обновленный для интеграции с ДЗ-3

```typescript
export function useRestaurantVisualizer() {
  // CEP система (ДЗ-1+2)
  const cepSystem = useWorkloadVisualizer();

  // Система синхронизации (ДЗ-3)
  const syncSystem = useRestaurantSync();

  // Интеграция систем
  const integratedStats = computed(() => ({
    // Объединенные метрики
    totalOrders:
      cepSystem.stats.value.ordersReceived + syncSystem.changeLog.totalEvents,
    cepEfficiency: cepSystem.efficiency.value,
    syncEfficiency: syncSystem.syncStatus.isHealthy ? 100 : 75,

    // Состояние обеих систем
    cepRunning: cepSystem.isRunning.value,
    syncRunning: syncSystem.syncStatus.isHealthy,

    // Образовательные метрики
    systemsInSync:
      cepSystem.isRunning.value === syncSystem.syncStatus.isHealthy,
    dataFlowRate:
      (cepSystem.stats.value.ordersPerMinute +
        syncSystem.changeLog.eventsPerMinute) /
      2,
  }));

  return {
    // CEP система
    cep: cepSystem,

    // Система синхронизации
    sync: syncSystem,

    // Интегрированные метрики
    integrated: integratedStats,

    // Управление двойной системой
    startBothSystems: async () => {
      await Promise.all([cepSystem.start(), syncSystem.startSynchronization()]);
    },

    stopBothSystems: async () => {
      await Promise.all([cepSystem.stop(), syncSystem.stopSynchronization()]);
    },

    // Демонстрационные действия
    demonstrateEventFlow: async () => {
      // Показать как заказ проходит через обе системы
      const order = await cepSystem.generateDemoOrder();
      await syncSystem.addOrderToAPI(order);
    },

    demonstrateRecovery: async () => {
      // Показать восстановление после рассинхронизации
      await syncSystem.triggerRecovery();
    },
  };
}
```

## 🎨 Дизайн-система (обновленная для ДЗ-3)

### Цветовая схема для событийной синхронизации:

```scss
// Основная палитра (неизменна)
--bg-primary: #fafafa;
--fg-primary: #0a0a0a;
--border-primary: #d4d4d8;

// Стратегические акценты ДЗ-3
--sync-critical: #dc2626; // Рассинхронизация, конфликты
--sync-warning: #d97706; // Переполнение очередей, версионные конфликты
--sync-success: #16a34a; // Успешная синхронизация, snapshot создан
--sync-info: #2563eb; // Версии ChangeLog, метрики sync

// Состояния зон
--vip-zone: #7c3aed; // VIP зона и элементы
--regular-zone: #64748b; // Обычная зона
--buffer-queue: #f59e0b; // Очередь ожидания
--table-occupied: #ef4444; // Занятый стол
--table-free: #22c55e; // Свободный стол

// События ChangeLog
--event-added: #3b82f6; // order_added
--event-moved: #8b5cf6; // order_moved
--event-removed: #f97316; // order_removed
--event-system: #6b7280; // системные события
```

### Компоненты ДЗ-3:

```scss
// Зоны ресторана
.vip-zone {
  border: 2px solid var(--vip-zone);
  background: linear-gradient(135deg, var(--vip-zone) 10%, transparent);
}

.regular-zone {
  border: 2px solid var(--regular-zone);
  background: linear-gradient(135deg, var(--regular-zone) 10%, transparent);
}

// Столы
.table-component {
  border-radius: 0; // Без скруглений
  border-width: 2px;
  font-family: "Fira Code", monospace;

  &.occupied {
    border-color: var(--table-occupied);
  }
  &.free {
    border-color: var(--table-free);
  }
  &.vip {
    box-shadow: 0 0 10px var(--vip-zone);
  }
}

// ChangeLog события
.event-entry {
  border-left: 4px solid;

  &.event-order_added {
    border-left-color: var(--event-added);
  }
  &.event-order_moved {
    border-left-color: var(--event-moved);
  }
  &.event-order_removed {
    border-left-color: var(--event-removed);
  }
}
```

## 🧪 Тестирование UI логики (ДЗ-3)

### Тесты композаблов ДЗ-3:

```typescript
// src/modules/WebDashboard/__tests__/useRestaurantSync.test.ts
describe("useRestaurantSync", () => {
  it("должен интегрировать систему событийной синхронизации для UI", () => {
    const { vipZone, regularZone, changeLog } = useRestaurantSync();

    expect(vipZone.tables.value).toHaveLength(5);
    expect(regularZone.tables.value).toHaveLength(10);
    expect(changeLog.currentVersion.value).toBeGreaterThan(0);
  });

  it("должен реактивно обновлять состояние зон при изменениях", async () => {
    const { addOrderToAPI, vipZone } = useRestaurantSync();

    const initialOccupancy = vipZone.occupancy.value;

    await addOrderToAPI({
      orderId: 999,
      isVipCustomer: true,
      dishDescription: "Test Pizza",
    });

    expect(vipZone.occupancy.value).toBeGreaterThan(initialOccupancy);
  });

  it("должен отображать события ChangeLog в реальном времени", async () => {
    const { changeLog, addOrderToAPI } = useRestaurantSync();

    const initialEvents = changeLog.events.value.length;

    await addOrderToAPI({
      orderId: 888,
      isVipCustomer: false,
      dishDescription: "Test Burger",
    });

    expect(changeLog.events.value.length).toBe(initialEvents + 1);
    expect(changeLog.events.value[0].eventType).toBe("order_added");
  });

  it("должен показывать статус синхронизации систем", () => {
    const { syncStatus } = useRestaurantSync();

    expect(syncStatus.isHealthy.value).toBe(true);
    expect(syncStatus.conflictsResolved.value).toBeGreaterThanOrEqual(0);
  });

  it("должен демонстрировать восстановление после рассинхронизации", async () => {
    const { triggerRecovery, syncStatus } = useRestaurantSync();

    await triggerRecovery();

    expect(syncStatus.recoveryOperations.value).toBeGreaterThan(0);
  });
});
```

## 🔌 API модуля (обновленный для ДЗ-3)

### Экспорты включая ДЗ-3:

```typescript
// Компоненты ресторанного дашборда (ДЗ-1+2+3)
export { default as ModernDashboard } from "./components/ModernDashboard.vue";
export { default as RestaurantOrderCard } from "./components/RestaurantOrderCard.vue";
export { default as StatCard } from "./components/StatCard.vue";
export { default as PipelineStep } from "./components/PipelineStep.vue";

// Новые компоненты ДЗ-3
export { default as RestaurantZoneVisualizer } from "./components/RestaurantZoneVisualizer.vue";
export { default as ChangeLogDisplay } from "./components/ChangeLogDisplay.vue";
export { default as SyncStatusIndicator } from "./components/SyncStatusIndicator.vue";
export { default as OrderQueueDisplay } from "./components/OrderQueueDisplay.vue";

// Композаблы (ДЗ-1+2+3)
export { useRestaurantVisualizer } from "./composables/useRestaurantVisualizer";
export { useWorkloadVisualizer } from "./composables/useWorkloadVisualizer";
export { useRestaurantSync } from "./composables/useRestaurantSync"; // Новый ДЗ-3

// Интерфейсы
export type * from "./interfaces";
```

### Использование полной системы:

```typescript
// main.ts
import { createApp } from "vue";
import ModernDashboard from "./modules/WebDashboard/components/ModernDashboard.vue";

const app = createApp(ModernDashboard);

// Предоставляем конфигурацию для ДЗ-3
app.provide("syncConfig", {
  enableDualView: true, // Показ CEP + Sync одновременно
  enableChangeLogDisplay: true, // Отображение журнала событий
  enableRecoveryDemo: true, // Демонстрация восстановления
  educationalMode: true, // Подробные объяснения принципов
});

app.mount("#app");
```

## 📚 Образовательная ценность (ДЗ-3)

### 🎯 Для понимания CEP согласно лекции №3:

- **Живая демонстрация** событийной синхронизации через ресторан
- **ChangeLog система** - показ иммутабельного журнала событий
- **Event Sourcing** - восстановление состояния зон из событий
- **Snapshot механизм** - создание и использование моментальных снимков
- **Recovery процесс** - восстановление после рассинхронизации
- **Версионность** - предотвращение конфликтов через версии событий
- **Буферизация** - управление очередями при отсутствии ресурсов

### 🔧 Для изучения Vue.js (ДЗ-3):

- **Реактивная синхронизация** - автоматическое обновление UI при изменении состояния
- **Композиция систем** - интеграция CEP и Sync через композаблы
- **Компонентная архитектура** - модульная структура для масштабирования
- **State management** - управление состоянием двойной системы
- **Event handling** - обработка событий ChangeLog в реальном времени

### 🏗️ Для архитекторов (ДЗ-3):

- **Event-driven UI** - полностью событийная архитектура интерфейса
- **Dual system visualization** - отображение двух связанных систем
- **Real-time synchronization** - синхронизация состояний в реальном времени
- **Educational patterns** - паттерны для объяснения сложных концепций
- **Recovery visualization** - показ восстановления целостности системы

---

**Модуль создан специально для демонстрации домашних заданий №1, №2, №3**  
**🎓 "CEP принципы через ресторанную метафору + Событийная синхронизация"**

### **Визуализированные концепции из лекции №3:**

- ✅ **Таблицы состояний** → Визуализация столиков и заказов в зонах ресторана
- ✅ **ChangeLog система** → Живой журнал событий с версионностью в UI
- ✅ **Event Sourcing** → Показ восстановления состояния зон из событий
- ✅ **Синхронизация систем** → Dual-view CEP конвейера и событийных зон
- ✅ **Snapshot механизм** → Индикаторы создания и использования снимков
- ✅ **Recovery процесс** → Визуализация восстановления после рассинхронизации
- ✅ **Буферизация очередей** → Отображение заказов в ожидании свободных столов

**🍕 Образовательный UI для понимания событийных архитектур!**
