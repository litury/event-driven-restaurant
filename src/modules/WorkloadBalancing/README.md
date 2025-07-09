# 🔧 WorkloadBalancing Module - Ресторанная система CEP

Модуль реализует **бизнес-логику событийной системы балансировки работы** на основе принципов Complex Event Processing (CEP) через метафору ресторана быстрого питания. Создан для **домашнего задания №2** по лекции Александра Шолупова.

## 🎯 Назначение модуля (ДЗ-2)

Этот модуль представляет собой **ядро событийной системы ресторана**, которое демонстрирует все требования домашнего задания №2 через понятную метафору кухни быстрого питания.

### ✅ Реализованные требования ДЗ-2:

- **🏪 Приоритетные очереди** с формулой `(deadline - currentTime) / estimatedCookingTime`
- **👑 VIP система** с автоматическим повышением приоритета (priority × 0.5)
- **🚨 Обработка отказов** - 6 типов ошибок поваров с 7 стратегиями восстановления
- **⚡ Event-driven архитектура** - полностью асинхронная система с ограниченными очередями
- **🧪 TDD покрытие** - 32 теста: 15 для очередей + 17 для ошибок
- **🔧 Фабричные методы** для создания всех процессоров системы

## 🍔 Ресторанная метафора в бизнес-логике

### Трансформация CEP концептов:

```typescript
// Было (абстрактно): Работа №42 в очереди
interface WorkItem {
  id: number;
  data: any;
}

// Стало (понятно): Заказ пиццы от VIP клиента
interface IRestaurantOrder {
  orderNumber: number;
  customerType: "VIP" | "обычный" | "доставка";
  dishType: "пицца" | "бургер" | "салат" | "десерт";
  complexity: "простое" | "среднее" | "сложное";
  estimatedCookingTimeMs: number;
  deadline: Date;
  enqueuedAt: Date;
  specialRequests?: string[]; // Только для VIP
  priority: number; // Автоматический расчет
}
```

## 🔥 Новая архитектура (ДЗ-2)

### 📱 1. Генератор ресторанных заказов

```typescript
// src/services/restaurantOrderGenerator.ts
export class RestaurantOrderGenerator {
  private generateRestaurantOrder(): IRestaurantOrder {
    const customerType = this.getRandomCustomerType();
    const dishType = this.getRandomDishType();
    const deadline = this.calculateDeadline(customerType, dishType);

    // Автоматический расчет приоритета
    const priority = this.calculatePriority(deadline, dishType);

    return {
      orderNumber: this.nextOrderNumber++,
      customerType,
      dishType,
      complexity: this.getDishComplexity(dishType),
      estimatedCookingTimeMs: this.getCookingTime(dishType),
      deadline,
      enqueuedAt: new Date(),
      specialRequests:
        customerType === "VIP" ? this.getVipRequests() : undefined,
      priority: customerType === "VIP" ? priority * 0.5 : priority, // VIP приоритет
    };
  }

  private calculatePriority(deadline: Date, dishType: string): number {
    const now = Date.now();
    const cookingTime = this.getCookingTime(dishType);

    // Формула из ДЗ-2: чем меньше - тем выше приоритет
    return (deadline.getTime() - now) / cookingTime;
  }
}
```

### 🏪 2. Приоритетные очереди ресторана

```typescript
// src/services/restaurantPriorityQueue.ts
export class RestaurantPriorityQueue<T extends IRestaurantOrder>
  implements IPriorityQueue<T>
{
  private p_items: T[] = [];
  private p_capacity: number;

  /**
   * Добавить заказ с автоматической сортировкой по приоритету
   */
  async enqueueWithPriority(order: T, priority: number): Promise<void> {
    if (this.isFull()) {
      throw new QueueFullError(
        `Очередь ресторана переполнена (capacity: ${this.p_capacity})`
      );
    }

    // Обновляем приоритет заказа
    order.priority = priority;

    // Вставляем в правильную позицию (меньше priority = выше в очереди)
    const insertIndex = this.findInsertPosition(priority);
    this.p_items.splice(insertIndex, 0, order);

    // Логируем для образовательных целей
    this.logPriorityOperation("ENQUEUE", order);
  }

  /**
   * Извлечь заказ с наивысшим приоритетом (наименьшее число)
   */
  async dequeueAsync(): Promise<T | null> {
    if (this.isEmpty()) {
      return null;
    }

    const highestPriorityOrder = this.p_items.shift()!;
    this.logPriorityOperation("DEQUEUE", highestPriorityOrder);

    return highestPriorityOrder;
  }

  /**
   * Пересчитать приоритеты всех заказов (время меняется!)
   */
  recalculatePriorities(): void {
    const now = Date.now();

    for (const order of this.p_items) {
      const oldPriority = order.priority;

      // Пересчитываем по формуле
      const newPriority =
        (order.deadline.getTime() - now) / order.estimatedCookingTimeMs;
      order.priority =
        order.customerType === "VIP" ? newPriority * 0.5 : newPriority;

      if (Math.abs(oldPriority - order.priority) > 0.1) {
        this.logPriorityChange(order, oldPriority, order.priority);
      }
    }

    // Пересортировываем очередь
    this.p_items.sort((a, b) => a.priority - b.priority);
  }
}
```

### 🚨 3. Система обработки ошибок поваров

```typescript
// src/services/restaurantErrorHandler.ts
export class RestaurantErrorHandler implements IRestaurantErrorHandler {
  private p_failureStats = new Map<RestaurantFailureType, number>();
  private p_circuitBreaker = new CircuitBreaker();

  /**
   * Обработать ошибку повара с выбором стратегии восстановления
   */
  async handleFailure(
    failureType: RestaurantFailureType,
    failureContext: IRestaurantFailureContext
  ): Promise<IRestaurantRecoveryResult> {
    // Обновляем статистику ошибок
    this.updateFailureStats(failureType);

    // Проверяем Circuit Breaker
    if (!this.p_circuitBreaker.isOperationAllowed()) {
      return {
        success: false,
        strategy: "circuit_breaker_open",
        message: "Система перегружена ошибками - Circuit Breaker открыт",
        shouldRetry: false,
      };
    }

    // Выбираем стратегию восстановления
    const strategy = this.selectRecoveryStrategy(failureType, failureContext);

    // Выполняем стратегию
    const result = await this.executeStrategy(strategy, failureContext);

    // Обновляем Circuit Breaker
    this.p_circuitBreaker.recordResult(result.success);

    return result;
  }

  /**
   * 6 типов ошибок поваров
   */
  private selectRecoveryStrategy(
    failureType: RestaurantFailureType,
    context: IRestaurantFailureContext
  ): RestaurantRecoveryStrategy {
    switch (failureType) {
      case "chef_unavailable":
        // Повар заболел - ждем другого повара или эскалируем
        return context.isVipOrder
          ? "retry_with_escalation"
          : "retry_with_delay";

      case "ingredients_missing":
        // Нет ингредиентов - заменяем блюдо или откладываем
        return context.canSubstitute
          ? "substitute_alternative"
          : "store_for_later";

      case "equipment_failure":
        // Сломалось оборудование - ручная обработка менеджера
        return "move_to_review_queue";

      case "queue_full":
        // Очередь переполнена - повторить позже
        return "retry_with_delay";

      case "order_timeout":
        // Заказ просрочен - отменить с извинениями
        return "discard_with_log";

      case "quality_issue":
        // Проблемы качества - переделать сразу или отменить
        return context.retriesCount < 2
          ? "retry_immediately"
          : "discard_with_log";

      default:
        return "move_to_review_queue";
    }
  }

  /**
   * 7 стратегий восстановления
   */
  private async executeStrategy(
    strategy: RestaurantRecoveryStrategy,
    context: IRestaurantFailureContext
  ): Promise<IRestaurantRecoveryResult> {
    switch (strategy) {
      case "retry_immediately":
        return {
          success: true,
          strategy,
          message: "Повторяем обработку заказа немедленно",
        };

      case "retry_with_delay":
        await this.delay(2000); // 2 секунды
        return {
          success: true,
          strategy,
          message: "Повторяем через 2 секунды",
        };

      case "retry_with_escalation":
        this.escalateToManager(context);
        return {
          success: true,
          strategy,
          message: "Эскалировано менеджеру кухни",
        };

      case "move_to_review_queue":
        await this.moveToManualReview(context);
        return {
          success: true,
          strategy,
          message: "Перенесено в очередь ручной обработки",
        };

      case "store_for_later":
        await this.storeForLater(context);
        return {
          success: true,
          strategy,
          message: "Сохранено для обработки позже",
        };

      case "discard_with_log":
        this.logDiscardedOrder(context);
        return {
          success: false,
          strategy,
          message: "Заказ отменен с извинениями клиенту",
        };

      case "substitute_alternative":
        const alternative = await this.findAlternativeDish(context.order);
        return {
          success: true,
          strategy,
          message: `Заменено на ${alternative}`,
          alternativeOrder: alternative,
        };

      default:
        return {
          success: false,
          strategy,
          message: "Неизвестная стратегия восстановления",
        };
    }
  }
}
```

## 🏗️ Архитектура системы (обновленная)

### 4 участка обработки ресторана:

```
📱 RestaurantOrderGenerator → 🤝 ZIP → 🔀 DishTypeFilter → 👷 ChefWorkers
         ↓                     ↓       ↓                    ↓
    [PriorityQueue]        [AssignQueue] [PizzaChefQueue]   [ResultQueue]
                                         [BurgerChefQueue]
                                         [FreeChefQueue] ←---┘
```

### 5 приоритетных очередей:

1. **📱 `restaurantOrderQueue`** - приоритетная очередь заказов (автосортировка)
2. **👥 `freeChefQueue`** - циркулирующие заявки "готов принять заказ"
3. **🤝 `assignmentQueue`** - ZIP объединяет заказы + свободных поваров
4. **🍕 `pizzaChefQueue`** - очередь повара пиццы (с обработкой ошибок)
5. **🍔 `burgerChefQueue`** - очередь повара бургеров (с обработкой ошибок)

## 📂 Структура модуля (ДЗ-2)

```
src/modules/WorkloadBalancing/
├── services/                           # Основные сервисы ресторана
│   ├── workloadSystem.ts              # 🏭 Система координации
│   ├── restaurantOrderGenerator.ts    # 📱 Генератор ресторанных заказов
│   ├── restaurantErrorHandler.ts      # 🚨 Обработка ошибок поваров
│   ├── restaurantPriorityQueue.ts     # 🏪 Приоритетные очереди
│   └── workloadProcessors.ts          # 🔧 Функциональные процессоры
├── interfaces/                        # TypeScript интерфейсы ДЗ-2
│   ├── IRestaurantOrder.ts           # Интерфейс заказа ресторана
│   ├── IPriorityQueue.ts             # Приоритетная очередь
│   ├── IErrorHandling.ts             # Интерфейсы обработки ошибок
│   ├── IEventQueue.ts                # Базовая очередь событий
│   ├── IWorkProcessor.ts             # Интерфейсы процессоров
│   └── index.ts                      # Экспорт всех интерфейсов
├── __tests__/                        # TDD тесты (32 теста)
│   ├── RestaurantPriorityQueue.test.ts   # 15 тестов приоритетных очередей
│   ├── RestaurantErrorHandler.test.ts    # 17 тестов обработки ошибок
│   ├── EventQueue.test.ts                # Базовые тесты очередей
│   ├── WorkloadSystem.test.ts            # Тесты системы координации
│   └── ...                               # Остальные тесты процессоров
└── index.ts                          # Публичный API модуля
```

## 🧪 TDD покрытие (32 теста)

### ✅ Приоритетные очереди (15 тестов):

```typescript
// RestaurantPriorityQueue.test.ts
describe("RestaurantPriorityQueue", () => {
  // Базовая функциональность
  it("должна добавлять заказы с автосортировкой по приоритету");
  it("должна извлекать заказ с наивысшим приоритетом");
  it("должна возвращать null при попытке извлечь из пустой очереди");

  // Приоритеты и VIP
  it("должна правильно рассчитывать приоритет по формуле");
  it("должна давать VIP заказам повышенный приоритет (× 0.5)");
  it("должна пересчитывать приоритеты при изменении времени");

  // Ресторанная специфика
  it("должна обрабатывать просроченные заказы");
  it("должна группировать заказы по типу блюда");
  it("должна отслеживать VIP заказы отдельно");

  // Edge cases
  it("должна обрабатывать переполнение очереди (capacity 100)");
  it("должна работать с нулевым временем приготовления");
  it("должна обрабатывать одинаковые приоритеты (FIFO)");
  it("должна корректно работать с большой очередью (100+ заказов)");
  it("должна поддерживать операции в многопоточной среде");
  it("должна валидировать корректность структуры заказа");
});
```

### ✅ Обработка ошибок (17 тестов):

```typescript
// RestaurantErrorHandler.test.ts
describe("RestaurantErrorHandler", () => {
  // 6 типов ошибок поваров
  it("должна обрабатывать chef_unavailable с retry_with_delay");
  it("должна обрабатывать ingredients_missing с substitute_alternative");
  it("должна обрабатывать equipment_failure с move_to_review_queue");
  it("должна обрабатывать queue_full с retry_with_delay");
  it("должна обрабатывать order_timeout с discard_with_log");
  it("должна обрабатывать quality_issue с retry_immediately");

  // 7 стратегий восстановления
  it("должна выполнять retry_immediately для быстрого исправления");
  it("должна выполнять retry_with_delay с задержкой 2 секунды");
  it("должна выполнять retry_with_escalation для VIP заказов");
  it("должна выполнять move_to_review_queue для ручной обработки");
  it("должна выполнять store_for_later для отложенной обработки");
  it("должна выполнять discard_with_log с логированием отмены");
  it("должна выполнять substitute_alternative с заменой блюда");

  // Circuit Breaker паттерн
  it("должна открывать Circuit Breaker при превышении порога ошибок");
  it("должна закрывать Circuit Breaker после успешных операций");
  it("должна предотвращать каскадные сбои через Circuit Breaker");

  // Статистика и мониторинг
  it("должна вести статистику всех типов ошибок");
  it("должна предоставлять метрики восстановления для мониторинга");
});
```

## 🔧 Фабричные методы (ДЗ-2)

### Создание процессоров через фабрики:

```typescript
// Фабричный метод для создания генератора заказов
export function createRestaurantOrderGenerator(
  config: IRestaurantOrderGeneratorConfig
): RestaurantOrderGenerator {
  return new RestaurantOrderGenerator(config);
}

// Фабричный метод для создания приоритетной очереди
export function createRestaurantPriorityQueue<T extends IRestaurantOrder>(
  capacity: number = 100
): RestaurantPriorityQueue<T> {
  return new RestaurantPriorityQueue<T>(capacity);
}

// Фабричный метод для создания обработчика ошибок
export function createRestaurantErrorHandler(
  config: IRestaurantErrorHandlerConfig
): RestaurantErrorHandler {
  return new RestaurantErrorHandler(config);
}

// Фабричный метод для создания всей системы
export function createRestaurantWorkloadSystem(
  config: IRestaurantWorkloadSystemConfig
): RestaurantWorkloadSystem {
  return new RestaurantWorkloadSystem(config);
}
```

## 🎓 CEP принципы в реализации

### Event Sourcing (ресторанная версия):

```typescript
// Заказ создается один раз и становится неизменяемым
const order: IRestaurantOrder = {
  orderNumber: 42,
  customerType: "VIP",
  dishType: "пицца",
  deadline: new Date(Date.now() + 300000), // 5 минут
  enqueuedAt: new Date(),
  // ... остальные поля неизменяемы
};
```

### Stream Processing (поток заказов):

```typescript
// Непрерывная обработка потока заказов ресторана
restaurantOrderGenerator.onNewOrder((order) => {
  const priority = calculatePriority(order);
  priorityQueue.enqueueWithPriority(order, priority);
});
```

### Temporal Consistency (временная согласованность):

```typescript
// Приоритет зависит от времени - автоматический пересчет
setInterval(() => {
  priorityQueue.recalculatePriorities();
}, 1000); // Каждую секунду
```

### Fault Tolerance (отказоустойчивость):

```typescript
// Автоматическое восстановление после ошибок поваров
try {
  await chefProcessor.cookDish(order);
} catch (error) {
  const recovery = await errorHandler.handleFailure(error.type, { order });
  if (recovery.shouldRetry) {
    await this.retryAfterDelay(order, recovery.delayMs);
  }
}
```

## 🔌 API модуля (ДЗ-2)

### Основные экспорты:

```typescript
// Ресторанная система
export { RestaurantWorkloadSystem } from "./services/restaurantWorkloadSystem";
export { createRestaurantWorkloadSystem } from "./services/restaurantWorkloadSystem";

// Приоритетные очереди
export { RestaurantPriorityQueue } from "./services/restaurantPriorityQueue";
export { createRestaurantPriorityQueue } from "./services/restaurantPriorityQueue";

// Генератор заказов
export { RestaurantOrderGenerator } from "./services/restaurantOrderGenerator";
export { createRestaurantOrderGenerator } from "./services/restaurantOrderGenerator";

// Обработка ошибок
export { RestaurantErrorHandler } from "./services/restaurantErrorHandler";
export { createRestaurantErrorHandler } from "./services/restaurantErrorHandler";

// Интерфейсы ДЗ-2
export type {
  IRestaurantOrder,
  IPriorityQueue,
  IRestaurantErrorHandler,
  RestaurantFailureType,
  RestaurantRecoveryStrategy,
} from "./interfaces";
```

### Пример использования (ДЗ-2):

```typescript
import { createRestaurantWorkloadSystem } from "./WorkloadBalancing";

// Создаем ресторанную систему с приоритетами и обработкой ошибок
const restaurantSystem = createRestaurantWorkloadSystem({
  // Генератор заказов
  orderGenerationIntervalMs: 1500,
  vipProbability: 0.3, // 30% VIP клиентов
  errorProbability: 0.1, // 10% ошибок поваров

  // Приоритетные очереди
  queueCapacity: 100,
  priorityRecalculationIntervalMs: 1000,

  // Обработка ошибок
  circuitBreakerThreshold: 5, // Открыть после 5 ошибок
  maxRetries: 3,
  vipEscalationEnabled: true,
});

// Запуск ресторана
await restaurantSystem.openRestaurant();

// Мониторинг работы
setInterval(() => {
  const stats = restaurantSystem.getRestaurantStats();
  console.log(`
    📊 Статистика ресторана:
    - Принято заказов: ${stats.ordersReceived}
    - Готовых блюд: ${stats.dishesCompleted} 
    - VIP заказов: ${stats.vipOrders}
    - Просроченных: ${stats.overdueOrders}
    - Восстановлений: ${stats.errorRecoveries}
    - Эффективность: ${stats.efficiency}%
  `);
}, 1000);
```

## 🚀 Производительность и мониторинг

### Метрики ресторанной системы:

```typescript
interface IRestaurantStats {
  // Основные метрики
  ordersReceived: number; // Всего принято заказов
  dishesCompleted: number; // Готовых блюд
  efficiency: number; // (completed / received) * 100

  // VIP метрики
  vipOrders: number; // VIP заказов в системе
  vipCompletionTime: number; // Среднее время VIP заказов

  // Ошибки и восстановление
  totalErrors: number; // Общее количество ошибок
  errorRecoveries: number; // Успешных восстановлений
  circuitBreakerState: string; // CLOSED | OPEN | HALF_OPEN

  // Очереди
  queueUtilization: number; // Загрузка очередей в %
  averageWaitTime: number; // Среднее время ожидания
  overdueOrders: number; // Просроченных заказов
}
```

---

**Модуль создан специально для демонстрации домашнего задания №2**  
**🎓 "Событийные системы с приоритетными очередями и обработкой отказов" - Александр Шолупов**  
**🍕 Чистая бизнес-логика • TDD подход • Ресторанная метафора**
