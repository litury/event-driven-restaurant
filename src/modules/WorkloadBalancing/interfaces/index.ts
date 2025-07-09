/**
 * Интерфейсы модуля балансировки работы
 * Экспорт всех интерфейсов для удобного импорта
 */

export type { IEventQueue } from './IEventQueue'
export type {
    IWorkItem,
    IRestaurantOrder,
    IWorkerFreeEvent,
    IChefFreeEvent,
    IWorkAssignment,
    IRestaurantAssignment,
    IWorkResult,
    IRestaurantResult
} from './IWorkItem'

export type {
    IWorkProcessor,
    IZipProcessor,
    IFilterProcessor,
    IWorkerProcessor
} from './IWorkProcessor'

export type {
    ZipProcessorFunction,
    FilterProcessorFunction,
    WorkerProcessorFunction,
    WorkGeneratorFunction,
    IWorkloadBalancingConfig
} from './IFunctionalProcessors' 

// 🆕 Новые интерфейсы для приоритетных очередей
export type {
    IPriorityQueue,
    IPriorityItem,
    IPriorityCalculator,
    IRestaurantPriorityQueue
} from './IPriorityQueue'

// 🛡️ Интерфейсы для обработки отказов
export type {
    RestaurantFailureType,
    FailbackStrategy,
    IRestaurantFailure,
    IRestaurantErrorHandler,
    IErrorHandlingQueues,
    IErrorHandlingConfig
} from './IErrorHandling' 