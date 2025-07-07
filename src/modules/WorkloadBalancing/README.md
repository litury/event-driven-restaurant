# 🔧 WorkloadBalancing Module

Модуль реализует бизнес-логику **событийной системы балансировки работы** на основе принципов Complex Event Processing (CEP).

## 🎯 Назначение модуля

Этот модуль представляет собой ядро событийной системы, которое демонстрирует принципы CEP через метафору ресторана быстрого питания. Содержит чистую бизнес-логику без привязки к UI.

### Ключевые принципы:

- **🔄 Event-driven архитектура** - вся коммуникация через события
- **⚡ Асинхронность** - полностью async/await система
- **🧩 Модульность** - независимые процессоры
- **💫 Иммутабельность** - неизменяемые события
- **🔗 Функциональное программирование** - с использованием Ramda.js

## 🏗️ Архитектура системы

### 4 участка обработки:

```
📝 Generator → 🤝 ZIP → 🔀 Filter → 👷 Workers
     ↓          ↓        ↓         ↓
  [WorkQueue] [AssignQueue] [Worker1Queue] [ResultQueue]
                            [Worker2Queue]
                            [FreeQueue] ←---┘
```

### 5 очередей событий:

1. **`workQueue`** - поток новых работ (числа 1, 2, 3...)
2. **`freeWorkersQueue`** - циркулирующие заявки "я свободен" (1, 2)
3. **`assignmentQueue`** - назначения от ZIP процессора
4. **`worker1Queue`** - очередь для четных работ
5. **`worker2Queue`** - очередь для нечетных работ
6. **`resultQueue`** - обработанные результаты

## 📂 Структура модуля

```
src/modules/WorkloadBalancing/
├── services/                    # Основные сервисы
│   ├── workloadSystem.ts       # 🏭 Главная система координации
│   └── workloadProcessors.ts   # 🔧 Все процессоры (функциональные)
├── interfaces/                 # TypeScript интерфейсы
│   ├── IEventQueue.ts         # Интерфейс очереди событий
│   ├── IWorkItem.ts           # Типы данных (работы, назначения, результаты)
│   ├── IWorkProcessor.ts      # Интерфейсы процессоров (классовые)
│   ├── IFunctionalProcessors.ts # Функциональные процессоры
│   └── index.ts               # Экспорт всех интерфейсов
├── __tests__/                 # TDD тесты
│   ├── EventQueue.test.ts     # Тесты очереди событий
│   ├── WorkloadSystem.test.ts # Тесты основной системы
│   ├── ZipProcessor.test.ts   # Тесты ZIP процессора
│   ├── FilterProcessor.test.ts # Тесты фильтра
│   ├── WorkerProcessor.test.ts # Тесты рабочих
│   └── WorkGenerator.test.ts  # Тесты генератора
└── index.ts                   # Публичный API модуля
```

## ⚙️ Компоненты системы

### 1. 📝 Генератор работ (WorkGenerator)

```typescript
const generator = createWorkGeneratorAsync(workQueue, 800, 100);
await generator.startAsync();
```

**Функции:**

- Генерирует работы (числа) по таймеру (800мс)
- Отправляет в `workQueue`
- Автоматически останавливается при достижении лимита

### 2. 🤝 ZIP-процессор (ZipProcessor)

```typescript
await createZipProcessorAsync(workQueue, freeWorkersQueue, assignmentQueue);
```

**Функции:**

- Ожидает **одновременно** работу И свободного рабочего
- Создает неизменяемое назначение `{workItem, workerId}`
- Отправляет в `assignmentQueue`

### 3. 🔀 Фильтр-процессор (FilterProcessor)

```typescript
await createFilterProcessorAsync(assignmentQueue, worker1Queue, worker2Queue);
```

**Функции:**

- Получает назначения от ZIP процессора
- Распределяет по номеру работы: **четные → worker1, нечетные → worker2**
- Использует функциональное программирование (Ramda.js)

### 4. 👷 Рабочие-процессоры (WorkerProcessor)

```typescript
// Рабочий 1 (четные работы)
await createWorkerProcessorAsync(
  worker1Queue,
  freeWorkersQueue,
  resultQueue,
  1
);

// Рабочий 2 (нечетные работы)
await createWorkerProcessorAsync(
  worker2Queue,
  freeWorkersQueue,
  resultQueue,
  2
);
```

**Функции:**

- Обрабатывают работу (умножение на 2)
- Создают результат с временной меткой
- Отправляют результат в `resultQueue`
- Возвращаются в `freeWorkersQueue` (циркуляция)

### 5. 🏭 Система координации (WorkloadSystem)

```typescript
const system = createWorkloadSystem({
  workGenerationIntervalMs: 800,
  maxWorks: 100,
  autoStart: false,
});

await system.startAsync(); // Запуск всей системы
const state = system.getState(); // Получение состояния
await system.stopAsync(); // Остановка системы
```

**Функции:**

- Координирует все процессоры
- Управляет жизненным циклом системы
- Предоставляет состояние для UI
- Обрабатывает ошибки и восстановление

## 🧪 Тестирование

Модуль полностью покрыт TDD тестами:

```bash
# Запуск тестов модуля
npm test src/modules/WorkloadBalancing

# Конкретные тесты
npm test EventQueue.test.ts          # Тесты очереди
npm test WorkloadSystem.test.ts      # Тесты системы
npm test ZipProcessor.test.ts        # Тесты ZIP
npm test FilterProcessor.test.ts     # Тесты фильтра
npm test WorkerProcessor.test.ts     # Тесты рабочих
npm test WorkGenerator.test.ts       # Тесты генератора
```

### Покрытие тестами:

- ✅ **EventQueue** - все операции (enqueue, dequeue, size, isEmpty)
- ✅ **WorkloadSystem** - запуск, остановка, состояние
- ✅ **Все процессоры** - корректность логики обработки
- ✅ **Интеграционные сценарии** - полные циклы обработки
- ✅ **Обработка ошибок** - восстановление после сбоев

## 🔌 API модуля

### Основные экспорты:

```typescript
// Система
export {
  WorkloadSystem,
  createWorkloadSystem,
} from "./services/workloadSystem";
export type { IWorkloadSystemConfig, IWorkloadSystemState };

// Процессоры (функциональные)
export {
  createZipProcessorAsync,
  createFilterProcessorAsync,
  createWorkerProcessorAsync,
  createWorkGeneratorAsync,
} from "./services/workloadProcessors";

// Интерфейсы и типы
export type * from "./interfaces";
```

### Пример использования:

```typescript
import { createWorkloadSystem } from "./WorkloadBalancing";

const system = createWorkloadSystem({
  workGenerationIntervalMs: 800,
  maxWorks: 50,
  autoStart: false,
});

// Запуск системы
await system.startAsync();

// Получение состояния (для UI)
setInterval(() => {
  const state = system.getState();
  console.log("Очереди:", {
    работы: state.queues.workQueue.size(),
    назначения: state.queues.assignmentQueue.size(),
    рабочий1: state.queues.worker1Queue.size(),
    рабочий2: state.queues.worker2Queue.size(),
    результаты: state.queues.resultQueue.size(),
  });
}, 1000);

// Остановка через 30 секунд
setTimeout(() => system.stopAsync(), 30000);
```

## 🎓 Принципы CEP в реализации

### Event Sourcing

- Все изменения состояния происходят через события
- События неизменяемы после создания
- Полная трассировка всех операций

### Stream Processing

- Непрерывная обработка потоков событий
- Каждый процессор работает независимо
- Backpressure через ограничения очередей

### Temporal Consistency

- Не требуется строгая согласованность
- Eventual consistency через событийную архитектуру
- Временные метки для упорядочивания

### Actor Model

- Каждый процессор изолирован
- Коммуникация только через сообщения (события)
- Супервизия через WorkloadSystem

## 🔗 Связь с UI модулем

Модуль **НЕ зависит** от UI - это чистая бизнес-логика:

```typescript
// ✅ Правильно: UI зависит от бизнеса
import { createWorkloadSystem } from "../WorkloadBalancing";

// ❌ Неправильно: бизнес НЕ должен знать о UI
// import { SomeVueComponent } from '../WebDashboard'
```

UI модуль `WebDashboard` использует этот модуль через адаптационный слой в композаблах.

## 🚀 Производительность

### Оптимизации:

- **Async/await** - неблокирующие операции
- **Функциональные процессоры** - без состояния
- **Иммутабельные события** - безопасность потоков
- **Lazy evaluation** - обработка по требованию

### Мониторинг:

```typescript
const state = system.getState();
console.log(`
  📊 Статистика:
  - Сгенерировано работ: ${state.generatedWorks}
  - Обработано работ: ${state.processedWorks}
  - Эффективность: ${(
    (state.processedWorks / state.generatedWorks) *
    100
  ).toFixed(1)}%
  - Загрузка очередей: ${Object.values(state.queues).reduce(
    (sum, q) => sum + q.size(),
    0
  )}
`);
```

---

**Модуль:** Бизнес-логика CEP системы • Чистая архитектура • TDD подход
