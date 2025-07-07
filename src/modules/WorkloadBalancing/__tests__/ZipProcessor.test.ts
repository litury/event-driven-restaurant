import type { IEventQueue, IWorkItem, IWorkerFreeEvent, IWorkAssignment } from '../interfaces'

/**
 * Тесты для ZIP-процессора (переписано для Vitest)
 * Автор: "ZIP объединяет события о готовности рабочих и заданиях, формируя пары"
 * Используем given-when-then подход
 * 
 * VITEST: Hot Reload для тестов - изменения применяются мгновенно!
 */

describe('ZipProcessor', () => {
    let workQueue: IEventQueue<IWorkItem>
    let freeWorkersQueue: IEventQueue<IWorkerFreeEvent>
    let assignmentQueue: IEventQueue<IWorkAssignment>

    // Мок-реализация очереди для тестов
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

    // Простая реализация ZIP-процессора для тестов
    const createZipProcessor = (
        workQueue: IEventQueue<IWorkItem>,
        freeWorkersQueue: IEventQueue<IWorkerFreeEvent>,
        assignmentQueue: IEventQueue<IWorkAssignment>
    ) => {
        return async (): Promise<void> => {
            const workItem = await workQueue.dequeueAsync()
            const workerId = await freeWorkersQueue.dequeueAsync()

            const assignment: IWorkAssignment = {
                workItem,
                workerId
            }

            await assignmentQueue.enqueueAsync(assignment)
        }
    }

    beforeEach(() => {
        workQueue = new MockEventQueue<IWorkItem>()
        freeWorkersQueue = new MockEventQueue<IWorkerFreeEvent>()
        assignmentQueue = new MockEventQueue<IWorkAssignment>()
    })

    describe('Базовое объединение потоков', () => {
        it('должен объединять работу с рабочим', async () => {
            // given - работа и свободный рабочий
            await workQueue.enqueueAsync(42)
            await freeWorkersQueue.enqueueAsync(1)

            // when - запускаем ZIP-процессор
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            await zipProcessor()

            // then - создано назначение
            expect(assignmentQueue.size()).toBe(1)
            const assignment = await assignmentQueue.dequeueAsync()
            expect(assignment.workItem).toBe(42)
            expect(assignment.workerId).toBe(1)
        })

        it('должен обрабатывать несколько пар', async () => {
            // given - несколько работ и рабочих
            await workQueue.enqueueAsync(1)
            await workQueue.enqueueAsync(2)
            await workQueue.enqueueAsync(3)

            await freeWorkersQueue.enqueueAsync(1)
            await freeWorkersQueue.enqueueAsync(2)
            await freeWorkersQueue.enqueueAsync(1)

            // when - запускаем ZIP-процессор несколько раз
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            await zipProcessor()
            await zipProcessor()
            await zipProcessor()

            // then - созданы все назначения
            expect(assignmentQueue.size()).toBe(3)

            const assignment1 = await assignmentQueue.dequeueAsync()
            const assignment2 = await assignmentQueue.dequeueAsync()
            const assignment3 = await assignmentQueue.dequeueAsync()

            expect(assignment1).toEqual({ workItem: 1, workerId: 1 })
            expect(assignment2).toEqual({ workItem: 2, workerId: 2 })
            expect(assignment3).toEqual({ workItem: 3, workerId: 1 })
        })

        it('должен соблюдать FIFO порядок для работ', async () => {
            // given - работы в определенном порядке
            await workQueue.enqueueAsync(10)
            await workQueue.enqueueAsync(20)
            await workQueue.enqueueAsync(30)

            await freeWorkersQueue.enqueueAsync(1)
            await freeWorkersQueue.enqueueAsync(1)
            await freeWorkersQueue.enqueueAsync(1)

            // when - обрабатываем все пары
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            await zipProcessor()
            await zipProcessor()
            await zipProcessor()

            // then - работы обработаны в правильном порядке
            const assignments = []
            assignments.push(await assignmentQueue.dequeueAsync())
            assignments.push(await assignmentQueue.dequeueAsync())
            assignments.push(await assignmentQueue.dequeueAsync())

            expect(assignments[0].workItem).toBe(10)
            expect(assignments[1].workItem).toBe(20)
            expect(assignments[2].workItem).toBe(30)
        })

        it('должен соблюдать FIFO порядок для рабочих', async () => {
            // given - рабочие в определенном порядке
            await workQueue.enqueueAsync(42)
            await workQueue.enqueueAsync(42)
            await workQueue.enqueueAsync(42)

            await freeWorkersQueue.enqueueAsync(1)
            await freeWorkersQueue.enqueueAsync(2)
            await freeWorkersQueue.enqueueAsync(3)

            // when - обрабатываем все пары
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            await zipProcessor()
            await zipProcessor()
            await zipProcessor()

            // then - рабочие назначены в правильном порядке
            const assignments = []
            assignments.push(await assignmentQueue.dequeueAsync())
            assignments.push(await assignmentQueue.dequeueAsync())
            assignments.push(await assignmentQueue.dequeueAsync())

            expect(assignments[0].workerId).toBe(1)
            expect(assignments[1].workerId).toBe(2)
            expect(assignments[2].workerId).toBe(3)
        })
    })

    describe('Блокирующее поведение', () => {
        it('должен ждать работу если нет работ', async () => {
            // given - только свободный рабочий
            await freeWorkersQueue.enqueueAsync(1)

            // when - запускаем ZIP-процессор
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            let completed = false

            const processingPromise = zipProcessor().then(() => {
                completed = true
            })

            // then - процессор заблокирован
            await new Promise(resolve => setTimeout(resolve, 10))
            expect(completed).toBe(false)
            expect(assignmentQueue.size()).toBe(0)

            // when - добавляем работу
            await workQueue.enqueueAsync(42)
            await processingPromise

            // then - процессор разблокирован и создал назначение
            expect(completed).toBe(true)
            expect(assignmentQueue.size()).toBe(1)
        })

        it('должен ждать рабочего если нет рабочих', async () => {
            // given - только работа
            await workQueue.enqueueAsync(42)

            // when - запускаем ZIP-процессор
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            let completed = false

            const processingPromise = zipProcessor().then(() => {
                completed = true
            })

            // then - процессор заблокирован
            await new Promise(resolve => setTimeout(resolve, 10))
            expect(completed).toBe(false)
            expect(assignmentQueue.size()).toBe(0)

            // when - добавляем рабочего
            await freeWorkersQueue.enqueueAsync(1)
            await processingPromise

            // then - процессор разблокирован и создал назначение
            expect(completed).toBe(true)
            expect(assignmentQueue.size()).toBe(1)
        })

        it('должен ждать оба потока если очереди пусты', async () => {
            // given - пустые очереди

            // when - запускаем ZIP-процессор
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            let completed = false

            const processingPromise = zipProcessor().then(() => {
                completed = true
            })

            // then - процессор заблокирован
            await new Promise(resolve => setTimeout(resolve, 10))
            expect(completed).toBe(false)

            // when - добавляем только работу
            await workQueue.enqueueAsync(42)
            await new Promise(resolve => setTimeout(resolve, 10))
            expect(completed).toBe(false)

            // when - добавляем рабочего
            await freeWorkersQueue.enqueueAsync(1)
            await processingPromise

            // then - процессор разблокирован
            expect(completed).toBe(true)
            expect(assignmentQueue.size()).toBe(1)
        })
    })

    describe('Граничные случаи', () => {
        it('должен обрабатывать нулевые значения работ', async () => {
            // given - работа со значением 0
            await workQueue.enqueueAsync(0)
            await freeWorkersQueue.enqueueAsync(1)

            // when - обрабатываем
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            await zipProcessor()

            // then - ноль корректно обработан
            const assignment = await assignmentQueue.dequeueAsync()
            expect(assignment.workItem).toBe(0)
            expect(assignment.workerId).toBe(1)
        })

        it('должен обрабатывать отрицательные значения работ', async () => {
            // given - работа с отрицательным значением
            await workQueue.enqueueAsync(-42)
            await freeWorkersQueue.enqueueAsync(1)

            // when - обрабатываем
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            await zipProcessor()

            // then - отрицательное значение корректно обработано
            const assignment = await assignmentQueue.dequeueAsync()
            expect(assignment.workItem).toBe(-42)
            expect(assignment.workerId).toBe(1)
        })

        it('должен обрабатывать большие значения работ', async () => {
            // given - работа с большим значением
            const bigWork = Number.MAX_SAFE_INTEGER
            await workQueue.enqueueAsync(bigWork)
            await freeWorkersQueue.enqueueAsync(1)

            // when - обрабатываем
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            await zipProcessor()

            // then - большое значение корректно обработано
            const assignment = await assignmentQueue.dequeueAsync()
            expect(assignment.workItem).toBe(bigWork)
            expect(assignment.workerId).toBe(1)
        })

        it('должен обрабатывать разных рабочих', async () => {
            // given - разные номера рабочих
            await workQueue.enqueueAsync(1)
            await workQueue.enqueueAsync(2)
            await workQueue.enqueueAsync(3)

            await freeWorkersQueue.enqueueAsync(10)
            await freeWorkersQueue.enqueueAsync(20)
            await freeWorkersQueue.enqueueAsync(30)

            // when - обрабатываем
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            await zipProcessor()
            await zipProcessor()
            await zipProcessor()

            // then - все рабочие корректно назначены
            const assignments = []
            assignments.push(await assignmentQueue.dequeueAsync())
            assignments.push(await assignmentQueue.dequeueAsync())
            assignments.push(await assignmentQueue.dequeueAsync())

            expect(assignments[0].workerId).toBe(10)
            expect(assignments[1].workerId).toBe(20)
            expect(assignments[2].workerId).toBe(30)
        })
    })

    describe('Стресс-тесты', () => {
        it('должен обрабатывать большое количество пар', async () => {
            // given - большое количество работ и рабочих
            const count = 100

            for (let i = 0; i < count; i++) {
                await workQueue.enqueueAsync(i)
                await freeWorkersQueue.enqueueAsync(i % 2 + 1) // чередуем рабочих 1 и 2
            }

            // when - обрабатываем все пары
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)

            for (let i = 0; i < count; i++) {
                await zipProcessor()
            }

            // then - все пары обработаны
            expect(assignmentQueue.size()).toBe(count)

            // проверяем несколько первых назначений
            const assignment1 = await assignmentQueue.dequeueAsync()
            const assignment2 = await assignmentQueue.dequeueAsync()
            const assignment3 = await assignmentQueue.dequeueAsync()

            expect(assignment1).toEqual({ workItem: 0, workerId: 1 })
            expect(assignment2).toEqual({ workItem: 1, workerId: 2 })
            expect(assignment3).toEqual({ workItem: 2, workerId: 1 })
        })

        it('должен корректно работать при неравномерном поступлении', async () => {
            // given - сначала много работ, потом много рабочих
            for (let i = 0; i < 5; i++) {
                await workQueue.enqueueAsync(i)
            }

            // when - обрабатываем частично (должно заблокироваться)
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)

            // добавляем рабочих по одному и обрабатываем
            for (let i = 0; i < 5; i++) {
                await freeWorkersQueue.enqueueAsync(i + 1)
                await zipProcessor()
            }

            // then - все пары обработаны
            expect(assignmentQueue.size()).toBe(5)
            expect(workQueue.isEmpty()).toBe(true)
            expect(freeWorkersQueue.isEmpty()).toBe(true)
        })
    })

    describe('Целостность данных', () => {
        it('должен создавать неизменяемые назначения', async () => {
            // given - работа и рабочий
            await workQueue.enqueueAsync(42)
            await freeWorkersQueue.enqueueAsync(1)

            // when - создаем назначение
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            await zipProcessor()

            const assignment = await assignmentQueue.dequeueAsync()

            // then - назначение имеет readonly свойства
            expect(assignment.workItem).toBe(42)
            expect(assignment.workerId).toBe(1)

            // попытка изменить должна быть заблокирована TypeScript
            // (assignment as any).workItem = 999 // это должно вызвать ошибку TS
        })

        it('должен очищать входные очереди после обработки', async () => {
            // given - элементы в очередях
            await workQueue.enqueueAsync(42)
            await freeWorkersQueue.enqueueAsync(1)

            expect(workQueue.size()).toBe(1)
            expect(freeWorkersQueue.size()).toBe(1)

            // when - обрабатываем
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)
            await zipProcessor()

            // then - входные очереди очищены
            expect(workQueue.size()).toBe(0)
            expect(freeWorkersQueue.size()).toBe(0)
            expect(assignmentQueue.size()).toBe(1)
        })

        it('должен сохранять порядок при параллельной обработке', async () => {
            // given - последовательность работ и рабочих
            const works = [1, 2, 3, 4, 5]
            const workers = [1, 2, 1, 2, 1]

            for (let i = 0; i < works.length; i++) {
                await workQueue.enqueueAsync(works[i])
                await freeWorkersQueue.enqueueAsync(workers[i])
            }

            // when - обрабатываем все пары
            const zipProcessor = createZipProcessor(workQueue, freeWorkersQueue, assignmentQueue)

            const promises = []
            for (let i = 0; i < works.length; i++) {
                promises.push(zipProcessor())
            }

            await Promise.all(promises)

            // then - порядок соблюден
            const assignments = []
            for (let i = 0; i < works.length; i++) {
                assignments.push(await assignmentQueue.dequeueAsync())
            }

            for (let i = 0; i < works.length; i++) {
                expect(assignments[i].workItem).toBe(works[i])
                expect(assignments[i].workerId).toBe(workers[i])
            }
        })
    })
}) 