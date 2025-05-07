<template>
  <div class="ticket-details-page">
    <div class="container">
      <!-- Header with back button -->
      <header class="page-header">
        <button class="back-button" @click="goBack">
          <i class="back-icon">←</i>
          <span>Retour</span>
        </button>
        <h1 class="page-title">{{ ticket.subject }}</h1>
        <div class="status-badge" :class="statusClass">{{ ticket.status }}</div>
      </header>

      <div v-if="loading" class="loading-state">
        Chargement...
      </div>

      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>

      <div v-else class="ticket-content">
        <!-- Main content section -->
        <main class="main-content">
          <!-- Equipment information card -->
          <section class="card equipment-info">
            <h2 class="card-title">Information d'Équipement</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Équipement Serial Number</span>
                <span class="info-value">{{ ticket.equipmentId }}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">Adresse IP</span>
                <span class="info-value">{{ ticket.equipmentIp || 'Non spécifiée' }}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">Pièce(s) à Remplacer</span>
                <span class="info-value">{{ ticket.partsToReplace || 'Aucune pièce spécifiée' }}</span>
              </div>
            </div>
          </section>

          <!-- Description section -->
          <section v-if="ticket.description" class="card description-section">
            <h2 class="card-title">Description</h2>
            <p class="description-content">{{ ticket.description }}</p>
          </section>

          <!-- Notes section -->
          <section class="card notes-section">
            <h2 class="card-title">Notes</h2>
            <textarea
              v-model="ticketNotes"
              class="notes-input"
              placeholder="Ajouter des notes ici..."
              @input="notesChanged = true"
            ></textarea>
            <div class="actions">
              <button 
                class="save-button" 
                :disabled="!notesChanged"
                @click="saveNotes"
              >
                Enregistrer
              </button>
            </div>
          </section>
        </main>

        <!-- Sidebar with ticket details -->
        <aside class="sidebar">
          <section class="card ticket-info">
            <h2 class="card-title">Détails du Ticket</h2>
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">ID du Ticket</span>
                <span class="info-value">{{ ticket.id }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Créé le</span>
                <span class="info-value">{{ formatDate(ticket.createdDate) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Priorité</span>
                <span class="info-value priority" :class="priorityClass">
                  {{ ticket.priority }}
                </span>
              </div>
            </div>
          </section>

          <!-- Responsible agent section -->
          <section class="card agent-section">
            <h2 class="card-title">Agent Responsable</h2>
            <div class="agent-card">
              <div class="agent-avatar">
                {{ getInitials(ticket.agent?.name) }}
              </div>
              <div class="agent-info">
                <h3 class="agent-name">{{ ticket.agent?.name }}</h3>
                <p class="agent-email">{{ ticket.agent?.email }}</p>
              </div>
            </div>
          </section>

          <!-- Requester section -->
          <section class="card requester-section">
            <h2 class="card-title">Requester</h2>
            <div class="requester-info">
              <div class="requester-avatar">
                {{ getInitials(ticket.requester?.name || 'Demandeur Inconnu') }}
              </div>
              <div>
                <h3 class="requester-name">{{ ticket.requester?.name || 'Demandeur Inconnu' }}</h3>
                <p class="requester-email">{{ ticket.requester?.email || 'Non spécifié' }}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// State variables
const ticket = ref({
  id: '',
  subject: '',
  equipmentId: '',
  equipmentIp: '',
  departement: '',
  status: '',
  partsToReplace: '',
  description: '',
  notes: '',
  createdDate: '',
  priority: '',
  agent: {
    name: '',
    email: '',
  },
  requester: {
    name: '',
    email: '',
  }
});
const ticketNotes = ref('');
const notesChanged = ref(false);
const loading = ref(true);
const error = ref(null);

// Computed properties
const statusClass = computed(() => {
  const status = ticket.value.status?.toLowerCase() || '';
  if (status === 'ouvert') return 'status-open';
  if (status === 'resolu') return 'status-closed';
  return 'status-default';
});

const priorityClass = computed(() => {
  const priority = ticket.value.priority?.toLowerCase() || '';
  if (priority === 'high') return 'priority-high';
  if (priority === 'medium') return 'priority-medium';
  if (priority === 'low') return 'priority-low';
  return 'priority-default';
});

// Methods
const goBack = () => {
  router.back();
};

const formatDate = (dateString) => {
  if (!dateString) return 'Non spécifié';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

const saveNotes = async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${ticket.value.id}/notes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes: ticketNotes.value })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save notes');
    }

    const data = await response.json();
    ticket.value.notes = data.notes;
    notesChanged.value = false;
    alert('Notes enregistrées avec succès!');
  } catch (error) {
    console.error('Error saving notes:', error);
    alert('Erreur lors de la sauvegarde des notes. Veuillez réessayer.');
  }
};

const fetchTicket = async (ticketId) => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${ticketId}`);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to fetch ticket');
    }
    
    const data = await response.json();
    ticket.value = data;
    ticketNotes.value = data.notes || '';
  } catch (err) {
    console.error('Error fetching ticket:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Lifecycle hooks
onMounted(async () => {
  const ticketId = route.params.id;
  if (ticketId) {
    await fetchTicket(ticketId);
  }
});
</script>

<style lang="scss" scoped>
// Variables
$primary-color: #3a7bd5;
$secondary-color: #3a6073;
$light-bg: #f7f9fc;
$darker-bg: #e8edf5;
$card-bg: #ffffff;
$text-color: #333;
$text-secondary: #666;
$border-color: #dde5f2;
$error-color: #e74c3c;
$success-color: #27ae60;
$warning-color: #f39c12;
$info-color: #3498db;
$border-radius: 8px;
$shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
$transition: all 0.3s ease;


.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

// Header styles
.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid $border-color;
  flex-wrap: wrap;
}

.back-button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: $text-color;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: $border-radius;
  transition: $transition;
  
  &:hover {
    background-color: $darker-bg;
  }
  
  .back-icon {
    margin-right: 0.5rem;
    font-size: 1.2rem;
  }
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  
  &.status-open {
    background-color: rgba($info-color, 0.15);
    color: darken($info-color, 15%);
  }
  
  &.status-closed {
    background-color: rgba($success-color, 0.15);
    color: darken($success-color, 15%);
  }
  
  &.status-default {
    background-color: rgba($text-secondary, 0.15);
    color: $text-secondary;
  }
}

// Main content layout
.ticket-content {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.main-content {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

// Card component
.card {
  background-color: $card-bg;
  border-radius: $border-radius;
  box-shadow: $shadow;
  padding: 1.5rem;
  
  .card-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 0;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid $border-color;
  }
}

// Equipment info styles
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  
  .info-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: $text-secondary;
    margin-bottom: 0.25rem;
  }
  
  .info-value {
    font-size: 1rem;
    word-break: break-word;
  }
}

// Description section
.description-content {
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

// Notes section
.notes-input {
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border-radius: $border-radius;
  border: 1px solid $border-color;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  transition: $transition;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.save-button {
  background-color: $primary-color;
  color: white;
  border: none;
  border-radius: $border-radius;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition;
  
  &:hover:not(:disabled) {
    background-color: darken($primary-color, 10%);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// Ticket info styles
.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .info-label {
    font-size: 0.85rem;
    color: $text-secondary;
  }
  
  .info-value {
    font-weight: 500;
    
    &.priority {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      
      &.priority-high {
        background-color: rgba($error-color, 0.15);
        color: darken($error-color, 10%);
      }
      
      &.priority-medium {
        background-color: rgba($warning-color, 0.15);
        color: darken($warning-color, 10%);
      }
      
      &.priority-low {
        background-color: rgba($success-color, 0.15);
        color: darken($success-color, 10%);
      }
    }
  }
}

// Agent and requester styles
.agent-card, .requester-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.agent-avatar, .requester-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary-color, $secondary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
}

.agent-info {
  flex: 1;
}

.agent-name, .requester-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.agent-email, .requester-email {
  font-size: 0.85rem;
  color: $text-secondary;
  margin: 0;
  word-break: break-word;
}

// Responsive adjustments
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
  }
}

.loading-state,
.error-state {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
  color: $text-secondary;
}

.error-state {
  color: $error-color;
}
</style>
  
  
  