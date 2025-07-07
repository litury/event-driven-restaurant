<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
    <!-- Header -->
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-2xl shadow-lg border border-slate-200 mb-6 p-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-slate-800 mb-2">
              🏭 Событийная система ресторана
            </h1>
            <p class="text-slate-600">
              Визуализация CEP системы в реальном времени
            </p>
          </div>
          
          <div class="flex items-center gap-3">
            <button 
              @click="start"
              :disabled="isRunning"
              :class="[
                'px-6 py-3 rounded-xl font-semibold transition-all duration-200',
                isRunning 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              ]"
            >
              <span class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                </svg>
                {{ isRunning ? 'Работает' : 'Открыть ресторан' }}
              </span>
            </button>
            
            <button 
              @click="stop"
              :disabled="!isRunning"
              :class="[
                'px-6 py-3 rounded-xl font-semibold transition-all duration-200',
                !isRunning 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              ]"
            >
              <span class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
                </svg>
                Закрыть ресторан
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon="📊" 
          title="Всего заказов" 
          :value="stats.ordersReceived" 
          color="blue"
          description="Обработано системой"
        />
        <StatCard 
          icon="⚡" 
          title="В процессе" 
          :value="totalOrdersInProcess" 
          color="orange"
          description="Активно готовятся"
        />
        <StatCard 
          icon="✅" 
          title="Готовых блюд" 
          :value="queueSizes.readyDishes" 
          color="green"
          description="Ждут выдачи"
        />
        <StatCard 
          icon="🔥" 
          title="Эффективность" 
          :value="`${Math.round(efficiency)}%`" 
          color="purple"
          description="Загрузка кухни"
        />
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Pipeline Visualization -->
        <div class="xl:col-span-2">
          <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                🔄 Конвейер обработки заказов
              </h2>
              <!-- Color Legend -->
              <div class="flex items-center gap-4 text-sm mt-2 lg:mt-0">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                  <span class="text-slate-600">Четные заказы (🍕)</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-red-600"></div>
                  <span class="text-slate-600">Нечетные заказы (🍔)</span>
                </div>
              </div>
            </div>
            
            <div class="space-y-6">
              <!-- Step 1: Orders -->
              <div class="relative">
                <PipelineStep
                  icon="📝"
                  title="Заказы"
                  :count="queueSizes.newOrders"
                  color="blue"
                  description="Новые заказы от клиентов"
                  :isActive="isRunning && queueSizes.newOrders > 0"
                />
                <!-- Floating Order Items -->
                <div class="absolute top-2 right-2 flex flex-wrap gap-1 max-w-32">
                  <div 
                    v-for="n in Math.min(queueSizes.newOrders, 8)" 
                    :key="`order-${n}`"
                    :class="[
                      'w-3 h-3 rounded-full border-2 border-white shadow-sm animate-pulse',
                      getOrderColor(n)
                    ]"
                    :title="`Заказ #${n}`"
                  ></div>
                </div>
              </div>
              
              <!-- Arrow with Flow Animation -->
              <div class="flex justify-center relative">
                <svg :class="[
                  'w-6 h-6 transition-all duration-300 z-10',
                  isRunning ? 'text-blue-500 animate-bounce' : 'text-slate-300'
                ]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
                <!-- Animated flow particles -->
                <div v-if="isRunning" class="absolute inset-0 flex justify-center">
                  <div 
                    v-for="i in 3" 
                    :key="`flow1-${i}`"
                    class="w-1 h-1 bg-blue-400 rounded-full absolute animate-ping"
                    :style="{ 
                      top: `${20 + i * 15}%`, 
                      animationDelay: `${i * 300}ms`,
                      animationDuration: '1s'
                    }"
                  ></div>
                </div>
              </div>

              <!-- Step 2: Assignment -->
              <div class="relative">
                <PipelineStep
                  icon="🤝"
                  title="Назначения"
                  :count="Math.max(queueSizes.assignments, visualQueues.assignments)"
                  color="amber"
                  description="Диспетчер назначает поваров"
                  :isActive="isRunning"
                  :timing="'100-300мс на решение'"
                />
                <!-- Assignment Queue Visualization -->
                <div class="absolute top-2 right-2 flex flex-wrap gap-1 max-w-32">
                  <div 
                    v-for="n in Math.min(Math.max(queueSizes.assignments, visualQueues.assignments), 6)" 
                    :key="`assign-${n}`"
                    :class="[
                      'w-3 h-3 rounded-full border-2 border-white shadow-sm',
                      'bg-gradient-to-r from-amber-400 to-amber-500 animate-bounce'
                    ]"
                    :style="{ animationDelay: `${n * 100}ms` }"
                    :title="`Назначение #${n}`"
                  ></div>
                </div>
              </div>
              
              <!-- Arrow -->
              <div class="flex justify-center">
                <svg :class="[
                  'w-6 h-6 transition-all duration-300',
                  isRunning ? 'text-amber-500 animate-bounce' : 'text-slate-300'
                ]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </div>

              <!-- Step 3: Kitchen -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Pizza Cook (Even Orders) -->
                <div class="relative">
                  <PipelineStep
                    icon="🍕"
                    title="Повар #1"
                    :count="Math.max(queueSizes.pizzaCook, visualQueues.pizzaCook)"
                    color="red"
                    description="Готовит четные заказы"
                    :isActive="isRunning && (queueSizes.pizzaCook > 0 || visualQueues.pizzaCook > 0)"
                    :timing="'1-3 сек приготовление'"
                  />
                  <!-- Even Orders Visualization -->
                  <div class="absolute top-2 right-2 flex flex-wrap gap-1 max-w-24">
                    <div 
                      v-for="n in Math.min(Math.max(queueSizes.pizzaCook, visualQueues.pizzaCook), 6)" 
                      :key="`pizza-${n}`"
                      class="w-4 h-4 rounded-full border-2 border-white shadow-md bg-gradient-to-r from-blue-400 to-blue-600 animate-spin"
                      :style="{ animationDuration: '2s', animationDelay: `${n * 200}ms` }"
                      :title="`Четный заказ готовится`"
                    >
                      <div class="w-full h-full rounded-full bg-white opacity-20"></div>
                    </div>
                  </div>
                </div>

                <!-- Burger Cook (Odd Orders) -->
                <div class="relative">
                  <PipelineStep
                    icon="🍔"
                    title="Повар #2"
                    :count="Math.max(queueSizes.burgerCook, visualQueues.burgerCook)"
                    color="orange"
                    description="Готовит нечетные заказы"
                    :isActive="isRunning && (queueSizes.burgerCook > 0 || visualQueues.burgerCook > 0)"
                    :timing="'1-3 сек приготовление'"
                  />
                  <!-- Odd Orders Visualization -->
                  <div class="absolute top-2 right-2 flex flex-wrap gap-1 max-w-24">
                    <div 
                      v-for="n in Math.min(Math.max(queueSizes.burgerCook, visualQueues.burgerCook), 6)" 
                      :key="`burger-${n}`"
                      class="w-4 h-4 rounded-full border-2 border-white shadow-md bg-gradient-to-r from-red-400 to-red-600 animate-spin"
                      :style="{ animationDuration: '2s', animationDelay: `${n * 200}ms` }"
                      :title="`Нечетный заказ готовится`"
                    >
                      <div class="w-full h-full rounded-full bg-white opacity-20"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Arrow -->
              <div class="flex justify-center">
                <svg :class="[
                  'w-6 h-6 transition-all duration-300',
                  isRunning ? 'text-green-500 animate-bounce' : 'text-slate-300'
                ]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </div>

              <!-- Step 4: Results -->
              <div class="relative">
                <PipelineStep
                  icon="🎯"
                  title="Готовые блюда"
                  :count="queueSizes.readyDishes"
                  color="green"
                  description="Готово к выдаче клиентам"
                  :isActive="isRunning && queueSizes.readyDishes > 0"
                />
                <!-- Ready Dishes Visualization -->
                <div class="absolute top-2 right-2 flex flex-wrap gap-1 max-w-32">
                  <div 
                    v-for="n in Math.min(queueSizes.readyDishes, 8)" 
                    :key="`ready-${n}`"
                    :class="[
                      'w-3 h-3 rounded-full border-2 border-white shadow-sm',
                      'bg-gradient-to-r from-green-400 to-green-600 animate-ping'
                    ]"
                    :style="{ animationDelay: `${n * 150}ms` }"
                    :title="`Готовое блюдо #${n}`"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Event Log -->
        <div class="xl:col-span-1">
          <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 h-fit">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                📋 Лог событий
              </h2>
              <div class="flex gap-2">
                <button
                  @click="clearEventLog"
                  class="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Очистить лог"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
                <button
                  @click="toggleAutoScroll"
                  :class="[
                    'p-2 rounded-lg transition-colors',
                    autoScrollEnabled 
                      ? 'text-blue-500 bg-blue-50' 
                      : 'text-slate-500 hover:text-blue-500 hover:bg-blue-50'
                  ]"
                  title="Автопрокрутка"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div 
              ref="eventLogContainer"
              class="h-96 overflow-y-auto custom-scrollbar space-y-2"
            >
              <div 
                v-for="event in eventLog" 
                :key="event.id"
                :class="[
                  'p-3 rounded-lg border-l-4 slide-in',
                  getEventStyles(event.type)
                ]"
              >
                <div class="flex items-start gap-2">
                  <span class="text-lg">{{ event.icon }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium text-slate-700 truncate">
                        {{ event.message }}
                      </p>
                      <span class="text-xs text-slate-500 ml-2 flex-shrink-0">
                        {{ formatTime(event.timestamp) }}
                      </span>
                    </div>
                    <p v-if="event.data" class="text-xs text-slate-500 mt-1">
                      {{ event.data }}
                    </p>
                  </div>
                </div>
              </div>
              
              <div v-if="eventLog.length === 0" class="text-center py-8 text-slate-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p>Ожидание событий...</p>
                <p class="text-xs mt-1">Запустите ресторан для просмотра потока данных</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Status -->
      <div class="mt-6">
        <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-slate-800 mb-1">
                🏪 Статус системы: {{ systemStatus }}
              </h3>
              <p class="text-slate-600">{{ getStatusDescription() }}</p>
            </div>
            <div class="flex items-center gap-3">
              <div :class="[
                'w-3 h-3 rounded-full transition-colors',
                isRunning ? 'bg-green-400' : 'bg-gray-300'
              ]"></div>
              <span class="text-sm font-medium text-slate-600">
                {{ isRunning ? 'Активен' : 'Остановлен' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onUnmounted } from 'vue'
import { useRestaurantVisualizer } from '../composables/useRestaurantVisualizer'
import { setGlobalEventLogger } from '../../WorkloadBalancing/services/workloadProcessors'
import StatCard from './StatCard.vue'
import PipelineStep from './PipelineStep.vue'

/**
 * Интерфейс для событий в логе
 * @interface LogEvent
 */
interface LogEvent {
  /** Уникальный идентификатор события */
  id: number
  /** Временная метка события */
  timestamp: number
  /** Тип события */
  type: 'order' | 'assignment' | 'cooking' | 'complete' | 'system'
  /** Иконка для отображения */
  icon: string
  /** Текст сообщения */
  message: string
  /** Дополнительные данные */
  data?: string | undefined
}

// Композабл ресторана
const {
  isRunning,
  queueSizes,
  restaurantStats,
  openRestaurant,
  closeRestaurant,
  totalOrdersInProcess,
  kitchenEfficiency,
  systemStatus,
  getRestaurantStatusDescription
} = useRestaurantVisualizer({
  updateIntervalMs: 100  // Более частое обновление для лучшей визуализации
})

// Симулируем визуальные очереди для промежуточных состояний
const visualQueues = reactive({
  assignments: 0,
  pizzaCook: 0,
  burgerCook: 0
})

// Анимируем промежуточные состояния
let simulationInterval: number | null = null

// Состояние логов
const eventLog = reactive<LogEvent[]>([])
const eventLogContainer = ref<HTMLElement>()
const autoScrollEnabled = ref(true)
let eventIdCounter = 0

// Алиасы
const stats = restaurantStats
const efficiency = kitchenEfficiency

// Управление системой
const start = () => {
  if (eventLogContainer.value) {
    setGlobalEventLogger((type: string, icon: string, message: string, data?: string) => {
      addEvent(type as LogEvent['type'], icon, message, data)
    })
  }
  startVisualSimulation()
  openRestaurant()
}

const stop = () => {
  stopVisualSimulation()
  closeRestaurant()
}

// Симуляция визуальных эффектов
function startVisualSimulation() {
  if (simulationInterval) return
  
  simulationInterval = window.setInterval(() => {
    // Симулируем краткие всплески в назначениях когда есть новые заказы
    if (queueSizes.newOrders > 0 && Math.random() > 0.7) {
      visualQueues.assignments = Math.min(3, Math.floor(Math.random() * 2) + 1)
      setTimeout(() => {
        visualQueues.assignments = Math.max(0, visualQueues.assignments - 1)
      }, 150)
    }
    
    // Симулируем активность поваров
    if (queueSizes.pizzaCook > 0 || Math.random() > 0.8) {
      visualQueues.pizzaCook = Math.min(queueSizes.pizzaCook + Math.floor(Math.random() * 2), 4)
    } else {
      visualQueues.pizzaCook = queueSizes.pizzaCook
    }
    
    if (queueSizes.burgerCook > 0 || Math.random() > 0.8) {
      visualQueues.burgerCook = Math.min(queueSizes.burgerCook + Math.floor(Math.random() * 2), 4)
    } else {
      visualQueues.burgerCook = queueSizes.burgerCook
    }
  }, 200)
}

function stopVisualSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
  visualQueues.assignments = 0
  visualQueues.pizzaCook = 0
  visualQueues.burgerCook = 0
}

/**
 * Добавляет новое событие в лог
 * @param {LogEvent['type']} type - тип события
 * @param {string} icon - иконка события
 * @param {string} message - сообщение
 * @param {string} [data] - дополнительные данные
 * @returns {void}
 */
function addEvent(type: LogEvent['type'], icon: string, message: string, data?: string) {
  const event: LogEvent = {
    id: ++eventIdCounter,
    timestamp: Date.now(),
    type,
    icon,
    message,
    data
  }
  
  eventLog.push(event)
  
  // Ограничиваем размер лога для производительности
  if (eventLog.length > 50) {
    eventLog.splice(0, eventLog.length - 50)
  }
  
  // Автопрокрутка при добавлении нового события
  if (autoScrollEnabled.value) {
    nextTick(() => {
      if (eventLogContainer.value) {
        eventLogContainer.value.scrollTop = eventLogContainer.value.scrollHeight
      }
    })
  }
}

function clearEventLog() {
  eventLog.splice(0, eventLog.length)
}

function toggleAutoScroll() {
  autoScrollEnabled.value = !autoScrollEnabled.value
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ru-RU', { 
    hour12: false,
    minute: '2-digit',
    second: '2-digit'
  })
}

function getEventStyles(type: LogEvent['type']): string {
  switch (type) {
    case 'order':
      return 'bg-blue-50 border-blue-400'
    case 'assignment':
      return 'bg-amber-50 border-amber-400'
    case 'cooking':
      return 'bg-red-50 border-red-400'
    case 'complete':
      return 'bg-green-50 border-green-400'
    case 'system':
      return 'bg-purple-50 border-purple-400'
    default:
      return 'bg-gray-50 border-gray-400'
  }
}

function getStatusDescription(): string {
  return getRestaurantStatusDescription()
}

// Цветовая кодировка заказов
function getOrderColor(orderNumber: number): string {
  if (orderNumber % 2 === 0) {
    // Четные заказы - синие (пицца) 
    return 'bg-gradient-to-r from-blue-400 to-blue-600'
  } else {
    // Нечетные заказы - красные (бургеры)
    return 'bg-gradient-to-r from-red-400 to-red-600'
  }
}

// Очистка при размонтировании
onUnmounted(() => {
  stopVisualSimulation()
})
</script>

 