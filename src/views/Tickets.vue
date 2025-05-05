<template>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Poppins:wght@400;500&display=swap"
    rel="stylesheet"
  />

  <div class="app-container">
    <nav class="sidebar">
      <SidebarHeader />
      <SearchBox @search="handleSearch" />
      <NavigationMenu @filter-change="handleFilterChange" />
    </nav>
    <main class="main-content">
      <MainHeader />
      <TicketTable 
        :searchQuery="searchQuery"
        :status-filter="currentFilter"
        :ticket-type="ticketType"
      />
    </main>
    
  </div>
  
</template>

<script setup>
import { ref } from "vue";
import SidebarHeader from "../components/TicketComponents/SidebarHeader.vue";
import SearchBox from "../components/TicketComponents/SearchBox.vue";
import NavigationMenu from "../components/TicketComponents/NavigationMenu.vue";
import MainHeader from "../components/TicketComponents/MainHeader.vue";
import TicketTable from "../components/TicketComponents/TicketTable.vue";

const searchQuery = ref('');
const currentFilter = ref('');
const ticketType = ref('');

const handleFilterChange = (filter) => {
  if (filter === 'sent' || filter === 'received') {
    ticketType.value = filter;
    currentFilter.value = '';
  } else {
    ticketType.value = '';
    currentFilter.value = filter;
  }
};

const handleSearch = (query) => {
  searchQuery.value = query;
};
</script>

<style lang="scss" scoped>

.app-container {
  display: flex;
  min-height: 100vh;
  width: calc(100% - calc(2rem + 32px)); /* Subtract main sidebar width */  
  background-color: #fff;
  position: absolute;
  top: 0;
  left: calc(2rem + 32px); /* Add main sidebar width */
  right: 0;
  padding: 0;
  margin: 0;
}

.sidebar {
  width: 295px;
  padding: 24px 16px;
  background-color: #f8f9fa;
  height: 100vh;
  position: fixed;
  left: var(--sidebar-width-collapsed);
  top: 0;
  overflow-y: auto;
  z-index: 50;
}

.main-content {
  flex: 1;
  padding: 24px;
  background-color: #fff;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  margin-left: 295px;
  width: calc(100% - 295px);
}
</style>
