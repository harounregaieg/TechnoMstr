<template>
    <header class="profile-header">
      <div class="profile-image-container">
        <img
          src="https://placehold.co/120x120"
          alt="Profile"
          class="profile-image"
        />
      </div>
      <div class="profile-info">
        <div class="profile-details">
          <div class="user-info">
            <h1 class="user-name">{{ userData.name }}</h1>
            <p class="user-role">{{ userData.role }}</p>
            <p class="user-email">{{ userData.email }}</p>
            <p class="user-location">{{ userData.location }}</p>
          </div>
          <button class="edit-button" @click="$emit('edit')">Edit Profile</button>
        </div>
      </div>
    </header>
  </template>
  
  <script setup>
  defineProps({
    userData: Object,
  });
  
  defineEmits(["edit"]);
  </script>
  
  <style scoped>
  .profile-header {
    display: flex;
    gap: 32px;
    align-items: flex-start;
  }
  
  .profile-image-container {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 60px;
    overflow: hidden;
    flex-shrink: 0;
  }
  
  .profile-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex-grow: 1;
  }
  
  .profile-details {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .user-name {
    font-size: 32px;
    font-weight: 400;
  }
  
  .user-role {
    color: rgba(0, 0, 0, 0.6);
    font-size: 16px;
  }
  
  .user-email,
  .user-location {
    color: rgba(0, 0, 0, 0.4);
    font-size: 14px;
  }
  
  .edit-button {
    background: #807878;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    border: none;
    cursor: pointer;
  }
  
  @media (max-width: 640px) {
    .profile-header {
      flex-direction: column;
    }
  
    .profile-details {
      flex-direction: column;
    }
  }
  </style>
  