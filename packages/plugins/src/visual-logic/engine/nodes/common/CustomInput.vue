<template>
  <div class="custom-input">
    <label v-if="data.label" class="input-label">{{ data.label }}</label>
    <input
      type="text"
      :value="data.value"
      :readonly="data.readonly"
      @input="updateValue($event)"
      @pointerdown.stop
      @dblclick.stop
    />
  </div>
</template>

<script>
export default {
  props: ['data'],
  methods: {
    updateValue(e) {
      this.data.setValue(e.target.value);
    }
  }
}
</script>

<style scoped>
.custom-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.input-label {
  font-size: 12px;
  color: #fff;
  font-family: sans-serif;
  padding-left: 2px;
}
input {
  width: 100%;
  box-sizing: border-box;
  background-color: #1e1e20;
  border: 1px solid #4b5563;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
input:focus {
  border-color: #3b82f6;
}
input[readonly] {
  background-color: #374151;
  color: #9ca3af;
}
</style>
