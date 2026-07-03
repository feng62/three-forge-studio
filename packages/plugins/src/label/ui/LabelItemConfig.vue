<script setup lang="ts">
import { computed } from 'vue';
import type { LabelObject, TargetType } from '../types';
import { Aim } from '@element-plus/icons-vue';

const props = defineProps<{
  label: LabelObject;
}>();

const emit = defineEmits<{
  (e: 'update', id: string, updates: Partial<LabelObject>): void;
  (e: 'pick-model', label: LabelObject): void;
}>();

const update = (updates: Partial<LabelObject>) => {
  emit('update', props.label.id, updates);
};

const isTargetModel = computed({
  get: () => props.label.targetType === 'model',
  set: (val: boolean) => update({ targetType: val ? 'model' : 'coordinate' })
});

</script>

<template>
  <div class="p-3 flex flex-col gap-4">
    
    <!-- 显示设置 -->
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-text-muted w-20">默认显示</span>
      <el-switch
        size="small"
        :model-value="label.visible"
        @change="(val: boolean) => update({ visible: val })"
      />
    </div>

    <!-- 3D 标签开关 -->
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-text-muted w-20">3D 标签</span>
      <el-switch
        size="small"
        :model-value="!!label.is3D"
        @change="(val: boolean) => update({ is3D: val })"
      />
    </div>

    <!-- 3D 标签视角设置 -->
    <div v-if="label.is3D" class="flex flex-col gap-2 p-2 bg-bg-base border border-border rounded-md">
      <div class="flex items-center gap-2">
        <span class="text-[10px] text-text-muted w-16">视角模式</span>
        <el-radio-group 
          size="small" 
          :model-value="label.fixedRotation ? 'fixed' : 'billboard'" 
          @update:model-value="(val) => update({ fixedRotation: val === 'fixed' })"
        >
          <el-radio-button value="billboard">跟随相机</el-radio-button>
          <el-radio-button value="fixed">固定视角</el-radio-button>
        </el-radio-group>
      </div>
      
      <div v-if="label.fixedRotation" class="flex flex-col gap-1 mt-1">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] text-text-muted w-16">跟随轴向</span>
          <el-select 
            size="small" 
            :model-value="label.followAxis || 'none'" 
            @update:model-value="(val) => update({ followAxis: val })" 
            class="flex-1"
          >
            <el-option label="不跟随 (完全固定)" value="none" />
            <el-option label="X 轴跟随" value="x" />
            <el-option label="Y 轴跟随" value="y" />
            <el-option label="Z 轴跟随" value="z" />
          </el-select>
        </div>
        <span class="text-[10px] text-text-muted">旋转角度 (度数)</span>
        <div class="flex gap-2">
          <el-input-number size="small" :model-value="label.rotation?.[0] || 0" @change="(v) => update({ rotation: [Number(v)||0, label.rotation?.[1]||0, label.rotation?.[2]||0] })" :controls="false" placeholder="X" class="!w-full"/>
          <el-input-number size="small" :model-value="label.rotation?.[1] || 0" @change="(v) => update({ rotation: [label.rotation?.[0]||0, Number(v)||0, label.rotation?.[2]||0] })" :controls="false" placeholder="Y" class="!w-full"/>
          <el-input-number size="small" :model-value="label.rotation?.[2] || 0" @change="(v) => update({ rotation: [label.rotation?.[0]||0, label.rotation?.[1]||0, Number(v)||0] })" :controls="false" placeholder="Z" class="!w-full"/>
        </div>
      </div>
    </div>

    <!-- 被遮挡开关 -->
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-text-muted w-20">遮挡检测</span>
      <el-switch
        size="small"
        :model-value="!!label.occluded"
        @change="(val: boolean) => update({ occluded: val })"
      />
    </div>

    <!-- 目标绑定 -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-text-muted w-20">绑定至模型</span>
        <el-switch
          size="small"
          v-model="isTargetModel"
        />
      </div>
      
      <div v-if="!isTargetModel" class="flex gap-2 mt-2">
        <el-input-number size="small" :model-value="label.targetPosition[0]" @change="(v) => update({ targetPosition: [Number(v)||0, label.targetPosition[1], label.targetPosition[2]] })" :controls="false" placeholder="X" class="!w-full"/>
        <el-input-number size="small" :model-value="label.targetPosition[1]" @change="(v) => update({ targetPosition: [label.targetPosition[0], Number(v)||0, label.targetPosition[2]] })" :controls="false" placeholder="Y" class="!w-full"/>
        <el-input-number size="small" :model-value="label.targetPosition[2]" @change="(v) => update({ targetPosition: [label.targetPosition[0], label.targetPosition[1], Number(v)||0] })" :controls="false" placeholder="Z" class="!w-full"/>
      </div>
      
      <div v-else class="flex flex-col gap-2 mt-2">
        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            <span class="text-[10px] text-text-muted w-10 text-right">UUID</span>
            <el-input size="small" :model-value="label.targetModelUuid" readonly placeholder="根模型/Wrapper UUID" class="flex-1" />
          </div>
          <div class="flex gap-2">
            <span class="text-[10px] text-text-muted w-10 text-right">PATH</span>
            <el-input size="small" :model-value="label.targetModelPath || ''" readonly placeholder="子节点路径 (可选)" class="flex-1" />
          </div>
        </div>
        <div class="flex gap-2 mt-1">
          <el-button type="primary" size="small" plain @click="emit('pick-model', label)" class="w-full">
            <el-icon><Aim /></el-icon> 拾取选中模型
          </el-button>
        </div>
        <span class="text-[10px] text-text-muted leading-tight">在三维视口中选中目标模型，点击上方按钮将标签绑定至模型几何中心。模型移动时标签自动跟随。</span>
      </div>
    </div>
    
    <!-- 局部偏移 -->
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-text-muted">局部偏移 (Offset)</span>
      <div class="flex gap-2">
        <el-input-number size="small" :model-value="label.offset[0]" @change="(v) => update({ offset: [Number(v)||0, label.offset[1], label.offset[2]] })" :controls="false" placeholder="X" class="!w-full"/>
        <el-input-number size="small" :model-value="label.offset[1]" @change="(v) => update({ offset: [label.offset[0], Number(v)||0, label.offset[2]] })" :controls="false" placeholder="Y" class="!w-full"/>
        <el-input-number size="small" :model-value="label.offset[2]" @change="(v) => update({ offset: [label.offset[0], label.offset[1], Number(v)||0] })" :controls="false" placeholder="Z" class="!w-full"/>
      </div>
    </div>
  </div>
</template>
