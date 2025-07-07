import type { IEventQueue } from './IEventQueue'
import type { IWorkItem, IWorkerFreeEvent, IWorkAssignment, IWorkResult } from './IWorkItem'

/**
 * Функциональные интерфейсы для процессоров
 * Используем чистые функции вместо классов для лучшей тестируемости
 */

/**
 * Функция ZIP-процессора
 * Объединяет события работ и рабочих в назначения
 */
export type ZipProcessorFunction = (
    workQueue: IEventQueue<IWorkItem>,
    freeWorkersQueue: IEventQueue<IWorkerFreeEvent>,
    assignmentQueue: IEventQueue<IWorkAssignment>
) => Promise<void>

/**
 * Функция фильтра-процессора  
 * Распределяет назначения по очередям рабочих
 */
export type FilterProcessorFunction = (
    assignmentQueue: IEventQueue<IWorkAssignment>,
    worker1Queue: IEventQueue<IWorkItem>,
    worker2Queue: IEventQueue<IWorkItem>
) => Promise<void>

/**
 * Функция рабочего-процессора
 * Обрабатывает работу и формирует результат
 */
export type WorkerProcessorFunction = (
    workQueue: IEventQueue<IWorkItem>,
    freeWorkersQueue: IEventQueue<IWorkerFreeEvent>,
    resultQueue: IEventQueue<IWorkResult>,
    workerId: number
) => Promise<void>

/**
 * Функция генератора работы
 * Создает новые задания с интервалом
 */
export type WorkGeneratorFunction = (
    workQueue: IEventQueue<IWorkItem>,
    intervalMs: number
) => Promise<void>

/**
 * Конфигурация системы балансировки
 */
export interface IWorkloadBalancingConfig {
    /**
     * Интервал генерации работы (мс)
     */
    readonly workGenerationIntervalMs: number

    /**
     * Время выполнения работы рабочим (мс)
     */
    readonly workProcessingTimeMs: number

    /**
     * Количество рабочих
     */
    readonly numberOfWorkers: number
} 