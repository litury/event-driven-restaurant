/**
 * Интерфейсы модуля балансировки работы
 * Экспорт всех интерфейсов для удобного импорта
 */

export type { IEventQueue } from './IEventQueue'
export type {
    IWorkItem,
    IWorkerFreeEvent,
    IWorkAssignment,
    IWorkResult
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