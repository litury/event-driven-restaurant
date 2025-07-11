/**
 * Интерфейсы для ДЗ-3: Событийная синхронизация ресторанных зон
 * Адаптация под метафору ресторана вместо файловой системы
 */

/**
 * Заказ в ресторане (аналог DataRecord)
 */
export interface IRestaurantOrder {
  /** Уникальный номер заказа */
  orderId: number

  /** VIP статус клиента (аналог булевого флага) */
  isVipCustomer: boolean

  /** Описание блюда (аналог content) */
  dishDescription: string

  /** Номер стола (дополнительное поле) */
  tableNumber?: number

  /** Время создания заказа */
  createdAt: Date

  /** Время последнего изменения */
  updatedAt: Date

  /** Статус заказа */
  status: 'pending' | 'preparing' | 'ready' | 'served'

  /** Приоритет заказа (наследуется из ДЗ-2) */
  priority?: number
}

/**
 * Типы событий изменения заказов
 */
export type RestaurantEventType = 'order_added' | 'order_removed' | 'order_modified' | 'status_changed'

/**
 * Базовое событие изменения в ресторане
 */
export interface IRestaurantEvent {
  /** Уникальный номер события в журнале кухни */
  eventId: number

  /** Тип события */
  type: RestaurantEventType

  /** Время возникновения события */
  timestamp: Date

  /** Номер заказа */
  orderId: number

  /** Кто инициировал событие */
  initiator: 'customer' | 'waiter' | 'chef' | 'system'
}

/**
 * Событие добавления заказа
 */
export interface IOrderAddedEvent extends IRestaurantEvent {
  type: 'order_added'
  /** Новый заказ */
  order: IRestaurantOrder
}

/**
 * Событие удаления заказа
 */
export interface IOrderRemovedEvent extends IRestaurantEvent {
  type: 'order_removed'
  /** Причина удаления */
  reason: 'served' | 'cancelled' | 'expired'
}

/**
 * Событие изменения заказа
 */
export interface IOrderModifiedEvent extends IRestaurantEvent {
  type: 'order_modified'
  /** Какое поле изменилось */
  field: keyof IRestaurantOrder
  /** Старое значение */
  oldValue: any
  /** Новое значение */
  newValue: any
}

/**
 * Событие изменения статуса заказа
 */
export interface IStatusChangedEvent extends IRestaurantEvent {
  type: 'status_changed'
  /** Предыдущий статус */
  previousStatus: IRestaurantOrder['status']
  /** Новый статус */
  newStatus: IRestaurantOrder['status']
}

/**
 * Объединённый тип всех событий ресторана
 */
export type RestaurantChangeEvent = IOrderAddedEvent | IOrderRemovedEvent | IOrderModifiedEvent | IStatusChangedEvent

/**
 * API для управления заказами ресторана (аналог DataAPI)
 */
export interface IRestaurantZoneAPI {
  /** Принять новый заказ */
  addOrder(orderData: Omit<IRestaurantOrder, 'orderId' | 'createdAt' | 'updatedAt'>): Promise<IRestaurantOrder>

  /** Отменить заказ */
  removeOrder(orderId: number, reason: 'served' | 'cancelled' | 'expired'): Promise<boolean>

  /** Изменить поле заказа */
  modifyOrderField<K extends keyof IRestaurantOrder>(
    orderId: number,
    field: K,
    value: IRestaurantOrder[K]
  ): Promise<boolean>

  /** Изменить статус заказа */
  changeOrderStatus(orderId: number, newStatus: IRestaurantOrder['status']): Promise<boolean>

  /** Получить заказ по номеру */
  getOrder(orderId: number): Promise<IRestaurantOrder | null>

  /** Получить все активные заказы */
  getAllOrders(): Promise<IRestaurantOrder[]>

  /** Получить заказы по статусу */
  getOrdersByStatus(status: IRestaurantOrder['status']): Promise<IRestaurantOrder[]>

  /** Получить VIP заказы */
  getVipOrders(): Promise<IRestaurantOrder[]>

  /** Подписаться на события изменений заказов */
  onOrderChange(listener: (event: RestaurantChangeEvent) => void): void
}

/**
 * Журнал событий кухни (аналог ChangeLog)
 */
export interface IKitchenChangeLog {
  /** Добавить событие в журнал */
  append(event: RestaurantChangeEvent): Promise<void>

  /** Получить события начиная с указанного ID */
  getEventsFrom(fromEventId: number): Promise<RestaurantChangeEvent[]>

  /** Получить последние N событий */
  getRecentEvents(count: number): Promise<RestaurantChangeEvent[]>

  /** Получить события по типу */
  getEventsByType(type: RestaurantEventType): Promise<RestaurantChangeEvent[]>

  /** Получить общее количество событий */
  getEventCount(): Promise<number>

  /** Подписаться на новые события */
  onNewEvent(listener: (event: RestaurantChangeEvent) => void): void

  /** Очистить старые события (для оптимизации памяти) */
  cleanup(keepLastN: number): Promise<void>
}

/**
 * Состояние зоны обслуживания (аналог FileSystemState)
 */
export interface IRestaurantZoneState {
  /** Номер заказа */
  orderId: number

  /** Тип зоны */
  zoneType: 'vip' | 'regular' | 'takeaway'

  /** Номер стола */
  tableNumber: number

  /** Расположение в зоне */
  position: {
    x: number
    y: number
    section: string
  }

  /** Назначенный официант */
  assignedWaiter?: string

  /** Статус размещения */
  placementStatus: 'placed' | 'occupied' | 'ready_for_service' | 'cleared' | 'queued'

  /** Время размещения в зоне */
  placedAt: Date

  /** Время последнего обновления */
  lastUpdatedAt: Date

  /** Метаданные заказа */
  metadata: {
    /** Есть ли особые требования к блюду */
    hasSpecialRequests: boolean
    /** Ожидаемое время обслуживания в миллисекундах */
    estimatedServiceTime: number
    /** Фактическое время обслуживания в миллисекундах */
    actualServiceTime?: number
    /** Позиция в очереди (если заказ в очереди) */
    queuePosition?: number
  }
}

/**
 * Синхронизатор зон ресторана (аналог FileSystemSync)
 */
export interface IRestaurantZoneSync {
  /** Обработать событие изменения заказа */
  processOrderEvent(event: RestaurantChangeEvent): Promise<void>

  /** Разместить заказ в соответствующей зоне */
  placeOrderInZone(order: IRestaurantOrder): Promise<IRestaurantZoneState>

  /** Переместить заказ между зонами при изменении VIP статуса */
  moveOrderBetweenZones(orderId: number, newVipStatus: boolean): Promise<IRestaurantZoneState>

  /** Убрать заказ из зоны после обслуживания */
  removeOrderFromZone(orderId: number): Promise<boolean>

  /** Обновить статус зоны */
  updateZoneState(orderId: number, updates: Partial<IRestaurantZoneState>): Promise<IRestaurantZoneState>

  /** Получить текущее состояние зоны для заказа */
  getZoneState(orderId: number): Promise<IRestaurantZoneState | null>

  /** Синхронизировать все заказы с зонами */
  syncAllZones(): Promise<IRestaurantZoneState[]>

  /** Получить состояние всех зон */
  getAllZoneStates(): Promise<IRestaurantZoneState[]>

  /** Получить свободные столы в зоне */
  getAvailableTables(zoneType: 'vip' | 'regular'): Promise<number[]>
}

/**
 * Конфигурация системы синхронизации ресторана
 */
export interface IRestaurantSyncConfig {
  /** Максимальное количество событий в памяти */
  maxEventsInMemory: number

  /** Интервал проверки новых событий (мс) */
  syncIntervalMs: number

  /** Включить детальное логирование */
  enableDetailedLogging: boolean

  /** Настройки зон ресторана */
  zoneSettings: {
    vip: {
      maxTables: number
      tableNumbers: number[]
      specialFeatures: string[]
    }
    regular: {
      maxTables: number
      tableNumbers: number[]
    }
    takeaway: {
      maxOrders: number
      averageWaitTime: number
    }
  }

  /** Автоочистка событий */
  autoCleanup: {
    enabled: boolean
    keepLastN: number
    intervalMs: number
  }
}

/**
 * Результат операции синхронизации ресторана
 */
export interface IRestaurantSyncResult {
  /** Успешность операции */
  success: boolean

  /** Количество обработанных событий */
  eventsProcessed: number

  /** Количество размещённых заказов */
  ordersPlaced: number

  /** Количество перемещений между зонами */
  zoneTransfers: number

  /** Количество ошибок */
  errorsCount: number

  /** Время выполнения (мс) */
  executionTimeMs: number

  /** Детали операции */
  details: string[]

  /** Ошибки, если были */
  errors?: Error[]

  /** Статистика по зонам */
  zoneStats: {
    vip: { occupied: number; available: number }
    regular: { occupied: number; available: number }
    takeaway: { pending: number; ready: number }
  }
}


