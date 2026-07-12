import { ClassicPreset } from 'rete';
import { SelectControl, type SelectOption } from '../common/SelectControl';
import { AnySocket, BooleanSocket } from '../common/sockets';

const LOGIC_OPERATORS: SelectOption[] = [
  { label: '== (等于)', value: '==' },
  { label: '!= (不等于)', value: '!=' },
  { label: '> (大于)', value: '>' },
  { label: '>= (大于等于)', value: '>=' },
  { label: '< (小于)', value: '<' },
  { label: '<= (小于等于)', value: '<=' },
  { label: '&& (并且)', value: '&&' },
  { label: '|| (或者)', value: '||' }
];

export class LogicNode extends ClassicPreset.Node {
  width = 240;
  height = 200;
  logColor = '#06b6d4';

  constructor(private dataflow?: any) {
    super('逻辑运算');

    // 允许任意类型的数据连入进行比较
    this.addInput('a', new ClassicPreset.Input(AnySocket, 'A (数据)'));
    this.addInput('b', new ClassicPreset.Input(AnySocket, 'B (数据)'));
    
    this.addControl('operator', new SelectControl('比较符', LOGIC_OPERATORS, '=='));

    this.addOutput('result', new ClassicPreset.Output(BooleanSocket, '结果 (Boolean)'));
  }

  data(inputs: Record<string, any[]>) {
    let a = inputs.a ? inputs.a[0] : null;
    let b = inputs.b ? inputs.b[0] : null;

    const op = (this.controls['operator'] as SelectControl).value;
    
    let result = false;
    switch (op) {
      case '==': result = a == b; break;
      case '!=': result = a != b; break;
      case '>': result = a > b; break;
      case '>=': result = a >= b; break;
      case '<': result = a < b; break;
      case '<=': result = a <= b; break;
      case '&&': result = a && b; break;
      case '||': result = a || b; break;
    }

    console.log(`%c[🧬 数据提取] 逻辑运算节点 %c计算: ${a} ${op} ${b} => ${result}`, 'background: #3b82f6; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #3b82f6;');

    return { result };
  }

  execute(_input: string, forward: (output: string) => void) { }
}
