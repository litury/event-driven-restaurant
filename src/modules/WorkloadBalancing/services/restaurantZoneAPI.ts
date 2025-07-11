/**
 * Реализация API для управления заказами ресторана
 * ДЗ-3: Событийная синхронизация ресторанных зон
 */

import {
  IRestaurantOrder,
  IRestaurantZoneAPI,
  RestaurantChangeEvent,
  IOrderAddedEvent,
  IOrderRemovedEvent,
  IOrderModifiedEvent,
  IStatusChangedEvent
} from '../interfaces/IRestaurantSyncModel'

/**
 * Конкретная реализация API для управления заказами ресторана
 * Реализует паттерн Observer для уведомления о событиях
 */
export class RestaurantZoneAPI implements IRestaurantZoneAPI {
  private p_orders = new Map<number, IRestaurantOrder>()
  private p_eventListeners: Array<(event: RestaurantChangeEvent) => void> = []
  private p_nextOrderId = 1
  private p_nextEventId = 1

  /**
   * Принять новый заказ
   */
  async addOrder(orderData: Omit<IRestaurantOrder, 'orderId' | 'createdAt' | 'updatedAt'>): Promise<IRestaurantOrder> {
    const now = new Date()

    const order: IRestaurantOrder = {
      orderId: this.p_nextOrderId++,
      ...orderData,
      createdAt: now,
      updatedAt: now
    }

    // Сохраняем заказ
    this.p_orders.set(order.orderId, order)

    // Генерируем событие добавления
    const event: IOrderAddedEvent = {
      eventId: this.p_nextEventId++,
      type: 'order_added',
      timestamp: now,
      orderId: order.orderId,
      initiator: 'customer',
      order: { ...order } // Копия для immutability
    }

    // Уведомляем слушателей
    this.p_notifyListeners(event)

    return order
  }

  /**
   * Отменить заказ
   */
  async removeOrder(orderId: number, reason: 'served' | 'cancelled' | 'expired'): Promise<boolean> {
    if (!this.p_orders.has(orderId)) {
      return false
    }

    // Удаляем заказ
    this.p_orders.delete(orderId)

    // Генерируем событие удаления
    const event: IOrderRemovedEvent = {
      eventId: this.p_nextEventId++,
      type: 'order_removed',
      timestamp: new Date(),
      orderId,
      initiator: this.p_getInitiatorByReason(reason),
      reason
    }

    // Уведомляем слушателей
    this.p_notifyListeners(event)

    return true
  }

  /**
   * Изменить поле заказа
   */
  async modifyOrderField<K extends keyof IRestaurantOrder>(
    orderId: number,
    field: K,
    value: IRestaurantOrder[K]
  ): Promise<boolean> {
    const order = this.p_orders.get(orderId)
    if (!order) {
      return false
    }

    // Сохраняем старое значение для события
    const oldValue = order[field]

    // Обновляем поле
    order[field] = value
    order.updatedAt = new Date()

    // Генерируем событие изменения
    const event: IOrderModifiedEvent = {
      eventId: this.p_nextEventId++,
      type: 'order_modified',
      timestamp: order.updatedAt,
      orderId,
      initiator: 'waiter',
      field,
      oldValue,
      newValue: value
    }

    // Уведомляем слушателей
    this.p_notifyListeners(event)

    return true
  }

  /**
   * Изменить статус заказа
   */
  async changeOrderStatus(orderId: number, newStatus: IRestaurantOrder['status']): Promise<boolean> {
    const order = this.p_orders.get(orderId)
    if (!order) {
      return false
    }

    const previousStatus = order.status

    // Обновляем статус
    order.status = newStatus
    order.updatedAt = new Date()

    // Генерируем событие изменения статуса
    const event: IStatusChangedEvent = {
      eventId: this.p_nextEventId++,
      type: 'status_changed',
      timestamp: order.updatedAt,
      orderId,
      initiator: this.p_getInitiatorByStatus(newStatus),
      previousStatus,
      newStatus
    }

    // Уведомляем слушателей
    this.p_notifyListeners(event)

    return true
  }

  /**
   * Получить заказ по номеру
   */
  async getOrder(orderId: number): Promise<IRestaurantOrder | null> {
    const order = this.p_orders.get(orderId)
    return order ? { ...order } : null // Возвращаем копию для immutability
  }

  /**
   * Получить все активные заказы
   */
  async getAllOrders(): Promise<IRestaurantOrder[]> {
    return Array.from(this.p_orders.values()).map(order => ({ ...order }))
  }

  /**
   * Получить заказы по статусу
   */
  async getOrdersByStatus(status: IRestaurantOrder['status']): Promise<IRestaurantOrder[]> {
    return Array.from(this.p_orders.values())
      .filter(order => order.status === status)
      .map(order => ({ ...order }))
  }

  /**
   * Получить VIP заказы
   */
  async getVipOrders(): Promise<IRestaurantOrder[]> {
    return Array.from(this.p_orders.values())
      .filter(order => order.isVipCustomer)
      .map(order => ({ ...order }))
  }

  /**
   * Подписаться на события изменений заказов
   */
  onOrderChange(listener: (event: RestaurantChangeEvent) => void): void {
    this.p_eventListeners.push(listener)
  }

  /**
   * Отписаться от событий (дополнительный метод для очистки)
   */
  offOrderChange(listener: (event: RestaurantChangeEvent) => void): void {
    const index = this.p_eventListeners.indexOf(listener)
    if (index >= 0) {
      this.p_eventListeners.splice(index, 1)
    }
  }

  /**
   * Получить статистику по заказам (дополнительный метод)
   */
  async getOrdersStats(): Promise<{
    total: number
    byStatus: Record<IRestaurantOrder['status'], number>
    vipCount: number
    averageProcessingTime: number
  }> {
    const orders = Array.from(this.p_orders.values())
    const now = Date.now()

    const byStatus = {
      pending: 0,
      preparing: 0,
      ready: 0,
      served: 0
    }

    let vipCount = 0
    let totalProcessingTime = 0

    for (const order of orders) {
      byStatus[order.status]++

      if (order.isVipCustomer) {
        vipCount++
      }

      if (order.status !== 'pending') {
        totalProcessingTime += now - order.createdAt.getTime()
      }
    }

    const processedOrders = orders.length - byStatus.pending
    const averageProcessingTime = processedOrders > 0
      ? totalProcessingTime / processedOrders
      : 0

    return {
      total: orders.length,
      byStatus,
      vipCount,
      averageProcessingTime
    }
  }

  // ==========================================
  // Приватные вспомогательные методы
  // ==========================================

  /**
   * Уведомить всех слушателей о событии
   */
  private p_notifyListeners(event: RestaurantChangeEvent): void {
    // Асинхронно уведомляем слушателей для избежания блокировок
    setTimeout(() => {
      for (const listener of this.p_eventListeners) {
        try {
          listener(event)
        } catch (error) {
          console.error('Ошибка в обработчике события ресторана:', error)
        }
      }
    }, 0)
  }

  /**
   * Определить инициатора по причине удаления
   */
  private p_getInitiatorByReason(reason: 'served' | 'cancelled' | 'expired'): 'customer' | 'waiter' | 'chef' | 'system' {
    switch (reason) {
      case 'served':
        return 'waiter'
      case 'cancelled':
        return 'customer'
      case 'expired':
        return 'system'
      default:
        return 'system'
    }
  }

  /**
   * Определить инициатора по статусу заказа
   */
  private p_getInitiatorByStatus(status: IRestaurantOrder['status']): 'customer' | 'waiter' | 'chef' | 'system' {
    switch (status) {
      case 'pending':
        return 'customer'
      case 'preparing':
        return 'chef'
      case 'ready':
        return 'chef'
      case 'served':
        return 'waiter'
      default:
        return 'system'
    }
  }

  /**
   * Очистить все данные (для тестирования)
   */
  clearAll(): void {
    this.p_orders.clear()
    this.p_eventListeners.length = 0
    this.p_nextOrderId = 1
    this.p_nextEventId = 1
  }
}


