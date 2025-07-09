/**
 * Базовый тип работы - остается для обратной совместимости
 */
export type IWorkItem = number

/**
 * Расширенный заказ ресторана с приоритетами
 */
export interface IRestaurantOrder {
    /** Номер заказа (как был IWorkItem) */
    orderNumber: number

    /** Тип клиента - влияет на приоритет */
    customerType: 'VIP' | 'обычный' | 'доставка'

    /** Тип блюда - определяет к какому повару идет */
    dishType: 'пицца' | 'бургер' | 'салат' | 'десерт'

    /** Сложность приготовления */
    complexity: 'простое' | 'среднее' | 'сложное'

    /** Расчетное время приготовления (мс) */
    estimatedCookingTimeMs: number

    /** Расчетное время обработки (для совместимости с IPriorityItem) */
    estimatedProcessingTimeMs: number

    /** Крайний срок готовности */
    deadline: Date

    /** Время поступления заказа */
    enqueuedAt: Date

    /** Специальные требования клиента */
    specialRequests?: string[]

    /** Рассчитанный приоритет (чем меньше, тем важнее) */
    priority: number
}

/**
 * Событие назначения заказа повару
 * Автор: "ZIP комбинирует работу и рабочего"
 */
export interface IWorkAssignment {
    workItem: IWorkItem
    workerId: number
}

/**
 * Расширенное назначение для ресторана
 */
export interface IRestaurantAssignment {
    order: IRestaurantOrder
    chefId: number
    assignedAt: Date
}

/**
 * Событие "я свободен" от рабочего
 */
export type IWorkerFreeEvent = number

/**
 * Событие "повар свободен" 
 */
export interface IChefFreeEvent {
    chefId: number
    specialization: 'пицца' | 'бургер' | 'универсал'
    freedAt: Date
}

/**
 * Результат работы
 */
export interface IWorkResult {
    workItem: IWorkItem
    result: number
    completedAt: number
}

/**
 * Результат приготовления в ресторане
 */
export interface IRestaurantResult {
    order: IRestaurantOrder
    chefId: number
    actualCookingTimeMs: number
    quality: 'отлично' | 'хорошо' | 'приемлемо'
    completedAt: Date
    notes?: string
} 