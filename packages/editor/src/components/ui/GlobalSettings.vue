<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeStore } from '../../stores/themeStore';

const settingsStore = useSettingsStore();
const themeStore = useThemeStore();

const localAutoSave = ref(settingsStore.autoSaveEnabled);
const localInterval = ref(settingsStore.autoSaveInterval);
const localTheme = ref(themeStore.currentTheme);
const localPanelWidth = ref(settingsStore.panelWidth);

watch(() => settingsStore.autoSaveEnabled, (val) => localAutoSave.value = val);
watch(() => settingsStore.autoSaveInterval, (val) => localInterval.value = val);
watch(() => themeStore.currentTheme, (val) => localTheme.value = val);
watch(() => settingsStore.panelWidth, (val) => localPanelWidth.value = val);

const saveAutoSaveSettings = () => {
  settingsStore.setAutoSave(localAutoSave.value, localInterval.value);
};

const handleThemeChange = (val: string) => {
  settingsStore.setTheme(val);
};

const handlePanelWidthChange = (val: number) => {
  settingsStore.setPanelWidth(val);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Theme Settings -->
    <div class="space-y-4">
      <h3 class="text-text-main font-medium border-b border-border pb-2">外观设置</h3>
      <div class="flex items-center justify-between">
        <span class="text-sm text-text-muted">当前主题</span>
        <el-select v-model="localTheme" @change="handleThemeChange" size="small" style="width: 160px">
          <el-option
            v-for="theme in themeStore.themes"
            :key="theme.id"
            :label="theme.label"
            :value="theme.id"
          />
        </el-select>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-sm text-text-muted">两侧面板宽度</span>
        <el-input-number 
          v-model="localPanelWidth" 
          :min="200" 
          :max="800" 
          :step="10"
          size="small" 
          @change="handlePanelWidthChange" 
          style="width: 160px"
        />
      </div>
    </div>

    <!-- Auto Save Settings -->
    <div class="space-y-4">
      <h3 class="text-text-main font-medium border-b border-border pb-2">保存设置</h3>
      
      <div class="flex items-center justify-between">
        <span class="text-sm text-text-muted">开启自动保存</span>
        <el-switch v-model="localAutoSave" @change="saveAutoSaveSettings" />
      </div>

      <div class="flex items-center justify-between transition-opacity" :class="{ 'opacity-50 pointer-events-none': !localAutoSave }">
        <span class="text-sm text-text-muted">自动保存间隔 (秒)</span>
        <el-input-number 
          v-model="localInterval" 
          :min="5" 
          :max="3600" 
          :step="5"
          size="small" 
          @change="saveAutoSaveSettings" 
          style="width: 120px"
        />
      </div>
    </div>
  </div>
</template>
