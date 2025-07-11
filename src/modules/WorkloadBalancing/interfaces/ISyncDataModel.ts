/**
 * Интерфейсы для ДЗ-3: Событийная синхронизация файловой системы
 */

/**
 * Запись в таблице данных
 */
export interface IDataRecord {
  /** Уникальный идентификатор записи */
  id: number

  /** Булевый флаг управляющий структурой папок */
  flag: boolean

  /** Содержимое для файла readme */
  content: string

  /** Время создания записи */
  createdAt: Date

  /** Время последнего изменения */
  updatedAt: Date
}

/**
 * Типы событий изменения данных
 */
export type ChangeEventType = 'add' | 'remove' | 'change'

/**
 * Базовое событие изменения
 */
export interface IChangeEvent {
  /** Уникальный номер события в ChangeLog */
  eventId: number

  /** Тип события */
  type: ChangeEventType

  /** Время возникновения события */
  timestamp: Date

  /** Идентификатор записи */
  recordId: number
}

/**
 * Событие добавления записи
 */
export interface IAddEvent extends IChangeEvent {
  type: 'add'
  /** Добавляемая запись */
  record: IDataRecord
}

/**
 * Событие удаления записи
 */
export interface IRemoveEvent extends IChangeEvent {
  type: 'remove'
  /** Только ID удаляемой записи */
  recordId: number
}

/**
 * Событие изменения записи
 */
export interface IChangeFieldEvent extends IChangeEvent {
  type: 'change'
  /** Какое поле изменилось */
  field: keyof IDataRecord
  /** Старое значение */
  oldValue: any
  /** Новое значение */
  newValue: any
}

/**
 * Объединённый тип всех событий
 */
export type DataChangeEvent = IAddEvent | IRemoveEvent | IChangeFieldEvent

/**
 * Интерфейс API для работы с данными
 */
export interface IDataAPI {
  /** Добавить новую запись */
  addRecord(record: Omit<IDataRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<IDataRecord>

  /** Удалить запись по ID */
  removeRecord(id: number): Promise<boolean>

  /** Изменить поле записи */
  changeField<K extends keyof IDataRecord>(
    id: number,
    field: K,
    value: IDataRecord[K]
  ): Promise<boolean>

  /** Получить запись по ID */
  getRecord(id: number): Promise<IDataRecord | null>

  /** Получить все записи */
  getAllRecords(): Promise<IDataRecord[]>

  /** Подписаться на события изменений */
  onDataChange(listener: (event: DataChangeEvent) => void): void
}

/**
 * ChangeLog - журнал всех изменений
 */
export interface IChangeLog {
  /** Добавить событие в журнал */
  append(event: DataChangeEvent): Promise<void>

  /** Получить события начиная с указанного ID */
  getEventsFrom(fromEventId: number): Promise<DataChangeEvent[]>

  /** Получить последние N событий */
  getRecentEvents(count: number): Promise<DataChangeEvent[]>

  /** Получить общее количество событий */
  getEventCount(): Promise<number>

  /** Подписаться на новые события */
  onNewEvent(listener: (event: DataChangeEvent) => void): void
}

/**
 * Состояние файловой структуры для одной записи
 */
export interface IFileSystemState {
  /** ID записи */
  recordId: number

  /** Путь к основной папке */
  mainFolderPath: string

  /** Путь к подпапке (если flag = true) */
  subFolderPath?: string

  /** Путь к файлу readme */
  readmePath: string

  /** Существует ли структура на диске */
  exists: boolean

  /** Время последней синхронизации */
  lastSyncAt: Date
}

/**
 * Синхронизатор файловой системы
 */
export interface IFileSystemSync {
  /** Обработать событие изменения данных */
  processEvent(event: DataChangeEvent): Promise<void>

  /** Создать файловую структуру для записи */
  createStructure(record: IDataRecord): Promise<IFileSystemState>

  /** Удалить файловую структуру записи */
  removeStructure(recordId: number): Promise<boolean>

  /** Обновить файловую структуру */
  updateStructure(recordId: number, newData: Partial<IDataRecord>): Promise<IFileSystemState>

  /** Получить текущее состояние файловой структуры */
  getFileSystemState(recordId: number): Promise<IFileSystemState | null>

  /** Синхронизировать все записи с файловой системой */
  syncAll(): Promise<IFileSystemState[]>
}

/**
 * Конфигурация системы синхронизации
 */
export interface ISyncSystemConfig {
  /** Базовый путь для создания папок */
  basePath: string

  /** Максимальное количество событий в памяти */
  maxEventsInMemory: number

  /** Интервал проверки новых событий (мс) */
  syncIntervalMs: number

  /** Включить детальное логирование */
  enableDetailedLogging: boolean

  /** Путь для логов синхронизации */
  logPath?: string
}

/**
 * Результат операции синхронизации
 */
export interface ISyncResult {
  /** Успешность операции */
  success: boolean

  /** Количество обработанных событий */
  eventsProcessed: number

  /** Количество ошибок */
  errorsCount: number

  /** Время выполнения (мс) */
  executionTimeMs: number

  /** Детали операции */
  details: string[]

  /** Ошибки, если были */
  errors?: Error[]
}

