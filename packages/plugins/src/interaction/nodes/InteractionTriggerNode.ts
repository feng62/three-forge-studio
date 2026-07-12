import { ClassicPreset } from 'rete';
import type { ControlFlowEngine } from 'rete-engine';
import { SelectControl } from '../../visual-logic/engine/nodes/common/SelectControl';
import { ExecutionSocket } from '../../visual-logic/engine/nodes';
import type { Schemes } from '../../visual-logic/engine/nodes';
import { EVENT_POOL } from '../types';
import { InteractionEditorPlugin } from '../editor';

export class InteractionTriggerNode extends ClassicPreset.Node {
  width = 280;
  height = 200;
  logColor = '#3b82f6'; // 蓝色

  public onControlUpdate?: (key: string) => void;

  constructor(private engine?: ControlFlowEngine<Schemes>, private dataflow?: any) {
    super('交互触发器');
    this.addOutput('exec', new ClassicPreset.Output(ExecutionSocket, '执行 (输出)'));

    // 目标模型选项控制
    const targetModelCtrl = new SelectControl('目标模型', []);

    // 交互事件选项控制
    const eventTypeOptions = EVENT_POOL.map(ev => ({ label: ev, value: ev }));
    const eventTypeCtrl = new SelectControl('交互事件', eventTypeOptions, '', (newEventType) => {
      // 查询这个事件下有哪些模型
      const data = InteractionEditorPlugin.loadData();
      const refs = data.events?.[newEventType] || [];
      
      targetModelCtrl.options = refs.map((ref: any) => {
        const label = ref.name || (ref.path ? `${ref.uuid} (${ref.path})` : ref.uuid);
        // 为了后续能唯一定位模型，使用 ref 的 JSON 作为 value
        const value = JSON.stringify(ref);
        return { label, value };
      });
      targetModelCtrl.value = '';
      if (this.onControlUpdate) this.onControlUpdate('targetModel');
    });

    this.addControl('eventType', eventTypeCtrl);
    this.addControl('targetModel', targetModelCtrl);
  }

  execute(_input: string, forward: (output: string) => void) {
    const eventTypeCtrl = this.controls['eventType'] as SelectControl;
    const targetModelCtrl = this.controls['targetModel'] as SelectControl;
    
    let targetLabel = '未知';
    if (targetModelCtrl.value) {
      try {
        const ref = JSON.parse(targetModelCtrl.value);
        targetLabel = ref.name || (ref.path ? `${ref.uuid} (${ref.path})` : ref.uuid);
      } catch (e) {
        // ignore
      }
    }
    
    console.log(`%c[🚀 执行节点] 交互触发器 %c匹配成功！事件:【${eventTypeCtrl.value}】 目标:【${targetLabel}】`, 'background: #3b82f6; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #3b82f6;');
    forward('exec');
  }

  data(inputs: Record<string, any[]>) { return { exec: undefined }; }
}
