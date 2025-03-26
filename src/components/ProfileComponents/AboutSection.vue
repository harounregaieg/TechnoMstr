<template>
    <section class="about-section">
      <h2 class="section-title">About</h2>
      <div v-if="!isEditing" class="bio-text">{{ bio }}</div>
      <div v-else class="edit-container">
        <textarea v-model="tempBio" class="bio-textarea"></textarea>
        <div class="button-group">
          <button class="save-button" @click="handleSave">Save</button>
          <button class="cancel-button" @click="handleCancel">Cancel</button>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, watch } from "vue";
  
  const props = defineProps({
    bio: String,
    isEditing: Boolean,
  });
  
  const emit = defineEmits(["save", "cancel"]);
  
  const tempBio = ref(props.bio);
  
  watch(
    () => props.bio,
    (newBio) => {
      tempBio.value = newBio;
    },
  );
  
  const handleSave = () => {
    emit("save", tempBio.value);
  };
  
  const handleCancel = () => {
    tempBio.value = props.bio;
    emit("cancel");
  };
  </script>
  
  <style scoped>
  .about-section {
    background: white;
    border-radius: 10px;
    padding: 24px;
  }
  
  .section-title {
    font-size: 24px;
    font-weight: 400;
    margin-bottom: 16px;
  }
  
  .bio-text {
    color: rgba(0, 0, 0, 0.6);
    font-size: 16px;
  }
  
  .edit-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .bio-textarea {
    width: 100%;
    min-height: 120px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    font-size: 16px;
    font-family: inherit;
  }
  
  .button-group {
    display: flex;
    gap: 16px;
  }
  
  .save-button {
    background: #807878;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    border: none;
    cursor: pointer;
  }
  
  .cancel-button {
    background: white;
    border: 1px solid #807878;
    color: #807878;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
  }
  </style>
  