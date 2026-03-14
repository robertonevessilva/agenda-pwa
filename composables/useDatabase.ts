import { PGlite } from '@electric-sql/pglite'

// Verificar se estamos no browser
const isBrowser = typeof window !== 'undefined'

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

class DatabaseService {
  private db: PGlite | null = null
  private isInitialized = false

  async initialize() {
    if (this.isInitialized) return

    try {
      // Verificar se estamos no browser
      if (typeof window === 'undefined') {
        console.warn('Database initialization skipped in SSR')
        return
      }

      // Inicializar o banco de dados PGlite com configuração mínima
      // Usando apenas o parâmetro dataDir como string
      this.db = new PGlite('idb://agenda-db')
      
      // Aguardar inicialização
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Criar tabelas
      await this.createTables()
      
      this.isInitialized = true
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize PGlite database:', error)
      console.warn('Application will continue with limited functionality')
      // A aplicação continuará, mas o banco não estará disponível
      this.isInitialized = true // Marcar como inicializado para evitar loops
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized')

    // Criar tabela de lembretes
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        notes TEXT,
        remind_at TIMESTAMP NOT NULL,
        done BOOLEAN DEFAULT FALSE,
        priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH')) DEFAULT 'MEDIUM',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de compromissos
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        location TEXT,
        notes TEXT,
        starts_at TIMESTAMP NOT NULL,
        ends_at TIMESTAMP,
        done BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de histórico de ações
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        operation TEXT NOT NULL CHECK(operation IN ('CREATE', 'UPDATE', 'DELETE')),
        entity TEXT NOT NULL CHECK(entity IN ('reminder', 'appointment')),
        entity_id TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar índices para melhor performance
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at)')
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_reminders_done ON reminders(done)')
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments(starts_at)')
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_appointments_done ON appointments(done)')
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)')
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id)')
  }

  async getReminders(): Promise<Reminder[]> {
    if (!this.db) throw new Error('Database not initialized')
    const result = await this.db.query('SELECT * FROM reminders ORDER BY remind_at ASC')
    return result.rows as Reminder[]
  }

  async getReminder(id: string): Promise<Reminder | null> {
    if (!this.db) throw new Error('Database not initialized')
    const result = await this.db.query('SELECT * FROM reminders WHERE id = $1', [id])
    return result.rows[0] as Reminder || null
  }

  async createReminder(reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>): Promise<Reminder> {
    if (!this.db) throw new Error('Database not initialized')
    
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    await this.db.query(
      `INSERT INTO reminders (id, title, notes, remind_at, done, priority, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, reminder.title, reminder.notes, reminder.remind_at, reminder.done, reminder.priority, now, now]
    )

    // Registrar no histórico
    await this.logAudit('CREATE', 'reminder', id, `Criou lembrete: ${reminder.title}`, reminder)

    return this.getReminder(id) as Promise<Reminder>
  }

  async updateReminder(id: string, updates: Partial<Omit<Reminder, 'id' | 'created_at' | 'updated_at'>>): Promise<Reminder> {
    if (!this.db) throw new Error('Database not initialized')
    
    const fields = []
    const values = []
    let paramCount = 1

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    }

    if (fields.length === 0) {
      return this.getReminder(id) as Promise<Reminder>
    }

    // Adicionar updated_at
    fields.push(`updated_at = $${paramCount}`)
    values.push(new Date().toISOString())
    paramCount++

    values.push(id)

    await this.db.query(
      `UPDATE reminders SET ${fields.join(', ')} WHERE id = $${paramCount}`,
      values
    )

    // Registrar no histórico
    const reminder = await this.getReminder(id)
    await this.logAudit('UPDATE', 'reminder', id, `Atualizou lembrete: ${reminder?.title}`, updates)

    return reminder as Reminder
  }

  async deleteReminder(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    // Obter dados antes de deletar para o histórico
    const reminder = await this.getReminder(id)
    
    await this.db.query('DELETE FROM reminders WHERE id = $1', [id])

    // Registrar no histórico
    if (reminder) {
      await this.logAudit('DELETE', 'reminder', id, `Deletou lembrete: ${reminder.title}`, reminder)
    }
  }

  async getAppointments(): Promise<Appointment[]> {
    if (!this.db) throw new Error('Database not initialized')
    const result = await this.db.query('SELECT * FROM appointments ORDER BY starts_at ASC')
    return result.rows as Appointment[]
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    if (!this.db) throw new Error('Database not initialized')
    const result = await this.db.query('SELECT * FROM appointments WHERE id = $1', [id])
    return result.rows[0] as Appointment || null
  }

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    if (!this.db) throw new Error('Database not initialized')
    
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    await this.db.query(
      `INSERT INTO appointments (id, title, location, notes, starts_at, ends_at, done, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, appointment.title, appointment.location, appointment.notes, 
       appointment.starts_at, appointment.ends_at, appointment.done, now, now]
    )

    // Registrar no histórico
    await this.logAudit('CREATE', 'appointment', id, `Criou compromisso: ${appointment.title}`, appointment)

    return this.getAppointment(id) as Promise<Appointment>
  }

  async updateAppointment(id: string, updates: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>): Promise<Appointment> {
    if (!this.db) throw new Error('Database not initialized')
    
    const fields = []
    const values = []
    let paramCount = 1

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    }

    if (fields.length === 0) {
      return this.getAppointment(id) as Promise<Appointment>
    }

    // Adicionar updated_at
    fields.push(`updated_at = $${paramCount}`)
    values.push(new Date().toISOString())
    paramCount++

    values.push(id)

    await this.db.query(
      `UPDATE appointments SET ${fields.join(', ')} WHERE id = $${paramCount}`,
      values
    )

    // Registrar no histórico
    const appointment = await this.getAppointment(id)
    await this.logAudit('UPDATE', 'appointment', id, `Atualizou compromisso: ${appointment?.title}`, updates)

    return appointment as Appointment
  }

  async deleteAppointment(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    // Obter dados antes de deletar para o histórico
    const appointment = await this.getAppointment(id)
    
    await this.db.query('DELETE FROM appointments WHERE id = $1', [id])

    // Registrar no histórico
    if (appointment) {
      await this.logAudit('DELETE', 'appointment', id, `Deletou compromisso: ${appointment.title}`, appointment)
    }
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    if (!this.db) throw new Error('Database not initialized')
    const result = await this.db.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1',
      [limit]
    )
    return result.rows as AuditLog[]
  }

  private async logAudit(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: 'reminder' | 'appointment',
    entityId: string,
    description: string,
    metadata: any
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const id = crypto.randomUUID()
    
    await this.db.query(
      `INSERT INTO audit_logs (id, operation, entity, entity_id, description, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, operation, entity, entityId, description, metadata, new Date().toISOString()]
    )
  }

  async close() {
    if (this.db) {
      await this.db.close()
      this.db = null
      this.isInitialized = false
    }
  }
}

// Instância singleton do serviço de banco de dados
const databaseService = new DatabaseService()

export function useDatabase() {
  return {
    initialize: () => databaseService.initialize(),
    getReminders: () => databaseService.getReminders(),
    getReminder: (id: string) => databaseService.getReminder(id),
    createReminder: (reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>) => 
      databaseService.createReminder(reminder),
    updateReminder: (id: string, updates: Partial<Omit<Reminder, 'id' | 'created_at' | 'updated_at'>>) =>
      databaseService.updateReminder(id, updates),
    deleteReminder: (id: string) => databaseService.deleteReminder(id),
    
    getAppointments: () => databaseService.getAppointments(),
    getAppointment: (id: string) => databaseService.getAppointment(id),
    createAppointment: (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) =>
      databaseService.createAppointment(appointment),
    updateAppointment: (id: string, updates: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>) =>
      databaseService.updateAppointment(id, updates),
    deleteAppointment: (id: string) => databaseService.deleteAppointment(id),
    
    getAuditLogs: (limit?: number) => databaseService.getAuditLogs(limit),
    
    close: () => databaseService.close()
  }
}