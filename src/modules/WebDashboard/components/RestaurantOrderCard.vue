<template>
  <div
    class="border p-4 space-y-3 transition-minimal"
    style="background: var(--bg-secondary); border-color: var(--border-primary)"
  >
    <!-- Заголовок заказа с VIP индикатором -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span
          class="font-mono text-sm font-semibold tracking-wide uppercase"
          style="color: var(--fg-primary)"
        >
          ЗАКАЗ #{{ order.orderId }}
        </span>
        <Crown
          v-if="order.isVipCustomer"
          :size="16"
          style="color: var(--state-caution)"
          title="VIP клиент"
        />
      </div>

      <!-- Статус заказа -->
      <div
        class="px-2 py-1 border text-xs font-mono font-semibold tracking-wide uppercase"
        :style="{
          backgroundColor: statusColor,
          color: 'var(--bg-primary)',
          borderColor: statusColor,
        }"
      >
        {{ statusLabel }}
      </div>
    </div>

    <!-- Описание блюда -->
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <UtensilsCrossed :size="14" style="color: var(--state-informative)" />
        <span class="font-mono text-sm" style="color: var(--fg-primary)">
          {{ order.dishDescription }}
        </span>
      </div>

      <!-- Тип клиента -->
      <div class="flex items-center gap-2">
        <User :size="14" style="color: var(--fg-secondary)" />
        <span
          class="font-mono text-xs tracking-wide"
          style="color: var(--fg-secondary)"
          :class="order.isVipCustomer ? 'font-semibold' : ''"
        >
          {{ order.isVipCustomer ? "VIP КЛИЕНТ" : "ОБЫЧНЫЙ КЛИЕНТ" }}
        </span>
      </div>
    </div>

    <!-- Временные данные -->
    <div class="space-y-2">
      <div
        v-if="order.createdAt"
        class="flex items-center justify-between text-xs font-mono"
      >
        <div class="flex items-center gap-2">
          <Timer :size="14" style="color: var(--fg-secondary)" />
          <span style="color: var(--fg-secondary)">СОЗДАН:</span>
        </div>
        <span class="font-semibold" style="color: var(--fg-primary)">
          {{ formatTime(order.createdAt) }}
        </span>
      </div>

      <div
        v-if="order.updatedAt"
        class="flex items-center justify-between text-xs font-mono"
      >
        <div class="flex items-center gap-2">
          <Clock :size="14" style="color: var(--fg-secondary)" />
          <span style="color: var(--fg-secondary)">ОБНОВЛЕН:</span>
        </div>
        <span class="font-semibold" style="color: var(--fg-secondary)">
          {{ formatTime(order.updatedAt) }}
        </span>
      </div>
    </div>

    <!-- Статус выполнения -->
    <div
      class="flex items-center justify-between text-xs font-mono pt-2 border-t"
      style="border-color: var(--border-secondary)"
    >
      <div class="flex items-center gap-2">
        <Activity :size="14" style="color: var(--fg-secondary)" />
        <span style="color: var(--fg-secondary)">СТАТУС:</span>
      </div>
      <span class="font-semibold" :style="{ color: statusColor }">
        {{ statusDescription }}
      </span>
    </div>

    <!-- Зона размещения (если есть) -->
    <div
      v-if="assignedZone"
      class="flex items-center justify-between text-xs font-mono"
    >
      <div class="flex items-center gap-2">
        <MapPin :size="14" style="color: var(--fg-secondary)" />
        <span style="color: var(--fg-secondary)">ЗОНА:</span>
      </div>
      <span class="font-semibold" style="color: var(--fg-primary)">
        {{ assignedZone }}
      </span>
    </div>

    <!-- Образовательная информация о событийной синхронизации -->
    <div
      class="pt-3 border-t text-xs font-mono"
      style="border-color: var(--border-secondary)"
    >
      <div class="flex items-center gap-2 mb-1">
        <BookOpen :size="12" style="color: var(--state-informative)" />
        <span
          class="font-semibold uppercase"
          style="color: var(--state-informative)"
        >
          ДЗ-3 СОБЫТИЙНАЯ СИНХРОНИЗАЦИЯ:
        </span>
      </div>
      <div class="space-y-1" style="color: var(--fg-tertiary)">
        <div class="flex items-center gap-1">
          <Database :size="10" />
          <span>{{
            order.isVipCustomer
              ? "VIP → Отдельная зона"
              : "Обычный → Общая зона"
          }}</span>
        </div>
        <div class="flex items-center gap-1">
          <GitBranch :size="10" />
          <span>API → ChangeLog → ZoneSync</span>
        </div>
        <div class="flex items-center gap-1">
          <Zap :size="10" />
          <span>Асинхронная обработка событий</span>
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
  Clock,
  Timer,
  Activity,
  MapPin,
  BookOpen,
  Database,
  GitBranch,
  Zap,
  UtensilsCrossed,
} from "lucide-vue-next";
import type { IRestaurantOrder } from "../../WorkloadBalancing/interfaces/IRestaurantSyncModel";

interface Props {
  order: IRestaurantOrder;
  assignedZone?: string;
}

const props = defineProps<Props>();

/**
 * Форматирование времени
 */
function formatTime(date: Date | undefined): string {
  if (!date) {
    return "—";
  }

  // Проверяем, что это валидная дата
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Метка статуса
 */
const statusLabel = computed(() => {
  switch (props.order.status) {
    case "pending":
      return "ОЖИДАЕТ";
    case "preparing":
      return "ГОТОВИТСЯ";
    case "ready":
      return "ГОТОВ";
    case "served":
      return "ПОДАН";
    default:
      return "НЕИЗВЕСТНО";
  }
});

/**
 * Описание статуса
 */
const statusDescription = computed(() => {
  switch (props.order.status) {
    case "pending":
      return "В очереди на обработку";
    case "preparing":
      return "Выполняется поваром";
    case "ready":
      return "Готов к выдаче";
    case "served":
      return "Подан клиенту";
    default:
      return "Неопределенное состояние";
  }
});

/**
 * Цвет статуса
 */
const statusColor = computed(() => {
  switch (props.order.status) {
    case "pending":
      return "var(--state-caution)";
    case "preparing":
      return "var(--state-informative)";
    case "ready":
      return "var(--state-positive)";
    case "served":
      return "var(--fg-tertiary)";
    default:
      return "var(--fg-tertiary)";
  }
});
</script>

<style scoped>
.transition-minimal {
  transition: all 0.15s ease-out;
}

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
