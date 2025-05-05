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
    justify-content: flex-end;
    gap: 0.3rem;
    padding: 0.7rem 0 0.2rem 0;
    border-top: 1px solid #e5e7eb;
    background: none;
  }
  
  .pagination__button {
    padding: 0.32rem 0.85rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    color: #2563eb;
    font-size: 0.92rem;
    font-weight: 500;
    transition: background 0.16s, color 0.16s;
    box-shadow: none;
    &:hover:not(:disabled) {
      background: #f1f5f9;
      color: #1d4ed8;
      border-color: #c7d2fe;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f3f4f6;
      color: #9ca3af;
    }
  }
  
  .pagination__numbers {
    display: flex;
    gap: 0.15rem;
  }
  
  .pagination__number {
    width: 2.1rem;
    height: 2.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 0.92rem;
    color: #374151;
    font-weight: 500;
    background: none;
    border: none;
    transition: background 0.16s, color 0.16s;
    cursor: pointer;
    &:hover:not(.is-active) {
      background: #f1f5f9;
      color: #2563eb;
    }
    &.is-active {
      background: #2563eb;
      color: #fff;
      font-weight: 600;
    }
  }
  </style>
  