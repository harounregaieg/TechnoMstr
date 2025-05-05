<template>
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-[#000000] bg-[rgba(0,0,0,0.5)] flex items-center justify-center"
    >
      <div class="bg-white rounded-[12px] p-6 w-full max-w-[500px]">
        <h2 class="text-[24px] font-semibold mb-6">Ajouter un équipement</h2>
        <div class="flex flex-col gap-4">
          <input
            type="text"
            v-model="localEquipment.nom"
            placeholder="Nom de l'équipement"
            class="px-4 py-2 rounded-[8px] border border-[#e2e8f0] focus:outline-none focus:border-[#4318D1]"
          />
          <input
            type="text"
            v-model="localEquipment.ip"
            placeholder="Adresse IP"
            class="px-4 py-2 rounded-[8px] border border-[#e2e8f0] focus:outline-none focus:border-[#4318D1]"
          />
          <input
            type="text"
            v-model="localEquipment.type"
            placeholder="Type"
            class="px-4 py-2 rounded-[8px] border border-[#e2e8f0] focus:outline-none focus:border-[#4318D1]"
          />
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="localEquipment.disponibilite"
              id="disponibilite"
              class="rounded border-[#e2e8f0]"
            />
            <label for="disponibilite">Disponible</label>
          </div>
          <div class="flex justify-end gap-4 mt-6">
            <button
              @click="closeModal"
              class="px-4 py-2 rounded-[8px] border border-[#e2e8f0]"
            >
              Annuler
            </button>
            <button
              @click="addEquipment"
              class="px-4 py-2 rounded-[8px] bg-[#4318D1] text-white font-medium"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from "vue";
  
  const props = defineProps(["modelValue"]);
  const emit = defineEmits(["update:modelValue", "add"]);
  
  const localEquipment = ref({
    nom: "",
    ip: "",
    type: "",
    disponibilite: true,
  });
  
  const closeModal = () => {
    emit("update:modelValue", false);
    localEquipment.value = {
      nom: "",
      ip: "",
      type: "",
      disponibilite: true,
    };
  };
  
  const addEquipment = () => {
    emit("add", { ...localEquipment.value });
    closeModal();
  };
  
  watch(
    () => props.modelValue,
    (newVal) => {
      if (!newVal) {
        closeModal();
      }
    },
  );
  </script>
  