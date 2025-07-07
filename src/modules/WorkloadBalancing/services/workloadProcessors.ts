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

// Глобальный логгер событий (будет устанавливаться из UI)
let globalEventLogger: ((type: string, icon: string, message: string, data?: string) => void) | null = null

/**
 * Установить глобальный логгер событий
 * @param {function} logger - функция для логирования событий
 * @returns {void}
 */
export function setGlobalEventLogger(logger: (type: string, icon: string, message: string, data?: string) => void) {
    globalEventLogger = logger
}

/**
 * Логирует событие если установлен глобальный логгер
 * @param {string} type - тип события
 * @param {string} icon - иконка события
 * @param {string} message - сообщение
 * @param {string} [data] - дополнительные данные
 * @returns {void}
 */
function logEvent(type: string, icon: string, message: string, data?: string) {
    if (globalEventLogger) {
        globalEventLogger(type, icon, message, data)
    }
}

/**
 * ZIP-процессор объединяет потоки работ и рабочих
 * @description Ожидает одновременно работу и свободного рабочего, создает назначение
 * @param {IEventQueue<IWorkItem>} _workQueue - очередь работ
 * @param {IEventQueue<IWorkerFreeEvent>} _freeWorkersQueue - очередь свободных рабочих  
 * @param {IEventQueue<IWorkAssignment>} _assignmentQueue - очередь назначений
 * @returns {Promise<void>} промис завершения операции
 */
export const createZipProcessorAsync: ZipProcessorFunction = async (
    _workQueue: IEventQueue<IWorkItem>,
    _freeWorkersQueue: IEventQueue<IWorkerFreeEvent>,
    _assignmentQueue: IEventQueue<IWorkAssignment>
): Promise<void> => {
    // Ждем одновременно работу И рабочего
    const workItem = await _workQueue.dequeueAsync()
    const workerId = await _freeWorkersQueue.dequeueAsync()

    logEvent('assignment', '🤝', `Заказ #${workItem} назначен повару #${workerId}`, `Заказ: ${workItem}`)

    // 🤝 ВРЕМЯ ДИСПЕТЧЕРА на принятие решения (100-300мс)
    const decisionTimeMs = Math.random() * 200 + 100 // 100-300мс
    await new Promise(resolve => setTimeout(resolve, decisionTimeMs))

    // Создаем назначение как неизменяемый объект
    const assignment: IWorkAssignment = {
        workItem,
        workerId
    } as const

    // Отправляем назначение в выходную очередь
    await _assignmentQueue.enqueueAsync(assignment)
}

/**
 * Фильтр-процессор распределяет назначения по рабочим
 * @description Получает назначения и отправляет их в очереди рабочих по принципу четные/нечетные
 * @param {IEventQueue<IWorkAssignment>} _assignmentQueue - очередь назначений
 * @param {IEventQueue<IWorkItem>} _worker1Queue - очередь для рабочего 1 (четные)
 * @param {IEventQueue<IWorkItem>} _worker2Queue - очередь для рабочего 2 (нечетные)
 * @returns {Promise<void>} промис завершения операции
 */
export const createFilterProcessorAsync: FilterProcessorFunction = async (
    _assignmentQueue: IEventQueue<IWorkAssignment>,
    _worker1Queue: IEventQueue<IWorkItem>,
    _worker2Queue: IEventQueue<IWorkItem>
): Promise<void> => {
    // Получаем назначение
    const assignment = await _assignmentQueue.dequeueAsync()

    // 📋 ВРЕМЯ ФИЛЬТРА на анализ и распределение (50-150мс)
    const analysisTimeMs = Math.random() * 100 + 50 // 50-150мс
    await new Promise(resolve => setTimeout(resolve, analysisTimeMs))

    // Функциональное распределение по НОМЕРУ РАБОТЫ (workItem), а не по номеру рабочего!
    // Распределение: четные числа → рабочий 1, нечетные → рабочий 2
    const routeToWorker = pipe(
        (workItem: number) => {
            // Для четных чисел (включая 0): 0, 2, 4, 6... → worker1
            // Для нечетных чисел: 1, 3, 5, 7... → worker2
            const isEven = workItem % 2 === 0
            return isEven ? 'worker1' : 'worker2'
        }
    )

    const targetWorker = routeToWorker(assignment.workItem) // ✅ Используем workItem!

    logEvent('assignment', '📋', `Заказ #${assignment.workItem} направлен к повару #${targetWorker === 'worker1' ? '1' : '2'}`, `Заказ: ${assignment.workItem}`)

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

    logEvent('cooking', '🍳', `Повар #${_workerId} начал готовить заказ #${workItem}`, `Заказ: ${workItem}`)

    // 🍳 РЕАЛИСТИЧНОЕ ВРЕМЯ ПРИГОТОВЛЕНИЯ (1-3 секунды)
    const cookingTimeMs = Math.random() * 2000 + 1000 // 1000-3000мс
    await new Promise(resolve => setTimeout(resolve, cookingTimeMs))

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

    logEvent('complete', '✅', `Заказ #${workItem} готов! Повар #${_workerId} освободился`, `Результат: ${processedResult}`)

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
                    logEvent('order', '📝', `Новый заказ #${p_workCounter} принят`, `Заказ: ${p_workCounter}`)
                    p_workCounter++
                } else {
                    // Автоматически останавливаем когда достигли лимита
                    logEvent('system', '⏹️', 'Генерация заказов завершена', `Всего: ${_maxWorks}`)
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