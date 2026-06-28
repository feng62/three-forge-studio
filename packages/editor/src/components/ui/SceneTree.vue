<script setup lang="ts">
import { ref, watch, onMounted, markRaw } from 'vue';
import { useEngineStore } from '../../stores/engineStore';
import { historyManager } from '../../history/HistoryManager';
import { VisibilityCommand } from '../../history/VisibilityCommand';
import * as THREE from 'three';
import { 
  PhCube, PhCamera, PhLightbulb, PhImageSquare, PhTreeStructure, PhFolderOpen,
  PhEye, PhEyeSlash, PhTrash 
} from '@phosphor-icons/vue';
import { useElementSize } from '@vueuse/core';

const engineStore = useEngineStore();

interface SceneTreeNode {
  id: string; // Object3D uuid
  label: string;
  type: string;
  visible: boolean;
  children?: SceneTreeNode[];
  icon?: any;
}

const treeData = ref<SceneTreeNode[]>([]);
const expandedKeys = ref<string[]>([]);
const treeRef = ref<any>(null);
const listContainerRef = ref<HTMLElement | null>(null);
const { height } = useElementSize(listContainerRef);

const defaultProps = {
  value: 'id',
  label: 'label',
  children: 'children'
};

// Get icon component based on Object3D type
const getIconForType = (type: string) => {
  if (type.includes('Camera')) return markRaw(PhCamera);
  if (type.includes('Light')) return markRaw(PhLightbulb);
  if (type.includes('Mesh')) return markRaw(PhCube);
  if (type.includes('Sprite')) return markRaw(PhImageSquare);
  if (type === 'Group' || type === 'Object3D') return markRaw(PhFolderOpen);
  return markRaw(PhTreeStructure); // Fallback
};

// Build the tree recursively
const buildTree = (object: THREE.Object3D): SceneTreeNode | null => {
  // Filter out internal helpers
  if (object.type === 'GridHelper' || object.type === 'AxesHelper') return null;
  // Prevent infinite loops or hidden objects
  if (object.userData?.isHelper) return null;

  // Filter out nameless empty Object3Ds (often broken serialized helpers from previous saves)
  if (object.type === 'Object3D' && !object.name && (!object.children || object.children.length === 0)) {
    return null;
  }

  const node: SceneTreeNode = {
    id: object.uuid,
    label: object.name || object.type || 'Object',
    type: object.type,
    visible: object.visible,
    icon: getIconForType(object.type)
  };

  if (object.children && object.children.length > 0) {
    const childrenNodes: SceneTreeNode[] = [];
    object.children.forEach(child => {
      const childNode = buildTree(child);
      if (childNode) childrenNodes.push(childNode);
    });
    if (childrenNodes.length > 0) {
      node.children = childrenNodes;
    }
  }

  return node;
};

// Update tree data
const updateTree = () => {
  if (!engineStore.engine || !engineStore.engine.scene) {
    treeData.value = [];
    return;
  }
  
  const rootNode = buildTree(engineStore.engine.scene);
  if (rootNode) {
    // Treat the scene as the root
    treeData.value = [rootNode];
    // Keep root expanded
    if (!expandedKeys.value.includes(rootNode.id)) {
      expandedKeys.value.push(rootNode.id);
    }
  } else {
    treeData.value = [];
  }
};

// Listen to scene graph changes
watch(() => engineStore.sceneGraphVersion, () => {
  updateTree();
}, { immediate: true });

// Handle node click
const handleNodeClick = (data: SceneTreeNode) => {
  engineStore.setSelectedObject(data.id);
};

const toggleVisibility = (e: Event, data: SceneTreeNode) => {
  e.stopPropagation();
  const obj = engineStore.engine?.scene.getObjectByProperty('uuid', data.id);
  if (obj) {
    const cmd = new VisibilityCommand(obj, !obj.visible, () => {
      data.visible = obj.visible;
      // 触发重绘以隐藏/显示包围盒
      if (engineStore.engine) {
        engineStore.engine.renderer.render(engineStore.engine.scene, engineStore.engine.camera);
      }
    });
    historyManager.execute(cmd);
  }
};

const deleteNode = (e: Event, data: SceneTreeNode) => {
  e.stopPropagation();
  if (engineStore.engine) {
    if (engineStore.selectedObjectUuid === data.id) {
      engineStore.setSelectedObject(null);
    }
    engineStore.engine.removeObjectByUuid(data.id);
  }
};

// When selected object changes from outside, highlight the tree node
watch(() => engineStore.selectedObjectUuid, (newUuid) => {
  if (newUuid && treeRef.value) {
    // 自动展开包含该节点的父节点
    const obj = engineStore.engine?.scene.getObjectByProperty('uuid', newUuid);
    if (obj) {
      let current = obj.parent;
      const keysToExpand = new Set(expandedKeys.value);
      let needsUpdate = false;
      
      while (current && current !== engineStore.engine?.scene) {
        if (!keysToExpand.has(current.uuid)) {
          keysToExpand.add(current.uuid);
          needsUpdate = true;
        }
        current = current.parent;
      }
      
      if (needsUpdate) {
        expandedKeys.value = Array.from(keysToExpand);
        if (treeRef.value && typeof treeRef.value.setExpandedKeys === 'function') {
          treeRef.value.setExpandedKeys(expandedKeys.value);
        }
      }
    }
    
    // 我们需要在 nextTick 或者等展开生效后再 set current key 吗？
    // 通常 vue 的 ref 响应式更新可以处理，但直接设当前也可以。
    setTimeout(() => {
      if (treeRef.value) {
        treeRef.value.setCurrentKey(newUuid);
        if (typeof treeRef.value.scrollToNode === 'function') {
          treeRef.value.scrollToNode(newUuid, 'center');
        } else {
          // Fallback if element-plus version is older than 2.8.0
          setTimeout(() => {
            const currentEl = document.querySelector('.custom-tree .is-current');
            if (currentEl) {
              currentEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
          }, 50);
        }
      }
    }, 50);
  } else if (!newUuid && treeRef.value) {
    treeRef.value.setCurrentKey(null);
  }
});

onMounted(() => {
  updateTree();
});
</script>

<template>
  <div class="scene-tree-container flex flex-col h-full w-full">
    <div class="h-10 border-b border-border flex items-center px-4 font-medium text-sm text-text-main shrink-0 bg-panel">
      场景树
    </div>
    <div ref="listContainerRef" class="flex-1 overflow-hidden p-2 bg-bg-base/50">
      <el-tree-v2
        v-if="height > 0"
        ref="treeRef"
        :data="treeData"
        :props="defaultProps"
        :height="height"
        :default-expanded-keys="expandedKeys"
        :highlight-current="true"
        :expand-on-click-node="false"
        @node-click="handleNodeClick"
        class="custom-tree"
      >
        <template #default="{ node, data }">
          <div class="custom-tree-node flex items-center gap-2 text-sm w-full py-1 pr-2 hover:text-accent transition-colors group">
            <component :is="data.icon" :size="16" class="text-text-muted shrink-0" weight="duotone" />
            <span class="truncate flex-1" :class="{ 'font-medium': node.isCurrent, 'opacity-50 line-through': !data.visible }">{{ data.label }}</span>
            <span class="text-[10px] text-text-muted opacity-50">{{ data.type }}</span>
            
            <!-- Actions (visible on hover) -->
            <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <button 
                @click="toggleVisibility($event, data)" 
                class="p-1 hover:text-text-main text-text-muted transition-colors rounded-sm hover:bg-bg-base"
                :title="data.visible ? '隐藏' : '显示'"
              >
                <PhEye v-if="data.visible" :size="14" />
                <PhEyeSlash v-else :size="14" />
              </button>
              <button 
                v-if="data.type !== 'Scene' && data.label !== 'MainCamera'"
                @click="deleteNode($event, data)" 
                class="p-1 hover:text-danger text-text-muted transition-colors rounded-sm hover:bg-bg-base"
                title="删除"
              >
                <PhTrash :size="14" />
              </button>
            </div>
          </div>
        </template>
      </el-tree-v2>
    </div>
  </div>
</template>

<style scoped>
.scene-tree-container {
  /* Scope wrapper */
}

/* Custom Element Plus Tree Styling to match the dark glassmorphism theme */
:deep(.el-tree-v2) {
  background: transparent;
  color: var(--color-text-main);
}
:deep(.el-tree-node__content) {
  height: 32px;
  border-radius: 4px;
  margin-bottom: 2px;
  transition: background-color 0.2s;
}
:deep(.el-tree-node__content:hover) {
  background-color: rgba(255, 255, 255, 0.05);
}
:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: color-mix(in srgb, var(--color-accent) 15%, transparent);
  color: var(--color-accent);
}
:deep(.el-tree-node.is-current > .el-tree-node__content .text-text-muted) {
  color: var(--color-accent);
  opacity: 0.8;
}
:deep(.el-tree-node.is-current > .el-tree-node__content:hover) {
  background-color: color-mix(in srgb, var(--color-accent) 25%, transparent);
}
:deep(.el-icon.el-tree-node__expand-icon) {
  color: var(--color-text-muted);
}
:deep(.el-tree-node.is-current > .el-tree-node__content .el-tree-node__expand-icon) {
  color: var(--color-accent);
}
</style>
