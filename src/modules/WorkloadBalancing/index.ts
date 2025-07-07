/**
 * Модуль балансировки работы
 * Экспорт всех компонентов модуля для внешнего использования
 */

// Интерфейсы
export type * from './interfaces'

// Сервисы
export {
    createZipProcessorAsync,
    createFilterProcessorAsync,
    createWorkerProcessorAsync,
    createWorkGeneratorAsync
} from './services/workloadProcessors'

export {
    WorkloadSystem,
    createWorkloadSystem,
    type IWorkloadSystemConfig,
    type IWorkloadSystemState
} from './services/workloadSystem' 