/**
 * Реализация синхронизатора зон ресторана
 * ДЗ-3: Событийная синхронизация ресторанных зон
 */

import {
  IRestaurantZoneSync,
  IRestaurantOrder,
  IRestaurantZoneState,
  RestaurantChangeEvent,
  IRestaurantSyncConfig,
  IOrderAddedEvent,
  IOrderRemovedEvent,
  IOrderModifiedEvent
} from '../interfaces/IRestaurantSyncModel'

/**
 * Конкретная реализация синхронизатора зон ресторана
 * Реализует логику размещения заказов в зонах согласно VIP статусу
 */
export class RestaurantZoneSync implements IRestaurantZoneSync {
  private p_zoneStates = new Map<number, IRestaurantZoneState>()
  private p_occupiedTables = new Set<number>()
  private p_config: IRestaurantSyncConfig

  // Очереди для заказов когда нет свободных столов
  private p_vipQueue: IRestaurantOrder[] = []
  private p_regularQueue: IRestaurantOrder[] = []

  constructor(config: IRestaurantSyncConfig) {
    this.p_config = config
  }

  /**
   * Обработать событие изменения заказа
   */
  async processOrderEvent(event: RestaurantChangeEvent): Promise<void> {
    if (this.p_config.enableDetailedLogging) {
      console.log(`[RestaurantZoneSync] 📋 Обработка события: ${event.type} для заказа #${event.orderId}`)
    }

    switch (event.type) {
      case 'order_added':
        await this.p_handleOrderAdded(event as IOrderAddedEvent)
        break

      case 'order_removed':
        await this.p_handleOrderRemoved(event as IOrderRemovedEvent)
        break

      case 'order_modified':
        await this.p_handleOrderModified(event as IOrderModifiedEvent)
        break

      case 'status_changed':
        // Изменение статуса не требует перемещения зон
        await this.p_handleStatusChanged(event)
        break

      default:
        console.warn(`[RestaurantZoneSync] ⚠️ Неизвестный тип события: ${event.type}`)
    }
  }

  /**
   * Разместить заказ в соответствующей зоне
   */
  async placeOrderInZone(order: IRestaurantOrder): Promise<IRestaurantZoneState> {
    const zoneType = order.isVipCustomer ? 'vip' : 'regular'
    const zoneName = zoneType === 'vip' ? 'VIP' : 'ОБЫЧНОЙ'

    // Получаем свободные столы в нужной зоне
    const availableTables = await this.getAvailableTables(zoneType)

    if (availableTables.length === 0) {
      // Вместо ошибки - ставим в очередь
      if (zoneType === 'vip') {
        this.p_vipQueue.push(order)
        if (this.p_config.enableDetailedLogging) {
          console.log(`[RestaurantZoneSync] 🏃‍♂️ ЗАКАЗ #${order.orderId} В ОЧЕРЕДИ VIP (${this.p_vipQueue.length} ожидают) - все столы заняты`)
        }
      } else {
        this.p_regularQueue.push(order)
        if (this.p_config.enableDetailedLogging) {
          console.log(`[RestaurantZoneSync] 🏃‍♂️ ЗАКАЗ #${order.orderId} В ОЧЕРЕДИ ОБЫЧНОЙ (${this.p_regularQueue.length} ожидают) - все столы заняты`)
        }
      }

      // Возвращаем состояние "в очереди"
      const queueState: IRestaurantZoneState = {
        orderId: order.orderId,
        zoneType,
        tableNumber: -1, // -1 означает "в очереди"
        position: { x: 0, y: 0, section: `${zoneType}_queue` },
        assignedWaiter: 'Ожидает размещения',
        placementStatus: 'queued',
        placedAt: new Date(),
        lastUpdatedAt: new Date(),
        metadata: {
          hasSpecialRequests: this.p_hasSpecialRequests(order.dishDescription),
          estimatedServiceTime: this.p_calculateEstimatedServiceTime(order),
          actualServiceTime: undefined,
          queuePosition: zoneType === 'vip' ? this.p_vipQueue.length : this.p_regularQueue.length
        }
      }

      // ВАЖНО: сохраняем состояние очереди в p_zoneStates
      this.p_zoneStates.set(order.orderId, queueState)

      return { ...queueState }
    }

    // Выбираем первый доступный стол
    const tableNumber = availableTables[0]
    this.p_occupiedTables.add(tableNumber)

    // Логируем размещение
    if (this.p_config.enableDetailedLogging) {
      console.log(`[RestaurantZoneSync] 🪑 СТОЛ #${tableNumber} ЗАНЯТ заказом #${order.orderId} (${zoneName} зона)`)
    }

    // Создаём состояние зоны
    const zoneState: IRestaurantZoneState = {
      orderId: order.orderId,
      zoneType,
      tableNumber,
      position: this.p_calculateTablePosition(zoneType, tableNumber),
      assignedWaiter: this.p_assignWaiter(zoneType),
      placementStatus: 'placed',
      placedAt: new Date(),
      lastUpdatedAt: new Date(),
      metadata: {
        hasSpecialRequests: this.p_hasSpecialRequests(order.dishDescription),
        estimatedServiceTime: this.p_calculateEstimatedServiceTime(order),
        actualServiceTime: undefined
      }
    }

    // Сохраняем состояние
    this.p_zoneStates.set(order.orderId, zoneState)

    // Проверяем и обрабатываем очередь после размещения
    await this.p_processQueue(zoneType)

    return { ...zoneState }
  }

  /**
   * Переместить заказ между зонами при изменении VIP статуса
   */
  async moveOrderBetweenZones(orderId: number, newVipStatus: boolean): Promise<IRestaurantZoneState> {
    const currentState = this.p_zoneStates.get(orderId)
    if (!currentState) {
      throw new Error(`Заказ ${orderId} не найден в зонах`)
    }

    const newZoneType = newVipStatus ? 'vip' : 'regular'

    // Если зона не изменилась, просто обновляем timestamp
    if (currentState.zoneType === newZoneType) {
      currentState.lastUpdatedAt = new Date()
      return { ...currentState }
    }

    // Освобождаем текущий стол
    this.p_occupiedTables.delete(currentState.tableNumber)

    // Ищем новый стол в целевой зоне
    const availableTables = await this.getAvailableTables(newZoneType)

    if (availableTables.length === 0) {
      // Возвращаем стол обратно, если не можем переместить
      this.p_occupiedTables.add(currentState.tableNumber)
      throw new Error(`Нет свободных столов в зоне ${newZoneType} для перемещения заказа ${orderId}`)
    }

    // Занимаем новый стол
    const newTableNumber = availableTables[0]
    this.p_occupiedTables.add(newTableNumber)

    // Обновляем состояние зоны
    const updatedState: IRestaurantZoneState = {
      ...currentState,
      zoneType: newZoneType,
      tableNumber: newTableNumber,
      position: this.p_calculateTablePosition(newZoneType, newTableNumber),
      assignedWaiter: this.p_assignWaiter(newZoneType),
      lastUpdatedAt: new Date()
    }

    this.p_zoneStates.set(orderId, updatedState)

    if (this.p_config.enableDetailedLogging) {
      console.log(`[RestaurantZoneSync] Заказ ${orderId} перемещён из ${currentState.zoneType} в ${newZoneType}, новый стол ${newTableNumber}`)
    }

    return { ...updatedState }
  }

  /**
   * Убрать заказ из зоны после обслуживания
   */
  async removeOrderFromZone(orderId: number): Promise<boolean> {
    const state = this.p_zoneStates.get(orderId)
    if (!state) {
      return false
    }

    // Логируем освобождение стола
    if (this.p_config.enableDetailedLogging) {
      const zoneName = state.zoneType === 'vip' ? 'VIP' : 'ОБЫЧНОЙ'
      console.log(`[RestaurantZoneSync] 🆓 СТОЛ #${state.tableNumber} ОСВОБОЖДЕН после заказа #${orderId} (${zoneName} зона)`)
    }

    // Освобождаем стол
    this.p_occupiedTables.delete(state.tableNumber)

    // Удаляем из состояний
    this.p_zoneStates.delete(orderId)

    // Обрабатываем очередь после освобождения стола
    await this.p_processQueue(state.zoneType)

    return true
  }

  /**
   * Обработать очередь после освобождения стола
   */
  private async p_processQueue(zoneType: 'vip' | 'regular' | 'takeaway'): Promise<void> {
    if (zoneType === 'takeaway') return // Пока не реализовано

    const queue = zoneType === 'vip' ? this.p_vipQueue : this.p_regularQueue
    if (queue.length === 0) return

    const availableTables = await this.getAvailableTables(zoneType)
    if (availableTables.length === 0) return

    // Берем первый заказ из очереди
    const nextOrder = queue.shift()
    if (!nextOrder) return

    // Размещаем заказ на освободившемся столе
    const tableNumber = availableTables[0]
    this.p_occupiedTables.add(tableNumber)

    const zoneName = zoneType === 'vip' ? 'VIP' : 'ОБЫЧНОЙ'
    if (this.p_config.enableDetailedLogging) {
      console.log(`[RestaurantZoneSync] 🔄 ЗАКАЗ #${nextOrder.orderId} ПЕРЕМЕЩЕН ИЗ ОЧЕРЕДИ НА СТОЛ #${tableNumber} (${zoneName} зона)`)
    }

    const zoneState: IRestaurantZoneState = {
      orderId: nextOrder.orderId,
      zoneType,
      tableNumber,
      position: this.p_calculateTablePosition(zoneType, tableNumber),
      assignedWaiter: this.p_assignWaiter(zoneType),
      placementStatus: 'placed',
      placedAt: new Date(),
      lastUpdatedAt: new Date(),
      metadata: {
        hasSpecialRequests: this.p_hasSpecialRequests(nextOrder.dishDescription),
        estimatedServiceTime: this.p_calculateEstimatedServiceTime(nextOrder),
        actualServiceTime: undefined
      }
    }

    this.p_zoneStates.set(nextOrder.orderId, zoneState)
  }

  /**
   * Обновить статус зоны
   */
  async updateZoneState(orderId: number, updates: Partial<IRestaurantZoneState>): Promise<IRestaurantZoneState> {
    const currentState = this.p_zoneStates.get(orderId)
    if (!currentState) {
      throw new Error(`Заказ ${orderId} не найден в зонах`)
    }

    const updatedState: IRestaurantZoneState = {
      ...currentState,
      ...updates,
      lastUpdatedAt: new Date()
    }

    this.p_zoneStates.set(orderId, updatedState)
    return { ...updatedState }
  }

  /**
   * Получить текущее состояние зоны для заказа
   */
  async getZoneState(orderId: number): Promise<IRestaurantZoneState | null> {
    const state = this.p_zoneStates.get(orderId)
    return state ? { ...state } : null
  }

  /**
   * Синхронизировать все заказы с зонами
   */
  async syncAllZones(): Promise<IRestaurantZoneState[]> {
    return Array.from(this.p_zoneStates.values()).map(state => ({ ...state }))
  }

  /**
   * Получить состояние всех зон
   */
  async getAllZoneStates(): Promise<IRestaurantZoneState[]> {
    return Array.from(this.p_zoneStates.values()).map(state => ({ ...state }))
  }

  /**
   * Получить свободные столы в зоне
   */
  async getAvailableTables(zoneType: 'vip' | 'regular'): Promise<number[]> {
    const allTables = zoneType === 'vip'
      ? this.p_config.zoneSettings.vip.tableNumbers
      : this.p_config.zoneSettings.regular.tableNumbers

    return allTables.filter(table => !this.p_occupiedTables.has(table))
  }

  // ==========================================
  // Приватные методы обработки событий
  // ==========================================

  /**
   * Обработать добавление заказа
   */
  private async p_handleOrderAdded(event: IOrderAddedEvent): Promise<void> {
    try {
      await this.placeOrderInZone(event.order)
    } catch (error) {
      console.error(`[RestaurantZoneSync] Ошибка размещения заказа ${event.orderId}:`, error)
    }
  }

  /**
   * Обработать удаление заказа
   */
  private async p_handleOrderRemoved(event: IOrderRemovedEvent): Promise<void> {
    await this.removeOrderFromZone(event.orderId)
  }

  /**
   * Обработать изменение заказа
   */
  private async p_handleOrderModified(event: IOrderModifiedEvent): Promise<void> {
    // Если изменился VIP статус, перемещаем между зонами
    if (event.field === 'isVipCustomer') {
      try {
        await this.moveOrderBetweenZones(event.orderId, event.newValue as boolean)
      } catch (error) {
        console.error(`[RestaurantZoneSync] Ошибка перемещения заказа ${event.orderId}:`, error)
      }
    }
    // Для других полей просто обновляем timestamp
    else {
      const currentState = this.p_zoneStates.get(event.orderId)
      if (currentState) {
        currentState.lastUpdatedAt = new Date()
      }
    }
  }

  /**
   * Обработать изменение статуса
   */
  private async p_handleStatusChanged(event: RestaurantChangeEvent): Promise<void> {
    const state = this.p_zoneStates.get(event.orderId)
    if (!state) return

    // Обновляем статус размещения в зависимости от статуса заказа
    const statusEvent = event as any
    const oldStatus = state.placementStatus

    switch (statusEvent.newStatus) {
      case 'preparing':
        state.placementStatus = 'occupied'
        break
      case 'ready':
        state.placementStatus = 'ready_for_service'
        break
      case 'served':
        state.placementStatus = 'cleared'
        break
    }

    state.lastUpdatedAt = new Date()

    // Логируем изменение статуса
    if (this.p_config.enableDetailedLogging && oldStatus !== state.placementStatus) {
      const zoneName = state.zoneType === 'vip' ? 'VIP' : 'ОБЫЧНОЙ'
      console.log(`[RestaurantZoneSync] 📊 СТОЛ #${state.tableNumber} (${zoneName}): заказ #${event.orderId} → ${statusEvent.newStatus.toUpperCase()}`)
    }
  }

  // ==========================================
  // Приватные вспомогательные методы
  // ==========================================

  /**
   * Рассчитать позицию стола в зоне
   */
  private p_calculateTablePosition(zoneType: 'vip' | 'regular' | 'takeaway', tableNumber: number): { x: number; y: number; section: string } {
    // Простая логика размещения столов
    const baseX = zoneType === 'vip' ? 20 : 60
    const baseY = 20
    const spacing = 40

    const row = Math.floor((tableNumber - 1) / 5)
    const col = (tableNumber - 1) % 5

    return {
      x: baseX + col * spacing,
      y: baseY + row * spacing,
      section: zoneType
    }
  }

  /**
   * Назначить официанта для зоны
   */
  private p_assignWaiter(zoneType: 'vip' | 'regular' | 'takeaway'): string {
    const vipWaiters = ['Анна (VIP)', 'Дмитрий (VIP)', 'Елена (VIP)']
    const regularWaiters = ['Игорь', 'Мария', 'Сергей', 'Ольга', 'Андрей']

    if (zoneType === 'vip') {
      return vipWaiters[Math.floor(Math.random() * vipWaiters.length)]
    } else {
      return regularWaiters[Math.floor(Math.random() * regularWaiters.length)]
    }
  }

  /**
   * Проверить наличие особых требований в описании блюда
   */
  private p_hasSpecialRequests(dishDescription: string): boolean {
    const specialKeywords = ['без', 'с дополнительным', 'особый', 'аллергия', 'веган', 'острый']
    return specialKeywords.some(keyword =>
      dishDescription.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  /**
   * Рассчитать ожидаемое время обслуживания
   */
  private p_calculateEstimatedServiceTime(order: IRestaurantOrder): number {
    // Базовое время обслуживания
    let baseTime = 30 * 60 * 1000 // 30 минут в миллисекундах

    // VIP клиенты обслуживаются быстрее
    if (order.isVipCustomer) {
      baseTime *= 0.75 // 25% быстрее
    }

    // Сложные блюда требуют больше времени
    if (this.p_hasSpecialRequests(order.dishDescription)) {
      baseTime *= 1.3 // 30% дольше
    }

    return Math.round(baseTime)
  }

  /**
   * Получить статистику по зонам (дополнительный метод)
   */
  async getZoneStatistics(): Promise<{
    vip: { occupied: number; available: number; tables: number[]; queueLength: number }
    regular: { occupied: number; available: number; tables: number[]; queueLength: number }
    takeaway: { pending: number; ready: number }
  }> {
    const vipTables = await this.getAvailableTables('vip')
    const regularTables = await this.getAvailableTables('regular')

    const vipStates = Array.from(this.p_zoneStates.values()).filter(s => s.zoneType === 'vip')
    const regularStates = Array.from(this.p_zoneStates.values()).filter(s => s.zoneType === 'regular')

    return {
      vip: {
        occupied: this.p_config.zoneSettings.vip.maxTables - vipTables.length,
        available: vipTables.length,
        tables: vipTables,
        queueLength: this.p_vipQueue.length
      },
      regular: {
        occupied: this.p_config.zoneSettings.regular.maxTables - regularTables.length,
        available: regularTables.length,
        tables: regularTables,
        queueLength: this.p_regularQueue.length
      },
      takeaway: {
        pending: 0, // TODO: Реализовать логику takeaway
        ready: 0
      }
    }
  }

  /**
   * Очистить все данные (для тестирования)
   */
  clearAll(): void {
    this.p_zoneStates.clear()
    this.p_occupiedTables.clear()
    this.p_vipQueue.length = 0
    this.p_regularQueue.length = 0
  }
} 