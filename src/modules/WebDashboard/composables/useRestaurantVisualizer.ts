import { ref, computed, onMounted, onUnmounted, reactive, readonly } from 'vue'
import { WorkloadSystem } from '../../WorkloadBalancing'
import type { IWebDashboardConfig } from '../interfaces'

/**
 * Композабл для визуализации ресторана быстрого питания
 * 
 * Превращает абстрактную событийную систему в понятную метафору ресторана:
 * - 📱 Заказы через приложение (генератор работ)
 * - 🤝 Диспетчер кухни (ZIP-процессор) 
 * - 👨‍🍳 Повара пиццы/бургеров (рабочие)
 * - 🚗 Выдача готовых блюд (результаты)
 * 
 * @description Принципы CEP в ресторане:
 * - События = заказы клиентов (неизменяемые, строго упорядоченные)
 * - Очереди = станции кухни (буферизуют потоки заказов)
 * - Процессоры = персонал ресторана (обрабатывают заказы)
 * - Time consistency = своевременная доставка блюд
 * 
 * @param {IWebDashboardConfig} config - конфигурация интерфейса
 * @returns {Object} API для управления рестораном и получения статистики
 */
export function useRestaurantVisualizer(config: IWebDashboardConfig = {}) {
    // Система балансировки работ (универсальная основа)
    const p_workloadSystem = ref<WorkloadSystem | null>(null)

    // Статус ресторана
    const isRunning = ref(false)
    const systemStatus = ref<'Остановлен' | 'Работает' | 'Завершается'>('Остановлен')

    // Интервалы обновления (для реалистичности ресторана делаем чаще)
    const p_updateIntervalId = ref<number | null>(null)
    const p_updateIntervalMs = config.updateIntervalMs ?? 500 // Чаще для динамики

    // 🏪 **Статистика ресторана**
    const restaurantStats = reactive({
        ordersReceived: 0,        // 📱 Принято заказов через приложение
        dishesCompleted: 0,       // ✅ Готово блюд поварами
        averageWaitTime: 0,       // ⏱️ Среднее время ожидания
        rushHourActive: false     // 🕐 Час пик активен
    })

    // 📊 **Размеры очередей ресторана** 
    const queueSizes = reactive({
        newOrders: 0,           // 📱 Новые заказы от клиентов
        availableCooks: 0,      // 👨‍🍳 Свободные повара  
        assignments: 0,         // 📋 Назначения от диспетчера
        pizzaCook: 0,          // 🍕 Очередь повара пиццы
        burgerCook: 0,         // 🍔 Очередь повара бургеров
        readyDishes: 0         // 🚗 Готовые блюда для выдачи
    })

    // 🔄 **Вычисляемые показатели ресторана**

    /**
     * Общее количество заказов в обработке
     * @description Показывает нагрузку на кухню
     * @returns {ComputedRef<number>} сумма всех заказов в очередях
     */
    const totalOrdersInProcess = computed(() => {
        return queueSizes.newOrders +
            queueSizes.assignments +
            queueSizes.pizzaCook +
            queueSizes.burgerCook
    })

    /**
     * Эффективность кухни в процентах
     * @description Соотношение готовых блюд к принятым заказам
     * @returns {ComputedRef<number>} процент эффективности (0-100)
     */
    const kitchenEfficiency = computed(() => {
        if (restaurantStats.ordersReceived === 0) return 0
        return Math.round((restaurantStats.dishesCompleted / restaurantStats.ordersReceived) * 100)
    })

    /**
     * Статус загруженности ресторана
     * @description Определяет текущее состояние нагрузки на основе количества заказов
     * @returns {ComputedRef<string>} текстовое описание загруженности
     */
    const restaurantBusyStatus = computed(() => {
        const totalOrders = totalOrdersInProcess.value
        if (totalOrders === 0) return 'Спокойно'
        if (totalOrders < 5) return 'Нормальная загрузка'
        if (totalOrders < 10) return 'Высокая загрузка'
        return 'Час пик!'
    })

    /**
     * Запускает ресторан для приема заказов
     * @description Открывает ресторан и инициализирует событийную систему
     * @returns {Promise<void>} промис завершения операции
     */
    async function openRestaurantAsync() {
        try {
            if (p_workloadSystem.value) {
                console.log('🍔 Открываем ресторан...')
                systemStatus.value = 'Работает'

                await p_workloadSystem.value.startAsync()
                isRunning.value = true

                // Запускаем обновление статистики ресторана
                p_startStatsUpdate()

                console.log('✅ Ресторан открыт! Принимаем заказы.')
            }
        } catch (error) {
            console.error('❌ Ошибка при открытии ресторана:', error)
            systemStatus.value = 'Остановлен'
        }
    }

    /**
     * Закрывает ресторан и завершает работу
     * @description Завершает работу системы, дорабатывает текущие заказы
     * @returns {Promise<void>} промис завершения операции
     */
    async function closeRestaurantAsync() {
        try {
            if (p_workloadSystem.value && isRunning.value) {
                console.log('🏪 Закрываем ресторан...')
                systemStatus.value = 'Завершается'

                p_stopStatsUpdate()
                await p_workloadSystem.value.stopAsync()

                isRunning.value = false
                systemStatus.value = 'Остановлен'

                console.log('✅ Ресторан закрыт.')
            }
        } catch (error) {
            console.error('❌ Ошибка при закрытии ресторана:', error)
        }
    }

    /**
     * 📊 **Обновить статистику ресторана**
     * Получает данные из событийной системы и адаптирует под ресторанные метафоры
     */
    function p_updateRestaurantStats() {
        if (!p_workloadSystem.value) return

        try {
            // Получаем полное состояние из бизнес-системы
            const state = p_workloadSystem.value.getState()

            // 🔄 Маппинг технических очередей на ресторанные метафоры
            queueSizes.newOrders = state.queues.workQueue.size()           // Заказы клиентов
            queueSizes.availableCooks = state.queues.freeWorkersQueue.size()  // Свободные повара
            queueSizes.assignments = state.queues.assignmentQueue.size()   // Назначения диспетчера
            queueSizes.pizzaCook = state.queues.worker1Queue.size()        // Повар пиццы (четные номера)
            queueSizes.burgerCook = state.queues.worker2Queue.size()       // Повар бургеров (нечетные)
            queueSizes.readyDishes = state.queues.resultQueue.size()       // Готовые блюда

            // Обновляем общую статистику ресторана
            restaurantStats.ordersReceived = state.generatedWorks
            restaurantStats.dishesCompleted = state.processedWorks

            // Определяем час пик по количеству заказов в очередях
            restaurantStats.rushHourActive = totalOrdersInProcess.value > 8

        } catch (error) {
            console.error('❌ Ошибка обновления статистики ресторана:', error)
        }
    }

    /**
     * ⏰ **Запустить периодическое обновление**
     */
    function p_startStatsUpdate() {
        if (p_updateIntervalId.value) return

        p_updateIntervalId.value = window.setInterval(() => {
            p_updateRestaurantStats()
        }, p_updateIntervalMs)
    }

    /**
     * ⏸️ **Остановить обновление**
     */
    function p_stopStatsUpdate() {
        if (p_updateIntervalId.value) {
            clearInterval(p_updateIntervalId.value)
            p_updateIntervalId.value = null
        }
    }

    /**
     * 🎬 **Получить описание текущего статуса**
     * Объясняет что происходит в ресторане простыми словами
     */
    function getRestaurantStatusDescription(): string {
        if (systemStatus.value === 'Работает') {
            const busyStatus = restaurantBusyStatus.value
            if (busyStatus === 'Час пик!') {
                return `🔥 ${busyStatus} Повара работают на полную мощность!`
            }
            return `🍽️ ${busyStatus}. Ресторан обслуживает клиентов.`
        } else if (systemStatus.value === 'Завершается') {
            return '🧹 Ресторан закрывается... Дорабатываем последние заказы.'
        } else {
            return '🏪 Ресторан закрыт. Нажмите "Открыть ресторан" чтобы начать работу.'
        }
    }

    // 🚀 **Инициализация при монтировании**
    onMounted(() => {
        console.log('🍔 Инициализация ресторанной системы...')

        // Создаем событийную систему (универсальную основу)
        p_workloadSystem.value = new WorkloadSystem({
            workGenerationIntervalMs: 800,  // Быстрые заказы
            maxWorks: 999,                  // Практически бесконечно
            autoStart: false
        })

        console.log('✅ Ресторан готов к работе!')
    })

    // Алиасы для обратной совместимости
    const openRestaurant = openRestaurantAsync
    const closeRestaurant = closeRestaurantAsync

    // Очистка при размонтировании
    onUnmounted(() => {
        console.log('🧹 Завершение работы ресторана...')
        closeRestaurantAsync()
    })

    /**
     * Публичный API композабла
     * @description Возвращает интерфейс для управления рестораном и получения статистики
     */
    return {
        // Управление рестораном
        isRunning: readonly(isRunning),
        systemStatus: readonly(systemStatus),
        openRestaurant,
        closeRestaurant,

        // Статистика и метрики
        restaurantStats: readonly(restaurantStats),
        queueSizes: readonly(queueSizes),
        totalOrdersInProcess,
        kitchenEfficiency,
        restaurantBusyStatus,

        // Описания статусов
        getRestaurantStatusDescription,

        // Для совместимости с базовым интерфейсом
        start: openRestaurant,
        stop: closeRestaurant,
        stats: computed(() => ({
            generatedWorks: restaurantStats.ordersReceived,
            processedWorks: restaurantStats.dishesCompleted
        })),
        efficiency: kitchenEfficiency,
        totalQueueItems: computed(() =>
            Object.values(queueSizes).reduce((sum, count) => sum + count, 0)
        )
    }
} 