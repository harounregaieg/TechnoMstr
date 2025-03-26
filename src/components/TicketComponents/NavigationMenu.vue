<template>
  <nav class="nav-menu">
    <div class="nav-section">All Tickets</div>
    <a href="#" 
       class="nav-item" 
       :class="{ active: activeFilter === 'Ouvert' }"
       @click.prevent="filterTickets('Ouvert')">
      <span>Ouverts</span>
    </a>
    
    <a href="#" 
       class="nav-item"
       :class="{ active: activeFilter === 'Solved' }"
       @click.prevent="filterTickets('Solved')">
      <span>Résolus</span>
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
  gap: 8px;
}

.nav-item {
  font-family: "Poppins", sans-serif;
  font-size: 16px;
  color: #000;
  padding: 8px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    background-color: #f5f1f1;
  }
}

.nav-item.active {
  font-weight: 500;
}

.badge {
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 10px;
  color: #000;
  background-color: #d9d9d9;
}

.nav-section {
  font-family: "Poppins", sans-serif;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.4);
  padding: 8px 0;
}
</style>
