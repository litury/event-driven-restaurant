<template>
  <div class="min-h-screen" style="background: var(--bg-primary)">
    <!-- Заголовок с кнопками управления в одной строке -->
    <header
      class="border-b p-6"
      style="
        background: var(--bg-primary);
        border-color: var(--border-secondary);
      "
    >
      <div class="flex items-center justify-between">
        <!-- Название ресторана -->
        <div class="flex items-center gap-4">
          <h1
            class="text-2xl font-bold font-mono tracking-wide uppercase"
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
        </div>

        <!-- Кнопки управления -->
        <div class="flex items-center gap-3">
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

          <!-- Кнопка запуска -->
          <button
            @click="start"
            :disabled="isRunning"
            class="px-3 py-2 font-mono text-xs font-medium tracking-wide uppercase transition-minimal border"
            :class="
              isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
            "
            style="
              background: var(--state-positive);
              color: var(--bg-primary);
              border-color: var(--state-positive);
            "
          >
            <Play :size="14" class="inline mr-1" />
            ЗАПУСК
          </button>

          <!-- Кнопка остановки -->
          <button
            @click="stop"
            :disabled="!isRunning"
            class="px-3 py-2 font-mono text-xs font-medium tracking-wide uppercase transition-minimal border"
            :class="
              !isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
            "
            style="
              background: var(--state-critical);
              color: var(--bg-primary);
              border-color: var(--state-critical);
            "
          >
            <Square :size="14" class="inline mr-1" />
            СТОП
          </button>
        </div>
      </div>
    </header>

    <!-- Образовательный блок о принципах CEP на всю ширину -->
    <section class="p-6 border-b" style="border-color: var(--border-secondary)">
      <div
        class="p-4 border"
        style="
          background: var(--bg-secondary);
          border-color: var(--border-primary);
        "
      >
        <h3
          class="font-mono text-sm font-semibold mb-3 uppercase"
          style="color: var(--fg-primary)"
        >
          <BookOpen class="inline mr-2" :size="16" />
          ЭВОЛЮЦИЯ CEP: ОТ ПРОСТОГО К СЛОЖНОМУ
        </h3>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-mono">
          <!-- Лекция 1: Основы -->
          <div
            class="p-3 border"
            style="
              background: var(--bg-tertiary);
              border-color: var(--border-secondary);
            "
          >
            <h4
              class="font-semibold mb-2 uppercase"
              style="color: var(--state-informative)"
            >
              <Target class="inline mr-1" :size="12" />
              ЛЕКЦИЯ 1: ОСНОВЫ CEP
            </h4>
            <div style="color: var(--fg-secondary)">
              <div class="mb-2">
                <span style="color: var(--fg-primary)">• СОБЫТИЯ:</span>
                Неизменяемые факты (заказы)
              </div>
              <div class="mb-2">
                <span style="color: var(--fg-primary)">• ПОТОК:</span>
                Упорядоченная последовательность
              </div>
              <div>
                <span style="color: var(--fg-primary)">• ОБРАБОТКА:</span>
                ZIP + фильтры + агрегация
              </div>
            </div>
          </div>

          <!-- Лекция 2: Паттерны -->
          <div
            class="p-3 border"
            style="
              background: var(--bg-tertiary);
              border-color: var(--border-secondary);
            "
          >
            <h4
              class="font-semibold mb-2 uppercase"
              style="color: var(--state-caution)"
            >
              <Zap class="inline mr-1" :size="12" />
              ЛЕКЦИЯ 2: ПАТТЕРНЫ
            </h4>
            <div style="color: var(--fg-secondary)">
              <div class="mb-2">
                <span style="color: var(--fg-primary)">• ZIP:</span>
                Объединение потоков (заказы↔повара)
              </div>
              <div class="mb-2">
                <span style="color: var(--fg-primary)">• ФИЛЬТР:</span>
                Разделение по типу блюд
              </div>
              <div>
                <span style="color: var(--fg-primary)">• ОКНА:</span>
                Статистика за период
              </div>
            </div>
          </div>

          <!-- Лекция 3: Синхронизация -->
          <div
            class="p-3 border"
            style="
              background: var(--bg-tertiary);
              border-color: var(--border-secondary);
            "
          >
            <h4
              class="font-semibold mb-2 uppercase"
              style="color: var(--state-positive)"
            >
              <Building2 class="inline mr-1" :size="12" />
              ЛЕКЦИЯ 3: СИНХРОНИЗАЦИЯ
            </h4>
            <div style="color: var(--fg-secondary)">
              <div class="mb-2">
                <span style="color: var(--fg-primary)">• ЗОНЫ:</span> VIP vs
                обычные столы
              </div>
              <div class="mb-2">
                <span style="color: var(--fg-primary)">• БУФЕРЫ:</span>
                Очереди при занятости
              </div>
              <div>
                <span style="color: var(--fg-primary)">• БАЛАНСИРОВКА:</span>
                Распределение нагрузки
              </div>
            </div>
          </div>
        </div>

        <!-- Ключевые принципы -->
        <div
          class="mt-4 p-3 border"
          style="
            background: var(--bg-tertiary);
            border-color: var(--border-secondary);
          "
        >
          <h4
            class="font-semibold mb-2 uppercase text-xs"
            style="color: var(--state-critical)"
          >
            <Lightbulb class="inline mr-1" :size="12" />
            КЛЮЧЕВЫЕ ПРИНЦИПЫ В ДЕЙСТВИИ:
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span style="color: var(--fg-primary)">
                <RotateCcw class="inline mr-1" :size="10" />
                ИММУТАБЕЛЬНОСТЬ: </span
              ><br />
              <span style="color: var(--fg-tertiary)">
                Заказы не изменяются после создания → новые события для статусов
              </span>
            </div>
            <div>
              <span style="color: var(--fg-primary)">
                <Clock class="inline mr-1" :size="10" />
                ВРЕМЕННОЙ ПОРЯДОК: </span
              ><br />
              <span style="color: var(--fg-tertiary)">
                События обрабатываются в хронологическом порядке поступления
              </span>
            </div>
            <div>
              <span style="color: var(--fg-primary)">
                <Target class="inline mr-1" :size="10" />
                РЕАКТИВНОСТЬ: </span
              ><br />
              <span style="color: var(--fg-tertiary)">
                Система реагирует на события мгновенно без polling
              </span>
            </div>
            <div>
              <span style="color: var(--fg-primary)">
                <Link class="inline mr-1" :size="10" />
                КОМПОЗИЦИЯ: </span
              ><br />
              <span style="color: var(--fg-tertiary)">
                Сложная логика собирается из простых операторов
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <main class="p-6 space-y-6">
      <!-- МОНИТОРИНГ В РЕАЛЬНОМ ВРЕМЕНИ - ВЕРХНИЙ БЛОК -->
      <section v-if="isRunning">
        <div
          class="border p-4"
          style="
            background: var(--bg-primary);
            border-color: var(--border-secondary);
          "
        >
          <div class="flex items-center justify-between mb-4">
            <h3
              class="text-lg font-semibold font-mono tracking-wide uppercase"
              style="color: var(--fg-primary)"
            >
              <Activity class="inline mr-2" :size="20" />
              МОНИТОРИНГ СИСТЕМ В РЕАЛЬНОМ ВРЕМЕНИ
            </h3>
            <div class="flex items-center gap-2">
              <div
                class="w-2 h-2 animate-pulse"
                style="background: var(--state-positive)"
              ></div>
              <span
                class="text-xs font-mono uppercase"
                style="color: var(--fg-secondary)"
              >
                СИСТЕМЫ АКТИВНЫ
              </span>
            </div>
          </div>

          <!-- Образовательное пояснение -->
          <div
            class="mb-4 p-3 border text-xs font-mono"
            style="
              background: var(--bg-tertiary);
              border-color: var(--border-secondary);
            "
          >
            <div class="flex items-center mb-2">
              <GraduationCap
                class="inline mr-2"
                :size="14"
                style="color: var(--state-informative)"
              />
              <span class="font-semibold" style="color: var(--fg-primary)">
                ОБРАЗОВАТЕЛЬНАЯ ПАНЕЛЬ: Сравнение двух подходов CEP
              </span>
            </div>
            <div
              class="grid grid-cols-1 md:grid-cols-2 gap-4"
              style="color: var(--fg-secondary)"
            >
              <div>
                <span style="color: var(--fg-primary)"
                  >CEP КОНВЕЙЕР (ДЗ-1+2):</span
                ><br />
                Показывает поток обработки заказов через 4 участка: генерация →
                ZIP → фильтр → повара
              </div>
              <div>
                <span style="color: var(--fg-primary)">ДЗ-3 СИНХРОНИЗАЦИЯ:</span
                ><br />
                Демонстрирует событийную архитектуру: API → ChangeLog → ZoneSync
                → UI обновления
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- CEP КОНВЕЙЕР (Левая половина) -->
            <div
              class="border p-3"
              style="
                background: var(--bg-secondary);
                border-color: var(--border-primary);
              "
            >
              <h4
                class="font-mono text-sm font-semibold mb-3 uppercase flex items-center"
                style="color: var(--state-informative)"
              >
                <Zap class="inline mr-2" :size="16" />
                CEP КОНВЕЙЕР
                <span class="ml-auto text-xs" style="color: var(--fg-tertiary)">
                  ПРИОРИТЕТНАЯ ОБРАБОТКА
                </span>
              </h4>

              <!-- Пояснение для CEP -->
              <div
                class="mb-3 p-2 border text-xs"
                style="
                  background: var(--bg-tertiary);
                  border-color: var(--border-tertiary);
                  color: var(--fg-secondary);
                "
              >
                <div class="flex items-center mb-1">
                  <Info class="inline mr-1" :size="10" />
                  <span class="font-semibold">Метрики конвейера:</span>
                </div>
                <div class="grid grid-cols-4 gap-1 text-xs">
                  <div>НОВЫЕ: в очереди</div>
                  <div>ZIP: объединяет</div>
                  <div>ГОТОВЯТ: работают</div>
                  <div>ГОТОВО: завершено</div>
                </div>
              </div>

              <div class="grid grid-cols-4 gap-2 text-xs font-mono mb-3">
                <div class="text-center">
                  <div
                    class="font-semibold text-lg"
                    :style="{
                      color:
                        queueSizes.newOrders > 0
                          ? 'var(--state-caution)'
                          : 'var(--fg-tertiary)',
                    }"
                  >
                    {{ queueSizes.newOrders }}
                  </div>
                  <div style="color: var(--fg-secondary)">НОВЫЕ</div>
                </div>
                <div class="text-center">
                  <div
                    class="font-semibold text-lg"
                    :style="{
                      color:
                        queueSizes.assignments > 0
                          ? 'var(--state-caution)'
                          : 'var(--fg-tertiary)',
                    }"
                  >
                    {{ queueSizes.assignments }}
                  </div>
                  <div style="color: var(--fg-secondary)">ZIP</div>
                </div>
                <div class="text-center">
                  <div
                    class="font-semibold text-lg"
                    :style="{
                      color:
                        queueSizes.pizzaCook + queueSizes.burgerCook > 0
                          ? 'var(--state-informative)'
                          : 'var(--fg-tertiary)',
                    }"
                  >
                    {{ queueSizes.pizzaCook + queueSizes.burgerCook }}
                  </div>
                  <div style="color: var(--fg-secondary)">ГОТОВЯТ</div>
                </div>
                <div class="text-center">
                  <div
                    class="font-semibold text-lg"
                    :style="{
                      color:
                        queueSizes.readyDishes > 0
                          ? 'var(--state-positive)'
                          : 'var(--fg-tertiary)',
                    }"
                  >
                    {{ queueSizes.readyDishes }}
                  </div>
                  <div style="color: var(--fg-secondary)">ГОТОВО</div>
                </div>
              </div>

              <div
                class="p-2 border text-xs font-mono"
                style="
                  background: var(--bg-tertiary);
                  border-color: var(--border-secondary);
                "
              >
                <div class="flex justify-between">
                  <span style="color: var(--fg-secondary)">ЭФФЕКТИВНОСТЬ:</span>
                  <span
                    class="font-semibold"
                    :style="{
                      color:
                        efficiency > 70
                          ? 'var(--state-positive)'
                          : efficiency > 40
                          ? 'var(--state-caution)'
                          : 'var(--state-critical)',
                    }"
                  >
                    {{ efficiency }}%
                  </span>
                </div>
                <div class="text-xs mt-1" style="color: var(--fg-tertiary)">
                  Готовые блюда / Общее время работы × 100
                </div>
              </div>
            </div>

            <!-- ДЗ-3 СИНХРОНИЗАЦИЯ (Правая половина) -->
            <div
              class="border p-3"
              style="
                background: var(--bg-secondary);
                border-color: var(--border-primary);
              "
            >
              <h4
                class="font-mono text-sm font-semibold mb-3 uppercase flex items-center"
                style="color: var(--state-positive)"
              >
                <Building2 class="inline mr-2" :size="16" />
                ДЗ-3 СИНХРОНИЗАЦИЯ
                <span class="ml-auto text-xs" style="color: var(--fg-tertiary)">
                  ЗОНАЛЬНАЯ СИСТЕМА
                </span>
              </h4>

              <!-- Пояснение для ДЗ-3 -->
              <div
                class="mb-3 p-2 border text-xs"
                style="
                  background: var(--bg-tertiary);
                  border-color: var(--border-tertiary);
                  color: var(--fg-secondary);
                "
              >
                <div class="flex items-center mb-1">
                  <Info class="inline mr-1" :size="10" />
                  <span class="font-semibold">Метрики зон:</span>
                </div>
                <div class="grid grid-cols-4 gap-1 text-xs">
                  <div>VIP: приоритет</div>
                  <div>ОБЫЧН: стандарт</div>
                  <div>ОЧЕРЕДЬ: ожидают</div>
                  <div>ЗАГРУЗ: занятость</div>
                </div>
              </div>

              <div class="grid grid-cols-4 gap-2 text-xs font-mono mb-3">
                <div class="text-center">
                  <div
                    class="font-semibold text-lg"
                    :style="{
                      color:
                        restaurantSyncStats.vipOrders > 0
                          ? 'var(--state-caution)'
                          : 'var(--fg-tertiary)',
                    }"
                  >
                    {{ restaurantSyncStats.vipOrders }}
                  </div>
                  <div style="color: var(--fg-secondary)">VIP</div>
                </div>
                <div class="text-center">
                  <div
                    class="font-semibold text-lg"
                    :style="{
                      color:
                        restaurantSyncStats.totalOrders -
                          restaurantSyncStats.vipOrders >
                        0
                          ? 'var(--state-informative)'
                          : 'var(--fg-tertiary)',
                    }"
                  >
                    {{
                      restaurantSyncStats.totalOrders -
                      restaurantSyncStats.vipOrders
                    }}
                  </div>
                  <div style="color: var(--fg-secondary)">ОБЫЧН</div>
                </div>
                <div class="text-center">
                  <div
                    class="font-semibold text-lg"
                    :style="{
                      color:
                        (restaurantSyncStats.vipQueueLength || 0) +
                          (restaurantSyncStats.regularQueueLength || 0) >
                        0
                          ? 'var(--state-critical)'
                          : 'var(--fg-tertiary)',
                    }"
                  >
                    {{
                      (restaurantSyncStats.vipQueueLength || 0) +
                      (restaurantSyncStats.regularQueueLength || 0)
                    }}
                  </div>
                  <div style="color: var(--fg-secondary)">ОЧЕРЕДЬ</div>
                </div>
                <div class="text-center">
                  <div
                    class="font-semibold text-lg"
                    :style="{
                      color:
                        restaurantSyncStats.zonesOccupancy > 80
                          ? 'var(--state-critical)'
                          : restaurantSyncStats.zonesOccupancy > 50
                          ? 'var(--state-caution)'
                          : 'var(--state-positive)',
                    }"
                  >
                    {{ restaurantSyncStats.zonesOccupancy }}%
                  </div>
                  <div style="color: var(--fg-secondary)">ЗАГРУЗ</div>
                </div>
              </div>

              <div
                class="p-2 border text-xs font-mono"
                style="
                  background: var(--bg-tertiary);
                  border-color: var(--border-secondary);
                "
              >
                <div class="flex justify-between">
                  <span style="color: var(--fg-secondary)">СОБЫТИЙ:</span>
                  <span class="font-semibold" style="color: var(--fg-primary)">
                    {{ restaurantSyncStats.eventsLogged }}
                  </span>
                </div>
                <div class="text-xs mt-1" style="color: var(--fg-tertiary)">
                  Записано в ChangeLog для синхронизации
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CEP КОНВЕЙЕР НА ВСЕЙ ШИРИНЕ -->
      <section>
        <div
          class="border p-4"
          style="
            background: var(--bg-primary);
            border-color: var(--border-secondary);
          "
        >
          <h3
            class="text-lg font-semibold font-mono tracking-wide uppercase mb-4"
            style="color: var(--fg-primary)"
          >
            <GitBranch class="inline mr-2" :size="20" />
            CEP КОНВЕЙЕР ОБРАБОТКИ
          </h3>

          <!-- Образовательное пояснение конвейера -->
          <div
            class="mb-6 p-4 border"
            style="
              background: var(--bg-secondary);
              border-color: var(--border-primary);
            "
          >
            <div class="flex items-center mb-3">
              <GraduationCap
                class="inline mr-2"
                :size="16"
                style="color: var(--state-informative)"
              />
              <span
                class="font-semibold font-mono text-sm"
                style="color: var(--fg-primary)"
              >
                УЧАСТКИ КОНВЕЙЕРА ИЗ ДЗ-1: 4 ПРОЦЕССОРА, 5 ОЧЕРЕДЕЙ
              </span>
            </div>
            <div
              class="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono"
              style="color: var(--fg-secondary)"
            >
              <div>
                <div class="flex items-center mb-1">
                  <ClipboardList
                    class="inline mr-1"
                    :size="12"
                    style="color: var(--state-caution)"
                  />
                  <span class="font-semibold" style="color: var(--fg-primary)"
                    >ГЕНЕРАТОР:</span
                  >
                </div>
                <div>Создает заказы каждые 1-3 сек. Числа: 1, 2, 3, 4...</div>
              </div>
              <div>
                <div class="flex items-center mb-1">
                  <GitBranch
                    class="inline mr-1"
                    :size="12"
                    style="color: var(--state-caution)"
                  />
                  <span class="font-semibold" style="color: var(--fg-primary)"
                    >ZIP:</span
                  >
                </div>
                <div>
                  Ждет заказ И свободного повара. Объединяет в назначение.
                </div>
              </div>
              <div>
                <div class="flex items-center mb-1">
                  <Filter
                    class="inline mr-1"
                    :size="12"
                    style="color: var(--state-informative)"
                  />
                  <span class="font-semibold" style="color: var(--fg-primary)"
                    >ФИЛЬТР:</span
                  >
                </div>
                <div>
                  Четные заказы → пицца, нечетные → бургеры. Распределение.
                </div>
              </div>
              <div>
                <div class="flex items-center mb-1">
                  <Users
                    class="inline mr-1"
                    :size="12"
                    style="color: var(--state-positive)"
                  />
                  <span class="font-semibold" style="color: var(--fg-primary)"
                    >ПОВАРА:</span
                  >
                </div>
                <div>
                  Готовят 1-3 сек. Результат = заказ × 2. Возвращаются в пул.
                </div>
              </div>
            </div>
          </div>

          <!-- Горизонтальный пайплайн -->
          <div
            class="flex items-center justify-between gap-4 overflow-x-auto mb-6"
          >
            <!-- 1. Генератор -->
            <div class="flex-shrink-0 text-center min-w-[100px]">
              <div
                class="border p-3 mb-2"
                :style="{
                  background:
                    queueSizes.newOrders > 0
                      ? 'var(--state-caution-bg)'
                      : 'var(--bg-secondary)',
                  borderColor:
                    queueSizes.newOrders > 0
                      ? 'var(--state-caution-border)'
                      : 'var(--border-secondary)',
                }"
              >
                <ClipboardList
                  :size="20"
                  class="mx-auto mb-1"
                  style="color: var(--state-caution)"
                />
                <div
                  class="font-mono text-lg font-semibold"
                  style="color: var(--fg-primary)"
                >
                  {{ queueSizes.newOrders }}
                </div>
              </div>
              <div
                class="font-mono text-xs uppercase"
                style="color: var(--fg-secondary)"
              >
                ГЕНЕРАТОР
              </div>
              <div class="font-mono text-xs" style="color: var(--fg-tertiary)">
                События клиентов
              </div>
            </div>

            <ChevronRight
              :size="16"
              :class="isRunning ? 'animate-pulse' : ''"
              style="color: var(--fg-secondary)"
            />

            <!-- 2. ZIP -->
            <div class="flex-shrink-0 text-center min-w-[100px]">
              <div
                class="border p-3 mb-2"
                :style="{
                  background:
                    queueSizes.assignments > 0
                      ? 'var(--state-caution-bg)'
                      : 'var(--bg-secondary)',
                  borderColor:
                    queueSizes.assignments > 0
                      ? 'var(--state-caution-border)'
                      : 'var(--border-secondary)',
                }"
              >
                <GitBranch
                  :size="20"
                  class="mx-auto mb-1"
                  style="color: var(--state-caution)"
                />
                <div
                  class="font-mono text-lg font-semibold"
                  style="color: var(--fg-primary)"
                >
                  {{ queueSizes.assignments }}
                </div>
              </div>
              <div
                class="font-mono text-xs uppercase"
                style="color: var(--fg-secondary)"
              >
                ZIP ДИСПЕТЧЕР
              </div>
              <div class="font-mono text-xs" style="color: var(--fg-tertiary)">
                Заказы ↔ Повара
              </div>
            </div>

            <ChevronRight
              :size="16"
              :class="isRunning ? 'animate-pulse' : ''"
              style="color: var(--fg-secondary)"
            />

            <!-- 3. Фильтр (два повара) -->
            <div class="flex-shrink-0">
              <div class="grid grid-cols-2 gap-2">
                <!-- Повар пиццы -->
                <div class="text-center min-w-[80px]">
                  <div
                    class="border p-2 mb-1"
                    :style="{
                      background:
                        queueSizes.pizzaCook > 0
                          ? 'var(--state-informative-bg)'
                          : 'var(--bg-secondary)',
                      borderColor:
                        queueSizes.pizzaCook > 0
                          ? 'var(--state-informative-border)'
                          : 'var(--border-secondary)',
                    }"
                  >
                    <Pizza
                      :size="16"
                      class="mx-auto mb-1"
                      style="color: var(--state-informative)"
                    />
                    <div
                      class="font-mono text-sm font-semibold"
                      style="color: var(--fg-primary)"
                    >
                      {{ queueSizes.pizzaCook }}
                    </div>
                  </div>
                  <div
                    class="font-mono text-xs"
                    style="color: var(--fg-secondary)"
                  >
                    ПИЦЦА
                  </div>
                </div>
                <!-- Повар бургеров -->
                <div class="text-center min-w-[80px]">
                  <div
                    class="border p-2 mb-1"
                    :style="{
                      background:
                        queueSizes.burgerCook > 0
                          ? 'var(--state-critical-bg)'
                          : 'var(--bg-secondary)',
                      borderColor:
                        queueSizes.burgerCook > 0
                          ? 'var(--state-critical-border)'
                          : 'var(--border-secondary)',
                    }"
                  >
                    <Beef
                      :size="16"
                      class="mx-auto mb-1"
                      style="color: var(--state-critical)"
                    />
                    <div
                      class="font-mono text-sm font-semibold"
                      style="color: var(--fg-primary)"
                    >
                      {{ queueSizes.burgerCook }}
                    </div>
                  </div>
                  <div
                    class="font-mono text-xs"
                    style="color: var(--fg-secondary)"
                  >
                    БУРГЕР
                  </div>
                </div>
              </div>
              <div
                class="font-mono text-xs text-center mt-1"
                style="color: var(--fg-tertiary)"
              >
                Фильтр по типу
              </div>
            </div>

            <ChevronRight
              :size="16"
              :class="isRunning ? 'animate-pulse' : ''"
              style="color: var(--fg-secondary)"
            />

            <!-- 4. Результат -->
            <div class="flex-shrink-0 text-center min-w-[100px]">
              <div
                class="border p-3 mb-2"
                :style="{
                  background:
                    queueSizes.readyDishes > 0
                      ? 'var(--state-positive-bg)'
                      : 'var(--bg-secondary)',
                  borderColor:
                    queueSizes.readyDishes > 0
                      ? 'var(--state-positive-border)'
                      : 'var(--border-secondary)',
                }"
              >
                <CheckCircle
                  :size="20"
                  class="mx-auto mb-1"
                  style="color: var(--state-positive)"
                />
                <div
                  class="font-mono text-lg font-semibold"
                  style="color: var(--fg-primary)"
                >
                  {{ queueSizes.readyDishes }}
                </div>
              </div>
              <div
                class="font-mono text-xs uppercase"
                style="color: var(--fg-secondary)"
              >
                ГОТОВЫЕ БЛЮДА
              </div>
              <div class="font-mono text-xs" style="color: var(--fg-tertiary)">
                Завершенные
              </div>
            </div>
          </div>

          <!-- Принципы CEP под конвейером -->
          <div
            class="p-3 border"
            style="
              background: var(--bg-secondary);
              border-color: var(--border-primary);
            "
          >
            <h4
              class="font-mono text-xs font-semibold mb-2 uppercase"
              style="color: var(--fg-primary)"
            >
              <Lightbulb class="inline mr-1" :size="12" />
              ПРИНЦИПЫ CEP В ДЕЙСТВИИ:
            </h4>
            <div
              class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono"
            >
              <div>
                <span style="color: var(--state-informative)">
                  <RotateCcw class="inline mr-1" :size="10" />
                  ИММУТАБЕЛЬНОСТЬ: </span
                ><br />
                <span style="color: var(--fg-tertiary)"
                  >События неизменяемы</span
                >
              </div>
              <div>
                <span style="color: var(--state-caution)">
                  <Clock class="inline mr-1" :size="10" />
                  ПОРЯДОК: </span
                ><br />
                <span style="color: var(--fg-tertiary)"
                  >Хронологическая обработка</span
                >
              </div>
              <div>
                <span style="color: var(--state-positive)">
                  <Target class="inline mr-1" :size="10" />
                  РЕАКТИВНОСТЬ: </span
                ><br />
                <span style="color: var(--fg-tertiary)"
                  >Мгновенная реакция</span
                >
              </div>
              <div>
                <span style="color: var(--state-critical)">
                  <Link class="inline mr-1" :size="10" />
                  КОМПОЗИЦИЯ: </span
                ><br />
                <span style="color: var(--fg-tertiary)">Простые операторы</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ОСНОВНОЙ КОНТЕНТ: ЗОНЫ + КОНВЕЙЕР -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- ЛЕВАЯ КОЛОНКА: ЗОНЫ И АРХИТЕКТУРА (2/3 ширины) -->
        <div class="xl:col-span-2">
          <!-- ЗОНЫ РЕСТОРАНА -->
          <section>
            <div
              class="border p-4 h-full"
              style="
                background: var(--bg-primary);
                border-color: var(--border-secondary);
              "
            >
              <div class="flex items-center justify-between mb-4">
                <h3
                  class="text-lg font-semibold font-mono tracking-wide uppercase"
                  style="color: var(--fg-primary)"
                >
                  <Building2 class="inline mr-2" :size="20" />
                  ДЗ-3: СОБЫТИЙНЫЕ ЗОНЫ
                </h3>
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2"
                    :class="restaurantSyncActive ? 'animate-pulse' : ''"
                    :style="{
                      backgroundColor: restaurantSyncActive
                        ? 'var(--state-positive)'
                        : 'var(--fg-tertiary)',
                    }"
                  ></div>
                  <span
                    class="text-xs font-mono uppercase"
                    style="color: var(--fg-secondary)"
                  >
                    {{ restaurantSyncActive ? "АКТИВНА" : "ОСТАНОВЛЕНА" }}
                  </span>
                </div>
              </div>

              <!-- Архитектура событийной цепочки (компактная) -->
              <div
                v-if="restaurantSyncActive"
                class="mb-4 p-3 border"
                style="
                  background: var(--bg-secondary);
                  border-color: var(--border-primary);
                "
              >
                <h4
                  class="font-mono text-xs font-semibold mb-2 uppercase"
                  style="color: var(--state-informative)"
                >
                  <GitBranch class="inline mr-1" :size="12" />
                  АРХИТЕКТУРА СОБЫТИЙНОЙ ЦЕПОЧКИ:
                </h4>

                <!-- Образовательное пояснение архитектуры -->
                <div
                  class="mb-3 p-2 border text-xs"
                  style="
                    background: var(--bg-tertiary);
                    border-color: var(--border-tertiary);
                    color: var(--fg-secondary);
                  "
                >
                  <div class="flex items-center mb-1">
                    <Info class="inline mr-1" :size="10" />
                    <span class="font-semibold">Компоненты ДЗ-3:</span>
                  </div>
                  <div class="grid grid-cols-3 gap-2 text-xs">
                    <div><strong>API:</strong> Управление заказами</div>
                    <div><strong>LOG:</strong> Журнал событий</div>
                    <div><strong>SYNC:</strong> Синхронизация зон</div>
                  </div>
                </div>

                <div
                  class="flex items-center justify-between text-xs font-mono"
                >
                  <div class="text-center">
                    <Database
                      :size="16"
                      style="color: var(--state-informative)"
                      class="mx-auto mb-1"
                    />
                    <div style="color: var(--fg-primary)">API</div>
                    <div style="color: var(--fg-tertiary)">
                      {{ restaurantOrders.length }}
                    </div>
                    <div class="text-xs mt-1" style="color: var(--fg-tertiary)">
                      заказов
                    </div>
                  </div>
                  <ChevronRight
                    :size="12"
                    style="color: var(--fg-tertiary)"
                    :class="restaurantSyncActive ? 'animate-pulse' : ''"
                  />
                  <div class="text-center">
                    <ScrollText
                      :size="16"
                      style="color: var(--state-caution)"
                      class="mx-auto mb-1"
                    />
                    <div style="color: var(--fg-primary)">LOG</div>
                    <div style="color: var(--fg-tertiary)">
                      {{ restaurantEvents.length }}
                    </div>
                    <div class="text-xs mt-1" style="color: var(--fg-tertiary)">
                      событий
                    </div>
                  </div>
                  <ChevronRight
                    :size="12"
                    style="color: var(--fg-tertiary)"
                    :class="restaurantSyncActive ? 'animate-pulse' : ''"
                  />
                  <div class="text-center">
                    <Building2
                      :size="16"
                      style="color: var(--state-positive)"
                      class="mx-auto mb-1"
                    />
                    <div style="color: var(--fg-primary)">SYNC</div>
                    <div style="color: var(--fg-tertiary)">
                      {{ restaurantSyncStats.zonesOccupancy }}%
                    </div>
                    <div class="text-xs mt-1" style="color: var(--fg-tertiary)">
                      загрузка
                    </div>
                  </div>
                </div>
              </div>

              <!-- Компонент зон -->
              <RestaurantZoneVisualizer
                v-if="restaurantSyncActive && restaurantZones"
                :vip-zone="restaurantZones.vipZone"
                :regular-zone="restaurantZones.regularZone"
                :recent-events="restaurantEvents"
                :statistics="restaurantSyncStats"
              />

              <!-- Placeholder -->
              <div
                v-else
                class="text-center py-8"
                style="color: var(--fg-tertiary)"
              >
                <Building2 :size="32" class="mx-auto mb-2" />
                <p class="font-mono text-xs uppercase">
                  СИСТЕМА СИНХРОНИЗАЦИИ ЗОН ОСТАНОВЛЕНА
                </p>
              </div>
            </div>
          </section>
        </div>

        <!-- ПРАВАЯ КОЛОНКА: АКТИВНЫЕ ЗАКАЗЫ И МЕТРИКИ (1/3 ширины) -->
        <div class="space-y-6 h-full">
          <!-- Компактные метрики -->
          <section>
            <div
              class="border p-4"
              style="
                background: var(--bg-primary);
                border-color: var(--border-secondary);
              "
            >
              <h3
                class="text-sm font-semibold font-mono tracking-wide uppercase mb-3"
                style="color: var(--fg-primary)"
              >
                <BarChart3 class="inline mr-2" :size="16" />
                КЛЮЧЕВЫЕ МЕТРИКИ
              </h3>

              <div class="space-y-3">
                <!-- Эффективность -->
                <div class="flex items-center justify-between">
                  <span
                    class="font-mono text-xs"
                    style="color: var(--fg-secondary)"
                  >
                    ЭФФЕКТИВНОСТЬ:
                  </span>
                  <span
                    class="font-mono text-sm font-semibold"
                    :style="{
                      color:
                        efficiency > 70
                          ? 'var(--state-positive)'
                          : efficiency > 40
                          ? 'var(--state-caution)'
                          : 'var(--state-critical)',
                    }"
                  >
                    {{ efficiency }}%
                  </span>
                </div>

                <!-- Всего заказов -->
                <div class="flex items-center justify-between">
                  <span
                    class="font-mono text-xs"
                    style="color: var(--fg-secondary)"
                  >
                    ВСЕГО ЗАКАЗОВ:
                  </span>
                  <span
                    class="font-mono text-sm font-semibold"
                    style="color: var(--fg-primary)"
                  >
                    {{ stats.ordersReceived }}
                  </span>
                </div>

                <!-- Готовые блюда -->
                <div class="flex items-center justify-between">
                  <span
                    class="font-mono text-xs"
                    style="color: var(--fg-secondary)"
                  >
                    ГОТОВЫЕ БЛЮДА:
                  </span>
                  <span
                    class="font-mono text-sm font-semibold"
                    style="color: var(--state-positive)"
                  >
                    {{ stats.dishesCompleted }}
                  </span>
                </div>

                <!-- Загрузка зон -->
                <div class="flex items-center justify-between">
                  <span
                    class="font-mono text-xs"
                    style="color: var(--fg-secondary)"
                  >
                    ЗАГРУЗКА ЗОН:
                  </span>
                  <span
                    class="font-mono text-sm font-semibold"
                    :style="{
                      color:
                        restaurantSyncStats.zonesOccupancy > 80
                          ? 'var(--state-critical)'
                          : restaurantSyncStats.zonesOccupancy > 50
                          ? 'var(--state-caution)'
                          : 'var(--state-positive)',
                    }"
                  >
                    {{ restaurantSyncStats.zonesOccupancy }}%
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Активные заказы -->
          <section>
            <div
              class="border p-4"
              style="
                background: var(--bg-primary);
                border-color: var(--border-secondary);
              "
            >
              <h3
                class="text-sm font-semibold font-mono tracking-wide uppercase mb-3"
                style="color: var(--fg-primary)"
              >
                <UtensilsCrossed class="inline mr-2" :size="16" />
                АКТИВНЫЕ ЗАКАЗЫ
              </h3>

              <div class="space-y-4">
                <!-- Повар пиццы -->
                <div v-if="currentOrders.pizzaOrders.length > 0">
                  <h4
                    class="font-mono text-xs font-semibold mb-2 uppercase flex items-center gap-2"
                    style="color: var(--state-informative)"
                  >
                    <Pizza :size="12" />
                    ПОВАР ПИЦЦЫ ({{ currentOrders.pizzaOrders.length }})
                  </h4>
                  <div
                    class="space-y-2 max-h-32 overflow-y-auto custom-scrollbar"
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
                      ...и еще {{ currentOrders.pizzaOrders.length - 2 }}
                    </div>
                  </div>
                </div>

                <!-- Повар бургеров -->
                <div v-if="currentOrders.burgerOrders.length > 0">
                  <h4
                    class="font-mono text-xs font-semibold mb-2 uppercase flex items-center gap-2"
                    style="color: var(--state-critical)"
                  >
                    <Beef :size="12" />
                    ПОВАР БУРГЕРОВ ({{ currentOrders.burgerOrders.length }})
                  </h4>
                  <div
                    class="space-y-2 max-h-32 overflow-y-auto custom-scrollbar"
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
                      ...и еще {{ currentOrders.burgerOrders.length - 2 }}
                    </div>
                  </div>
                </div>

                <!-- Пустое состояние -->
                <div
                  v-if="
                    !isRunning &&
                    currentOrders.pizzaOrders.length === 0 &&
                    currentOrders.burgerOrders.length === 0
                  "
                  class="text-center py-6"
                  style="color: var(--fg-tertiary)"
                >
                  <UtensilsCrossed :size="32" class="mx-auto mb-2" />
                  <p class="font-mono text-xs uppercase">
                    НЕТ АКТИВНЫХ ЗАКАЗОВ
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- Статистика событий и последние события -->
          <section v-if="restaurantSyncActive">
            <div
              class="border p-4"
              style="
                background: var(--bg-primary);
                border-color: var(--border-secondary);
              "
            >
              <h3
                class="text-sm font-semibold font-mono tracking-wide uppercase mb-3"
                style="color: var(--fg-primary)"
              >
                <ScrollText class="inline mr-2" :size="16" />
                СОБЫТИЯ ДЗ-3
              </h3>

              <!-- Статистика событий -->
              <div class="space-y-2 mb-4">
                <div class="flex items-center justify-between">
                  <span
                    class="font-mono text-xs"
                    style="color: var(--fg-secondary)"
                  >
                    ВСЕГО ЗАКАЗОВ:
                  </span>
                  <span
                    class="font-mono text-sm font-semibold"
                    style="color: var(--fg-primary)"
                  >
                    {{ restaurantSyncStats.totalOrders }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span
                    class="font-mono text-xs"
                    style="color: var(--fg-secondary)"
                  >
                    ВСЕГО СОБЫТИЙ:
                  </span>
                  <span
                    class="font-mono text-sm font-semibold"
                    style="color: var(--fg-primary)"
                  >
                    {{ restaurantSyncStats.eventsLogged }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span
                    class="font-mono text-xs"
                    style="color: var(--fg-secondary)"
                  >
                    VIP ЗАКАЗЫ:
                  </span>
                  <span
                    class="font-mono text-sm font-semibold"
                    style="color: var(--state-caution)"
                  >
                    {{ restaurantSyncStats.vipOrders }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span
                    class="font-mono text-xs"
                    style="color: var(--fg-secondary)"
                  >
                    ЗАВЕРШЕНО:
                  </span>
                  <span
                    class="font-mono text-sm font-semibold"
                    style="color: var(--state-positive)"
                  >
                    {{ restaurantSyncStats.completedOrders }}
                  </span>
                </div>
              </div>

              <!-- Последние события -->
              <div
                class="border-t pt-3"
                style="border-color: var(--border-secondary)"
              >
                <h4
                  class="font-mono text-xs font-semibold mb-2 uppercase"
                  style="color: var(--fg-secondary)"
                >
                  ПОСЛЕДНИЕ СОБЫТИЯ:
                </h4>
                <div
                  class="space-y-1 max-h-24 overflow-y-auto custom-scrollbar"
                >
                  <div
                    v-for="event in restaurantEvents.slice(0, 3)"
                    :key="`event-${event.eventId}-${event.timestamp.getTime()}`"
                    class="flex items-center gap-2 text-xs font-mono"
                  >
                    <span style="color: var(--fg-tertiary)">
                      {{ formatEventTime(event.timestamp) }}
                    </span>
                    <span
                      :style="{
                        color:
                          event.type === 'order_added'
                            ? 'var(--state-informative)'
                            : event.type === 'order_modified' ||
                              event.type === 'status_changed'
                            ? 'var(--state-caution)'
                            : 'var(--state-positive)',
                      }"
                    >
                      {{ getEventTypeLabel(event.type) }}
                    </span>
                    <span
                      style="color: var(--fg-secondary)"
                      class="flex-1 truncate"
                    >
                      {{ getEventDescription(event) }}
                    </span>
                  </div>
                  <div
                    v-if="restaurantEvents.length === 0"
                    class="text-center text-xs font-mono"
                    style="color: var(--fg-tertiary)"
                  >
                    Нет событий
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ПОЛНЫЕ ЛОГИ ОБЕИХ СИСТЕМ -->
          <section v-if="isRunning">
            <div
              class="border p-4"
              style="
                background: var(--bg-primary);
                border-color: var(--border-secondary);
              "
            >
              <h3
                class="text-sm font-semibold font-mono tracking-wide uppercase mb-3"
                style="color: var(--fg-primary)"
              >
                <FileText class="inline mr-2" :size="16" />
                ПОЛНЫЕ ЛОГИ СИСТЕМ
              </h3>

              <!-- Переключатель между логами -->
              <div class="flex gap-2 mb-4">
                <button
                  @click="activeLogView = 'cep'"
                  class="px-3 py-1 text-xs font-mono border transition-minimal"
                  :class="
                    activeLogView === 'cep' ? 'opacity-100' : 'opacity-50'
                  "
                  :style="{
                    background:
                      activeLogView === 'cep'
                        ? 'var(--state-informative-bg)'
                        : 'var(--bg-secondary)',
                    borderColor:
                      activeLogView === 'cep'
                        ? 'var(--state-informative-border)'
                        : 'var(--border-secondary)',
                    color: 'var(--fg-primary)',
                  }"
                >
                  <Zap class="inline mr-1" :size="10" />
                  CEP КОНВЕЙЕР
                </button>
                <button
                  @click="activeLogView = 'restaurant'"
                  class="px-3 py-1 text-xs font-mono border transition-minimal"
                  :class="
                    activeLogView === 'restaurant'
                      ? 'opacity-100'
                      : 'opacity-50'
                  "
                  :style="{
                    background:
                      activeLogView === 'restaurant'
                        ? 'var(--state-positive-bg)'
                        : 'var(--bg-secondary)',
                    borderColor:
                      activeLogView === 'restaurant'
                        ? 'var(--state-positive-border)'
                        : 'var(--border-secondary)',
                    color: 'var(--fg-primary)',
                  }"
                >
                  <Building2 class="inline mr-1" :size="10" />
                  РЕСТОРАН ДЗ-3
                </button>
              </div>

              <!-- Лог CEP конвейера -->
              <div v-if="activeLogView === 'cep'" class="space-y-2">
                <div class="flex items-center gap-2 mb-2">
                  <Zap :size="14" style="color: var(--state-informative)" />
                  <span
                    class="font-mono text-xs font-semibold"
                    style="color: var(--fg-primary)"
                  >
                    СОБЫТИЯ CEP КОНВЕЙЕРА (ДЗ-1+2):
                  </span>
                </div>
                <div
                  class="max-h-32 overflow-y-auto custom-scrollbar space-y-1 p-2 border"
                  style="
                    background: var(--bg-secondary);
                    border-color: var(--border-secondary);
                  "
                >
                  <div
                    v-for="(logEntry, index) in cepEventLog.slice(-10)"
                    :key="`cep-${index}`"
                    class="flex items-start gap-2 text-xs font-mono"
                  >
                    <span
                      style="color: var(--fg-tertiary)"
                      class="flex-shrink-0"
                    >
                      {{ formatLogTime(logEntry.timestamp) }}
                    </span>
                    <span class="flex-shrink-0">{{ logEntry.icon }}</span>
                    <span
                      :style="{
                        color: getLogColor(logEntry.type),
                      }"
                      class="flex-shrink-0"
                    >
                      {{ logEntry.type.toUpperCase() }}:
                    </span>
                    <span style="color: var(--fg-secondary)" class="flex-1">
                      {{ logEntry.message }}
                    </span>
                    <span
                      v-if="logEntry.data"
                      style="color: var(--fg-tertiary)"
                      class="flex-shrink-0"
                    >
                      {{ logEntry.data }}
                    </span>
                  </div>
                  <div
                    v-if="cepEventLog.length === 0"
                    class="text-center text-xs font-mono py-4"
                    style="color: var(--fg-tertiary)"
                  >
                    Нет событий CEP конвейера
                  </div>
                </div>
              </div>

              <!-- Лог ресторанных событий -->
              <div v-if="activeLogView === 'restaurant'" class="space-y-2">
                <div class="flex items-center gap-2 mb-2">
                  <Building2 :size="14" style="color: var(--state-positive)" />
                  <span
                    class="font-mono text-xs font-semibold"
                    style="color: var(--fg-primary)"
                  >
                    СОБЫТИЯ РЕСТОРАНА (ДЗ-3):
                  </span>
                </div>
                <div
                  class="max-h-32 overflow-y-auto custom-scrollbar space-y-1 p-2 border"
                  style="
                    background: var(--bg-secondary);
                    border-color: var(--border-secondary);
                  "
                >
                  <div
                    v-for="event in restaurantEvents.slice(-10)"
                    :key="`restaurant-${event.eventId}`"
                    class="flex items-start gap-2 text-xs font-mono"
                  >
                    <span
                      style="color: var(--fg-tertiary)"
                      class="flex-shrink-0"
                    >
                      {{ formatLogTime(event.timestamp) }}
                    </span>
                    <span
                      :style="{
                        color: getRestaurantEventColor(event.type),
                      }"
                      class="flex-shrink-0"
                    >
                      {{ event.type.toUpperCase() }}:
                    </span>
                    <span style="color: var(--fg-secondary)" class="flex-1">
                      {{ getFullEventDescription(event) }}
                    </span>
                  </div>
                  <div
                    v-if="restaurantEvents.length === 0"
                    class="text-center text-xs font-mono py-4"
                    style="color: var(--fg-tertiary)"
                  >
                    Нет событий ресторана
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Статус системы -->
          <section>
            <div
              class="border p-4"
              style="
                background: var(--bg-primary);
                border-color: var(--border-secondary);
              "
            >
              <div class="flex items-center justify-between mb-2">
                <h3
                  class="text-sm font-semibold font-mono tracking-wide uppercase"
                  style="color: var(--fg-primary)"
                >
                  СТАТУС СИСТЕМЫ
                </h3>
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2"
                    :class="isRunning ? 'animate-pulse' : ''"
                    :style="{
                      backgroundColor: isRunning
                        ? 'var(--state-positive)'
                        : 'var(--fg-tertiary)',
                    }"
                  ></div>
                  <span
                    class="text-xs font-mono uppercase"
                    style="color: var(--fg-secondary)"
                  >
                    {{ isRunning ? "АКТИВЕН" : "ОСТАНОВЛЕН" }}
                  </span>
                </div>
              </div>

              <div class="space-y-2 text-xs font-mono">
                <div>
                  <span style="color: var(--fg-secondary)">АРХИТЕКТУРА:</span
                  ><br />
                  <span style="color: var(--fg-tertiary)">
                    Producer → ZIP → Filter → Workers
                  </span>
                </div>
                <div>
                  <span style="color: var(--fg-secondary)">ПРИНЦИПЫ:</span
                  ><br />
                  <span style="color: var(--fg-tertiary)">
                    Low Latency • Event Ordering • Stream Processing
                  </span>
                </div>
                <div v-if="restaurantSyncActive">
                  <span style="color: var(--fg-secondary)">ДЗ-3 ЦЕПОЧКА:</span
                  ><br />
                  <span style="color: var(--fg-tertiary)">
                    API → ChangeLog → ZoneSync → Буферы
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onUnmounted } from "vue";
import { useRestaurantVisualizer } from "../composables/useRestaurantVisualizer";
import { useRestaurantSync } from "../composables/useRestaurantSync";
import { setGlobalEventLogger } from "../../WorkloadBalancing/services/workloadProcessors";


import RestaurantOrderCard from "./RestaurantOrderCard.vue";
import RestaurantZoneVisualizer from "./RestaurantZoneVisualizer.vue";

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
  ChevronRight,
  ScrollText,
  Lightbulb,
  RotateCcw,
  Clock,
  Link,
  Info,
  GraduationCap,
  Users,
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

// Композабл системы ресторана с приоритетными заказами (старая система)
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

// Новая система ДЗ-3 с событийной синхронизацией
const {
  isActive: restaurantSyncActive,
  zones: restaurantZones,
  recentEvents: restaurantEvents,
  activeOrders: restaurantOrders,
  statistics: restaurantSyncStats,
  startRestaurant: startRestaurantSync,
  stopRestaurant: stopRestaurantSync,
  createManualOrder,
  clearRestaurant,
} = useRestaurantSync();

// Алиасы для удобности
const stats = restaurantStats;
const efficiency = kitchenEfficiency;

// Состояние логов
const activeLogView = ref<"cep" | "restaurant">("cep");
const cepEventLog = ref<
  Array<{
    timestamp: Date;
    type: string;
    icon: string;
    message: string;
    data?: string;
  }>
>([]);

// Управление темой
function toggleTheme() {
  isDark.value = !isDark.value;
  document.documentElement.setAttribute(
    "data-theme",
    isDark.value ? "dark" : "light"
  );
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
}

// Управление рестораном (объединенное)
const start = () => {
  // Настраиваем глобальный логгер для событий CEP
  setGlobalEventLogger(
    (type: string, icon: string, message: string, data?: string) => {
      // Добавляем событие в лог CEP
      const logEntry: {
        timestamp: Date;
        type: string;
        icon: string;
        message: string;
        data?: string;
      } = {
        timestamp: new Date(),
        type,
        icon,
        message,
      };

      if (data) {
        logEntry.data = data;
      }

      cepEventLog.value.push(logEntry);

      // Ограничиваем размер лога
      if (cepEventLog.value.length > 100) {
        cepEventLog.value = cepEventLog.value.slice(-50);
      }

      console.log(
        `[${type.toUpperCase()}] ${message}`,
        data ? `- ${data}` : ""
      );
    }
  );

  // Запускаем старую систему CEP
  openRestaurant();

  // Запускаем новую систему ДЗ-3
  startRestaurantSync();
};

const stop = () => {
  // Останавливаем обе системы
  closeRestaurant();
  stopRestaurantSync();

  // Очищаем лог CEP
  cepEventLog.value = [];
};

function getStatusDescription(): string {
  return getRestaurantStatusDescription();
}

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
 * Получение понятного названия типа события
 */
function getEventTypeLabel(eventType: string): string {
  switch (eventType) {
    case "order_added":
      return "ЗАКАЗ";
    case "order_modified":
      return "СТАТУС";
    case "status_changed":
      return "СТАТУС";
    case "order_removed":
      return "УДАЛЕН";
    default:
      return eventType.toUpperCase();
  }
}

/**
 * Получение описания события
 */
function getEventDescription(event: any): string {
  if (!event) return "—";

  // Формируем описание на основе типа события
  let description = `#${event.orderId}`;

  // Добавляем информацию о VIP статусе если есть
  if (event.data && typeof event.data === "object") {
    try {
      const eventData =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      if (eventData.isVipCustomer) {
        description += " (VIP)";
      }
      if (eventData.newStatus) {
        description += ` → ${eventData.newStatus.toUpperCase()}`;
      }
      if (eventData.dishDescription) {
        description += ` - ${eventData.dishDescription}`;
      }
    } catch (e) {
      // Если не удается распарсить данные, показываем базовую информацию
    }
  }

  return description;
}

/**
 * Форматирование времени для логов
 */
function formatLogTime(timestamp: Date): string {
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
 * Получение цвета для типа события CEP
 */
function getLogColor(eventType: string): string {
  switch (eventType) {
    case "order":
      return "var(--state-informative)";
    case "assignment":
      return "var(--state-caution)";
    case "cooking":
      return "var(--state-critical)";
    case "complete":
      return "var(--state-positive)";
    case "system":
      return "var(--fg-secondary)";
    default:
      return "var(--fg-primary)";
  }
}

/**
 * Получение цвета для событий ресторана
 */
function getRestaurantEventColor(eventType: string): string {
  switch (eventType) {
    case "order_added":
      return "var(--state-informative)";
    case "order_modified":
    case "status_changed":
      return "var(--state-caution)";
    case "order_removed":
      return "var(--state-critical)";
    default:
      return "var(--fg-primary)";
  }
}

/**
 * Полное описание события ресторана
 */
function getFullEventDescription(event: any): string {
  if (!event) return "—";

  let description = `Заказ #${event.orderId || event.recordId}`;

  if (event.data) {
    try {
      const eventData =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;

      if (eventData.customerName) {
        description += ` от ${eventData.customerName}`;
      }

      if (eventData.isVipCustomer) {
        description += " (VIP)";
      }

      if (eventData.dishDescription) {
        description += ` - ${eventData.dishDescription}`;
      }

      if (eventData.newStatus) {
        description += ` → статус: ${eventData.newStatus}`;
      }

      if (eventData.field && eventData.newValue) {
        description += ` → ${eventData.field}: ${eventData.newValue}`;
      }

      // Добавляем информацию о столиках из логов
      if (eventData.tableNumber) {
        description += ` стол #${eventData.tableNumber}`;
      }

      if (eventData.zoneType) {
        const zoneName = eventData.zoneType === "vip" ? "VIP" : "обычная";
        description += ` (${zoneName} зона)`;
      }
    } catch (e) {
      // Если не удается распарсить данные, ищем информацию в сообщении
      const message = event.message || event.description || "";
      if (message.includes("СТОЛ")) {
        const tableMatch = message.match(/СТОЛ #(\d+)/);
        if (tableMatch) {
          description += ` стол #${tableMatch[1]}`;
        }
      }
      if (message.includes("VIP")) {
        description += " (VIP зона)";
      } else if (message.includes("ОБЫЧНОЙ")) {
        description += " (обычная зона)";
      }
    }
  }

  return description;
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
