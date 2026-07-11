<template>
  <button class="custom-button" @click.stop="onClick" @pointerdown.stop>
    {{ label }}
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: ['data'],
  computed: {
    label() {
      return this.data.label;
    }
  },
  methods: {
    onClick() {
      if (this.data.onClick) {
        this.data.onClick();
      }
    }
  }
})
</script>

<style scoped>
.custom-button {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  width: 100%;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}
.custom-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.5);
}
.custom-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}
</style>
