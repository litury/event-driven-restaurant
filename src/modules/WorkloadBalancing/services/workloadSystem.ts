import { createEventQueue } from '../../../shared/infrastructure'
import type {
    IEventQueue,
    IWorkItem,
    IWorkerFreeEvent,
    IWorkAssignment,
    IWorkResult
} from '../interfaces'
import {
    createZipProcessorAsync,
    createFilterProcessorAsync,
    createWorkerProcessorAsync,
    createWorkGeneratorAsync
} from './workloadProcessors'

/**
 * Конфигурация системы балансировки работы
 */
export interface IWorkloadSystemConfig {
    /** Интервал генерации работ в миллисекундах */
    workGenerationIntervalMs: number
    /** Максимальное количество работ */
    maxWorks: number
    /** Автоматически запускать систему */
    autoStart: boolean
}

/**
 * Состояние системы балансировки работы
 */
export interface IWorkloadSystemState {
    /** Запущена ли система */
    isRunning: boolean
    /** Количество сгенерированных работ */
    generatedWorks: number
    /** Количество обработанных работ */
    processedWorks: number
    /** Все очереди системы для визуализации */
    queues: {
        workQueue: IEventQueue<IWorkItem>
        freeWorkersQueue: IEventQueue<IWorkerFreeEvent>
        assignmentQueue: IEventQueue<IWorkAssignment>
        worker1Queue: IEventQueue<IWorkItem>
        worker2Queue: IEventQueue<IWorkItem>
        resultQueue: IEventQueue<IWorkResult>
    }
}

/**
 * Система балансировки работы
 * Автор: "Система из 4 участков с 5 очередями событий"
 */
export class WorkloadSystem {
    private p_config: IWorkloadSystemConfig
    private p_state: IWorkloadSystemState
    private p_workGenerator: ReturnType<typeof createWorkGeneratorAsync> | null = null
    private p_processingLoops: Promise<void>[] = []
    private p_shouldStop = false

    constructor(_config: Partial<IWorkloadSystemConfig> = {}) {
        // Конфигурация по умолчанию
        this.p_config = {
            workGenerationIntervalMs: 800, // Быстрее для ресторана!
            maxWorks: 200, // Больше заказов!
            autoStart: false,
            ..._config
        }

        // Создаем все 5 очередей системы
        this.p_state = {
            isRunning: false,
            generatedWorks: 0,
            processedWorks: 0,
            queues: {
                workQueue: createEventQueue<IWorkItem>(),
                freeWorkersQueue: createEventQueue<IWorkerFreeEvent>(),
                assignmentQueue: createEventQueue<IWorkAssignment>(),
                worker1Queue: createEventQueue<IWorkItem>(),
                worker2Queue: createEventQueue<IWorkItem>(),
                resultQueue: createEventQueue<IWorkResult>()
            }
        }

        // Автоматический запуск если настроен
        if (this.p_config.autoStart) {
            this.startAsync()
        }
    }

    /**
     * Запускает всю систему балансировки работы
     */
    async startAsync(): Promise<void> {
        if (this.p_state.isRunning) {
            return
        }

        this.p_state.isRunning = true
        this.p_shouldStop = false

        // Инициализируем рабочих как свободных
        await this.p_state.queues.freeWorkersQueue.enqueueAsync(1)
        await this.p_state.queues.freeWorkersQueue.enqueueAsync(2)

        // Запускаем генератор работ
        this.p_workGenerator = createWorkGeneratorAsync(
            this.p_state.queues.workQueue,
            this.p_config.workGenerationIntervalMs,
            this.p_config.maxWorks
        )
        await this.p_workGenerator.startAsync()

        // Запускаем все процессоры в бесконечных циклах
        this.p_processingLoops = [
            this.runZipProcessorLoopAsync(),
            this.runFilterProcessorLoopAsync(),
            this.runWorker1ProcessorLoopAsync(),
            this.runWorker2ProcessorLoopAsync()
        ]
    }

    /**
     * Останавливает всю систему
     */
    async stopAsync(): Promise<void> {
        if (!this.p_state.isRunning) {
            return
        }

        console.log('🛑 Начинаем остановку системы...')
        this.p_shouldStop = true
        this.p_state.isRunning = false

        // Останавливаем генератор
        if (this.p_workGenerator) {
            console.log('⏹️ Останавливаем генератор работ...')
            await this.p_workGenerator.stopAsync()
            console.log('✅ Генератор остановлен')
        }

        // Ждем завершения всех циклов обработки
        console.log('⏳ Ждем завершения процессоров...')
        try {
            await Promise.all(this.p_processingLoops)
            console.log('✅ Все процессоры остановлены')
        } catch (error) {
            console.error('❌ Ошибка при остановке процессоров:', error)
        }

        console.log('✅ Система полностью остановлена')
    }

    /**
     * Возвращает текущее состояние системы
     */
    getState(): Readonly<IWorkloadSystemState> {
        // Обновляем счетчик сгенерированных работ из генератора
        if (this.p_workGenerator) {
            this.p_state.generatedWorks = this.p_workGenerator.getCurrentWorkCount()
        }

        return { ...this.p_state }
    }

    /**
     * Цикл обработки ZIP-процессора
     */
    private async runZipProcessorLoopAsync(): Promise<void> {
        while (!this.p_shouldStop) {
            try {
                await createZipProcessorAsync(
                    this.p_state.queues.workQueue,
                    this.p_state.queues.freeWorkersQueue,
                    this.p_state.queues.assignmentQueue
                )
            } catch (error) {
                console.error('Ошибка в ZIP-процессоре:', error)
                // Небольшая задержка перед повтором
                await new Promise(_resolve => setTimeout(_resolve, 100))
            }
        }
    }

    /**
     * Цикл обработки фильтра
     */
    private async runFilterProcessorLoopAsync(): Promise<void> {
        while (!this.p_shouldStop) {
            try {
                await createFilterProcessorAsync(
                    this.p_state.queues.assignmentQueue,
                    this.p_state.queues.worker1Queue,
                    this.p_state.queues.worker2Queue
                )
            } catch (error) {
                console.error('Ошибка в фильтре:', error)
                await new Promise(_resolve => setTimeout(_resolve, 100))
            }
        }
    }

    /**
     * Цикл обработки рабочего 1
     */
    private async runWorker1ProcessorLoopAsync(): Promise<void> {
        while (!this.p_shouldStop) {
            try {
                await createWorkerProcessorAsync(
                    this.p_state.queues.worker1Queue,
                    this.p_state.queues.freeWorkersQueue,
                    this.p_state.queues.resultQueue,
                    1
                )
                this.p_state.processedWorks++
            } catch (error) {
                console.error('Ошибка в рабочем 1:', error)
                await new Promise(_resolve => setTimeout(_resolve, 100))
            }
        }
    }

    /**
     * Цикл обработки рабочего 2
     */
    private async runWorker2ProcessorLoopAsync(): Promise<void> {
        while (!this.p_shouldStop) {
            try {
                await createWorkerProcessorAsync(
                    this.p_state.queues.worker2Queue,
                    this.p_state.queues.freeWorkersQueue,
                    this.p_state.queues.resultQueue,
                    2
                )
                this.p_state.processedWorks++
            } catch (error) {
                console.error('Ошибка в рабочем 2:', error)
                await new Promise(_resolve => setTimeout(_resolve, 100))
            }
        }
    }
}

/**
 * Функциональная фабрика для создания системы
 */
export const createWorkloadSystem = (_config?: Partial<IWorkloadSystemConfig>): WorkloadSystem => {
    return new WorkloadSystem(_config)
} 