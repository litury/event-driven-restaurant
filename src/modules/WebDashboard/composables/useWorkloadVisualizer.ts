import { ref, computed, onUnmounted, type Ref } from 'vue'
import { createWorkloadSystem } from '../../WorkloadBalancing'
import type { IWorkloadSystemConfig } from '../../WorkloadBalancing/services/workloadSystem'
import type { IWebDashboardConfig } from '../interfaces'

/**
 * Композабл для веб-визуализации событийной системы балансировки работы
 * 
 * @description Реализует адаптационную логику между бизнес-модулем (WorkloadBalancing) и UI.
 * Событийные системы состоят из одинаковых компонентов, 
 * которые работают по одинаковым принципам
 * 
 * Архитектура системы (4 участка, 5 очередей):
 * 1. 📝 Генератор работ → очередь работ (случайные числа по таймеру)
 * 2. 🤝 ZIP-процессор → очередь назначений (объединяет работы с "я свободен")  
 * 3. 🔀 Фильтр → очереди рабочих (четные к рабочему 1, нечетные к рабочему 2)
 * 4. 👷 Рабочие → очередь результатов + циркуляция заявок "я свободен"
 * 
 * @param {Partial<IWebDashboardConfig>} _config - конфигурация веб-дашборда
 * @returns {Object} реактивное состояние и методы управления системой
 */
export function useWorkloadVisualizer(_config?: Partial<IWebDashboardConfig>) {
    // Конфигурация по умолчанию для UI слоя
    const p_config: IWebDashboardConfig = {
        updateIntervalMs: 200, // Частота обновления UI
        maxDisplayItems: 10,   // Лимит отображения для производительности
        animationEnabled: true, // Анимации потоков событий
        autoStart: false,      // Ручной запуск для демонстрации
        ..._config
    }

    // Создаем бизнес-систему (отделяем UI логику от бизнес-логики)
    const p_businessSystem = createWorkloadSystem({
        workGenerationIntervalMs: 1500, // Генерация работ каждые 1.5 сек
        maxWorks: 100,                  // Максимум работ для демонстрации
        autoStart: false                // Управляем запуском из UI
    })

    // UI состояние (реактивные данные для Vue)
    const p_isRunning = ref(false)
    const p_uiUpdateInterval: Ref<NodeJS.Timeout | null> = ref(null)

    /**
     * Реактивные размеры всех 5 очередей событийной системы
     * 
     * @description Очередь - это фиксирующее оборудование для событий
     * Каждая очередь представляет определенный этап обработки в системе
     */
    const p_queueSizes = ref({
        workQueue: 0,        // 📝 Очередь сырых работ (числа от генератора)
        freeWorkersQueue: 0, // 👥 Заявки "я свободен" (циркулируют рабочие 1 и 2)
        assignmentQueue: 0,  // 📋 ZIP назначения (работа + свободный рабочий)
        worker1Queue: 0,     // 🔧 Очередь рабочего 1 (четные числа)
        worker2Queue: 0,     // ⚙️ Очередь рабочего 2 (нечетные числа)
        resultQueue: 0       // ✅ Обработанные результаты (не используется пока)
    })

    /**
     * Статистика работы системы
     * 
     * Позволяет наблюдать эффективность событийной обработки в реальном времени
     */
    const p_stats = ref({
        generatedWorks: 0,  // Сколько работ сгенерировано
        processedWorks: 0   // Сколько работ обработано рабочими
    })

    /**
     * Обновляет UI состояние из бизнес-системы
     * 
     * Адаптационная функция: преобразует бизнес-данные в UI-данные
     * Согласно принципу: UI → Бизнес (зависимость только в одну сторону)
     */
    const updateUIStateAsync = (): void => {
        const businessState = p_businessSystem.getState()

        // Обновляем статус системы
        p_isRunning.value = businessState.isRunning

        // Адаптируем размеры очередей для UI
        p_queueSizes.value = {
            workQueue: businessState.queues.workQueue.size(),
            freeWorkersQueue: businessState.queues.freeWorkersQueue.size(),
            assignmentQueue: businessState.queues.assignmentQueue.size(),
            worker1Queue: businessState.queues.worker1Queue.size(),
            worker2Queue: businessState.queues.worker2Queue.size(),
            resultQueue: businessState.queues.resultQueue.size()
        }

        // Обновляем статистику обработки
        p_stats.value = {
            generatedWorks: businessState.generatedWorks,
            processedWorks: businessState.processedWorks
        }
    }

    /**
     * Запускает событийную систему балансировки
     * 
     * @description Все начинается с того, что рабочие говорят 'я свободен'
     * Система автоматически инициализирует циркуляцию заявок свободных рабочих
     */
    const startAsync = async (): Promise<void> => {
        await p_businessSystem.startAsync()
        updateUIStateAsync()

        // Запускаем UI обновления с заданной частотой
        p_uiUpdateInterval.value = setInterval(updateUIStateAsync, p_config.updateIntervalMs)
    }

    /**
     * Останавливает систему и очищает UI ресурсы
     * 
     * Важно правильно освобождать ресурсы для предотвращения утечек памяти
     */
    const stopAsync = async (): Promise<void> => {
        await p_businessSystem.stopAsync()

        // Очищаем UI таймер
        if (p_uiUpdateInterval.value) {
            clearInterval(p_uiUpdateInterval.value)
            p_uiUpdateInterval.value = null
        }

        updateUIStateAsync()
    }

    /**
     * Общее количество элементов во всех очередях
     * 
     * Computed свойство для отображения общей загрузки событийной системы
     */
    const totalQueueItems = computed((): number =>
        Object.values(p_queueSizes.value).reduce((_sum, _size) => _sum + _size, 0)
    )

    /**
     * Эффективность системы в процентах
     * 
     * Показывает соотношение обработанных работ к сгенерированным
     * Демонстрирует производительность событийной архитектуры
     */
    const efficiency = computed((): number => {
        if (p_stats.value.generatedWorks === 0) return 0
        return Math.round((p_stats.value.processedWorks / p_stats.value.generatedWorks) * 100)
    })

    /**
     * Статус активности системы для UI индикаторов
     * 
     * Показывает текущее состояние: "Работает" | "Остановлена" | "Запускается"
     */
    const systemStatus = computed((): string => {
        if (p_isRunning.value) return 'Работает'
        if (totalQueueItems.value > 0) return 'Завершается'
        return 'Остановлена'
    })

    // Автоматическая очистка при размонтировании компонента
    onUnmounted(() => {
        stopAsync()
    })

    // Публичный API композабла
    return {
        // Конфигурация
        config: p_config,

        // Состояние системы
        isRunning: p_isRunning,
        queueSizes: p_queueSizes,
        stats: p_stats,

        // Методы управления
        start: startAsync,
        stop: stopAsync,

        // Вычисляемые свойства
        totalQueueItems,
        efficiency,
        systemStatus
    }
} 