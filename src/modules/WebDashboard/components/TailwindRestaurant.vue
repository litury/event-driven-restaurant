<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-lg border border-orange-200 mb-6 p-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-orange-800 mb-2">
              🍕 Кухня ресторана
            </h1>
            <p class="text-orange-600">
              Процесс приготовления заказов • Живая визуализация CEP
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
                🚀 {{ isRunning ? 'Работает' : 'Открыть кухню' }}
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
                ⏹️ Закрыть кухню
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-md border border-orange-100">
          <div class="text-2xl font-bold text-blue-600">{{ stats.ordersReceived }}</div>
          <div class="text-sm text-gray-600">Всего заказов</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-md border border-orange-100">
          <div class="text-2xl font-bold text-orange-600">{{ totalOrdersInProcess }}</div>
          <div class="text-sm text-gray-600">Готовятся</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-md border border-orange-100">
          <div class="text-2xl font-bold text-green-600">{{ queueSizes.readyDishes }}</div>
          <div class="text-sm text-gray-600">Готово</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-md border border-orange-100">
          <div class="text-2xl font-bold text-purple-600">{{ Math.round(efficiency) }}%</div>
          <div class="text-sm text-gray-600">Эффективность</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Kitchen Flow -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Orders Queue -->
          <div class="bg-white rounded-xl shadow-lg border border-orange-200 p-6">
            <h2 class="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
              📝 Очередь заказов
            </h2>
            <div class="flex items-center justify-between">
              <div class="text-3xl font-bold text-blue-600">
                {{ queueSizes.newOrders }}
              </div>
              <div class="text-sm text-gray-600">
                {{ queueSizes.newOrders > 0 ? 'Ожидают обработки' : 'Нет заказов' }}
              </div>
            </div>
            <div class="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                :class="[
                  'h-full transition-all duration-500',
                  queueSizes.newOrders > 0 ? 'bg-blue-500' : 'bg-gray-300'
                ]"
                :style="{ width: `${Math.min(queueSizes.newOrders * 20, 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Kitchen Workers -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Cook 1 -->
            <div class="bg-white rounded-xl shadow-lg border border-red-200 p-6">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl">🍕</span>
                <div>
                  <h3 class="text-lg font-bold text-red-800">Повар #1</h3>
                  <p class="text-sm text-red-600">Четные заказы</p>
                </div>
              </div>
              
              <div class="flex items-center justify-between mb-3">
                <div class="text-2xl font-bold text-red-600">
                  {{ queueSizes.pizzaCook }}
                </div>
                <div :class="[
                  'px-3 py-1 rounded-full text-sm font-medium',
                  queueSizes.pizzaCook > 0 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-gray-100 text-gray-600'
                ]">
                  {{ queueSizes.pizzaCook > 0 ? 'Готовит' : 'Свободен' }}
                </div>
              </div>
              
              <div class="space-y-2">
                <div v-for="n in Math.max(0, Math.min(queueSizes.pizzaCook || 0, 3))" :key="n" 
                     class="h-2 bg-red-200 rounded animate-pulse">
                </div>
              </div>
            </div>

            <!-- Cook 2 -->
            <div class="bg-white rounded-xl shadow-lg border border-orange-200 p-6">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl">🍔</span>
                <div>
                  <h3 class="text-lg font-bold text-orange-800">Повар #2</h3>
                  <p class="text-sm text-orange-600">Нечетные заказы</p>
                </div>
              </div>
              
              <div class="flex items-center justify-between mb-3">
                <div class="text-2xl font-bold text-orange-600">
                  {{ queueSizes.burgerCook }}
                </div>
                <div :class="[
                  'px-3 py-1 rounded-full text-sm font-medium',
                  queueSizes.burgerCook > 0 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-600'
                ]">
                  {{ queueSizes.burgerCook > 0 ? 'Готовит' : 'Свободен' }}
                </div>
              </div>
              
              <div class="space-y-2">
                <div v-for="n in Math.max(0, Math.min(queueSizes.burgerCook || 0, 3))" :key="n" 
                     class="h-2 bg-orange-200 rounded animate-pulse">
                </div>
              </div>
            </div>
          </div>

          <!-- Ready Dishes -->
                      <div class="bg-white rounded-xl shadow-lg border border-green-200 p-6">
            <h2 class="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
              ✅ Готовые блюда
            </h2>
            <div class="flex items-center justify-between">
              <div class="text-3xl font-bold text-green-600">
                {{ queueSizes.readyDishes }}
              </div>
              <div class="text-sm text-gray-600">
                {{ queueSizes.readyDishes > 0 ? 'К выдаче' : 'Нет готовых' }}
              </div>
            </div>
            <div class="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                :class="[
                  'h-full transition-all duration-500',
                  queueSizes.readyDishes > 0 ? 'bg-green-500' : 'bg-gray-300'
                ]"
                :style="{ width: `${Math.min(queueSizes.readyDishes * 25, 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Event Log -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-lg border border-orange-200 p-6 sticky top-4">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-orange-800">🔔 События</h2>
              <button
                @click="clearEventLog"
                class="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Очистить"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
            
            <div 
              ref="eventLogContainer"
              class="h-96 overflow-y-auto custom-scrollbar space-y-2"
            >
              <div 
                v-for="event in eventLog.slice(-20)" 
                :key="event.id"
                :class="[
                  'p-3 rounded-lg text-sm slide-in',
                  getEventBg(event.type)
                ]"
              >
                <div class="flex items-start gap-2">
                  <span>{{ event.icon }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-800 text-xs">
                      {{ event.message }}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      {{ formatTime(event.timestamp) }}
                    </p>
                  </div>
                </div>
              </div>
              
              <div v-if="eventLog.length === 0" class="text-center py-8 text-gray-500">
                <span class="text-4xl mb-2 block">😴</span>
                <p class="text-sm">Ожидание заказов...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Footer -->
      <div class="mt-6 bg-white rounded-xl shadow-lg border border-orange-200 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div :class="[
              'w-3 h-3 rounded-full',
              isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
            ]"></div>
            <span class="font-medium text-gray-800">
              {{ systemStatus }}
            </span>
          </div>
          <div class="text-sm text-gray-600">
            {{ getStatusDescription() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { useRestaurantVisualizer } from '../composables/useRestaurantVisualizer'
import { setGlobalEventLogger } from '../../WorkloadBalancing/services/workloadProcessors'

// Типы для событий
interface LogEvent {
  id: number
  timestamp: number
  type: 'order' | 'assignment' | 'cooking' | 'complete' | 'system'
  icon: string
  message: string
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
  updateIntervalMs: 200 // Быстрое обновление для ресторана
})

// Состояние логов
const eventLog = reactive<LogEvent[]>([])
const eventLogContainer = ref<HTMLElement>()
let eventIdCounter = 0

// Алиасы
const stats = restaurantStats
const efficiency = kitchenEfficiency

// Управление системой
const start = () => {
  setGlobalEventLogger((type: string, icon: string, message: string, data?: string) => {
    addEvent(type as LogEvent['type'], icon, message, data)
  })
  openRestaurant()
}

const stop = closeRestaurant

// Функции лога
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
  if (eventLog.length > 30) {
    eventLog.splice(0, eventLog.length - 30)
  }
  
  // Автопрокрутка
  nextTick(() => {
    if (eventLogContainer.value) {
      eventLogContainer.value.scrollTop = eventLogContainer.value.scrollHeight
    }
  })
}

function clearEventLog() {
  eventLog.splice(0, eventLog.length)
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ru-RU', { 
    hour12: false,
    minute: '2-digit',
    second: '2-digit'
  })
}

function getEventBg(type: LogEvent['type']): string {
  switch (type) {
    case 'order':
      return 'bg-blue-50 border-l-2 border-blue-400'
    case 'assignment':
      return 'bg-amber-50 border-l-2 border-amber-400'
    case 'cooking':
      return 'bg-red-50 border-l-2 border-red-400'
    case 'complete':
      return 'bg-green-50 border-l-2 border-green-400'
    case 'system':
      return 'bg-purple-50 border-l-2 border-purple-400'
    default:
      return 'bg-gray-50 border-l-2 border-gray-400'
  }
}

function getStatusDescription(): string {
  return getRestaurantStatusDescription()
}
</script> 