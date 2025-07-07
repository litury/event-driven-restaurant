<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
    <div class="max-w-4xl w-full">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-4xl font-bold text-gray-800 mb-3">
          🏭 Событийная система ресторана
        </h1>
        <p class="text-lg text-gray-600 mb-2">
          Учебный проект по CEP (Complex Event Processing)
        </p>
        <p class="text-sm text-gray-500">
          Интерактивная демонстрация CEP систем
        </p>
      </div>

      <!-- Interface Cards -->
      <div class="grid md:grid-cols-2 gap-8 mb-8">
        <!-- Restaurant Interface -->
        <div 
          @click="selectInterface('restaurant')"
          class="bg-white rounded-2xl shadow-xl border border-orange-200 p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl group"
        >
          <div class="text-center">
            <div class="text-6xl mb-4 group-hover:animate-bounce">🍕</div>
            <h2 class="text-2xl font-bold text-orange-800 mb-3">Кухня ресторана</h2>
            <p class="text-gray-600 mb-4">
              Визуализация процесса приготовления заказов
            </p>
            <div class="space-y-2 text-sm text-gray-500">
              <div class="flex items-center justify-center gap-2">
                <span class="w-2 h-2 bg-orange-400 rounded-full"></span>
                <span>Живые очереди поваров</span>
              </div>
              <div class="flex items-center justify-center gap-2">
                <span class="w-2 h-2 bg-orange-400 rounded-full"></span>
                <span>Лог событий в реальном времени</span>
              </div>
              <div class="flex items-center justify-center gap-2">
                <span class="w-2 h-2 bg-orange-400 rounded-full"></span>
                <span>Минималистичный дизайн</span>
              </div>
            </div>
            <div class="mt-6">
              <span class="bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold group-hover:bg-orange-600 transition-colors">
                Выбрать
              </span>
            </div>
          </div>
        </div>

        <!-- Dashboard Interface -->
        <div 
          @click="selectInterface('dashboard')"
          class="bg-white rounded-2xl shadow-xl border border-blue-200 p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl group"
        >
          <div class="text-center">
            <div class="text-6xl mb-4 group-hover:animate-bounce">📊</div>
            <h2 class="text-2xl font-bold text-blue-800 mb-3">Аналитический дашборд</h2>
            <p class="text-gray-600 mb-4">
              Подробная визуализация всей системы CEP
            </p>
            <div class="space-y-2 text-sm text-gray-500">
              <div class="flex items-center justify-center gap-2">
                <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Конвейер обработки данных</span>
              </div>
              <div class="flex items-center justify-center gap-2">
                <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Детальная статистика</span>
              </div>
              <div class="flex items-center justify-center gap-2">
                <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Полный лог с фильтрами</span>
              </div>
            </div>
            <div class="mt-6">
              <span class="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold group-hover:bg-blue-600 transition-colors">
                Выбрать
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Interface -->
      <div v-if="currentInterface" class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">
            Текущий интерфейс: {{ currentInterface === 'restaurant' ? '🍕 Кухня ресторана' : '📊 Дашборд' }}
          </h3>
          <button 
            @click="currentInterface = null"
            class="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <!-- Interface Component -->
        <div class="border rounded-xl overflow-hidden">
          <TailwindRestaurant v-if="currentInterface === 'restaurant'" />
          <TailwindDashboard v-if="currentInterface === 'dashboard'" />
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center text-sm text-gray-500">
        <p>🎓 Образовательный проект • Vue 3 + TypeScript + Tailwind CSS</p>
        <p class="mt-1">Функциональное программирование + TDD подход</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TailwindRestaurant from './TailwindRestaurant.vue'
import TailwindDashboard from './TailwindDashboard.vue'

type InterfaceType = 'restaurant' | 'dashboard' | null

const currentInterface = ref<InterfaceType>(null)

function selectInterface(type: 'restaurant' | 'dashboard') {
  currentInterface.value = type
}
</script> 