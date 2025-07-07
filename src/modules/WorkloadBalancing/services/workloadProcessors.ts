import { pipe } from 'ramda'
import type {
    IEventQueue,
    IWorkItem,
    IWorkerFreeEvent,
    IWorkAssignment,
    IWorkResult,
    ZipProcessorFunction,
    FilterProcessorFunction,
    WorkerProcessorFunction,
    WorkGeneratorFunction
} from '../interfaces'

/**
 * ZIP-процессор - объединяет потоки работ и рабочих
 * Автор: "ZIP комбинирует их, перекладывает это в назначенных рабочих"
 * 
 * @param _workQueue - очередь работ
 * @param _freeWorkersQueue - очередь свободных рабочих  
 * @param _assignmentQueue - очередь назначений
 */
export const createZipProcessorAsync: ZipProcessorFunction = async (
    _workQueue: IEventQueue<IWorkItem>,
    _freeWorkersQueue: IEventQueue<IWorkerFreeEvent>,
    _assignmentQueue: IEventQueue<IWorkAssignment>
): Promise<void> => {
    // Ждем одновременно работу И рабочего
    const workItem = await _workQueue.dequeueAsync()
    const workerId = await _freeWorkersQueue.dequeueAsync()

    // Создаем назначение как неизменяемый объект
    const assignment: IWorkAssignment = {
        workItem,
        workerId
    } as const

    // Отправляем назначение в выходную очередь
    await _assignmentQueue.enqueueAsync(assignment)
}

/**
 * Фильтр-процессор - распределяет назначения по рабочим
 * Автор: "Фильтр получает назначенную работу и отдает это в очереди на двух рабочих"
 * 
 * @param _assignmentQueue - очередь назначений
 * @param _worker1Queue - очередь для рабочего 1
 * @param _worker2Queue - очередь для рабочего 2
 */
export const createFilterProcessorAsync: FilterProcessorFunction = async (
    _assignmentQueue: IEventQueue<IWorkAssignment>,
    _worker1Queue: IEventQueue<IWorkItem>,
    _worker2Queue: IEventQueue<IWorkItem>
): Promise<void> => {
    // Получаем назначение
    const assignment = await _assignmentQueue.dequeueAsync()

    // Функциональное распределение по рабочим
    // Логика для отрицательных чисел: -1 должен быть нечетным (worker1)
    const routeToWorker = pipe(
        (workerId: number) => {
            if (workerId === 1) return 'worker1'
            if (workerId === 2) return 'worker2'

            // Для отрицательных чисел: -1, -3, -5... -> worker1, -2, -4, -6... -> worker2
            // Используем Math.abs и проверяем остаток
            const isOdd = Math.abs(workerId) % 2 === 1
            return isOdd ? 'worker1' : 'worker2'
        }
    )

    const targetWorker = routeToWorker(assignment.workerId)

    // Отправляем работу соответствующему рабочему
    if (targetWorker === 'worker1') {
        await _worker1Queue.enqueueAsync(assignment.workItem)
    } else {
        await _worker2Queue.enqueueAsync(assignment.workItem)
    }
}

/**
 * Рабочий-процессор - обрабатывает работу и отправляет результат
 * Автор: "Рабочий берет из очереди на работу элемент и обрабатывает его"
 * 
 * @param _workQueue - очередь работ для рабочего
 * @param _freeWorkersQueue - очередь для сообщения о освобождении
 * @param _resultQueue - очередь результатов
 * @param _workerId - ID рабочего
 */
export const createWorkerProcessorAsync: WorkerProcessorFunction = async (
    _workQueue: IEventQueue<IWorkItem>,
    _freeWorkersQueue: IEventQueue<IWorkerFreeEvent>,
    _resultQueue: IEventQueue<IWorkResult>,
    _workerId: number
): Promise<void> => {
    // Получаем работу
    const workItem = await _workQueue.dequeueAsync()

    // Функциональная обработка работы (простой пример - умножение на 2)
    const processWork = pipe(
        (work: number) => work * 2
    )

    const processedResult = processWork(workItem)

    // Создаем результат как неизменяемый объект
    const result: IWorkResult = {
        workItem,
        result: processedResult,
        completedAt: Date.now()
    } as const

    // Отправляем результат
    await _resultQueue.enqueueAsync(result)

    // Сообщаем что освободились
    await _freeWorkersQueue.enqueueAsync(_workerId)
}

/**
 * Генератор работы - создает работы по таймеру
 * Автор: "Генератор работы по таймеру от 1 до 5 секунд генерирует числа"
 * 
 * @param _workQueue - очередь для генерируемых работ
 * @param _intervalMs - интервал генерации в миллисекундах
 * @param _maxWorks - максимальное количество работ
 */
export const createWorkGeneratorAsync: WorkGeneratorFunction = (
    _workQueue: IEventQueue<IWorkItem>,
    _intervalMs: number = 2000,
    _maxWorks: number = 50
) => {
    let p_workCounter = 1
    let p_intervalId: NodeJS.Timeout | null = null

    return {
        /**
         * Запускает генерацию работ
         */
        async startAsync(): Promise<void> {
            p_intervalId = setInterval(async () => {
                if (p_workCounter <= _maxWorks) {
                    await _workQueue.enqueueAsync(p_workCounter)
                    p_workCounter++
                } else {
                    // Автоматически останавливаем когда достигли лимита
                    await this.stopAsync()
                }
            }, _intervalMs)
        },

        /**
         * Останавливает генерацию работ
         */
        async stopAsync(): Promise<void> {
            if (p_intervalId) {
                clearInterval(p_intervalId)
                p_intervalId = null
            }
        },

        /**
         * Возвращает текущий счетчик работ
         */
        getCurrentWorkCount(): number {
            return p_workCounter - 1
        }
    }
} 