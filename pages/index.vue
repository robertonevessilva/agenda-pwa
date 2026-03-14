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
          + Lembrete
        </button>
        <button class="btn" @click="openAppointmentForm()">
          + Compromisso
        </button>
      </div>
      <button class="btn btn-full" @click="navigateTo('/history')">
        📋 Histórico
      </button>
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

    <!-- Formulário de Lembrete -->
    <div v-if="showReminderForm" class="card" :id="editingReminder ? 'edit-reminder-form' : 'new-reminder-form'">
      <h2>{{ editingReminder ? 'Alterar Lembrete' : 'Novo Lembrete' }}</h2>
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

    <!-- Formulário de Compromisso -->
    <div v-if="showAppointmentForm" class="card" :id="editingAppointment ? 'edit-appointment-form' : 'new-appointment-form'">
      <h2>{{ editingAppointment ? 'Alterar Compromisso' : 'Novo Compromisso' }}</h2>
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
              👁️<span class="btn-text"> Visualizar</span>
            </button>
            <button class="btn btn-icon" @click="editReminder(reminder)" title="Alterar">
              ✏️<span class="btn-text"> Alterar</span>
            </button>
            <button class="btn btn-icon" @click="toggleReminderDone(reminder)" :title="reminder.done ? 'Desmarcar' : 'Concluir'">
              {{ reminder.done ? '↩️' : '✓' }}<span class="btn-text"> {{ reminder.done ? 'Desmarcar' : 'Concluir' }}</span>
            </button>
            <button class="btn btn-icon btn-danger" @click="deleteReminder(reminder.id)" title="Excluir">
              🗑️<span class="btn-text"> Excluir</span>
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
              👁️<span class="btn-text"> Visualizar</span>
            </button>
            <button class="btn btn-icon" @click="editAppointment(appointment)" title="Alterar">
              ✏️<span class="btn-text"> Alterar</span>
            </button>
            <button class="btn btn-icon" @click="toggleAppointmentDone(appointment)" :title="appointment.done ? 'Desmarcar' : 'Concluir'">
              {{ appointment.done ? '↩️' : '✓' }}<span class="btn-text"> {{ appointment.done ? 'Desmarcar' : 'Concluir' }}</span>
            </button>
            <button class="btn btn-icon btn-danger" @click="deleteAppointment(appointment.id)" title="Excluir">
              🗑️<span class="btn-text"> Excluir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAgendaStore } from '~/stores/agenda'

const agendaStore = useAgendaStore()

// Estados do formulário
const showReminderForm = ref(false)
const showAppointmentForm = ref(false)
const editingReminder = ref(null)
const editingAppointment = ref(null)

// Estados dos modais
const showViewModal = ref(false)
const showConfirmModal = ref(false)
const viewModalData = ref({})
const confirmMessage = ref('')
const itemToDelete = ref({ id: null, type: null })

// Filtro de visualização
const viewFilter = ref('all')

// Dados dos formulários
const newReminder = ref({
  title: '',
  remind_at: '',
  priority: 'MEDIUM',
  notes: ''
})

const newAppointment = ref({
  title: '',
  starts_at: '',
  ends_at: '',
  location: '',
  notes: ''
})

// Computed properties
const filteredReminders = computed(() => {
  const reminders = [...agendaStore.reminders]
    .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
  
  if (viewFilter.value === 'reminders' || viewFilter.value === 'all') {
    return reminders
  }
  return []
})

const filteredAppointments = computed(() => {
  const appointments = [...agendaStore.appointments]
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  
  if (viewFilter.value === 'appointments' || viewFilter.value === 'all') {
    return appointments
  }
  return []
})

// Inicialização
onMounted(async () => {
  await agendaStore.initialize()
})

// Funções utilitárias
function formatDateTime(dateTime) {
  const date = new Date(dateTime)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function isPastDate(dateTime) {
  return new Date(dateTime) < new Date()
}

// Funções de Lembretes
function openReminderForm(reminder = null) {
  if (reminder) {
    editingReminder.value = reminder.id
    newReminder.value = {
      title: reminder.title,
      remind_at: reminder.remind_at.slice(0, 16), // Formato datetime-local
      priority: reminder.priority,
      notes: reminder.notes || ''
    }
  } else {
    editingReminder.value = null
    newReminder.value = {
      title: '',
      remind_at: '',
      priority: 'MEDIUM',
      notes: ''
    }
  }
  showReminderForm.value = true
}

function cancelReminderForm() {
  showReminderForm.value = false
  editingReminder.value = null
  newReminder.value = {
    title: '',
    remind_at: '',
    priority: 'MEDIUM',
    notes: ''
  }
}

async function createReminder() {
  try {
    await agendaStore.createReminder({
      title: newReminder.value.title,
      remind_at: newReminder.value.remind_at,
      priority: newReminder.value.priority,
      notes: newReminder.value.notes || undefined
    })
    
    cancelReminderForm()
  } catch (error) {
    console.error('Error creating reminder:', error)
  }
}

async function updateExistingReminder() {
  try {
    await agendaStore.updateReminder(editingReminder.value, {
      title: newReminder.value.title,
      remind_at: newReminder.value.remind_at,
      priority: newReminder.value.priority,
      notes: newReminder.value.notes || undefined
    })
    
    cancelReminderForm()
  } catch (error) {
    console.error('Error updating reminder:', error)
  }
}

function editReminder(reminder) {
  openReminderForm(reminder)
  // Rolar para o formulário após um pequeno delay para garantir que ele foi renderizado
  setTimeout(() => {
    const formElement = document.getElementById('edit-reminder-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}

function viewReminderDetails(reminder) {
  viewModalData.value = {
    ...reminder,
    type: 'reminder'
  }
  showViewModal.value = true
}

async function toggleReminderDone(reminder) {
  try {
    await agendaStore.updateReminder(reminder.id, {
      done: !reminder.done
    })
  } catch (error) {
    console.error('Error updating reminder:', error)
  }
}

async function deleteReminder(id) {
  itemToDelete.value = { id, type: 'reminder' }
  confirmMessage.value = 'Tem certeza que deseja excluir este lembrete?'
  showConfirmModal.value = true
}

// Funções de Compromissos
function openAppointmentForm(appointment = null) {
  if (appointment) {
    editingAppointment.value = appointment.id
    newAppointment.value = {
      title: appointment.title,
      starts_at: appointment.starts_at.slice(0, 16),
      ends_at: appointment.ends_at ? appointment.ends_at.slice(0, 16) : '',
      location: appointment.location || '',
      notes: appointment.notes || ''
    }
  } else {
    editingAppointment.value = null
    newAppointment.value = {
      title: '',
      starts_at: '',
      ends_at: '',
      location: '',
      notes: ''
    }
  }
  showAppointmentForm.value = true
}

function cancelAppointmentForm() {
  showAppointmentForm.value = false
  editingAppointment.value = null
  newAppointment.value = {
    title: '',
    starts_at: '',
    ends_at: '',
    location: '',
    notes: ''
  }
}

async function createAppointment() {
  try {
    await agendaStore.createAppointment({
      title: newAppointment.value.title,
      starts_at: newAppointment.value.starts_at,
      ends_at: newAppointment.value.ends_at || undefined,
      location: newAppointment.value.location || undefined,
      notes: newAppointment.value.notes || undefined
    })
    
    cancelAppointmentForm()
  } catch (error) {
    console.error('Error creating appointment:', error)
  }
}

async function updateExistingAppointment() {
  try {
    await agendaStore.updateAppointment(editingAppointment.value, {
      title: newAppointment.value.title,
      starts_at: newAppointment.value.starts_at,
      ends_at: newAppointment.value.ends_at || undefined,
      location: newAppointment.value.location || undefined,
      notes: newAppointment.value.notes || undefined
    })
    
    cancelAppointmentForm()
  } catch (error) {
    console.error('Error updating appointment:', error)
  }
}

function editAppointment(appointment) {
  openAppointmentForm(appointment)
  // Rolar para o formulário após um pequeno delay para garantir que ele foi renderizado
  setTimeout(() => {
    const formElement = document.getElementById('edit-appointment-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}

function viewAppointmentDetails(appointment) {
  viewModalData.value = {
    ...appointment,
    type: 'appointment'
  }
  showViewModal.value = true
}

async function toggleAppointmentDone(appointment) {
  try {
    await agendaStore.updateAppointment(appointment.id, {
      done: !appointment.done
    })
  } catch (error) {
    console.error('Error updating appointment:', error)
  }
}

async function deleteAppointment(id) {
  itemToDelete.value = { id, type: 'appointment' }
  confirmMessage.value = 'Tem certeza que deseja excluir este compromisso?'
  showConfirmModal.value = true
}

// Funções dos modais
function closeViewModal() {
  showViewModal.value = false
  viewModalData.value = {}
}

function closeConfirmModal() {
  showConfirmModal.value = false
  itemToDelete.value = { id: null, type: null }
  confirmMessage.value = ''
}

async function confirmDelete() {
  const { id, type } = itemToDelete.value
  
  try {
    if (type === 'reminder') {
      await agendaStore.deleteReminder(id)
    } else if (type === 'appointment') {
      await agendaStore.deleteAppointment(id)
    }
  } catch (error) {
    console.error('Error deleting item:', error)
  } finally {
    closeConfirmModal()
  }
}

function navigateTo(path) {
  window.location.href = path
}
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

header.card {
  background: linear-gradient(135deg, #1976d2, #2196f3);
  color: white;
}

h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
}

.subtitle {
  margin: 0 0 20px 0;
  opacity: 0.9;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 32px;
  font-weight: bold;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.actions-row {
  display: flex;
  gap: 12px;
}

.btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  flex: 1;
  transition: background 0.3s;
}

.btn-full {
  width: 100%;
}

.btn-icon {
  padding: 8px;
  min-width: 40px;
}

.btn-icon .btn-text {
  display: inline;
}

.btn:hover {
  background: #1565c0;
}

.btn-danger {
  background: #f44336;
}

.btn-danger:hover {
  background: #d32f2f;
}

.btn-view {
  background: #4caf50;
}

.btn-view:hover {
  background: #388e3c;
}

.filters {
  margin-bottom: 20px;
}

.filter-options {
  display: flex;
  gap: 20px;
  margin-top: 12px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-count {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.empty-message {
  text-align: center;
  color: #666;
  padding: 40px 0;
}

.item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.item.past-date {
  border-left: 4px solid #ff9800;
  background: #fff3e0;
}

.item.done-item {
  opacity: 0.7;
  background: #f5f5f5;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-header h3 {
  margin: 0;
  font-size: 18px;
}

.item-header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.priority-high {
  background: #ffebee;
  color: #c62828;
}

.priority-medium {
  background: #fff3e0;
  color: #ef6c00;
}

.priority-low {
  background: #e8f5e9;
  color: #2e7d32;
}

.done-badge {
  background: #4caf50;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.past-badge {
  background: #ff9800;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.location {
  color: #666;
  font-size: 14px;
}

.item-time {
  color: #666;
  margin: 8px 0;
  font-size: 14px;
}

.item-notes {
  color: #555;
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.5;
}

.item-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.item-actions .btn {
  flex: none;
  padding: 8px 12px;
  font-size: 14px;
}

.error {
  background: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
}

/* Estilos dos Modais */
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
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 20px;
}

.modal-field {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-field strong {
  color: #666;
  font-size: 14px;
}

.modal-field span {
  font-size: 16px;
}

.modal-notes {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
  margin-top: 8px;
  white-space: pre-wrap;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 600px) {
  .stats {
    flex-direction: row;
    gap: 8px;
  }
  
  .stat {
    flex: 1;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .actions-row {
    flex-direction: row;
  }
  
  .btn {
    padding: 10px 12px;
    font-size: 14px;
  }
  
  .btn-icon {
    padding: 6px;
    min-width: 36px;
  }
  
  .btn-icon .btn-text {
    display: none;
  }
  
  .filter-options {
    flex-direction: column;
    gap: 12px;
  }
  
  .item-actions {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .item-actions .btn {
    width: auto;
    flex: 1;
    margin: 2px;
  }
  
  .item-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .item-header-right {
    margin-top: 8px;
    flex-wrap: wrap;
  }
  
  .modal-content {
    max-width: 100%;
    margin: 0;
  }
  
  .modal-header {
    padding: 16px;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .modal-footer {
    padding: 16px;
    flex-direction: column;
  }
  
  .modal-footer .btn {
    width: 100%;
  }
}
</style>
