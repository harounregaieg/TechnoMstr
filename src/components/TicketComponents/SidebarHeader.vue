<template>
    <header class="header">
      <h1 class="title">Tickets</h1>
      <button class="new-ticket" @click="handleAddTicket">
        <i class="ti ti-plus"></i> New Ticket
      </button>
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
    margin-bottom: 32px;
    padding: 8px 0;
  }
  
  .title {
    font-family: "Poppins", sans-serif;
    font-size: 2rem;
    color: #357abd;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin: 0;
  }
  
  .new-ticket {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    border: none;
    border-radius: 999px;
    color: #fff;
    background: linear-gradient(90deg, #4a90e2 0%, #357abd 100%);
    font-family: "Inter", sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.12);
    transition: background 0.2s, box-shadow 0.2s;
  }
  
  .new-ticket:hover {
    background: linear-gradient(90deg, #357abd 0%, #4a90e2 100%);
    box-shadow: 0 4px 16px rgba(74, 144, 226, 0.18);
  }
  
  .new-ticket i {
    font-size: 1.1em;
  }
  </style>
  