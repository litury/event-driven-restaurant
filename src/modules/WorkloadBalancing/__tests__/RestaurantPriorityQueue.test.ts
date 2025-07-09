import { describe, test, expect, beforeEach, vi } from 'vitest'
import type { IRestaurantOrder, IRestaurantPriorityQueue, IPriorityCalculator } from '../interfaces'
import { createRestaurantPriorityQueue, PriorityCalculator } from '../services/priorityQueue'

// Реальные реализации для прохождения тестов (Green фаза TDD)
let priorityQueue: IRestaurantPriorityQueue
let priorityCalculator: IPriorityCalculator<IRestaurantOrder>

// Хелпер для создания тестовых заказов
function createTestOrder(overrides: Partial<IRestaurantOrder> = {}): IRestaurantOrder {
  const now = new Date()
  const estimatedTime = 2000 // 2 секунды
  return {
    orderNumber: Math.floor(Math.random() * 1000),
    customerType: 'обычный',
    dishType: 'пицца',
    complexity: 'простое',
    estimatedCookingTimeMs: estimatedTime,
    estimatedProcessingTimeMs: estimatedTime, // Дублируем для совместимости
    deadline: new Date(now.getTime() + 5000), // +5 секунд
    enqueuedAt: now,
    specialRequests: [],
    priority: 0,
    ...overrides
  }
}

describe('RestaurantPriorityQueue', () => {
  beforeEach(() => {
    // Создаем реальные экземпляры для тестирования
    priorityQueue = createRestaurantPriorityQueue()
    priorityCalculator = new PriorityCalculator<IRestaurantOrder>()
  })

  describe('Базовая функциональность очереди', () => {
    test('должна добавлять заказ в очередь с приоритетом', async () => {
      // Arrange
      const order = createTestOrder({ customerType: 'VIP' })

      // Act & Assert - пока будет падать
      await expect(priorityQueue.enqueueWithPriority(order)).resolves.toBeUndefined()
      expect(priorityQueue.size()).toBe(1)
    })

    test('должна возвращать заказ с наивысшим приоритетом', async () => {
      // Arrange - создаем заказы с разными deadline для честного приоритета
      const now = new Date()
      const normalOrder = createTestOrder({
        customerType: 'обычный',
        deadline: new Date(now.getTime() + 10000), // +10 сек (низкий приоритет)
        estimatedProcessingTimeMs: 2000
      })
      const vipOrder = createTestOrder({
        customerType: 'VIP',
        deadline: new Date(now.getTime() + 2000), // +2 сек (высокий приоритет)
        estimatedProcessingTimeMs: 2000
      })

      await priorityQueue.enqueueWithPriority(normalOrder)
      await priorityQueue.enqueueWithPriority(vipOrder)

      // Act
      const highestPriority = priorityQueue.peekHighestPriority()

      // Assert
      expect(highestPriority?.customerType).toBe('VIP') // Проверяем по типу клиента
      expect(priorityQueue.size()).toBe(2) // Не удаляем при peek
    })

    test('должна извлекать заказы по приоритету', async () => {
      // Arrange - создаем заказы с разными deadline
      const now = new Date()
      const orders = [
        createTestOrder({
          orderNumber: 1,
          deadline: new Date(now.getTime() + 5000), // Средний приоритет
          estimatedProcessingTimeMs: 1000
        }),
        createTestOrder({
          orderNumber: 2,
          deadline: new Date(now.getTime() + 1000), // Высший приоритет (срочно!)
          estimatedProcessingTimeMs: 1000
        }),
        createTestOrder({
          orderNumber: 3,
          deadline: new Date(now.getTime() + 10000), // Низкий приоритет
          estimatedProcessingTimeMs: 1000
        })
      ]

      for (const order of orders) {
        await priorityQueue.enqueueWithPriority(order)
      }

      // Act
      const first = await priorityQueue.dequeueAsync()
      const second = await priorityQueue.dequeueAsync()

      // Assert
      expect(first.orderNumber).toBe(2) // Самый срочный
      expect(second.orderNumber).toBe(1) // Средний по срочности
    })
  })

  describe('Ресторанная специфика', () => {
    test('должна фильтровать заказы по типу блюда', async () => {
      // Arrange
      const pizzaOrder = createTestOrder({ dishType: 'пицца', orderNumber: 1 })
      const burgerOrder = createTestOrder({ dishType: 'бургер', orderNumber: 2 })

      await priorityQueue.enqueueWithPriority(pizzaOrder)
      await priorityQueue.enqueueWithPriority(burgerOrder)

      // Act
      const pizzaOrders = priorityQueue.getOrdersByDishType('пицца')

      // Assert
      expect(pizzaOrders).toHaveLength(1)
      expect(pizzaOrders[0].orderNumber).toBe(1)
    })

    test('должна возвращать VIP заказы', async () => {
      // Arrange
      const normalOrder = createTestOrder({ customerType: 'обычный' })
      const vipOrder = createTestOrder({ customerType: 'VIP' })

      await priorityQueue.enqueueWithPriority(normalOrder)
      await priorityQueue.enqueueWithPriority(vipOrder)

      // Act
      const vipOrders = priorityQueue.getVipOrders()

      // Assert
      expect(vipOrders).toHaveLength(1)
      expect(vipOrders[0].customerType).toBe('VIP')
    })

    test('должна определять просроченные заказы', async () => {
      // Arrange
      const now = new Date()
      const overdueOrder = createTestOrder({
        deadline: new Date(now.getTime() - 1000), // -1 секунда (просрочен)
        orderNumber: 1
      })
      const normalOrder = createTestOrder({
        deadline: new Date(now.getTime() + 5000), // +5 секунд (не просрочен)
        orderNumber: 2
      })

      await priorityQueue.enqueueWithPriority(overdueOrder)
      await priorityQueue.enqueueWithPriority(normalOrder)

      // Act
      const overdueOrders = priorityQueue.getOverdueOrders()

      // Assert
      expect(overdueOrders).toHaveLength(1)
      expect(overdueOrders[0].orderNumber).toBe(1)
    })

    test('должна возвращать статистику очереди', async () => {
      // Arrange
      const orders = [
        createTestOrder({ customerType: 'VIP', dishType: 'пицца' }),
        createTestOrder({ customerType: 'обычный', dishType: 'пицца' }),
        createTestOrder({ customerType: 'VIP', dishType: 'бургер' })
      ]

      for (const order of orders) {
        await priorityQueue.enqueueWithPriority(order)
      }

      // Act
      const stats = priorityQueue.getQueueStats()

      // Assert
      expect(stats.totalOrders).toBe(3)
      expect(stats.vipOrders).toBe(2)
      expect(stats.ordersByDishType['пицца']).toBe(2)
      expect(stats.ordersByDishType['бургер']).toBe(1)
    })
  })

  describe('Edge Cases (граничные случаи)', () => {
    test('должна обрабатывать просроченный deadline', async () => {
      // Arrange
      const now = new Date()
      const expiredOrder = createTestOrder({
        deadline: new Date(now.getTime() - 5000), // -5 секунд
        estimatedCookingTimeMs: 1000
      })

      // Act & Assert
      expect(() => priorityCalculator.calculatePriority(expiredOrder))
        .not.toThrow() // Не должно падать

      const priority = priorityCalculator.calculatePriority(expiredOrder)
      expect(priority).toBe(Number.MAX_SAFE_INTEGER) // Максимальный приоритет
    })

    test('должна обрабатывать нулевое время приготовления', async () => {
      // Arrange
      const zeroTimeOrder = createTestOrder({
        estimatedCookingTimeMs: 0,
        estimatedProcessingTimeMs: 0
      })

      // Act & Assert
      expect(() => priorityCalculator.calculatePriority(zeroTimeOrder))
        .toThrow('Время приготовления не может быть нулевым')
    })

    test('должна обрабатывать очередь на 100+ заказов', async () => {
      // Arrange - создаем много заказов
      const orders = Array.from({ length: 100 }, (_, i) =>
        createTestOrder({ orderNumber: i, priority: Math.random() * 100 })
      )

      const startTime = Date.now()

      // Act
      for (const order of orders) {
        await priorityQueue.enqueueWithPriority(order)
      }

      const endTime = Date.now()

      // Assert
      expect(endTime - startTime).toBeLessThan(1000) // < 1 секунды
      expect(priorityQueue.size()).toBe(100)
    })

    test('должна обрабатывать одновременное добавление заказов', async () => {
      // Arrange
      const orders = Array.from({ length: 10 }, (_, i) =>
        createTestOrder({ orderNumber: i })
      )

      // Act - одновременное добавление
      const promises = orders.map(order =>
        priorityQueue.enqueueWithPriority(order)
      )

      // Assert
      await expect(Promise.all(promises)).resolves.toHaveLength(10)
      expect(priorityQueue.size()).toBe(10)
    })

    test('должна пересчитывать приоритеты при изменении времени', async () => {
      // Arrange
      vi.useFakeTimers()
      const now = new Date()

      const order = createTestOrder({
        deadline: new Date(now.getTime() + 10000), // +10 секунд
        estimatedCookingTimeMs: 2000,
        priority: 5
      })

      await priorityQueue.enqueueWithPriority(order)

      // Act - "проходит время"
      vi.advanceTimersByTime(8000) // +8 секунд
      await priorityQueue.recalculatePriorities()

      // Assert
      const updatedOrder = priorityQueue.peekHighestPriority()
      expect(updatedOrder?.priority).toBeLessThan(5) // Приоритет повысился

      vi.useRealTimers()
    })
  })
})

describe('PriorityCalculator', () => {
  test('должен рассчитывать приоритет по формуле', () => {
    // Arrange
    const now = new Date()
    const order = createTestOrder({
      deadline: new Date(now.getTime() + 4000), // +4 секунды
      estimatedCookingTimeMs: 2000, // 2 секунды
      estimatedProcessingTimeMs: 2000, // 2 секунды (для расчета)
      enqueuedAt: now
    })

    // Act
    const priority = priorityCalculator.calculatePriority(order)

    // Assert
    // Формула: (deadline - now) / estimatedTime = 4000 / 2000 = 2
    expect(priority).toBeCloseTo(2, 1)
  })

  test('должен определять просроченные заказы', () => {
    // Arrange
    const now = new Date()
    const overdueOrder = createTestOrder({
      deadline: new Date(now.getTime() - 1000) // -1 секунда
    })

    // Act & Assert
    expect(priorityCalculator.isOverdue(overdueOrder)).toBe(true)
  })

  test('должен рассчитывать время до deadline', () => {
    // Arrange
    const now = new Date()
    const order = createTestOrder({
      deadline: new Date(now.getTime() + 3000) // +3 секунды
    })

    // Act
    const timeToDeadline = priorityCalculator.getTimeToDeadline(order)

    // Assert
    expect(timeToDeadline).toBeCloseTo(3000, -2) // ~3000мс
  })
}) 