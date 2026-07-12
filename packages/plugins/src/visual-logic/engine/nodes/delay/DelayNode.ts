import { ClassicPreset } from 'rete';
import { InputControl } from '../common/InputControl';
import { ExecutionSocket } from '../common/sockets';

export class DelayNode extends ClassicPreset.Node {
  width = 240;
  height = 160;
  logColor = '#6366f1';

  public onControlUpdate?: (key: string) => void;

  constructor() {
    super('延时节点');
    
    this.addInput('execIn', new ClassicPreset.Input(ExecutionSocket, '输入'));
    
    // 默认 2000 毫秒
    const delayCtrl = new InputControl('延时时间(ms)', '2000', (val) => {
      if (this.onControlUpdate) this.onControlUpdate('delayTime');
    });
    this.addControl('delayTime', delayCtrl);

    this.addOutput('execOut', new ClassicPreset.Output(ExecutionSocket, '继续执行'));
  }

  execute(_input: string, forward: (output: string) => void) {
    const delayCtrl = this.controls['delayTime'] as InputControl;
    let ms = parseInt(delayCtrl.value, 10);
    
    if (isNaN(ms) || ms < 0) {
      ms = 0;
    }

    console.log(`%c[🚀 执行节点] 延时节点 %c开始延时: 【${ms}ms】...`, `background: ${this.logColor}; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;`, `color: ${this.logColor};`);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`%c[✅ 任务完成] 延时节点 %c延时结束，释放执行`, 'background: #10b981; color: #fff; font-size: 12px; padding: 2px 4px; border-radius: 4px;', 'color: #10b981;');
        forward('execOut');
        resolve();
      }, ms);
    });
  }

  data(inputs: Record<string, any[]>) { return { execOut: undefined }; }
}
