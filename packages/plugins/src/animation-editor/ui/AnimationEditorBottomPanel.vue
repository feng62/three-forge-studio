<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  VideoPlay, VideoPause, 
  DArrowLeft, DArrowRight, 
  Plus, Delete, Refresh
} from '@element-plus/icons-vue';
import type { Engine as ForgeEngine } from '../../../../editor/src/engine/Engine';

const props = defineProps<{
  engine: ForgeEngine | null;
  sceneGraphVersion: number;
}>();

const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(10); // 默认总时长 10 秒


// 模拟的时间轴刻度生成
const timeTicks = computed(() => {
  const ticks = [];
  const step = 1; // 每秒一个大刻度
  for (let i = 0; i <= duration.value; i += step) {
    ticks.push(i);
  }
  return ticks;
});

// 模拟的动画轨道与关键帧数据
const tracks = ref([
  {
    id: 'track1',
    name: '位置 (Position)',
    color: '#3b82f6', // blue-500
    keyframes: [
      { time: 0, value: [0, 0, 0] },
      { time: 2.5, value: [5, 0, 0] },
      { time: 8, value: [5, 5, 0] }
    ]
  },
  {
    id: 'track2',
    name: '旋转 (Rotation)',
    color: '#10b981', // green-500
    keyframes: [
      { time: 1, value: [0, 90, 0] },
      { time: 5, value: [0, 180, 0] },
      { time: 9.5, value: [0, 360, 0] }
    ]
  },
  {
    id: 'track3',
    name: '缩放 (Scale)',
    color: '#f59e0b', // amber-500
    keyframes: [
      { time: 0, value: [1, 1, 1] },
      { time: 4, value: [2, 2, 2] },
      { time: 10, value: [1, 1, 1] }
    ]
  }
]);

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
};

const stopPlay = () => {
  isPlaying.value = false;
  currentTime.value = 0;
};

const addKeyframe = () => {
  // TODO: Add keyframe logic based on current selection
};

// 工具方法：计算关键帧在时间轴上的左侧偏移百分比
const getKeyframeLeft = (time: number) => {
  return `${(time / duration.value) * 100}%`;
};

// 拖拽时间指针 (简单模拟)
const timelineAreaRef = ref<HTMLElement | null>(null);
const handleTimelineClick = (e: MouseEvent) => {
  if (!timelineAreaRef.value) return;
  const rect = timelineAreaRef.value.getBoundingClientRect();
  const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const percentage = offsetX / rect.width;
  currentTime.value = percentage * duration.value;
};

</script>

<template>
  <div class="animation-editor flex flex-col h-full bg-panel text-text-main text-xs border-t border-border select-none">
    
    <!-- Top Toolbar -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-base">
      <div class="flex items-center gap-2">
        <el-button-group>
          <el-button size="small" :icon="DArrowLeft" @click="currentTime = 0" title="回到开头" />
          <el-button size="small" @click="togglePlay" :type="isPlaying ? 'primary' : 'default'">
            <el-icon v-if="!isPlaying"><VideoPlay /></el-icon>
            <el-icon v-else><VideoPause /></el-icon>
          </el-button>
          <el-button size="small" :icon="Refresh" @click="stopPlay" title="停止" />
          <el-button size="small" :icon="DArrowRight" @click="currentTime = duration" title="跳到末尾" />
        </el-button-group>
        
        <div class="h-4 w-px bg-border mx-2"></div>
        
        <div class="flex items-center gap-2 text-text-muted">
          <span>时间: </span>
          <span class="font-mono text-primary w-12">{{ currentTime.toFixed(2) }}s</span>
          <span> / {{ duration }}s</span>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <el-button size="small" :icon="Plus" type="success" plain @click="addKeyframe">
          添加关键帧
        </el-button>
        <el-button size="small" :icon="Delete" type="danger" plain>
          删除选中帧
        </el-button>
      </div>
    </div>
    
    <!-- Timeline & Tracks Area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left: Track Headers -->
      <div class="w-60 flex-shrink-0 border-r border-border bg-bg-base flex flex-col overflow-y-auto custom-scrollbar">
        <!-- Ruler header placeholder -->
        <div class="h-6 border-b border-border flex items-center px-3 bg-panel sticky top-0 z-10">
          <span class="text-text-muted font-medium">动画轨道</span>
        </div>
        
        <!-- Track labels -->
        <div 
          v-for="track in tracks" 
          :key="track.id"
          class="h-10 border-b border-border flex items-center px-3 hover:bg-panel transition-colors cursor-pointer group"
        >
          <div class="w-3 h-3 rounded-sm mr-2" :style="{ backgroundColor: track.color }"></div>
          <span class="flex-1 truncate group-hover:text-primary transition-colors">{{ track.name }}</span>
        </div>
      </div>
      
      <!-- Right: Timeline Ruler and Keyframes -->
      <div class="flex-1 flex flex-col overflow-x-auto overflow-y-hidden custom-scrollbar bg-[#1e1e1e] relative">
        
        <!-- Time Ruler -->
        <div 
          class="h-6 border-b border-border relative bg-panel flex-shrink-0 cursor-text"
          ref="timelineAreaRef"
          @mousedown="handleTimelineClick"
        >
          <!-- Ticks -->
          <div 
            v-for="tick in timeTicks" 
            :key="tick"
            class="absolute top-0 bottom-0 border-l border-border flex flex-col justify-end"
            :style="{ left: getKeyframeLeft(tick) }"
          >
            <span class="text-[10px] text-text-muted ml-1 mb-[2px]">{{ tick }}s</span>
          </div>
          
          <!-- Current Time Pointer (Playhead Header) -->
          <div 
            class="absolute top-0 bottom-0 w-2 -ml-1 flex justify-center cursor-ew-resize z-20 pointer-events-none"
            :style="{ left: getKeyframeLeft(currentTime) }"
          >
            <div class="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500"></div>
          </div>
        </div>
        
        <!-- Tracks Data Area -->
        <div class="relative flex-1 overflow-y-auto custom-scrollbar">
          <!-- Current Time Line (Playhead Line) -->
          <div 
            class="absolute top-0 bottom-0 w-px bg-red-500/50 z-10 pointer-events-none"
            :style="{ left: getKeyframeLeft(currentTime) }"
          ></div>

          <!-- Track Rows -->
          <div 
            v-for="track in tracks" 
            :key="track.id"
            class="h-10 border-b border-border/30 relative"
          >
            <!-- Keyframe Diamonds -->
            <div 
              v-for="(kf, index) in track.keyframes" 
              :key="index"
              class="absolute top-1/2 -mt-1.5 w-3 h-3 bg-white border border-black transform rotate-45 cursor-pointer hover:scale-125 transition-transform z-20"
              :style="{ 
                left: `calc(${getKeyframeLeft(kf.time)} - 6px)`,
                backgroundColor: track.color
              }"
              :title="`Time: ${kf.time}s`"
            ></div>
            
            <!-- Connection Line -->
            <div class="absolute top-1/2 mt-[-0.5px] h-px bg-white/20 left-0 right-0"></div>
          </div>
        </div>
        
      </div>
    </div>
    
  </div>
</template>

<style scoped>
.animation-editor {
  min-height: 240px; /* 给予底里面板一个合适的最小高度 */
}

/* 覆盖 element-plus 的默认按钮样式以适应深色暗黑风格 */
:deep(.el-button) {
  background-color: transparent;
  border-color: var(--color-border);
  color: var(--color-text-main);
}
:deep(.el-button:hover) {
  background-color: var(--color-bg-base);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
:deep(.el-button--primary) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
</style>
