import { SystemActionNode, BusinessActionNode, DelayNode, GetVariableNode, SetVariableNode, LogicNode, NotNode, ConditionNode } from './index';

import CustomVariableNode from './variables/CustomVariableNode.vue';
import CustomSystemNode from './system-action/CustomSystemNode.vue';
import CustomNode from './common/CustomNode.vue';

// 导入交互插件自身的触发器节点
import { InteractionTriggerNode } from '../../../interaction/nodes/InteractionTriggerNode';
import { CameraAnimationNode } from '../../../camera-animation/nodes/CameraAnimationNode';
import { SetLabelVisibleNode } from '../../../label/nodes/SetLabelVisibleNode';
import { GetLabelVisibleNode } from '../../../label/nodes/GetLabelVisibleNode';

export interface NodeConfig {
  label: string;
  aliases?: string[];
  NodeClass: any;
  vueComponent?: any;
  factory: (context: { engine: any; dataflow: any }) => any;
  setupEditor?: (node: any, area: any) => void;
  onRestore?: (node: any, context: { wf: any; statesMap: any; data: any }) => void;
}

const defaultSetupEditor = (node: any, area: any) => {
  node.onControlUpdate = (key: string) => {
    const ctrl = node.controls[key];
    if (ctrl) area.update('control', ctrl.id);
  };
  node.onNodeUpdate = () => area.update('node', node.id);
};

export const NODE_REGISTRY: NodeConfig[] = [

  {
    label: '交互触发器',
    NodeClass: InteractionTriggerNode,
    factory: ({ engine, dataflow }) => new InteractionTriggerNode(engine, dataflow),
    setupEditor: defaultSetupEditor
  },
  {
    label: '播放视角动画',
    NodeClass: CameraAnimationNode,
    factory: () => new CameraAnimationNode(),
    setupEditor: defaultSetupEditor
  },
  {
    label: '设置标签显示状态',
    NodeClass: SetLabelVisibleNode,
    factory: ({ dataflow }) => new SetLabelVisibleNode(dataflow),
    setupEditor: defaultSetupEditor
  },
  {
    label: '获取标签显示状态',
    NodeClass: GetLabelVisibleNode,
    factory: ({ dataflow }) => new GetLabelVisibleNode(dataflow),
    setupEditor: defaultSetupEditor
  },
  {
    label: '系统动作节点',
    NodeClass: SystemActionNode,
    vueComponent: CustomSystemNode,
    factory: () => new SystemActionNode(),
    setupEditor: defaultSetupEditor
  },
  {
    label: '业务动作节点',
    NodeClass: BusinessActionNode,
    factory: () => new BusinessActionNode(),
    setupEditor: defaultSetupEditor
  },
  {
    label: '延时节点',
    NodeClass: DelayNode,
    factory: () => new DelayNode(),
    setupEditor: defaultSetupEditor
  },
  {
    label: '获取变量',
    aliases: ['获取全局变量'],
    NodeClass: GetVariableNode,
    vueComponent: CustomVariableNode,
    factory: () => new GetVariableNode(),
    setupEditor: defaultSetupEditor,
    onRestore: (node, { wf, statesMap, data }) => {
      node.workflowState = statesMap[wf.id] || {};
      node.workflowVariables = data.variables || [];
    }
  },
  {
    label: '设置变量',
    aliases: ['设置全局变量'],
    NodeClass: SetVariableNode,
    factory: ({ dataflow }) => new SetVariableNode(dataflow),
    setupEditor: defaultSetupEditor,
    onRestore: (node, { wf, statesMap, data }) => {
      node.workflowState = statesMap[wf.id] || {};
      node.workflowVariables = data.variables || [];
      node.workflowData = data;
    }
  },
  {
    label: '逻辑运算',
    NodeClass: LogicNode,
    factory: ({ dataflow }) => new LogicNode(dataflow),
    setupEditor: defaultSetupEditor
  },
  {
    label: '逻辑取反',
    aliases: ['相反值节点', 'NotNode'],
    NodeClass: NotNode,
    factory: ({ dataflow }) => new NotNode(dataflow),
    setupEditor: defaultSetupEditor
  },
  {
    label: '判断节点',
    NodeClass: ConditionNode,
    factory: ({ dataflow }) => new ConditionNode(dataflow),
    setupEditor: defaultSetupEditor
  }
];

export function getNodeComponent(nodeInstance: any) {
  for (const config of NODE_REGISTRY) {
    if (nodeInstance instanceof config.NodeClass) {
      return config.vueComponent || CustomNode;
    }
  }
  return CustomNode;
}

export function createNodeFromName(name: string, context: { engine: any; dataflow: any }) {
  for (const config of NODE_REGISTRY) {
    if (config.label === name || (config.aliases && config.aliases.includes(name))) {
      return config.factory(context);
    }
  }
  return null;
}
