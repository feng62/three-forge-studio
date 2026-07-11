import { ClassicPreset, type GetSchemes } from 'rete';
import type { TriggerNode } from './trigger/TriggerNode';
import type { SystemActionNode } from './system-action/SystemActionNode';
import type { BusinessActionNode } from './business-action/BusinessActionNode';
import type { GetVariableNode } from './variables/GetVariableNode';
import type { SetVariableNode } from './variables/SetVariableNode';
import type { LogicNode } from './logic/LogicNode';
import type { ConditionNode } from './condition/ConditionNode';

export type Node = TriggerNode | SystemActionNode | BusinessActionNode | GetVariableNode | SetVariableNode | LogicNode | ConditionNode;

export class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> {}

export type ConnProps = Connection<Node, Node>;

export type Schemes = GetSchemes<Node, ConnProps>;
