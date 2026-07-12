import { ClassicPreset } from 'rete';
import { SelectControl, type SelectOption } from '../common/SelectControl';
import { ExecutionSocket, BooleanSocket } from '../common/sockets';

const BOOL_OPTIONS: SelectOption[] = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' }
];

export class ConditionNode extends ClassicPreset.Node {
  width = 260;
  height = 220;
  logColor = '#ef4444';

  // 接收可选的 dataflow 引擎来支持运行时求值
  constructor(private dataflow?: any) {
    super('判断节点');
    // 执行流输入
    this.addInput('execIn', new ClassicPreset.Input(ExecutionSocket, '执行输入'));
    
    // 数据流输入，带备用控制
    const boolInput = new ClassicPreset.Input(BooleanSocket, '判断条件');
    boolInput.addControl(new SelectControl('无连线时默认值', BOOL_OPTIONS, 'true'));
    this.addInput('boolIn', boolInput);

    this.addOutput('trueOut', new ClassicPreset.Output(ExecutionSocket, '满足 (True)'));
    this.addOutput('falseOut', new ClassicPreset.Output(ExecutionSocket, '不满足 (False)'));
  }

  data(inputs: Record<string, any[]>) { return { trueOut: undefined, falseOut: undefined }; }

  async execute(_input: string, forward: (output: string) => void) {
    let isTrue = true;

    // 获取数据流连接中的输入值，如果没有连线或者没有 dataflow 引擎，则使用本地控件值
    const ctrl = this.inputs['boolIn']?.control as SelectControl;
    
    if (this.dataflow) {
      try {
        const inputs = await this.dataflow.fetchInputs(this.id);
        console.log(`[ConditionNode] fetchInputs:`, inputs);
        if (inputs.boolIn && inputs.boolIn.length > 0) {
          const val = inputs.boolIn[0];
          isTrue = val === true || val === 'true';
        } else {
          isTrue = ctrl?.value === 'true';
        }
      } catch (err) {
        console.error('[ConditionNode] fetchInputs Error:', err);
        // 如果 dataflow 不支持或报错，回退到控件值
        isTrue = ctrl?.value === 'true';
      }
    } else {
      isTrue = ctrl?.value === 'true';
    }

    const isTrueStr = isTrue ? 'True ✅' : 'False ❌';
    console.log(`%c[🚀 执行节点] 判断节点 %c评估结果: ${isTrueStr}`, 'background: #ef4444; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #ef4444; font-weight: bold;');
    
    if (isTrue) {
      forward('trueOut');
    } else {
      forward('falseOut');
    }
  }
}
