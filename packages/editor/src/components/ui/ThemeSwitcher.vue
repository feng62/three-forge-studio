<script setup lang="ts">
import { PhPalette } from '@phosphor-icons/vue';
import { useThemeStore } from '../../stores/themeStore';

const themeStore = useThemeStore();

/**
 * 处理主题下拉菜单的选择事件
 * @param {string} command - 选中的主题 ID
 */
const handleThemeCommand = (command: string) => {
  themeStore.setTheme(command);
};
</script>

<template>
  <el-dropdown @command="handleThemeCommand" trigger="click">
    <button class="w-8 h-8 rounded-full hover:bg-bg-base flex items-center justify-center text-text-muted hover:text-text-main transition-colors cursor-pointer border border-transparent hover:border-border">
      <PhPalette :size="18" weight="duotone" />
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item 
          v-for="theme in themeStore.themes" 
          :key="theme.id" 
          :command="theme.id"
          :class="{ 'text-accent font-medium': themeStore.currentTheme === theme.id }"
        >
          {{ theme.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
