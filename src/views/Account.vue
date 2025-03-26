<template>
  <main class="profile-container">
    <div class="content-wrapper">
      <ProfileHeader :user-data="userData" @edit="startEditing" />

      <div class="stats-grid">
        <StatsCard :value="userData.stats.projects" label="Projects" />
        <StatsCard :value="userData.stats.teams" label="Teams" />
        <StatsCard :value="userData.stats.reports" label="Direct Reports" />
      </div>

      <AboutSection
        :bio="userData.bio"
        :is-editing="isEditing"
        @save="saveBio"
        @cancel="cancelEditing"
      />

      <SkillsSection :skills="userData.skills" />
    </div>
  </main>
</template>

<script setup>
import { ref, reactive } from "vue";
import ProfileHeader from "../components/ProfileComponents/ProfileHeader.vue";
import StatsCard from "../components/ProfileComponents/StatsCard.vue";
import AboutSection from "../components/ProfileComponents/AboutSection.vue";
import SkillsSection from "../components/ProfileComponents/SkillsSection.vue";

const isEditing = ref(false);

const userData = reactive({
  name: "User User",
  role: "Admin",
  email: "user.user@company.com",
  location: "Entrprise 1",
  bio: "About section.",
  stats: {
    projects: 127,
    teams: 12,
    reports: 8,
  },
  skills: [
    "Product Strategy",
    "Team Leadership",
    "Agile/Scrum",
    "User Research",
    "Data Analysis",
    "Stakeholder Management",
  ],
});

const startEditing = () => {
  isEditing.value = true;
};

const saveBio = (newBio) => {
  userData.bio = newBio;
  isEditing.value = false;
};

const cancelEditing = () => {
  isEditing.value = false;
};
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Poppins&display=swap");

/*.profile-container {
  display: flex;
  flex-direction: column;
  width: 96%;
  height: 89vh;
  margin-left: calc(2rem + 32px);
  background: rgba(255, 255, 255, 0.6);
  font-family: "Poppins", sans-serif;
  color: #454545;
}*/

.content-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px;
  gap: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}



.profile-page {
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