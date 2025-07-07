import type { IEventQueue, IWorkItem, IWorkerFreeEvent, IWorkResult } from '../interfaces'

/**
 * Тесты для рабочего-процессора
 * Автор: "Рабочий берет из очереди на работу элемент и обрабатывает его"
 */

describe('WorkerProcessor', () => {
    let workQueue: IEventQueue<IWorkItem>
    let freeWorkersQueue: IEventQueue<IWorkerFreeEvent>
    let resultQueue: IEventQueue<IWorkResult>
    const workerId = 1

    // Мок-реализация очереди
    class MockEventQueue<T> implements IEventQueue<T> {
        private items: T[] = []
        private waitingReaders: Array<(value: T) => void> = []

        async enqueueAsync(item: T): Promise<void> {
            this.items.push(item)
            if (this.waitingReaders.length > 0) {
                const resolve = this.waitingReaders.shift()!
                resolve(this.items.shift()!)
            }
        }

        async dequeueAsync(): Promise<T> {
            if (this.items.length > 0) {
                return this.items.shift()!
            }

            return new Promise<T>(resolve => {
                this.waitingReaders.push(resolve)
            })
        }

        getItems(): T[] {
            return [...this.items]
        }

        isEmpty(): boolean {
            return this.items.length === 0
        }

        size(): number {
            return this.items.length
        }
    }

    // Простая реализация рабочего
    const createWorkerProcessor = (
        workQueue: IEventQueue<IWorkItem>,
        freeWorkersQueue: IEventQueue<IWorkerFreeEvent>,
        resultQueue: IEventQueue<IWorkResult>,
        workerId: number
    ) => {
        return async (): Promise<void> => {
            const workItem = await workQueue.dequeueAsync()

            const result: IWorkResult = {
                workItem,
                result: workItem * 2,
                completedAt: Date.now()
            }

            await resultQueue.enqueueAsync(result)
            await freeWorkersQueue.enqueueAsync(workerId)
        }
    }

    beforeEach(() => {
        workQueue = new MockEventQueue<IWorkItem>()
        freeWorkersQueue = new MockEventQueue<IWorkerFreeEvent>()
        resultQueue = new MockEventQueue<IWorkResult>()
    })

    it('должен обрабатывать работу и создавать результат', async () => {
        // given - работа в очереди
        await workQueue.enqueueAsync(42)

        // when - запускаем рабочего
        const workerProcessor = createWorkerProcessor(workQueue, freeWorkersQueue, resultQueue, workerId)
        await workerProcessor()

        // then - работа обработана
        expect(resultQueue.size()).toBe(1)
        expect(freeWorkersQueue.size()).toBe(1)

        const result = await resultQueue.dequeueAsync()
        expect(result.workItem).toBe(42)
        expect(result.result).toBe(84)

        const freeEvent = await freeWorkersQueue.dequeueAsync()
        expect(freeEvent).toBe(workerId)
    })

    it('должен ждать работу если очередь пуста', async () => {
        // given - пустая очередь
        const workerProcessor = createWorkerProcessor(workQueue, freeWorkersQueue, resultQueue, workerId)
        let completed = false

        // when - запускаем рабочего
        const processingPromise = workerProcessor().then(() => {
            completed = true
        })

        // then - рабочий заблокирован
        await new Promise(resolve => setTimeout(resolve, 10))
        expect(completed).toBe(false)

        // when - добавляем работу
        await workQueue.enqueueAsync(42)
        await processingPromise

        // then - рабочий разблокирован
        expect(completed).toBe(true)
        expect(resultQueue.size()).toBe(1)
    })

    it('должен обрабатывать несколько работ', async () => {
        // given - несколько работ
        const works = [1, 2, 3]
        for (const work of works) {
            await workQueue.enqueueAsync(work)
        }

        // when - обрабатываем все
        const workerProcessor = createWorkerProcessor(workQueue, freeWorkersQueue, resultQueue, workerId)

        for (let i = 0; i < works.length; i++) {
            await workerProcessor()
        }

        // then - все обработаны
        expect(resultQueue.size()).toBe(3)
        expect(freeWorkersQueue.size()).toBe(3)
    })
}) 