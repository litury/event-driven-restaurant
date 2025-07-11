import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { RestaurantZoneAPI } from '../../WorkloadBalancing/services/restaurantZoneAPI';
import { KitchenChangeLog } from '../../WorkloadBalancing/services/kitchenChangeLog';
import { RestaurantZoneSync } from '../../WorkloadBalancing/services/restaurantZoneSync';
import type {
  IRestaurantOrder,
  RestaurantChangeEvent
} from '../../WorkloadBalancing/interfaces/IRestaurantSyncModel';

// Локальный интерфейс для зоны ресторана (UI)
interface IRestaurantTable {
  number: number;
  isOccupied: boolean;
  orderIds: string[];
  orders?: IRestaurantOrder[];
}

interface IRestaurantZone {
  name: string;
  tables: IRestaurantTable[];
  capacity: number;
  availableSlots: number;
}

/**
 * Composable для управления ресторанной системой синхронизации
 * Интегрирует ДЗ-3 с UI компонентами
 */
export function useRestaurantSync() {
  // Состояние системы
  const isActive = ref(false);
  const p_updateInterval = ref<number | null>(null);

  // Инстансы системы
  const p_restaurantAPI = new RestaurantZoneAPI();
  const p_kitchenLog = new KitchenChangeLog();

  // Конфигурация для синхронизатора зон
  const syncConfig = {
    maxEventsInMemory: 1000,
    syncIntervalMs: 500,
    enableDetailedLogging: true,
    zoneSettings: {
      vip: {
        maxTables: 5,
        tableNumbers: [1, 2, 3, 4, 5],
        specialFeatures: ['Персональный официант', 'Приоритетное обслуживание', 'Особое меню']
      },
      regular: {
        maxTables: 10,
        tableNumbers: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15] // 10 столов: 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
      },
      takeaway: {
        maxOrders: 20,
        averageWaitTime: 15 // минут
      }
    },
    autoCleanup: {
      enabled: true,
      keepLastN: 500,
      intervalMs: 300000 // 5 минут
    }
  };

  const p_zoneSync = new RestaurantZoneSync(syncConfig);

  // Подключаем событийную цепочку
  p_restaurantAPI.onOrderChange((event: RestaurantChangeEvent) => {
    // Добавляем событие в журнал кухни
    p_kitchenLog.append(event).catch(error => {
      console.error('Ошибка записи в журнал кухни:', error);
    });
  });

  p_kitchenLog.onNewEvent((event: RestaurantChangeEvent) => {
    // Передаем событие в систему синхронизации зон
    p_zoneSync.processOrderEvent(event);
  });

  // Реактивные данные
  const zones = reactive<{
    vipZone: IRestaurantZone;
    regularZone: IRestaurantZone;
  }>({
    vipZone: {
      name: 'VIP зона',
      tables: [],
      capacity: 5,
      availableSlots: 5
    },
    regularZone: {
      name: 'Обычная зона',
      tables: [],
      capacity: 10,
      availableSlots: 10
    }
  });

  const recentEvents = ref<RestaurantChangeEvent[]>([]);
  const activeOrders = ref<IRestaurantOrder[]>([]);

  // Статистика
  const statistics = reactive({
    totalOrders: 0,
    vipOrders: 0,
    completedOrders: 0,
    eventsLogged: 0,
    zonesOccupancy: 0,
    vipQueueLength: 0,
    regularQueueLength: 0
  });

  /**
   * Обновление состояния из системы
   */
  async function updateState() {
    try {
      // Получаем все заказы
      const allOrders = await p_restaurantAPI.getAllOrders();
      activeOrders.value = allOrders.filter(order => order.status !== 'served');

      // Получаем последние события
      recentEvents.value = await p_kitchenLog.getRecentEvents(10);

      // Получаем статистику зон из синхронизатора
      const zoneStats = await p_zoneSync.getZoneStatistics();

      // Обновляем статистику (без .value - это reactive объект)
      Object.assign(statistics, {
        totalOrders: allOrders.length,
        vipOrders: allOrders.filter(order => order.isVipCustomer).length,
        completedOrders: allOrders.filter(order => order.status === 'served').length,
        totalEvents: recentEvents.value.length,
        eventsLogged: await p_kitchenLog.getEventCount(),

        // Добавляем статистику очередей
        vipQueueLength: zoneStats.vip.queueLength,
        regularQueueLength: zoneStats.regular.queueLength,
        vipOccupancy: Math.round((zoneStats.vip.occupied / (zoneStats.vip.occupied + zoneStats.vip.available)) * 100) || 0,
        regularOccupancy: Math.round((zoneStats.regular.occupied / (zoneStats.regular.occupied + zoneStats.regular.available)) * 100) || 0,
        zonesOccupancy: Math.round(
          ((zones.vipZone.capacity - zones.vipZone.availableSlots) +
            (zones.regularZone.capacity - zones.regularZone.availableSlots)) /
          (zones.vipZone.capacity + zones.regularZone.capacity) * 100
        )
      });

      // Обновляем VIP зону
      const vipOrders = activeOrders.value.filter(order =>
        order.isVipCustomer && order.status !== 'served'
      );

      zones.vipZone = {
        name: 'VIP зона',
        tables: Array.from({ length: 5 }, (_, index) => {
          const tableNumber = index + 1; // Столы 1-5 для VIP
          // Распределяем заказы равномерно по столам
          const ordersAtTable = vipOrders.filter((_, orderIndex) =>
            orderIndex % 5 === index
          );

          return {
            number: tableNumber,
            isOccupied: ordersAtTable.length > 0,
            orderIds: ordersAtTable.map(o => o.orderId.toString()),
            orders: ordersAtTable
          };
        }),
        capacity: 5,
        availableSlots: Math.max(0, 5 - Math.ceil(vipOrders.length / 5))
      };

      // Обновляем обычную зону
      const regularOrders = activeOrders.value.filter(order =>
        !order.isVipCustomer && order.status !== 'served'
      );

      const regularTables = Array.from({ length: 10 }, (_, index) => {
        const tableNumber = index + 6; // Столы 6-15 для обычной зоны
        // Распределяем заказы равномерно по столам
        const ordersAtTable = regularOrders.filter((_, orderIndex) =>
          orderIndex % 10 === index
        );

        return {
          number: tableNumber,
          isOccupied: ordersAtTable.length > 0,
          orderIds: ordersAtTable.map(o => o.orderId.toString()),
          orders: ordersAtTable
        };
      });

      console.log('🔍 DEBUG: Создано столов в обычной зоне:', regularTables.length, 'Номера:', regularTables.map(t => t.number));

      zones.regularZone = {
        name: 'Обычная зона',
        tables: regularTables,
        capacity: 10,
        availableSlots: Math.max(0, 10 - Math.ceil(regularOrders.length / 10))
      };
    } catch (error) {
      console.error('Ошибка обновления состояния ресторана:', error);
    }
  }

  /**
   * Создание тестового заказа
   */
  function createTestOrderData() {
    const orderNumber = Date.now() % 10000;
    const isVip = Math.random() > 0.7; // 30% VIP заказов

    const dishes = ['Пицца Маргарита', 'Бургер Классик', 'Салат Цезарь', 'Суп дня', 'Стейк', 'Паста'];
    const dishDescription = dishes[Math.floor(Math.random() * dishes.length)];

    return {
      orderNumber,
      isVipCustomer: isVip,
      dishDescription,
      status: 'pending' as const,
      estimatedCompletionTime: new Date(Date.now() + (15 + Math.random() * 30) * 60000) // 15-45 мин
    };
  }

  /**
   * Запуск системы
   */
  function startRestaurant() {
    if (isActive.value) return;

    isActive.value = true;
    console.log('🏪 ДЗ-3: Ресторанная система синхронизации запущена');

    // Создаём периодические заказы
    const orderInterval = setInterval(async () => {
      if (!isActive.value) {
        clearInterval(orderInterval);
        return;
      }

      try {
        const testOrderData = createTestOrderData();
        await p_restaurantAPI.addOrder(testOrderData);

        // Иногда обновляем статус заказов
        if (Math.random() > 0.7) {
          const pendingOrders = await p_restaurantAPI.getOrdersByStatus('pending');

          if (pendingOrders.length > 0) {
            const randomOrder = pendingOrders[Math.floor(Math.random() * pendingOrders.length)];
            await p_restaurantAPI.changeOrderStatus(randomOrder.orderId, 'preparing');

            // Через некоторое время завершаем заказ
            setTimeout(async () => {
              if (Math.random() > 0.3) {
                await p_restaurantAPI.changeOrderStatus(randomOrder.orderId, 'served');
              }
            }, 5000 + Math.random() * 10000);
          }
        }
      } catch (error) {
        console.error('Ошибка создания тестового заказа:', error);
      }
    }, 2000 + Math.random() * 3000); // Заказы каждые 2-5 секунд

    // Обновление UI
    p_updateInterval.value = setInterval(updateState, 500) as any;
    updateState();
  }

  /**
   * Остановка системы
   */
  function stopRestaurant() {
    if (!isActive.value) return;

    isActive.value = false;
    console.log('🔒 ДЗ-3: Ресторанная система синхронизации остановлена');

    // Очищаем интервал обновления
    if (p_updateInterval.value) {
      clearInterval(p_updateInterval.value);
      p_updateInterval.value = null;
    }

    // Очищаем все данные для предотвращения ошибок Vue
    activeOrders.value = [];
    recentEvents.value = [];

    // Сбрасываем зоны
    zones.vipZone = {
      name: 'VIP зона',
      tables: [],
      capacity: 5,
      availableSlots: 5
    };
    zones.regularZone = {
      name: 'Обычная зона',
      tables: [],
      capacity: 10,
      availableSlots: 10
    };

    // Сбрасываем статистику
    Object.assign(statistics, {
      totalOrders: 0,
      vipOrders: 0,
      completedOrders: 0,
      eventsLogged: 0,
      zonesOccupancy: 0,
      vipQueueLength: 0,
      regularQueueLength: 0
    });
  }

  /**
   * Создание ручного заказа (для демонстрации)
   */
  async function createManualOrder(isVip: boolean = false, description: string = 'Особый заказ') {
    try {
      const orderData = createTestOrderData();
      orderData.isVipCustomer = isVip;
      orderData.dishDescription = description;

      const order = await p_restaurantAPI.addOrder(orderData);
      await updateState();

      return order;
    } catch (error) {
      console.error('Ошибка создания ручного заказа:', error);
      throw error;
    }
  }

  /**
   * Получение заказов по зоне
   */
  function getOrdersByZone(zoneName: string): IRestaurantOrder[] {
    const zone = zoneName === 'VIP зона' ? zones.vipZone : zones.regularZone;
    const orderIds = zone.tables.flatMap(table => table.orderIds);

    return activeOrders.value.filter(order => orderIds.includes(order.orderId.toString()));
  }

  /**
   * Очистка системы (для тестирования)
   */
  function clearRestaurant() {
    stopRestaurant();
    p_kitchenLog.clearAll();
    p_restaurantAPI.clearAll();

    // Сброс зон
    zones.vipZone = {
      name: 'VIP зона',
      tables: [],
      capacity: 5,
      availableSlots: 5
    };
    zones.regularZone = {
      name: 'Обычная зона',
      tables: [],
      capacity: 10,
      availableSlots: 10
    };

    // Сброс данных
    activeOrders.value = [];
    recentEvents.value = [];
    Object.assign(statistics, {
      totalOrders: 0,
      vipOrders: 0,
      completedOrders: 0,
      eventsLogged: 0,
      zonesOccupancy: 0,
      vipQueueLength: 0,
      regularQueueLength: 0
    });

    console.log('🧹 ДЗ-3: Ресторанная система очищена');
  }

  // Cleanup при размонтировании
  onUnmounted(() => {
    stopRestaurant();
  });

  return {
    // Состояние
    isActive,
    zones,
    recentEvents,
    activeOrders,
    statistics,

    // Методы управления
    startRestaurant,
    stopRestaurant,
    createManualOrder,
    clearRestaurant,

    // Утилиты
    getOrdersByZone,
    updateState
  };
} 