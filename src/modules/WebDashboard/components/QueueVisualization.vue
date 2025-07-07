<!--
  Компонент визуализации очереди событий
  
  Очередь - это фиксирующее оборудование для событий
  Отображает состояние конкретной очереди в событийной системе балансировки
  
      Принципы CEP:
  - События строго упорядочены по времени
  - Очередь хранит и фиксирует события в порядке поступления  
  - Каждая очередь имеет определенную роль в системе (работы, назначения, рабочие)
-->
<template>
  <div
    :class="[
      'bg-white/10 backdrop-blur-sm rounded-xl p-6 transition-all hover:bg-white/15',
      borderColorClass,
    ]"
  >
    <!-- Заголовок очереди с размером -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
      <div :class="['text-3xl font-bold', sizeColorClass]">
        {{ size }}
      </div>
    </div>

    <!-- Визуальный индикатор загрузки очереди -->
    <div class="w-full bg-gray-700 rounded-full h-2 mb-3">
      <div
        :class="[
          'h-2 rounded-full transition-all duration-500',
          progressColorClass,
        ]"
        :style="{ width: `${progressPercent}%` }"
      ></div>
    </div>

    <!-- Описание роли очереди в системе -->
    <p class="text-sm text-slate-300">{{ description }}</p>

    <!-- Статус очереди (активна/пуста) -->
    <div class="flex items-center mt-2 space-x-2">
      <div
        :class="[
          'w-2 h-2 rounded-full',
          size > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-500',
        ]"
      ></div>
      <span class="text-xs text-slate-400">
        {{ size > 0 ? "Активна" : "Пуста" }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

/**
 * Свойства компонента очереди событий
 */
interface Props {
  /** Название очереди (например, "📝 Очередь Работ") */
  title: string;

  /** Текущий размер очереди (количество событий) */
  size: number;

  /** Цветовая схема для визуализации */
  color: "blue" | "green" | "purple" | "orange" | "red" | "emerald";

  /** Описание роли очереди в системе */
  description: string;

  /** Максимальный размер для расчета процента заполнения */
  maxSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxSize: 10,
});

/**
 * Процент заполнения очереди для визуального индикатора
 *
 * Ограничиваем максимум 100% для корректного отображения
 */
const progressPercent = computed((): number =>
  Math.min((props.size / props.maxSize) * 100, 100)
);

/**
 * CSS классы для цветового кодирования очередей
 *
 * Каждый тип очереди имеет свой цвет для лучшего понимания системы:
 * - Синий: входящие данные (работы)
 * - Зеленый: доступные ресурсы (свободные рабочие)
 * - Фиолетовый: промежуточная обработка (назначения)
 * - Оранжевый/Красный: обработка (рабочие)
 * - Изумрудный: результаты
 */
const colorClasses = {
  blue: "border-l-4 border-blue-400",
  green: "border-l-4 border-green-400",
  purple: "border-l-4 border-purple-400",
  orange: "border-l-4 border-orange-400",
  red: "border-l-4 border-red-400",
  emerald: "border-l-4 border-emerald-400",
};

const sizeColorClasses = {
  blue: "text-blue-400",
  green: "text-green-400",
  purple: "text-purple-400",
  orange: "text-orange-400",
  red: "text-red-400",
  emerald: "text-emerald-400",
};

const progressColorClasses = {
  blue: "bg-blue-400",
  green: "bg-green-400",
  purple: "bg-purple-400",
  orange: "bg-orange-400",
  red: "bg-red-400",
  emerald: "bg-emerald-400",
};

const borderColorClass = computed((): string => colorClasses[props.color]);
const sizeColorClass = computed((): string => sizeColorClasses[props.color]);
const progressColorClass = computed(
  (): string => progressColorClasses[props.color]
);
</script>
