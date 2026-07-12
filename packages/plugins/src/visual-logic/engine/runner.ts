import { NodeEditor } from 'rete';
import { ControlFlowEngine, DataflowEngine } from 'rete-engine';
import { Connection, type Schemes } from './nodes/index';
import { NODE_REGISTRY } from './nodes/registry';
import type { SelectControl } from './nodes/common/SelectControl';
import type { InputControl } from './nodes/common/InputControl';

/**
 * 描述前端导出的流程图 JSON 结构
 */
export interface GraphData {
  // 节点集合
  nodes: { id: string, name: string, controls?: Record<string, string> }[];
  // 连线集合（控制流方向）
  connections: {
    id: string;
    source: string;        // 起始节点 ID
    sourceOutput: string;  // 起始节点输出端口
    target: string;        // 目标节点 ID
    targetInput: string;   // 目标节点输入端口
  }[];
}

/**
 * 无头执行引擎（Headless Engine）
 * 将前端可视化的 JSON 画布数据在纯逻辑层面上运行，脱离 UI 组件。
 *
 * @param workflows
 * @param payload 外部事件的荷载参数（例如当前发生的业务属于哪个省市）
 * @param statesMap
 */
export async function runHeadlessEngine(
  workflows: Array<{ id: string, name: string, data: GraphData }>, 
  payload: any,
  statesMap: Record<string, any> = {}
) {
  if (!Array.isArray(workflows)) {
    throw new Error('Invalid JSON format. Expected an array of workflows.');
  }
  let matchedAndExecuted = false;
  const executePromises: Promise<any>[] = [];

  for (const wf of workflows) {
    const data = wf.data;
    if (!data || !data.nodes || !data.connections) {
      continue; // Skip invalid workflows
    }

    // 初始化 Rete 核心节点编辑器和控制流执行引擎
    const editor = new NodeEditor<Schemes>();
    // @ts-ignore
    const engine = new ControlFlowEngine<Schemes>();
    // @ts-ignore
    const dataflow = new DataflowEngine<Schemes>();
    
    editor.use(engine);
    editor.use(dataflow);

    // 用一个 Map 缓存实例化后的节点，以便后续建立连线时能根据 ID 快速查找
    const nodeMap = new Map<string, any>();
    
    // 1. 还原并实例化节点
    for (const n of data.nodes) {
      // 在注册表中查找匹配的配置（匹配 name 或 alias）
      const config = NODE_REGISTRY.find(c => c.label === n.name || (c.aliases && c.aliases.includes(n.name)));
      
      if (!config) {
        console.warn(`[Engine] 未知节点类型: ${n.name}`);
        continue;
      }
      
      // 使用工厂方法实例化节点
      let node = config.factory({ engine, dataflow });
      
      // 如果配置了还原钩子，则执行特殊注入（例如变量作用域隔离）
      if (config.onRestore) {
        config.onRestore(node, { wf, statesMap, data });
      }
      
      // 强制恢复原有的 ID，这对于后续连线非常关键
      node.id = n.id;
      
      // 恢复节点内部控件（如下拉框）的值
      if (n.controls) {
        Object.keys(n.controls).forEach(ctrlKey => {
          if (ctrlKey.startsWith('input_')) {
            // 恢复挂载在引脚（Input）上的附加控件值
            const inputName = ctrlKey.replace('input_', '');
            const inputSocket = node.inputs[inputName];
            if (inputSocket && inputSocket.control && 'value' in inputSocket.control) {
              (inputSocket.control as any).setValue(n.controls![ctrlKey] || '');
            }
          } else {
            // 恢复直接挂载在节点上的控件值
            const control = node.controls[ctrlKey];
            if (control instanceof Object && 'value' in control) {
              if (ctrlKey === 'varName' && control.hasOwnProperty('setValue')) {
                (control as any).setValue(n.controls![ctrlKey] || '');
              } else if (control.hasOwnProperty('setValue')) {
                (control as any).setValue(n.controls![ctrlKey] || '');
              } else {
                (control as any).value = n.controls![ctrlKey] || '';
              }
            }
          }
        });
      }

      await editor.addNode(node);
      nodeMap.set(n.id, node);
    }

    // 2. 还原并建立控制流连线
    for (const c of data.connections) {
      const source = nodeMap.get(c.source);
      const target = nodeMap.get(c.target);
      if (source && target) {
        // 创建一条从 source 到 target 的连接线
        const conn = new Connection(source, c.sourceOutput as never, target, c.targetInput as never);
        conn.id = c.id; // 保持原有连线 ID
        await editor.addConnection(conn);
      }
    }

    // 3. 寻找入口触发节点并尝试启动流程
    const interactionTriggers = editor.getNodes().filter(n => (n as any).label === '交互触发器');

    if (interactionTriggers.length === 0) {
      continue;
    }

    // 处理交互触发器
    for (const trigger of interactionTriggers) {
      if (payload?.type !== 'interaction') continue;

      const eventTypeCtrl = trigger.controls['eventType'] as SelectControl;
      const targetModelCtrl = trigger.controls['targetModel'] as SelectControl;
      
      const configuredEventType = eventTypeCtrl.value;
      const configuredTargetJson = targetModelCtrl.value;
      const receivedEvent = payload.interactionEvent;
      
      // 判断事件类型是否匹配
      if (configuredEventType !== receivedEvent.eventType) {
        continue;
      }

      // 判断目标模型是否匹配
      if (configuredTargetJson) {
        try {
          const configuredTarget = JSON.parse(configuredTargetJson);
          if (configuredTarget.uuid !== receivedEvent.ref.uuid || configuredTarget.path !== receivedEvent.ref.path) {
             continue;
          }
        } catch (e) {
          continue; // 解析错误则不触发
        }
      } else {
        continue; // 若未配置目标则不触发
      }

      const logColor = (trigger as any).logColor || '#3b82f6';
      console.log(`%c[🚀 触发节点] 🎯 匹配到流程【${wf.name}】，触发交互事件：【${configuredEventType}】`, `background: ${logColor}; color: #fff; font-size: 13px; padding: 4px; border-radius: 4px;`);
      
      dataflow.reset();
      const execPromise = Promise.resolve(engine.execute(trigger.id));
      executePromises.push(execPromise);
      matchedAndExecuted = true;
    }
  }

  if (!matchedAndExecuted) {
    console.log(`[Engine] 🔍 未找到匹配事件参数的流程或执行节点，事件被丢弃。`);
  }

  // 等待所有的引擎执行完毕
  await Promise.all(executePromises);

  // 执行完毕后，返回最新的隔离状态 Map
  return statesMap;
}
