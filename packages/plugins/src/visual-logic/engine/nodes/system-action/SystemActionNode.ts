import { ClassicPreset } from 'rete';
import { SelectControl, type SelectOption } from '../common/SelectControl';
import { ExecutionSocket } from '../common/sockets';

const SYSTEM_ACTIONS: SelectOption[] = [
  { label: '写入日志文件', value: 'write_log' },
  { label: '清理缓存', value: 'clear_cache' },
  { label: '重启服务', value: 'restart_svc' }
];

export class SystemActionNode extends ClassicPreset.Node {
  width = 240;
  height = 180;
  logColor = '#3b82f6'; // 蓝色

  constructor() {
    super('系统动作节点');
    this.addInput('execIn', new ClassicPreset.Input(ExecutionSocket, '输入'));
    
    this.addControl('sysAction', new SelectControl('系统指令', SYSTEM_ACTIONS));

    this.addOutput('before', new ClassicPreset.Output(ExecutionSocket, '立刻继续'));
    this.addOutput('after', new ClassicPreset.Output(ExecutionSocket, '延时继续'));
  }

  execute(_input: string, forward: (output: string) => void) {
    const actionVal = (this.controls['sysAction'] as SelectControl).value;
    if (!actionVal) {
      console.warn(`[Engine] 🛑 系统动作节点 执行中止：尚未选择系统指令！`);
      return;
    }
    
    const actionLabel = SYSTEM_ACTIONS.find(a => a.value === actionVal)?.label || actionVal;
    console.log(`%c[🚀 执行节点] 系统动作节点 %c开始执行指令: 【${actionLabel}】...`, 'background: #3b82f6; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #3b82f6;');

    forward('before');

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`%c[✅ 任务完成] 系统动作节点 %c【${actionLabel}】`, 'background: #10b981; color: #fff; font-size: 12px; padding: 2px 4px; border-radius: 4px;', 'color: #10b981;');
        forward('after');
        resolve();
      }, 1000);
    });
  }
  
  data(inputs: Record<string, any[]>) { return { before: undefined, after: undefined }; }
}
