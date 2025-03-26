<template>
    <div class="form-row">
      <slot></slot>
    </div>
  </template>
  
  <script>
  export default {
    name: "FormRow",
  };
  </script>
  
  <style scoped>
  .form-row {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
  }
  
  @media (max-width: 991px) {
    .form-row {
      flex-direction: column;
      gap: 16px;
    }
  }
  </style>
  