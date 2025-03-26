<template>
    <header class="header">
      <h1 class="title">Tickets</h1>
      <button class="new-ticket" @click="handleAddTicket">
        + New Ticket</button>
    </header>
  </template>
  
<script setup>
  import { useRouter } from "vue-router";
  const router = useRouter();

  const handleAddTicket = () => {
    router.push("/ajouter-ticket");
  };


</script>


<style scoped>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  
  .title {
    font-family: "Poppins", sans-serif;
    font-size: 24px;
    color: #000;
  }
  
  .new-ticket {
    padding: 10px 16px;
    border: 1px solid #d0d5dd;
    border-radius: 8px;
    color: #344054;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    background-color: #fff;
  }
  </style>
  