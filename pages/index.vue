<template>
  <div class="container">
    <header class="card">
      <h1>📅 Agenda</h1>
      <p class="subtitle">Agenda offline para celular</p>
      
      <div class="stats">
        <div class="stat">
          <span class="stat-number">{{ filteredReminders.length }}</span>
          <span class="stat-label">Lembretes</span>
        </div>
        <div class="stat">
          <span class="stat-number">{{ filteredAppointments.length }}</span>
          <span class="stat-label">Compromissos</span>
        </div>
        <div class="stat">
          <span class="stat-number">{{ agendaStore.auditLogs.length }}</span>
          <span class="stat-label">Histórico</span>
        </div>
      </div>
    </header>

    <div class="actions">
      <div class="actions-row">
        <button class="btn" @click="openReminderForm()">
          Lembrete
        </button>
        <button class="btn" @click="openAppointmentForm()">
          Compromisso
        </button>
        <button class="btn" @click="navigateToHistory()">
          📋 Histórico
        </button>
      </div>
      
      
    </div>

    <!-- Notificação Toast -->
    <div v-if="showNotification" class="notification-toast" :class="`notification-${notificationType}`">
      <div class="notification-content">
        <span class="notification-icon">
          <span v-if="notificationType === 'info'">ℹ️</span>
          <span v-if="notificationType === 'success'">✅</span>
          <span v-if="notificationType === 'warning'">⚠️</span>
          <span v-if="notificationType === 'error'">❌</span>
        </span>
        <span class="notification-message">{{ notificationMessage }}</span>
      </div>
      <button class="notification-close" @click="showNotification = false">×</button>
    </div>

    <!-- Filtros -->
    <div class="card filters">
      <h3>Filtrar por:</h3>
      <div class="filter-options">
        <label class="filter-option">
          <input type="radio" v-model="viewFilter" value="all" />
          <span>Todos</span>
        </label>
        <label class="filter-option">
          <input type="radio" v-model="viewFilter" value="reminders" />
          <span>Apenas Lembretes</span>
        </label>
        <label class="filter-option">
          <input type="radio" v-model="viewFilter" value="appointments" />
          <span>Apenas Compromissos</span>
        </label>
      </div>
    </div>

    <div v-if="agendaStore.isLoading" class="card">
      <p>Carregando...</p>
    </div>

    <div v-if="agendaStore.error" class="card error">
      <p>Erro: {{ agendaStore.error }}</p>
    </div>

    <!-- Modal de Formulário de Lembrete -->
    <div v-if="showReminderForm" class="modal-overlay" @click="cancelReminderForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingReminder ? 'Alterar Lembrete' : 'Novo Lembrete' }}</h2>
          <button class="modal-close" @click="cancelReminderForm">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="editingReminder ? updateExistingReminder() : createReminder()">
            <div class="form-group">
              <label for="reminder-title">Título *</label>
              <input
                id="reminder-title"
                v-model="newReminder.title"
                type="text"
                required
                placeholder="Ex: Pagar conta de luz"
              />
            </div>
            
            <div class="form-group">
              <label for="reminder-date">Data e Hora *</label>
              <input
                id="reminder-date"
                v-model="newReminder.remind_at"
                type="datetime-local"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="reminder-priority">Prioridade</label>
              <select id="reminder-priority" v-model="newReminder.priority">
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="reminder-notes">Notas</label>
              <textarea
                id="reminder-notes"
                v-model="newReminder.notes"
                placeholder="Detalhes adicionais..."
              />
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newReminder.enableNotification" />
                <span>🔔 Ativar notificação no horário do lembrete</span>
              </label>
            </div>
            
            <div class="form-group" v-if="newReminder.enableNotification">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newReminder.enableSound" />
                <span>🔊 Ativar som de alarme</span>
              </label>
            </div>
            
            <div class="form-group" v-if="newReminder.enableNotification">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newReminder.enableVibration" />
                <span>📳 Ativar vibração (se suportado)</span>
              </label>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn" @click="cancelReminderForm()">
                Cancelar
              </button>
              <button type="submit" class="btn">
                {{ editingReminder ? 'Atualizar' : 'Salvar' }} Lembrete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de Formulário de Compromisso -->
    <div v-if="showAppointmentForm" class="modal-overlay" @click="cancelAppointmentForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingAppointment ? 'Alterar Compromisso' : 'Novo Compromisso' }}</h2>
          <button class="modal-close" @click="cancelAppointmentForm">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="editingAppointment ? updateExistingAppointment() : createAppointment()">
            <div class="form-group">
              <label for="appointment-title">Título *</label>
              <input
                id="appointment-title"
                v-model="newAppointment.title"
                type="text"
                required
                placeholder="Ex: Reunião com cliente"
              />
            </div>
            
            <div class="form-group">
              <label for="appointment-start">Início *</label>
              <input
                id="appointment-start"
                v-model="newAppointment.starts_at"
                type="datetime-local"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="appointment-end">Fim (opcional)</label>
              <input
                id="appointment-end"
                v-model="newAppointment.ends_at"
                type="datetime-local"
              />
            </div>
            
            <div class="form-group">
              <label for="appointment-location">Local</label>
              <input
                id="appointment-location"
                v-model="newAppointment.location"
                type="text"
                placeholder="Ex: Sala de reuniões"
              />
            </div>
            
            <div class="form-group">
              <label for="appointment-notes">Notas</label>
              <textarea
                id="appointment-notes"
                v-model="newAppointment.notes"
                placeholder="Detalhes do compromisso..."
              />
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newAppointment.enableNotification" />
                <span>🔔 Ativar notificação no horário do compromisso</span>
              </label>
            </div>
            
            <div class="form-group" v-if="newAppointment.enableNotification">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newAppointment.enableSound" />
                <span>🔊 Ativar som de alarme</span>
              </label>
            </div>
            
            <div class="form-group" v-if="newAppointment.enableNotification">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newAppointment.enableVibration" />
                <span>📳 Ativar vibração (se suportado)</span>
              </label>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn" @click="cancelAppointmentForm()">
                Cancelar
              </button>
              <button type="submit" class="btn">
                {{ editingAppointment ? 'Atualizar' : 'Salvar' }} Compromisso
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de Visualização -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ viewModalData.type === 'reminder' ? '📌 Lembrete' : '🎯 Compromisso' }}</h2>
          <button class="modal-close" @click="closeViewModal">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-field">
            <strong>Título:</strong>
            <span>{{ viewModalData.title }}</span>
          </div>
          
          <div v-if="viewModalData.type === 'reminder'" class="modal-field">
            <strong>Data e Hora:</strong>
            <span>{{ formatDateTime(viewModalData.remind_at) }}</span>
          </div>
          
          <div v-if="viewModalData.type === 'appointment'" class="modal-field">
            <strong>Início:</strong>
            <span>{{ formatDateTime(viewModalData.starts_at) }}</span>
          </div>
          
          <div v-if="viewModalData.type === 'appointment' && viewModalData.ends_at" class="modal-field">
            <strong>Fim:</strong>
            <span>{{ formatDateTime(viewModalData.ends_at) }}</span>
          </div>
          
          <div v-if="viewModalData.type === 'appointment' && viewModalData.location" class="modal-field">
            <strong>Local:</strong>
            <span>{{ viewModalData.location }}</span>
          </div>
          
          <div v-if="viewModalData.type === 'reminder'" class="modal-field">
            <strong>Prioridade:</strong>
            <span>{{ viewModalData.priority === 'HIGH' ? 'Alta' : viewModalData.priority === 'MEDIUM' ? 'Média' : 'Baixa' }}</span>
          </div>
          
          <div class="modal-field">
            <strong>Status:</strong>
            <span>{{ viewModalData.done ? '✓ Concluído' : '⏰ Pendente' }}</span>
          </div>
          
          <div v-if="viewModalData.notes" class="modal-field">
            <strong>Notas:</strong>
            <p class="modal-notes">{{ viewModalData.notes }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="closeViewModal">Fechar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Confirmar Exclusão</h2>
          <button class="modal-close" @click="closeConfirmModal">×</button>
        </div>
        <div class="modal-body">
          <p>{{ confirmMessage }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="closeConfirmModal">Cancelar</button>
          <button class="btn btn-danger" @click="confirmDelete">Excluir</button>
        </div>
      </div>
    </div>

    <!-- Lista de Lembretes -->
    <div v-if="viewFilter !== 'appointments'" class="card">
      <div class="section-header">
        <h2>📌 Lembretes</h2>
        <span class="section-count">{{ filteredReminders.length }} item(s)</span>
      </div>
      
      <div v-if="filteredReminders.length === 0">
        <p class="empty-message">Nenhum lembrete cadastrado.</p>
      </div>
      
      <div v-else>
        <div 
          v-for="reminder in filteredReminders" 
          :key="reminder.id" 
          class="item"
          :class="{ 'past-date': isPastDate(reminder.remind_at), 'done-item': reminder.done }"
        >
          <div class="item-header">
            <h3>{{ reminder.title }}</h3>
            <div class="item-header-right">
              <span :class="`priority-badge priority-${reminder.priority.toLowerCase()}`">
                {{ reminder.priority === 'HIGH' ? 'Alta' : reminder.priority === 'MEDIUM' ? 'Média' : 'Baixa' }}
              </span>
              <span v-if="reminder.done" class="done-badge">✓ Concluído</span>
              <span v-if="isPastDate(reminder.remind_at) && !reminder.done" class="past-badge">⏰ Atrasado</span>
            </div>
          </div>
          
          <p class="item-time">
            ⏰ {{ formatDateTime(reminder.remind_at) }}
          </p>
          
          <p v-if="reminder.notes" class="item-notes">{{ reminder.notes }}</p>
          
          <div class="item-actions">
            <button class="btn btn-icon btn-view" @click="viewReminderDetails(reminder)" title="Visualizar">
              👁️
            </button>
            <button class="btn btn-icon" @click="editReminder(reminder)" title="Alterar">
              ✏️
            </button>
            <button class="btn btn-icon" @click="toggleReminderDone(reminder)" :title="reminder.done ? 'Desmarcar' : 'Concluir'">
              {{ reminder.done ? '↩️' : '✓' }}
            </button>
            <button class="btn btn-icon btn-danger" @click="deleteReminder(reminder.id)" title="Excluir">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de Compromissos -->
    <div v-if="viewFilter !== 'reminders'" class="card">
      <div class="section-header">
        <h2>🎯 Compromissos</h2>
        <span class="section-count">{{ filteredAppointments.length }} item(s)</span>
      </div>
      
      <div v-if="filteredAppointments.length === 0">
        <p class="empty-message">Nenhum compromisso cadastrado.</p>
      </div>
      
      <div v-else>
        <div 
          v-for="appointment in filteredAppointments" 
          :key="appointment.id" 
          class="item"
          :class="{ 'past-date': isPastDate(appointment.starts_at), 'done-item': appointment.done }"
        >
          <div class="item-header">
            <h3>{{ appointment.title }}</h3>
            <div class="item-header-right">
              <span v-if="appointment.location" class="location">
                📍 {{ appointment.location }}
              </span>
              <span v-if="appointment.done" class="done-badge">✓ Concluído</span>
              <span v-if="isPastDate(appointment.starts_at) && !appointment.done" class="past-badge">⏰ Atrasado</span>
            </div>
          </div>
          
          <p class="item-time">
            ⏰ {{ formatDateTime(appointment.starts_at) }}
            <span v-if="appointment.ends_at">
              até {{ formatDateTime(appointment.ends_at) }}
            </span>
          </p>
          
          <p v-if="appointment.notes" class="item-notes">{{ appointment.notes }}</p>
          
          <div class="item-actions">
            <button class="btn btn-icon btn-view" @click="viewAppointmentDetails(appointment)" title="Visualizar">
              👁️
            </button>
            <button class="btn btn-icon" @click="editAppointment(appointment)" title="Alterar">
              ✏️
            </button>
            <button class="btn btn-icon" @click="toggleAppointmentDone(appointment)" :title="appointment.done ? 'Desmarcar' : 'Concluir'">
              {{ appointment.done ? '↩️' : '✓' }}
            </button>
            <button class="btn btn-icon btn-danger" @click="deleteAppointment(appointment.id)" title="Excluir">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAgendaStore } from '~/stores/agenda'
import { useNotifications } from '~/composables/useNotifications'

const router = useRouter()
const agendaStore = useAgendaStore()
const notifications = useNotifications()

// Estado do formulário
const showReminderForm = ref(false)
const showAppointmentForm = ref(false)
const editingReminder = ref<any>(null)
const editingAppointment = ref<any>(null)

// Novos itens
const newReminder = ref({
  title: '',
  remind_at: '',
  priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
  notes: '',
  enableNotification: true,
  enableSound: true,
  enableVibration: true
})

const newAppointment = ref({
  title: '',
  starts_at: '',
  ends_at: '',
  location: '',
  notes: '',
  enableNotification: true,
  enableSound: true,
  enableVibration: true
})

// Filtros
const viewFilter = ref<'all' | 'reminders' | 'appointments'>('all')

// Modais
const showViewModal = ref(false)
const showConfirmModal = ref(false)
const viewModalData = ref<any>(null)
const confirmMessage = ref('')
const itemToDelete = ref<{type: 'reminder' | 'appointment', id: string} | null>(null)

// Notificações toast
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'info' | 'success' | 'warning' | 'error'>('info')


// Computed
const filteredReminders = computed(() => {
  if (viewFilter.value === 'appointments') return []
  return agendaStore.reminders
})

const filteredAppointments = computed(() => {
  if (viewFilter.value === 'reminders') return []
  return agendaStore.appointments
})

// Métodos
const openReminderForm = () => {
  resetReminderForm()
  showReminderForm.value = true
  showAppointmentForm.value = false
}

const openAppointmentForm = () => {
  resetAppointmentForm()
  showAppointmentForm.value = true
  showReminderForm.value = false
}

const resetReminderForm = () => {
  newReminder.value = {
    title: '',
    remind_at: '',
    priority: 'MEDIUM',
    notes: '',
    enableNotification: true,
    enableSound: true,
    enableVibration: true
  }
  editingReminder.value = null
}

const resetAppointmentForm = () => {
  newAppointment.value = {
    title: '',
    starts_at: '',
    ends_at: '',
    location: '',
    notes: '',
    enableNotification: true,
    enableSound: true,
    enableVibration: true
  }
  editingAppointment.value = null
}

const editReminder = async (reminder: any) => {
  editingReminder.value = reminder
  
  // Buscar configurações de notificação salvas
  const notificationSettings = await agendaStore.getReminderNotificationSettings(reminder.id)
  
  newReminder.value = {
    title: reminder.title,
    remind_at: reminder.remind_at.slice(0, 16), // Formato datetime-local
    priority: reminder.priority,
    notes: reminder.notes || '',
    enableNotification: notificationSettings.enableNotification,
    enableSound: notificationSettings.enableSound,
    enableVibration: notificationSettings.enableVibration
  }
  showReminderForm.value = true
  showAppointmentForm.value = false
}

const editAppointment = async (appointment: any) => {
  editingAppointment.value = appointment
  
  // Buscar configurações de notificação salvas
  const notificationSettings = await agendaStore.getAppointmentNotificationSettings(appointment.id)
  
  newAppointment.value = {
    title: appointment.title,
    starts_at: appointment.starts_at.slice(0, 16),
    ends_at: appointment.ends_at ? appointment.ends_at.slice(0, 16) : '',
    location: appointment.location || '',
    notes: appointment.notes || '',
    enableNotification: notificationSettings.enableNotification,
    enableSound: notificationSettings.enableSound,
    enableVibration: notificationSettings.enableVibration
  }
  showAppointmentForm.value = true
  showReminderForm.value = false
}

const createReminder = async () => {
  try {
    const reminder = await agendaStore.createReminder({
      title: newReminder.value.title,
      remind_at: newReminder.value.remind_at,
      notes: newReminder.value.notes,
      priority: newReminder.value.priority,
      enableNotification: newReminder.value.enableNotification,
      enableSound: newReminder.value.enableSound,
      enableVibration: newReminder.value.enableVibration
    })
    
    showNotificationMessage('Lembrete criado com sucesso!', 'success')
    resetReminderForm()
    showReminderForm.value = false
  } catch (error) {
    showNotificationMessage('Erro ao criar lembrete', 'error')
  }
}

const updateExistingReminder = async () => {
  if (!editingReminder.value) return
  
  try {
    await agendaStore.updateReminderWithNotificationSettings(
      editingReminder.value.id,
      {
        title: newReminder.value.title,
        remind_at: newReminder.value.remind_at,
        notes: newReminder.value.notes,
        priority: newReminder.value.priority
      },
      {
        enableNotification: newReminder.value.enableNotification,
        enableSound: newReminder.value.enableSound,
        enableVibration: newReminder.value.enableVibration
      }
    )
    
    // Cancelar notificações antigas e agendar novas se ativado
    await agendaStore.cancelNotificationForItem(editingReminder.value.id)
    if (newReminder.value.enableNotification) {
      const reminder = agendaStore.getReminderById(editingReminder.value.id)
      if (reminder) {
        await agendaStore.scheduleNotificationForReminder(reminder)
      }
    }
    
    showNotificationMessage('Lembrete atualizado com sucesso!', 'success')
    resetReminderForm()
    showReminderForm.value = false
  } catch (error) {
    showNotificationMessage('Erro ao atualizar lembrete', 'error')
  }
}

const createAppointment = async () => {
  try {
    const appointment = await agendaStore.createAppointment({
      title: newAppointment.value.title,
      starts_at: newAppointment.value.starts_at,
      ends_at: newAppointment.value.ends_at || undefined,
      location: newAppointment.value.location,
      notes: newAppointment.value.notes,
      enableNotification: newAppointment.value.enableNotification,
      enableSound: newAppointment.value.enableSound,
      enableVibration: newAppointment.value.enableVibration
    })
    
    showNotificationMessage('Compromisso criado com sucesso!', 'success')
    resetAppointmentForm()
    showAppointmentForm.value = false
  } catch (error) {
    showNotificationMessage('Erro ao criar compromisso', 'error')
  }
}

const updateExistingAppointment = async () => {
  if (!editingAppointment.value) return
  
  try {
    await agendaStore.updateAppointmentWithNotificationSettings(
      editingAppointment.value.id,
      {
        title: newAppointment.value.title,
        starts_at: newAppointment.value.starts_at,
        ends_at: newAppointment.value.ends_at || null,
        location: newAppointment.value.location,
        notes: newAppointment.value.notes
      },
      {
        enableNotification: newAppointment.value.enableNotification,
        enableSound: newAppointment.value.enableSound,
        enableVibration: newAppointment.value.enableVibration
      }
    )
    
    // Cancelar notificações antigas e agendar novas se ativado
    await agendaStore.cancelNotificationForItem(editingAppointment.value.id)
    if (newAppointment.value.enableNotification) {
      const appointment = agendaStore.getAppointmentById(editingAppointment.value.id)
      if (appointment) {
        await agendaStore.scheduleNotificationForAppointment(appointment)
      }
    }
    
    showNotificationMessage('Compromisso atualizado com sucesso!', 'success')
    resetAppointmentForm()
    showAppointmentForm.value = false
  } catch (error) {
    showNotificationMessage('Erro ao atualizar compromisso', 'error')
  }
}

const cancelReminderForm = () => {
  resetReminderForm()
  showReminderForm.value = false
}

const cancelAppointmentForm = () => {
  resetAppointmentForm()
  showAppointmentForm.value = false
}

const deleteReminder = (id: string) => {
  itemToDelete.value = { type: 'reminder', id }
  confirmMessage.value = 'Tem certeza que deseja excluir este lembrete?'
  showConfirmModal.value = true
}

const deleteAppointment = (id: string) => {
  itemToDelete.value = { type: 'appointment', id }
  confirmMessage.value = 'Tem certeza que deseja excluir este compromisso?'
  showConfirmModal.value = true
}

const confirmDelete = async () => {
  if (!itemToDelete.value) return
  
  try {
    if (itemToDelete.value.type === 'reminder') {
      await agendaStore.deleteReminder(itemToDelete.value.id)
    } else {
      await agendaStore.deleteAppointment(itemToDelete.value.id)
    }
    
    // Cancelar notificações do item excluído
    await agendaStore.cancelNotificationForItem(itemToDelete.value.id)
    
    showNotificationMessage('Item excluído com sucesso!', 'success')
  } catch (error) {
    showNotificationMessage('Erro ao excluir item', 'error')
  } finally {
    closeConfirmModal()
  }
}

const toggleReminderDone = async (reminder: any) => {
  try {
    await agendaStore.updateReminder(reminder.id, {
      done: !reminder.done
    })
    
    // Se marcado como concluído, cancelar notificações
    if (!reminder.done) {
      await agendaStore.cancelNotificationForItem(reminder.id)
    }
    
    showNotificationMessage(`Lembrete ${reminder.done ? 'desmarcado' : 'concluído'}!`, 'success')
  } catch (error) {
    showNotificationMessage('Erro ao atualizar lembrete', 'error')
  }
}

const toggleAppointmentDone = async (appointment: any) => {
  try {
    await agendaStore.updateAppointment(appointment.id, {
      done: !appointment.done
    })
    
    // Se marcado como concluído, cancelar notificações
    if (!appointment.done) {
      await agendaStore.cancelNotificationForItem(appointment.id)
    }
    
    showNotificationMessage(`Compromisso ${appointment.done ? 'desmarcado' : 'concluído'}!`, 'success')
  } catch (error) {
    showNotificationMessage('Erro ao atualizar compromisso', 'error')
  }
}

const viewReminderDetails = (reminder: any) => {
  viewModalData.value = {
    ...reminder,
    type: 'reminder'
  }
  showViewModal.value = true
}

const viewAppointmentDetails = (appointment: any) => {
  viewModalData.value = {
    ...appointment,
    type: 'appointment'
  }
  showViewModal.value = true
}

const closeViewModal = () => {
  showViewModal.value = false
  viewModalData.value = null
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
  confirmMessage.value = ''
  itemToDelete.value = null
}

const navigateToHistory = () => {
  router.push('/history')
}

const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isPastDate = (dateTime: string) => {
  return new Date(dateTime) < new Date()
}

const showNotificationMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  notificationMessage.value = message
  notificationType.value = type
  showNotification.value = true
  
  setTimeout(() => {
    showNotification.value = false
  }, 5000)
}



// Inicializar
onMounted(async () => {
  await agendaStore.initialize()
  
  // Agendar notificações para itens existentes
  setTimeout(() => {
    agendaStore.scheduleAllNotifications()
  }, 2000)
})
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

header.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

h1 {
  margin: 0 0 10px 0;
  font-size: 2.5rem;
}

.subtitle {
  margin: 0 0 20px 0;
  opacity: 0.9;
}

.stats {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.stat {
  text-align: center;
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.actions {
  margin-bottom: 20px;
}

.actions-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
  flex: 1;
  min-width: 120px;
}

.btn:hover {
  background: #5a67d8;
  transform: translateY(-2px);
}

.btn-debug {
  background: #718096;
  margin-top: 10px;
}

.btn-debug:hover {
  background: #4a5568;
}

.btn-icon {
  padding: 8px 12px;
  font-size: 0.9rem;
  min-width: auto;
  flex: none;
}

.btn-text {
  margin-left: 5px;
}

.btn-view {
  background: #4299e1;
}

.btn-view:hover {
  background: #3182ce;
}

.btn-danger {
  background: #f56565;
}

.btn-danger:hover {
  background: #e53e3e;
}

.notification-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 8px;
  padding: 15px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
  max-width: 400px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-info {
  border-left: 4px solid #4299e1;
}

.notification-success {
  border-left: 4px solid #48bb78;
}

.notification-warning {
  border-left: 4px solid #ed8936;
}

.notification-error {
  border-left: 4px solid #f56565;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #718096;
  padding: 0 0 0 10px;
}

.filters {
  margin-bottom: 20px;
}

.filter-options {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.filter-option input {
  margin: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-count {
  background: #e2e8f0;
  color: #4a5568;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9rem;
}

.item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  transition: all 0.2s;
}

.item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.item-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #2d3748;
}

.item-header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.priority-low {
  background: #c6f6d5;
  color: #22543d;
}

.priority-medium {
  background: #fed7d7;
  color: #742a2a;
}

.priority-high {
  background: #fed7d7;
  color: #742a2a;
}

.done-badge {
  background: #c6f6d5;
  color: #22543d;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.past-badge {
  background: #fed7d7;
  color: #742a2a;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.location {
  background: #bee3f8;
  color: #2c5282;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.item-time {
  margin: 5px 0;
  color: #718096;
  font-size: 0.9rem;
}

.item-notes {
  margin: 10px 0;
  color: #4a5568;
  font-size: 0.95rem;
  line-height: 1.4;
}

.item-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.empty-message {
  text-align: center;
  color: #718096;
  padding: 20px;
}

.past-date {
  opacity: 0.7;
  border-color: #fed7d7;
}

.done-item {
  opacity: 0.6;
  border-color: #c6f6d5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #718096;
}

.modal-body {
  margin-bottom: 20px;
}

.modal-field {
  margin-bottom: 15px;
}

.modal-field strong {
  display: block;
  margin-bottom: 5px;
  color: #4a5568;
}

.modal-notes {
  margin: 10px 0;
  padding: 10px;
  background: #f7fafc;
  border-radius: 6px;
  border-left: 3px solid #4299e1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #4a5568;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input {
  width: auto;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.error {
  background: #fed7d7;
  border-color: #fc8181;
  color: #742a2a;
}

/* Estilos para notificações push */
.push-notifications-section {
  margin-top: 20px;
  padding: 15px;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.push-notifications-section h3 {
  margin: 0 0 15px 0;
  color: #4a5568;
  font-size: 1.1rem;
}

.btn-push {
  background: #48bb78;
  margin-top: 10px;
}

.btn-push:hover {
  background: #38a169;
}

.btn-push.btn-secondary {
  background: #4299e1;
}

.btn-push.btn-secondary:hover {
  background: #3182ce;
}

.btn-push.btn-danger {
  background: #f56565;
}

.btn-push.btn-danger:hover {
  background: #e53e3e;
}

.push-description {
  margin: 10px 0 0 0;
  color: #718096;
  font-size: 0.9rem;
  line-height: 1.4;
}

.push-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  padding: 10px;
  background: #c6f6d5;
  border-radius: 6px;
  color: #22543d;
}

.push-status-icon {
  font-size: 1.2rem;
}

.push-status-text {
  font-weight: 500;
}

.push-not-supported {
  color: #ed8936;
  padding: 10px;
  background: #fed7d7;
  border-radius: 6px;
  text-align: center;
}
</style>
