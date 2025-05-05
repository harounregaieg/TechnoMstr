<!-- SearchBar.vue -->
<template>
  <div class="search-container">
    <input
      v-model="searchTerm"
      type="search"
      placeholder="Rechercher un équipement..."
      class="search-input"
      aria-label="Search equipment"
      @input="onSearch"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const searchTerm = ref('');
const emit = defineEmits(['search']);

const onSearch = () => {
  emit('search', searchTerm.value);
};
</script>

<style scoped>
.search-container {
  position: relative;
  margin-left: 60px;
  width: 400px;
}

.search-input {
  width: 100%;
  height: 42px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  color: #999;
  background-color: #fff;
}

@media (max-width: 991px) {
  .search-container {
    width: 100%;
  }
}
</style>