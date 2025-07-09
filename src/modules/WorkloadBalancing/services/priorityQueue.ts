import { createEventQueue } from '../../../shared/infrastructure'
import type {
  IEventQueue,
  IPriorityQueue,
  IPriorityItem,
  IPriorityCalculator,
  IRestaurantOrder,
  IRestaurantPriorityQueue
} from '../interfaces'

/**
 * Калькулятор приоритетов для элементов
 */
export class PriorityCalculator<T extends IPriorityItem> implements IPriorityCalculator<T> {
  /**
   * Рассчитывает приоритет элемента
   * Формула: (deadline - now) / estimatedProcessingTime
   * Чем меньше результат, тем выше приоритет
   */
  calculatePriority(item: T): number {
    const now = Date.now()
    const deadlineTime = item.deadline.getTime()
    const timeToDeadline = deadlineTime - now

    // Проверяем валидность времени приготовления
    if (item.estimatedProcessingTimeMs <= 0) {
      throw new Error('Время приготовления не может быть нулевым')
    }

    // Если deadline просрочен, возвращаем максимальный приоритет
    if (timeToDeadline <= 0) {
      return Number.MAX_SAFE_INTEGER
    }

    // Основная формула приоритета
    return timeToDeadline / item.estimatedProcessingTimeMs
  }

  /**
   * Проверяет, просрочен ли элемент
   */
  isOverdue(item: T): boolean {
    const now = Date.now()
    return item.deadline.getTime() < now
  }

  /**
   * Рассчитывает время ожидания до deadline
   */
  getTimeToDeadline(item: T): number {
    const now = Date.now()
    return Math.max(0, item.deadline.getTime() - now)
  }
}

/**
 * Базовая реализация приоритетной очереди
 */
export class PriorityQueue<T extends IPriorityItem> implements IPriorityQueue<T> {
  private baseQueue: IEventQueue<T>
  private calculator: IPriorityCalculator<T>
  private items: T[] = []

  constructor(calculator: IPriorityCalculator<T>) {
    this.baseQueue = createEventQueue<T>()
    this.calculator = calculator
  }

  /**
 * Добавляет элемент в очередь (базовый метод)
 */
  async enqueueAsync(item: T): Promise<void> {
    // Пересчитываем приоритет перед добавлением
    item.priority = this.calculator.calculatePriority(item)

    this.items.push(item)
    this.sortByPriority()

    // НЕ добавляем в базовую очередь - используем только локальную для приоритетов
  }

  /**
   * Добавляет элемент с автоматическим расчетом приоритета
   */
  async enqueueWithPriority(item: T): Promise<void> {
    await this.enqueueAsync(item)
  }

  /**
 * Извлекает элемент с наивысшим приоритетом
 */
  async dequeueAsync(): Promise<T> {
    if (this.items.length === 0) {
      throw new Error('Очередь пуста')
    }

    // Пересчитываем приоритеты перед извлечением
    await this.recalculatePriorities()

    const item = this.items.shift()!
    return item
  }

  /**
   * Возвращает элемент с наивысшим приоритетом без удаления
   */
  peekHighestPriority(): T | null {
    if (this.items.length === 0) return null

    // Возвращаем первый элемент (с наивысшим приоритетом)
    return this.items[0]
  }

  /**
   * Возвращает все элементы отсортированные по приоритету
   */
  getItemsByPriority(): T[] {
    this.sortByPriority()
    return [...this.items] // Возвращаем копию
  }

  /**
   * Пересчитывает приоритеты всех элементов в очереди
   */
  async recalculatePriorities(): Promise<void> {
    for (const item of this.items) {
      item.priority = this.calculator.calculatePriority(item)
    }
    this.sortByPriority()
  }

  /**
   * Возвращает текущие элементы очереди
   */
  getItems(): T[] {
    return this.getItemsByPriority()
  }

  /**
   * Проверяет, пуста ли очередь
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * Возвращает количество элементов в очереди
   */
  size(): number {
    return this.items.length
  }

  /**
   * Сортирует элементы по приоритету (меньшее число = выше приоритет)
   */
  private sortByPriority(): void {
    this.items.sort((a, b) => a.priority - b.priority)
  }
}

/**
 * Специализированная приоритетная очередь для ресторанных заказов
 */
export class RestaurantPriorityQueue extends PriorityQueue<IRestaurantOrder> implements IRestaurantPriorityQueue {
  constructor() {
    super(new PriorityCalculator<IRestaurantOrder>())
  }

  /**
   * Получает заказы для конкретного типа блюда
   */
  getOrdersByDishType(dishType: IRestaurantOrder['dishType']): IRestaurantOrder[] {
    return this.getItemsByPriority().filter(order => order.dishType === dishType)
  }

  /**
   * Получает VIP заказы
   */
  getVipOrders(): IRestaurantOrder[] {
    return this.getItemsByPriority().filter(order => order.customerType === 'VIP')
  }

  /**
   * Получает просроченные заказы
   */
  getOverdueOrders(): IRestaurantOrder[] {
    const calculator = new PriorityCalculator<IRestaurantOrder>()
    return this.getItemsByPriority().filter(order => calculator.isOverdue(order))
  }

  /**
   * Получает статистику очереди
   */
  getQueueStats(): {
    totalOrders: number
    vipOrders: number
    overdueOrders: number
    averageWaitTime: number
    ordersByDishType: Record<string, number>
  } {
    const orders = this.getItemsByPriority()
    const now = Date.now()

    // Подсчитываем статистику
    const totalOrders = orders.length
    const vipOrders = orders.filter(o => o.customerType === 'VIP').length
    const overdueOrders = this.getOverdueOrders().length

    // Среднее время ожидания
    const totalWaitTime = orders.reduce((sum, order) => {
      return sum + (now - order.enqueuedAt.getTime())
    }, 0)
    const averageWaitTime = totalOrders > 0 ? totalWaitTime / totalOrders : 0

    // Заказы по типу блюда
    const ordersByDishType: Record<string, number> = {}
    for (const order of orders) {
      ordersByDishType[order.dishType] = (ordersByDishType[order.dishType] || 0) + 1
    }

    return {
      totalOrders,
      vipOrders,
      overdueOrders,
      averageWaitTime: Math.round(averageWaitTime),
      ordersByDishType
    }
  }
}

/**
 * Фабрика для создания приоритетных очередей
 */
export function createPriorityQueue<T extends IPriorityItem>(calculator?: IPriorityCalculator<T>): IPriorityQueue<T> {
  const calc = calculator || new PriorityCalculator<T>()
  return new PriorityQueue<T>(calc)
}

/**
 * Фабрика для создания ресторанной приоритетной очереди
 */
export function createRestaurantPriorityQueue(): IRestaurantPriorityQueue {
  return new RestaurantPriorityQueue()
} 