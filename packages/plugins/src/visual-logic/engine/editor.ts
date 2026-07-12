import { NodeEditor } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { VuePlugin, Presets, type VueArea2D } from 'rete-vue-plugin';
import { ControlFlowEngine, DataflowEngine } from 'rete-engine';
import { AutoArrangePlugin, Presets as ArrangePresets } from 'rete-auto-arrange-plugin';
import { ContextMenuPlugin, Presets as ContextMenuPresets } from 'rete-context-menu-plugin';
import { type MinimapExtra, MinimapPlugin } from 'rete-minimap-plugin';
import { ReroutePlugin, type RerouteExtra, RerouteExtensions } from 'rete-connection-reroute-plugin';

import { ButtonControl } from './nodes/common/ButtonControl';
import CustomButton from './nodes/common/CustomButton.vue';
import { SelectControl } from './nodes/common/SelectControl';
import CustomSelect from './nodes/common/CustomSelect.vue';
import { InputControl } from './nodes/common/InputControl';
import CustomInput from './nodes/common/CustomInput.vue';
import CustomSocket from './nodes/common/CustomSocket.vue';
import CustomConnection from './nodes/common/CustomConnection.vue';
import { addCustomBackground } from './nodes/common/custom-background';

import { SystemActionNode, BusinessActionNode, GetVariableNode, SetVariableNode, ConditionNode, LogicNode, Connection, type Schemes, type Node } from './nodes/index';
import { NODE_REGISTRY, getNodeComponent, createNodeFromName } from './nodes/registry';
import { globalVars } from './variables';

type AreaExtra =
  | VueArea2D<Schemes>
  | ContextMenuPlugin<Schemes>
  | MinimapExtra
  | RerouteExtra;

export async function createControlFlowEditor(container: HTMLElement, onGraphSave?: (data: any) => void) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new VuePlugin<Schemes, AreaExtra>();
  const reroutePlugin = new ReroutePlugin<Schemes>();
  
  const engine = new ControlFlowEngine<Schemes>();
  const dataflow = new DataflowEngine<Schemes>();

  editor.use(engine);
  editor.use(dataflow);
  editor.use(area);
  area.use(connection);
  area.use(render);
  
  const minimap = new MinimapPlugin<Schemes>();
  area.use(minimap);
  // @ts-ignore
  render.use(reroutePlugin);

  // 禁用画布双击放大功能
  area.container.addEventListener('dblclick', (e) => {
    e.stopPropagation();
  }, { capture: true });

  // 禁用浏览器默认右键菜单，确保 Rete 的右键菜单优先
  area.container.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  render.addPreset(Presets.classic.setup({
    customize: {
      node(data) {
        return getNodeComponent(data.payload);
      },
      socket(data) {
        return CustomSocket as any;
      },
      connection(data) {
        return CustomConnection as any;
      },
      control(data) {
        if (data.payload instanceof ButtonControl) {
          return CustomButton as any;
        }
        if (data.payload instanceof SelectControl) {
          return CustomSelect as any;
        }
        if (data.payload instanceof InputControl) {
          return CustomInput as any;
        }
        return Presets.classic.Control as any; // fall back to default
      }
    }
  }));
  // @ts-ignore
  render.addPreset(Presets.contextMenu.setup());
  render.addPreset(Presets.minimap.setup());
  // @ts-ignore
  // @ts-ignore
  render.addPreset(Presets.reroute.setup({
    contextMenu(id) { reroutePlugin.remove(id); },
    translate(id, dx, dy) { reroutePlugin.translate(id, dx, dy); },
    pointerdown(id) {
      reroutePlugin.unselect(id);
      reroutePlugin.select(id);
    }
  }));

  connection.addPreset(ConnectionPresets.classic.setup());

  editor.addPipe(context => {
    if (context.type === 'connectioncreated') {
      const conn = context.data;
      const targetNode = editor.getNode(conn.target);
      if (targetNode) {
        const input = targetNode.inputs[conn.targetInput];
        if (input) {
          input.showControl = false;
          area.update('node', conn.target);
        }
      }
    }
    if (context.type === 'connectionremoved') {
      const conn = context.data;
      const targetNode = editor.getNode(conn.target);
      if (targetNode) {
        const input = targetNode.inputs[conn.targetInput];
        
        // 检查是否还有其他连接到同一个输入插口
        const hasOtherConnections = editor.getConnections().some(c => c.target === conn.target && c.targetInput === conn.targetInput && c.id !== conn.id);
        
        if (input && !hasOtherConnections) {
          input.showControl = true;
          area.update('node', conn.target);
        }
      }
    }
    return context;
  });

  // 动态生成右键菜单
  const menuItems = NODE_REGISTRY.map(config => {
    return [config.label, () => {
      const n = config.factory({ engine, dataflow });
      if (config.setupEditor) {
        config.setupEditor(n, area);
      }
      return n;
    }] as [string, () => any];
  });

  // @ts-ignore
  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: ContextMenuPresets.classic.setup(menuItems),
  });
  // @ts-ignore
  area.use(contextMenu);

  AreaExtensions.simpleNodesOrder(area);
  const selector = AreaExtensions.selector();
  const accumulating = AreaExtensions.accumulateOnCtrl();
  AreaExtensions.selectableNodes(area, selector, { accumulating });
  RerouteExtensions.selectablePins(reroutePlugin, selector, accumulating);
  addCustomBackground(area);

  const getGraphData = () => {
    // 导出时不仅导出名称，还要导出下拉框的值
    return {
      nodes: editor.getNodes().map(n => {
        const controlsData: Record<string, string> = {};
        
        // 导出直接挂载在节点上的 control
        Object.keys(n.controls).forEach(key => {
          const ctrl = n.controls[key] as any;
          if (ctrl && ctrl.value !== undefined) {
            controlsData[key] = ctrl.value;
          }
        });

        // 导出挂载在输入引脚 (Input) 上的 control (例如无连线时的默认值)
        Object.keys(n.inputs).forEach(key => {
          const input = n.inputs[key] as any;
          if (input && input.control && input.control.value !== undefined) {
            controlsData[`input_${key}`] = input.control.value;
          }
        });

        const view = area.nodeViews.get(n.id);
        return { 
          id: n.id, 
          name: n.label,
          controls: controlsData,
          position: view ? { x: view.position.x, y: view.position.y } : { x: 0, y: 0 }
        };
      }),
      connections: editor.getConnections().map(c => ({
        id: c.id,
        source: c.source,
        sourceOutput: c.sourceOutput,
        target: c.target,
        targetInput: c.targetInput
      })),
      variables: [...globalVars.variables] // 深拷贝防止引用污染
    };
  };

  const importGraphData = async (data: any) => {
    if (!data) return;
    try {
      // 导入当前流程的变量
      if (data.variables && Array.isArray(data.variables)) {
        globalVars.setVariables(data.variables);
      } else {
        globalVars.setVariables([]);
      }
      
      // 清理现有连线和节点
      await clearCanvas();
      
      const nodeMap = new Map<string, any>();
      for (const n of data.nodes) {
        let config = NODE_REGISTRY.find(c => c.label === n.name || (c.aliases && c.aliases.includes(n.name)));
        let node = config ? config.factory({ engine, dataflow }) : null;
        if (!node) {
          console.error(`[VisualLogic] 找不到节点定义: ${n.name}`);
          continue;
        }

        try {
          node.id = n.id;

          // 添加节点（必须先添加，再设值，否则触发更新时节点还不存在）
          await editor.addNode(node);
          nodeMap.set(n.id, node);

          // 恢复事件绑定和特殊数据
          if (config && config.setupEditor) {
            config.setupEditor(node, area);
            // 这里为了兼容之前的 triggerSave 逻辑
            const originalOnControlUpdate = node.onControlUpdate;
            node.onControlUpdate = (key: string) => {
              if (originalOnControlUpdate) originalOnControlUpdate(key);
              triggerSave();
            };
          }

          if (config && config.onRestore) {
            config.onRestore(node, { wf: data.wf || {}, statesMap: data.statesMap || {}, data: data });
          }
        
        // 设值
        if (n.controls) {
          Object.keys(n.controls).forEach(ctrlKey => {
            if (ctrlKey.startsWith('input_')) {
              const inputName = ctrlKey.replace('input_', '');
              const inputSocket = node.inputs[inputName];
              if (inputSocket && inputSocket.control && 'value' in inputSocket.control) {
                if (typeof (inputSocket.control as any).setValue === 'function') {
                  (inputSocket.control as any).setValue(n.controls[ctrlKey]);
                } else {
                  (inputSocket.control as any).value = n.controls[ctrlKey];
                }
                if (inputSocket.control.id) {
                  area.update('control', inputSocket.control.id);
                }
              }
            } else {
              const control = node.controls[ctrlKey];
              if (control && typeof control === 'object' && 'value' in control) {
                if (typeof (control as any).setValue === 'function') {
                  (control as any).setValue(n.controls[ctrlKey]);
                } else {
                  (control as any).value = n.controls[ctrlKey];
                }
                if (control.id) {
                  area.update('control', control.id);
                }
              }
            }
          });
          area.update('node', node.id);
        }
        
        if (n.position) {
          await area.translate(node.id, n.position);
        }
        } catch (e) {
          console.error(`[VisualLogic] 导入节点失败: ${n.name}`, e);
        }
      }
      
      for (const c of data.connections) {
        const source = nodeMap.get(c.source);
        const target = nodeMap.get(c.target);
        if (source && target) {
          const conn = new Connection(source, c.sourceOutput as never, target, c.targetInput as never);
          conn.id = c.id;
          await editor.addConnection(conn);
        }
      }
    } catch (e) {
      console.error('Failed to import JSON', e);
    }
  };

  const clearCanvas = async () => {
    const existingConns = [...editor.getConnections()];
    for (const c of existingConns) {
      await editor.removeConnection(c.id);
    }
    const existingNodes = [...editor.getNodes()];
    for (const n of existingNodes) {
      await editor.removeNode(n.id);
    }
  };

  let saveTimeout: any;
  const triggerSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (onGraphSave) {
        onGraphSave(getGraphData());
      }
    }, 1000);
  };

  // Auto-save disabled per user request
  // editor.addPipe(context => {
  //   if (['nodecreated', 'noderemoved', 'connectioncreated', 'connectionremoved', 'nodetranslated'].includes(context.type)) {
  //     triggerSave();
  //   }
  //   return context;
  // });

  return {
    destroy: () => area.destroy(),
    editor,
    getGraphData,
    importGraphData,
    clearCanvas,
    area,
    engine,
    dataflow
  };
}
