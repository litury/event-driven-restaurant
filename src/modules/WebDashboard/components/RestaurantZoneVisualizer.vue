<template>
  <div
    class="border p-6 space-y-6"
    style="background: var(--bg-primary); border-color: var(--border-secondary)"
  >
    <div class="flex items-center justify-between">
      <h3
        class="text-lg font-semibold font-mono tracking-wide uppercase"
        style="color: var(--fg-primary)"
      >
        <Building2 class="inline mr-2" :size="20" />
        ЗОНЫ РЕСТОРАНА - ДЗ-3 СИНХРОНИЗАЦИЯ
      </h3>
      <span
        class="text-sm font-mono tracking-wide uppercase"
        style="color: var(--fg-tertiary)"
      >
        {{ totalOccupiedTables }}/{{ totalCapacity }} СТОЛОВ
      </span>
    </div>

    <!-- Образовательный блок о зонах и очередях -->
    <div
      class="p-4 border"
      style="
        background: var(--bg-secondary);
        border-color: var(--border-primary);
      "
    >
      <h4
        class="font-mono text-sm font-semibold mb-3 uppercase"
        style="color: var(--state-informative)"
      >
        <BookOpen class="inline mr-2" :size="16" />
        ПРИНЦИПЫ РАЗМЕЩЕНИЯ И БУФЕРИЗАЦИИ
      </h4>

      <!-- ОБЪЯСНЕНИЕ АНАЛОГИИ ДЛЯ НОВИЧКОВ -->
      <div
        class="mb-4 p-4 border"
        style="
          background: var(--bg-tertiary);
          border-color: var(--border-secondary);
        "
      >
        <h5
          class="font-semibold mb-3 uppercase text-sm"
          style="color: var(--state-critical)"
        >
          <Users class="inline mr-2" :size="14" />
          АНАЛОГИЯ РЕСТОРАНА ДЛЯ НОВИЧКОВ:
        </h5>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <div class="flex items-center mb-2">
              <User
                class="inline mr-1"
                :size="12"
                style="color: var(--state-informative)"
              />
              <span class="font-semibold" style="color: var(--fg-primary)"
                >1. КЛИЕНТЫ:</span
              >
            </div>
            <div style="color: var(--fg-secondary)" class="space-y-1">
              <div>• Генератор создает заказы</div>
              <div>• Каждый заказ = один клиент</div>
              <div>• 30% клиентов = VIP статус</div>
              <div>• Клиент ждет пока заказ готовится</div>
            </div>
          </div>
          <div>
            <div class="flex items-center mb-2">
              <Armchair
                class="inline mr-1"
                :size="12"
                style="color: var(--state-caution)"
              />
              <span class="font-semibold" style="color: var(--fg-primary)"
                >2. СТОЛЫ:</span
              >
            </div>
            <div style="color: var(--fg-secondary)" class="space-y-1">
              <div>• Место где клиент ожидает</div>
              <div>• VIP зона: 5 столов (приоритет)</div>
              <div>• Обычная зона: 10 столов</div>
              <div>• Цвет = статус обработки</div>
            </div>
          </div>
          <div>
            <div class="flex items-center mb-2">
              <Clock
                class="inline mr-1"
                :size="12"
                style="color: var(--state-positive)"
              />
              <span class="font-semibold" style="color: var(--fg-primary)"
                >3. ВРЕМЯ:</span
              >
            </div>
            <div style="color: var(--fg-secondary)" class="space-y-1">
              <div>• Заказ готовится 15-45 мин</div>
              <div>• VIP заказы готовятся быстрее</div>
              <div>• После готовности стол освобождается</div>
              <div>• Следующий клиент занимает место</div>
            </div>
          </div>
        </div>

        <!-- Цветовая схема -->
        <div
          class="mt-4 p-3 border"
          style="
            background: var(--bg-secondary);
            border-color: var(--border-secondary);
          "
        >
          <h6
            class="font-semibold mb-2 text-xs"
            style="color: var(--fg-primary)"
          >
            <Palette class="inline mr-1" :size="10" />
            ЦВЕТОВАЯ СХЕМА СТОЛОВ:
          </h6>
          <div class="grid grid-cols-3 gap-3 text-xs">
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 border"
                style="
                  background: var(--bg-tertiary);
                  border-color: var(--border-tertiary);
                "
              ></div>
              <span style="color: var(--fg-secondary)">Свободен</span>
            </div>
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 border"
                style="
                  background: var(--state-caution-bg);
                  border-color: var(--state-caution-border);
                "
              ></div>
              <span style="color: var(--fg-secondary)">VIP занят</span>
            </div>
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 border"
                style="
                  background: var(--state-informative-bg);
                  border-color: var(--state-informative-border);
                "
              ></div>
              <span style="color: var(--fg-secondary)">Обычный занят</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Пояснение к цифрам на столах -->
      <div
        class="mb-4 p-3 border"
        style="
          background: var(--bg-tertiary);
          border-color: var(--border-secondary);
        "
      >
        <h5
          class="font-semibold mb-2 uppercase text-xs"
          style="color: var(--fg-primary)"
        >
          <GraduationCap class="inline mr-1" :size="12" />
          ЧТО ОЗНАЧАЮТ ЦИФРЫ НА СТОЛАХ:
        </h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div>
            <div class="flex items-center mb-1">
              <Crown
                class="inline mr-1"
                :size="10"
                style="color: var(--state-caution)"
              />
              <span class="font-semibold" style="color: var(--fg-primary)"
                >VIP ЗОНА - ID ЗАКАЗОВ:</span
              >
            </div>
            <div style="color: var(--fg-secondary)" class="space-y-1">
              <div>
                • <span style="color: var(--fg-primary)">#4, #10, #11</span> =
                уникальные ID заказов
              </div>
              <div>
                • Реализует
                <span style="color: var(--fg-primary)">Event Sourcing</span> из
                ДЗ-3
              </div>
              <div>
                • Связано с
                <span style="color: var(--fg-primary)"
                  >RestaurantZoneAPI.addOrder()</span
                >
              </div>
            </div>
          </div>
          <div>
            <div class="flex items-center mb-1">
              <Users
                class="inline mr-1"
                :size="10"
                style="color: var(--state-informative)"
              />
              <span class="font-semibold" style="color: var(--fg-primary)"
                >ОБЫЧНАЯ ЗОНА - КОЛИЧЕСТВО:</span
              >
            </div>
            <div style="color: var(--fg-secondary)" class="space-y-1">
              <div>
                • <span style="color: var(--fg-primary)">1 ЗАКАЗ</span> =
                количество заказов на столе
              </div>
              <div>
                • Реализует
                <span style="color: var(--fg-primary)">буферизацию</span> из
                ДЗ-3
              </div>
              <div>
                • Связано с
                <span style="color: var(--fg-primary)">RestaurantZoneSync</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
        <!-- VIP зона объяснение -->
        <div
          class="p-3 border"
          style="
            background: var(--bg-tertiary);
            border-color: var(--border-secondary);
          "
        >
          <h5
            class="font-semibold mb-2 uppercase"
            style="color: var(--state-caution)"
          >
            <Crown class="inline mr-1" :size="12" />
            VIP ЗОНА (ПРИОРИТЕТНЫЙ БУФЕР)
          </h5>
          <div style="color: var(--fg-secondary)" class="space-y-1">
            <div>
              • <span style="color: var(--fg-primary)">5 столов</span> -
              ограниченная ёмкость
            </div>
            <div>
              • <span style="color: var(--fg-primary)">Приоритет:</span> 0.5x
              (быстрее обработка)
            </div>
            <div>
              • <span style="color: var(--fg-primary)">Очередь:</span> FIFO при
              занятости
            </div>
            <div>
              •
              <span style="color: var(--fg-primary)"
                >Автоматическое размещение</span
              >
              при освобождении
            </div>
          </div>
        </div>

        <!-- Обычная зона объяснение -->
        <div
          class="p-3 border"
          style="
            background: var(--bg-tertiary);
            border-color: var(--border-secondary);
          "
        >
          <h5
            class="font-semibold mb-2 uppercase"
            style="color: var(--state-informative)"
          >
            <Users class="inline mr-1" :size="12" />
            ОБЫЧНАЯ ЗОНА (ОСНОВНОЙ БУФЕР)
          </h5>
          <div style="color: var(--fg-secondary)" class="space-y-1">
            <div>
              • <span style="color: var(--fg-primary)">10 столов</span> - больше
              ёмкости
            </div>
            <div>
              •
              <span style="color: var(--fg-primary)"
                >Стандартный приоритет</span
              >
              обработки
            </div>
            <div>
              • <span style="color: var(--fg-primary)">Очередь:</span> FIFO при
              занятости
            </div>
            <div>
              • <span style="color: var(--fg-primary)">Балансировка</span> при
              высокой нагрузке
            </div>
          </div>
        </div>
      </div>

      <!-- Схема работы буферов -->
      <div
        class="mt-4 p-3 border"
        style="
          background: var(--bg-tertiary);
          border-color: var(--border-secondary);
        "
      >
        <h5
          class="font-semibold mb-2 uppercase text-xs"
          style="color: var(--state-critical)"
        >
          <RotateCcw class="inline mr-1" :size="12" />
          АЛГОРИТМ РАЗМЕЩЕНИЯ:
        </h5>
        <div class="text-xs font-mono" style="color: var(--fg-tertiary)">
          <div class="mb-1">
            <span style="color: var(--fg-primary)">1. ПРОВЕРКА ЗОНЫ:</span>
            VIP/обычная по статусу клиента
          </div>
          <div class="mb-1">
            <span style="color: var(--fg-primary)">2. ПОИСК СТОЛОВ:</span>
            Свободные столы в зоне
          </div>
          <div class="mb-1">
            <span style="color: var(--fg-primary)"
              >3. РАЗМЕЩЕНИЕ ИЛИ ОЧЕРЕДЬ:</span
            >
            Стол доступен → размещение | Все заняты → в очередь
          </div>
          <div>
            <span style="color: var(--fg-primary)">4. АВТООСВОБОЖДЕНИЕ:</span>
            При завершении → следующий из очереди
          </div>
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div
      class="p-4 border"
      style="
        background: var(--bg-secondary);
        border-color: var(--border-primary);
      "
    >
      <h4
        class="font-mono text-sm font-semibold mb-2 uppercase"
        style="color: var(--fg-primary)"
      >
        <BookOpen class="inline mr-2" :size="16" />
        ПРИНЦИПЫ СОБЫТИЙНОЙ СИНХРОНИЗАЦИИ:
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div>
          <Crown
            class="inline mr-1"
            :size="14"
            style="color: var(--state-caution)"
          />
          <span style="color: var(--fg-primary)">VIP = ОТДЕЛЬНАЯ ЗОНА</span
          ><br />
          <span style="color: var(--fg-tertiary)">
            isVipCustomer: true → VIP зона
          </span>
        </div>
        <div>
          <Users
            class="inline mr-1"
            :size="14"
            style="color: var(--state-informative)"
          />
          <span style="color: var(--fg-primary)">ОБЫЧНЫЕ = ОБЩАЯ ЗОНА</span
          ><br />
          <span style="color: var(--fg-tertiary)">
            isVipCustomer: false → Обычная зона
          </span>
        </div>
        <div>
          <GitBranch
            class="inline mr-1"
            :size="14"
            style="color: var(--state-positive)"
          />
          <span style="color: var(--fg-primary)">AUTO-SYNC СОБЫТИЯ</span><br />
          <span style="color: var(--fg-tertiary)">
            API → ChangeLog → ZoneSync
          </span>
        </div>
      </div>
    </div>

    <!-- Визуализация зон -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- VIP зона -->
      <div
        class="border p-4"
        style="
          background: var(--bg-secondary);
          border-color: var(--border-primary);
        "
      >
        <div class="flex items-center justify-between mb-4">
          <h4
            class="font-mono text-sm font-semibold uppercase flex items-center gap-2"
            style="color: var(--state-caution)"
          >
            <Crown :size="16" />
            VIP ЗОНА
          </h4>
          <div class="text-xs font-mono" style="color: var(--fg-secondary)">
            {{ vipZone.capacity - vipZone.availableSlots }}/{{
              vipZone.capacity
            }}
            столов
          </div>
        </div>

        <!-- Столы VIP зоны -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div
            v-for="table in vipZone.tables"
            :key="`vip-table-${table.number}`"
            class="border p-3 transition-minimal"
            :style="{
              background:
                table.orderIds.length > 0
                  ? 'var(--state-caution-bg)'
                  : 'var(--bg-tertiary)',
              borderColor:
                table.orderIds.length > 0
                  ? 'var(--state-caution-border)'
                  : 'var(--border-tertiary)',
            }"
          >
            <div class="flex items-center justify-between mb-2">
              <span
                class="font-mono text-xs font-semibold"
                style="color: var(--fg-primary)"
              >
                СТОЛ {{ table.number }}
              </span>
              <div
                class="w-2 h-2"
                :style="{
                  backgroundColor:
                    table.orderIds.length > 0
                      ? 'var(--state-caution)'
                      : 'var(--fg-tertiary)',
                }"
              ></div>
            </div>

            <div v-if="table.orderIds.length > 0" class="space-y-1">
              <div class="text-xs font-mono" style="color: var(--fg-secondary)">
                ЗАКАЗЫ ({{ table.orderIds.length }}):
              </div>
              <div
                v-for="orderId in table.orderIds.slice(0, 2)"
                :key="orderId"
                class="text-xs font-mono pl-2"
                style="color: var(--fg-secondary)"
              >
                #{{ orderId }}
              </div>
              <div
                v-if="table.orderIds.length > 2"
                class="text-xs font-mono pl-2"
                style="color: var(--fg-tertiary)"
              >
                +{{ table.orderIds.length - 2 }} ещё
              </div>

              <!-- Таймер освобождения для VIP -->
              <div
                class="mt-2 pt-2 border-t"
                style="border-color: var(--border-tertiary)"
              >
                <div
                  class="flex items-center gap-1 text-xs font-mono"
                  style="color: var(--fg-tertiary)"
                >
                  <Clock :size="8" />
                  <span>{{ getEstimatedTime(table.orderIds[0]) }}</span>
                </div>
                <div
                  class="text-xs font-mono"
                  style="color: var(--fg-tertiary)"
                >
                  до освобождения
                </div>
              </div>
            </div>

            <div
              v-else
              class="text-xs font-mono text-center"
              style="color: var(--fg-tertiary)"
            >
              СВОБОДЕН
              <div class="mt-1 text-xs" style="color: var(--fg-tertiary)">
                <User :size="8" class="inline mr-1" />
                ожидает клиента
              </div>
            </div>
          </div>
        </div>

        <!-- Статистика VIP зоны -->
        <div
          class="pt-3 border-t text-xs font-mono"
          style="border-color: var(--border-secondary)"
        >
          <div class="flex items-center justify-between">
            <span style="color: var(--fg-secondary)">ЗАГРУЗКА:</span>
            <span style="color: var(--state-caution)" class="font-semibold">
              {{
                Math.round(
                  (1 - vipZone.availableSlots / vipZone.capacity) * 100
                )
              }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Обычная зона -->
      <div
        class="border p-4"
        style="
          background: var(--bg-secondary);
          border-color: var(--border-primary);
        "
      >
        <div class="flex items-center justify-between mb-4">
          <h4
            class="font-mono text-sm font-semibold uppercase flex items-center gap-2"
            style="color: var(--state-informative)"
          >
            <Users :size="16" />
            ОБЫЧНАЯ ЗОНА
          </h4>
          <div class="text-xs font-mono" style="color: var(--fg-secondary)">
            {{ regularZone.capacity - regularZone.availableSlots }}/{{
              regularZone.capacity
            }}
            столов
          </div>
        </div>

        <!-- Столы обычной зоны (компактное отображение) -->
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div
            v-for="table in regularZone.tables"
            :key="`regular-table-${table.number}`"
            class="border p-2 transition-minimal"
            :style="{
              background:
                table.orderIds.length > 0
                  ? 'var(--state-informative-bg)'
                  : 'var(--bg-tertiary)',
              borderColor:
                table.orderIds.length > 0
                  ? 'var(--state-informative-border)'
                  : 'var(--border-tertiary)',
            }"
          >
            <div class="text-center">
              <span
                class="font-mono text-xs font-semibold block mb-1"
                style="color: var(--fg-primary)"
              >
                СТОЛ {{ table.number }}
              </span>
              <div
                class="w-1 h-1 mx-auto mb-1"
                :style="{
                  backgroundColor:
                    table.orderIds.length > 0
                      ? 'var(--state-informative)'
                      : 'var(--fg-tertiary)',
                }"
              ></div>
              <div class="text-xs font-mono" style="color: var(--fg-secondary)">
                {{ table.orderIds.length }}
              </div>
              <div class="text-xs font-mono" style="color: var(--fg-tertiary)">
                {{
                  table.orderIds.length === 1
                    ? "ЗАКАЗ"
                    : table.orderIds.length === 0
                    ? "СВОБОДЕН"
                    : "ЗАКАЗОВ"
                }}
              </div>

              <!-- Таймер для обычной зоны -->
              <div v-if="table.orderIds.length > 0" class="mt-1">
                <div
                  class="flex items-center justify-center gap-1 text-xs font-mono"
                  style="color: var(--fg-tertiary)"
                >
                  <Clock :size="6" />
                  <span>{{ getEstimatedTime(table.orderIds[0]) }}</span>
                </div>
              </div>

              <!-- Индикатор ожидания клиента -->
              <div v-else class="mt-1">
                <User
                  :size="6"
                  class="mx-auto"
                  style="color: var(--fg-tertiary)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Статистика обычной зоны -->
        <div
          class="pt-3 border-t text-xs font-mono"
          style="border-color: var(--border-secondary)"
        >
          <div class="flex items-center justify-between">
            <span style="color: var(--fg-secondary)">ЗАГРУЗКА:</span>
            <span style="color: var(--state-informative)" class="font-semibold">
              {{
                Math.round(
                  (1 - regularZone.availableSlots / regularZone.capacity) * 100
                )
              }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Building2,
  BookOpen,
  Crown,
  Users,
  GitBranch,
  Plus,
  Activity,
  ScrollText,
  GraduationCap,
  RotateCcw,
  User,
  Armchair,
  Clock,
  Palette,
} from "lucide-vue-next";
import type { RestaurantChangeEvent } from "../../WorkloadBalancing/interfaces/IRestaurantSyncModel";

// Локальные интерфейсы для зон (используются в UI)
interface IRestaurantTable {
  number: number;
  isOccupied: boolean;
  orderIds: string[];
  orders?: any[];
}

interface IRestaurantZone {
  name: string;
  tables: IRestaurantTable[];
  capacity: number;
  availableSlots: number;
}

interface Props {
  vipZone: IRestaurantZone;
  regularZone: IRestaurantZone;
  recentEvents: RestaurantChangeEvent[];
  statistics: {
    totalOrders: number;
    vipOrders: number;
    completedOrders: number;
    eventsLogged: number;
  };
}

const props = defineProps<Props>();

/**
 * Общее количество занятых столов
 */
const totalOccupiedTables = computed(() => {
  return (
    props.vipZone.capacity -
    props.vipZone.availableSlots +
    (props.regularZone.capacity - props.regularZone.availableSlots)
  );
});

/**
 * Общая вместимость
 */
const totalCapacity = computed(() => {
  return props.vipZone.capacity + props.regularZone.capacity;
});

/**
 * Форматирование времени события
 */
function formatEventTime(timestamp: Date): string {
  if (!timestamp || !(timestamp instanceof Date)) {
    return "—";
  }

  return timestamp.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Получение оценочного времени освобождения стола
 */
function getEstimatedTime(orderId: string): string {
  if (!orderId) return "—";

  // Имитируем время приготовления (15-45 минут)
  const orderNumber = parseInt(orderId) || 1;
  const baseTime = 15; // минимум 15 минут
  const variableTime = (orderNumber % 30) + 1; // от 1 до 30 минут дополнительно
  const totalMinutes = baseTime + variableTime;

  return `${totalMinutes} мин`;
}
</script>

<style scoped>
.transition-minimal {
  transition: all 0.15s ease-out;
}

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
</style>
