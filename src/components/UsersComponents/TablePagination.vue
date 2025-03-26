<template>
    <div class="pagination">
      <button
        class="pagination__button"
        :disabled="currentPage <= 1"
        @click="$emit('page-change', currentPage - 1)"
      >
        Previous
      </button>
  
      <div class="pagination__numbers">
        <button
          v-for="page in displayedPages"
          :key="page"
          :class="['pagination__number', { 'is-active': page === currentPage }]"
          @click="$emit('page-change', page)"
        >
          {{ page }}
        </button>
      </div>
  
      <button
        class="pagination__button"
        :disabled="currentPage >= totalPages"
        @click="$emit('page-change', currentPage + 1)"
      >
        Next
      </button>
    </div>
  </template>
  
  <script setup>
import { ref, computed } from "vue";

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
});

const itemsPerPage = ref(10);

const displayedPages = computed(() => {
  const pages = [];
  const maxPages = 5;
  let start = Math.max(1, props.currentPage - Math.floor(maxPages / 2));
  let end = Math.min(props.totalPages, start + maxPages - 1);

  if (end - start + 1 < maxPages) {
    start = Math.max(1, end - maxPages + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

defineEmits(["page-change", "items-per-page-change"]);  </script>
  
  <style lang="scss" scoped>
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
  
    &__button {
      padding: 0.5rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: white;
      color: #374151;
      font-size: 0.875rem;
      transition: all 0.2s ease;
  
      &:hover:not(:disabled) {
        background: #f3f4f6;
        border-color: #d1d5db;
      }
  
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  
    &__numbers {
      display: flex;
      gap: 0.25rem;
    }
  
    &__number {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: #374151;
      transition: all 0.2s ease;
  
      &:hover:not(.is-active) {
        background: #f3f4f6;
      }
  
      &.is-active {
        background: #2563eb;
        color: white;
      }
    }
  }
  </style>
  