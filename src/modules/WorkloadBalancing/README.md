# 🔧 WorkloadBalancing Module - Ресторанная система CEP

Модуль реализует **бизнес-логику событийной системы балансировки работы** на основе принципов Complex Event Processing (CEP) через метафору ресторана быстрого питания. Создан для **домашних заданий №1, №2, №3**.

## 🎯 Назначение модуля (ДЗ-1+2+3)

Этот модуль представляет собой **ядро событийной системы ресторана**, которое демонстрирует все требования домашних заданий №1, №2, №3 через понятную метафору кухни быстрого питания.

### ✅ Реализованные требования:

**🏭 ДЗ-1: Базовая CEP система**
- **📋 4 процессора** с очередями событий
- **🔄 Producer-Consumer паттерн** через асинхронные операции
- **⚡ Функциональные процессоры** (чистые функции)

**👑 ДЗ-2: Приоритеты и отказоустойчивость**
- **🏪 Приоритетные очереди** с формулой `(deadline - currentTime) / estimatedCookingTime`
- **👑 VIP система** с автоматическим повышением приоритета (priority × 0.5)
- **🚨 Обработка отказов** - 6 типов ошибок поваров с 7 стратегиями восстановления
- **⚡ Event-driven архитектура** - полностью асинхронная система с ограниченными очередями
- **🧪 TDD покрытие** - 32 теста: 15 для очередей + 17 для ошибок
- **🔧 Фабричные методы** для создания всех процессоров системы

**🔄 ДЗ-3: Событийная синхронизация** ⭐ _Новое!_

**Согласно лекции №3 - полная реализация архитектуры событийной синхронизации:**

- ✅ **RestaurantZoneAPI** - управление заказами через события (аналог таблиц узлов/ребер из лекции)
- ✅ **KitchenChangeLog** - иммутабельный журнал всех изменений с версионностью
- ✅ **RestaurantZoneSync** - обработчик событий для синхронизации зон
- ✅ **Event Sourcing** - восстановление состояния из событий без потерь
- ✅ **Snapshot система** - моментальные снимки для быстрой синхронизации
- ✅ **Буферизация заказов** при отсутствии свободных столов (управление очередями)
- ✅ **Версионность событий** - предотвращение конфликтов и рассинхронизации
- ✅ **Восстановление после рассинхронизации** через replay событий
- ✅ **51 TDD тест** покрывающий всю функциональность ДЗ-3

## 🍔 Ресторанная метафора в бизнес-логике

### Трансформация CEP концептов (ДЗ-3):

```typescript
// Было (ДЗ-2): Заказ с приоритетом
interface IRestaurantOrder {
  orderNumber: number;
  customerType: "VIP" | "обычный";
  priority: number;
}

// Стало (ДЗ-3): Система событийной синхронизации
interface IRestaurantSyncModel {
  // API операции (аналог таблиц из лекции)
  zoneAPI: RestaurantZoneAPI;
  
  // ChangeLog система
  changeLog: KitchenChangeLog;
  
  // Синхронизация состояний
  zoneSync: RestaurantZoneSync;
  
  // Snapshot для быстрой синхронизации
  snapshots: SnapshotManager;
}
```

## 🔄 Новая архитектура ДЗ-3: Событийная синхронизация

### 📱 1. RestaurantZoneAPI - Управление заказами через события

```typescript
// src/services/restaurantZoneAPI.ts
export class RestaurantZoneAPI {
  /**
   * Добавить заказ в систему (аналог add операции из лекции)
   */
  async addOrder(orderData: IOrderData): Promise<IChangeLogEvent> {
    const event: IChangeLogEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      eventType: "order_added",
      version: await this.getNextVersion(),
      payload: {
        orderId: orderData.orderId,
        isVipCustomer: orderData.isVipCustomer,
        dishDescription: orderData.dishDescription,
        tablePreference: orderData.tablePreference,
      },
    };

    // Записываем в ChangeLog
    await this.changeLog.append(event);
    
    // Логируем для образовательных целей
    console.log(`[API] ЗАКАЗ #${orderData.orderId} ДОБАВЛЕН В СИСТЕМУ`);
    
    return event;
  }

  /**
   * Переместить заказ (аналог change операции из лекции)
   */
  async moveOrder(orderId: number, newTableId: number): Promise<IChangeLogEvent> {
    const event: IChangeLogEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      eventType: "order_moved",
      version: await this.getNextVersion(),
      payload: { orderId, newTableId, previousTableId: null },
    };

    await this.changeLog.append(event);
    console.log(`[API] ЗАКАЗ #${orderId} ПЕРЕМЕЩЕН НА СТОЛ #${newTableId}`);
    
    return event;
  }

  /**
   * Удалить заказ (аналог remove операции из лекции)
   */
  async removeOrder(orderId: number): Promise<IChangeLogEvent> {
    const event: IChangeLogEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      eventType: "order_removed",
      version: await this.getNextVersion(),
      payload: { orderId },
    };

    await this.changeLog.append(event);
    console.log(`[API] ЗАКАЗ #${orderId} УДАЛЕН ИЗ СИСТЕМЫ`);
    
    return event;
  }
}
```

### 📝 2. KitchenChangeLog - Иммутабельный журнал событий

```typescript
// src/services/kitchenChangeLog.ts
export class KitchenChangeLog {
  private p_events: IChangeLogEvent[] = [];
  private p_currentVersion: number = 0;

  /**
   * Добавить событие в ChangeLog (иммутабельно)
   */
  async append(event: IChangeLogEvent): Promise<void> {
    // Проверяем версионность для предотвращения конфликтов
    if (event.version !== this.p_currentVersion + 1) {
      throw new VersionConflictError(
        `Конфликт версий: ожидали ${this.p_currentVersion + 1}, получили ${event.version}`
      );
    }

    // Добавляем хеш предыдущего события для целостности цепочки
    if (this.p_events.length > 0) {
      event.previousHash = this.calculateHash(this.p_events[this.p_events.length - 1]);
    }

    // Фиксируем событие (становится неизменяемым)
    this.p_events.push(Object.freeze(event));
    this.p_currentVersion = event.version;

    console.log(`[CHANGELOG] СОБЫТИЕ #${event.version} ЗАФИКСИРОВАНО: ${event.eventType}`);
  }

  /**
   * Получить события после определенной версии (для восстановления)
   */
  async getEventsAfter(version: number): Promise<IChangeLogEvent[]> {
    return this.p_events.filter(event => event.version > version);
  }

  /**
   * Получить снимок состояния на определенную версию
   */
  async getSnapshot(version?: number): Promise<IRestaurantSnapshot> {
    const targetVersion = version || this.p_currentVersion;
    const relevantEvents = this.p_events.filter(e => e.version <= targetVersion);

    // Восстанавливаем состояние из событий
    const snapshot = await this.buildSnapshotFromEvents(relevantEvents);
    
    return {
      ...snapshot,
      version: targetVersion,
      timestamp: new Date(),
      lastProcessedEventId: relevantEvents[relevantEvents.length - 1]?.id || "",
    };
  }

  /**
   * Проверить целостность цепочки событий
   */
  async validateIntegrity(): Promise<boolean> {
    for (let i = 1; i < this.p_events.length; i++) {
      const expectedHash = this.calculateHash(this.p_events[i - 1]);
      if (this.p_events[i].previousHash !== expectedHash) {
        console.error(`[CHANGELOG] НАРУШЕНА ЦЕЛОСТНОСТЬ ЦЕПОЧКИ НА СОБЫТИИ #${this.p_events[i].version}`);
        return false;
      }
    }
    return true;
  }
}
```

### 🔄 3. RestaurantZoneSync - Синхронизация состояний

```typescript
// src/services/restaurantZoneSync.ts
export class RestaurantZoneSync {
  private p_vipZone: RestaurantZone;
  private p_regularZone: RestaurantZone;
  private p_orderQueue: RestaurantOrderQueue;
  private p_lastProcessedVersion: number = 0;

  /**
   * Обработать событие из ChangeLog
   */
  async processEvent(event: IChangeLogEvent): Promise<void> {
    // Проверяем, что событие не обрабатывалось ранее
    if (event.version <= this.p_lastProcessedVersion) {
      console.warn(`[ZONESYNC] СОБЫТИЕ #${event.version} УЖЕ ОБРАБОТАНО`);
      return;
    }

    try {
      switch (event.eventType) {
        case "order_added":
          await this.handleOrderAdded(event);
          break;
          
        case "order_moved":
          await this.handleOrderMoved(event);
          break;
          
        case "order_removed":
          await this.handleOrderRemoved(event);
          break;
          
        case "table_freed":
          await this.handleTableFreed(event);
          break;
          
        default:
          console.warn(`[ZONESYNC] НЕИЗВЕСТНЫЙ ТИП СОБЫТИЯ: ${event.eventType}`);
      }

      this.p_lastProcessedVersion = event.version;
      console.log(`[ZONESYNC] СОБЫТИЕ #${event.version} ОБРАБОТАНО УСПЕШНО`);
      
    } catch (error) {
      console.error(`[ZONESYNC] ОШИБКА ОБРАБОТКИ СОБЫТИЯ #${event.version}:`, error);
      throw new EventProcessingError(`Не удалось обработать событие: ${error.message}`);
    }
  }

  /**
   * Обработать добавление заказа
   */
  private async handleOrderAdded(event: IChangeLogEvent): Promise<void> {
    const { orderId, isVipCustomer, dishDescription } = event.payload;
    
    // Выбираем зону для размещения
    const targetZone = isVipCustomer ? this.p_vipZone : this.p_regularZone;
    
    // Пытаемся найти свободный стол
    const availableTable = targetZone.findAvailableTable();
    
    if (availableTable) {
      // Размещаем сразу
      await targetZone.assignOrderToTable(orderId, availableTable.tableId);
      console.log(`[ZONESYNC] ЗАКАЗ #${orderId} РАЗМЕЩЕН НА СТОЛ #${availableTable.tableId} (${isVipCustomer ? 'VIP' : 'ОБЫЧНАЯ'} ЗОНА)`);
      
    } else {
      // Добавляем в очередь буферизации (принцип из лекции)
      await this.p_orderQueue.enqueue({
        orderId,
        isVipCustomer,
        dishDescription,
        enqueuedAt: new Date(),
        zone: isVipCustomer ? "vip" : "regular",
      });
      
      console.log(`[ZONESYNC] ЗАКАЗ #${orderId} ДОБАВЛЕН В ОЧЕРЕДЬ - НЕТ СВОБОДНЫХ СТОЛОВ В ${isVipCustomer ? 'VIP' : 'ОБЫЧНОЙ'} ЗОНЕ`);
    }
  }

  /**
   * Обработать освобождение стола
   */
  private async handleTableFreed(event: IChangeLogEvent): Promise<void> {
    const { tableId, zoneType } = event.payload;
    
    console.log(`[ZONESYNC] СТОЛ #${tableId} ОСВОБОЖДЕН`);
    
    // Проверяем очередь на наличие ожидающих заказов
    const queuedOrder = await this.p_orderQueue.dequeueForZone(zoneType);
    
    if (queuedOrder) {
      // Размещаем заказ из очереди
      const zone = zoneType === "vip" ? this.p_vipZone : this.p_regularZone;
      await zone.assignOrderToTable(queuedOrder.orderId, tableId);
      
      console.log(`[ZONESYNC] ЗАКАЗ #${queuedOrder.orderId} ПЕРЕМЕЩЕН ИЗ ОЧЕРЕДИ НА СТОЛ #${tableId}`);
    }
  }

  /**
   * Восстановить состояние после рассинхронизации (принцип из лекции)
   */
  async recoverFromDesync(lastKnownVersion: number): Promise<void> {
    console.log(`[ZONESYNC] НАЧИНАЕМ ВОССТАНОВЛЕНИЕ ПОСЛЕ РАССИНХРОНИЗАЦИИ С ВЕРСИИ ${lastKnownVersion}`);
    
    // Получаем все события после последней известной версии
    const missedEvents = await this.changeLog.getEventsAfter(lastKnownVersion);
    
    console.log(`[ZONESYNC] НАЙДЕНО ${missedEvents.length} ПРОПУЩЕННЫХ СОБЫТИЙ`);
    
    // Воспроизводим пропущенные события (replay)
    for (const event of missedEvents) {
      await this.processEvent(event);
    }
    
    console.log(`[ZONESYNC] ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО - СИСТЕМА СИНХРОНИЗИРОВАНА`);
  }

  /**
   * Создать снимок текущего состояния (Snapshot из лекции)
   */
  async createSnapshot(): Promise<IRestaurantSnapshot> {
    return {
      timestamp: new Date(),
      version: this.p_lastProcessedVersion,
      vipZoneState: await this.p_vipZone.getState(),
      regularZoneState: await this.p_regularZone.getState(),
      pendingOrders: await this.p_orderQueue.getState(),
      lastProcessedEventId: this.p_lastProcessedVersion.toString(),
    };
  }
}
```

## 🏗️ Архитектура системы (ДЗ-3 обновленная)

### Двойная система: CEP + Событийная синхронизация

```
🏭 CEP КОНВЕЙЕР (ДЗ-1+2):
📱 Generator → 🤝 ZIP → 🔀 Filter → 👷 Workers
     ↓           ↓       ↓          ↓
[PriorityQueue] [Assign] [Pizza]  [Results]
                        [Burger]

🔄 СОБЫТИЙНАЯ СИНХРОНИЗАЦИЯ (ДЗ-3):
🎯 ZoneAPI → 📝 ChangeLog → 🔄 ZoneSync → 🏪 Зоны
     ↓           ↓           ↓          ↓
[Add/Remove] [Иммутабельный] [Event] [VIP/Regular]
[Change]     [Журнал]       [Processing] [Tables]
```

### Интеграция систем согласно лекции №3:

1. **CEP Конвейер** готовит заказы через приоритетные очереди
2. **Готовые заказы** передаются в **ZoneAPI** для размещения
3. **ChangeLog** фиксирует все операции с заказами
4. **ZoneSync** обрабатывает события и синхронизирует состояние зон
5. **UI** получает обновления через реактивную систему

## 📂 Структура модуля (ДЗ-3 обновленная)

```
src/modules/WorkloadBalancing/
├── services/                           # Основные сервисы ресторана
│   ├── workloadSystem.ts              # 🏭 Система координации (ДЗ-1+2)
│   ├── restaurantZoneAPI.ts           # 🆕 API управления заказами (ДЗ-3)
│   ├── kitchenChangeLog.ts            # 🆕 Иммутабельный журнал (ДЗ-3)
│   ├── restaurantZoneSync.ts          # 🆕 Синхронизация зон (ДЗ-3)
│   ├── restaurantOrderGenerator.ts    # 📱 Генератор ресторанных заказов
│   ├── restaurantErrorHandler.ts      # 🚨 Обработка ошибок поваров
│   ├── restaurantPriorityQueue.ts     # 🏪 Приоритетные очереди
│   └── workloadProcessors.ts          # 🔧 Функциональные процессоры
├── interfaces/                        # TypeScript интерфейсы
│   ├── IRestaurantSyncModel.ts        # 🆕 Интерфейсы ДЗ-3 (ChangeLog, Sync)
│   ├── IRestaurantOrder.ts           # Интерфейс заказа ресторана
│   ├── IPriorityQueue.ts             # Приоритетная очередь
│   ├── IErrorHandling.ts             # Интерфейсы обработки ошибок
│   ├── IEventQueue.ts                # Базовая очередь событий
│   ├── IWorkProcessor.ts             # Интерфейсы процессоров
│   └── index.ts                      # Экспорт всех интерфейсов
├── __tests__/                        # TDD тесты (98 тестов)
│   ├── RestaurantZoneAPI.test.ts         # 🆕 17 тестов API ДЗ-3
│   ├── KitchenChangeLog.test.ts          # 🆕 16 тестов ChangeLog ДЗ-3
│   ├── RestaurantZoneSync.test.ts        # 🆕 18 тестов Sync ДЗ-3
│   ├── RestaurantPriorityQueue.test.ts   # 15 тестов приоритетных очередей
│   ├── RestaurantErrorHandler.test.ts    # 17 тестов обработки ошибок
│   ├── EventQueue.test.ts                # Базовые тесты очередей
│   ├── WorkloadSystem.test.ts            # Тесты системы координации
│   └── ...                               # Остальные тесты процессоров
└── index.ts                          # Публичный API модуля
```

## 🧪 TDD покрытие (98 тестов включая ДЗ-3)

### ✅ ДЗ-3: Событийная синхронизация (51 тест) ⭐ _Новое!_

**Согласно требованиям лекции №3:**

```typescript
// RestaurantZoneAPI.test.ts (17 тестов)
describe("RestaurantZoneAPI", () => {
  // Основные операции API (аналог таблиц из лекции)
  it("должен добавлять заказ через API с записью в ChangeLog");
  it("должен перемещать заказ между столами с фиксацией события");
  it("должен удалять заказ с созданием события удаления");
  
  // Версионность и целостность
  it("должен автоматически увеличивать версию при каждой операции");
  it("должен предотвращать конфликты версий при параллельных операциях");
  it("должен валидировать корректность данных заказа");
  
  // VIP обработка
  it("должен корректно обрабатывать VIP заказы с приоритетом");
  it("должен логировать все операции для образовательных целей");
  
  // Edge cases
  it("должен обрабатывать операции с несуществующими заказами");
  it("должен работать с большим количеством одновременных операций");
  it("должен поддерживать откат операций при ошибках");
  it("должен интегрироваться с ChangeLog без потери данных");
  it("должен обеспечивать атомарность операций");
  it("должен корректно работать при отключении ChangeLog");
  it("должен восстанавливать работу после сбоев");
  it("должен поддерживать миграцию структуры данных");
  it("должен обеспечивать консистентность при высокой нагрузке");
});

// KitchenChangeLog.test.ts (16 тестов)
describe("KitchenChangeLog", () => {
  // Основная функциональность ChangeLog
  it("должен фиксировать события в иммутабельном виде");
  it("должен поддерживать строгую версионность событий");
  it("должен предотвращать дублирование событий");
  
  // Целостность цепочки
  it("должен создавать хеши для обеспечения целостности цепочки");
  it("должен обнаруживать нарушения целостности данных");
  it("должен восстанавливать цепочку после повреждений");
  
  // Снимки состояния (Snapshot)
  it("должен создавать снимки состояния на любую версию");
  it("должен восстанавливать состояние из снимка");
  it("должен оптимизировать размер снимков");
  
  // Производительность и масштабируемость
  it("должен эффективно работать с большим объемом событий");
  it("должен поддерживать сжатие старых событий");
  it("должен обеспечивать быстрый доступ к событиям по версии");
  
  // Восстановление и репликация
  it("должен поддерживать репликацию между инстансами");
  it("должен восстанавливать данные после сбоев");
  it("должен экспортировать и импортировать журнал");
  it("должен поддерживать инкрементальное резервное копирование");
});

// RestaurantZoneSync.test.ts (18 тестов)
describe("RestaurantZoneSync", () => {
  // Обработка событий
  it("должен обрабатывать события добавления заказов");
  it("должен обрабатывать события перемещения заказов");
  it("должен обрабатывать события освобождения столов");
  it("должен обрабатывать события удаления заказов");
  
  // Синхронизация зон
  it("должен корректно синхронизировать VIP зону");
  it("должен корректно синхронизировать обычную зону");
  it("должен управлять буферизацией при отсутствии столов");
  it("должен приоритизировать VIP заказы при размещении");
  
  // Восстановление после рассинхронизации (ключевой принцип лекции)
  it("должен обнаруживать рассинхронизацию состояний");
  it("должен восстанавливать состояние через replay событий");
  it("должен корректно обрабатывать конфликтные изменения");
  it("должен использовать снимки для быстрой синхронизации");
  
  // Производительность синхронизации
  it("должен эффективно обрабатывать большие объемы событий");
  it("должен поддерживать параллельную обработку событий");
  it("должен оптимизировать использование памяти при синхронизации");
  
  // Мониторинг и логирование
  it("должен предоставлять детальные метрики синхронизации");
  it("должен логировать все изменения состояний для отладки");
  it("должен поддерживать режим диагностики для устранения проблем");
});
```

### ✅ Полное TDD покрытие (98 тестов):

- **ДЗ-1: Базовая система (15 тестов)** - очереди, процессоры
- **ДЗ-2: Приоритеты + Ошибки (32 теста)** - приоритеты, восстановление
- **ДЗ-3: Событийная синхронизация (51 тест)** - API, ChangeLog, Sync

## 🔧 Фабричные методы (обновленные для ДЗ-3)

### Создание компонентов событийной синхронизации:

```typescript
// Фабричный метод для создания API управления заказами
export function createRestaurantZoneAPI(
  config: IRestaurantZoneAPIConfig
): RestaurantZoneAPI {
  return new RestaurantZoneAPI(config);
}

// Фабричный метод для создания ChangeLog
export function createKitchenChangeLog(
  config: IKitchenChangeLogConfig
): KitchenChangeLog {
  return new KitchenChangeLog(config);
}

// Фабричный метод для создания синхронизатора зон
export function createRestaurantZoneSync(
  config: IRestaurantZoneSyncConfig
): RestaurantZoneSync {
  return new RestaurantZoneSync(config);
}

// Фабричный метод для создания полной системы синхронизации (ДЗ-3)
export function createRestaurantSyncSystem(
  config: IRestaurantSyncSystemConfig
): RestaurantSyncSystem {
  const zoneAPI = createRestaurantZoneAPI(config.api);
  const changeLog = createKitchenChangeLog(config.changeLog);
  const zoneSync = createRestaurantZoneSync(config.sync);
  
  return new RestaurantSyncSystem({
    zoneAPI,
    changeLog,
    zoneSync,
    snapshotManager: config.snapshotManager,
  });
}
```

## 🎓 CEP принципы в реализации (ДЗ-3)

### Event Sourcing (ресторанная версия ДЗ-3):

```typescript
// Заказ проходит через полную цепочку событийной синхронизации
const orderData = {
  orderId: 42,
  isVipCustomer: true,
  dishDescription: "Пицца Маргарита",
  tablePreference: "VIP",
};

// 1. API создает событие
const event = await restaurantZoneAPI.addOrder(orderData);

// 2. ChangeLog фиксирует неизменяемо
await kitchenChangeLog.append(event);

// 3. ZoneSync обрабатывает и синхронизирует
await restaurantZoneSync.processEvent(event);

// 4. UI получает обновления реактивно
```

### ChangeLog система (принцип из лекции №3):

```typescript
// Все изменения фиксируются в иммутабельном журнале
interface IChangeLogEvent {
  id: string; // Уникальный идентификатор
  timestamp: Date; // Временная метка
  eventType: string; // Тип операции
  version: number; // Версия для согласованности
  payload: any; // Данные события
  previousHash?: string; // Хеш для целостности цепочки
}
```

### Синхронизация состояний (ZoneSync):

```typescript
// Обработчик событий синхронизирует состояние зон
await zoneSync.processEvent(event);

// При рассинхронизации - восстановление через replay
await zoneSync.recoverFromDesync(lastKnownVersion);
```

### Snapshot система (быстрая синхронизация):

```typescript
// Создание моментального снимка состояния
const snapshot = await zoneSync.createSnapshot();

// Быстрая синхронизация новых клиентов
await newClient.loadFromSnapshot(snapshot);
```

## 🔌 API модуля (обновленный для ДЗ-3)

### Основные экспорты включая ДЗ-3:

```typescript
// Событийная синхронизация (ДЗ-3)
export { RestaurantZoneAPI } from "./services/restaurantZoneAPI";
export { KitchenChangeLog } from "./services/kitchenChangeLog";
export { RestaurantZoneSync } from "./services/restaurantZoneSync";
export { createRestaurantSyncSystem } from "./services/restaurantSyncSystem";

// Ресторанная система (ДЗ-1+2)
export { RestaurantWorkloadSystem } from "./services/restaurantWorkloadSystem";
export { RestaurantPriorityQueue } from "./services/restaurantPriorityQueue";
export { RestaurantErrorHandler } from "./services/restaurantErrorHandler";

// Интерфейсы ДЗ-3
export type {
  IRestaurantSyncModel,
  IChangeLogEvent,
  IRestaurantSnapshot,
  IRestaurantZone,
  ITableState,
} from "./interfaces";

// Интерфейсы ДЗ-1+2
export type {
  IRestaurantOrder,
  IPriorityQueue,
  IRestaurantErrorHandler,
  RestaurantFailureType,
  RestaurantRecoveryStrategy,
} from "./interfaces";
```

### Пример использования полной системы (ДЗ-1+2+3):

```typescript
import { 
  createRestaurantWorkloadSystem,
  createRestaurantSyncSystem 
} from "./WorkloadBalancing";

// Создаем CEP систему (ДЗ-1+2)
const cepSystem = createRestaurantWorkloadSystem({
  orderGenerationIntervalMs: 1500,
  vipProbability: 0.3,
  errorProbability: 0.1,
  queueCapacity: 100,
});

// Создаем систему событийной синхронизации (ДЗ-3)
const syncSystem = createRestaurantSyncSystem({
  api: {
    versioningEnabled: true,
    validationStrict: true,
  },
  changeLog: {
    integrityCheckEnabled: true,
    snapshotIntervalMs: 30000, // Снимки каждые 30 сек
  },
  sync: {
    vipZoneCapacity: 5, // 5 VIP столов
    regularZoneCapacity: 10, // 10 обычных столов
    bufferCapacity: 50, // Очередь до 50 заказов
    recoverySyncEnabled: true,
  },
});

// Интеграция систем
cepSystem.onOrderReady(async (order) => {
  // Готовый заказ из CEP передаем в систему синхронизации
  await syncSystem.zoneAPI.addOrder({
    orderId: order.orderNumber,
    isVipCustomer: order.customerType === "VIP",
    dishDescription: order.dishType,
    tablePreference: order.customerType === "VIP" ? "VIP" : "regular",
  });
});

// Запуск полной системы
await Promise.all([
  cepSystem.openRestaurant(), // ДЗ-1+2: Запуск CEP конвейера
  syncSystem.startSynchronization(), // ДЗ-3: Запуск событийной синхронизации
]);

// Мониторинг объединенной системы
setInterval(async () => {
  const cepStats = cepSystem.getRestaurantStats();
  const syncStats = await syncSystem.getSyncStats();
  
  console.log(`
    📊 Объединенная статистика ресторана:
    
    🏭 CEP КОНВЕЙЕР (ДЗ-1+2):
    - Принято заказов: ${cepStats.ordersReceived}
    - Готовых блюд: ${cepStats.dishesCompleted} 
    - VIP заказов: ${cepStats.vipOrders}
    - Восстановлений: ${cepStats.errorRecoveries}
    - Эффективность: ${cepStats.efficiency}%
    
    🔄 СОБЫТИЙНАЯ СИНХРОНИЗАЦИЯ (ДЗ-3):
    - События в ChangeLog: ${syncStats.totalEvents}
    - Синхронизированных зон: ${syncStats.syncedZones}
    - Заказов в VIP зоне: ${syncStats.vipZoneOrders}
    - Заказов в обычной зоне: ${syncStats.regularZoneOrders}
    - Заказов в очереди: ${syncStats.queuedOrders}
    - Восстановлений синхронизации: ${syncStats.desyncRecoveries}
    - Версия системы: ${syncStats.currentVersion}
  `);
}, 2000);
```

## 🚀 Производительность и мониторинг (ДЗ-3)

### Метрики событийной синхронизации:

```typescript
interface IRestaurantSyncStats {
  // ChangeLog метрики
  totalEvents: number; // Всего событий в журнале
  currentVersion: number; // Текущая версия системы
  integrityStatus: boolean; // Целостность цепочки событий
  
  // Синхронизация зон
  syncedZones: number; // Количество синхронизированных зон
  vipZoneOrders: number; // Заказов в VIP зоне
  regularZoneOrders: number; // Заказов в обычной зоне
  queuedOrders: number; // Заказов в очереди ожидания
  
  // Производительность
  averageEventProcessingTime: number; // Среднее время обработки события
  snapshotCreationTime: number; // Время создания снимка
  desyncRecoveries: number; // Количество восстановлений после рассинхронизации
  
  // Состояние системы
  lastSnapshotVersion: number; // Версия последнего снимка
  systemHealth: "healthy" | "degraded" | "critical"; // Здоровье системы
}
```

---

**Модуль создан специально для демонстрации домашних заданий №1, №2, №3**  
**🎓 "Событийные системы с синхронизацией состояний"**  

### **Реализованные концепции из лекции №3:**

- ✅ **Таблицы состояний** (узлы и ребра) → RestaurantZoneAPI с операциями add/remove/change
- ✅ **ChangeLog система** → KitchenChangeLog с иммутабельным журналом и версионностью  
- ✅ **Event Sourcing** → Восстановление состояния зон из событий ChangeLog
- ✅ **Синхронизация клиент-сервер** → RestaurantZoneSync с обработкой событий
- ✅ **Snapshot механизм** → Быстрая синхронизация состояний через снимки
- ✅ **Восстановление рассинхронизации** → Replay событий при обнаружении конфликтов
- ✅ **Очереди с буферизацией** → Управление заказами при отсутствии свободных столов

**🍕 Чистая бизнес-логика • TDD подход • Ресторанная метафора • Событийная архитектура**
