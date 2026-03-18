// Fallback database usando localStorage quando PGlite falhar

export interface Reminder {
  id: string
  title: string
  notes: string | null
  remind_at: string
  done: boolean
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  title: string
  location: string | null
  notes: string | null
  starts_at: string
  ends_at: string | null
  done: boolean
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: 'reminder' | 'appointment'
  entity_id: string
  description: string
  metadata: any
  created_at: string
}

export interface NotificationSettings {
  id: string
  itemId: string
  itemType: 'reminder' | 'appointment'
  enableNotification: boolean
  enableSound: boolean
  enableVibration: boolean
  created_at: string
  updated_at: string
}

class LocalStorageDB {
  private isInitialized = false
  private readonly STORAGE_KEYS = {
    REMINDERS: 'agenda-reminders',
    APPOINTMENTS: 'agenda-appointments',
    AUDIT_LOGS: 'agenda-audit-logs',
    NOTIFICATION_SETTINGS: 'agenda-notification-settings'
  }

  async initialize() {
    if (this.isInitialized) return
    
    // Verificar se localStorage está disponível
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage não disponível')
      return
    }
    
    // Inicializar dados se necessário
    if (!localStorage.getItem(this.STORAGE_KEYS.REMINDERS)) {
      localStorage.setItem(this.STORAGE_KEYS.REMINDERS, JSON.stringify([]))
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.APPOINTMENTS)) {
      localStorage.setItem(this.STORAGE_KEYS.APPOINTMENTS, JSON.stringify([]))
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(this.STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]))
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.NOTIFICATION_SETTINGS)) {
      localStorage.setItem(this.STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify([]))
    }
    
    this.isInitialized = true
    console.log('LocalStorageDB initialized successfully')
  }

  private getRemindersFromStorage(): Reminder[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.REMINDERS)
    return data ? JSON.parse(data) : []
  }

  private setRemindersToStorage(reminders: Reminder[]) {
    localStorage.setItem(this.STORAGE_KEYS.REMINDERS, JSON.stringify(reminders))
  }

  private getAppointmentsFromStorage(): Appointment[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.APPOINTMENTS)
    return data ? JSON.parse(data) : []
  }

  private setAppointmentsToStorage(appointments: Appointment[]) {
    localStorage.setItem(this.STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments))
  }

  private getAuditLogsFromStorage(): AuditLog[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.AUDIT_LOGS)
    return data ? JSON.parse(data) : []
  }

  private setAuditLogsToStorage(logs: AuditLog[]) {
    localStorage.setItem(this.STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs))
  }

  async getReminders(): Promise<Reminder[]> {
    await this.initialize()
    const reminders = this.getRemindersFromStorage()
    return reminders.sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
  }

  async getReminder(id: string): Promise<Reminder | null> {
    await this.initialize()
    const reminders = this.getRemindersFromStorage()
    return reminders.find(r => r.id === id) || null
  }

  async createReminder(reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>): Promise<Reminder> {
    await this.initialize()
    
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      ...reminder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const reminders = this.getRemindersFromStorage()
    reminders.push(newReminder)
    this.setRemindersToStorage(reminders)
    
    // Registrar no histórico
    await this.logAudit('CREATE', 'reminder', newReminder.id, `Criou lembrete: ${reminder.title}`, reminder)
    
    return newReminder
  }

  async updateReminder(id: string, updates: Partial<Omit<Reminder, 'id' | 'created_at' | 'updated_at'>>): Promise<Reminder> {
    await this.initialize()
    
    const reminders = this.getRemindersFromStorage()
    const index = reminders.findIndex(r => r.id === id)
    
    if (index === -1) {
      throw new Error('Reminder not found')
    }
    
    const oldReminder = reminders[index]
    const updatedReminder: Reminder = {
      ...oldReminder,
      ...updates,
      updated_at: new Date().toISOString()
    } as Reminder
    
    reminders[index] = updatedReminder
    this.setRemindersToStorage(reminders)
    
    // Registrar no histórico com detalhes do que mudou
    const changes: Record<string, { old: any, new: any }> = {}
    
    Object.keys(updates).forEach(key => {
      const oldValue = (oldReminder as any)[key]
      const newValue = (updates as any)[key]
      
      if (oldValue !== newValue) {
        changes[key] = { old: oldValue, new: newValue }
      }
    })
    
    await this.logAudit('UPDATE', 'reminder', id, `Atualizou lembrete: ${updatedReminder.title}`, changes)
    
    return updatedReminder
  }

  async deleteReminder(id: string): Promise<void> {
    await this.initialize()
    
    const reminders = this.getRemindersFromStorage()
    const reminder = reminders.find(r => r.id === id)
    
    if (!reminder) {
      throw new Error('Reminder not found')
    }
    
    const filteredReminders = reminders.filter(r => r.id !== id)
    this.setRemindersToStorage(filteredReminders)
    
    // Registrar no histórico
    await this.logAudit('DELETE', 'reminder', id, `Deletou lembrete: ${reminder.title}`, reminder)
  }

  async getAppointments(): Promise<Appointment[]> {
    await this.initialize()
    const appointments = this.getAppointmentsFromStorage()
    return appointments.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    await this.initialize()
    const appointments = this.getAppointmentsFromStorage()
    return appointments.find(a => a.id === id) || null
  }

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    await this.initialize()
    
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      ...appointment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const appointments = this.getAppointmentsFromStorage()
    appointments.push(newAppointment)
    this.setAppointmentsToStorage(appointments)
    
    // Registrar no histórico
    await this.logAudit('CREATE', 'appointment', newAppointment.id, `Criou compromisso: ${appointment.title}`, appointment)
    
    return newAppointment
  }

  async updateAppointment(id: string, updates: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>): Promise<Appointment> {
    await this.initialize()
    
    const appointments = this.getAppointmentsFromStorage()
    const index = appointments.findIndex(a => a.id === id)
    
    if (index === -1) {
      throw new Error('Appointment not found')
    }
    
    const oldAppointment = appointments[index]
    const updatedAppointment: Appointment = {
      ...oldAppointment,
      ...updates,
      updated_at: new Date().toISOString()
    } as Appointment
    
    appointments[index] = updatedAppointment
    this.setAppointmentsToStorage(appointments)
    
    // Registrar no histórico com detalhes do que mudou
    const changes: Record<string, { old: any, new: any }> = {}
    
    Object.keys(updates).forEach(key => {
      const oldValue = (oldAppointment as any)[key]
      const newValue = (updates as any)[key]
      
      if (oldValue !== newValue) {
        changes[key] = { old: oldValue, new: newValue }
      }
    })
    
    await this.logAudit('UPDATE', 'appointment', id, `Atualizou compromisso: ${updatedAppointment.title}`, changes)
    
    return updatedAppointment
  }

  async deleteAppointment(id: string): Promise<void> {
    await this.initialize()
    
    const appointments = this.getAppointmentsFromStorage()
    const appointment = appointments.find(a => a.id === id)
    
    if (!appointment) {
      throw new Error('Appointment not found')
    }
    
    const filteredAppointments = appointments.filter(a => a.id !== id)
    this.setAppointmentsToStorage(filteredAppointments)
    
    // Registrar no histórico
    await this.logAudit('DELETE', 'appointment', id, `Deletou compromisso: ${appointment.title}`, appointment)
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    await this.initialize()
    const logs = this.getAuditLogsFromStorage()
    return logs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }

  async deleteAuditLog(id: string): Promise<void> {
    await this.initialize()
    
    const logs = this.getAuditLogsFromStorage()
    const filteredLogs = logs.filter(l => l.id !== id)
    this.setAuditLogsToStorage(filteredLogs)
  }

  async deleteAllAuditLogs(): Promise<void> {
    await this.initialize()
    this.setAuditLogsToStorage([])
  }

  private async logAudit(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: 'reminder' | 'appointment',
    entityId: string,
    description: string,
    metadata: any
  ): Promise<void> {
    await this.initialize()
    
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      operation,
      entity,
      entity_id: entityId,
      description,
      metadata,
      created_at: new Date().toISOString()
    }
    
    const logs = this.getAuditLogsFromStorage()
    logs.push(newLog)
    this.setAuditLogsToStorage(logs)
  }

  // Métodos para configurações de notificação
  private getNotificationSettingsFromStorage(): NotificationSettings[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.NOTIFICATION_SETTINGS)
    return data ? JSON.parse(data) : []
  }

  private setNotificationSettingsToStorage(settings: NotificationSettings[]) {
    localStorage.setItem(this.STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings))
  }

  async getNotificationSettings(itemId: string, itemType: 'reminder' | 'appointment'): Promise<NotificationSettings | null> {
    await this.initialize()
    const settings = this.getNotificationSettingsFromStorage()
    return settings.find(s => s.itemId === itemId && s.itemType === itemType) || null
  }

  async saveNotificationSettings(
    itemId: string, 
    itemType: 'reminder' | 'appointment',
    enableNotification: boolean,
    enableSound: boolean,
    enableVibration: boolean
  ): Promise<NotificationSettings> {
    await this.initialize()
    
    const settings = this.getNotificationSettingsFromStorage()
    const existingIndex = settings.findIndex(s => s.itemId === itemId && s.itemType === itemType)
    
    const now = new Date().toISOString()
    
    if (existingIndex !== -1) {
      // Atualizar configuração existente
      const existingSetting = settings[existingIndex]
      if (!existingSetting) {
        throw new Error('Existing setting not found')
      }
      
      const updatedSetting: NotificationSettings = {
        id: existingSetting.id,
        itemId: existingSetting.itemId,
        itemType: existingSetting.itemType,
        enableNotification,
        enableSound,
        enableVibration,
        created_at: existingSetting.created_at,
        updated_at: now
      }
      
      settings[existingIndex] = updatedSetting
      this.setNotificationSettingsToStorage(settings)
      return updatedSetting
    } else {
      // Criar nova configuração
      const newSetting: NotificationSettings = {
        id: crypto.randomUUID(),
        itemId,
        itemType,
        enableNotification,
        enableSound,
        enableVibration,
        created_at: now,
        updated_at: now
      }
      
      settings.push(newSetting)
      this.setNotificationSettingsToStorage(settings)
      return newSetting
    }
  }

  async deleteNotificationSettings(itemId: string, itemType: 'reminder' | 'appointment'): Promise<void> {
    await this.initialize()
    
    const settings = this.getNotificationSettingsFromStorage()
    const filteredSettings = settings.filter(s => !(s.itemId === itemId && s.itemType === itemType))
    this.setNotificationSettingsToStorage(filteredSettings)
  }

  async deleteAllNotificationSettings(): Promise<void> {
    await this.initialize()
    this.setNotificationSettingsToStorage([])
  }

  async close() {
    // localStorage não precisa de close
    this.isInitialized = false
  }
}

// Instância singleton
const localStorageDB = new LocalStorageDB()

export function useLocalStorageDB() {
  return {
    initialize: () => localStorageDB.initialize(),
    getReminders: () => localStorageDB.getReminders(),
    getReminder: (id: string) => localStorageDB.getReminder(id),
    createReminder: (reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>) => 
      localStorageDB.createReminder(reminder),
    updateReminder: (id: string, updates: Partial<Omit<Reminder, 'id' | 'created_at' | 'updated_at'>>) =>
      localStorageDB.updateReminder(id, updates),
    deleteReminder: (id: string) => localStorageDB.deleteReminder(id),
    
    getAppointments: () => localStorageDB.getAppointments(),
    getAppointment: (id: string) => localStorageDB.getAppointment(id),
    createAppointment: (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) =>
      localStorageDB.createAppointment(appointment),
    updateAppointment: (id: string, updates: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>) =>
      localStorageDB.updateAppointment(id, updates),
    deleteAppointment: (id: string) => localStorageDB.deleteAppointment(id),
    
    getAuditLogs: (limit?: number) => localStorageDB.getAuditLogs(limit),
    deleteAuditLog: (id: string) => localStorageDB.deleteAuditLog(id),
    deleteAllAuditLogs: () => localStorageDB.deleteAllAuditLogs(),
    
    // Métodos para configurações de notificação
    getNotificationSettings: (itemId: string, itemType: 'reminder' | 'appointment') =>
      localStorageDB.getNotificationSettings(itemId, itemType),
    saveNotificationSettings: (
      itemId: string, 
      itemType: 'reminder' | 'appointment',
      enableNotification: boolean,
      enableSound: boolean,
      enableVibration: boolean
    ) => localStorageDB.saveNotificationSettings(itemId, itemType, enableNotification, enableSound, enableVibration),
    deleteNotificationSettings: (itemId: string, itemType: 'reminder' | 'appointment') =>
      localStorageDB.deleteNotificationSettings(itemId, itemType),
    deleteAllNotificationSettings: () => localStorageDB.deleteAllNotificationSettings(),
    
    close: () => localStorageDB.close()
  }
}
