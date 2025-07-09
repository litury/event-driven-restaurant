<template>
  <div
    class="border p-4 transition-minimal"
    :class="isActive ? 'animate-pulse' : ''"
    :style="containerStyles"
  >
    <!-- Заголовок этапа -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-3">
        <!-- Иконка этапа -->
        <div class="p-2 border" :style="iconContainerStyles">
          <slot name="icon">
            <Activity :size="20" />
          </slot>
        </div>

        <!-- Название этапа -->
        <h3
          class="font-mono text-sm font-semibold tracking-wide uppercase"
          style="color: var(--fg-primary)"
        >
          {{ title }}
        </h3>
      </div>

      <!-- Счетчик событий -->
      <div
        class="px-3 py-1 border font-mono text-sm font-bold"
        :style="counterStyles"
      >
        {{ count }}
      </div>
    </div>

    <!-- Описание -->
    <div class="space-y-2">
      <p
        class="font-mono text-xs tracking-wide"
        style="color: var(--fg-secondary)"
      >
        {{ description }}
      </p>

      <!-- Временные характеристики -->
      <div v-if="timing" class="flex items-center gap-2">
        <Clock :size="12" style="color: var(--fg-tertiary)" />
        <span class="font-mono text-xs" style="color: var(--fg-tertiary)">
          {{ timing }}
        </span>
      </div>

      <!-- Статус обработки -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="w-2 h-2 transition-minimal"
            :class="isActive ? 'animate-pulse' : ''"
            :style="{
              backgroundColor: isActive
                ? getStatusColor()
                : 'var(--fg-tertiary)',
            }"
          ></div>
          <span
            class="font-mono text-xs tracking-wide uppercase"
            :style="{
              color: isActive ? getStatusColor() : 'var(--fg-tertiary)',
            }"
          >
            {{ getStatusText() }}
          </span>
        </div>

        <!-- Индикатор производительности -->
        <div v-if="isActive && count > 0" class="flex items-center gap-1">
          <BarChart3 :size="12" style="color: var(--state-informative)" />
          <span
            class="font-mono text-xs"
            style="color: var(--state-informative)"
          >
            {{ getPerformanceText() }}
          </span>
        </div>
      </div>

      <!-- CEP принципы для этого этапа -->
      <div
        v-if="cepPrinciple"
        class="pt-2 border-t"
        style="border-color: var(--border-secondary)"
      >
        <div class="flex items-center gap-2 mb-1">
          <BookOpen :size="10" style="color: var(--state-informative)" />
          <span
            class="font-mono text-xs font-semibold"
            style="color: var(--state-informative)"
          >
            CEP ПРИНЦИП:
          </span>
        </div>
        <p class="font-mono text-xs" style="color: var(--fg-tertiary)">
          {{ cepPrinciple }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Activity, Clock, BarChart3, BookOpen } from "lucide-vue-next";

interface Props {
  title: string;
  count: number;
  description: string;
  color?:
    | "primary"
    | "secondary"
    | "accent"
    | "positive"
    | "caution"
    | "critical"
    | "informative";
  isActive?: boolean;
  timing?: string;
  cepPrinciple?: string;
}

const props = withDefaults(defineProps<Props>(), {
  color: "primary",
  isActive: false,
});

/**
 * Стили контейнера
 */
const containerStyles = computed(() => {
  let styles =
    "background: var(--bg-secondary); border-color: var(--border-primary);";

  if (props.isActive) {
    const colorMap = {
      primary: "border-color: var(--fg-primary);",
      secondary: "border-color: var(--fg-secondary);",
      accent: "border-color: var(--fg-primary);",
      positive: "border-color: var(--state-positive);",
      caution: "border-color: var(--state-caution);",
      critical: "border-color: var(--state-critical);",
      informative: "border-color: var(--state-informative);",
    };
    styles += colorMap[props.color] || colorMap.primary;
  }

  return styles;
});

/**
 * Стили иконки
 */
const iconContainerStyles = computed(() => {
  const colorMap = {
    primary:
      "background: var(--bg-primary); border-color: var(--border-secondary); color: var(--fg-primary);",
    secondary:
      "background: var(--bg-primary); border-color: var(--border-secondary); color: var(--fg-secondary);",
    accent:
      "background: var(--bg-primary); border-color: var(--border-secondary); color: var(--fg-primary);",
    positive:
      "background: var(--state-positive); border-color: var(--state-positive); color: var(--bg-primary);",
    caution:
      "background: var(--state-caution); border-color: var(--state-caution); color: var(--bg-primary);",
    critical:
      "background: var(--state-critical); border-color: var(--state-critical); color: var(--bg-primary);",
    informative:
      "background: var(--state-informative); border-color: var(--state-informative); color: var(--bg-primary);",
  };

  return colorMap[props.color] || colorMap.primary;
});

/**
 * Стили счетчика
 */
const counterStyles = computed(() => {
  const baseStyles =
    "background: var(--bg-primary); border-color: var(--border-secondary); color: var(--fg-primary);";

  if (props.isActive && props.count > 0) {
    const colorMap = {
      positive:
        "background: var(--state-positive); border-color: var(--state-positive); color: var(--bg-primary);",
      caution:
        "background: var(--state-caution); border-color: var(--state-caution); color: var(--bg-primary);",
      critical:
        "background: var(--state-critical); border-color: var(--state-critical); color: var(--bg-primary);",
      informative:
        "background: var(--state-informative); border-color: var(--state-informative); color: var(--bg-primary);",
    };

    return colorMap[props.color] || baseStyles;
  }

  return baseStyles;
});

/**
 * Получить цвет статуса
 */
function getStatusColor(): string {
  const colorMap = {
    primary: "var(--fg-primary)",
    secondary: "var(--fg-secondary)",
    accent: "var(--fg-primary)",
    positive: "var(--state-positive)",
    caution: "var(--state-caution)",
    critical: "var(--state-critical)",
    informative: "var(--state-informative)",
  };

  return colorMap[props.color] || colorMap.primary;
}

/**
 * Получить текст статуса
 */
function getStatusText(): string {
  if (!props.isActive) return "ОЖИДАНИЕ";
  if (props.count === 0) return "ПРОСТОЙ";
  if (props.count > 10) return "ПИКОВАЯ НАГРУЗКА";
  if (props.count > 5) return "ВЫСОКАЯ НАГРУЗКА";
  return "ОБРАБОТКА";
}

/**
 * Получить текст производительности
 */
function getPerformanceText(): string {
  if (props.count > 10) return "ПЕРЕГРУЗКА";
  if (props.count > 5) return "БЫСТРО";
  return "НОРМА";
}
</script>

<style scoped>
.transition-minimal {
  transition: all 150ms ease-in-out;
}
</style>
