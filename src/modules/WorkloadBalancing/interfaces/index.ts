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

// 🔄 Новые интерфейсы для ДЗ-3: Событийная синхронизация
export type {
    IDataRecord,
    ChangeEventType,
    IChangeEvent,
    IAddEvent,
    IRemoveEvent,
    IChangeFieldEvent,
    DataChangeEvent,
    IDataAPI,
    IChangeLog,
    IFileSystemState,
    IFileSystemSync,
    ISyncSystemConfig,
    ISyncResult
} from './ISyncDataModel'

// 🍔 ДЗ-3: Ресторанная адаптация событийной синхронизации
export type {
    IRestaurantOrder,
    RestaurantEventType,
    IRestaurantEvent,
    IOrderAddedEvent,
    IOrderRemovedEvent,
    IOrderModifiedEvent,
    IStatusChangedEvent,
    RestaurantChangeEvent,
    IRestaurantZoneAPI,
    IKitchenChangeLog,
    IRestaurantZoneState,
    IRestaurantZoneSync,
    IRestaurantSyncConfig,
    IRestaurantSyncResult
} from './IRestaurantSyncModel'
} from './IErrorHandling' 