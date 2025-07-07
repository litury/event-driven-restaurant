<template>
  <div :class="[
    'p-4 rounded-xl border-2 transition-all duration-300 queue-transition',
    isActive ? getBorderColor() + ' ' + getBgColor() : 'border-slate-200 bg-slate-50'
  ]">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-3">
        <span :class="['text-2xl', isActive ? 'pulse-soft' : '']">{{ icon }}</span>
        <div>
          <h3 class="font-semibold text-slate-800">{{ title }}</h3>
          <p class="text-xs text-slate-500">{{ description }}</p>
        </div>
      </div>
      <div :class="[
        'px-3 py-1 rounded-full text-lg font-bold transition-all duration-300',
        getCountColor(),
        isActive && count > 0 ? 'scale-110 pulse-soft' : ''
      ]">
        {{ count }}
      </div>
    </div>
    <div v-if="timing" class="text-xs text-slate-500 mt-2">
      ⏱️ {{ timing }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: string
  title: string
  count: number
  color: string
  description: string
  isActive: boolean
  timing?: string
}

const props = defineProps<Props>()

function getBorderColor() {
  switch (props.color) {
    case 'blue': return 'border-blue-400'
    case 'amber': return 'border-amber-400'
    case 'red': return 'border-red-400'
    case 'orange': return 'border-orange-400'
    case 'green': return 'border-green-400'
    default: return 'border-slate-200'
  }
}

function getBgColor() {
  switch (props.color) {
    case 'blue': return 'bg-blue-50'
    case 'amber': return 'bg-amber-50'
    case 'red': return 'bg-red-50'
    case 'orange': return 'bg-orange-50'
    case 'green': return 'bg-green-50'
    default: return 'bg-slate-50'
  }
}

function getCountColor() {
  if (!props.isActive || props.count === 0) {
    return 'bg-slate-200 text-slate-600'
  }
  switch (props.color) {
    case 'blue': return 'bg-blue-500 text-white'
    case 'amber': return 'bg-amber-500 text-white'
    case 'red': return 'bg-red-500 text-white'
    case 'orange': return 'bg-orange-500 text-white'
    case 'green': return 'bg-green-500 text-white'
    default: return 'bg-slate-500 text-white'
  }
}
</script> 