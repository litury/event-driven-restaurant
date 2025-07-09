import type { IEventQueue } from './IEventQueue'
import type { IRestaurantOrder } from './IWorkItem'

/**
 * Интерфейс приоритетной очереди
 * Расширяет базовую очередь возможностями приоритизации
 */
export interface IPriorityQueue<T extends IPriorityItem> extends IEventQueue<T> {
  /**
   * Добавляет элемент в очередь с автоматическим расчетом приоритета
   * @param item - элемент для добавления
   */
  enqueueWithPriority(item: T): Promise<void>

  /**
   * Возвращает элемент с наивысшим приоритетом без удаления
   * @returns элемент с наивысшим приоритетом или null
   */
  peekHighestPriority(): T | null

  /**
   * Возвращает все элементы отсортированные по приоритету
   * @returns массив элементов по убыванию приоритета
   */
  getItemsByPriority(): T[]

  /**
   * Пересчитывает приоритеты всех элементов в очереди
   * Полезно когда время меняется и deadline приближается
   */
  recalculatePriorities(): Promise<void>
}

/**
 * Базовый интерфейс для элементов с приоритетом
 */
export interface IPriorityItem {
  /** Рассчитанный приоритет (чем меньше число, тем выше приоритет) */
  priority: number
  /** Время постановки в очередь */
  enqueuedAt: Date
  /** Крайний срок */
  deadline: Date
  /** Расчетное время обработки */
  estimatedProcessingTimeMs: number
}

/**
 * Интерфейс калькулятора приоритетов
 */
export interface IPriorityCalculator<T extends IPriorityItem> {
  /**
   * Рассчитывает приоритет для элемента
   * Формула: (deadline - now) / estimatedProcessingTime
   * Чем меньше результат, тем выше приоритет
   */
  calculatePriority(item: T): number

  /**
   * Проверяет, просрочен ли элемент
   */
  isOverdue(item: T): boolean

  /**
   * Рассчитывает время ожидания до deadline
   */
  getTimeToDeadline(item: T): number
}

/**
 * Специализированный интерфейс для приоритетной очереди ресторана
 */
export interface IRestaurantPriorityQueue extends IPriorityQueue<IRestaurantOrder> {
  /**
   * Получает заказы для конкретного типа блюда
   */
  getOrdersByDishType(dishType: IRestaurantOrder['dishType']): IRestaurantOrder[]

  /**
   * Получает VIP заказы
   */
  getVipOrders(): IRestaurantOrder[]

  /**
   * Получает просроченные заказы
   */
  getOverdueOrders(): IRestaurantOrder[]

  /**
   * Получает статистику очереди
   */
  getQueueStats(): {
    totalOrders: number
    vipOrders: number
    overdueOrders: number
    averageWaitTime: number
    ordersByDishType: Record<string, number>
  }
} 