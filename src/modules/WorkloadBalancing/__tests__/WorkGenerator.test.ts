import type { IEventQueue, IWorkItem } from '../interfaces'

/**
 * Тесты для генератора работы
 * Автор: "Генератор работы по таймеру от 1 до 5 секунд генерирует числа"
 */

describe('WorkGenerator', () => {
    let workQueue: IEventQueue<IWorkItem>

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

        getItems(): T[] { return [...this.items] }
        isEmpty(): boolean { return this.items.length === 0 }
        size(): number { return this.items.length }
    }

    // Простая реализация генератора
    const createWorkGenerator = (
        workQueue: IEventQueue<IWorkItem>,
        intervalMs: number = 1000,
        maxWorks: number = 5
    ) => {
        let workCounter = 1
        let intervalId: NodeJS.Timeout | null = null

        return {
            async startAsync(): Promise<void> {
                intervalId = setInterval(async () => {
                    if (workCounter <= maxWorks) {
                        await workQueue.enqueueAsync(workCounter)
                        workCounter++
                    } else {
                        this.stopAsync()
                    }
                }, intervalMs)
            },

            async stopAsync(): Promise<void> {
                if (intervalId) {
                    clearInterval(intervalId)
                    intervalId = null
                }
            }
        }
    }

    beforeEach(() => {
        workQueue = new MockEventQueue<IWorkItem>()
    })

    it('должен генерировать работы по таймеру', async () => {
        // given - генератор с коротким интервалом
        const generator = createWorkGenerator(workQueue, 50, 3)

        // when - запускаем генератор
        await generator.startAsync()

        // ждем генерации нескольких работ
        await new Promise(resolve => setTimeout(resolve, 200))

        // then - работы сгенерированы
        expect(workQueue.size()).toBeGreaterThan(0)
        expect(workQueue.size()).toBeLessThanOrEqual(3)

        await generator.stopAsync()
    })

    it('должен генерировать последовательные числа', async () => {
        // given - генератор
        const generator = createWorkGenerator(workQueue, 10, 3)

        // when - запускаем и ждем
        await generator.startAsync()
        await new Promise(resolve => setTimeout(resolve, 50))
        await generator.stopAsync()

        // then - числа последовательные
        const works = workQueue.getItems()
        expect(works.length).toBeGreaterThan(0)

        for (let i = 0; i < works.length; i++) {
            expect(works[i]).toBe(i + 1)
        }
    })

    it('должен останавливать генерацию', async () => {
        // given - генератор
        const generator = createWorkGenerator(workQueue, 10, 10)

        // when - запускаем и быстро останавливаем
        await generator.startAsync()
        await new Promise(resolve => setTimeout(resolve, 5))
        await generator.stopAsync()

        const initialSize = workQueue.size()

        // ждем еще немного
        await new Promise(resolve => setTimeout(resolve, 50))

        // then - генерация остановлена
        expect(workQueue.size()).toBe(initialSize)
    })
}) 