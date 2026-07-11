<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: ['data'],
  methods: {
    onChange(event: Event) {
      const selectElement = event.target as HTMLSelectElement;
      if (this.data.setValue) {
        this.data.setValue(selectElement.value);
      }
    }
  }
})
</script>

<template>
  <div class="custom-select-control">
    <label v-if="data.label" class="select-label">{{ data.label }}</label>
    <div class="select-wrapper">
      <select :value="data.value" @change="onChange" @pointerdown.stop @mousedown.stop class="select-input">
        <option value="" disabled>请选择{{ data.label }}</option>
        <option v-for="opt in data.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.custom-select-control {
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.select-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-left: 4px;
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.select-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background-color: #f8fafc;
  font-size: 0.9rem;
  color: #1e293b;
  outline: none;
  transition: all 0.2s ease;
  appearance: none;
  cursor: pointer;
}

.select-input:hover {
  border-color: #94a3b8;
}

.select-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* Custom dropdown arrow */
.select-wrapper::after {
  content: "▼";
  font-size: 0.7rem;
  color: #64748b;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
</style>
