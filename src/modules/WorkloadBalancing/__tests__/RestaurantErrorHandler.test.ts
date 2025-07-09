import { describe, test, expect, beforeEach, vi } from 'vitest'
import type {
  IRestaurantOrder,
  IRestaurantErrorHandler,
  IRestaurantFailure,
  RestaurantFailureType,
  FailbackStrategy,
  IErrorHandlingConfig
} from '../interfaces'
import { createRestaurantErrorHandler } from '../services/restaurantErrorHandler'

// Реальная реализация для TDD подхода
let errorHandler: IRestaurantErrorHandler
let config: IErrorHandlingConfig

// Хелпер для создания тестового заказа
function createTestOrder(overrides: Partial<IRestaurantOrder> = {}): IRestaurantOrder {
  const now = new Date()
  const estimatedTime = 2000
  return {
    orderNumber: Math.floor(Math.random() * 1000),
    customerType: 'обычный',
    dishType: 'пицца',
    complexity: 'простое',
    estimatedCookingTimeMs: estimatedTime,
    estimatedProcessingTimeMs: estimatedTime,
    deadline: new Date(now.getTime() + 10000), // +10 секунд
    enqueuedAt: now,
    specialRequests: [],
    priority: 5,
    ...overrides
  }
}

describe('RestaurantErrorHandler', () => {
  beforeEach(() => {
    // Конфигурация по умолчанию
    config = {
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeoutMs: 30000,
      enableDeadLetterQueue: true,
      vipOrderRetryMultiplier: 2,
      logFailures: true
    }

    // Создаём реальный обработчик с тестовой конфигурацией
    errorHandler = createRestaurantErrorHandler(config)
  })

  describe('Обработка базовых отказов', () => {
    test('должен создать отказ с правильными данными', async () => {
      // Arrange
      const order = createTestOrder({ customerType: 'VIP', orderNumber: 123 })
      const error = new Error('Повар заболел')
      const context = { chefId: 1, availableChefs: [2, 3] }

      // Act
      const failure = await errorHandler.handleFailure(order, error, context)

      // Assert
      expect(failure.id).toBeDefined()
      expect(failure.type).toBe('chef_unavailable')
      expect(failure.order.orderNumber).toBe(123)
      expect(failure.errorMessage).toContain('Повар заболел')
      expect(failure.attemptCount).toBe(1)
      expect(failure.context).toEqual(context)
      expect(failure.originalError).toBe(error)
    })

    test('должен определить правильный тип отказа по ошибке', async () => {
      // Arrange
      const testCases = [
        { error: new Error('Queue is full'), expectedType: 'queue_full' },
        { error: new Error('Chef unavailable'), expectedType: 'chef_unavailable' },
        { error: new Error('No ingredients'), expectedType: 'ingredients_missing' },
        { error: new Error('Oven broken'), expectedType: 'equipment_failure' },
        { error: new Error('Timeout'), expectedType: 'order_timeout' }
      ]

      for (const testCase of testCases) {
        // Act
        const failure = await errorHandler.handleFailure(
          createTestOrder(),
          testCase.error
        )

        // Assert
        expect(failure.type).toBe(testCase.expectedType)
      }
    })

    test('должен предложить правильную стратегию для типа отказа', async () => {
      // Arrange
      const testCases: Array<{
        failureType: RestaurantFailureType
        customerType: IRestaurantOrder['customerType']
        expectedStrategy: FailbackStrategy
      }> = [
          { failureType: 'chef_unavailable', customerType: 'VIP', expectedStrategy: 'retry_with_escalation' },
          { failureType: 'chef_unavailable', customerType: 'обычный', expectedStrategy: 'retry_with_delay' },
          { failureType: 'ingredients_missing', customerType: 'обычный', expectedStrategy: 'substitute_alternative' },
          { failureType: 'equipment_failure', customerType: 'обычный', expectedStrategy: 'move_to_review_queue' },
          { failureType: 'queue_full', customerType: 'доставка', expectedStrategy: 'store_for_later' }
        ]

      for (const testCase of testCases) {
        // Arrange
        const order = createTestOrder({ customerType: testCase.customerType })
        // Мокаем тип отказа для точного тестирования
        const error = new Error(`Mocked ${testCase.failureType}`)

        // Act
        const failure = await errorHandler.handleFailure(order, error)

        // Assert
        expect(failure.suggestedStrategy).toBe(testCase.expectedStrategy)
      }
    })
  })

  describe('Выполнение стратегий восстановления', () => {
    test('должен успешно выполнить retry_immediately стратегию', async () => {
      // Arrange
      const order = createTestOrder()
      const failure: IRestaurantFailure = {
        id: 'fail_001',
        type: 'chef_unavailable',
        order,
        timestamp: new Date(),
        errorMessage: 'Временная недоступность',
        attemptCount: 1,
        suggestedStrategy: 'retry_immediately'
      }

      // Act
      const success = await errorHandler.executeStrategy(failure)

      // Assert
      expect(success).toBe(true)
    })

    test('должен выполнить retry_with_delay с правильной задержкой', async () => {
      // Arrange
      const order = createTestOrder()
      const failure: IRestaurantFailure = {
        id: 'fail_002',
        type: 'queue_full',
        order,
        timestamp: new Date(),
        errorMessage: 'Очередь переполнена',
        attemptCount: 1,
        suggestedStrategy: 'retry_with_delay'
      }

      const startTime = Date.now()

      // Act
      const success = await errorHandler.executeStrategy(failure)
      const endTime = Date.now()

      // Assert
      expect(success).toBe(true)
      expect(endTime - startTime).toBeGreaterThanOrEqual(config.retryDelayMs)
    })

    test('должен повысить приоритет для VIP при retry_with_escalation', async () => {
      // Arrange
      const vipOrder = createTestOrder({ customerType: 'VIP', priority: 5 })
      const failure: IRestaurantFailure = {
        id: 'fail_003',
        type: 'chef_unavailable',
        order: vipOrder,
        timestamp: new Date(),
        errorMessage: 'Повар недоступен',
        attemptCount: 1,
        suggestedStrategy: 'retry_with_escalation'
      }

      // Act
      const success = await errorHandler.executeStrategy(failure)

      // Assert
      expect(success).toBe(true)
      // Приоритет должен повыситься (меньшее число = выше приоритет)
      expect(failure.order.priority).toBeLessThan(5)
    })

    test('должен обработать substitute_alternative стратегию', async () => {
      // Arrange
      const order = createTestOrder({ dishType: 'пицца' })
      const failure: IRestaurantFailure = {
        id: 'fail_004',
        type: 'ingredients_missing',
        order,
        timestamp: new Date(),
        errorMessage: 'Нет ингредиентов для пиццы',
        attemptCount: 1,
        suggestedStrategy: 'substitute_alternative'
      }

      // Act
      const success = await errorHandler.executeStrategy(failure)

      // Assert
      expect(success).toBe(true)
      // Должна быть предложена альтернатива
    })
  })

  describe('Circuit Breaker функциональность', () => {
    test('должен разрешить операции при нормальной работе', () => {
      // Act & Assert
      expect(errorHandler.isOperationAllowed('cooking')).toBe(true)
      expect(errorHandler.isOperationAllowed('order_processing')).toBe(true)
    })

    test('должен блокировать операции при превышении порога отказов', async () => {
      // Arrange - симулируем много отказов
      const order = createTestOrder()

      for (let i = 0; i < config.circuitBreakerThreshold + 1; i++) {
        await errorHandler.handleFailure(order, new Error('Критическая ошибка'))
      }

      // Act & Assert
      expect(errorHandler.isOperationAllowed('cooking')).toBe(false)
    })

    test('должен восстановить работу после timeout Circuit Breaker', async () => {
      // Arrange - блокируем Circuit Breaker
      const order = createTestOrder()

      for (let i = 0; i < config.circuitBreakerThreshold + 1; i++) {
        await errorHandler.handleFailure(order, new Error('Ошибка'))
      }

      // Убеждаемся что заблокировано
      expect(errorHandler.isOperationAllowed('cooking')).toBe(false)

      // Act - симулируем прохождение времени
      vi.useFakeTimers()
      vi.advanceTimersByTime(config.circuitBreakerTimeoutMs + 1000)

      // Assert
      expect(errorHandler.isOperationAllowed('cooking')).toBe(true)

      vi.useRealTimers()
    })
  })

  describe('Статистика отказов', () => {
    test('должен предоставить корректную статистику', async () => {
      // Arrange - создаем несколько отказов
      const orders = [
        createTestOrder(),
        createTestOrder({ customerType: 'VIP' }),
        createTestOrder()
      ]

      await errorHandler.handleFailure(orders[0], new Error('Chef unavailable'))
      await errorHandler.handleFailure(orders[1], new Error('No ingredients'))
      await errorHandler.handleFailure(orders[2], new Error('Chef unavailable'))

      // Act
      const stats = errorHandler.getFailureStats()

      // Assert
      expect(stats.totalFailures).toBe(3)
      expect(stats.failuresByType['chef_unavailable']).toBe(2)
      expect(stats.failuresByType['ingredients_missing']).toBe(1)
      expect(stats.mostCommonFailureType).toBe('chef_unavailable')
      expect(stats.averageRecoveryTime).toBeGreaterThan(0)
    })

    test('должен считать отказы за последний час', async () => {
      // Arrange
      vi.useFakeTimers()
      const now = new Date()
      vi.setSystemTime(now)

      // Создаем отказ час назад
      vi.setSystemTime(new Date(now.getTime() - 3600000 - 1000)) // -1 час 1 сек
      await errorHandler.handleFailure(createTestOrder(), new Error('Старый отказ'))

      // Создаем отказ сейчас
      vi.setSystemTime(now)
      await errorHandler.handleFailure(createTestOrder(), new Error('Новый отказ'))

      // Act
      const stats = errorHandler.getFailureStats()

      // Assert
      expect(stats.totalFailures).toBe(2)
      expect(stats.failuresLastHour).toBe(1) // Только новый отказ

      vi.useRealTimers()
    })
  })

  describe('Edge Cases (граничные случаи)', () => {
    test('должен обработать отказ без технической ошибки', async () => {
      // Arrange
      const order = createTestOrder()

      // Act
      const failure = await errorHandler.handleFailure(order) // Без error параметра

      // Assert
      expect(failure.id).toBeDefined()
      expect(failure.originalError).toBeUndefined()
      expect(failure.errorMessage).toBeDefined()
    })

    test('должен обработать максимальное количество попыток', async () => {
      // Arrange
      const order = createTestOrder()
      let attemptCount = 0

      // Act - имитируем множественные отказы
      for (let i = 0; i < config.maxRetryAttempts + 2; i++) {
        const failure = await errorHandler.handleFailure(order, new Error('Постоянная ошибка'))
        attemptCount = failure.attemptCount
      }

      // Assert
      expect(attemptCount).toBeLessThanOrEqual(config.maxRetryAttempts)
    })

    test('должен обработать кастомные стратегии из конфигурации', async () => {
      // Arrange
      const customConfig: IErrorHandlingConfig = {
        ...config,
        customStrategies: {
          'chef_unavailable': 'discard_with_log'
        }
      }

      // Создаем обработчик с кастомной конфигурацией
      const customErrorHandler = createRestaurantErrorHandler(customConfig)

      const order = createTestOrder()

      // Act
      const failure = await customErrorHandler.handleFailure(order, new Error('Chef unavailable'))

      // Assert
      expect(failure.suggestedStrategy).toBe('discard_with_log')
    })

    test('должен обработать одновременные отказы', async () => {
      // Arrange
      const orders = Array.from({ length: 10 }, () => createTestOrder())

      // Act - одновременная обработка отказов
      const promises = orders.map(order =>
        errorHandler.handleFailure(order, new Error('Concurrent failure'))
      )

      const failures = await Promise.all(promises)

      // Assert
      expect(failures).toHaveLength(10)
      failures.forEach(failure => {
        expect(failure.id).toBeDefined()
        expect(failure.type).toBeDefined()
      })
    })

    test('должен обработать отказ с VIP заказом корректно', async () => {
      // Arrange
      const vipOrder = createTestOrder({
        customerType: 'VIP',
        specialRequests: ['Без лука', 'Дополнительный сыр']
      })

      // Act
      const failure = await errorHandler.handleFailure(vipOrder, new Error('Chef busy'))

      // Assert
      expect(failure.suggestedStrategy).toContain('escalation') // VIP получает эскалацию
      expect(failure.order.customerType).toBe('VIP')
    })
  })
}) 