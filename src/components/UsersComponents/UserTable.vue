<template>
  <div class="table-container">
    <div class="table-header-row">
      <h2 class="table-header__title">Liste d'Utilisateurs</h2>
      <div class="table-header-actions">
        <div class="table-search">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Rechercher..."
            @input="handleSearch"
          />
        </div>
        <button class="table-header__button" @click="handleAddUser">
          + Ajouter Utilisateur
        </button>
      </div>
    </div>
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" @click="sortBy(column.key)">
              {{ column.label }}
              <span v-if="column.sortable" class="sort-icon" :class="{desc: sortField === column.key && sortDirection === 'desc'}">⌃</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in displayedUsers" :key="user.id">
            <td>{{ user.prenom }}</td>
            <td>{{ user.nom }}</td>
            <td>{{ user.roleuser }}</td>
            <td>{{ user.email }}</td>
            <td>
              <StatusBadge :status="user.statut || 'inactive' " />
            </td>
            <td>{{ user.departement }}</td>
            <td>
              <DropDown 
                @edit="handleEdit(user)" 
                @delete="handleDelete(user)"
                @toggle-status="handleStatusToggle(user)"
                :is-active="user.statut === 'active'"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <TablePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import StatusBadge from "./StatusBadge.vue";
import TablePagination from "./TablePagination.vue";
import DropDown from "./DropDown.vue";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { userApi } from "../../services/userApi";

const router = useRouter();
const API_URL = 'http://localhost:3000/api'; // Adjust if your API is hosted elsewhere

const users = ref([]);
const isLoading = ref(true);
const error = ref(null);

// Fetch users from the API
const fetchUsers = async () => {
  try {
    isLoading.value = true;
    users.value = await userApi.getUsers();
    isLoading.value = false;
  } catch (err) {
    error.value = "Failed to load users";
    isLoading.value = false;
  }
};

// Call fetchUsers when the component is mounted
onMounted(() => {
  fetchUsers();
});

const handleAddUser = () => {
  router.push("/ajouter-user");
};

const columns = [
  { key: "prenom", label: "Prenom", sortable: true },
  { key: "nom", label: "Nom", sortable: true},
  { key: "roleuser", label: "Type", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "statut", label: "Disponibilite", sortable: true },
  { key: "departement", label: "Departement", sortable: true },
  { key: "actions" }
];

const searchQuery = ref("");
const sortField = ref(null);
const sortDirection = ref("asc");
const currentPage = ref(1);
const itemsPerPage = 10;

// Filter users based on search query
const filteredUsers = computed(() => {
  let filtered = users.value;
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(user => {
      return (
        (user.prenom?.toLowerCase().includes(query) || false) ||
        (user.nom?.toLowerCase().includes(query) || false) ||
        (user.roleuser?.toLowerCase().includes(query) || false) ||
        (user.statut?.toLowerCase().includes(query) || false) ||
        (user.departement?.toLowerCase().includes(query) || false)
    );
    });
  }
  
  return filtered;
});

// Get users to display on current page with sorting applied
const displayedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  let sortedUsers = [...filteredUsers.value];

  if (sortField.value) {
    sortedUsers.sort((a, b) => {
      const order = sortDirection.value === "asc" ? 1 : -1;
      
      // Handle special case for name field (first/last name)
      if (sortField.value === 'prenom' || sortField.value === 'nom') {
        const field = sortField.value === 'prenom' ? 0 : 1;
        const valueA = a.prenom.split(' ')[field] || '';
        const valueB = b.prenom.split(' ')[field] || '';
        return valueA.localeCompare(valueB) * order;
      }
      
      const valueA = a[sortField.value];
      const valueB = b[sortField.value];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return valueA.localeCompare(valueB) * order;
      }
      
      if (valueA < valueB) return -1 * order;
      if (valueA > valueB) return 1 * order;
      return 0;
    });
  }

  return sortedUsers.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage));

const handlePageChange = (page) => {
  currentPage.value = page;
};

const sortBy = (field) => {
  if (field === "actions") return; // Prevent sorting on actions column
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortDirection.value = "asc";
  }
};

const handleSearch = () => {
  currentPage.value = 1; // Reset to first page when searching
};

const handleEdit = async (user) => {
  router.push(`/modifier-user/${user.id}`);
};

const handleDelete = async (user) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.nom}?`)) {
    try {
      await userApi.deleteUser(user.id);
      // After successful deletion, refresh the user list
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  }
};

const handleStatusToggle = async (user) => {
  try {
    console.log('Attempting to toggle status for user:', user);
    const response = await userApi.toggleUserStatus(user.id);
    console.log('Toggle status response:', response);
    // Refresh the user list after status change
    await fetchUsers();
  } catch (error) {
    console.error('Error toggling user status:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    alert('Failed to update user status: ' + (error.response?.data?.error || error.message));
  }
};
</script>

<style lang="scss" scoped>
$table-radius: 12px;
$table-header-bg: #fff;
$table-header-border: #e5e7eb;
$table-row-hover: #f1f5f9;
$table-border: #e5e7eb;
$table-title: #1e293b;
$table-subtle: #64748b;
$table-action: #2563eb;
$table-action-hover: #1d4ed8;

.table-container {
  width: 100%;
  max-width: 1200px;
  margin: 2.5rem auto 0 auto;
  padding: 0.5rem 1.5rem 1.5rem 1.5rem;
  background: #fff;
  border-radius: $table-radius;
  box-shadow: 0 2px 12px 0 rgba(16, 30, 54, 0.08);
  overflow-x: auto;
  box-sizing: border-box;
}

.table-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0 1rem 0;
  border-bottom: 1px solid $table-header-border;
}

.table-header__title {
  font-size: 1.35rem;
  font-weight: 600;
  color: $table-title;
  margin: 0;
}

.table-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.table-header__button {
  padding: 0.45rem 1.1rem;
  background: $table-action;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.18s;
  box-shadow: 0 1px 2px rgba(37,99,235,0.07);
  &:hover {
    background: $table-action-hover;
  }
}

.table-search {
  input {
    width: 220px;
    padding: 0.45rem 1rem;
    border: 1px solid $table-header-border;
    border-radius: 6px;
    background: #f8fafc;
    font-size: 1rem;
    color: $table-title;
    transition: border 0.18s;
    &:focus {
      outline: none;
      border-color: $table-action;
      background: #fff;
    }
  }
}

.table-wrapper {
  margin-top: 0.5rem;
  overflow-x: auto;
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
}

.table {
  width: 100%;
  min-width: 900px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.97rem;
  th, td {
    padding: 0.65rem 0.7rem;
    text-align: left;
    border-bottom: 1px solid $table-border;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
  }
  th {
    background: $table-header-bg;
    font-weight: 500;
    color: $table-subtle;
    cursor: pointer;
    user-select: none;
    .sort-icon {
      display: inline-block;
      margin-left: 0.18rem;
      font-size: 1.1em;
      transition: transform 0.2s ease;
      &.desc {
        transform: rotate(180deg);
      }
    }
  }
  tr {
    transition: background 0.15s;
    &:hover {
      background: $table-row-hover;
    }
  }
  td {
    color: $table-title;
  }
  th:last-child, td:last-child {
    text-align: center;
  }
}
</style>