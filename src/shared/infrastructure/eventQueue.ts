import type { IEventQueue } from '../../modules/WorkloadBalancing/interfaces'

/**
 * Реализация очереди событий на основе массива с асинхронными операциями
 * 
 * @description Очередь - это фиксирующее оборудование для событий
 * @template T - тип событий в очереди
 */
export class EventQueue<T> implements IEventQueue<T> {
    private p_items: T[] = []
    private p_waitingReaders: Array<(value: T) => void> = []

    /**
     * Добавляет событие в очередь
     * Если есть ожидающие читатели, сразу передает им событие
     */
    async enqueueAsync(_item: T): Promise<void> {
        this.p_items.push(_item)

        // Если есть ожидающие читатели, сразу передаем им событие
        if (this.p_waitingReaders.length > 0) {
            const resolve = this.p_waitingReaders.shift()!
            resolve(this.p_items.shift()!)
        }
    }

    /**
     * Извлекает событие из очереди
     * Блокируется если очередь пуста до появления события
     */
    async dequeueAsync(): Promise<T> {
        // Если есть элементы, возвращаем сразу
        if (this.p_items.length > 0) {
            return this.p_items.shift()!
        }

        // Иначе ждем появления элемента
        return new Promise<T>(_resolve => {
            this.p_waitingReaders.push(_resolve)
        })
    }

    /**
     * Возвращает копию текущих элементов для визуализации
     * Не изменяет состояние очереди
     */
    getItems(): T[] {
        return [...this.p_items]
    }

    /**
     * Проверяет пустая ли очередь
     */
    isEmpty(): boolean {
        return this.p_items.length === 0
    }

    /**
     * Возвращает количество элементов в очереди
     */
    size(): number {
        return this.p_items.length
    }
}

/**
 * Функциональная фабрика для создания очереди событий
 * @returns новая очередь событий
 */
export const createEventQueue = <T>(): IEventQueue<T> => {
    return new EventQueue<T>()
} 