import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { RestaurantZoneAPI } from '../services/restaurantZoneAPI'
import { KitchenChangeLog } from '../services/kitchenChangeLog'
import { RestaurantZoneSync } from '../services/restaurantZoneSync'
import {
  IRestaurantSyncConfig,
  RestaurantChangeEvent
} from '../interfaces/IRestaurantSyncModel'

/**
 * Интеграционные тесты для реальных реализаций ДЗ-3
 * Проверяем работу всех компонентов вместе
 */

describe('🏆 RestaurantSync Real - Интеграционные тесты с реальными реализациями', () => {
  let restaurantAPI: RestaurantZoneAPI
  let kitchenLog: KitchenChangeLog
  let zoneSync: RestaurantZoneSync
  let config: IRestaurantSyncConfig

  beforeEach(() => {
    // Настройка конфигурации
    config = {
      maxEventsInMemory: 100,
      syncIntervalMs: 50,
      enableDetailedLogging: false, // Отключаем для тестов
      zoneSettings: {
        vip: {
          maxTables: 3,
          tableNumbers: [101, 102, 103],
          specialFeatures: ['champagne_service', 'personal_waiter']
        },
        regular: {
          maxTables: 5,
          tableNumbers: [1, 2, 3, 4, 5]
        },
        takeaway: {
          maxOrders: 10,
          averageWaitTime: 15 * 60 * 1000
        }
      },
      autoCleanup: {
        enabled: false,
        keepLastN: 50,
        intervalMs: 60000
      }
    }

    // Создаём реальные экземпляры
    restaurantAPI = new RestaurantZoneAPI()
    kitchenLog = new KitchenChangeLog(config.maxEventsInMemory)
    zoneSync = new RestaurantZoneSync(config)

    // Настраиваем связки между компонентами
    setupEventFlow()
  })

  afterEach(() => {
    // Очищаем данные после каждого теста
    restaurantAPI.clearAll()
    kitchenLog.clearAll()
    zoneSync.clearAll()
  })

  /**
   * Настройка потока событий между компонентами
   */
  function setupEventFlow() {
    // RestaurantAPI → KitchenLog → ZoneSync
    restaurantAPI.onOrderChange(async (event: RestaurantChangeEvent) => {
      await kitchenLog.append(event)
    })

    kitchenLog.onNewEvent(async (event: RestaurantChangeEvent) => {
      await zoneSync.processOrderEvent(event)
    })
  }

  // ==========================================
  // 🔗 Тесты полной интеграции
  // ==========================================

  describe('🔗 Полная интеграция всех компонентов', () => {
    it('должен выполнить полный цикл: создание → размещение → VIP повышение → подача', async () => {
      // 1. Создаём обычный заказ
      const order = await restaurantAPI.addOrder({
        isVipCustomer: false,
        dishDescription: 'Стейк с овощами',
        status: 'pending' as const,
        tableNumber: 1
      })

      // Даём время на обработку событий
      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем что заказ размещён в обычной зоне
      let zoneState = await zoneSync.getZoneState(order.orderId)
      expect(zoneState?.zoneType).toBe('regular')
      expect(zoneState?.tableNumber).toBeGreaterThanOrEqual(1)
      expect(zoneState?.tableNumber).toBeLessThanOrEqual(5)

      // 2. Повышаем клиента до VIP
      await restaurantAPI.modifyOrderField(order.orderId, 'isVipCustomer', true)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем что заказ перемещён в VIP зону
      zoneState = await zoneSync.getZoneState(order.orderId)
      expect(zoneState?.zoneType).toBe('vip')
      expect(zoneState?.tableNumber).toBeGreaterThanOrEqual(101)
      expect(zoneState?.tableNumber).toBeLessThanOrEqual(103)

      // 3. Изменяем статус заказа
      await restaurantAPI.changeOrderStatus(order.orderId, 'preparing')
      await restaurantAPI.changeOrderStatus(order.orderId, 'ready')
      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем что статус размещения обновился
      zoneState = await zoneSync.getZoneState(order.orderId)
      expect(zoneState?.placementStatus).toBe('ready_for_service')

      // 4. Подаём блюдо (удаляем заказ)
      await restaurantAPI.removeOrder(order.orderId, 'served')
      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем что заказ удалён из зоны
      zoneState = await zoneSync.getZoneState(order.orderId)
      expect(zoneState).toBeNull()

      // 5. Проверяем журнал событий
      const allEvents = await kitchenLog.getEventsByOrderId(order.orderId)
      expect(allEvents.length).toBeGreaterThanOrEqual(4) // add, modify, status changes, remove

      const eventTypes = allEvents.map(e => e.type)
      expect(eventTypes).toContain('order_added')
      expect(eventTypes).toContain('order_modified')
      expect(eventTypes).toContain('status_changed')
      expect(eventTypes).toContain('order_removed')
    })

    it('должен корректно обрабатывать множественные VIP заказы', async () => {
      // Создаём 3 VIP заказа (все доступные VIP столы)
      const vipOrders = []
      for (let i = 1; i <= 3; i++) {
        const order = await restaurantAPI.addOrder({
          isVipCustomer: true,
          dishDescription: `VIP блюдо ${i}`,
          status: 'pending' as const
        })
        vipOrders.push(order)
      }

      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем что все VIP столы заняты
      const availableVipTables = await zoneSync.getAvailableTables('vip')
      expect(availableVipTables).toHaveLength(0)

      // Пытаемся создать ещё один VIP заказ
      const extraVipOrder = await restaurantAPI.addOrder({
        isVipCustomer: true,
        dishDescription: 'Дополнительный VIP заказ',
        status: 'pending' as const
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем что дополнительный заказ не размещён
      const extraZoneState = await zoneSync.getZoneState(extraVipOrder.orderId)
      expect(extraZoneState).toBeNull()

      // Освобождаем один VIP стол
      await restaurantAPI.removeOrder(vipOrders[0].orderId, 'served')
      await new Promise(resolve => setTimeout(resolve, 100))

      // Теперь должен быть один свободный VIP стол
      const availableAfterRemoval = await zoneSync.getAvailableTables('vip')
      expect(availableAfterRemoval).toHaveLength(1)
    })

    it('должен переключать заказы между зонами при изменении VIP статуса', async () => {
      // Создаём обычный заказ
      const regularOrder = await restaurantAPI.addOrder({
        isVipCustomer: false,
        dishDescription: 'Обычный салат',
        status: 'pending' as const
      })

      // Создаём VIP заказ
      const vipOrder = await restaurantAPI.addOrder({
        isVipCustomer: true,
        dishDescription: 'VIP суп',
        status: 'pending' as const
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем исходное размещение
      let regularZone = await zoneSync.getZoneState(regularOrder.orderId)
      let vipZone = await zoneSync.getZoneState(vipOrder.orderId)

      expect(regularZone?.zoneType).toBe('regular')
      expect(vipZone?.zoneType).toBe('vip')

      // Меняем обычного клиента на VIP
      await restaurantAPI.modifyOrderField(regularOrder.orderId, 'isVipCustomer', true)

      // Убираем VIP статус у VIP клиента
      await restaurantAPI.modifyOrderField(vipOrder.orderId, 'isVipCustomer', false)

      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем что заказы поменялись зонами
      regularZone = await zoneSync.getZoneState(regularOrder.orderId)
      vipZone = await zoneSync.getZoneState(vipOrder.orderId)

      expect(regularZone?.zoneType).toBe('vip')   // Был regular, стал VIP
      expect(vipZone?.zoneType).toBe('regular')   // Был VIP, стал regular
    })

    it('должен вести корректную статистику по событиям', async () => {
      // Создаём разные типы событий
      const order1 = await restaurantAPI.addOrder({
        isVipCustomer: true,
        dishDescription: 'Блюдо 1',
        status: 'pending' as const
      })

      const order2 = await restaurantAPI.addOrder({
        isVipCustomer: false,
        dishDescription: 'Блюдо 2',
        status: 'pending' as const
      })

      await restaurantAPI.changeOrderStatus(order1.orderId, 'preparing')
      await restaurantAPI.modifyOrderField(order2.orderId, 'dishDescription', 'Блюдо 2 обновлённое')
      await restaurantAPI.removeOrder(order1.orderId, 'cancelled')

      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем статистику событий
      const stats = await kitchenLog.getEventsStats()

      expect(stats.total).toBeGreaterThanOrEqual(5)
      expect(stats.byType.order_added).toBe(2)
      expect(stats.byType.status_changed).toBe(1)
      expect(stats.byType.order_modified).toBe(1)
      expect(stats.byType.order_removed).toBe(1)

      expect(stats.byInitiator.customer).toBeGreaterThan(0)
      expect(stats.byInitiator.chef).toBeGreaterThan(0)
      expect(stats.byInitiator.waiter).toBeGreaterThan(0)
    })

    it('должен обрабатывать специальные требования в заказах', async () => {
      // Заказ с особыми требованиями
      const specialOrder = await restaurantAPI.addOrder({
        isVipCustomer: false,
        dishDescription: 'Пицца без лука с дополнительным сыром',
        status: 'pending' as const
      })

      // Обычный заказ
      const normalOrder = await restaurantAPI.addOrder({
        isVipCustomer: false,
        dishDescription: 'Стандартная пицца',
        status: 'pending' as const
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем что специальные требования определены
      const specialZone = await zoneSync.getZoneState(specialOrder.orderId)
      const normalZone = await zoneSync.getZoneState(normalOrder.orderId)

      expect(specialZone?.metadata.hasSpecialRequests).toBe(true)
      expect(normalZone?.metadata.hasSpecialRequests).toBe(false)

      // Заказ с особыми требованиями должен иметь больше времени обслуживания
      expect(specialZone?.metadata.estimatedServiceTime).toBeGreaterThan(
        normalZone?.metadata.estimatedServiceTime || 0
      )
    })

    it('должен корректно очищать журнал событий', async () => {
      // Добавляем много событий
      for (let i = 1; i <= 15; i++) {
        await restaurantAPI.addOrder({
          isVipCustomer: i % 2 === 0,
          dishDescription: `Блюдо ${i}`,
          status: 'pending' as const
        })
      }

      await new Promise(resolve => setTimeout(resolve, 100))

      // Проверяем что события записались
      let eventCount = await kitchenLog.getEventCount()
      expect(eventCount).toBe(15)

      // Очищаем старые события, оставляем только последние 5
      await kitchenLog.cleanup(5)

      // Проверяем что осталось только 5 событий
      eventCount = await kitchenLog.getEventCount()
      expect(eventCount).toBe(5)

      // Проверяем что остались именно последние события
      const recentEvents = await kitchenLog.getRecentEvents(5)
      expect(recentEvents).toHaveLength(5)

      // Проверяем что это события с большими ID (последние)
      const minEventId = Math.min(...recentEvents.map(e => e.eventId))
      expect(minEventId).toBeGreaterThan(10) // Должны остаться события 11-15
    })
  })

  // ==========================================
  // 📊 Тесты производительности и нагрузки
  // ==========================================

  describe('📊 Производительность и нагрузка', () => {
    it('должен обрабатывать высокую нагрузку заказов', async () => {
      const startTime = Date.now()
      const orderCount = 50

      // Создаём много заказов одновременно
      const promises = []
      for (let i = 1; i <= orderCount; i++) {
        promises.push(
          restaurantAPI.addOrder({
            isVipCustomer: i % 3 === 0, // Каждый третий VIP
            dishDescription: `Нагрузочный заказ ${i}`,
            status: 'pending' as const
          })
        )
      }

      const orders = await Promise.all(promises)
      await new Promise(resolve => setTimeout(resolve, 200)) // Время на обработку

      const endTime = Date.now()
      const processingTime = endTime - startTime

      // Проверяем что все заказы созданы
      expect(orders).toHaveLength(orderCount)

      // Проверяем что события записались
      const eventCount = await kitchenLog.getEventCount()
      expect(eventCount).toBe(orderCount)

      // Проверяем статистику зон
      const zoneStats = await zoneSync.getZoneStatistics()
      expect(zoneStats.vip.occupied + zoneStats.regular.occupied).toBeGreaterThan(0)

      // Проверяем производительность (должно обработаться быстро)
      expect(processingTime).toBeLessThan(5000) // Меньше 5 секунд

      console.log(`Обработано ${orderCount} заказов за ${processingTime}мс`)
    })
  })
})


