<template>
  <div
    class="border p-6 transition-minimal"
    :style="cardStyles"
  >
    <!-- Заголовок с иконкой -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div
          class="p-2 border"
          :style="iconStyles"
        >
          <component :is="icon" :size="24" />
        </div>
        <h3
          class="font-mono text-sm font-semibold tracking-wide uppercase"
          style="color: var(--fg-primary)"
        >
          {{ title }}
        </h3>
      </div>
    </div>

    <!-- Значение метрики -->
    <div class="mb-3">
      <p
        class="text-3xl font-mono font-bold tracking-tight"
        style="color: var(--fg-primary)"
      >
        {{ value }}
      </p>
    </div>

    <!-- Описание -->
    <div class="space-y-2">
      <p
        class="font-mono text-xs tracking-wide uppercase"
        style="color: var(--fg-secondary)"
      >
        {{ description }}
      </p>

      <!-- Дополнительные метрики или объяснения -->
      <div
        v-if="trend || explanation"
        class="pt-2 border-t"
        style="border-color: var(--border-secondary)"
      >
        <div
          v-if="trend"
          class="flex items-center gap-2"
        >
          <TrendingUp
            v-if="trend.includes('+')"
            :size="12"
            style="color: var(--state-positive)"
          />
          <TrendingDown
            v-else-if="trend.includes('-')"
            :size="12"
            style="color: var(--state-critical)"
          />
          <BarChart3
            v-else
            :size="12"
            style="color: var(--state-informative)"
          />
          <span
            class="font-mono text-xs tracking-wide"
            :style="{
              color: trend.includes('+')
                ? 'var(--state-positive)'
                : trend.includes('-')
                ? 'var(--state-critical)'
                : 'var(--fg-tertiary)',
            }"
          >
            {{ trend }}
          </span>
        </div>

        <p
          v-if="explanation"
          class="font-mono text-xs mt-2"
          style="color: var(--fg-tertiary)"
        >
          {{ explanation }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-vue-next";

interface Props {
  title: string;
  value: string | number;
  description: string;
  icon: Component;
  color?: "primary" | "secondary" | "accent" | "positive" | "caution" | "critical" | "informative";
  trend?: string;
  explanation?: string;
}

const props = withDefaults(defineProps<Props>(), {
  color: "primary",
});

/**
 * Стили карточки
 */
const cardStyles = computed(() => {
  const baseStyles = "background: var(--bg-primary); border-color: var(--border-secondary);";
  
  // Без специальных стилей для цветов - используем только стратегические акценты
  return baseStyles;
});

/**
 * Стили иконки
 */
const iconStyles = computed(() => {
  const colorMap = {
    primary: "background: var(--bg-secondary); border-color: var(--border-primary); color: var(--fg-primary);",
    secondary: "background: var(--bg-secondary); border-color: var(--border-primary); color: var(--fg-secondary);",
    accent: "background: var(--bg-secondary); border-color: var(--border-primary); color: var(--fg-primary);",
    positive: "background: var(--state-positive); border-color: var(--state-positive); color: var(--bg-primary);",
    caution: "background: var(--state-caution); border-color: var(--state-caution); color: var(--bg-primary);",
    critical: "background: var(--state-critical); border-color: var(--state-critical); color: var(--bg-primary);",
    informative: "background: var(--state-informative); border-color: var(--state-informative); color: var(--bg-primary);",
  };

  return colorMap[props.color] || colorMap.primary;
});
</script>

<style scoped>
.transition-minimal {
  transition: all 150ms ease-in-out;
}
</style>
