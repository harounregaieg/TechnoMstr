<template>
    <label :for="id" class="input-field">
      <img :src="iconSrc" :alt="label" class="input-icon" />
      <input
        :id="id"
        :type="type"
        :placeholder="label"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="input-text"
        :aria-label="label"
      />
    </label>
  </template>
  
  <script>
  export default {
    name: "FormInput",
    props: {
      id: {
        type: String,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        default: "text",
      },
      iconSrc: {
        type: String,
        required: true,
      },
      modelValue: {
        type: String,
        default: "",
      },
    },
    emits: ["update:modelValue"],
  };
  </script>
  
  <style class = "scss" scoped>
  .input-field {
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 1);
    display: flex;
    padding: 13px 12px;
    align-items: center;
    gap: 8px;
    width: 100%;
  }
  
  .input-icon {
    aspect-ratio: 1;
    object-fit: contain;
    object-position: center;
    width: 20px;
    flex-shrink: 0;
  }
  
  .input-text {
    flex-grow: 1;
    flex-shrink: 1;
    width: 244px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 1);
    font-family:
      Montserrat,
      -apple-system,
      Roboto,
      Helvetica,
      sans-serif;
    font-size: 14px;
    font-weight: 300;
    line-height: 1;
  }
  
  .input-text::placeholder {
    color: rgba(255, 255, 255, 1);
  }
  
  .input-text:focus {
    outline: none;
  }
  </style>
  