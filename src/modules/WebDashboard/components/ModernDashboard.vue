<template>
  <div class="min-h-screen" style="background: var(--bg-primary)">
    <!-- Заголовок с образовательной информацией -->
    <header
      class="border-b p-6"
      style="
        background: var(--bg-primary);
        border-color: var(--border-secondary);
      "
    >
      <div class="flex items-center justify-between">
        <div>
          <h1
            class="text-2xl font-bold font-mono tracking-wide uppercase mb-2"
            style="color: var(--fg-primary)"
          >
            <Building2 class="inline mr-2" :size="24" />
            РЕСТОРАН 'СОБЫТИЙНАЯ КУХНЯ'
          </h1>
          <p
            class="font-mono text-sm tracking-wide"
            style="color: var(--fg-secondary)"
          >
            ДЕМОНСТРАЦИЯ ПРИНЦИПОВ COMPLEX EVENT PROCESSING (CEP)
          </p>

          <!-- Образовательный блок -->
          <div
            class="mt-4 p-4 border"
            style="
              background: var(--bg-secondary);
              border-color: var(--border-primary);
            "
          >
            <h3
              class="font-mono text-sm font-semibold mb-2 uppercase"
              style="color: var(--fg-primary)"
            >
              <BookOpen class="inline mr-2" :size="16" />
              ПРИНЦИПЫ CEP В ДЕЙСТВИИ:
            </h3>
            <div
              class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono"
            >
              <div>
                <Database
                  class="inline mr-1"
                  :size="14"
                  style="color: var(--state-informative)"
                />
                <span style="color: var(--fg-primary)"
                  >СОБЫТИЯ = ЗАКАЗЫ КЛИЕНТОВ</span
                ><br />
                <span style="color: var(--fg-tertiary)"
                  >Неизменяемые, упорядочены по времени</span
                >
              </div>
              <div>
                <Zap
                  class="inline mr-1"
                  :size="14"
                  style="color: var(--state-caution)"
                />
                <span style="color: var(--fg-primary)"
                  >ZIP = ДИСПЕТЧЕР КУХНИ</span
                ><br />
                <span style="color: var(--fg-tertiary)"
                  >Объединяет заказы и свободных поваров</span
                >
              </div>
              <div>
                <Filter
                  class="inline mr-1"
                  :size="14"
                  style="color: var(--state-positive)"
                />
                <span style="color: var(--fg-primary)"
                  >ФИЛЬТР = РАСПРЕДЕЛЕНИЕ ПО СПЕЦИАЛИЗАЦИИ</span
                ><br />
                <span style="color: var(--fg-tertiary)"
                  >Пицца/Салаты → Повар А, Бургеры/Десерты → Повар Б</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Управление темой и системой -->
        <div class="flex items-center gap-4">
          <!-- Кнопки управления генератором -->
          <div class="flex flex-col gap-2">
            <button
              @click="start"
              :disabled="isRunning"
              class="px-4 py-2 font-mono text-sm font-medium tracking-wide uppercase transition-minimal border"
              :class="
                isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
              "
              style="
                background: var(--state-positive);
                color: var(--bg-primary);
                border-color: var(--state-positive);
              "
            >
              <Play :size="16" class="inline mr-2" />
              ОТКРЫТЬ РЕСТОРАН
            </button>

            <button
              @click="stop"
              :disabled="!isRunning"
              class="px-4 py-2 font-mono text-sm font-medium tracking-wide uppercase transition-minimal border"
              :class="
                !isRunning
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-80'
              "
              style="
                background: var(--state-critical);
                color: var(--bg-primary);
                border-color: var(--state-critical);
              "
            >
              <Square :size="16" class="inline mr-2" />
              ЗАКРЫТЬ РЕСТОРАН
            </button>
          </div>

          <!-- Переключение темы -->
          <button
            @click="toggleTheme"
            class="p-2 transition-minimal border"
            style="
              background: var(--bg-secondary);
              border-color: var(--border-secondary);
              color: var(--fg-primary);
            "
          >
            <Sun v-if="isDark" :size="20" />
            <Moon v-else :size="20" />
          </button>
        </div>
      </div>
    </header>

    <main class="p-6 space-y-8">
      <!-- Метрики с объяснениями -->
      <section>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Эффективность с формулой -->
          <div class="space-y-2">
            <StatCard
              title="ЭФФЕКТИВНОСТЬ"
              :value="`${efficiency}%`"
              description="Качество работы кухни"
              :icon="CheckCircle"
              color="positive"
            />
            <div
              class="p-3 border text-xs font-mono"
              style="
                background: var(--bg-secondary);
                border-color: var(--border-primary);
              "
            >
              <Calculator
                class="inline mr-1"
                :size="12"
                style="color: var(--state-informative)"
              />
              <span style="color: var(--fg-primary)">ФОРМУЛА:</span><br />
              <span style="color: var(--fg-tertiary)">
                (Готовые блюда ÷ Принятые заказы) × 100<br />
                {{ stats.dishesCompleted }} ÷ {{ stats.ordersReceived }} × 100 =
                {{ efficiency }}%
              </span>
            </div>
          </div>

          <!-- Пропускная способность -->
          <div class="space-y-2">
            <StatCard
              title="ПРОПУСКНАЯ СПОСОБНОСТЬ"
              :value="stats.ordersReceived > 0 ? 'РАСТЕТ' : 'ОЖИДАНИЕ'"
              description="Скорость обработки заказов"
              :icon="TrendingUp"
              color="informative"
            />
            <div
              class="p-3 border text-xs font-mono"
              style="
                background: var(--bg-secondary);
                border-color: var(--border-primary);
              "
            >
              <Gauge
                class="inline mr-1"
                :size="12"
                style="color: var(--state-informative)"
              />
              <span style="color: var(--fg-primary)">ПРИНЦИП:</span><br />
              <span style="color: var(--fg-tertiary)">
                Больше заказов в единицу времени =<br />
                Лучшая производительность системы
              </span>
            </div>
          </div>

          <!-- Всего заказов с ростом -->
          <div class="space-y-2">
            <StatCard
              title="ВСЕГО ЗАКАЗОВ"
              :value="stats.ordersReceived"
              :description="`Рост: +${Math.min(stats.ordersReceived, 12)}%`"
              :icon="Receipt"
              color="informative"
            />
            <div
              class="p-3 border text-xs font-mono"
              style="
                background: var(--bg-secondary);
                border-color: var(--border-primary);
              "
            >
              <TrendingUp
                class="inline mr-1"
                :size="12"
                style="color: var(--state-positive)"
              />
              <span style="color: var(--fg-primary)">РОСТ ОЗНАЧАЕТ:</span><br />
              <span style="color: var(--fg-tertiary)">
                Система набирает обороты,<br />
                клиенты продолжают заказывать
              </span>
            </div>
          </div>

          <!-- Обработанные события -->
          <div class="space-y-2">
            <StatCard
              title="ОБРАБОТАННЫЕ СОБЫТИЯ"
              :value="stats.dishesCompleted"
              :description="`Прирост: +${Math.min(stats.dishesCompleted, 8)}%`"
              :icon="CheckCircle"
              color="positive"
            />
            <div
              class="p-3 border text-xs font-mono"
              style="
                background: var(--bg-secondary);
                border-color: var(--border-primary);
              "
            >
              <Activity
                class="inline mr-1"
                :size="12"
                style="color: var(--state-positive)"
              />
              <span style="color: var(--fg-primary)">ПРИРОСТ СОБЫТИЙ:</span
              ><br />
              <span style="color: var(--fg-tertiary)">
                Повара "разогреваются",<br />
                работают быстрее со временем
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- JSON структура заказов -->
      <section v-if="isRunning">
        <div
          class="border p-6"
          style="
            background: var(--bg-primary);
            border-color: var(--border-secondary);
          "
        >
          <h3
            class="text-lg font-semibold font-mono tracking-wide uppercase mb-4"
            style="color: var(--fg-primary)"
          >
            <Code class="inline mr-2" :size="20" />
            СТРУКТУРА СОБЫТИЙ (JSON)
          </h3>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Пример заказа -->
            <div>
              <h4
                class="font-mono text-sm font-semibold mb-3 uppercase"
                style="color: var(--fg-primary)"
              >
                <FileText class="inline mr-1" :size="14" />
                ПРИМЕР ЗАКАЗА:
              </h4>
              <pre
                class="p-4 border text-xs font-mono overflow-x-auto"
                style="
                  background: var(--bg-secondary);
                  border-color: var(--border-primary);
                  color: var(--fg-secondary);
                "
                >{{
                  `{
  "orderNumber": 42,
  "customerType": "VIP",
  "dishType": "пицца",
  "complexity": "сложное",
  "estimatedCookingTimeMs": 4500,
  "deadline": "2024-01-15T14:35:00Z",
  "enqueuedAt": "2024-01-15T14:30:00Z",
  "specialRequests": ["Без лука", "Дополнительный сыр"],
  "priority": 2.5
}`
                }}</pre
              >
            </div>

            <!-- Объяснение приоритетов -->
            <div>
              <h4
                class="font-mono text-sm font-semibold mb-3 uppercase"
                style="color: var(--fg-primary)"
              >
                <Target class="inline mr-1" :size="14" />
                РАСЧЕТ ПРИОРИТЕТА:
              </h4>
              <div
                class="p-4 border space-y-3 text-xs font-mono"
                style="
                  background: var(--bg-secondary);
                  border-color: var(--border-primary);
                "
              >
                <div>
                  <Calculator
                    class="inline mr-1"
                    :size="12"
                    style="color: var(--state-informative)"
                  />
                  <span style="color: var(--fg-primary)">ФОРМУЛА:</span><br />
                  <span style="color: var(--fg-tertiary)">
                    priority = (deadline - now) / cookingTime
                  </span>
                </div>
                <div>
                  <Crown
                    class="inline mr-1"
                    :size="12"
                    style="color: var(--state-caution)"
                  />
                  <span style="color: var(--fg-primary)">VIP МОДИФИКАТОР:</span
                  ><br />
                  <span style="color: var(--fg-tertiary)">
                    priority × 0.5 (повышение приоритета)
                  </span>
                </div>
                <div>
                  <AlertTriangle
                    class="inline mr-1"
                    :size="12"
                    style="color: var(--state-critical)"
                  />
                  <span style="color: var(--fg-primary)">ПРАВИЛО:</span><br />
                  <span style="color: var(--fg-tertiary)">
                    Меньше число = выше приоритет
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Пайплайн обработки -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- CEP Пайплайн -->
        <section>
          <div
            class="border p-6"
            style="
              background: var(--bg-primary);
              border-color: var(--border-secondary);
            "
          >
            <div class="flex items-center justify-between mb-6">
              <h3
                class="text-lg font-semibold font-mono tracking-wide uppercase"
                style="color: var(--fg-primary)"
              >
                <GitBranch class="inline mr-2" :size="20" />
                CEP КОНВЕЙЕР ОБРАБОТКИ
              </h3>
              <span
                class="text-sm font-mono tracking-wide uppercase"
                style="color: var(--fg-tertiary)"
              >
                4 ЭТАПА
              </span>
            </div>

            <!-- Объяснение архитектуры -->
            <div
              class="mb-6 p-4 border"
              style="
                background: var(--bg-secondary);
                border-color: var(--border-primary);
              "
            >
              <p
                class="font-mono text-xs tracking-wide"
                style="color: var(--fg-tertiary)"
              >
                События проходят через 4 этапа: Генерация → ZIP → Фильтр →
                Обработчики
              </p>
            </div>

            <div class="space-y-6">
              <!-- 1. Генератор событий -->
              <PipelineStep
                title="1. ГЕНЕРАТОР ЗАКАЗОВ"
                :count="queueSizes.newOrders"
                color="accent"
                description="Поток событий от клиентов"
                :isActive="isRunning && queueSizes.newOrders > 0"
                cepPrinciple="Событие создается только один раз и становится неизменяемым"
              >
                <template #icon>
                  <ClipboardList :size="20" />
                </template>
              </PipelineStep>

              <!-- Стрелка вниз -->
              <div class="flex justify-center py-2">
                <ChevronDown
                  :size="24"
                  :class="isRunning ? 'animate-pulse' : ''"
                  style="color: var(--fg-secondary)"
                />
              </div>

              <!-- 2. ZIP процессор -->
              <PipelineStep
                title="2. ZIP ДИСПЕТЧЕР"
                :count="queueSizes.assignments"
                color="caution"
                description="Объединяет заказы и свободных поваров"
                :isActive="isRunning && queueSizes.assignments > 0"
                timing="МГНОВЕННО"
                cepPrinciple="ZIP объединяет два потока: события и свободные ресурсы"
              >
                <template #icon>
                  <GitBranch :size="20" />
                </template>
              </PipelineStep>

              <!-- Стрелка вниз -->
              <div class="flex justify-center py-2">
                <ChevronDown
                  :size="24"
                  :class="isRunning ? 'animate-pulse' : ''"
                  style="color: var(--fg-secondary)"
                />
              </div>

              <!-- 3. Фильтр распределения -->
              <div
                class="border p-4"
                style="
                  background: var(--bg-secondary);
                  border-color: var(--border-secondary);
                "
              >
                <h3
                  class="font-mono text-sm font-semibold mb-3 uppercase"
                  style="color: var(--fg-primary)"
                >
                  3. ФИЛЬТР РАСПРЕДЕЛЕНИЯ
                </h3>
                <p
                  class="font-mono text-xs mb-4"
                  style="color: var(--fg-tertiary)"
                >
                  Пицца/Салаты → Повар А • Бургеры/Десерты → Повар Б
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PipelineStep
                    title="ПОВАР ПИЦЦЫ"
                    :count="queueSizes.pizzaCook"
                    color="informative"
                    description="Четные номера заказов"
                    :isActive="isRunning && queueSizes.pizzaCook > 0"
                    cepPrinciple="Фильтр распределяет события по критериям в реальном времени"
                  >
                    <template #icon>
                      <Pizza :size="20" />
                    </template>
                  </PipelineStep>

                  <PipelineStep
                    title="ПОВАР БУРГЕРОВ"
                    :count="queueSizes.burgerCook"
                    color="critical"
                    description="Нечетные номера заказов"
                    :isActive="isRunning && queueSizes.burgerCook > 0"
                    cepPrinciple="Параллельная обработка увеличивает общую пропускную способность"
                  >
                    <template #icon>
                      <Beef :size="20" />
                    </template>
                  </PipelineStep>
                </div>
              </div>

              <!-- 4. Результаты -->
              <PipelineStep
                title="4. ГОТОВЫЕ БЛЮДА"
                :count="queueSizes.readyDishes"
                color="positive"
                description="Завершенные заказы"
                :isActive="isRunning && queueSizes.readyDishes > 0"
                cepPrinciple="Consumer получает события только после полной обработки"
              >
                <template #icon>
                  <CheckCircle :size="20" />
                </template>
              </PipelineStep>
            </div>
          </div>
        </section>

        <!-- Активные заказы -->
        <section>
          <div
            class="border p-6"
            style="
              background: var(--bg-primary);
              border-color: var(--border-secondary);
            "
          >
            <h3
              class="text-lg font-semibold font-mono tracking-wide uppercase mb-6"
              style="color: var(--fg-primary)"
            >
              <UtensilsCrossed class="inline mr-2" :size="20" />
              АКТИВНЫЕ ЗАКАЗЫ
            </h3>

            <div class="space-y-6">
              <!-- Повар пиццы -->
              <div v-if="currentOrders.pizzaOrders.length > 0">
                <h4
                  class="font-mono text-sm font-semibold mb-3 uppercase flex items-center gap-2"
                  style="color: var(--state-informative)"
                >
                  <Pizza :size="16" />
                  У повара пиццы ({{ currentOrders.pizzaOrders.length }})
                </h4>
                <div
                  class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar"
                >
                  <RestaurantOrderCard
                    v-for="order in currentOrders.pizzaOrders.slice(0, 2)"
                    :key="order.orderNumber"
                    :order="order as any"
                  />
                  <div
                    v-if="currentOrders.pizzaOrders.length > 2"
                    class="text-center font-mono text-xs"
                    style="color: var(--fg-tertiary)"
                  >
                    ...и еще {{ currentOrders.pizzaOrders.length - 2 }} заказов
                  </div>
                </div>
              </div>

              <!-- Повар бургеров -->
              <div v-if="currentOrders.burgerOrders.length > 0">
                <h4
                  class="font-mono text-sm font-semibold mb-3 uppercase flex items-center gap-2"
                  style="color: var(--state-critical)"
                >
                  <Beef :size="16" />
                  У повара бургеров ({{ currentOrders.burgerOrders.length }})
                </h4>
                <div
                  class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar"
                >
                  <RestaurantOrderCard
                    v-for="order in currentOrders.burgerOrders.slice(0, 2)"
                    :key="order.orderNumber"
                    :order="order as any"
                  />
                  <div
                    v-if="currentOrders.burgerOrders.length > 2"
                    class="text-center font-mono text-xs"
                    style="color: var(--fg-tertiary)"
                  >
                    ...и еще {{ currentOrders.burgerOrders.length - 2 }} заказов
                  </div>
                </div>
              </div>

              <!-- Пустое состояние -->
              <div
                v-if="
                  !isRunning &&
                  currentOrders.newOrders.length === 0 &&
                  currentOrders.pizzaOrders.length === 0 &&
                  currentOrders.burgerOrders.length === 0
                "
                class="text-center py-12"
                style="color: var(--fg-tertiary)"
              >
                <UtensilsCrossed :size="48" class="mx-auto mb-3" />
                <p class="font-mono text-sm tracking-wide uppercase">
                  НЕТ АКТИВНЫХ ЗАКАЗОВ
                </p>
                <p class="font-mono text-xs mt-2 tracking-wide">
                  ОТКРОЙТЕ РЕСТОРАН ДЛЯ ПРИЕМА ЗАКАЗОВ
                </p>
              </div>

              <!-- Статистика заказов -->
              <div
                v-if="stats.vipOrders > 0 || stats.overdueOrders > 0"
                class="border-t pt-4 mt-4"
                style="border-color: var(--border-secondary)"
              >
                <div
                  class="flex items-center justify-between text-xs font-mono"
                >
                  <div
                    v-if="stats.vipOrders > 0"
                    class="flex items-center gap-2"
                  >
                    <Crown :size="14" style="color: var(--state-caution)" />
                    <span style="color: var(--state-caution)"
                      >VIP: {{ stats.vipOrders }}</span
                    >
                  </div>
                  <div
                    v-if="stats.overdueOrders > 0"
                    class="flex items-center gap-2"
                  >
                    <AlertTriangle
                      :size="14"
                      style="color: var(--state-critical)"
                    />
                    <span style="color: var(--state-critical)"
                      >Просрочено: {{ stats.overdueOrders }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Статус системы событий -->
      <section>
        <div
          class="border p-6"
          style="
            background: var(--bg-primary);
            border-color: var(--border-secondary);
          "
        >
          <div class="flex items-center justify-between">
            <div>
              <h3
                class="text-lg font-semibold font-mono tracking-wide uppercase mb-2"
                style="color: var(--fg-primary)"
              >
                <Building2 class="inline mr-2" :size="20" />
                СТАТУС СОБЫТИЙНОЙ СИСТЕМЫ: {{ systemStatus.toUpperCase() }}
              </h3>
              <p
                class="font-mono text-sm tracking-wide"
                style="color: var(--fg-secondary)"
              >
                {{ getStatusDescription().toUpperCase() }}
              </p>
              <div
                class="mt-3 font-mono text-xs"
                style="color: var(--fg-tertiary)"
              >
                <p>
                  <BarChart3 class="inline mr-1" :size="12" />
                  Принципы CEP: Low Latency • Event Ordering • Stream Processing
                </p>
                <p>
                  <Workflow class="inline mr-1" :size="12" />
                  Архитектура: Producer → Buffer → ZIP → Filter → Workers →
                  Consumer
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div
                class="w-3 h-3 transition-minimal"
                :class="isRunning ? 'animate-pulse' : ''"
                :style="{
                  backgroundColor: isRunning
                    ? 'var(--state-positive)'
                    : 'var(--fg-tertiary)',
                }"
              ></div>
              <span
                class="text-sm font-medium font-mono tracking-wide uppercase flex items-center gap-2"
                style="color: var(--fg-secondary)"
              >
                <Activity v-if="isRunning" :size="16" />
                <Square v-else :size="16" />
                {{ isRunning ? "АКТИВЕН" : "ОСТАНОВЛЕН" }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onUnmounted } from "vue";
import { useRestaurantVisualizer } from "../composables/useRestaurantVisualizer";
import { setGlobalEventLogger } from "../../WorkloadBalancing/services/workloadProcessors";
import StatCard from "./StatCard.vue";
import PipelineStep from "./PipelineStep.vue";
import RestaurantOrderCard from "./RestaurantOrderCard.vue";

// Lucide иконки (заменили все эмодзи)
import {
  Building2,
  BookOpen,
  Database,
  Zap,
  Filter,
  Sun,
  Moon,
  Play,
  Square,
  CheckCircle,
  TrendingUp,
  Receipt,
  Calculator,
  Gauge,
  Activity,
  Code,
  FileText,
  Target,
  Crown,
  AlertTriangle,
  ClipboardList,
  ChevronDown,
  GitBranch,
  Pizza,
  Beef,
  UtensilsCrossed,
  BarChart3,
  Workflow,
} from "lucide-vue-next";

/**
 * Интерфейс для событий в журнале ресторана
 */
interface LogEvent {
  id: number;
  timestamp: number;
  type: "order" | "assignment" | "cooking" | "complete" | "system";
  icon: string;
  message: string;
  data?: string | undefined;
}

// Тема
const isDark = ref(false);

// Композабл системы ресторана с приоритетными заказами
const {
  isRunning,
  queueSizes,
  restaurantStats,
  currentOrders,
  openRestaurant,
  closeRestaurant,
  totalOrdersInProcess,
  kitchenEfficiency,
  systemStatus,
  getRestaurantStatusDescription,
} = useRestaurantVisualizer({
  updateIntervalMs: 100,
});

// Алиасы для удобства
const stats = restaurantStats;
const efficiency = kitchenEfficiency;

// Управление темой
function toggleTheme() {
  isDark.value = !isDark.value;
  document.documentElement.setAttribute(
    "data-theme",
    isDark.value ? "dark" : "light"
  );
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
}

// Управление рестораном
const start = () => {
  // Настраиваем глобальный логгер для событий
  setGlobalEventLogger(
    (type: string, icon: string, message: string, data?: string) => {
      console.log(
        `[${type.toUpperCase()}] ${message}`,
        data ? `- ${data}` : ""
      );
    }
  );
  openRestaurant();
};

const stop = () => {
  closeRestaurant();
};

function getStatusDescription(): string {
  return getRestaurantStatusDescription();
}

// Инициализация темы при загрузке
onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    isDark.value = true;
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
  }
});
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--border-secondary) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--border-secondary);
  border-radius: 0;
}

.transition-minimal {
  transition: all 150ms ease-in-out;
}
</style>
