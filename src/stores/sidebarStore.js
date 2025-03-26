import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  const isExpanded = ref(localStorage.getItem("is_Expanded") === "true")

  const toggleSidebar = () => {
    isExpanded.value = !isExpanded.value
    localStorage.setItem("is_Expanded", isExpanded.value)
  }

  return { isExpanded, toggleSidebar }
})
