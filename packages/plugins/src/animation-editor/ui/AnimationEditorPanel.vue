<script setup lang="ts">
import { ref } from 'vue';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';

const emit = defineEmits(['save']);

// 模拟的动画列表
const animations = ref([
  { id: '1', name: '漫游动画1', duration: 10 },
  { id: '2', name: '待机呼吸', duration: 5 },
]);

const activeAnimationId = ref('1');

const selectAnimation = (id: string) => {
  activeAnimationId.value = id;
};

const createAnimation = () => {
  const newId = String(Date.now());
  animations.value.push({
    id: newId,
    name: `新动画 ${animations.value.length + 1}`,
    duration: 10
  });
  activeAnimationId.value = newId;
};

const deleteAnimation = (id: string) => {
  const idx = animations.value.findIndex(a => a.id === id);
  if (idx !== -1) {
    animations.value.splice(idx, 1);
    if (activeAnimationId.value === id && animations.value.length > 0) {
      activeAnimationId.value = animations.value[0].id;
    }
  }
};
</script>

<template>
  <div class="animation-editor-panel h-full flex flex-col bg-bg-base text-text-main p-3 gap-3 overflow-y-auto custom-scrollbar">
    
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-text-muted">动画片段列表</h3>
      <el-button size="small" type="primary" :icon="Plus" circle @click="createAnimation" title="新建动画片段"></el-button>
    </div>

    <!-- Animation List -->
    <div class="flex flex-col gap-2">
      <div 
        v-for="anim in animations" 
        :key="anim.id"
        @click="selectAnimation(anim.id)"
        class="flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors group"
        :class="[
          activeAnimationId === anim.id 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary/50 hover:bg-panel'
        ]"
      >
        <div class="flex flex-col flex-1 truncate">
          <span class="text-xs font-medium truncate" :class="activeAnimationId === anim.id ? 'text-primary' : 'text-text-main'">
            {{ anim.name }}
          </span>
          <span class="text-[10px] text-text-muted">{{ anim.duration }}s</span>
        </div>
        
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- 预留重命名功能 -->
          <el-button size="small" type="primary" :icon="Edit" link @click.stop="" title="重命名" />
          <el-button size="small" type="danger" :icon="Delete" link @click.stop="deleteAnimation(anim.id)" title="删除" />
        </div>
      </div>
      
      <div v-if="animations.length === 0" class="text-center py-6 text-text-muted text-xs border border-dashed border-border rounded-lg">
        暂无动画片段，请点击右上角新建
      </div>
    </div>
    
  </div>
</template>

<style scoped>
:deep(.el-button--link) {
  padding: 2px 4px;
  height: auto;
}
</style>
