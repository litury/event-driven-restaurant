import type { IEventQueue, IRestaurantOrder, IChefFreeEvent } from './IWorkItem'

/**
 * Типы отказов в ресторанной системе
 * 
 * @description В событийных системах всегда случаются сбои. 
 * Важно классифицировать их для правильной обработки.
 * 
 * @example
 * ```typescript
 * // Пример обработки разных типов отказов:
 * switch (failure.type) {
 *   case 'queue_full': 
 *     // Очередь переполнена - отложить заказ
 *     break;
 *   case 'chef_unavailable':
 *     // Повар заболел - перенаправить другому
 *     break;
 *   case 'ingredients_missing':
 *     // Продукты кончились - заменить блюдо
 *     break;
 * }
 * ```
 */
export type RestaurantFailureType =
  | 'queue_full'           // Очередь переполнена (отказ очереди)
  | 'chef_unavailable'     // Повар недоступен (отказ обслуживания)
  | 'ingredients_missing'  // Нет ингредиентов (отказ ресурсов)
  | 'equipment_failure'    // Сломалось оборудование (технический отказ)
  | 'order_timeout'        // Превышен timeout заказа (временной отказ)
  | 'order_cancelled'      // Клиент отменил заказ (пользовательский отказ)

/**
 * Стратегии обработки отказов
 * 
 * @description Определяет что делать с заказом при отказе.
 * Каждая стратегия подходит для разных ситуаций.
 * 
 * @see {@link https://martinfowler.com/articles/patterns-of-resilience.html}
 * 
 * @example
 * ```typescript
 * // Примеры применения стратегий:
 * const vipOrderStrategy: FailbackStrategy = 'retry_with_escalation';
 * const normalOrderStrategy: FailbackStrategy = 'move_to_review_queue';
 * const deliveryOrderStrategy: FailbackStrategy = 'store_for_later';
 * ```
 */
export type FailbackStrategy =
  | 'retry_immediately'      // Повторить сразу (для временных сбоев)
  | 'retry_with_delay'       // Повторить с задержкой (при перегрузке)
  | 'retry_with_escalation'  // Повторить с повышением приоритета (VIP)
  | 'move_to_review_queue'   // Переместить в очередь на разбор (для анализа)
  | 'store_for_later'        // Сохранить для поздней обработки (отложить)
  | 'discard_with_log'       // Утилизировать с логированием (критические ошибки)
  | 'substitute_alternative' // Заменить альтернативным решением (другое блюдо)

/**
 * Информация об отказе в ресторанной системе
 * 
 * @description Содержит полную информацию о произошедшем сбое.
 * Используется для принятия решения о стратегии восстановления.
 * 
 * @example
 * ```typescript
 * const failure: IRestaurantFailure = {
 *   id: 'fail_001',
 *   type: 'chef_unavailable',
 *   order: vipPizzaOrder,
 *   timestamp: new Date(),
 *   errorMessage: 'Повар #1 заболел',
 *   attemptCount: 1,
 *   suggestedStrategy: 'retry_with_escalation',
 *   context: { 
 *     chefId: 1, 
 *     availableChefs: [2, 3],
 *     queueSize: 15 
 *   }
 * };
 * ```
 */
export interface IRestaurantFailure {
  /** Уникальный идентификатор отказа для трассировки */
  readonly id: string

  /** Тип отказа для классификации */
  readonly type: RestaurantFailureType

  /** Заказ, с которым произошёл сбой */
  readonly order: IRestaurantOrder

  /** Время возникновения отказа */
  readonly timestamp: Date

  /** Человекочитаемое описание ошибки */
  readonly errorMessage: string

  /** Количество попыток обработки (для retry логики) */
  readonly attemptCount: number

  /** Рекомендуемая стратегия восстановления */
  readonly suggestedStrategy: FailbackStrategy

  /** Дополнительный контекст для принятия решений */
  readonly context?: Record<string, any>

  /** Исходная техническая ошибка (если есть) */
  readonly originalError?: Error
}

/**
 * Интерфейс обработчика отказов
 * 
 * @description Основной компонент для управления сбоями в системе.
 * Реализует паттерн Circuit Breaker для предотвращения каскадных отказов.
 * 
 * @see {@link https://microservices.io/patterns/reliability/circuit-breaker.html}
 * 
 * @example
 * ```typescript
 * // Создание обработчика отказов:
 * const errorHandler = createRestaurantErrorHandler({
 *   maxRetryAttempts: 3,
 *   retryDelayMs: 1000,
 *   circuitBreakerThreshold: 5
 * });
 * 
 * // Обработка отказа:
 * try {
 *   await chef.cookOrder(order);
 * } catch (error) {
 *   await errorHandler.handleFailure(order, error);
 * }
 * ```
 */
export interface IRestaurantErrorHandler {
  /**
   * Обрабатывает отказ заказа
   * 
   * @param order - заказ, с которым произошёл сбой
   * @param error - техническая ошибка (опционально)
   * @param context - дополнительный контекст
   * @returns Promise с информацией об обработанном отказе
   * 
   * @example
   * ```typescript
   * const failure = await errorHandler.handleFailure(
   *   pizzaOrder, 
   *   new Error('Oven is broken'),
   *   { chefId: 1, ovenId: 'main' }
   * );
   * console.log(`Отказ ${failure.id} обработан стратегией: ${failure.suggestedStrategy}`);
   * ```
   */
  handleFailure(
    order: IRestaurantOrder,
    error?: Error,
    context?: Record<string, any>
  ): Promise<IRestaurantFailure>

  /**
   * Выполняет стратегию восстановления
   * 
   * @param failure - информация об отказе
   * @returns Promise<boolean> - true если восстановление успешно
   * 
   * @example
   * ```typescript
   * const success = await errorHandler.executeStrategy(failure);
   * if (success) {
   *   console.log('✅ Заказ восстановлен');
   * } else {
   *   console.log('❌ Не удалось восстановить заказ');
   * }
   * ```
   */
  executeStrategy(failure: IRestaurantFailure): Promise<boolean>

  /**
   * Получает статистику отказов
   * 
   * @returns статистика для мониторинга системы
   * 
   * @example
   * ```typescript
   * const stats = errorHandler.getFailureStats();
   * console.log(`Отказов за час: ${stats.failuresLastHour}`);
   * console.log(`Самый частый тип: ${stats.mostCommonFailureType}`);
   * ```
   */
  getFailureStats(): {
    totalFailures: number
    failuresLastHour: number
    failuresByType: Record<RestaurantFailureType, number>
    mostCommonFailureType: RestaurantFailureType
    averageRecoveryTime: number
    successfulRecoveries: number
  }

  /**
   * Проверяет состояние Circuit Breaker
   * 
   * @param operationType - тип операции для проверки
   * @returns true если операция разрешена
   * 
   * @description Circuit Breaker предотвращает каскадные отказы,
   * временно блокируя операции при частых сбоях.
   * 
   * @example
   * ```typescript
   * if (errorHandler.isOperationAllowed('cooking')) {
   *   await chef.cookOrder(order);
   * } else {
   *   console.log('🚫 Приготовление временно заблокировано');
   *   await alternativeStrategy(order);
   * }
   * ```
   */
  isOperationAllowed(operationType: string): boolean
}

/**
 * Специализированные очереди для обработки отказов
 * 
 * @description Набор очередей для разных стратегий восстановления.
 * Позволяет организовать систематическую обработку сбоев.
 * 
 * @example
 * ```typescript
 * // Использование специализированных очередей:
 * const queues = createErrorHandlingQueues();
 * 
 * // При отказе - направляем в соответствующую очередь:
 * if (failure.type === 'chef_unavailable') {
 *   await queues.retryQueue.enqueueAsync(failure.order);
 * } else if (failure.type === 'ingredients_missing') {
 *   await queues.reviewQueue.enqueueAsync(failure.order);
 * }
 * ```
 */
export interface IErrorHandlingQueues {
  /** 
   * Очередь для повторных попыток
   * @description Заказы, которые будут повторно обработаны через некоторое время
   */
  retryQueue: IEventQueue<IRestaurantOrder>

  /** 
   * Очередь для ручного разбора
   * @description Заказы, требующие вмешательства менеджера
   */
  reviewQueue: IEventQueue<IRestaurantOrder>

  /** 
   * Очередь отложенных заказов
   * @description Заказы, которые будут обработаны позже (например, при доставке ингредиентов)
   */
  deferredQueue: IEventQueue<IRestaurantOrder>

  /** 
   * Dead Letter Queue - "кладбище" заказов
   * @description Заказы, которые не удалось обработать после всех попыток
   */
  deadLetterQueue: IEventQueue<IRestaurantFailure>

  /** 
   * Очередь альтернативных решений
   * @description Заказы, для которых предложена замена (другое блюдо)
   */
  substitutionQueue: IEventQueue<{
    originalOrder: IRestaurantOrder
    suggestedAlternative: IRestaurantOrder
    reason: string
  }>
}

/**
 * Конфигурация системы обработки ошибок
 * 
 * @description Настройки для тонкой настройки поведения при отказах.
 * Позволяет адаптировать систему под требования ресторана.
 * 
 * @example
 * ```typescript
 * const config: IErrorHandlingConfig = {
 *   maxRetryAttempts: 3,
 *   retryDelayMs: 2000,
 *   circuitBreakerThreshold: 10,
 *   circuitBreakerTimeoutMs: 30000,
 *   enableDeadLetterQueue: true,
 *   vipOrderRetryMultiplier: 2,
 *   logFailures: true
 * };
 * ```
 */
export interface IErrorHandlingConfig {
  /** Максимальное количество попыток повтора */
  maxRetryAttempts: number

  /** Задержка между попытками (мс) */
  retryDelayMs: number

  /** Порог срабатывания Circuit Breaker (количество отказов) */
  circuitBreakerThreshold: number

  /** Время блокировки Circuit Breaker (мс) */
  circuitBreakerTimeoutMs: number

  /** Включить Dead Letter Queue */
  enableDeadLetterQueue: boolean

  /** Множитель попыток для VIP заказов */
  vipOrderRetryMultiplier: number

  /** Логировать все отказы */
  logFailures: boolean

  /** 
   * Кастомные стратегии для типов отказов
   * @description Позволяет переопределить стандартные стратегии
   */
  customStrategies?: Partial<Record<RestaurantFailureType, FailbackStrategy>>
} 