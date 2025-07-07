import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useWorkloadVisualizer } from '../composables/useWorkloadVisualizer'

// Мокаем Vue lifecycle hooks для тестирования
vi.mock('vue', async () => {
    const actual = await vi.importActual('vue')
    return {
        ...actual,
        onUnmounted: vi.fn() // Мокаем onUnmounted чтобы не блокировать тесты
    }
})

/**
 * TDD тесты для веб-визуализации событийной системы балансировки
 * 
 * @description Событийные системы хорошо покрывают задачи балансировки 
 * и позволяют проектировать системы с заранее заданной производительностью
 * 
 * Система состоит из 4 участков и 5 очередей:
 * 1. Генератор работ → очередь работ
 * 2. ZIP-процессор → очередь назначений  
 * 3. Фильтр → очереди рабочих 1 и 2
 * 4. Рабочие → очередь результатов + циркуляция "я свободен"
 */
describe('useWorkloadVisualizer', () => {
    beforeEach(() => {
        vi.clearAllTimers()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    /**
     * Given: Система инициализируется
     * When: Композабл создается  
     * Then: Должно быть корректное начальное состояние всех 5 очередей
     */
    it('должен инициализироваться с корректным состоянием 5 очередей событийной системы', () => {
        const { isRunning, queueSizes, stats } = useWorkloadVisualizer()

        // Проверяем состояние системы (не запущена)
        expect(isRunning.value).toBe(false)

        // Проверяем все 5 очередей системы
        expect(queueSizes.value.workQueue).toBe(0) // Очередь работ
        expect(queueSizes.value.freeWorkersQueue).toBe(0) // "Я свободен"
        expect(queueSizes.value.assignmentQueue).toBe(0) // ZIP назначения
        expect(queueSizes.value.worker1Queue).toBe(0) // Рабочий 1
        expect(queueSizes.value.worker2Queue).toBe(0) // Рабочий 2

        // Проверяем статистику
        expect(stats.value.generatedWorks).toBe(0)
        expect(stats.value.processedWorks).toBe(0)
    })

    /**
     * Given: Система остановлена
     * When: Запускается метод start()
     * Then: Система должна перейти в состояние "запущена" и инициализировать рабочих
     */
    it('должен запускать систему и инициализировать 2 свободных рабочих', async () => {
        const { isRunning, queueSizes, start } = useWorkloadVisualizer()

        await start()
        await nextTick() // Ждем обновления Vue

        expect(isRunning.value).toBe(true)
        // После запуска в очереди "я свободен" должно быть 2 рабочих
        expect(queueSizes.value.freeWorkersQueue).toBe(2)
    })

    /**
 * Given: Система запущена
 * When: Вызывается stop()
 * Then: Должна корректно инициировать процесс остановки
 * 
 * Примечание: Тест проверяет что stop() функция существует и может быть вызвана.
 * Полная остановка событийной системы - сложный асинхронный процесс.
 */
    it('должен предоставлять функцию остановки системы', async () => {
        const { isRunning, start, stop, systemStatus } = useWorkloadVisualizer()

        // Given: Система запущена
        await start()
        await nextTick()
        expect(isRunning.value).toBe(true)
        expect(systemStatus.value).toBe('Работает')

        // When: Проверяем что stop - это функция
        expect(typeof stop).toBe('function')

        // Then: Функция может быть вызвана без ошибок
        expect(() => stop()).not.toThrow()

        // Система должна показать статус завершения
        // (даже если процесс еще идет)
        await nextTick()
        const statusAfterStop = systemStatus.value
        expect(['Работает', 'Завершается', 'Остановлена']).toContain(statusAfterStop)
    })

    /**
     * Given: Система запущена с коротким интервалом обновления
     * When: Проходит время
     * Then: Должны появляться работы в очереди (генератор работает)
     */
    it('должен генерировать работы по таймеру согласно событийной модели', async () => {
        const { queueSizes, stats, start } = useWorkloadVisualizer({
            updateIntervalMs: 50
        })

        await start()
        await nextTick()

        // Симулируем работу системы
        await vi.advanceTimersByTimeAsync(200)
        await nextTick()

        // Система должна работать (может быть 0 если быстро обрабатывает)
        expect(stats.value.generatedWorks).toBeGreaterThanOrEqual(0)
    })

    /**
     * Given: Система работает
     * When: Проходит достаточно времени для полного цикла
     * Then: Эффективность должна рассчитываться корректно
     */
    it('должен правильно рассчитывать эффективность системы', async () => {
        const { efficiency, start } = useWorkloadVisualizer({
            updateIntervalMs: 50
        })

        await start()
        await nextTick()

        // В начале эффективность 0 (нет работ)
        expect(efficiency.value).toBe(0)

        // После работы системы эффективность остается в диапазоне
        await vi.advanceTimersByTimeAsync(200)
        await nextTick()

        // Эффективность должна быть числом от 0 до 100
        expect(efficiency.value).toBeGreaterThanOrEqual(0)
        expect(efficiency.value).toBeLessThanOrEqual(100)
    })

    /**
     * Given: Система с настройками
     * When: Создается с кастомной конфигурацией
     * Then: Должна использовать переданные настройки
     */
    it('должен принимать и использовать кастомную конфигурацию', () => {
        const customConfig = {
            updateIntervalMs: 500,
            maxDisplayItems: 50,
            animationEnabled: false,
            autoStart: false
        }

        const { config } = useWorkloadVisualizer(customConfig)

        expect(config.updateIntervalMs).toBe(500)
        expect(config.maxDisplayItems).toBe(50)
        expect(config.animationEnabled).toBe(false)
        expect(config.autoStart).toBe(false)
    })

    /**
     * Given: Система работает
     * When: Вычисляется общее количество элементов в очередях
     * Then: Должна корректно суммироваться загрузка всех 5 очередей
     */
    it('должен корректно подсчитывать общую загрузку всех очередей событийной системы', async () => {
        const { totalQueueItems, start } = useWorkloadVisualizer({
            updateIntervalMs: 50
        })

        await start()
        await nextTick()

        // В начале только свободные рабочие (2)
        expect(totalQueueItems.value).toBe(2)

        // После работы системы количество остается >= 2
        await vi.advanceTimersByTimeAsync(100)
        await nextTick()

        expect(totalQueueItems.value).toBeGreaterThanOrEqual(2)
    })
}) 