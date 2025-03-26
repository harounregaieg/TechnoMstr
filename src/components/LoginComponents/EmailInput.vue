<template>
  <FormInput
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    icon="/path/to/email-icon.svg"
    label="Email"
    type="email"
  />
</template>

<script>
import FormInput from './FormInput.vue'

export default {
  name: 'EmailInput',
  components: { FormInput },
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue']
}
</script>