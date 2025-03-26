<template>
    <button type="submit" class="login-button" @click="$emit('click')">
      <slot>CONNECTER</slot>
    </button>
  </template>
  
  <script>
  export default {
    name: "LoginButton",
    emits: ["click"],
  };
  </script>
  
  <style scoped>
  .login-button {
    border-radius: 4px;
    background-color: rgba(173, 179, 198, 1);
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.3);
    margin-top: 40px;
    padding: 13px 70px;
    font-size: 16px;
    color: rgba(33, 72, 192, 1);
    font-weight: 600;
    text-transform: uppercase;
    line-height: 1;
    width: 100%;
    border: none;
    cursor: pointer;
    font-family:
      Montserrat,
      -apple-system,
      Roboto,
      Helvetica,
      sans-serif;
  }
  
  @media (max-width: 991px) {
    .login-button {
      padding-left: 20px;
      padding-right: 20px;
    }
  }
  </style>
  