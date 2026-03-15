<template>
  <div class="container">
    <header class="card">
      <h1>📋 Histórico de Ações</h1>
      <p class="subtitle">Registro completo de todas as operações realizadas</p>
      
      <div class="header-actions">
        <button class="btn" @click="goBack">
          ← Voltar
        </button>
      </div>
    </header>

    <div v-if="agendaStore.isLoading" class="card">
      <p>Carregando histórico...</p>
    </div>

    <div v-if="agendaStore.error" class="card error">
      <p>Erro: {{ agendaStore.error }}</p>
    </div>

    <div class="filters card">
      <div class="filters-header">
        <h3>Filtros</h3>
      </div>
      <div class="filter-group">
        <div class="filter">
          <label for="filter-operation">Operação:</label>
          <select id="filter-operation" v-model="filters.operation">
            <option value="">Todas</option>
            <option value="CREATE">Criação</option>
            <option value="UPDATE">Atualização</option>
            <option value="DELETE">Exclusão</option>
          </select>
        </div>
        
        <div class="filter">
          <label for="filter-entity">Entidade:</label>
          <select id="filter-entity" v-model="filters.entity">
            <option value="">Todas</option>
            <option value="reminder">Lembretes</option>
            <option value="appointment">Compromissos</option>
          </select>
        </div>
        
        <div class="filter">
          <label for="filter-month">Mês:</label>
          <input
            id="filter-month"
            v-model="filters.month"
            type="month"
            @change="applyMonthFilter"
          />
        </div>
        
        <div class="filter">
          <label for="filter-search">Buscar:</label>
          <input
            id="filter-search"
            v-model="filters.search"
            type="text"
            placeholder="Buscar por descrição..."
          />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-header">
        <div v-if="filteredLogs.length > 0" class="section-actions">
          <button class="btn btn-small" @click="refreshHistory" title="Atualizar histórico">
            🔄 Atualizar
          </button>
          <button class="btn btn-small" @click="clearFilters">
            Limpar Filtros
          </button>
          <button class="btn btn-small btn-danger" @click="confirmDeleteAll" title="Excluir todos os registros">
            🗑️ Excluir Todos
          </button>
        </div>
        <h2>Registros</h2>
      </div>
      
      <div class="records-count">
        <span class="count-number">{{ filteredLogs.length }}</span>
        <span class="count-label">registro(s) encontrado(s)</span>
      </div>
      
      <div v-if="filteredLogs.length === 0" class="empty-state">
        <p>Nenhum registro encontrado com os filtros atuais.</p>
      </div>
      
      <div v-else class="logs-grid">
        <div v-for="log in filteredLogs" :key="log.id" class="log-card">
          <div class="log-card-header">
            <div class="log-card-operation">
              <span :class="`operation-badge operation-${log.operation.toLowerCase()}`">
                {{ getOperationLabel(log.operation) }}
              </span>
              <span class="log-card-entity">
                {{ getEntityLabel(log.entity) }}
              </span>
            </div>
            <div class="log-card-time">
              {{ formatDateTime(log.created_at) }}
            </div>
          </div>
          
          <div class="log-card-body">
            <div class="log-card-description">
              {{ log.description }}
            </div>
            
            <div v-if="log.metadata" class="log-card-details">
              <div class="details-title">Detalhes:</div>
              <div class="details-content">
                <div v-for="(value, key) in parseMetadata(log.metadata)" :key="key" class="detail-item">
                  <span class="detail-key">{{ formatKey(key) }}:</span>
                  <span class="detail-value">{{ formatValue(key, value) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="log-card-footer">
            <button class="btn btn-icon btn-danger" @click="confirmDeleteLog(log)" title="Excluir">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação para Excluir Individual -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Confirmar Exclusão</h2>
          <button class="modal-close" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <p>{{ deleteModalMessage }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="closeDeleteModal">Cancelar</button>
          <button class="btn btn-danger" @click="executeDelete">Excluir</button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação para Excluir Todos -->
    <div v-if="showDeleteAllModal" class="modal-overlay" @click="closeDeleteAllModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Confirmar Exclusão de Todos</h2>
          <button class="modal-close" @click="closeDeleteAllModal">×</button>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja excluir todos os {{ filteredLogs.length }} registros do histórico?</p>
          <p class="warning-text">⚠️ Esta ação não pode ser desfeita!</p>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="closeDeleteAllModal">Cancelar</button>
          <button class="btn btn-danger" @click="deleteAllLogs">Excluir Todos</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAgendaStore } from '~/stores/agenda'

const agendaStore = useAgendaStore()

const filters = ref({
  operation: '',
  entity: '',
  month: '',
  search: ''
})

const showDeleteModal = ref(false)
const showDeleteAllModal = ref(false)
const deleteModalMessage = ref('')
const logToDelete = ref(null)
const deleteAllType = ref('') // 'filtered' ou 'all'

const filteredLogs = computed(() => {
  let logs = [...agendaStore.auditLogs]
  
  // Filtro por operação
  if (filters.value.operation) {
    logs = logs.filter(log => log.operation === filters.value.operation)
  }
  
  // Filtro por entidade
  if (filters.value.entity) {
    logs = logs.filter(log => log.entity === filters.value.entity)
  }
  
  // Filtro por mês do agendamento
  if (filters.value.month) {
    const [year, month] = filters.value.month.split('-').map(Number)
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)
    
    logs = logs.filter(log => {
      try {
        const metadata = parseMetadata(log.metadata)
        
        // Para lembretes, usar remind_at
        if (log.entity === 'reminder') {
          let remindDate
          if (metadata.remind_at) {
            remindDate = new Date(metadata.remind_at)
          } else if (metadata.remind_at_old || metadata.remind_at_new) {
            const dateStr = metadata.remind_at_new || metadata.remind_at_old
            if (dateStr) {
              remindDate = new Date(dateStr)
            }
          }
          
          if (remindDate) {
            return remindDate >= startOfMonth && remindDate <= endOfMonth
          }
        }
        
        // Para compromissos, verificar se o intervalo entre starts_at e ends_at intersecta com o mês
        if (log.entity === 'appointment') {
          let startDate, endDate
          
          // Obter datas de início e fim
          if (metadata.starts_at && metadata.ends_at) {
            startDate = new Date(metadata.starts_at)
            endDate = new Date(metadata.ends_at)
          } else if (metadata.starts_at_old || metadata.starts_at_new || metadata.ends_at_old || metadata.ends_at_new) {
            // Se for um objeto de mudança, usar os valores disponíveis
            startDate = new Date(metadata.starts_at_new || metadata.starts_at_old || metadata.starts_at)
            endDate = new Date(metadata.ends_at_new || metadata.ends_at_old || metadata.ends_at)
          }
          
          if (startDate && endDate) {
            // Verificar se o intervalo intersecta com o mês
            return (startDate <= endOfMonth && endDate >= startOfMonth)
          } else if (startDate) {
            // Se só tiver startDate, verificar se está no mês
            return startDate >= startOfMonth && startDate <= endOfMonth
          }
        }
        
        return false
      } catch {
        return false
      }
    })
  }
  
  // Filtro por busca
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase()
    logs = logs.filter(log => 
      log.description.toLowerCase().includes(searchTerm) ||
      (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchTerm))
    )
  }
  
  // Ordenar por data do agendamento (remind_at para lembretes, starts_at para compromissos)
  return logs.sort((a, b) => {
    try {
      const metadataA = parseMetadata(a.metadata)
      const metadataB = parseMetadata(b.metadata)
      
      let dateA, dateB
      
      // Para lembretes, usar remind_at
      if (a.entity === 'reminder') {
        dateA = metadataA.remind_at || metadataA.remind_at_new || metadataA.remind_at_old || a.created_at
      } else if (a.entity === 'appointment') {
        dateA = metadataA.starts_at || metadataA.starts_at_new || metadataA.starts_at_old || a.created_at
      } else {
        dateA = a.created_at
      }
      
      if (b.entity === 'reminder') {
        dateB = metadataB.remind_at || metadataB.remind_at_new || metadataB.remind_at_old || b.created_at
      } else if (b.entity === 'appointment') {
        dateB = metadataB.starts_at || metadataB.starts_at_new || metadataB.starts_at_old || b.created_at
      } else {
        dateB = b.created_at
      }
      
      return new Date(dateB) - new Date(dateA)
    } catch {
      // Fallback para ordenação por data de criação
      return new Date(b.created_at) - new Date(a.created_at)
    }
  })
})

function getOperationLabel(operation) {
  const labels = {
    'CREATE': 'Criação',
    'UPDATE': 'Atualização',
    'DELETE': 'Exclusão'
  }
  return labels[operation] || operation
}

function getEntityLabel(entity) {
  const labels = {
    'reminder': 'Lembrete',
    'appointment': 'Compromisso'
  }
  return labels[entity] || entity
}

function formatDateTime(dateTime) {
  if (!dateTime) return ''
  
  try {
    const date = new Date(dateTime)
    if (isNaN(date.getTime())) return ''
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return ''
  }
}

function parseMetadata(metadata) {
  try {
    if (typeof metadata === 'string') {
      metadata = JSON.parse(metadata)
    }
    
    const result = {}
    
    // Processar cada campo do metadata
    Object.entries(metadata || {}).forEach(([key, value]) => {
      // Se o valor for um objeto com old/new, expandir para dois campos
      if (value && typeof value === 'object' && 'old' in value && 'new' in value) {
        result[`${key}_old`] = value.old
        result[`${key}_new`] = value.new
      } else {
        result[key] = value
      }
    })
    
    return result
  } catch {
    return {}
  }
}

function formatKey(key) {
  const keyMap = {
    'title': 'Título',
    'remind_at': 'Data e Hora',
    'starts_at': 'Início',
    'ends_at': 'Fim',
    'location': 'Local',
    'priority': 'Prioridade',
    'notes': 'Notas',
    'done': 'Status',
    'created_at': 'Criado em',
    'updated_at': 'Atualizado em'
  }
  
  // Lidar com campos _old e _new
  if (key.endsWith('_old')) {
    const baseKey = key.slice(0, -4)
    const baseLabel = keyMap[baseKey] || baseKey
    return `${baseLabel} (Anterior)`
  }
  
  if (key.endsWith('_new')) {
    const baseKey = key.slice(0, -4)
    const baseLabel = keyMap[baseKey] || baseKey
    return `${baseLabel} (Novo)`
  }
  
  return keyMap[key] || key
}

function formatValue(key, value) {
  // Se o valor for null, undefined ou string vazia, retorna vazio
  if (value === null || value === undefined || value === '') {
    return ''
  }
  
  if (key === 'done') {
    return value ? 'Concluído' : 'Pendente'
  }
  
  if (key === 'priority') {
    const priorityMap = {
      'HIGH': 'Alta',
      'MEDIUM': 'Média',
      'LOW': 'Baixa'
    }
    return priorityMap[value] || value
  }
  
  // Formatar datas
  if (key === 'remind_at' || key === 'starts_at' || key === 'ends_at' || 
      key === 'created_at' || key === 'updated_at') {
    return formatDateTime(value)
  }
  
  // Para objetos (como {old: ..., new: ...}), mostrar de forma mais legível
  if (typeof value === 'object') {
    // Se for um objeto de mudança (old/new), formatar separadamente
    if (value.old !== undefined && value.new !== undefined) {
      const oldVal = value.old === null || value.old === undefined || value.old === '' ? '(vazio)' : String(value.old)
      const newVal = value.new === null || value.new === undefined || value.new === '' ? '(vazio)' : String(value.new)
      return `${oldVal} → ${newVal}`
    }
    return JSON.stringify(value)
  }
  
  return String(value)
}

function applyDateFilter() {
  // Forçar atualização do filtro
}

function clearFilters() {
  filters.value = {
    operation: '',
    entity: '',
    month: '',
    search: ''
  }
}

function goBack() {
  // Tenta voltar no histórico, se não houver histórico, vai para a página inicial
  if (window.history.length > 1) {
    window.history.back()
  } else {
    window.location.href = '/'
  }
}

async function refreshHistory() {
  await agendaStore.loadAuditLogs(100)
}

// Funções para exclusão individual
function confirmDeleteLog(log) {
  logToDelete.value = log
  deleteModalMessage.value = `Tem certeza que deseja excluir este registro do histórico?\n\n${log.description}`
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  logToDelete.value = null
  deleteModalMessage.value = ''
}

async function executeDelete() {
  if (logToDelete.value) {
    try {
      await agendaStore.deleteAuditLog(logToDelete.value.id)
    } catch (error) {
      console.error('Erro ao excluir registro:', error)
    }
  }
  closeDeleteModal()
}

// Funções para exclusão de todos
function confirmDeleteAll() {
  if (filteredLogs.value.length === 0) {
    alert('Não há registros para excluir.')
    return
  }
  showDeleteAllModal.value = true
}

function closeDeleteAllModal() {
  showDeleteAllModal.value = false
}

async function deleteAllLogs() {
  try {
    // Excluir todos os logs filtrados
    const logIds = filteredLogs.value.map(log => log.id)
    for (const logId of logIds) {
      await agendaStore.deleteAuditLog(logId)
    }
    closeDeleteAllModal()
  } catch (error) {
    console.error('Erro ao excluir todos os registros:', error)
  }
}

onMounted(async () => {
  await agendaStore.loadAuditLogs(100)
})
</script>

<style scoped>
.container {
  max-width: 1200px;
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
  background: linear-gradient(135deg, #6a11cb, #2575fc);
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

.header-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
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

.btn-small {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-icon {
  padding: 8px;
  min-width: 40px;
}

.filters {
  margin-bottom: 20px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filters-header h3 {
  margin: 0;
  font-size: 18px;
}

.filters-actions {
  display: flex;
  gap: 8px;
}

.filter-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.filter {
  flex: 1;
  min-width: 200px;
}

.filter label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.filter select,
.filter input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 22px;
}

.section-actions {
  display: flex;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  background: #f9f9f9;
  border-radius: 8px;
}

.logs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.log-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.log-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.log-card-header {
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-card-operation {
  display: flex;
  align-items: center;
  gap: 10px;
}

.operation-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.operation-create {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.operation-update {
  background-color: #fff3e0;
  color: #ef6c00;
}

.operation-delete {
  background-color: #ffebee;
  color: #c62828;
}

.log-card-entity {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.log-card-time {
  font-size: 12px;
  color: #666;
  text-align: right;
}

.log-card-body {
  padding: 16px;
}

.log-card-description {
  font-size: 16px;
  margin-bottom: 16px;
  line-height: 1.5;
  color: #333;
}

.log-card-details {
  background: #f9f9f9;
  border-radius: 6px;
  padding: 12px;
}

.details-title {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 14px;
}

.detail-key {
  font-weight: 500;
  color: #555;
  flex-shrink: 0;
  margin-right: 10px;
}

.detail-value {
  color: #333;
  text-align: right;
  word-break: break-word;
  max-width: 200px;
}

.log-card-footer {
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

/* Modal Styles */
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

.modal-body p {
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.warning-text {
  color: #f44336;
  font-weight: 500;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.error {
  background: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
}

/* Estilos para contagem de registros */
.records-count {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #e3f2fd;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.count-number {
  font-size: 24px;
  font-weight: bold;
  color: #1976d2;
}

.count-label {
  font-size: 16px;
  color: #555;
}

/* Responsive */
@media (max-width: 768px) {
  .records-count {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .count-number {
    font-size: 20px;
  }
  
  .count-label {
    font-size: 14px;
  }
  .logs-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-group {
    flex-direction: column;
  }
  
  .filter {
    min-width: 100%;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .header-actions .btn {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .container {
    padding: 12px;
  }
  
  .card {
    padding: 16px;
  }
  
  .log-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .log-card-time {
    text-align: left;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-value {
    text-align: left;
    max-width: 100%;
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
