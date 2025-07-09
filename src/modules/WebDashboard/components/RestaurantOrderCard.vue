<template>
  <div
    class="border p-4 space-y-3"
    style="background: var(--bg-secondary); border-color: var(--border-primary)"
  >
    <!-- Заголовок заказа с VIP индикатором -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span
          class="font-mono text-sm font-semibold tracking-wide"
          style="color: var(--fg-primary)"
        >
          ЗАКАЗ #{{ order.orderNumber }}
        </span>
        <Crown
          v-if="order.customerType === 'VIP'"
          :size="16"
          style="color: var(--state-caution)"
          title="VIP клиент"
        />
      </div>

      <!-- Статус приоритета -->
      <div
        class="px-2 py-1 border text-xs font-mono font-semibold tracking-wide uppercase"
        :style="{
          backgroundColor: priorityColor,
          color: 'var(--bg-primary)',
          borderColor: priorityColor,
        }"
      >
        {{ priorityLabel }}
      </div>
    </div>

    <!-- Детали заказа -->
    <div class="grid grid-cols-2 gap-4 text-xs font-mono">
      <!-- Тип блюда с иконкой -->
      <div class="flex items-center gap-2">
        <component
          :is="dishIcon"
          :size="14"
          style="color: var(--state-informative)"
        />
        <span style="color: var(--fg-primary)">{{ order.dishType }}</span>
      </div>

      <!-- Тип клиента -->
      <div class="flex items-center gap-2">
        <User :size="14" style="color: var(--fg-secondary)" />
        <span
          style="color: var(--fg-secondary)"
          :class="order.customerType === 'VIP' ? 'font-semibold' : ''"
        >
          {{ order.customerType }}
        </span>
      </div>

      <!-- Сложность -->
      <div class="flex items-center gap-2">
        <Gauge :size="14" style="color: var(--fg-secondary)" />
        <span style="color: var(--fg-secondary)">{{ order.complexity }}</span>
      </div>

      <!-- Время готовки -->
      <div class="flex items-center gap-2">
        <Clock :size="14" style="color: var(--fg-secondary)" />
        <span style="color: var(--fg-secondary)">
          {{ Math.round(order.estimatedCookingTimeMs / 1000) }}с
        </span>
      </div>
    </div>

    <!-- Дедлайн и время -->
    <div class="space-y-2">
      <div class="flex items-center justify-between text-xs font-mono">
        <div class="flex items-center gap-2">
          <Timer :size="14" style="color: var(--fg-secondary)" />
          <span style="color: var(--fg-secondary)">ДЕДЛАЙН:</span>
        </div>
        <span class="font-semibold" :style="{ color: deadlineStatusColor }">
          {{ deadlineStatus }}
        </span>
      </div>

      <!-- Приоритет с объяснением -->
      <div class="flex items-center justify-between text-xs font-mono">
        <div class="flex items-center gap-2">
          <Target :size="14" style="color: var(--fg-secondary)" />
          <span style="color: var(--fg-secondary)">ПРИОРИТЕТ:</span>
        </div>
        <span class="font-semibold" style="color: var(--fg-primary)">
          {{ order.priority.toFixed(1) }}
        </span>
      </div>
    </div>

    <!-- Специальные требования для VIP -->
    <div
      v-if="order.specialRequests && order.specialRequests.length > 0"
      class="pt-3 border-t"
      style="border-color: var(--border-secondary)"
    >
      <div class="flex items-start gap-2 text-xs font-mono">
        <Star :size="14" style="color: var(--state-caution)" />
        <div>
          <span class="font-semibold" style="color: var(--state-caution)">
            ОСОБЫЕ ТРЕБОВАНИЯ:
          </span>
          <div class="mt-1 space-y-1">
            <div
              v-for="request in order.specialRequests"
              :key="request"
              style="color: var(--fg-tertiary)"
            >
              • {{ request }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Образовательная информация о CEP -->
    <div
      class="pt-3 border-t text-xs font-mono"
      style="border-color: var(--border-secondary)"
    >
      <div class="flex items-center gap-2 mb-1">
        <BookOpen :size="12" style="color: var(--state-informative)" />
        <span class="font-semibold" style="color: var(--state-informative)">
          CEP ПРИНЦИПЫ:
        </span>
      </div>
      <div class="space-y-1" style="color: var(--fg-tertiary)">
        <div class="flex items-center gap-1">
          <Database :size="10" />
          <span>Событие неизменяемо после создания</span>
        </div>
        <div class="flex items-center gap-1">
          <ArrowUp :size="10" />
          <span>Меньший приоритет = выше в очереди</span>
        </div>
        <div class="flex items-center gap-1">
          <Activity :size="10" />
          <span>Время обработки влияет на расчет приоритета</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Crown,
  User,
  Gauge,
  Clock,
  Timer,
  Target,
  Star,
  BookOpen,
  Database,
  ArrowUp,
  Activity,
  Pizza,
  Beef,
  Salad,
  Cake,
} from "lucide-vue-next";

/**
 * Интерфейс заказа ресторана
 */
interface RestaurantOrder {
  orderNumber: number;
  customerType: "VIP" | "обычный" | "доставка";
  dishType: "пицца" | "бургер" | "салат" | "десерт";
  complexity: "простое" | "среднее" | "сложное";
  estimatedCookingTimeMs: number;
  estimatedProcessingTimeMs: number;
  deadline: number;
  enqueuedAt: number;
  specialRequests?: string[];
  priority: number;
}

interface Props {
  order: RestaurantOrder;
}

const props = defineProps<Props>();

/**
 * Иконка блюда
 */
const dishIcon = computed(() => {
  const iconMap = {
    пицца: Pizza,
    бургер: Beef,
    салат: Salad,
    десерт: Cake,
  };
  return iconMap[props.order.dishType] || Pizza;
});

/**
 * Статус дедлайна
 */
const deadlineStatus = computed(() => {
  const now = Date.now();
  const deadline = props.order.deadline;
  const timeUntilDeadline = deadline - now;

  if (timeUntilDeadline < 0) {
    return "ПРОСРОЧЕН";
  } else if (timeUntilDeadline < 5000) {
    return "СРОЧНО";
  } else if (timeUntilDeadline < 15000) {
    return "СКОРО";
  } else {
    return "В НОРМЕ";
  }
});

/**
 * Цвет статуса дедлайна
 */
const deadlineStatusColor = computed(() => {
  const status = deadlineStatus.value;
  switch (status) {
    case "ПРОСРОЧЕН":
      return "var(--state-critical)";
    case "СРОЧНО":
      return "var(--state-critical)";
    case "СКОРО":
      return "var(--state-caution)";
    default:
      return "var(--state-positive)";
  }
});

/**
 * Метка приоритета
 */
const priorityLabel = computed(() => {
  const priority = props.order.priority;
  if (priority < 1) return "КРИТИЧНО";
  if (priority < 2) return "ВЫСОКИЙ";
  if (priority < 5) return "СРЕДНИЙ";
  return "НИЗКИЙ";
});

/**
 * Цвет приоритета
 */
const priorityColor = computed(() => {
  const priority = props.order.priority;
  if (priority < 1) return "var(--state-critical)";
  if (priority < 2) return "var(--state-caution)";
  if (priority < 5) return "var(--state-informative)";
  return "var(--fg-tertiary)";
});
</script>

<style scoped>
.fade-in {
  animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
