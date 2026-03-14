import { defineStore } from 'pinia'
import { useLocalStorageDB } from '~/composables/useLocalStorageDB'

export type ReminderPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Reminder {
  id: string
  title: string
  notes: string | null
  remind_at: string
  done: boolean
  priority: ReminderPriority
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
      title: string
      remind_at: string
      notes?: string
      priority?: ReminderPriority
    }) {
      this.isLoading = true
      this.error = null

      try {
        const db = useLocalStorageDB()
        const reminder = await db.createReminder({
          title: payload.title,
          notes: payload.notes || null,
          remind_at: payload.remind_at,
          done: false,
          priority: payload.priority || 'MEDIUM'
        })

        this.reminders.push(reminder)
        await this.loadAuditLogs()
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
        title: string
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
      title: string
      starts_at: string
      ends_at?: string
      location?: string
      notes?: string
    }) {
      this.isLoading = true
      this.error = null

      try {
        const db = useLocalStorageDB()
        const appointment = await db.createAppointment({
          title: payload.title,
          location: payload.location || null,
          notes: payload.notes || null,
          starts_at: payload.starts_at,
          ends_at: payload.ends_at || null,
          done: false
        })

        this.appointments.push(appointment)
        await this.loadAuditLogs()
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
        title: string
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