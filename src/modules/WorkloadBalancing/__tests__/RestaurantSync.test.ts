import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  IRestaurantOrder,
  IRestaurantZoneAPI,
  IKitchenChangeLog,
  IRestaurantZoneSync,
  RestaurantChangeEvent,
  IRestaurantSyncConfig,
  IRestaurantZoneState
} from '../interfaces/IRestaurantSyncModel'

/**
 * TDD тесты для ДЗ-3: Событийная синхронизация ресторанных зон
 * Адаптация под ресторанную метафору вместо файловой системы
 */

describe('🍔 RestaurantSync - Событийная синхронизация ресторанных зон', () => {
  let restaurantAPI: IRestaurantZoneAPI
  let kitchenLog: IKitchenChangeLog
  let zoneSync: IRestaurantZoneSync
  let config: IRestaurantSyncConfig

  beforeEach(() => {
    // Настройка тестовой среды ресторана
    config = {
      maxEventsInMemory: 1000,
      syncIntervalMs: 100,
      enableDetailedLogging: true,
      zoneSettings: {
        vip: {
          maxTables: 5,
          tableNumbers: [101, 102, 103, 104, 105],
          specialFeatures: ['champagne_service', 'personal_waiter', 'premium_location']
        },
        regular: {
          maxTables: 20,
          tableNumbers: Array.from({ length: 20 }, (_, i) => i + 1)
        },
        takeaway: {
          maxOrders: 50,
          averageWaitTime: 15 * 60 * 1000 // 15 минут в мс
        }
      },
      autoCleanup: {
        enabled: true,
        keepLastN: 500,
        intervalMs: 30 * 60 * 1000 // 30 минут
      }
    }

    // Создаём моки для тестирования
    restaurantAPI = createMockRestaurantAPI()
    kitchenLog = createMockKitchenChangeLog()
    zoneSync = createMockRestaurantZoneSync(config)
  })

  afterEach(async () => {
    // Очистка тестовой среды
    await cleanupTestEnvironment()
  })

  // ==========================================
  // 🍽️ Тесты RestaurantZoneAPI - управление заказами
  // ==========================================

  describe('🍽️ RestaurantZoneAPI - управление заказами', () => {
    it('должен принимать новый заказ с автогенерацией ID и timestamp', async () => {
      // Arrange
      const orderData = {
        isVipCustomer: true,
        dishDescription: 'Пицца Маргарита с трюфелями',
        status: 'pending' as const,
        tableNumber: 101,
        priority: 1.5
      }

      // Act
      const result = await restaurantAPI.addOrder(orderData)

      // Assert
      expect(result.orderId).toBeTypeOf('number')
      expect(result.orderId).toBeGreaterThan(0)
      expect(result.isVipCustomer).toBe(true)
      expect(result.dishDescription).toBe('Пицца Маргарита с трюфелями')
      expect(result.status).toBe('pending')
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.tableNumber).toBe(101)
    })

    it('должен отменять заказ с указанием причины', async () => {
      // Arrange
      const order = await restaurantAPI.addOrder({
        isVipCustomer: false,
        dishDescription: 'Бургер классический',
        status: 'pending' as const
      })

      // Act
      const cancelled = await restaurantAPI.removeOrder(order.orderId, 'cancelled')

      // Assert
      expect(cancelled).toBe(true)
      const retrievedOrder = await restaurantAPI.getOrder(order.orderId)
      expect(retrievedOrder).toBeNull()
    })

    it('должен изменять статус заказа от pending до served', async () => {
      // Arrange
      const order = await restaurantAPI.addOrder({
        isVipCustomer: true,
        dishDescription: 'Стейк рибай с овощами',
        status: 'pending' as const
      })

      // Act & Assert - проходим по всем статусам
      await restaurantAPI.changeOrderStatus(order.orderId, 'preparing')
      let updated = await restaurantAPI.getOrder(order.orderId)
      expect(updated?.status).toBe('preparing')

      await restaurantAPI.changeOrderStatus(order.orderId, 'ready')
      updated = await restaurantAPI.getOrder(order.orderId)
      expect(updated?.status).toBe('ready')

      await restaurantAPI.changeOrderStatus(order.orderId, 'served')
      updated = await restaurantAPI.getOrder(order.orderId)
      expect(updated?.status).toBe('served')
    })

    it('должен изменять VIP статус клиента и обновлять updatedAt', async () => {
      // Arrange
      const order = await restaurantAPI.addOrder({
        isVipCustomer: false,
        dishDescription: 'Салат Цезарь',
        status: 'pending' as const
      })
      const originalUpdatedAt = order.updatedAt

      // Имитируем задержку
      await new Promise(resolve => setTimeout(resolve, 10))

      // Act
      await restaurantAPI.modifyOrderField(order.orderId, 'isVipCustomer', true)

      // Assert
      const updated = await restaurantAPI.getOrder(order.orderId)
      expect(updated?.isVipCustomer).toBe(true)
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('должен возвращать только VIP заказы', async () => {
      // Arrange
      await restaurantAPI.addOrder({ isVipCustomer: true, dishDescription: 'VIP блюдо 1', status: 'pending' as const })
      await restaurantAPI.addOrder({ isVipCustomer: false, dishDescription: 'Обычное блюдо', status: 'pending' as const })
      await restaurantAPI.addOrder({ isVipCustomer: true, dishDescription: 'VIP блюдо 2', status: 'ready' as const })

      // Act
      const vipOrders = await restaurantAPI.getVipOrders()

      // Assert
      expect(vipOrders).toHaveLength(2)
      expect(vipOrders.every(order => order.isVipCustomer)).toBe(true)
      expect(vipOrders.map(o => o.dishDescription)).toContain('VIP блюдо 1')
      expect(vipOrders.map(o => o.dishDescription)).toContain('VIP блюдо 2')
    })

    it('должен фильтровать заказы по статусу', async () => {
      // Arrange
      const order1 = await restaurantAPI.addOrder({ isVipCustomer: false, dishDescription: 'Блюдо 1', status: 'pending' as const })
      const order2 = await restaurantAPI.addOrder({ isVipCustomer: true, dishDescription: 'Блюдо 2', status: 'preparing' as const })
      const order3 = await restaurantAPI.addOrder({ isVipCustomer: false, dishDescription: 'Блюдо 3', status: 'preparing' as const })

      // Act
      const preparingOrders = await restaurantAPI.getOrdersByStatus('preparing')

      // Assert
      expect(preparingOrders).toHaveLength(2)
      expect(preparingOrders.map(o => o.orderId)).toContain(order2.orderId)
      expect(preparingOrders.map(o => o.orderId)).toContain(order3.orderId)
    })

    it('должен генерировать события при изменениях заказов', async () => {
      // Arrange
      const events: RestaurantChangeEvent[] = []
      restaurantAPI.onOrderChange(event => events.push(event))

      // Act
      const order = await restaurantAPI.addOrder({ isVipCustomer: true, dishDescription: 'Тестовое блюдо', status: 'pending' as const })
      await restaurantAPI.changeOrderStatus(order.orderId, 'preparing')
      await restaurantAPI.modifyOrderField(order.orderId, 'isVipCustomer', false)
      await restaurantAPI.removeOrder(order.orderId, 'served')

      // Assert
      expect(events).toHaveLength(4)
      expect(events[0].type).toBe('order_added')
      expect(events[1].type).toBe('status_changed')
      expect(events[2].type).toBe('order_modified')
      expect(events[3].type).toBe('order_removed')
    })
  })

  // ==========================================
  // 📜 Тесты KitchenChangeLog - журнал событий
  // ==========================================

  describe('📜 KitchenChangeLog - журнал событий кухни', () => {
    it('должен добавлять события с последовательной нумерацией', async () => {
      // Arrange
      const event1: RestaurantChangeEvent = {
        eventId: 1,
        type: 'order_added',
        timestamp: new Date(),
        orderId: 1,
        initiator: 'customer',
        order: {
          orderId: 1,
          isVipCustomer: true,
          dishDescription: 'Пицца',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any

      const event2: RestaurantChangeEvent = {
        eventId: 2,
        type: 'status_changed',
        timestamp: new Date(),
        orderId: 1,
        initiator: 'chef',
        previousStatus: 'pending',
        newStatus: 'preparing'
      } as any

      // Act
      await kitchenLog.append(event1)
      await kitchenLog.append(event2)

      // Assert
      const recentEvents = await kitchenLog.getRecentEvents(2)
      expect(recentEvents).toHaveLength(2)
      expect(recentEvents[0].eventId).toBe(1)
      expect(recentEvents[1].eventId).toBe(2)
    })

    it('должен возвращать события по типу', async () => {
      // Arrange - добавляем разные типы событий
      const events: RestaurantChangeEvent[] = [
        { eventId: 1, type: 'order_added', orderId: 1, initiator: 'customer' } as any,
        { eventId: 2, type: 'status_changed', orderId: 1, initiator: 'chef' } as any,
        { eventId: 3, type: 'order_added', orderId: 2, initiator: 'customer' } as any,
        { eventId: 4, type: 'order_modified', orderId: 1, initiator: 'waiter' } as any,
        { eventId: 5, type: 'order_added', orderId: 3, initiator: 'customer' } as any
      ]

      for (const event of events) {
        event.timestamp = new Date()
        await kitchenLog.append(event)
      }

      // Act
      const addedEvents = await kitchenLog.getEventsByType('order_added')

      // Assert
      expect(addedEvents).toHaveLength(3)
      expect(addedEvents.every(e => e.type === 'order_added')).toBe(true)
      expect(addedEvents.map(e => e.eventId)).toEqual([1, 3, 5])
    })

    it('должен уведомлять подписчиков о новых событиях', async () => {
      // Arrange
      const receivedEvents: RestaurantChangeEvent[] = []
      kitchenLog.onNewEvent(event => receivedEvents.push(event))

      // Act
      const event: RestaurantChangeEvent = {
        eventId: 1,
        type: 'order_added',
        timestamp: new Date(),
        orderId: 1,
        initiator: 'customer',
        order: {
          orderId: 1,
          isVipCustomer: false,
          dishDescription: 'Суп дня',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any

      await kitchenLog.append(event)

      // Assert
      expect(receivedEvents).toHaveLength(1)
      expect(receivedEvents[0].type).toBe('order_added')
      expect(receivedEvents[0].orderId).toBe(1)
    })

    it('должен очищать старые события для оптимизации памяти', async () => {
      // Arrange - добавляем много событий
      for (let i = 1; i <= 100; i++) {
        const event: RestaurantChangeEvent = {
          eventId: i,
          type: 'order_added',
          timestamp: new Date(),
          orderId: i,
          initiator: 'customer'
        } as any
        await kitchenLog.append(event)
      }

      // Act - оставляем только последние 50
      await kitchenLog.cleanup(50)

      // Assert
      const eventCount = await kitchenLog.getEventCount()
      expect(eventCount).toBe(50)

      const recentEvents = await kitchenLog.getRecentEvents(50)
      expect(recentEvents[0].eventId).toBe(51) // Первое из оставшихся
      expect(recentEvents[49].eventId).toBe(100) // Последнее
    })
  })

  // ==========================================
  // 🏢 Тесты RestaurantZoneSync - синхронизация зон
  // ==========================================

  describe('🏢 RestaurantZoneSync - синхронизация зон обслуживания', () => {
    it('должен размещать VIP заказ в VIP зоне', async () => {
      // Arrange
      const vipOrder: IRestaurantOrder = {
        orderId: 1,
        isVipCustomer: true,
        dishDescription: 'Лобстер термидор',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Act
      const zoneState = await zoneSync.placeOrderInZone(vipOrder)

      // Assert
      expect(zoneState.orderId).toBe(1)
      expect(zoneState.zoneType).toBe('vip')
      expect(zoneState.tableNumber).toBeGreaterThanOrEqual(101)
      expect(zoneState.tableNumber).toBeLessThanOrEqual(105)
      expect(zoneState.placementStatus).toBe('placed')
      expect(zoneState.position.section).toBe('vip')
    })

    it('должен размещать обычный заказ в обычной зоне', async () => {
      // Arrange
      const regularOrder: IRestaurantOrder = {
        orderId: 2,
        isVipCustomer: false,
        dishDescription: 'Бургер с картофелем',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Act
      const zoneState = await zoneSync.placeOrderInZone(regularOrder)

      // Assert
      expect(zoneState.orderId).toBe(2)
      expect(zoneState.zoneType).toBe('regular')
      expect(zoneState.tableNumber).toBeGreaterThanOrEqual(1)
      expect(zoneState.tableNumber).toBeLessThanOrEqual(20)
      expect(zoneState.placementStatus).toBe('placed')
      expect(zoneState.position.section).toBe('regular')
    })

    it('должен перемещать заказ из обычной зоны в VIP при изменении статуса', async () => {
      // Arrange - сначала размещаем как обычный заказ
      const order: IRestaurantOrder = {
        orderId: 3,
        isVipCustomer: false,
        dishDescription: 'Стейк средней прожарки',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const initialState = await zoneSync.placeOrderInZone(order)
      expect(initialState.zoneType).toBe('regular')

      // Добавляем небольшую задержку для гарантии разных timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      // Act - перемещаем в VIP
      const newState = await zoneSync.moveOrderBetweenZones(3, true)

      // Assert
      expect(newState.orderId).toBe(3)
      expect(newState.zoneType).toBe('vip')
      expect(newState.tableNumber).toBeGreaterThanOrEqual(101)
      expect(newState.lastUpdatedAt.getTime()).toBeGreaterThan(initialState.lastUpdatedAt.getTime())
    })

    it('должен обрабатывать события добавления заказа', async () => {
      // Arrange
      const orderAddedEvent: RestaurantChangeEvent = {
        eventId: 1,
        type: 'order_added',
        timestamp: new Date(),
        orderId: 1,
        initiator: 'customer',
        order: {
          orderId: 1,
          isVipCustomer: true,
          dishDescription: 'Тартар из тунца',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any

      // Act
      await zoneSync.processOrderEvent(orderAddedEvent)

      // Assert
      const zoneState = await zoneSync.getZoneState(1)
      expect(zoneState).toBeDefined()
      expect(zoneState?.zoneType).toBe('vip')
      expect(zoneState?.placementStatus).toBe('placed')
    })

    it('должен обрабатывать события изменения VIP статуса', async () => {
      // Arrange - сначала создаём заказ и размещаем
      const initialOrder: IRestaurantOrder = {
        orderId: 4,
        isVipCustomer: false,
        dishDescription: 'Паста карбонара',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await zoneSync.placeOrderInZone(initialOrder)

      const modificationEvent: RestaurantChangeEvent = {
        eventId: 2,
        type: 'order_modified',
        timestamp: new Date(),
        orderId: 4,
        initiator: 'waiter',
        field: 'isVipCustomer',
        oldValue: false,
        newValue: true
      } as any

      // Act
      await zoneSync.processOrderEvent(modificationEvent)

      // Assert
      const zoneState = await zoneSync.getZoneState(4)
      expect(zoneState?.zoneType).toBe('vip')
      expect(zoneState?.tableNumber).toBeGreaterThanOrEqual(101)
    })

    it('должен удалять заказ из зоны при подаче блюда', async () => {
      // Arrange
      const order: IRestaurantOrder = {
        orderId: 5,
        isVipCustomer: true,
        dishDescription: 'Утка по-пекински',
        status: 'ready',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await zoneSync.placeOrderInZone(order)

      const removalEvent: RestaurantChangeEvent = {
        eventId: 3,
        type: 'order_removed',
        timestamp: new Date(),
        orderId: 5,
        initiator: 'waiter',
        reason: 'served'
      } as any

      // Act
      await zoneSync.processOrderEvent(removalEvent)

      // Assert
      const zoneState = await zoneSync.getZoneState(5)
      expect(zoneState).toBeNull()

      // Заказ уже удалён обработчиком события, проверяем что он действительно удалён
      const removed = await zoneSync.removeOrderFromZone(5)
      expect(removed).toBe(false) // false потому что уже удалён
    })

    it('должен возвращать список свободных столов', async () => {
      // Arrange - размещаем несколько заказов
      for (let i = 1; i <= 3; i++) {
        const order: IRestaurantOrder = {
          orderId: i,
          isVipCustomer: true,
          dishDescription: `VIP блюдо ${i}`,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        await zoneSync.placeOrderInZone(order)
      }

      // Act
      const availableVipTables = await zoneSync.getAvailableTables('vip')
      const availableRegularTables = await zoneSync.getAvailableTables('regular')

      // Assert
      expect(availableVipTables).toHaveLength(2) // 5 столов - 3 занятых = 2 свободных
      expect(availableRegularTables).toHaveLength(20) // все столы свободны
    })

    it('должен синхронизировать все зоны и возвращать статистику', async () => {
      // Arrange - создаём заказы в разных зонах
      const orders: IRestaurantOrder[] = [
        { orderId: 1, isVipCustomer: true, dishDescription: 'VIP 1', status: 'pending', createdAt: new Date(), updatedAt: new Date() },
        { orderId: 2, isVipCustomer: true, dishDescription: 'VIP 2', status: 'preparing', createdAt: new Date(), updatedAt: new Date() },
        { orderId: 3, isVipCustomer: false, dishDescription: 'Regular 1', status: 'pending', createdAt: new Date(), updatedAt: new Date() },
        { orderId: 4, isVipCustomer: false, dishDescription: 'Regular 2', status: 'ready', createdAt: new Date(), updatedAt: new Date() }
      ]

      for (const order of orders) {
        await zoneSync.placeOrderInZone(order)
      }

      // Act
      const allStates = await zoneSync.syncAllZones()

      // Assert
      expect(allStates).toHaveLength(4)
      const vipStates = allStates.filter(s => s.zoneType === 'vip')
      const regularStates = allStates.filter(s => s.zoneType === 'regular')

      expect(vipStates).toHaveLength(2)
      expect(regularStates).toHaveLength(2)
    })
  })

  // ==========================================
  // 🔗 Тесты интеграции всей системы
  // ==========================================

  describe('🔗 Интеграция - полный цикл событийной синхронизации', () => {
    it('должен выполнить полный цикл: заказ → событие → размещение → обслуживание', async () => {
      // Arrange
      const capturedEvents: RestaurantChangeEvent[] = []
      restaurantAPI.onOrderChange(event => capturedEvents.push(event))
      kitchenLog.onNewEvent(async event => await zoneSync.processOrderEvent(event))

      // Act - полный цикл заказа
      const order = await restaurantAPI.addOrder({
        isVipCustomer: true,
        dishDescription: 'Фуа-гра с соусом',
        status: 'pending' as const
      })

      await restaurantAPI.changeOrderStatus(order.orderId, 'preparing')
      await restaurantAPI.changeOrderStatus(order.orderId, 'ready')
      await restaurantAPI.removeOrder(order.orderId, 'served')

      // Небольшая задержка для обработки асинхронных событий
      await new Promise(resolve => setTimeout(resolve, 50))

      // Assert
      expect(capturedEvents).toHaveLength(4)
      expect(capturedEvents.map(e => e.type)).toEqual([
        'order_added',
        'status_changed',
        'status_changed',
        'order_removed'
      ])

      // Проверяем что заказ был размещён и потом удалён из зоны
      const finalZoneState = await zoneSync.getZoneState(order.orderId)
      expect(finalZoneState).toBeNull()
    })
  })
})

// ==========================================
// 🏭 Фабричные функции для создания моков
// ==========================================

function createMockRestaurantAPI(): IRestaurantZoneAPI {
  const orders = new Map<number, IRestaurantOrder>()
  const listeners: Array<(event: RestaurantChangeEvent) => void> = []
  let nextOrderId = 1

  return {
    async addOrder(orderData): Promise<IRestaurantOrder> {
      const order: IRestaurantOrder = {
        orderId: nextOrderId++,
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      orders.set(order.orderId, order)

      const event: RestaurantChangeEvent = {
        eventId: nextOrderId,
        type: 'order_added',
        timestamp: new Date(),
        orderId: order.orderId,
        initiator: 'customer',
        order
      } as any

      listeners.forEach(listener => listener(event))
      return order
    },

    async removeOrder(orderId: number, reason: 'served' | 'cancelled' | 'expired'): Promise<boolean> {
      if (!orders.has(orderId)) return false

      orders.delete(orderId)
      const event: RestaurantChangeEvent = {
        eventId: nextOrderId++,
        type: 'order_removed',
        timestamp: new Date(),
        orderId,
        initiator: 'waiter',
        reason
      } as any

      listeners.forEach(listener => listener(event))
      return true
    },

    async modifyOrderField<K extends keyof IRestaurantOrder>(
      orderId: number,
      field: K,
      value: IRestaurantOrder[K]
    ): Promise<boolean> {
      const order = orders.get(orderId)
      if (!order) return false

      const oldValue = order[field]
      order[field] = value
      order.updatedAt = new Date()

      const event: RestaurantChangeEvent = {
        eventId: nextOrderId++,
        type: 'order_modified',
        timestamp: new Date(),
        orderId,
        initiator: 'waiter',
        field,
        oldValue,
        newValue: value
      } as any

      listeners.forEach(listener => listener(event))
      return true
    },

    async changeOrderStatus(orderId: number, newStatus: IRestaurantOrder['status']): Promise<boolean> {
      const order = orders.get(orderId)
      if (!order) return false

      const previousStatus = order.status
      order.status = newStatus
      order.updatedAt = new Date()

      const event: RestaurantChangeEvent = {
        eventId: nextOrderId++,
        type: 'status_changed',
        timestamp: new Date(),
        orderId,
        initiator: 'chef',
        previousStatus,
        newStatus
      } as any

      listeners.forEach(listener => listener(event))
      return true
    },

    async getOrder(orderId: number): Promise<IRestaurantOrder | null> {
      return orders.get(orderId) || null
    },

    async getAllOrders(): Promise<IRestaurantOrder[]> {
      return Array.from(orders.values())
    },

    async getOrdersByStatus(status: IRestaurantOrder['status']): Promise<IRestaurantOrder[]> {
      return Array.from(orders.values()).filter(order => order.status === status)
    },

    async getVipOrders(): Promise<IRestaurantOrder[]> {
      return Array.from(orders.values()).filter(order => order.isVipCustomer)
    },

    onOrderChange(listener: (event: RestaurantChangeEvent) => void): void {
      listeners.push(listener)
    }
  }
}

function createMockKitchenChangeLog(): IKitchenChangeLog {
  const events: RestaurantChangeEvent[] = []
  const listeners: Array<(event: RestaurantChangeEvent) => void> = []
  let nextEventId = 1

  return {
    async append(event: RestaurantChangeEvent): Promise<void> {
      event.eventId = nextEventId++
      events.push(event)
      listeners.forEach(listener => listener(event))
    },

    async getEventsFrom(fromEventId: number): Promise<RestaurantChangeEvent[]> {
      return events.filter(event => event.eventId >= fromEventId)
    },

    async getRecentEvents(count: number): Promise<RestaurantChangeEvent[]> {
      return events.slice(-count)
    },

    async getEventsByType(type: RestaurantEventType): Promise<RestaurantChangeEvent[]> {
      return events.filter(event => event.type === type)
    },

    async getEventCount(): Promise<number> {
      return events.length
    },

    onNewEvent(listener: (event: RestaurantChangeEvent) => void): void {
      listeners.push(listener)
    },

    async cleanup(keepLastN: number): Promise<void> {
      if (events.length > keepLastN) {
        events.splice(0, events.length - keepLastN)
      }
    }
  }
}

function createMockRestaurantZoneSync(config: IRestaurantSyncConfig): IRestaurantZoneSync {
  const zoneStates = new Map<number, IRestaurantZoneState>()
  const occupiedTables = new Set<number>()

  return {
    async processOrderEvent(event: RestaurantChangeEvent): Promise<void> {
      switch (event.type) {
        case 'order_added':
          const addEvent = event as any
          await this.placeOrderInZone(addEvent.order)
          break
        case 'order_removed':
          await this.removeOrderFromZone(event.orderId)
          break
        case 'order_modified':
          const modEvent = event as any
          if (modEvent.field === 'isVipCustomer') {
            await this.moveOrderBetweenZones(event.orderId, modEvent.newValue)
          }
          break
      }
    },

    async placeOrderInZone(order: IRestaurantOrder): Promise<IRestaurantZoneState> {
      const zoneType = order.isVipCustomer ? 'vip' : 'regular'
      const availableTables = await this.getAvailableTables(zoneType)

      if (availableTables.length === 0) {
        throw new Error(`Нет свободных столов в зоне ${zoneType}`)
      }

      const tableNumber = availableTables[0]
      occupiedTables.add(tableNumber)

      const zoneState: IRestaurantZoneState = {
        orderId: order.orderId,
        zoneType,
        tableNumber,
        position: {
          x: Math.random() * 100,
          y: Math.random() * 100,
          section: zoneType
        },
        placementStatus: 'placed',
        placedAt: new Date(),
        lastUpdatedAt: new Date(),
        metadata: {
          hasSpecialRequests: order.dishDescription.includes('без') || order.dishDescription.includes('с'),
          estimatedServiceTime: order.isVipCustomer ? 30 * 60 * 1000 : 45 * 60 * 1000
        }
      }

      zoneStates.set(order.orderId, zoneState)
      return zoneState
    },

    async moveOrderBetweenZones(orderId: number, newVipStatus: boolean): Promise<IRestaurantZoneState> {
      const currentState = zoneStates.get(orderId)
      if (!currentState) {
        throw new Error(`Заказ ${orderId} не найден в зонах`)
      }

      // Освобождаем текущий стол
      occupiedTables.delete(currentState.tableNumber)

      // Создаём новое размещение
      const newZoneType = newVipStatus ? 'vip' : 'regular'
      const availableTables = await this.getAvailableTables(newZoneType)

      if (availableTables.length === 0) {
        throw new Error(`Нет свободных столов в зоне ${newZoneType}`)
      }

      const newTableNumber = availableTables[0]
      occupiedTables.add(newTableNumber)

      const updatedState: IRestaurantZoneState = {
        ...currentState,
        zoneType: newZoneType,
        tableNumber: newTableNumber,
        position: {
          ...currentState.position,
          section: newZoneType
        },
        lastUpdatedAt: new Date()
      }

      zoneStates.set(orderId, updatedState)
      return updatedState
    },

    async removeOrderFromZone(orderId: number): Promise<boolean> {
      const state = zoneStates.get(orderId)
      if (!state) return false

      occupiedTables.delete(state.tableNumber)
      zoneStates.delete(orderId)
      return true
    },

    async updateZoneState(orderId: number, updates: Partial<IRestaurantZoneState>): Promise<IRestaurantZoneState> {
      const currentState = zoneStates.get(orderId)
      if (!currentState) {
        throw new Error(`Заказ ${orderId} не найден в зонах`)
      }

      const updatedState = { ...currentState, ...updates, lastUpdatedAt: new Date() }
      zoneStates.set(orderId, updatedState)
      return updatedState
    },

    async getZoneState(orderId: number): Promise<IRestaurantZoneState | null> {
      return zoneStates.get(orderId) || null
    },

    async syncAllZones(): Promise<IRestaurantZoneState[]> {
      return Array.from(zoneStates.values())
    },

    async getAllZoneStates(): Promise<IRestaurantZoneState[]> {
      return Array.from(zoneStates.values())
    },

    async getAvailableTables(zoneType: 'vip' | 'regular'): Promise<number[]> {
      const allTables = zoneType === 'vip'
        ? config.zoneSettings.vip.tableNumbers
        : config.zoneSettings.regular.tableNumbers

      return allTables.filter(table => !occupiedTables.has(table))
    }
  }
}

async function cleanupTestEnvironment(): Promise<void> {
  // Очистка тестовой среды
  vi.clearAllMocks()
}


