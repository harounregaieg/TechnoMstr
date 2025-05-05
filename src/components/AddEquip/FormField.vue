<template>
    <div class="form-field">
      <label class="field-label">{{ label }}</label>
      <component
        :is="type === 'select' ? 'select' : 'input'"
        :type="inputType"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="input-field"
        :class="{ 'disabled': disabled }"
        :aria-label="label"
        :disabled="disabled"
      >
        <slot></slot>
      </component>
    </div>
  </template>
  
  <script>
  export default {
    name: "FormField",
    props: {
      label: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        default: "text",
      },
      modelValue: {
        type: [String, Number],
        default: "",
      },
      disabled: {
        type: Boolean,
        default: false
      },
      required: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      inputType() {
        return this.type === "select" ? undefined : this.type;
      },
    },
  };
  </script>
  
  <style scoped>
  .form-field {
    flex: 1;
    margin-bottom: 16px;
  }
  
  .field-label {
    font-size: 14px;
    color: #374151;
    margin-bottom: 8px;
    display: block;
  }
  
  .input-field {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .input-field:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .input-field.disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    border-color: #d1d5db;
    cursor: not-allowed;
    pointer-events: none;
    user-select: none;
  }
  </style>
  