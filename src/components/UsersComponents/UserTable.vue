<template>
  <div class="table-container">
    <div class="table-header">
      <h2 class="table-header__title">Liste d'Utilisateurs</h2>
      <button class="table-header__button" @click="handleAddUser">
        Ajouter Utilisateur +
      </button>
    </div>

    <div class="table-search">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search..."
        @input="handleSearch"
      />
    </div>

    <div class="sector-filter">
      <div v-for="sector in sectors" :key="sector">
        <span class="sector-label">{{ sector }} </span>
        <button class="sector-filter__button" @click="filterBySector(sector)">
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th
              v-for="column in columns" 
              :key="column.key" 
              @click="sortBy(column.key)"
            >
              {{ column.label }}
              <span 
                v-if="column.sortable" 
                class="sort-icon" 
                :class="{desc: sortField === column.key && sortDirection === 'desc'}"
              > 
                ⌃ 
              </span>
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
              <DropDown @edit="handleEdit(user)" @delete="handleDelete(user)" />
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

// For sector filter - extract unique departments/sectors from users
const sectors = computed(() => {
  const uniqueSectors = new Set(users.value.map(user => user.department));
  return Array.from(uniqueSectors);
});

const searchQuery = ref("");
const sortField = ref(null);
const sortDirection = ref("asc");
const currentPage = ref(1);
const itemsPerPage = 10;
const selectedSector = ref(null);

// Filter users based on search query and selected sector
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
  
  // Filter by sector
  if (selectedSector.value) {
    filtered = filtered.filter(user => user.department === selectedSector.value);
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

const filterBySector = (sector) => {
  selectedSector.value = selectedSector.value === sector ? null : sector;
  currentPage.value = 1; // Reset to first page when filtering
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
</script>

<style lang="scss" scoped>
// Variables
$border-color: #e5e7eb;
$text-primary: #111827;
$text-secondary: #6b7280;
$primary-color: #2563eb;
$hover-bg: #f9fafb;

.table-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 1.5rem;
  background: white;
  border-radius: .75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: hidden;
  box-sizing: border-box;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: .25rem;
  border-bottom: 1px solid $border-color;

  &__title {
    font-size: 1.25rem;
    font-weight: 500;
    color: $text-primary;
  }

  &__button {
    padding: .5rem 1rem;
    background: white;
    border: 1px solid $border-color;
    border-radius: 0.5rem;
    color: $text-secondary;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      border-color: darken($border-color, 10%);
      background: $hover-bg;
    }
  }
}

.table-search {
  padding: 0.5rem 0;

  input {
    width: 100%;
    max-width: 300px;
    padding: 0.5rem 1rem;
    border: 1px solid $border-color;
    border-radius: 0.5rem;
    background: $hover-bg;

    &:focus {
      outline: none;
      border-color: $primary-color;
      box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
    }
  }
}

.sector-filter {
  display: flex;
  gap: 1rem;
  margin-bottom: .25rem;
  flex-wrap: wrap;

  .sector-label {
    font-size: .875rem;
    color: $text-secondary;
  }

  &__button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: .75rem;
  }
}

.table-wrapper {
  overflow-x: auto;
  width: 100%;
  max-height: calc(13 * 2.5rem);
  overflow-y: auto;
}

.table {
  width: 100%;
  min-width: 700px; /* Ensure table doesn't get too compressed */
  border-collapse: collapse;

  th, td {
    height: 1.5rem;
    padding: .25rem .5rem;
    text-align: left;
    cursor: default;
    border-bottom: 1px solid $border-color;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
  }

  th:nth-child(1), td:nth-child(1) { width: 8%; } // Name
  th:nth-child(2), td:nth-child(2) { width: 8%; } // Lastname
  th:nth-child(3), td:nth-child(3) { width: 7%; } // Type
  th:nth-child(4), td:nth-child(4) { width: 10%; } // Email
  th:nth-child(5), td:nth-child(5) { width: 7%; } // Status
  th:nth-child(6), td:nth-child(6) { width: 10%; } // Department
  th:nth-child(7), td:nth-child(7) { width: 1%; } // Actions

  th {
    background: $hover-bg;
    font-weight: 500;
    color: $text-secondary;
    cursor: pointer;
    user-select: none;

    &:hover {
      background: darken($hover-bg, 2%);
    }

    .sort-icon {
      display: inline-block;
      margin-left: 0.25rem;
      transition: transform 0.2s ease;

      &.desc {
        transform: rotate(180deg);
      }
    }
  }

  tr:hover {
    background: $hover-bg;
  }

  td {
    color: $text-primary;
  }
}
</style>