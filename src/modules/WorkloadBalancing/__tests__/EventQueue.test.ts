import type { IEventQueue } from '../interfaces'

/**
 * Тесты для IEventQueue
 * Автор: "Сделай тесты, 20 или 10 тестов, на всякие хитрые комбинации"
 * Используем given-when-then подход
 */

describe('IEventQueue', () => {
    let eventQueue: IEventQueue<number>

    // Мок-реализация для тестирования интерфейса
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

    beforeEach(() => {
        eventQueue = new MockEventQueue<number>()
    })

    describe('Базовые операции с очередью', () => {
        it('должна создаваться пустой', () => {
            // given - новая очередь
            // when - проверяем состояние
            // then - очередь пуста
            expect(eventQueue.isEmpty()).toBe(true)
            expect(eventQueue.size()).toBe(0)
            expect(eventQueue.getItems()).toEqual([])
        })

        it('должна добавлять элемент в очередь', async () => {
            // given - пустая очередь
            // when - добавляем элемент
            await eventQueue.enqueueAsync(42)

            // then - элемент в очереди
            expect(eventQueue.isEmpty()).toBe(false)
            expect(eventQueue.size()).toBe(1)
            expect(eventQueue.getItems()).toEqual([42])
        })

        it('должна извлекать элемент из очереди', async () => {
            // given - очередь с элементом
            await eventQueue.enqueueAsync(42)

            // when - извлекаем элемент
            const item = await eventQueue.dequeueAsync()

            // then - получили правильный элемент, очередь пуста
            expect(item).toBe(42)
            expect(eventQueue.isEmpty()).toBe(true)
            expect(eventQueue.size()).toBe(0)
        })
    })

    describe('FIFO порядок обработки', () => {
        it('должна соблюдать FIFO порядок', async () => {
            // given - очередь с несколькими элементами
            await eventQueue.enqueueAsync(1)
            await eventQueue.enqueueAsync(2)
            await eventQueue.enqueueAsync(3)

            // when - извлекаем элементы
            const first = await eventQueue.dequeueAsync()
            const second = await eventQueue.dequeueAsync()
            const third = await eventQueue.dequeueAsync()

            // then - порядок FIFO соблюден
            expect(first).toBe(1)
            expect(second).toBe(2)
            expect(third).toBe(3)
        })

        it('должна правильно показывать размер при добавлении', async () => {
            // given - пустая очередь
            expect(eventQueue.size()).toBe(0)

            // when - добавляем элементы по одному
            await eventQueue.enqueueAsync(1)
            expect(eventQueue.size()).toBe(1)

            await eventQueue.enqueueAsync(2)
            expect(eventQueue.size()).toBe(2)

            await eventQueue.enqueueAsync(3)

            // then - размер корректен
            expect(eventQueue.size()).toBe(3)
        })

        it('должна правильно показывать размер при извлечении', async () => {
            // given - очередь с элементами
            await eventQueue.enqueueAsync(1)
            await eventQueue.enqueueAsync(2)
            await eventQueue.enqueueAsync(3)

            // when - извлекаем элементы по одному
            await eventQueue.dequeueAsync()
            expect(eventQueue.size()).toBe(2)

            await eventQueue.dequeueAsync()
            expect(eventQueue.size()).toBe(1)

            await eventQueue.dequeueAsync()

            // then - размер корректен
            expect(eventQueue.size()).toBe(0)
            expect(eventQueue.isEmpty()).toBe(true)
        })
    })

    describe('Асинхронное поведение', () => {
        it('должна блокироваться при чтении из пустой очереди', async () => {
            // given - пустая очередь
            let resolved = false

            // when - пытаемся прочитать из пустой очереди
            const promise = eventQueue.dequeueAsync().then(value => {
                resolved = true
                return value
            })

            // then - операция заблокирована
            await new Promise(resolve => setTimeout(resolve, 10))
            expect(resolved).toBe(false)

            // when - добавляем элемент
            await eventQueue.enqueueAsync(42)
            const result = await promise

            // then - операция разблокирована
            expect(resolved).toBe(true)
            expect(result).toBe(42)
        })

        it('должна обрабатывать несколько ожидающих читателей', async () => {
            // given - пустая очередь и несколько читателей
            const results: number[] = []

            // when - создаем несколько ожидающих читателей
            const reader1 = eventQueue.dequeueAsync().then(value => results.push(value))
            const reader2 = eventQueue.dequeueAsync().then(value => results.push(value))
            const reader3 = eventQueue.dequeueAsync().then(value => results.push(value))

            // then - пока нет данных
            await new Promise(resolve => setTimeout(resolve, 10))
            expect(results).toEqual([])

            // when - добавляем данные
            await eventQueue.enqueueAsync(1)
            await eventQueue.enqueueAsync(2)
            await eventQueue.enqueueAsync(3)

            await Promise.all([reader1, reader2, reader3])

            // then - все читатели получили данные
            expect(results.sort()).toEqual([1, 2, 3])
        })

        it('должна правильно работать при одновременном чтении и записи', async () => {
            // given - пустая очередь
            const results: number[] = []

            // when - запускаем читателя
            const reader = eventQueue.dequeueAsync().then(value => results.push(value))

            // when - добавляем элемент
            await eventQueue.enqueueAsync(42)
            await reader

            // then - элемент сразу передан читателю
            expect(results).toEqual([42])
            expect(eventQueue.isEmpty()).toBe(true)
        })
    })

    describe('Граничные случаи', () => {
        it('должна работать с нулевыми значениями', async () => {
            // given - очередь
            // when - добавляем и извлекаем ноль
            await eventQueue.enqueueAsync(0)
            const result = await eventQueue.dequeueAsync()

            // then - ноль корректно обработан
            expect(result).toBe(0)
        })

        it('должна работать с отрицательными числами', async () => {
            // given - очередь
            // when - добавляем отрицательное число
            await eventQueue.enqueueAsync(-42)
            const result = await eventQueue.dequeueAsync()

            // then - отрицательное число корректно обработано
            expect(result).toBe(-42)
        })

        it('должна работать с большими числами', async () => {
            // given - очередь
            const bigNumber = Number.MAX_SAFE_INTEGER

            // when - добавляем большое число
            await eventQueue.enqueueAsync(bigNumber)
            const result = await eventQueue.dequeueAsync()

            // then - большое число корректно обработано
            expect(result).toBe(bigNumber)
        })

        it('должна корректно показывать элементы при getItems', async () => {
            // given - очередь с элементами
            await eventQueue.enqueueAsync(1)
            await eventQueue.enqueueAsync(2)
            await eventQueue.enqueueAsync(3)

            // when - получаем элементы
            const items = eventQueue.getItems()

            // then - элементы в правильном порядке
            expect(items).toEqual([1, 2, 3])

            // when - извлекаем элемент
            await eventQueue.dequeueAsync()
            const itemsAfter = eventQueue.getItems()

            // then - getItems показывает актуальное состояние
            expect(itemsAfter).toEqual([2, 3])
        })

        it('должна возвращать копию массива в getItems', async () => {
            // given - очередь с элементами
            await eventQueue.enqueueAsync(1)
            await eventQueue.enqueueAsync(2)

            // when - получаем элементы и модифицируем массив
            const items = eventQueue.getItems()
            items.push(999)

            // then - исходная очередь не изменена
            expect(eventQueue.getItems()).toEqual([1, 2])
            expect(eventQueue.size()).toBe(2)
        })
    })

    describe('Стресс-тесты', () => {
        it('должна обрабатывать большое количество элементов', async () => {
            // given - большое количество элементов
            const count = 1000
            const expected = Array.from({ length: count }, (_, i) => i)

            // when - добавляем все элементы
            for (let i = 0; i < count; i++) {
                await eventQueue.enqueueAsync(i)
            }

            // then - все элементы в очереди
            expect(eventQueue.size()).toBe(count)

            // when - извлекаем все элементы
            const results = []
            for (let i = 0; i < count; i++) {
                results.push(await eventQueue.dequeueAsync())
            }

            // then - все элементы извлечены в правильном порядке
            expect(results).toEqual(expected)
            expect(eventQueue.isEmpty()).toBe(true)
        })

        it('должна работать при чередовании операций', async () => {
            // given - очередь
            const results: number[] = []

            // when - чередуем операции добавления и извлечения
            await eventQueue.enqueueAsync(1)
            results.push(await eventQueue.dequeueAsync())

            await eventQueue.enqueueAsync(2)
            await eventQueue.enqueueAsync(3)
            results.push(await eventQueue.dequeueAsync())

            await eventQueue.enqueueAsync(4)
            results.push(await eventQueue.dequeueAsync())
            results.push(await eventQueue.dequeueAsync())

            // then - результаты корректны
            expect(results).toEqual([1, 2, 3, 4])
            expect(eventQueue.isEmpty()).toBe(true)
        })
    })

    describe('Состояние очереди', () => {
        it('должна корректно определять пустую очередь', async () => {
            // given - пустая очередь
            expect(eventQueue.isEmpty()).toBe(true)

            // when - добавляем элемент
            await eventQueue.enqueueAsync(1)
            expect(eventQueue.isEmpty()).toBe(false)

            // when - извлекаем элемент
            await eventQueue.dequeueAsync()

            // then - очередь снова пуста
            expect(eventQueue.isEmpty()).toBe(true)
        })

        it('должна корректно показывать размер после операций', async () => {
            // given - операции с очередью
            expect(eventQueue.size()).toBe(0)

            await eventQueue.enqueueAsync(1)
            await eventQueue.enqueueAsync(2)
            expect(eventQueue.size()).toBe(2)

            await eventQueue.dequeueAsync()
            expect(eventQueue.size()).toBe(1)

            await eventQueue.enqueueAsync(3)
            expect(eventQueue.size()).toBe(2)

            await eventQueue.dequeueAsync()
            await eventQueue.dequeueAsync()

            // then - размер корректен
            expect(eventQueue.size()).toBe(0)
        })
    })
}) 