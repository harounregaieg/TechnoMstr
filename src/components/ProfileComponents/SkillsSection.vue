<template>
    <section class="skills-section">
      <h2 class="section-title">Skills</h2>
      <div class="skills-container">
        <span v-for="skill in skills" :key="skill" class="skill-tag">
          {{ skill }}
        </span>
      </div>
    </section>
  </template>
  
  <script setup>
  defineProps({
    skills: Array,
  });
  </script>
  
  <style scoped>
  .skills-section {
    background: white;
    border-radius: 10px;
    padding: 24px;
  }
  
  .section-title {
    font-size: 24px;
    font-weight: 400;
    margin-bottom: 16px;
  }
  
  .skills-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .skill-tag {
    background: rgba(128, 120, 120, 0.1);
    color: #454545;
    padding: 8px 16px;
    border-radius: 16px;
    font-size: 14px;
  }
  </style>
  