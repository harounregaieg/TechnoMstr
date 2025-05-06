<template>
  <aside :class="`${is_Expanded && 'is_Expanded'}`">
    <div class="logo">
      <img v-if="!is_Expanded" src="../assets/technocodelogo.png" alt="Vue">
      <span v-else>{{ appName }}</span>
    </div>

    <div class="user-info" v-if="is_Expanded && currentUser">
      <span class="user-name">{{ currentUser.prenom }} {{ currentUser.nom }}</span>
      <span class="user-role">{{ currentUser.roleuser }}</span>
    </div>

    <div class="menu-toggle-wrap">
      <button class="menu-toggle" @click="ToggleMenu">
        <span class="material-icons">keyboard_double_arrow_right</span>
      </button>
    </div>

    <h3>Menu</h3>
    <div class="menu">
      <router-link class="button" to="/" v-if="canSee('dashboard')">
        <span class="material-icons">home</span>
        <span class="text">Tableau de Bord</span>
      </router-link>

      <router-link class="button" to="/equipements" v-if="canSee('equipements')">
        <span class="material-icons">list_alt</span>
        <span class="text">Equipements</span>
      </router-link>

      <router-link class="button" to="/users" v-if="canSee('users')">
        <span class="material-icons">group</span>
        <span class="text">Users</span>
      </router-link>

      <router-link class="button" to="/tickets" v-if="canSee('tickets')">
        <span class="material-icons">construction</span>
        <span class="text">Tickets</span>
      </router-link>

      <router-link class="button notification-link" to="/notifications" v-if="canSee('notifications')">
        <span class="material-icons">notifications</span>
        <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        <span class="text">Notifications</span>
      </router-link>

      <router-link class="button" to="/account" v-if="canSee('account')">
        <span class="material-icons">account_circle</span>
        <span class="text">Profile</span>
      </router-link>
    </div>

    <div class="flex"></div>

    <div class="menu">
      <button class="button" @click="handleLogout">
        <span class="material-icons">logout</span>
        <span class="text">Log Out</span>
      </button>   
    </div>
  </aside>

  <div v-if="showConfirmDialog" class="logout-dialog">
    <div class="dialog-content">
      <p>Are you sure you want to logout?</p>
      <div class="dialog-buttons">
        <button @click="confirmLogout" class="confirm-btn">Yes</button>
        <button @click="cancelLogout" class="cancel-btn">No</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { notificationEvents } from '../services/eventBus'

const is_Expanded = ref(localStorage.getItem("is_Expanded") === "true")
const showConfirmDialog = ref(false)
const appName = "TechnoMaster" // Set the name of your application
const router = useRouter()
const currentUser = ref(null)
// Use the unread count from the event bus directly
const unreadCount = notificationEvents.unreadCount

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      currentUser.value = JSON.parse(userStr)
    } catch (e) {
      console.error('Error parsing user data:', e)
    }
  }
})

const ToggleMenu = () => {
  is_Expanded.value = !is_Expanded.value
  localStorage.setItem("is_Expanded", is_Expanded.value)
}

const handleLogout = () => {
  showConfirmDialog.value = true
}

const confirmLogout = () => {
  localStorage.removeItem("is_Expanded")
  localStorage.removeItem("user") // Also remove user data on logout
  showConfirmDialog.value = false
  router.push("/login")
}

const cancelLogout = () => {
  showConfirmDialog.value = false
}

const canSee = (section) => {
  if (!currentUser.value) return false;
  const role = currentUser.value.roleuser;
  if (role === 'superadmin' || role === 'admin') return true;
  if (role === 'technicien') {
    return ['dashboard', 'equipements', 'tickets', 'notifications', 'account'].includes(section);
  }
  if (role === 'user') {
    return ['dashboard', 'account'].includes(section);
  }
  return false;
}
</script>

<style lang="scss" scoped>
.notification-badge {
  position: absolute;
  top: 0;
  right: 10px;
  background-color: var(--primary);
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  font-weight: bold;
}

.notification-link {
  position: relative;
}

.logout-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  .dialog-content {
    background-color: var(--light);
    padding: 2rem;
    border-radius: 8px;
    text-align: center;

    p {
      color: var(--dark);
      margin-bottom: 1rem;
    }

    .dialog-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;

      button {
        padding: 0.5rem 1.5rem;
        border-radius: 4px;
        font-weight: bold;
        transition: 0.2s ease;

        &.confirm-btn {
          background-color: var(--primary);
          color: var(--light);

          &:hover {
            background-color: darken(#d36c0b, 10%);
          }
        }

        &.cancel-btn {
          background-color: var(--grey);
          color: var(--light);

          &:hover {
            background-color: darken(#64748b, 10%);
          }
        }
      }
    }
  }
}
aside {
  
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;

  display: flex;
  flex-direction: column;
  width: calc(2rem + 32px);
  overflow: hidden;
  min-height: 100vh;
  padding: 1rem;

  background-color: var(--dark);
  color: var(--light);

  transition: 0.3s ease-out;

  .flex {
    flex: 1 1 0;
  }

  .logo {
    margin-bottom: 1rem;
    display: flex;
    
    

    img {
      width: 2rem;
    }

    span {
      font-size: 1.5rem;
      color: var(--light);
      font-family: 'Arial Black', sans-serif;
      ;
    }
  }

  .user-info {
    padding: 0.5rem 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--grey);
    
    .user-name {
      display: block;
      font-size: 0.9rem;
      color: var(--light);
      margin-bottom: 0.2rem;
    }
    
    .user-role {
      display: block;
      font-size: 0.8rem;
      color: var(--primary);
      text-transform: capitalize;
    }
  }

  .menu-toggle-wrap {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;

    position: relative;
    top: 0;
    transition: 0.2s ease-out;

    .menu-toggle {
      transition: 0.2s ease-out;

      .material-icons {
        font-size: 2rem;
        color: var(--light);
        transition: 0.2s ease-out;
      }

      &:hover {
        .material-icons {
          color: var(--primary);
          transform: translateX(0.5rem);
        }
      }
    }
  }

  h3,
  .button .text {
    opacity: 0;
    transition: 0.3s ease-out;
  }

  h3 {
    color: var(--grey);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  .menu {
    margin: 0 -1rem;

    .button {
      display: flex;
      align-items: center;
      text-decoration: none;

      padding: 0.5rem 1rem;
      transition: 0.2s ease-out;

      .material-icons {
        font-size: 2rem;
        color: var(--light);
        transition: 0.2s ease-out;
      }

      .text {
        color: var(--light);
        transition: 0.2s ease-out;
      }

      &:hover,
      &.router-link-exact-active {
        background-color: var(--dark-alt);

        .material-icons,
        .text {
          color: var(--primary);
        }
      }

      &.router-link-exact-active {
        border-right: 5px solid var(--primary);
      }
    }
  }

  &.is_Expanded {
    width: var(--sidebar-width);

    .menu-toggle-wrap {
      top: -3rem;
      .menu-toggle {
        transform: rotate(-180deg);
      }
    }

    h3,
    .button .text {
      opacity: 1;
    }

    .button {
      .material-icons {
        margin-right: 1rem;
      }
    }
  }
}
</style>