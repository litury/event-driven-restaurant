import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  IDataRecord,
  IDataAPI,
  IChangeLog,
  IFileSystemSync,
  DataChangeEvent,
  ISyncSystemConfig,
  IFileSystemState
} from '../interfaces/ISyncDataModel'

/**
 * TDD тесты для ДЗ-3: Событийная синхронизация файловой системы
 */

describe('📁 FileSystemSync - Синхронизация данных с файловой системой', () => {
  let dataAPI: IDataAPI
  let changeLog: IChangeLog
  let fileSystemSync: IFileSystemSync
  let config: ISyncSystemConfig

  beforeEach(() => {
    // Настройка тестовой среды
    config = {
      basePath: './test-sync-folders',
      maxEventsInMemory: 1000,
      syncIntervalMs: 100,
      enableDetailedLogging: true,
      logPath: './test-logs'
    }

    // Моки будут заменены реальными реализациями
    dataAPI = createMockDataAPI()
    changeLog = createMockChangeLog()
    fileSystemSync = createMockFileSystemSync(config)
  })

  afterEach(async () => {
    // Очистка тестовой среды
    await cleanupTestFiles()
  })

  // ==========================================
  // 🧪 Тесты DataAPI - работа с данными
  // ==========================================

  describe('🗄️ DataAPI - управление записями', () => {
    it('должен добавлять новую запись с автогенерацией ID и timestamp', async () => {
      // Arrange
      const newRecord = {
        flag: true,
        content: 'Тестовое содержимое readme'
      }

      // Act
      const result = await dataAPI.addRecord(newRecord)

      // Assert
      expect(result.id).toBeTypeOf('number')
      expect(result.id).toBeGreaterThan(0)
      expect(result.flag).toBe(true)
      expect(result.content).toBe('Тестовое содержимое readme')
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('должен удалять запись по ID', async () => {
      // Arrange
      const record = await dataAPI.addRecord({ flag: false, content: 'Test' })

      // Act
      const deleted = await dataAPI.removeRecord(record.id)

      // Assert
      expect(deleted).toBe(true)
      const retrieved = await dataAPI.getRecord(record.id)
      expect(retrieved).toBeNull()
    })

    it('должен изменять отдельные поля записи', async () => {
      // Arrange
      const record = await dataAPI.addRecord({ flag: false, content: 'Original' })

      // Act
      await dataAPI.changeField(record.id, 'flag', true)
      await dataAPI.changeField(record.id, 'content', 'Updated content')

      // Assert
      const updated = await dataAPI.getRecord(record.id)
      expect(updated?.flag).toBe(true)
      expect(updated?.content).toBe('Updated content')
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(record.updatedAt.getTime())
    })

    it('должен возвращать все записи', async () => {
      // Arrange
      await dataAPI.addRecord({ flag: true, content: 'Record 1' })
      await dataAPI.addRecord({ flag: false, content: 'Record 2' })

      // Act
      const allRecords = await dataAPI.getAllRecords()

      // Assert
      expect(allRecords).toHaveLength(2)
      expect(allRecords.map(r => r.content)).toContain('Record 1')
      expect(allRecords.map(r => r.content)).toContain('Record 2')
    })

    it('должен генерировать события при изменениях', async () => {
      // Arrange
      const events: DataChangeEvent[] = []
      dataAPI.onDataChange(event => events.push(event))

      // Act
      const record = await dataAPI.addRecord({ flag: true, content: 'Test' })
      await dataAPI.changeField(record.id, 'flag', false)
      await dataAPI.removeRecord(record.id)

      // Assert
      expect(events).toHaveLength(3)
      expect(events[0].type).toBe('add')
      expect(events[1].type).toBe('change')
      expect(events[2].type).toBe('remove')
    })
  })

  // ==========================================
  // 📜 Тесты ChangeLog - журнал событий
  // ==========================================

  describe('📜 ChangeLog - журнал изменений', () => {
    it('должен добавлять события с последовательной нумерацией', async () => {
      // Arrange
      const event1: DataChangeEvent = {
        eventId: 1,
        type: 'add',
        timestamp: new Date(),
        recordId: 1,
        record: { id: 1, flag: true, content: 'Test', createdAt: new Date(), updatedAt: new Date() }
      } as any

      const event2: DataChangeEvent = {
        eventId: 2,
        type: 'change',
        timestamp: new Date(),
        recordId: 1,
        field: 'flag',
        oldValue: true,
        newValue: false
      } as any

      // Act
      await changeLog.append(event1)
      await changeLog.append(event2)

      // Assert
      const recentEvents = await changeLog.getRecentEvents(2)
      expect(recentEvents).toHaveLength(2)
      expect(recentEvents[0].eventId).toBe(1)
      expect(recentEvents[1].eventId).toBe(2)
    })

    it('должен возвращать события начиная с указанного ID', async () => {
      // Arrange - добавляем 5 событий
      for (let i = 1; i <= 5; i++) {
        const event: DataChangeEvent = {
          eventId: i,
          type: 'add',
          timestamp: new Date(),
          recordId: i,
          record: { id: i, flag: true, content: `Test ${i}`, createdAt: new Date(), updatedAt: new Date() }
        } as any
        await changeLog.append(event)
      }

      // Act - запрашиваем события с ID 3
      const eventsFrom3 = await changeLog.getEventsFrom(3)

      // Assert
      expect(eventsFrom3).toHaveLength(3) // события 3, 4, 5
      expect(eventsFrom3[0].eventId).toBe(3)
      expect(eventsFrom3[2].eventId).toBe(5)
    })

    it('должен уведомлять подписчиков о новых событиях', async () => {
      // Arrange
      const receivedEvents: DataChangeEvent[] = []
      changeLog.onNewEvent(event => receivedEvents.push(event))

      // Act
      const event: DataChangeEvent = {
        eventId: 1,
        type: 'add',
        timestamp: new Date(),
        recordId: 1,
        record: { id: 1, flag: true, content: 'Test', createdAt: new Date(), updatedAt: new Date() }
      } as any

      await changeLog.append(event)

      // Assert
      expect(receivedEvents).toHaveLength(1)
      expect(receivedEvents[0].eventId).toBe(1)
    })
  })

  // ==========================================
  // 📁 Тесты FileSystemSync - синхронизация
  // ==========================================

  describe('📁 FileSystemSync - синхронизация с файловой системой', () => {
    it('должен создавать структуру папок для flag = true', async () => {
      // Arrange
      const record: IDataRecord = {
        id: 1,
        flag: true,
        content: 'Содержимое файла readme',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Act
      const fsState = await fileSystemSync.createStructure(record)

      // Assert
      expect(fsState.recordId).toBe(1)
      expect(fsState.mainFolderPath).toContain('/1')
      expect(fsState.subFolderPath).toContain('/1/project.proj')
      expect(fsState.readmePath).toContain('/1/project.proj/readme.txt')
      expect(fsState.exists).toBe(true)
    })

    it('должен создавать простую структуру для flag = false', async () => {
      // Arrange
      const record: IDataRecord = {
        id: 2,
        flag: false,
        content: 'Простое readme',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Act
      const fsState = await fileSystemSync.createStructure(record)

      // Assert
      expect(fsState.recordId).toBe(2)
      expect(fsState.mainFolderPath).toContain('/2')
      expect(fsState.subFolderPath).toBeUndefined()
      expect(fsState.readmePath).toContain('/2/readme.txt')
      expect(fsState.exists).toBe(true)
    })

    it('должен обрабатывать событие добавления записи', async () => {
      // Arrange
      const addEvent: DataChangeEvent = {
        eventId: 1,
        type: 'add',
        timestamp: new Date(),
        recordId: 3,
        record: {
          id: 3,
          flag: true,
          content: 'Новая запись',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any

      // Act
      await fileSystemSync.processEvent(addEvent)

      // Assert
      const fsState = await fileSystemSync.getFileSystemState(3)
      expect(fsState?.exists).toBe(true)
      expect(fsState?.recordId).toBe(3)
    })

    it('должен обрабатывать событие удаления записи', async () => {
      // Arrange - сначала создаем структуру
      const record: IDataRecord = {
        id: 4,
        flag: false,
        content: 'Удаляемая запись',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await fileSystemSync.createStructure(record)

      const removeEvent: DataChangeEvent = {
        eventId: 2,
        type: 'remove',
        timestamp: new Date(),
        recordId: 4
      } as any

      // Act
      await fileSystemSync.processEvent(removeEvent)

      // Assert
      const removed = await fileSystemSync.removeStructure(4)
      expect(removed).toBe(true)
      const fsState = await fileSystemSync.getFileSystemState(4)
      expect(fsState?.exists).toBe(false)
    })

    it('должен обрабатывать изменение flag с перестройкой структуры', async () => {
      // Arrange - создаем с flag = false
      const record: IDataRecord = {
        id: 5,
        flag: false,
        content: 'Изменяемая запись',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await fileSystemSync.createStructure(record)

      const changeEvent: DataChangeEvent = {
        eventId: 3,
        type: 'change',
        timestamp: new Date(),
        recordId: 5,
        field: 'flag',
        oldValue: false,
        newValue: true
      } as any

      // Act
      await fileSystemSync.processEvent(changeEvent)

      // Assert
      const fsState = await fileSystemSync.getFileSystemState(5)
      expect(fsState?.subFolderPath).toContain('/5/project.proj')
      expect(fsState?.readmePath).toContain('/5/project.proj/readme.txt')
    })

    it('должен синхронизировать все записи разом', async () => {
      // Arrange - создаем несколько записи через DataAPI
      await dataAPI.addRecord({ flag: true, content: 'Record 1' })
      await dataAPI.addRecord({ flag: false, content: 'Record 2' })
      await dataAPI.addRecord({ flag: true, content: 'Record 3' })

      // Act
      const syncStates = await fileSystemSync.syncAll()

      // Assert
      expect(syncStates).toHaveLength(3)
      syncStates.forEach(state => {
        expect(state.exists).toBe(true)
        expect(state.lastSyncAt).toBeInstanceOf(Date)
      })
    })
  })

  // ==========================================
  // 🔄 Интеграционные тесты всей системы
  // ==========================================

  describe('🔄 Интеграция - полный цикл синхронизации', () => {
    it('должен автоматически синхронизировать изменения от DataAPI к FileSystem', async () => {
      // Arrange - настраиваем автосинхронизацию
      changeLog.onNewEvent(async (event) => {
        await fileSystemSync.processEvent(event)
      })

      dataAPI.onDataChange(async (event) => {
        await changeLog.append(event)
      })

      // Act - делаем изменения через DataAPI
      const record1 = await dataAPI.addRecord({ flag: true, content: 'Auto sync test 1' })
      const record2 = await dataAPI.addRecord({ flag: false, content: 'Auto sync test 2' })

      await dataAPI.changeField(record1.id, 'flag', false)
      await dataAPI.removeRecord(record2.id)

      // Даем время на синхронизацию
      await new Promise(resolve => setTimeout(resolve, 200))

      // Assert
      const fs1 = await fileSystemSync.getFileSystemState(record1.id)
      const fs2 = await fileSystemSync.getFileSystemState(record2.id)

      expect(fs1?.exists).toBe(true)
      expect(fs1?.subFolderPath).toBeUndefined() // flag изменился на false
      expect(fs2?.exists).toBe(false) // запись удалена
    })

    it('должен восстанавливаться после рассинхронизации', async () => {
      // Arrange - создаем записи, но "пропускаем" синхронизацию
      const record1 = await dataAPI.addRecord({ flag: true, content: 'Recovery test 1' })
      const record2 = await dataAPI.addRecord({ flag: false, content: 'Recovery test 2' })

      // Имитируем сбой синхронизации - events есть, файлов нет

      // Act - запускаем полную синхронизацию
      const syncStates = await fileSystemSync.syncAll()

      // Assert
      expect(syncStates).toHaveLength(2)
      expect(syncStates.every(s => s.exists)).toBe(true)
    })
  })
})

// ==========================================
// 🔧 Моки и утилиты для тестов
// ==========================================

function createMockDataAPI(): IDataAPI {
  const records = new Map<number, IDataRecord>()
  let nextId = 1
  const listeners: Array<(event: DataChangeEvent) => void> = []

  return {
    async addRecord(data): Promise<IDataRecord> {
      const record: IDataRecord = {
        id: nextId++,
        flag: data.flag,
        content: data.content,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      records.set(record.id, record)

      const event: DataChangeEvent = {
        eventId: nextId,
        type: 'add',
        timestamp: new Date(),
        recordId: record.id,
        record
      } as any

      listeners.forEach(l => l(event))
      return record
    },

    async removeRecord(id: number): Promise<boolean> {
      const exists = records.has(id)
      if (exists) {
        records.delete(id)
        const event: DataChangeEvent = {
          eventId: nextId++,
          type: 'remove',
          timestamp: new Date(),
          recordId: id
        } as any
        listeners.forEach(l => l(event))
      }
      return exists
    },

    async changeField(id: number, field: keyof IDataRecord, value: any): Promise<boolean> {
      const record = records.get(id)
      if (!record) return false

      const oldValue = record[field]
        ; (record as any)[field] = value
      record.updatedAt = new Date()

      const event: DataChangeEvent = {
        eventId: nextId++,
        type: 'change',
        timestamp: new Date(),
        recordId: id,
        field,
        oldValue,
        newValue: value
      } as any

      listeners.forEach(l => l(event))
      return true
    },

    async getRecord(id: number): Promise<IDataRecord | null> {
      return records.get(id) || null
    },

    async getAllRecords(): Promise<IDataRecord[]> {
      return Array.from(records.values())
    },

    onDataChange(listener: (event: DataChangeEvent) => void): void {
      listeners.push(listener)
    }
  }
}

function createMockChangeLog(): IChangeLog {
  const events: DataChangeEvent[] = []
  const listeners: Array<(event: DataChangeEvent) => void> = []

  return {
    async append(event: DataChangeEvent): Promise<void> {
      events.push(event)
      listeners.forEach(l => l(event))
    },

    async getEventsFrom(fromEventId: number): Promise<DataChangeEvent[]> {
      return events.filter(e => e.eventId >= fromEventId)
    },

    async getRecentEvents(count: number): Promise<DataChangeEvent[]> {
      return events.slice(-count)
    },

    async getEventCount(): Promise<number> {
      return events.length
    },

    onNewEvent(listener: (event: DataChangeEvent) => void): void {
      listeners.push(listener)
    }
  }
}

function createMockFileSystemSync(config: ISyncSystemConfig): IFileSystemSync {
  const fsStates = new Map<number, IFileSystemState>()

  return {
    async processEvent(event: DataChangeEvent): Promise<void> {
      switch (event.type) {
        case 'add':
          if ('record' in event) {
            await this.createStructure(event.record)
          }
          break
        case 'remove':
          await this.removeStructure(event.recordId)
          break
        case 'change':
          if ('field' in event) {
            // Обновляем структуру
            const currentState = fsStates.get(event.recordId)
            if (currentState) {
              // Имитируем обновление файловой структуры
              currentState.lastSyncAt = new Date()
            }
          }
          break
      }
    },

    async createStructure(record: IDataRecord): Promise<IFileSystemState> {
      const mainPath = `${config.basePath}/${record.id}`
      const state: IFileSystemState = {
        recordId: record.id,
        mainFolderPath: mainPath,
        subFolderPath: record.flag ? `${mainPath}/project.proj` : undefined,
        readmePath: record.flag
          ? `${mainPath}/project.proj/readme.txt`
          : `${mainPath}/readme.txt`,
        exists: true,
        lastSyncAt: new Date()
      }

      fsStates.set(record.id, state)
      return state
    },

    async removeStructure(recordId: number): Promise<boolean> {
      const state = fsStates.get(recordId)
      if (state) {
        state.exists = false
        return true
      }
      return false
    },

    async updateStructure(recordId: number, newData: Partial<IDataRecord>): Promise<IFileSystemState> {
      const state = fsStates.get(recordId)
      if (!state) throw new Error(`State not found for record ${recordId}`)

      // Обновляем пути если изменился flag
      if ('flag' in newData) {
        const mainPath = state.mainFolderPath
        state.subFolderPath = newData.flag ? `${mainPath}/project.proj` : undefined
        state.readmePath = newData.flag
          ? `${mainPath}/project.proj/readme.txt`
          : `${mainPath}/readme.txt`
      }

      state.lastSyncAt = new Date()
      return state
    },

    async getFileSystemState(recordId: number): Promise<IFileSystemState | null> {
      return fsStates.get(recordId) || null
    },

    async syncAll(): Promise<IFileSystemState[]> {
      return Array.from(fsStates.values())
    }
  }
}

async function cleanupTestFiles(): Promise<void> {
  // В реальной реализации здесь будет очистка тестовых папок
  // Пока просто заглушка
}

