import type { IEventQueue } from './IEventQueue'
import type { IWorkItem, IWorkerFreeEvent, IWorkAssignment, IWorkResult } from './IWorkItem'

/**
 * Базовый интерфейс для участка системы
 * Автор: "У них есть входящие (upstream) и исходящие (downstream) потоки"
 */
export interface IWorkProcessor {
    /**
     * Запускает обработку участка
     * Автор: "Интерфейс из разряда run-async"
     */
    runAsync(): Promise<void>

    /**
     * Останавливает обработку участка
     */
    stopAsync(): Promise<void>
}

/**
 * ZIP-процессор - объединяет потоки работ и рабочих
 * Автор: "ZIP комбинирует их, перекладывает это в назначенных рабочих"
 */
export interface IZipProcessor extends IWorkProcessor {
    /**
     * Создает ZIP-процессор
     * @param workQueue - очередь работ (upstream)
     * @param freeWorkersQueue - очередь "я свободен" (upstream)  
     * @param assignmentQueue - очередь назначений (downstream)
     */
    new(
        workQueue: IEventQueue<IWorkItem>,
        freeWorkersQueue: IEventQueue<IWorkerFreeEvent>,
        assignmentQueue: IEventQueue<IWorkAssignment>
    ): IZipProcessor
}

/**
 * Фильтр-процессор - распределяет работу по рабочим
 * Автор: "Фильтр получает назначенную работу и отдает это в очереди на двух рабочих"
 */
export interface IFilterProcessor extends IWorkProcessor {
    /**
     * Создает фильтр-процессор
     * @param assignmentQueue - очередь назначений (upstream)
     * @param worker1Queue - очередь рабочего 1 (downstream)
     * @param worker2Queue - очередь рабочего 2 (downstream)
     */
    new(
        assignmentQueue: IEventQueue<IWorkAssignment>,
        worker1Queue: IEventQueue<IWorkItem>,
        worker2Queue: IEventQueue<IWorkItem>
    ): IFilterProcessor
}

/**
 * Рабочий-процессор - выполняет работу
 * Автор: "Рабочий берет из очереди на работу элемент и обрабатывает его"
 */
export interface IWorkerProcessor extends IWorkProcessor {
    /**
     * Создает рабочего-процессора
     * @param workQueue - очередь работ для рабочего (upstream)
     * @param freeWorkersQueue - очередь "я свободен" (downstream)
     * @param resultQueue - очередь результатов (downstream)
     * @param workerId - номер рабочего
     */
    new(
        workQueue: IEventQueue<IWorkItem>,
        freeWorkersQueue: IEventQueue<IWorkerFreeEvent>,
        resultQueue: IEventQueue<IWorkResult>,
        workerId: number
    ): IWorkerProcessor
} 