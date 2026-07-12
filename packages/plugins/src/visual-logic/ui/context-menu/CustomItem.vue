<template>
  <div
    class="item group"
    :class="[theme ? theme.hoverBg : 'hover:bg-slate-700/50 hover:text-white']"
    @click.stop="onClick"
    @mouseover="onMouseOver"
    @mouseleave="onMouseLeave"
    @wheel.stop
  >
    <div class="flex items-center gap-[8px]">
      <div v-if="theme" class="w-1.5 h-1.5 rounded-full" :class="theme.bg"></div>
      <div class="item-label" :class="theme ? theme.text : ''">{{ item.label }}</div>
    </div>
    <div v-if="hasSubitems" class="subitems-arrow">▶</div>
    <CustomMenu
      v-if="showSubmenu && hasSubitems"
      :items="item.subitems"
      :delay="delay"
      :searchBar="false"
      :parentCategory="category"
      @hide="onHideSubmenu"
      class="submenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import CustomMenu from './CustomMenu.vue'

const props = defineProps<{
  item: any,
  delay: number,
  category: string
}>()

const categoryMap: Record<string, { bg: string, text: string, hoverBg: string }> = {
  '交互事件': { bg: 'bg-[#FF3B30]', text: 'text-[#FF3B30]', hoverBg: 'hover:bg-[#FF3B30]/20' },
  '镜头动画': { bg: 'bg-[#AF52DE]', text: 'text-[#AF52DE]', hoverBg: 'hover:bg-[#AF52DE]/20' },
  '标签/UI': { bg: 'bg-[#5AC8FA]', text: 'text-[#5AC8FA]', hoverBg: 'hover:bg-[#5AC8FA]/20' },
  '动作执行': { bg: 'bg-[#007AFF]', text: 'text-[#007AFF]', hoverBg: 'hover:bg-[#007AFF]/20' },
  '定时/延时': { bg: 'bg-[#FF9500]', text: 'text-[#FF9500]', hoverBg: 'hover:bg-[#FF9500]/20' },
  '变量与数据': { bg: 'bg-[#34C759]', text: 'text-[#34C759]', hoverBg: 'hover:bg-[#34C759]/20' },
  '逻辑运算': { bg: 'bg-[#5856D6]', text: 'text-[#5856D6]', hoverBg: 'hover:bg-[#5856D6]/20' },
  '控制流/条件': { bg: 'bg-[#8E8E93]', text: 'text-[#8E8E93]', hoverBg: 'hover:bg-[#8E8E93]/20' }
}

const theme = computed(() => {
  return categoryMap[props.category] || null
})

const emit = defineEmits<{
  (e: 'hide'): void
}>()

const showSubmenu = ref(false)
let hideTimeout: any = null

const hasSubitems = computed(() => {
  return props.item.subitems && props.item.subitems.length > 0
})

const onClick = () => {
  if (props.item.handler) {
    props.item.handler()
    emit('hide')
  }
}

const onMouseOver = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  showSubmenu.value = true
}

const onMouseLeave = () => {
  // Directly disappear without delay as requested
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  showSubmenu.value = false
}

const onHideSubmenu = () => {
  showSubmenu.value = false
  emit('hide')
}

onUnmounted(() => {
  if (hideTimeout) clearTimeout(hideTimeout)
})
</script>

<style scoped>
.item {
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
}

/* Invisible bridge to prevent mouseleave when crossing the 4px gap to the submenu */
.item::after {
  content: '';
  position: absolute;
  top: 0;
  right: -4px;
  width: 4px;
  height: 100%;
}

.item-label {
  flex-grow: 1;
}

.subitems-arrow {
  margin-left: 8px;
  font-size: 10px;
  opacity: 0.5;
}

.submenu {
  position: absolute;
  top: 0;
  left: 100%;
  margin-left: 4px;
}
</style>
