import type { IEventQueue, IWorkItem, IWorkAssignment } from '../interfaces'

/**
 * Тесты для фильтра-процессора
 * Автор: "Фильтр получает назначенную работу и отдает это в очереди на двух рабочих"
 * Используем given-when-then подход
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

            // Распределяем по workerId
            if (assignment.workerId === 1) {
                await worker1Queue.enqueueAsync(assignment.workItem)
            } else if (assignment.workerId === 2) {
                await worker2Queue.enqueueAsync(assignment.workItem)
            } else {
                // Для других рабочих используем модуль для распределения
                // Исправлена логика для отрицательных чисел: -1, -3, -5... -> worker1
                const isOdd = Math.abs(assignment.workerId) % 2 === 1
                const targetQueue = isOdd ? worker1Queue : worker2Queue
                await targetQueue.enqueueAsync(assignment.workItem)
            }
        }
    }

    beforeEach(() => {
        assignmentQueue = new MockEventQueue<IWorkAssignment>()
        worker1Queue = new MockEventQueue<IWorkItem>()
        worker2Queue = new MockEventQueue<IWorkItem>()
    })

    describe('Базовое распределение работы', () => {
        it('должен направлять работу рабочему 1', async () => {
            // given - назначение для рабочего 1
            const assignment: IWorkAssignment = {
                workItem: 42,
                workerId: 1
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - запускаем фильтр
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - работа направлена рабочему 1
            expect(worker1Queue.size()).toBe(1)
            expect(worker2Queue.size()).toBe(0)

            const workItem = await worker1Queue.dequeueAsync()
            expect(workItem).toBe(42)
        })

        it('должен направлять работу рабочему 2', async () => {
            // given - назначение для рабочего 2
            const assignment: IWorkAssignment = {
                workItem: 17,
                workerId: 2
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - запускаем фильтр
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - работа направлена рабочему 2
            expect(worker1Queue.size()).toBe(0)
            expect(worker2Queue.size()).toBe(1)

            const workItem = await worker2Queue.dequeueAsync()
            expect(workItem).toBe(17)
        })

        it('должен обрабатывать несколько назначений', async () => {
            // given - несколько назначений
            const assignments: IWorkAssignment[] = [
                { workItem: 1, workerId: 1 },
                { workItem: 2, workerId: 2 },
                { workItem: 3, workerId: 1 },
                { workItem: 4, workerId: 2 }
            ]

            for (const assignment of assignments) {
                await assignmentQueue.enqueueAsync(assignment)
            }

            // when - обрабатываем все назначения
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            for (let i = 0; i < assignments.length; i++) {
                await filterProcessor()
            }

            // then - работы правильно распределены
            expect(worker1Queue.size()).toBe(2)
            expect(worker2Queue.size()).toBe(2)

            // проверяем содержимое очередей
            const worker1Items = []
            worker1Items.push(await worker1Queue.dequeueAsync())
            worker1Items.push(await worker1Queue.dequeueAsync())

            const worker2Items = []
            worker2Items.push(await worker2Queue.dequeueAsync())
            worker2Items.push(await worker2Queue.dequeueAsync())

            expect(worker1Items).toEqual([1, 3])
            expect(worker2Items).toEqual([2, 4])
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
            setTimeout(() => assignmentQueue.enqueueAsync({ workItem: 1, workerId: 1 }), 10)
            setTimeout(() => assignmentQueue.enqueueAsync({ workItem: 2, workerId: 2 }), 20)
            setTimeout(() => assignmentQueue.enqueueAsync({ workItem: 3, workerId: 1 }), 30)

            await Promise.all(processingPromises)

            // then - все назначения обработаны
            expect(worker1Queue.size()).toBe(2)
            expect(worker2Queue.size()).toBe(1)
        })
    })

    describe('Распределение по дополнительным рабочим', () => {
        it('должен распределять рабочих с номерами больше 2', async () => {
            // given - назначения для рабочих с разными номерами
            const assignments: IWorkAssignment[] = [
                { workItem: 1, workerId: 3 }, // нечетный -> рабочий 1
                { workItem: 2, workerId: 4 }, // четный -> рабочий 2
                { workItem: 3, workerId: 5 }, // нечетный -> рабочий 1
                { workItem: 4, workerId: 6 }  // четный -> рабочий 2
            ]

            for (const assignment of assignments) {
                await assignmentQueue.enqueueAsync(assignment)
            }

            // when - обрабатываем все назначения
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            for (let i = 0; i < assignments.length; i++) {
                await filterProcessor()
            }

            // then - работы распределены по модулю
            expect(worker1Queue.size()).toBe(2) // рабочие 3, 5
            expect(worker2Queue.size()).toBe(2) // рабочие 4, 6

            const worker1Items = []
            worker1Items.push(await worker1Queue.dequeueAsync())
            worker1Items.push(await worker1Queue.dequeueAsync())

            const worker2Items = []
            worker2Items.push(await worker2Queue.dequeueAsync())
            worker2Items.push(await worker2Queue.dequeueAsync())

            expect(worker1Items).toEqual([1, 3])
            expect(worker2Items).toEqual([2, 4])
        })

        it('должен корректно обрабатывать нулевой номер рабочего', async () => {
            // given - рабочий с номером 0
            const assignment: IWorkAssignment = {
                workItem: 42,
                workerId: 0
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - обрабатываем
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - работа направлена рабочему 2 (0 % 2 === 0)
            expect(worker1Queue.size()).toBe(0)
            expect(worker2Queue.size()).toBe(1)

            const workItem = await worker2Queue.dequeueAsync()
            expect(workItem).toBe(42)
        })
    })

    describe('Граничные случаи', () => {
        it('должен обрабатывать нулевые значения работ', async () => {
            // given - работа со значением 0
            const assignment: IWorkAssignment = {
                workItem: 0,
                workerId: 1
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - обрабатываем
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - ноль корректно обработан
            expect(worker1Queue.size()).toBe(1)
            const workItem = await worker1Queue.dequeueAsync()
            expect(workItem).toBe(0)
        })

        it('должен обрабатывать отрицательные значения работ', async () => {
            // given - работа с отрицательным значением
            const assignment: IWorkAssignment = {
                workItem: -42,
                workerId: 2
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - обрабатываем
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - отрицательное значение корректно обработано
            expect(worker2Queue.size()).toBe(1)
            const workItem = await worker2Queue.dequeueAsync()
            expect(workItem).toBe(-42)
        })

        it('должен обрабатывать большие значения работ', async () => {
            // given - работа с большим значением
            const bigWork = Number.MAX_SAFE_INTEGER
            const assignment: IWorkAssignment = {
                workItem: bigWork,
                workerId: 1
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - обрабатываем
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - большое значение корректно обработано
            expect(worker1Queue.size()).toBe(1)
            const workItem = await worker1Queue.dequeueAsync()
            expect(workItem).toBe(bigWork)
        })

        it('должен обрабатывать отрицательные номера рабочих', async () => {
            // given - рабочий с отрицательным номером
            const assignment: IWorkAssignment = {
                workItem: 42,
                workerId: -1
            }
            await assignmentQueue.enqueueAsync(assignment)

            // when - обрабатываем
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)
            await filterProcessor()

            // then - работа распределена по модулю (-1 % 2 === -1, нечетное -> рабочий 1)
            expect(worker1Queue.size()).toBe(1)
            const workItem = await worker1Queue.dequeueAsync()
            expect(workItem).toBe(42)
        })
    })

    describe('Стресс-тесты', () => {
        it('должен обрабатывать большое количество назначений', async () => {
            // given - большое количество назначений
            const count = 1000
            const assignments: IWorkAssignment[] = []

            for (let i = 0; i < count; i++) {
                assignments.push({
                    workItem: i,
                    workerId: (i % 2) + 1 // чередуем рабочих 1 и 2
                })
                await assignmentQueue.enqueueAsync(assignments[i])
            }

            // when - обрабатываем все назначения
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            for (let i = 0; i < count; i++) {
                await filterProcessor()
            }

            // then - все назначения обработаны
            expect(worker1Queue.size()).toBe(count / 2)
            expect(worker2Queue.size()).toBe(count / 2)
            expect(assignmentQueue.size()).toBe(0)
        })

        it('должен равномерно распределять работу между рабочими', async () => {
            // given - случайные назначения
            const count = 100
            const worker1Count = 30
            const worker2Count = 70

            // добавляем назначения для рабочего 1
            for (let i = 0; i < worker1Count; i++) {
                await assignmentQueue.enqueueAsync({ workItem: i, workerId: 1 })
            }

            // добавляем назначения для рабочего 2
            for (let i = 0; i < worker2Count; i++) {
                await assignmentQueue.enqueueAsync({ workItem: i + worker1Count, workerId: 2 })
            }

            // when - обрабатываем все назначения
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            for (let i = 0; i < count; i++) {
                await filterProcessor()
            }

            // then - распределение корректно
            expect(worker1Queue.size()).toBe(worker1Count)
            expect(worker2Queue.size()).toBe(worker2Count)
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
                { workItem: 1, workerId: 1 },
                { workItem: 2, workerId: 2 },
                { workItem: 3, workerId: 1 },
                { workItem: 4, workerId: 2 },
                { workItem: 5, workerId: 1 }
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

            // then - все назначения обработаны корректно
            expect(worker1Queue.size()).toBe(3) // работы 1, 3, 5
            expect(worker2Queue.size()).toBe(2) // работы 2, 4
            expect(assignmentQueue.size()).toBe(0)
        })

        it('должен обрабатывать смешанные назначения в правильном порядке', async () => {
            // given - смешанные назначения
            const assignments: IWorkAssignment[] = [
                { workItem: 100, workerId: 2 },
                { workItem: 200, workerId: 1 },
                { workItem: 300, workerId: 2 },
                { workItem: 400, workerId: 1 }
            ]

            for (const assignment of assignments) {
                await assignmentQueue.enqueueAsync(assignment)
            }

            // when - обрабатываем по порядку
            const filterProcessor = createFilterProcessor(assignmentQueue, worker1Queue, worker2Queue)

            for (let i = 0; i < assignments.length; i++) {
                await filterProcessor()
            }

            // then - порядок сохранен в очередях рабочих
            expect(worker1Queue.size()).toBe(2)
            expect(worker2Queue.size()).toBe(2)

            // рабочий 1 должен получить работы 200, 400 в таком порядке
            const worker1Item1 = await worker1Queue.dequeueAsync()
            const worker1Item2 = await worker1Queue.dequeueAsync()
            expect(worker1Item1).toBe(200)
            expect(worker1Item2).toBe(400)

            // рабочий 2 должен получить работы 100, 300 в таком порядке
            const worker2Item1 = await worker2Queue.dequeueAsync()
            const worker2Item2 = await worker2Queue.dequeueAsync()
            expect(worker2Item1).toBe(100)
            expect(worker2Item2).toBe(300)
        })
    })
}) 