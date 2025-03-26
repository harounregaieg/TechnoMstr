<template>
    <div class="form-field">
      <label class="field-label">{{ label }}</label>
      <component
        :is="type === 'select' ? 'select' : 'input'"
        :type="inputType"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="input-field"
        :aria-label="label"
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
  </style>
  