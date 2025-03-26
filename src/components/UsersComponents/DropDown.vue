<template>
  <div class="dropdown" ref="dropdownRef">
    <!-- Toggle button with three dots icon -->
    <button class="dropdown-toggle" @click.stop="toggleDropdown">
      <svg class="dots-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="12" r="2" fill="currentColor"/>
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
        <circle cx="18" cy="12" r="2" fill="currentColor"/>
      </svg>
    </button>

    <!-- Dropdown menu portal to avoid containment issues -->
    <Teleport to="body">
      <div v-if="isOpen" 
           class="dropdown-menu-wrapper"
           :style="menuPosition">
        <div class="dropdown-menu" :class="{'dropdown-menu--top': isMenuAbove}">
          <!-- Edit option -->
          <button class="dropdown-item" @click="handleEdit">
            <svg class="item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.862 4.487L18.549 2.799C18.9669 2.38108 19.5237 2.14734 20.1053 2.14734C20.6868 2.14734 21.2437 2.38108 21.6615 2.799C22.0794 3.21692 22.3131 3.77375 22.3131 4.3553C22.3131 4.93685 22.0794 5.49368 21.6615 5.9116L8.77744 18.7956C8.37398 19.1991 7.8833 19.4941 7.35056 19.6552L3.5 20.9999L4.82159 17.2078C4.97986 16.6681 5.2728 16.1719 5.67626 15.7684L16.862 4.487Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Edit</span>
          </button>

          <!-- Delete option -->
          <button class="dropdown-item dropdown-item--delete" @click="handleDelete">
            <svg class="item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

// Refs
const isOpen = ref(false);
const isMenuAbove = ref(false);
const dropdownRef = ref(null);
const menuPosition = ref({
  top: '0px',
  left: '0px'
});

// Define emits
const emit = defineEmits(['edit', 'delete']);

// Toggle dropdown visibility
const toggleDropdown = () => {
  if (!isOpen.value) {
    updateMenuPosition();
  }
  isOpen.value = !isOpen.value;
};

// Calculate and update menu position
const updateMenuPosition = () => {
  if (dropdownRef.value) {
    const rect = dropdownRef.value.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    isMenuAbove.value = spaceBelow < 150;
    
    // Position the menu
    if (isMenuAbove.value) {
      menuPosition.value = {
        top: `${rect.top - 4}px`,
        left: `${rect.right - 170}px` // Adjust width (160px) + some padding
      };
    } else {
      menuPosition.value = {
        top: `${rect.bottom + 4}px`,
        left: `${rect.right - 170}px` // Adjust width (160px) + some padding
      };
    }
  }
};

// Handle edit action
const handleEdit = () => {
  emit('edit');
  isOpen.value = false;
};

// Handle delete action
const handleDelete = () => {
  emit('delete');
  isOpen.value = false;
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', updateMenuPosition);
  window.addEventListener('scroll', updateMenuPosition, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', updateMenuPosition);
  window.removeEventListener('scroll', updateMenuPosition, true);
});
</script>

<style scoped>
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #64748b;
  transition: background-color 0.2s, color 0.2s;
}

.dropdown-toggle:hover {
  background-color: #f8f9fa;
  color: #1e293b;
}

.dots-icon {
  width: 18px;
  height: 18px;
}

.dropdown-menu-wrapper {
  position: fixed;
  z-index: 2000;
}

.dropdown-menu {
  min-width: 160px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.dropdown-menu--top {
  transform: translateY(-100%);
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #4b5563;
  transition: background-color 0.2s;
  gap: 8px;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
}

.dropdown-item--delete {
  color: #ef4444;
}

.dropdown-item--delete:hover {
  background-color: #fef2f2;
}

.item-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>