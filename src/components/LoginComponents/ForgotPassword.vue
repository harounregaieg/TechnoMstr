<template>
    <a href="#" class="forgot-password" @click.prevent="$emit('click')">
      Mot de Passe Oublié?
    </a>
  </template>
  
  <script>
  export default {
    name: "ForgotPassword",
    emits: ["click"],
  };
  </script>
  
  <style scoped>
  .forgot-password {
    font-size: 16px;
    font-weight: 500;
    color: rgba(255, 255, 255, 1);
    text-decoration: none;
    align-self: flex-end;
    margin-top: 16px;
    font-family:
      Montserrat,
      -apple-system,
      Roboto,
      Helvetica,
      sans-serif;
  }
  </style>
  