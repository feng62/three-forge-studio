<template>
  <div class="search">
    <input
      :value="value"
      @input="$emit('update:value', ($event.target as HTMLInputElement).value)"
      placeholder="Search..."
      class="search-input"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: string
}>()

defineEmits<{
  (e: 'update:value', value: string): void
}>()
</script>

<style scoped>
.search {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 4px;
  padding: 0 4px;
}

.search-input {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: white;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.search-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.2);
}
</style>
