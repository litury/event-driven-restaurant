import type { IEventQueue, IWorkItem, IRestaurantOrder } from '../interfaces'

/**
 * Режимы работы генератора
 */
export type GeneratorMode = 'legacy' | 'restaurant'

/**
 * Конфигурация генератора ресторанных заказов
 */
export interface IRestaurantOrderGeneratorConfig {
  /** Режим работы - legacy (числа) или restaurant (полные заказы) */
  mode: GeneratorMode
  /** Интервал генерации заказов (мс) */
  intervalMs: number
  /** Максимальное количество заказов */
  maxOrders: number
  /** Включить приоритеты (только для restaurant режима) */
  enablePriorities: boolean
}

/**
 * Фабрика для создания заказов ресторана
 */
export class RestaurantOrderFactory {
  private orderCounter = 1

  /**
   * Создает простой заказ (legacy mode)
   */
  createLegacyOrder(): IWorkItem {
    return this.orderCounter++
  }

  /**
   * Создает полный ресторанный заказ
   */
  createRestaurantOrder(): IRestaurantOrder {
    const now = new Date()
    const orderNumber = this.orderCounter++

    // Случайные параметры для реализма
    const customerTypes: IRestaurantOrder['customerType'][] = ['VIP', 'обычный', 'доставка']
    const dishTypes: IRestaurantOrder['dishType'][] = ['пицца', 'бургер', 'салат', 'десерт']
    const complexities: IRestaurantOrder['complexity'][] = ['простое', 'среднее', 'сложное']

    const customerType = customerTypes[Math.floor(Math.random() * customerTypes.length)]
    const dishType = dishTypes[Math.floor(Math.random() * dishTypes.length)]
    const complexity = complexities[Math.floor(Math.random() * complexities.length)]

    // Время приготовления зависит от сложности и типа блюда
    const baseTime = this.getBaseCookingTime(dishType, complexity)
    const estimatedCookingTimeMs = baseTime + Math.random() * 1000 // ±1сек вариация

    // Deadline зависит от типа клиента
    const deadlineOffset = this.getDeadlineOffset(customerType, complexity)
    const deadline = new Date(now.getTime() + deadlineOffset)

    // Рассчитываем базовый приоритет
    const priority = this.calculateInitialPriority(customerType, complexity, deadlineOffset, estimatedCookingTimeMs)

    return {
      orderNumber,
      customerType,
      dishType,
      complexity,
      estimatedCookingTimeMs,
      estimatedProcessingTimeMs: estimatedCookingTimeMs, // Дублируем для совместимости
      deadline,
      enqueuedAt: now,
      specialRequests: this.generateSpecialRequests(customerType),
      priority
    }
  }

  /**
   * Базовое время приготовления по типу блюда и сложности
   */
  private getBaseCookingTime(dishType: IRestaurantOrder['dishType'], complexity: IRestaurantOrder['complexity']): number {
    const baseTimes = {
      'пицца': { 'простое': 2000, 'среднее': 3000, 'сложное': 4500 },
      'бургер': { 'простое': 1500, 'среднее': 2500, 'сложное': 3500 },
      'салат': { 'простое': 1000, 'среднее': 1500, 'сложное': 2000 },
      'десерт': { 'простое': 1200, 'среднее': 2000, 'сложное': 3000 }
    }

    return baseTimes[dishType][complexity]
  }

  /**
   * Время до deadline в зависимости от типа клиента
   */
  private getDeadlineOffset(customerType: IRestaurantOrder['customerType'], complexity: IRestaurantOrder['complexity']): number {
    const baseOffset = complexity === 'сложное' ? 15000 : complexity === 'среднее' ? 10000 : 7000

    switch (customerType) {
      case 'VIP': return baseOffset * 0.7 // VIP хотят быстрее
      case 'доставка': return baseOffset * 1.5 // Доставка может подождать
      default: return baseOffset // Обычные клиенты
    }
  }

  /**
   * Начальный расчет приоритета
   */
  private calculateInitialPriority(
    customerType: IRestaurantOrder['customerType'],
    complexity: IRestaurantOrder['complexity'],
    deadlineOffset: number,
    estimatedTime: number
  ): number {
    // Базовая формула: (время до deadline) / (время приготовления)
    let priority = deadlineOffset / estimatedTime

    // Корректировка по типу клиента
    if (customerType === 'VIP') priority *= 0.5 // Повышаем приоритет VIP
    if (customerType === 'доставка') priority *= 1.2 // Понижаем приоритет доставки

    return Math.round(priority * 100) / 100 // Округляем до 2 знаков
  }

  /**
   * Генерирует специальные требования
   */
  private generateSpecialRequests(customerType: IRestaurantOrder['customerType']): string[] {
    if (customerType !== 'VIP') return []

    const vipRequests = [
      'Без лука',
      'Дополнительный сыр',
      'Острый соус',
      'Хрустящая корочка',
      'Подать горячим'
    ]

    // VIP может иметь 0-2 специальных требования
    const count = Math.floor(Math.random() * 3)
    const shuffled = vipRequests.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  /**
   * Сбрасывает счетчик заказов
   */
  reset(): void {
    this.orderCounter = 1
  }
}

/**
 * Универсальный генератор заказов ресторана
 * Поддерживает legacy режим (простые числа) и новый режим (полные заказы)
 */
export function createRestaurantOrderGenerator(
  workQueue: IEventQueue<IWorkItem>,
  restaurantQueue: IEventQueue<IRestaurantOrder> | null,
  config: IRestaurantOrderGeneratorConfig
) {
  const factory = new RestaurantOrderFactory()
  let intervalId: NodeJS.Timeout | null = null
  let ordersGenerated = 0

  return {
    /**
     * Запускает генерацию заказов
     */
    async startAsync(): Promise<void> {
      if (intervalId) return

      intervalId = setInterval(async () => {
        if (ordersGenerated >= config.maxOrders) {
          await this.stopAsync()
          return
        }

        try {
          if (config.mode === 'legacy') {
            // Старый режим - генерируем простые числа
            const workItem = factory.createLegacyOrder()
            await workQueue.enqueueAsync(workItem)

            // Логируем в старом стиле
            console.log(`📝 Генерация работы: ${workItem}`)
          } else {
            // Новый режим - генерируем полные заказы ресторана
            const restaurantOrder = factory.createRestaurantOrder()

            // Кладем в обе очереди для совместимости
            await workQueue.enqueueAsync(restaurantOrder.orderNumber)
            if (restaurantQueue) {
              await restaurantQueue.enqueueAsync(restaurantOrder)
            }

            // Логируем в ресторанном стиле
            console.log(`🍽️ Новый заказ: ${this.formatOrderLog(restaurantOrder)}`)
          }

          ordersGenerated++
        } catch (error) {
          console.error('Ошибка генерации заказа:', error)
        }
      }, config.intervalMs)
    },

    /**
     * Останавливает генерацию заказов
     */
    async stopAsync(): Promise<void> {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    },

    /**
     * Возвращает статистику генерации
     */
    getStats() {
      return {
        ordersGenerated,
        maxOrders: config.maxOrders,
        isRunning: intervalId !== null,
        mode: config.mode
      }
    },

    /**
     * Сбрасывает генератор
     */
    reset(): void {
      factory.reset()
      ordersGenerated = 0
    },

    /**
     * Форматирует лог заказа для вывода
     */
    formatOrderLog(order: IRestaurantOrder): string {
      const urgency = order.customerType === 'VIP' ? '⭐' : order.priority < 2 ? '🔥' : ''
      return `${urgency} #${order.orderNumber} ${order.dishType} (${order.customerType}, ${order.complexity}) - готовность через ~${Math.round(order.estimatedCookingTimeMs / 1000)}с`
    }
  }
} 