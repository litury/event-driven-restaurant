/**
 * Реализация журнала событий кухни
 * ДЗ-3: Событийная синхронизация ресторанных зон
 */

import {
  IKitchenChangeLog,
  RestaurantChangeEvent,
  RestaurantEventType
} from '../interfaces/IRestaurantSyncModel'

/**
 * Конкретная реализация журнала событий кухни
 * Реализует паттерн Event Sourcing для сохранения всех изменений
 */
export class KitchenChangeLog implements IKitchenChangeLog {
  private p_events: RestaurantChangeEvent[] = []
  private p_eventListeners: Array<(event: RestaurantChangeEvent) => void> = []
  private p_nextEventId = 1
  private p_maxEventsInMemory: number

  constructor(maxEventsInMemory: number = 1000) {
    this.p_maxEventsInMemory = maxEventsInMemory
  }

  /**
   * Добавить событие в журнал
   */
  async append(event: RestaurantChangeEvent): Promise<void> {
    // Присваиваем уникальный ID если его нет
    if (!event.eventId) {
      event.eventId = this.p_nextEventId++
    } else {
      // Обновляем счётчик если ID больше текущего
      this.p_nextEventId = Math.max(this.p_nextEventId, event.eventId + 1)
    }

    // Добавляем событие в журнал
    this.p_events.push({ ...event }) // Копия для immutability

    // Ограничиваем размер журнала в памяти
    if (this.p_events.length > this.p_maxEventsInMemory) {
      this.p_events.shift() // Удаляем самое старое событие
    }

    // Уведомляем слушателей асинхронно
    this.p_notifyListeners(event)
  }

  /**
   * Получить события начиная с указанного ID
   */
  async getEventsFrom(fromEventId: number): Promise<RestaurantChangeEvent[]> {
    return this.p_events
      .filter(event => event.eventId >= fromEventId)
      .map(event => ({ ...event })) // Копии для immutability
  }

  /**
   * Получить последние N событий
   */
  async getRecentEvents(count: number): Promise<RestaurantChangeEvent[]> {
    const startIndex = Math.max(0, this.p_events.length - count)
    return this.p_events
      .slice(startIndex)
      .map(event => ({ ...event }))
  }

  /**
   * Получить события по типу
   */
  async getEventsByType(type: RestaurantEventType): Promise<RestaurantChangeEvent[]> {
    return this.p_events
      .filter(event => event.type === type)
      .map(event => ({ ...event }))
  }

  /**
   * Получить общее количество событий
   */
  async getEventCount(): Promise<number> {
    return this.p_events.length
  }

  /**
   * Подписаться на новые события
   */
  onNewEvent(listener: (event: RestaurantChangeEvent) => void): void {
    this.p_eventListeners.push(listener)
  }

  /**
   * Отписаться от событий (дополнительный метод)
   */
  offNewEvent(listener: (event: RestaurantChangeEvent) => void): void {
    const index = this.p_eventListeners.indexOf(listener)
    if (index >= 0) {
      this.p_eventListeners.splice(index, 1)
    }
  }

  /**
   * Очистить старые события (для оптимизации памяти)
   */
  async cleanup(keepLastN: number): Promise<void> {
    if (this.p_events.length > keepLastN) {
      const eventsToRemove = this.p_events.length - keepLastN
      this.p_events.splice(0, eventsToRemove)
    }
  }

  /**
   * Получить статистику по событиям (дополнительный метод)
   */
  async getEventsStats(): Promise<{
    total: number
    byType: Record<RestaurantEventType, number>
    byInitiator: Record<string, number>
    lastEventTime: Date | null
    eventsPerHour: number
  }> {
    const total = this.p_events.length

    const byType: Record<RestaurantEventType, number> = {
      order_added: 0,
      order_removed: 0,
      order_modified: 0,
      status_changed: 0
    }

    const byInitiator: Record<string, number> = {}
    let lastEventTime: Date | null = null

    if (total > 0) {
      const now = Date.now()
      const firstEventTime = this.p_events[0].timestamp.getTime()
      const hoursElapsed = (now - firstEventTime) / (1000 * 60 * 60)
      const eventsPerHour = hoursElapsed > 0 ? total / hoursElapsed : 0

      for (const event of this.p_events) {
        byType[event.type]++

        const initiator = event.initiator
        byInitiator[initiator] = (byInitiator[initiator] || 0) + 1

        if (!lastEventTime || event.timestamp > lastEventTime) {
          lastEventTime = event.timestamp
        }
      }

      return {
        total,
        byType,
        byInitiator,
        lastEventTime,
        eventsPerHour
      }
    }

    return {
      total: 0,
      byType,
      byInitiator,
      lastEventTime: null,
      eventsPerHour: 0
    }
  }

  /**
   * Получить события за определённый период
   */
  async getEventsByTimeRange(startTime: Date, endTime: Date): Promise<RestaurantChangeEvent[]> {
    return this.p_events
      .filter(event => event.timestamp >= startTime && event.timestamp <= endTime)
      .map(event => ({ ...event }))
  }

  /**
   * Найти события по номеру заказа
   */
  async getEventsByOrderId(orderId: number): Promise<RestaurantChangeEvent[]> {
    return this.p_events
      .filter(event => event.orderId === orderId)
      .map(event => ({ ...event }))
  }

  /**
   * Получить последнее событие для заказа
   */
  async getLastEventForOrder(orderId: number): Promise<RestaurantChangeEvent | null> {
    const orderEvents = this.p_events.filter(event => event.orderId === orderId)

    if (orderEvents.length === 0) {
      return null
    }

    // Возвращаем событие с самым большим eventId (последнее)
    const lastEvent = orderEvents.reduce((latest, current) =>
      current.eventId > latest.eventId ? current : latest
    )

    return { ...lastEvent }
  }

  // ==========================================
  // Приватные вспомогательные методы
  // ==========================================

  /**
   * Уведомить всех слушателей о новом событии
   */
  private p_notifyListeners(event: RestaurantChangeEvent): void {
    // Асинхронно уведомляем слушателей для избежания блокировок
    setTimeout(() => {
      for (const listener of this.p_eventListeners) {
        try {
          listener({ ...event }) // Передаём копию для безопасности
        } catch (error) {
          console.error('Ошибка в обработчике события журнала кухни:', error)
        }
      }
    }, 0)
  }

  /**
   * Очистить все данные (для тестирования)
   */
  clearAll(): void {
    this.p_events.length = 0
    this.p_eventListeners.length = 0
    this.p_nextEventId = 1
  }

  /**
   * Получить все события (для отладки)
   */
  getAllEvents(): RestaurantChangeEvent[] {
    return this.p_events.map(event => ({ ...event }))
  }

  /**
   * Установить максимальный размер журнала в памяти
   */
  setMaxEventsInMemory(maxEvents: number): void {
    this.p_maxEventsInMemory = maxEvents

    // Очищаем лишние события если новый лимит меньше текущего размера
    if (this.p_events.length > maxEvents) {
      const eventsToRemove = this.p_events.length - maxEvents
      this.p_events.splice(0, eventsToRemove)
    }
  }
}


