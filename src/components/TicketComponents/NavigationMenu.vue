<template>
  <nav class="nav-menu">
    <div class="nav-section">
      Statut des tickets
      <div class="section-divider"></div>
    </div>
    <a href="#" 
       class="nav-item" 
       :class="{ active: activeFilter === '' }"
       @click.prevent="filterTickets('')">
      <i class="ti ti-list"></i>
      <span>Tous</span>
    </a>
    
    <a href="#" 
       class="nav-item" 
       :class="{ active: activeFilter === 'Ouvert' }"
       @click.prevent="filterTickets('Ouvert')">
      <i class="ti ti-alert-circle"></i>
      <span>Ouverts</span>
    </a>
    
    <a href="#" 
       class="nav-item"
       :class="{ active: activeFilter === 'Resolu' }"
       @click.prevent="filterTickets('Resolu')">
      <i class="ti ti-check"></i>
      <span>Résolus</span>
    </a>

    <div class="nav-section">
      Mes tickets
      <div class="section-divider"></div>
    </div>
    <a href="#" 
       class="nav-item" 
       :class="{ active: activeFilter === 'sent' }"
       @click.prevent="filterTickets('sent')">
      <i class="ti ti-send"></i>
      <span>Envoyés</span>
    </a>
    
    <a href="#" 
       class="nav-item" 
       :class="{ active: activeFilter === 'received' }"
       @click.prevent="filterTickets('received')">
      <i class="ti ti-inbox"></i>
      <span>Reçus</span>
    </a>
  </nav>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['filter-change']);
const activeFilter = ref('');

const filterTickets = (status) => {
  activeFilter.value = status;
  emit('filter-change', status);
};
</script>

<style lang="scss" scoped>
.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 0;
}

.nav-item {
  font-family: "Poppins", sans-serif;
  font-size: 1rem;
  color: #357abd;
  padding: 10px 18px 10px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 10px;
  cursor: pointer;
  text-decoration: none;
  position: relative;
  transition: background 0.18s, color 0.18s;
  font-weight: 500;

  &:hover {
    background-color: #eaf4fd;
    color: #4a90e2;
  }
}

.nav-item.active {
  background: linear-gradient(90deg, #eaf4fd 0%, #f8f9fa 100%);
  color: #4a90e2;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.08);
}

.nav-item i {
  font-size: 1.2em;
  color: #4a90e2;
}

.nav-section {
  font-family: "Poppins", sans-serif;
  font-size: 0.98rem;
  color: #b0c4de;
  padding: 10px 18px 2px 18px;
  margin-bottom: 2px;
  position: relative;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.section-divider {
  position: absolute;
  bottom: -4px;
  left: 18px;
  right: 18px;
  height: 1.5px;
  background-color: #eaf4fd;
  border-radius: 1px;
}
</style>
