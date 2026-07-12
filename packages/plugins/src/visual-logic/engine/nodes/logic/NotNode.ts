import { ClassicPreset } from 'rete';
import { BooleanSocket } from '../common/sockets';

export class NotNode extends ClassicPreset.Node {
  width = 200;
  height = 130;
  logColor = '#ef4444'; // 红色

  constructor(private dataflow?: any) {
    super('逻辑取反');

    this.addInput('boolIn', new ClassicPreset.Input(BooleanSocket, '输入 (布尔)'));
    this.addOutput('boolOut', new ClassicPreset.Output(BooleanSocket, '相反值 (布尔)'));
  }

  data(inputs: Record<string, any[]>) {
    let inputVal = false;
    
    if (inputs.boolIn && inputs.boolIn.length > 0) {
      const val = inputs.boolIn[0];
      inputVal = val === true || val === 'true';
    }

    const result = !inputVal;
    console.log(`%c[🧬 数据提取] 逻辑取反节点 %c计算: !${inputVal} => ${result}`, 'background: #ef4444; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #ef4444;');

    return { boolOut: result };
  }

  execute(_input: string, forward: (output: string) => void) { }
}
