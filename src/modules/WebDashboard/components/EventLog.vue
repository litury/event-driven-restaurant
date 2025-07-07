<template>
  <div class="event-log">
    <div class="log-header">
      <h3>📋 Лог событий системы</h3>
      <div class="log-controls">
        <button @click="clearLog" class="btn-clear">🗑️ Очистить</button>
        <button @click="toggleAutoScroll" :class="['btn-scroll', autoScroll ? 'active' : '']">
          {{ autoScroll ? '📌 Авто-прокрутка' : '⏸️ Пауза' }}
        </button>
      </div>
    </div>
    
    <div class="log-container" ref="logContainer">
      <div 
        v-for="event in events" 
        :key="event.id"
        :class="['log-entry', `log-${event.type}`]"
      >
        <span class="log-time">{{ formatTime(event.timestamp) }}</span>
        <span class="log-icon">{{ event.icon }}</span>
        <span class="log-message">{{ event.message }}</span>
        <span v-if="event.data" class="log-data">{{ event.data }}</span>
      </div>
      
      <div v-if="events.length === 0" class="log-empty">
        🕰️ Ожидание событий... Запустите ресторан чтобы увидеть поток данных.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'

// Типы событий
interface LogEvent {
  id: number
  timestamp: number
  type: 'order' | 'assignment' | 'cooking' | 'complete' | 'system'
  icon: string
  message: string
  data?: string
}

// Состояние лога
const events = reactive<LogEvent[]>([])
const logContainer = ref<HTMLElement>()
const autoScroll = ref(true)
let eventIdCounter = 0

// Максимальное количество событий (чтобы не засорять память)
const MAX_EVENTS = 100

/**
 * 📝 Добавить событие в лог
 */
function addEvent(type: LogEvent['type'], icon: string, message: string, data?: string) {
  const event: LogEvent = {
    id: ++eventIdCounter,
    timestamp: Date.now(),
    type,
    icon,
    message,
    data
  }
  
  events.push(event)
  
  // Ограничиваем размер лога
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS)
  }
  
  // Автопрокрутка к последнему событию
  if (autoScroll.value) {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    })
  }
}

/**
 * 🗑️ Очистить лог
 */
function clearLog() {
  events.splice(0, events.length)
}

/**
 * ⏸️ Переключить автопрокрутку
 */
function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value
}

/**
 * 🕐 Форматировать время
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ru-RU', { 
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 1
  })
}

// Экспортируем функцию для внешнего использования
defineExpose({
  addEvent
})
</script>

<style scoped>
.event-log {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin: 20px 0;
  overflow: hidden;
}

.log-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.log-controls {
  display: flex;
  gap: 10px;
}

.btn-clear, .btn-scroll {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.btn-clear:hover, .btn-scroll:hover {
  background: rgba(255,255,255,0.3);
}

.btn-scroll.active {
  background: rgba(255,255,255,0.3);
  border-color: rgba(255,255,255,0.5);
}

.log-container {
  height: 300px;
  overflow-y: auto;
  padding: 10px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.4;
}

.log-entry {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  margin: 2px 0;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.log-entry:hover {
  background: rgba(0,0,0,0.02);
}

.log-time {
  color: #666;
  margin-right: 8px;
  font-weight: bold;
  min-width: 70px;
}

.log-icon {
  margin-right: 8px;
  font-size: 1rem;
}

.log-message {
  flex: 1;
  margin-right: 8px;
}

.log-data {
  background: #f8f9fa;
  color: #495057;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
  border: 1px solid #e9ecef;
}

/* Цветовая схема для разных типов событий */
.log-order {
  border-left: 3px solid #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.log-assignment {
  border-left: 3px solid #f39c12;
  background: rgba(243, 156, 18, 0.05);
}

.log-cooking {
  border-left: 3px solid #e74c3c;
  background: rgba(231, 76, 60, 0.05);
}

.log-complete {
  border-left: 3px solid #27ae60;
  background: rgba(39, 174, 96, 0.05);
}

.log-system {
  border-left: 3px solid #9b59b6;
  background: rgba(155, 89, 182, 0.05);
}

.log-empty {
  text-align: center;
  color: #999;
  padding: 50px 20px;
  font-style: italic;
}

/* Прокрутка */
.log-container::-webkit-scrollbar {
  width: 6px;
}

.log-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style> 