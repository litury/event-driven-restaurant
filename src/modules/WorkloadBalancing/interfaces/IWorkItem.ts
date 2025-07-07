/**
 * Событие работы - число от генератора
 * Автор: "Работа передается числом"
 */
export type IWorkItem = number

/**
 * Событие "я свободен" - номер рабочего
 * Автор: "Событие о том, что рабочий освободился, тоже передается числом"
 */
export type IWorkerFreeEvent = number

/**
 * Событие назначения работы рабочему
 * Автор: "Он передает событие о том, что рабочий назначен, что это пара"
 */
export interface IWorkAssignment {
    /**
     * Описание работы (число)
     */
    readonly workItem: IWorkItem

    /**
     * Номер рабочего, который свободен
     */
    readonly workerId: IWorkerFreeEvent
}

/**
 * Результат выполнения работы
 */
export interface IWorkResult {
    /**
     * Исходная работа
     */
    readonly workItem: IWorkItem

    /**
     * Результат обработки
     */
    readonly result: number

    /**
     * Время завершения
     */
    readonly completedAt: number
} 