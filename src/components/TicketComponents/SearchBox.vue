<template>
  <div class="search-container">
    <div class="search-box">
      <i class="ti ti-search search-icon"></i>
      <input
        type="text"
        placeholder="Search tickets..."
        class="search-input"
        v-model="searchTerm"
        @input="onSearch"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const searchTerm = ref('');
const emit = defineEmits(['search']);

const onSearch = () => {
  emit('search', searchTerm.value);
};
</script>

<style scoped>
.search-container {
  margin-bottom: 28px;
}

.search-box {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.08);
  transition: box-shadow 0.2s;
}

.search-box:focus-within {
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.16);
}

.search-icon {
  color: #4a90e2;
  margin-right: 10px;
  font-size: 1.2em;
}

.search-input {
  border: none;
  outline: none;
  width: 100%;
  font-family: "Inter", sans-serif;
  font-size: 1rem;
  color: #357abd;
  background: transparent;
  padding: 6px 0;
}

.search-input::placeholder {
  color: #b0c4de;
  opacity: 1;
  font-size: 1rem;
}
</style>
