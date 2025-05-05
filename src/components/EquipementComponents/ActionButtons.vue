<template>
  <div class="action-buttons">
    <button 
      class="scan-btn" 
      @click="startScan" 
      :disabled="isScanning"
    >
      <span v-if="isScanning">Scan en cours...</span>
      <span v-else>Scanner le réseau</span>
    </button>
    <button class="btn btn-add" @click="handleAddEquipement">+ Ajouter Équipement</button>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
const emit = defineEmits(['scan-start']);
const props = defineProps({
  isScanning: {
    type: Boolean,
    default: false
  }
});

const handleAddEquipement = () => {
  router.push("/ajouter-equipement");
}

const startScan = () => {
  emit('scan-start');
};
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 16px;
}

.scan-btn {
  padding: 8px 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.scan-btn:hover {
  background-color: #1976D2;
}

.scan-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn {
  height: 40px;
  border-radius: 8px;
  color: #000000;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  background-color: #ffffff;
  border: 1px solid #9a9696;
}

.btn-add {
  padding: 0 16px;
}

@media (max-width: 991px) {
  .action-buttons {
    width: 100%;
    justify-content: stretch;
  }

  .btn {
    flex: 1;
  }
}
</style>
