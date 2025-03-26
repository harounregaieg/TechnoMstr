<template>
  <div class="users-view">
    <UserTable />
  </div>
</template>
  
  <script setup>
  import UserTable from "../components/UsersComponents/UserTable.vue";
  
  </script>
  
  <style lang="scss" scoped>
  .users-view {
    width: 102%;
    padding: 1rem;
    padding-left: calc(2rem + 48px);
    box-sizing: border-box;
    transition: padding-left 0.2s ease-out;

    &.sidebar-expanded {
      padding-left: calc(var(--sidebar-width) + 1rem);
    }
    
    h1 {
      margin-bottom: 1rem;
    }
  }
  </style>
  