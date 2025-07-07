# 🤝 Contributing to CEP Restaurant Demo

Спасибо за интерес к проекту! Мы рады любому вкладу в развитие образовательной платформы для изучения событийных систем.

## 🚀 Быстрый старт для разработчиков

### Настройка окружения

```bash
# Клонирование репозитория
git clone https://github.com/litury/event-driven-restaurant.git
cd event-driven-restaurant

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Запуск тестов
npm test
```

## 📋 Как внести вклад

### 1. Создание Issue

Перед началом работы:

- Проверьте существующие [Issues](https://github.com/litury/event-driven-restaurant/issues)
- Создайте новый Issue с описанием проблемы или предложения
- Дождитесь обсуждения и одобрения

### 2. Форк и Pull Request

```bash
# Форк репозитория через GitHub UI

# Клонирование вашего форка
git clone https://github.com/YOUR_USERNAME/event-driven-restaurant.git
cd event-driven-restaurant

# Создание feature ветки
git checkout -b feature/amazing-feature

# Внесение изменений
# ... your changes ...

# Коммит изменений
git commit -m "feat: добавить amazing feature"

# Пуш в ваш форк
git push origin feature/amazing-feature

# Создание Pull Request через GitHub UI
```

## 🧪 Стандарты разработки

### TDD подход

Проект следует принципам Test-Driven Development:

```bash
# 1. Написать тест (RED)
npm test -- --watch src/modules/NewModule

# 2. Написать код (GREEN)
# ... implement feature ...

# 3. Рефакторинг (REFACTOR)
# ... improve code ...
```

### Структура коммитов

Используем [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Типы:**

- `feat:` - новая функциональность
- `fix:` - исправление бага
- `docs:` - изменения в документации
- `style:` - форматирование кода
- `refactor:` - рефакторинг без изменения функциональности
- `test:` - добавление тестов
- `chore:` - обновление зависимостей, конфигурации

**Примеры:**

```
feat(WorkloadBalancing): добавить новый процессор
fix(WebDashboard): исправить баг с анимацией
docs(README): обновить инструкции по установке
```

## 📁 Архитектура проекта

### Модули

```
src/modules/
├── WorkloadBalancing/  # 🔧 Бизнес-логика CEP
├── WebDashboard/      # 🎨 UI компоненты
└── NewModule/         # 🆕 Ваш модуль
```

### Принципы:

- **Separation of Concerns** - разделение ответственности между модулями
- **Pure Functions** - предпочитаем чистые функции
- **Immutability** - неизменяемые данные
- **TypeScript first** - строгая типизация

## 🧩 Гайдлайны для кода

### TypeScript

```typescript
// ✅ Хорошо: явные типы и JSDoc
/**
 * Создает новый процессор событий
 * @param {IEventQueue<T>} inputQueue - входная очередь
 * @param {IEventQueue<U>} outputQueue - выходная очередь
 * @returns {Promise<void>} промис завершения обработки
 */
async function createProcessorAsync<T, U>(
  inputQueue: IEventQueue<T>,
  outputQueue: IEventQueue<U>
): Promise<void> {
  // implementation
}

// ❌ Плохо: неявные типы
function createProcessor(input, output) {
  // implementation
}
```

### Vue компоненты

```vue
<!-- ✅ Хорошо: Composition API + TypeScript -->
<script setup lang="ts">
interface Props {
  title: string;
  count: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  update: [value: number];
}>();
</script>

<!-- ❌ Плохо: Options API без типов -->
<script>
export default {
  props: ["title", "count"],
  // ...
};
</script>
```

### Тестирование

```typescript
// ✅ Хорошо: описательные тесты с Given-When-Then
describe("ZipProcessor", () => {
  it("должен объединять работы и рабочих в назначения", async () => {
    // Given: у нас есть работа и свободный рабочий
    const workQueue = createEventQueue<number>();
    const freeQueue = createEventQueue<number>();
    const assignQueue = createEventQueue<IWorkAssignment>();

    await workQueue.enqueueAsync(42);
    await freeQueue.enqueueAsync(1);

    // When: запускаем ZIP процессор
    await createZipProcessorAsync(workQueue, freeQueue, assignQueue);

    // Then: должно появиться назначение
    const assignment = await assignQueue.dequeueAsync();
    expect(assignment).toEqual({ workItem: 42, workerId: 1 });
  });
});
```

## 🎨 UI/UX Guidelines

### Дизайн система

- **Tailwind CSS** для стилизации
- **Эмодзи** для иконок (🍕, 📊, ⚡)
- **Анимации** для живости интерфейса
- **Цветовая кодировка** для логической группировки

### Доступность

- Семантический HTML
- ARIA атрибуты для интерактивных элементов
- Контрастность цветов
- Поддержка клавиатурной навигации

## 📚 Образовательная направленность

Проект создан для обучения, поэтому:

- **Комментируйте сложные концепты** - помогите другим понять
- **Добавляйте примеры** - покажите как использовать
- **Пишите понятный код** - избегайте overengineering
- **Документируйте решения** - объясните почему именно так

## ❓ Вопросы и поддержка

- 🐛 **Баги**: создайте [Issue](https://github.com/litury/event-driven-restaurant/issues)
- 💡 **Идеи**: создайте [Discussion](https://github.com/litury/event-driven-restaurant/discussions)
- 📧 **Прямой контакт**: через GitHub профиль

---

**Спасибо за вклад в развитие образовательных технологий! 🚀**
