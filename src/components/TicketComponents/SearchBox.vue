<template>
  <div class="search-container">
    <div class="search-box">
      <i class="ti ti-search search-icon"></i>
      <input
        type="text"
        placeholder="Search..."
        class="search-input"
        v-model="searchTerm"
        @input="onSearch"
      />
    </div>
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
    margin-bottom: 24px;
  }
  
  .search-box {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 8px;
    background-color: #fff;
  }
  
  .search-icon {
    color: rgba(28, 28, 28, 0.2);
    margin-right: 8px;
  }
  
  .search-input {
    border: none;
    outline: none;
    width: 100%;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: rgba(28, 28, 28, 0.2);
  }
  </style>
