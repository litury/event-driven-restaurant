<template>
  <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6 fade-in hover:shadow-xl transition-shadow duration-300">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-2xl">{{ icon }}</span>
          <h3 class="text-sm font-medium text-slate-600">{{ title }}</h3>
        </div>
        <p class="text-2xl font-bold transition-all duration-500" :class="getValueColor()">{{ value }}</p>
        <p class="text-xs text-slate-500 mt-1">{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: string
  title: string
  value: string | number
  color: string
  description: string
}

const props = defineProps<Props>()

function getValueColor() {
  switch (props.color) {
    case 'blue': return 'text-blue-600'
    case 'orange': return 'text-orange-600'
    case 'green': return 'text-green-600'
    case 'purple': return 'text-purple-600'
    default: return 'text-slate-600'
  }
}
</script> 