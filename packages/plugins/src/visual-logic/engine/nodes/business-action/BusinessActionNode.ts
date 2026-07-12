import { ClassicPreset } from 'rete';
import { SelectControl, type SelectOption } from '../common/SelectControl';
import { ExecutionSocket } from '../common/sockets';

const BIZ_ACTIONS: SelectOption[] = [
  { label: '发送营销短信', value: 'send_sms' },
  { label: '创建退款订单', value: 'refund_order' },
  { label: '同步客户数据', value: 'sync_crm' }
];

export class BusinessActionNode extends ClassicPreset.Node {
  width = 260;
  height = 260;
  logColor = '#f59e0b';

  constructor() {
    super('业务动作节点');
    this.addInput('execIn', new ClassicPreset.Input(ExecutionSocket, '输入'));
    
    this.addControl('bizAction', new SelectControl('业务动作', BIZ_ACTIONS));

    this.addOutput('before', new ClassicPreset.Output(ExecutionSocket, '立刻继续'));
    this.addOutput('after', new ClassicPreset.Output(ExecutionSocket, '延时继续'));
  }

  execute(_input: string, forward: (output: string) => void) {
    const actionVal = (this.controls['bizAction'] as SelectControl).value;
    if (!actionVal) {
      console.warn(`[Engine] 🛑 业务动作节点 执行中止：尚未选择业务动作！`);
      return;
    }
    
    const actionLabel = BIZ_ACTIONS.find(a => a.value === actionVal)?.label || actionVal;
    console.log(`%c[🚀 执行节点] 业务动作节点 %c开始执行业务: 【${actionLabel}】...`, 'background: #10b981; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #10b981;');

    forward('before');

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`%c[✅ 任务完成] 业务动作节点 %c【${actionLabel}】`, 'background: #10b981; color: #fff; font-size: 12px; padding: 2px 4px; border-radius: 4px;', 'color: #10b981;');
        forward('after');
        resolve();
      }, 2000);
    });
  }
  
  data(inputs: Record<string, any[]>) { return { before: undefined, after: undefined }; }
}
