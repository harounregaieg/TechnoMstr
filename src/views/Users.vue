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
    width: 1450px;
    height: 80vh;
    padding: 0;
    margin: 0;
    background: #f5f7fa;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    transition: none;
  }
  </style>
  