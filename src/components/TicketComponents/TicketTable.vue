<template>
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th v-for="header in headers" 
                :key="header" 
                class="th"
                @click="sortBy(header)">
              <span>{{ header }}</span>
              <i :class="[
                'ti',
                sortColumn === headerToKey(header) ? 
                  (sortDirection === 'asc' ? 'ti-chevron-up' : 'ti-chevron-down') : 
                  'ti-chevron-down'
              ]"></i>
            </th>
            <th class="th"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ticket in sortedTickets" :key="ticket.id" @click="handleTicketSelect(ticket)" :class="{ 'selected-row': ticket.id === selectedTicketId }" class="table-row">
            <td class="td">{{ ticket.ticketId }}</td>
            <td class="td">{{ ticket.subject }}</td>
            <td class="td">{{ ticket.machineId }}</td>
            <td class="td">
              <StatusBadge :status="ticket.status" />
            </td>
            <td class="bold">{{ ticket.requester }}</td>
            <td class="td">{{ ticket.priority }}</td>
            <td class="td">
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import StatusBadge from "./StatusBadge.vue";
  import { ref, computed } from 'vue';
  import { useRouter } from "vue-router";


  const router = useRouter();
  const emit = defineEmits(['select-ticket']);
  const selectedTicketId = ref(null);
  
  const props = defineProps({
    searchQuery: {
      type: String,
      default: ''
    },
    statusFilter: {
      type: String,
      default: ''
    }
  });
  
  const headers = [
    "Ticket ID",
    "Sujet",
    "Machine ID",
    "Statut",
    "Requester",
    "Priority",
  ];
  
  const sortColumn = ref('ticketId'); // Set a default sort column
  const sortDirection = ref('asc');
  
  const headerToKey = (header) => {
    const mapping = {
      'Ticket ID': 'ticketId',
      'Sujet': 'subject',
      'Machine ID': 'machineId',
      'Statut': 'status',
      'Requester': 'requester',
      'Priority': 'priority'
    };
    return mapping[header];
  };
  
  const sortBy = (header) => {
    const key = headerToKey(header);
    if (sortColumn.value === key) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn.value = key;
      sortDirection.value = 'asc';
    }
  };
  
  const sortedTickets = computed(() => {
    let filteredTickets = [...tickets];

    // Apply status filter
    if (props.statusFilter) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.status === props.statusFilter
      );
    }

    // Apply search filter
    if (props.searchQuery) {
      filteredTickets = filteredTickets.filter(ticket => 
        Object.values(ticket).some(value => 
          String(value).toLowerCase().includes(props.searchQuery.toLowerCase())
        )
      );
    }
  
    if (!sortColumn.value) return filteredTickets;
  
    return filteredTickets.sort((a, b) => {
      const aVal = a[sortColumn.value];
      const bVal = b[sortColumn.value];
  
      if (sortDirection.value === 'asc') {
        return aVal.toLowerCase() > bVal.toLowerCase() ? 1 : -1;
      } else {
        return aVal.toLowerCase() < bVal.toLowerCase() ? 1 : -1;
      }
    });
  });
  const handleTicketSelect = (ticket) => {
  selectedTicketId.value = ticket.id;
  emit('select-ticket', ticket);
  router.push(`/tickets/${ticket.id}`);
};

  const tickets = [];


</script>
  


  <style lang="scss" scoped>
    
  .table-container {
    width: 100%;
    padding: 0 24px 24px 24px;
    box-sizing: border-box;
  }
  
  .table-row {
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #f9fafb;
    }
  }
  .table-wrapper {
    width: 100%;
    overflow-y: auto;
    max-height: calc(100vh - 140px); /* Adjust this value based on your layout */
    border: 1px solid #ddd;
  }
  
  .table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;

    th:nth-child(1), td:nth-child(1) { width: 12%; } // id
    th:nth-child(2), td:nth-child(2) { width: 20%; } // sujet
    th:nth-child(3), td:nth-child(3) { width: 17%; } // machine id
    th:nth-child(4), td:nth-child(4) { width: 10%; } // statut
    th:nth-child(5), td:nth-child(5) { width: 20%; } // requester
    th:nth-child(6), td:nth-child(6) { width: 10%; } // priority
  
  }
  
  .thead {
    position: sticky;
    top: 0;
    background-color: #fcfcfd;
    z-index: 10;
  }

  .th {
    padding: 12px 16px;
    text-align: left;
    font-family: "Inter", sans-serif;
    font-size: 12px;
    color: #667085;
    font-weight: 500;
    border-bottom: 1px solid #eaecf0;
    background-color: #fcfcfd;
    cursor: pointer;
    user-select: none;
    
    &:hover {
      background-color: #f9fafb;
    }
  }
  
  .th i {
    margin-left: 14px;
    vertical-align: middle;
  }
  
  .bold {
    padding: 12px 16px;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    border-bottom: 1px solid #eaecf0;
    color: #101828;
    font-weight: 500;
  }
  
  .td {
    padding: 12px 16px;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    border-bottom: 1px solid #eaecf0;
    color: #667085;

  }
  
  </style>