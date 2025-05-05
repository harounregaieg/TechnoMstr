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
            <th class="th actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ticket in sortedTickets" :key="ticket.idticket" class="table-row">
            <td class="td" @click="handleTicketSelect(ticket)">{{ ticket.sujet }}</td>
            <td class="td" @click="handleTicketSelect(ticket)">{{ ticket.serialnumber }}</td>
            <td class="td" @click="handleTicketSelect(ticket)">
              <StatusBadge :status="ticket.statut" />
            </td>
            <td class="bold" @click="handleTicketSelect(ticket)">{{ ticket.requester_firstname }} {{ ticket.requester_lastname }}</td>
            <td class="td" @click="handleTicketSelect(ticket)">{{ ticket.priority }}</td>
            <td class="td actions-cell">
              <div class="actions-menu" v-click-outside="() => closeMenu(ticket.idticket)">
                <button 
                  v-if="ticket.statut !== 'Resolu'"
                  class="actions-trigger" 
                  @click.stop="toggleMenu(ticket.idticket)"
                >
                  <span class="dots">⋮</span>
                </button>
                <div v-if="activeMenu === ticket.idticket" class="dropdown-menu">
                  <button 
                    v-if="ticket.statut === 'Ouvert'"
                    class="menu-item" 
                    @click="closeTicket(ticket)"
                  >
                    Marquer comme résolu
                  </button>
                  <button 
                    v-if="ticket.statut !== 'Resolu'"
                    class="menu-item delete" 
                    @click="deleteTicket(ticket)"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import StatusBadge from "./StatusBadge.vue";
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from "vue-router";

  const router = useRouter();
  const emit = defineEmits(['select-ticket']);
  const selectedTicketId = ref(null);
  const tickets = ref([]);
  const activeMenu = ref(null); // Track which menu is currently open
  
  const props = defineProps({
    searchQuery: {
      type: String,
      default: ''
    },
    statusFilter: {
      type: String,
      default: ''
    },
    ticketType: {
      type: String,
      default: ''
    }
  });
  
  const headers = [
    "Sujet",
    "Serial Number",
    "Statut",
    "Requester",
    "Priority",
  ];
  
  const sortColumn = ref('sujet');
  const sortDirection = ref('asc');
  
  const headerToKey = (header) => {
    const mapping = {
      'Sujet': 'sujet',
      'Serial Number': 'serialnumber',
      'Statut': 'statut',
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
    let filteredTickets = [...tickets.value];

    // Apply status filter
    if (props.statusFilter) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.statut === props.statusFilter
      );
    }

    // Apply ticket type filter (sent/received)
    if (props.ticketType) {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser) {
        if (props.ticketType === 'sent') {
          filteredTickets = filteredTickets.filter(ticket => 
            ticket.requester === currentUser.id || ticket.requester_id === currentUser.id
          );
        } else if (props.ticketType === 'received') {
          filteredTickets = filteredTickets.filter(ticket => 
            ticket.agent === currentUser.id || ticket.agent_id === currentUser.id
          );
        }
      }
    }

    // Apply search filter
    if (props.searchQuery) {
      const searchLower = props.searchQuery.toLowerCase();
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.sujet.toLowerCase().includes(searchLower) ||
        ticket.serialnumber.toLowerCase().includes(searchLower) ||
        `${ticket.requester_firstname} ${ticket.requester_lastname}`.toLowerCase().includes(searchLower)
      );
    }
  
    return filteredTickets.sort((a, b) => {
      let aVal = a[sortColumn.value];
      let bVal = b[sortColumn.value];

      // Handle special case for requester (which is now split into firstname/lastname)
      if (sortColumn.value === 'requester') {
        aVal = `${a.requester_firstname} ${a.requester_lastname}`;
        bVal = `${b.requester_firstname} ${b.requester_lastname}`;
      }
  
      if (sortDirection.value === 'asc') {
        return aVal.toLowerCase() > bVal.toLowerCase() ? 1 : -1;
      } else {
        return aVal.toLowerCase() < bVal.toLowerCase() ? 1 : -1;
      }
    });
  });

  const handleTicketSelect = (ticket) => {
    selectedTicketId.value = ticket.idticket;
    emit('select-ticket', ticket);
    router.push(`/ticket/${ticket.idticket}`);
  };

  const toggleMenu = (ticketId) => {
    activeMenu.value = activeMenu.value === ticketId ? null : ticketId;
  };

  const closeMenu = (ticketId) => {
    if (activeMenu.value === ticketId) {
      activeMenu.value = null;
    }
  };

  const closeTicket = async (ticket) => {
    try {
      console.log('Attempting to close ticket:', {
        ticketId: ticket.idticket,
        currentStatus: ticket.statut
      });

      const response = await fetch(`http://localhost:3000/api/tickets/${ticket.idticket}/close`, {
        method: 'PUT'
      });

      console.log('Close ticket response:', {
        status: response.status,
        ok: response.ok
      });

      const data = await response.json();
      console.log('Close ticket response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to close ticket');
      }

      // Update the ticket status locally
      ticket.statut = 'Resolu';
      activeMenu.value = null;
    } catch (error) {
      console.error('Detailed error closing ticket:', {
        message: error.message,
        stack: error.stack,
        ticket: ticket
      });
      alert('Failed to close ticket: ' + error.message);
    }
  };

  const deleteTicket = async (ticket) => {
    if (!confirm('Are you sure you want to delete this ticket?')) {
      return;
    }

    try {
      console.log('Attempting to delete ticket:', {
        ticketId: ticket.idticket
      });

      const response = await fetch(`http://localhost:3000/api/tickets/${ticket.idticket}`, {
        method: 'DELETE'
      });

      console.log('Delete ticket response:', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        const data = await response.json();
        console.log('Delete ticket error response:', data);
        throw new Error(data.error || 'Failed to delete ticket');
      }

      // Remove the ticket from the local list
      tickets.value = tickets.value.filter(t => t.idticket !== ticket.idticket);
      activeMenu.value = null;
    } catch (error) {
      console.error('Detailed error deleting ticket:', {
        message: error.message,
        stack: error.stack,
        ticket: ticket
      });
      alert('Failed to delete ticket: ' + error.message);
    }
  };

  const fetchTickets = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser) {
        console.error('No user found in localStorage');
        return;
      }

      console.log('Current user:', currentUser);

      // Fetch both sent and received tickets
      const [sentTickets, receivedTickets] = await Promise.all([
        fetch(`http://localhost:3000/api/tickets/user/${currentUser.id}?role=requester`).then(res => res.json()),
        fetch(`http://localhost:3000/api/tickets/user/${currentUser.id}?role=agent`).then(res => res.json())
      ]);

      // Combine and deduplicate tickets
      const allTickets = [...sentTickets, ...receivedTickets];
      const uniqueTickets = allTickets.reduce((acc, ticket) => {
        if (!acc.find(t => t.idticket === ticket.idticket)) {
          acc.push(ticket);
        }
        return acc;
      }, []);

      tickets.value = uniqueTickets;
      console.log('Fetched tickets:', tickets.value);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  // Click outside directive
  const vClickOutside = {
    mounted(el, binding) {
      el._clickOutside = (event) => {
        if (!(el === event.target || el.contains(event.target))) {
          binding.value(event);
        }
      };
      document.addEventListener('click', el._clickOutside);
    },
    unmounted(el) {
      document.removeEventListener('click', el._clickOutside);
    }
  };

  onMounted(() => {
    fetchTickets();
  });
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

    th:nth-child(1), td:nth-child(1) { width: 30%; } // subject (larger for longer text)
    th:nth-child(2), td:nth-child(2) { width: 15%; } // machine id
    th:nth-child(3), td:nth-child(3) { width: 15%; } // status
    th:nth-child(4), td:nth-child(4) { width: 25%; } // requester
    th:nth-child(5), td:nth-child(5) { width: 15%; } // priority
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
  
  .actions-header {
    width: 60px;
    text-align: center;
  }

  .actions-cell {
    width: 60px;
    text-align: center;
    position: relative;
  }

  .actions-menu {
    position: relative;
    display: inline-block;
  }

  .actions-trigger {
    background: none;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    color: #666;
    font-size: 20px;
    
    &:hover {
      color: #333;
    }
  }

  .dots {
    display: inline-block;
    font-weight: bold;
  }

  .dropdown-menu {
    position: absolute;
    right: 0;
    top: 100%;
    background: white;
    border: 1px solid #dde5f2;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    min-width: 160px;
  }

  .menu-item {
    display: block;
    width: 100%;
    padding: 8px 16px;
    text-align: left;
    border: none;
    background: none;
    font-size: 14px;
    color: #333;
    cursor: pointer;
    
    &:hover {
      background-color: #f5f7fa;
    }
    
    &.delete {
      color: #dc3545;
      
      &:hover {
        background-color: #fff5f5;
      }
    }
  }
  </style>