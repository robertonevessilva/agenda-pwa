import { defineStore } from 'pinia'
import { useLocalStorageDB } from '~/composables/useLocalStorageDB'
import { useNotifications } from '~/composables/useNotifications'

export type ReminderPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Reminder {
  id: string
  notes: string
  remind_at: string
  done: boolean
  priority: ReminderPriority
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  notes: string
  location: string | null
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
  metadata: {
    nota: string
    data_hora: string
    criado: string
    atualizado: string
  }
  created_at: string
  updated_at: string
}

export const useAgendaStore = defineStore('agenda', {
  state: () => ({
    reminders: [] as Reminder[],
    appointments: [] as Appointment[],
    auditLogs: [] as AuditLog[],
    isLoading: false,
    error: null as string | null
  }),

  actions: {
    async initialize() {
      try {
        const db = useLocalStorageDB()
        await db.initialize()
        await this.loadAllData()
      } catch (error) {
        console.error('Failed to initialize agenda store:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
      }
    },

    async loadAllData() {
      this.isLoading = true
      this.error = null

      try {
        console.log('🔄 Carregando todos os dados da agenda...')
        const db = useLocalStorageDB()
        const [reminders, appointments, auditLogs] = await Promise.all([
          db.getReminders(),
          db.getAppointments(),
          db.getAuditLogs(50)
        ])

        console.log(`📊 Dados carregados: ${reminders.length} lembretes, ${appointments.length} compromissos, ${auditLogs.length} logs`)
        console.log('📋 Audit logs:', auditLogs)

        this.reminders = reminders
        this.appointments = appointments
        this.auditLogs = auditLogs
      } catch (error) {
        console.error('❌ Failed to load data:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.isLoading = false
      }
    },

    async createReminder(payload: {
      notes: string
      remind_at: string
      priority?: ReminderPriority
      enableNotification?: boolean
      enableSound?: boolean
      enableVibration?: boolean
    }) {
      this.isLoading = true
      this.error = null

      try {
        const db = useLocalStorageDB()
        const reminder = await db.createReminder({
          notes: payload.notes,
          remind_at: payload.remind_at,
          done: false,
          priority: payload.priority || 'MEDIUM'
        })

        this.reminders.push(reminder)
        await this.loadAuditLogs()
        
        // Salvar configurações de notificação
        if (payload.enableNotification !== undefined) {
          await db.saveNotificationSettings(
            reminder.id,
            'reminder',
            payload.enableNotification,
            payload.enableSound ?? true,
            payload.enableVibration ?? true
          )
        }
        
        // Agendar notificação se ativada
        if (payload.enableNotification !== false) {
          await this.scheduleNotificationForReminder(reminder)
        }
        
        return reminder
      } catch (error) {
        console.error('Failed to create reminder:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateReminder(
      id: string,
      payload: Partial<{
        notes: string
        remind_at: string
        priority: ReminderPriority
        done: boolean
      }>
    ) {
      this.isLoading = true
      this.error = null

      try {
        const db = useLocalStorageDB()
        const reminder = await db.updateReminder(id, payload)

        const index = this.reminders.findIndex(r => r.id === id)
        if (index !== -1) {
          this.reminders[index] = reminder
        }

        await this.loadAuditLogs()
        return reminder
      } catch (error) {
        console.error('Failed to update reminder:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteReminder(id: string) {
      this.isLoading = true
      this.error = null

      try {
        const db = useLocalStorageDB()
        await db.deleteReminder(id)

        this.reminders = this.reminders.filter(r => r.id !== id)
        await this.loadAuditLogs()
      } catch (error) {
        console.error('Failed to delete reminder:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createAppointment(payload: {
      notes: string
      starts_at: string
      ends_at?: string
      location?: string
      enableNotification?: boolean
      enableSound?: boolean
      enableVibration?: boolean
    }) {
      this.isLoading = true
      this.error = null

      try {
        const db = useLocalStorageDB()
        const appointment = await db.createAppointment({
          notes: payload.notes,
          location: payload.location || null,
          starts_at: payload.starts_at,
          ends_at: payload.ends_at || null,
          done: false
        })

        this.appointments.push(appointment)
        await this.loadAuditLogs()
        
        // Salvar configurações de notificação
        if (payload.enableNotification !== undefined) {
          await db.saveNotificationSettings(
            appointment.id,
            'appointment',
            payload.enableNotification,
            payload.enableSound ?? true,
            payload.enableVibration ?? true
          )
        }
        
        // Agendar notificação se ativada
        if (payload.enableNotification !== false) {
          await this.scheduleNotificationForAppointment(appointment)
        }
        
        return appointment
      } catch (error) {
        console.error('Failed to create appointment:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateAppointment(
      id: string,
      payload: Partial<{
        location: string
        notes: string
        starts_at: string
        ends_at: string
        done: boolean
      }>
    ) {
      this.isLoading = true
      this.error = null

      try {
        const db = useLocalStorageDB()
        const appointment = await db.updateAppointment(id, payload)

        const index = this.appointments.findIndex(a => a.id === id)
        if (index !== -1) {
          this.appointments[index] = appointment
        }

        await this.loadAuditLogs()
        return appointment
      } catch (error) {
        console.error('Failed to update appointment:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteAppointment(id: string) {
      this.isLoading = true
      this.error = null

      try {
        const db = useLocalStorageDB()
        await db.deleteAppointment(id)

        this.appointments = this.appointments.filter(a => a.id !== id)
        await this.loadAuditLogs()
      } catch (error) {
        console.error('Failed to delete appointment:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async loadAuditLogs(limit = 50) {
      try {
        const db = useLocalStorageDB()
        this.auditLogs = await db.getAuditLogs(limit)
      } catch (error) {
        console.error('Failed to load audit logs:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
      }
    },

    async deleteAuditLog(id: string) {
      try {
        const db = useLocalStorageDB()
        await db.deleteAuditLog(id)
        this.auditLogs = this.auditLogs.filter(log => log.id !== id)
      } catch (error) {
        console.error('Failed to delete audit log:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      }
    },

    async deleteAllAuditLogs() {
      try {
        const db = useLocalStorageDB()
        await db.deleteAllAuditLogs()
        this.auditLogs = []
      } catch (error) {
        console.error('Failed to delete all audit logs:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      }
    },

    // Métodos para gerenciar notificações
    async scheduleNotificationForReminder(reminder: Reminder) {
      try {
        const notifications = useNotifications()
        const scheduledTime = new Date(reminder.remind_at)
        
        // Agendar notificação no horário exato (não antes)
        return notifications.scheduleNotification(
          'reminder',
          reminder.id,
          reminder.notes,
          scheduledTime
        )
      } catch (error) {
        console.error('Failed to schedule notification for reminder:', error)
        return null
      }
    },

    async scheduleNotificationForAppointment(appointment: Appointment) {
      try {
        const notifications = useNotifications()
        const scheduledTime = new Date(appointment.starts_at)
        
        // Agendar notificação no horário exato (não antes)
        return notifications.scheduleNotification(
          'appointment',
          appointment.id,
          appointment.notes,
          scheduledTime
        )
      } catch (error) {
        console.error('Failed to schedule notification for appointment:', error)
        return null
      }
    },

    async cancelNotificationForItem(itemId: string) {
      try {
        const notifications = useNotifications()
        notifications.cancelAllNotificationsForItem(itemId)
      } catch (error) {
        console.error('Failed to cancel notification for item:', error)
      }
    },

    async scheduleAllNotifications() {
      try {
        const notifications = useNotifications()
        
        // Cancelar todas as notificações existentes
        notifications.clearAllScheduledNotifications()
        
        // Agendar notificações para lembretes pendentes
        const upcomingReminders = this.getUpcomingReminders(100)
        for (const reminder of upcomingReminders) {
          await this.scheduleNotificationForReminder(reminder)
        }
        
        // Agendar notificações para compromissos pendentes
        const upcomingAppointments = this.getUpcomingAppointments(100)
        for (const appointment of upcomingAppointments) {
          await this.scheduleNotificationForAppointment(appointment)
        }
        
        console.log(`📅 Notificações agendadas: ${upcomingReminders.length} lembretes, ${upcomingAppointments.length} compromissos`)
      } catch (error) {
        console.error('Failed to schedule all notifications:', error)
      }
    },

    async testNotification() {
      try {
        const notifications = useNotifications()
        
        // Solicitar permissão se necessário
        if (!notifications.isPermissionGranted.value) {
          await notifications.requestPermission()
        }
        
        // Testar notificação
        await notifications.showNotification({
          title: '🔔 Teste de Notificação',
          body: 'Esta é uma notificação de teste da Agenda PWA!',
          icon: '/icon-192.png',
          vibrate: [200, 100, 200],
          requireInteraction: true
        })
        
        console.log('✅ Notificação de teste enviada')
      } catch (error) {
        console.error('Failed to test notification:', error)
      }
    },

    // Métodos para recuperar configurações de notificação
    async getReminderNotificationSettings(id: string) {
      try {
        const db = useLocalStorageDB()
        const settings = await db.getNotificationSettings(id, 'reminder')
        return settings || {
          enableNotification: true,
          enableSound: true,
          enableVibration: true
        }
      } catch (error) {
        console.error('Failed to get reminder notification settings:', error)
        return {
          enableNotification: true,
          enableSound: true,
          enableVibration: true
        }
      }
    },

    async getAppointmentNotificationSettings(id: string) {
      try {
        const db = useLocalStorageDB()
        const settings = await db.getNotificationSettings(id, 'appointment')
        return settings || {
          enableNotification: true,
          enableSound: true,
          enableVibration: true
        }
      } catch (error) {
        console.error('Failed to get appointment notification settings:', error)
        return {
          enableNotification: true,
          enableSound: true,
          enableVibration: true
        }
      }
    },

    async updateReminderWithNotificationSettings(
      id: string,
      payload: Partial<{
        notes: string
        remind_at: string
        priority: ReminderPriority
        done: boolean
      }>,
      notificationSettings?: {
        enableNotification: boolean
        enableSound: boolean
        enableVibration: boolean
      }
    ) {
      this.isLoading = true
      this.error = null

      try {
        const db = useLocalStorageDB()
        const reminder = await db.updateReminder(id, payload)

        const index = this.reminders.findIndex(r => r.id === id)
        if (index !== -1) {
          this.reminders[index] = reminder
        }

        // Atualizar configurações de notificação se fornecidas
        if (notificationSettings) {
          await db.saveNotificationSettings(
            id,
            'reminder',
            notificationSettings.enableNotification,
            notificationSettings.enableSound,
            notificationSettings.enableVibration
          )
        }

        await this.loadAuditLogs()
        return reminder
      } catch (error) {
        console.error('Failed to update reminder with notification settings:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateAppointmentWithNotificationSettings(
      id: string,
      payload: Partial<{
        location: string
        notes: string
        starts_at: string
        ends_at: string
        done: boolean
      }>,
      notificationSettings?: {
        enableNotification: boolean
        enableSound: boolean
        enableVibration: boolean
      }
    ) {
      this.isLoading = true
      this.error = null

      try {
        const db = useLocalStorageDB()
        const appointment = await db.updateAppointment(id, payload)

        const index = this.appointments.findIndex(a => a.id === id)
        if (index !== -1) {
          this.appointments[index] = appointment
        }

        // Atualizar configurações de notificação se fornecidas
        if (notificationSettings) {
          await db.saveNotificationSettings(
            id,
            'appointment',
            notificationSettings.enableNotification,
            notificationSettings.enableSound,
            notificationSettings.enableVibration
          )
        }

        await this.loadAuditLogs()
        return appointment
      } catch (error) {
        console.error('Failed to update appointment with notification settings:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    getReminderById(id: string): Reminder | undefined {
      return this.reminders.find(r => r.id === id)
    },

    getAppointmentById(id: string): Appointment | undefined {
      return this.appointments.find(a => a.id === id)
    },

    getUpcomingReminders(limit = 10): Reminder[] {
      const now = new Date().toISOString()
      return this.reminders
        .filter(r => !r.done && r.remind_at > now)
        .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
        .slice(0, limit)
    },

    getUpcomingAppointments(limit = 10): Appointment[] {
      const now = new Date().toISOString()
      return this.appointments
        .filter(a => !a.done && a.starts_at > now)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        .slice(0, limit)
    },

    getTodayReminders(): Reminder[] {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      return this.reminders.filter(r => {
        const remindDate = new Date(r.remind_at)
        return remindDate >= today && remindDate < tomorrow
      })
    },

    getTodayAppointments(): Appointment[] {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      return this.appointments.filter(a => {
        const startDate = new Date(a.starts_at)
        return startDate >= today && startDate < tomorrow
      })
    }
  }
})