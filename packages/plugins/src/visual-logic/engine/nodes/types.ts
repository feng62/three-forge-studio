import { ClassicPreset, type GetSchemes } from 'rete';

import type { SystemActionNode } from './system-action/SystemActionNode';
import type { BusinessActionNode } from './business-action/BusinessActionNode';
import type { GetVariableNode } from './variables/GetVariableNode';
import type { SetVariableNode } from './variables/SetVariableNode';
import type { LogicNode } from './logic/LogicNode';
import type { NotNode } from './logic/NotNode';
import type { ConditionNode } from './condition/ConditionNode';
import type { DelayNode } from './delay/DelayNode';

import type { InteractionTriggerNode } from '../../../interaction/nodes/InteractionTriggerNode';
import type { CameraAnimationNode } from '../../../camera-animation/nodes/CameraAnimationNode';
import type { SetLabelVisibleNode } from '../../../label/nodes/SetLabelVisibleNode';
import type { GetLabelVisibleNode } from '../../../label/nodes/GetLabelVisibleNode';

export type Node = InteractionTriggerNode | CameraAnimationNode | SetLabelVisibleNode | GetLabelVisibleNode | SystemActionNode | BusinessActionNode | DelayNode | GetVariableNode | SetVariableNode | LogicNode | NotNode | ConditionNode;

export class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> {}

export type ConnProps = Connection<Node, Node>;

export type Schemes = GetSchemes<Node, ConnProps>;
