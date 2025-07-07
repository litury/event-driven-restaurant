import type { IEventQueue, IWorkItem, IWorkAssignment } from '../interfaces'

/**
 * Тесты для фильтра-процессора (переписано для Vitest)
 * Автор: "Фильтр получает назначенную работу и отдает это в очереди на двух рабочих"
 * Используем given-when-then подход
 * 
 * VITEST: Используем глобальные функции describe, it, expect, beforeEach
 * Совместимо с Jest API, но работает намного быстрее
 */

describe('FilterProcessor', () => {
    let assignmentQueue: IEventQueue<IWorkAssignment>
    let worker1Queue: IEventQueue<IWorkItem>
    let worker2Queue: IEventQueue<IWorkItem>

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

    // Простая реализация фильтра для тестов
    const createFilterProcessor = (
        assignmentQueue: IEventQueue<IWorkAssignment>,
        worker1Queue: IEventQueue<IWorkItem>,
        worker2Queue: IEventQueue<IWorkItem>
    ) => {
        return async (): Promise<void> => {
            const assignment = await assignmentQueue.dequeueAsync()

            // Распределяем по НОМЕРУ РАБОТЫ (workItem):
            // четные числа → рабочий 1, нечетные → рабочий 2
            const isEven = assignment.workItem % 2 === 0
            const targetQueue = isEven ? worker1Queue : worker2Queue
            await targetQueue.enqueueAsync(assignment.workItem)
        }
    }

    beforeEach(() => {
        assignmentQueue = new MockEventQueue<IWorkAssignment>()
        worker1Queue = new MockEventQueue<IWorkItem>()
        worker2Queue = new MockEventQueue<IWorkItem>()
    })

    describe('Базовое распределение работы', () => {
        it('должен направлять четные работы рабочему 1', async () => {
            // given - назначение с четной работой
            const assignment: IWorkAssignment = {
                workItem: 42, // четное число
                workerId: 1
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - запускаем фильтр
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - работа направлена рабочему 1 (четные числа)
            expect(worker1Queue.size()).toBe(1)
            expect(worker2Queue.size()).toBe(0)

            const workItem = await worker1Queue.dequeueAsync()
            expect(workItem).toBe(42)
        })

        it('должен направлять нечетные работы рабочему 2', async () => {
            // given - назначение с нечетной работой
            const assignment: IWorkAssignment = {
                workItem: 17, // нечетное число
                workerId: 2
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - запускаем фильтр
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - работа направлена рабочему 2 (нечетные числа)
            expect(worker1Queue.size()).toBe(0)
            expect(worker2Queue.size()).toBe(1)

            const workItem = await worker2Queue.dequeueAsync()
            expect(workItem).toBe(17)
        })

        it('должен правильно распределять смешанные работы', async () => {
            // given - смешанные четные и нечетные работы
            const assignments: IWorkAssignment[] = [
                { workItem: 2, workerId: 1 },  // четное → рабочий 1
                { workItem: 3, workerId: 2 },  // нечетное → рабочий 2
                { workItem: 4, workerId: 1 },  // четное → рабочий 1
                { workItem: 5, workerId: 2 }   // нечетное → рабочий 2
            ]

            for (const assignment of assignments) {
                await assignmentQueue.enqueueAsync(assignment)
            }

            // when - обрабатываем все назначения
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            for (let i = 0; i < assignments.length; i++) {
                await filterProcessor()
            }

            // then - работы правильно распределены по четности
            expect(worker1Queue.size()).toBe(2) // работы 2, 4
            expect(worker2Queue.size()).toBe(2) // работы 3, 5

            // проверяем содержимое очередей
            const worker1Items = []
            worker1Items.push(await worker1Queue.dequeueAsync())
            worker1Items.push(await worker1Queue.dequeueAsync())

            const worker2Items = []
            worker2Items.push(await worker2Queue.dequeueAsync())
            worker2Items.push(await worker2Queue.dequeueAsync())

            expect(worker1Items).toEqual([2, 4]) // четные
            expect(worker2Items).toEqual([3, 5]) // нечетные
        })

        it('должен обрабатывать ноль как четное число', async () => {
            // given - работа с номером 0
            const assignment: IWorkAssignment = {
                workItem: 0, // ноль - четное число
                workerId: 2
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - обрабатываем
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - ноль направлен рабочему 1 (четные числа)
            expect(worker1Queue.size()).toBe(1)
            expect(worker2Queue.size()).toBe(0)

            const workItem = await worker1Queue.dequeueAsync()
            expect(workItem).toBe(0)
        })

        it('должен обрабатывать несколько назначений', async () => {
            // given - несколько назначений с разными номерами работ
            const assignments: IWorkAssignment[] = [
                { workItem: 1, workerId: 1 }, // нечетное → рабочий 2
                { workItem: 2, workerId: 2 }, // четное → рабочий 1
                { workItem: 3, workerId: 1 }, // нечетное → рабочий 2
                { workItem: 4, workerId: 2 }  // четное → рабочий 1
            ]

            for (const assignment of assignments) {
                await assignmentQueue.enqueueAsync(assignment)
            }

            // when - обрабатываем все назначения
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            for (let i = 0; i < assignments.length; i++) {
                await filterProcessor()
            }

            // then - работы правильно распределены по четности
            expect(worker1Queue.size()).toBe(2) // работы 2, 4 (четные)
            expect(worker2Queue.size()).toBe(2) // работы 1, 3 (нечетные)

            // проверяем содержимое очередей
            const worker1Items = []
            worker1Items.push(await worker1Queue.dequeueAsync())
            worker1Items.push(await worker1Queue.dequeueAsync())

            const worker2Items = []
            worker2Items.push(await worker2Queue.dequeueAsync())
            worker2Items.push(await worker2Queue.dequeueAsync())

            expect(worker1Items).toEqual([2, 4]) // четные
            expect(worker2Items).toEqual([1, 3]) // нечетные
        })

        it('должен соблюдать FIFO порядок в очередях рабочих', async () => {
            // given - несколько назначений для одного рабочего
            const assignments: IWorkAssignment[] = [
                { workItem: 10, workerId: 1 },
                { workItem: 20, workerId: 1 },
                { workItem: 30, workerId: 1 }
            ]

            for (const assignment of assignments) {
                await assignmentQueue.enqueueAsync(assignment)
            }

            // when - обрабатываем все назначения
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            for (let i = 0; i < assignments.length; i++) {
                await filterProcessor()
            }

            // then - порядок FIFO соблюден
            expect(worker1Queue.size()).toBe(3)

            const item1 = await worker1Queue.dequeueAsync()
            const item2 = await worker1Queue.dequeueAsync()
            const item3 = await worker1Queue.dequeueAsync()

            expect(item1).toBe(10)
            expect(item2).toBe(20)
            expect(item3).toBe(30)
        })
    })

    describe('Блокирующее поведение', () => {
        it('должен ждать назначения если очередь пуста', async () => {
            // given - пустая очередь назначений

            // when - запускаем фильтр
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            let completed = false

            const processingPromise = filterProcessor().then(() => {
                completed = true
            })

            // then - фильтр заблокирован
            await new Promise(resolve => setTimeout(resolve, 10))
            expect(completed).toBe(false)
            expect(worker1Queue.size()).toBe(0)
            expect(worker2Queue.size()).toBe(0)

            // when - добавляем назначение
            await assignmentQueue.enqueueAsync({ workItem: 42, workerId: 1 })
            await processingPromise

            // then - фильтр разблокирован и обработал назначение
            expect(completed).toBe(true)
            expect(worker1Queue.size()).toBe(1)
        })

        it('должен обрабатывать назначения по мере поступления', async () => {
            // given - фильтр ждет назначения
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            // when - добавляем назначения с задержкой
            const processingPromises = []

            processingPromises.push(filterProcessor())
            processingPromises.push(filterProcessor())
            processingPromises.push(filterProcessor())

            // добавляем назначения постепенно
            setTimeout(() => assignmentQueue.enqueueAsync({ workItem: 1, workerId: 1 }), 10) // нечетное → worker2
            setTimeout(() => assignmentQueue.enqueueAsync({ workItem: 2, workerId: 2 }), 20) // четное → worker1
            setTimeout(() => assignmentQueue.enqueueAsync({ workItem: 3, workerId: 1 }), 30) // нечетное → worker2

            await Promise.all(processingPromises)

            // then - все назначения обработаны по четности
            expect(worker1Queue.size()).toBe(1) // работа 2 (четная)
            expect(worker2Queue.size()).toBe(2) // работы 1, 3 (нечетные)
        })
    })

    // Удалено: старые тесты с неправильной логикой

    // Удалено: граничные случаи перенесены в секцию "Распределение по четности"

    describe('Стресс-тесты', () => {
        it('должен обрабатывать большое количество назначений', async () => {
            // given - большое количество назначений с четными и нечетными работами
            const count = 1000
            const assignments: IWorkAssignment[] = []

            for (let i = 0; i < count; i++) {
                assignments.push({
                    workItem: i, // 0,1,2,3,4,5...
                    workerId: 1 // workerId не важен, считаем workItem
                })
                await assignmentQueue.enqueueAsync(assignments[i])
            }

            // when - обрабатываем все назначения
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            for (let i = 0; i < count; i++) {
                await filterProcessor()
            }

            // then - четные в worker1, нечетные в worker2
            expect(worker1Queue.size()).toBe(count / 2) // 0,2,4,6... (500 штук)
            expect(worker2Queue.size()).toBe(count / 2) // 1,3,5,7... (500 штук)
            expect(assignmentQueue.size()).toBe(0)
        })
    })

    describe('Целостность данных', () => {
        it('должен очищать очередь назначений после обработки', async () => {
            // given - назначение в очереди
            const assignment: IWorkAssignment = {
                workItem: 42,
                workerId: 1
            }
            await assignmentQueue.enqueueAsync(assignment)

            expect(assignmentQueue.size()).toBe(1)

            // when - обрабатываем
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - очередь назначений очищена
            expect(assignmentQueue.size()).toBe(0)
            expect(worker1Queue.size()).toBe(1)
        })

        it('должен сохранять неизменяемость данных работы', async () => {
            // given - назначение
            const originalWorkItem = 42
            const assignment: IWorkAssignment = {
                workItem: originalWorkItem,
                workerId: 1
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - обрабатываем
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - данные работы не изменены
            const workItem = await worker1Queue.dequeueAsync()
            expect(workItem).toBe(originalWorkItem)
        })

        it('должен корректно работать при параллельной обработке', async () => {
            // given - несколько назначений
            const assignments: IWorkAssignment[] = [
                { workItem: 1, workerId: 1 }, // нечетное → worker2
                { workItem: 2, workerId: 2 }, // четное → worker1
                { workItem: 3, workerId: 1 }, // нечетное → worker2
                { workItem: 4, workerId: 2 }, // четное → worker1
                { workItem: 5, workerId: 1 }  // нечетное → worker2
            ]

            for (const assignment of assignments) {
                await assignmentQueue.enqueueAsync(assignment)
            }

            // when - обрабатываем параллельно
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            const promises = []
            for (let i = 0; i < assignments.length; i++) {
                promises.push(filterProcessor())
            }

            await Promise.all(promises)

            // then - все назначения обработаны по четности
            expect(worker1Queue.size()).toBe(2) // работы 2, 4 (четные)
            expect(worker2Queue.size()).toBe(3) // работы 1, 3, 5 (нечетные)
            expect(assignmentQueue.size()).toBe(0)
        })

        it('должен обрабатывать смешанные назначения в правильном порядке', async () => {
            // given - смешанные четные и нечетные назначения
            const assignments: IWorkAssignment[] = [
                { workItem: 100, workerId: 2 }, // четное → worker1
                { workItem: 201, workerId: 1 }, // нечетное → worker2
                { workItem: 302, workerId: 2 }, // четное → worker1
                { workItem: 403, workerId: 1 }  // нечетное → worker2
            ]

            for (const assignment of assignments) {
                await assignmentQueue.enqueueAsync(assignment)
            }

            // when - обрабатываем по порядку
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            for (let i = 0; i < assignments.length; i++) {
                await filterProcessor()
            }

            // then - порядок сохранен по четности
            expect(worker1Queue.size()).toBe(2) // четные работы
            expect(worker2Queue.size()).toBe(2) // нечетные работы

            // worker1 должен получить четные работы в порядке поступления
            const worker1Item1 = await worker1Queue.dequeueAsync()
            const worker1Item2 = await worker1Queue.dequeueAsync()
            expect(worker1Item1).toBe(100)
            expect(worker1Item2).toBe(302)

            // worker2 должен получить нечетные работы в порядке поступления
            const worker2Item1 = await worker2Queue.dequeueAsync()
            const worker2Item2 = await worker2Queue.dequeueAsync()
            expect(worker2Item1).toBe(201)
            expect(worker2Item2).toBe(403)
        })
    })

    describe('Распределение по четности номера работы', () => {
        it('должен правильно обрабатывать работы 0-10', async () => {
            // given - работы от 0 до 10
            const assignments: IWorkAssignment[] = []
            for (let i = 0; i <= 10; i++) {
                assignments.push({ workItem: i, workerId: 1 })
            }

            for (const assignment of assignments) {
                await assignmentQueue.enqueueAsync(assignment)
            }

            // when - обрабатываем все назначения
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            for (let i = 0; i < assignments.length; i++) {
                await filterProcessor()
            }

            // then - четные в worker1, нечетные в worker2
            expect(worker1Queue.size()).toBe(6) // 0,2,4,6,8,10
            expect(worker2Queue.size()).toBe(5) // 1,3,5,7,9
        })

        it('должен обрабатывать отрицательные работы', async () => {
            // given - отрицательная работа
            const assignment: IWorkAssignment = {
                workItem: -42, // четное (отрицательное)
                workerId: 2
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - обрабатываем
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - -42 четное → worker1
            expect(worker1Queue.size()).toBe(1)
            expect(worker2Queue.size()).toBe(0)
            const workItem = await worker1Queue.dequeueAsync()
            expect(workItem).toBe(-42)
        })

        it('должен обрабатывать большие значения работ', async () => {
            // given - большое четное число
            const bigWork = Number.MAX_SAFE_INTEGER - 1 // четное
            const assignment: IWorkAssignment = {
                workItem: bigWork,
                workerId: 1
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - обрабатываем
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - большое четное → worker1
            expect(worker1Queue.size()).toBe(1)
            expect(worker2Queue.size()).toBe(0)
            const workItem = await worker1Queue.dequeueAsync()
            expect(workItem).toBe(bigWork)
        })
    })
}) 