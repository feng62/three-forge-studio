<template>
  <div 
    class="custom-menu"
    @mouseover="onMouseOver"
    @mouseleave="onMouseLeave"
    @wheel.stop
    data-testid="context-menu"
    rete-context-menu
  >
    <CustomSearch 
      v-if="searchBar" 
      v-model:value="filter"
    />
    <div class="menu-items-container">
      <CustomItem
        v-for="item in filteredItems"
        :key="item.key || item.label"
        :item="item"
        :delay="delay"
        :category="parentCategory || (item.subitems ? item.label : '')"
        @hide="onHideMenu"
      />
      <div v-if="filteredItems.length === 0" class="no-results">
        No results found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import CustomSearch from './CustomSearch.vue'
import CustomItem from './CustomItem.vue'

const props = withDefaults(defineProps<{
  items: any[],
  delay?: number,
  searchBar?: boolean,
  parentCategory?: string,
  onHide?: () => void
}>(), {
  delay: 50,
  searchBar: false,
  parentCategory: ''
})

const filter = ref('')
let hideTimeout: any = null

const filteredItems = computed(() => {
  if (!filter.value) return props.items
  const lowerFilter = filter.value.toLowerCase()
  return props.items.filter(item => item.label.toLowerCase().includes(lowerFilter))
})

const onMouseOver = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

const onMouseLeave = () => {
  hideTimeout = setTimeout(() => {
    if (props.onHide) props.onHide()
  }, props.delay)
}

const onHideMenu = () => {
  if (props.onHide) props.onHide()
}

onUnmounted(() => {
  if (hideTimeout) clearTimeout(hideTimeout)
})
</script>

<style scoped>
.custom-menu {
  background: rgba(15, 23, 42, 0.85); /* slate-900 */
  backdrop-filter: blur(16px);
  border: 1px solid rgba(56, 189, 248, 0.2); /* sky-400 */
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  color: #e5e7eb;
  padding: 4px;
  min-width: 140px;
  font-family: inherit;
}

.menu-items-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.no-results {
  padding: 6px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}
</style>
