# Cursor Rules для проекта 

Этот проект использует новую систему Cursor Rules вместо устаревшего `.cursorrules` файла.

## Структура правил

### Активные правила (alwaysApply: true)

- `vue-typescript-conventions.mdc` - Основные конвенции для Vue.js 3 и TypeScript
- `russian-language.mdc` - Настройка языка общения (русский)

### Автоматически подключаемые правила (Auto Attached)

- `backend-conventions.mdc` - Конвенции для backend кода в директориях services/, modules/, app.js/
- `project-structure.mdc` - Соглашения о структуре проектов для frontend разработки
- `frontend-coding-standards.mdc` - Расширенные стандарты кодирования для frontend
- `git-workflow.mdc` - Git workflow правила - именование веток, формат коммитов, версионирование

### Agent Requestable правила (по запросу ИИ)

- `design-system-tokens.mdc` - Токены дизайн-системы для генерации Vue компонентов
- `tdd-vitest-workflow.mdc` - TDD (Test-Driven Development) workflow с Vitest

## Как работают правила

1. **Always Apply** правила включаются во всех контекстах
2. **Auto Attached** правила включаются при работе с файлами, соответствующими glob patterns:
   - `project-structure.mdc` - активируется для файлов в `**/src/**/*`, `**/modules/**/*`, `**/components/**/*`
   - `frontend-coding-standards.mdc` - активируется для `**/*.vue`, `**/*.ts`, `**/*.js`
   - `backend-conventions.mdc` - активируется для `**/services/**/*.ts`, `**/modules/**/*.ts`, `**/app.js/**/*.ts`
   - `git-workflow.mdc` - активируется для `**/.git/**`, `**/.gitignore`, `**/CHANGELOG.md`
3. **Agent Requestable** правила запрашиваются ИИ автоматически при необходимости:
   - При создании компонентов → запрос `design-system-tokens`
   - При создании тестов или новых функций → запрос `tdd-vitest-workflow`
4. Правила можно вызывать вручную через @ruleName

## Соглашения именования

Все правила используют следующие конвенции:

- Входящие параметры функций: `_camelCase`
- Переменные и функции: `camelCase`
- Классы и интерфейсы: `PascalCase`
- Константы: `UPPER_CASE`
- Приватные переменные: `p_camelCase`

## Дополнительные требования

### JSDoc документация

- **ОБЯЗАТЕЛЬНО**: используй JSDoc для функций и интерфейсов
- Комментарии должны объяснять **причины**, а не действия

### Структура проекта

- Не более 7-10 файлов в одной папке
- Обязательные `index.ts` файлы в каждой папке
- Папка `parts/` только для внутренних реализаций (НЕ в корне!)

### Дизайн-система

- Используй CSS токены вместо хардкода цветов
- Семантические варианты: `variant="default|accent|success|error"`
- Размеры: `size="s|m|l"`
- Автоматическая поддержка светлой/темной темы

## Обновление правил

При изменении правил в этой директории, Cursor автоматически подхватит изменения.
Не забывайте коммитить изменения в git, так как правила являются частью проекта.
