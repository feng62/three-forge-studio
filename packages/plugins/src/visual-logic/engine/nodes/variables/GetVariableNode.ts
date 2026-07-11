import { ClassicPreset } from 'rete';
import { SelectControl } from '../common/SelectControl';
import { AnySocket, getSocketByType } from '../common/sockets';
import { globalVars } from '../../variables';

export class GetVariableNode extends ClassicPreset.Node {
  width = 200;
  height = 120;
  logColor = '#f59e0b'; // 橙色

  public onNodeUpdate?: () => void;
  public onControlUpdate?: (key: string) => void;
  private unsubscribe: () => void;

  constructor() {
    super('获取变量');
    
    // 初始化选择控件
    const varCtrl = new SelectControl('变量', this.getVarOptions(), '', (newVarId) => {
      this.syncSocketType(newVarId);
      if (this.onControlUpdate) this.onControlUpdate('varSelect');
    });
    this.addControl('varSelect', varCtrl);

    // 初始化默认输出口
    this.addOutput('valOut', new ClassicPreset.Output(AnySocket, '输出值'));
    
    // 订阅全局变量变更
    this.unsubscribe = globalVars.subscribe(() => {
      varCtrl.options = this.getVarOptions();
      // 如果当前选中的变量被删除了，重置
      if (!globalVars.variables.find(v => v.id === varCtrl.value)) {
        varCtrl.value = '';
      }
      this.syncSocketType(varCtrl.value);
      if (this.onControlUpdate) this.onControlUpdate('varSelect');
    });
  }

  getVarOptions() {
    return globalVars.variables.map(v => ({ label: v.name, value: v.id }));
  }

  syncSocketType(varId: string) {
    const v = globalVars.variables.find(v => v.id === varId);
    const type = v ? v.type : 'any';
    
    // 如果原先存在同名输出，需要比对类型
    const currentOut = this.outputs['valOut'];
    const newSocket = getSocketByType(type);
    
    if (!currentOut || currentOut.socket.name !== newSocket.name) {
      if (currentOut) this.removeOutput('valOut');
      this.addOutput('valOut', new ClassicPreset.Output(newSocket, '输出值'));
      if (this.onNodeUpdate) this.onNodeUpdate();
    }
  }

  // 当 DataflowEngine 向此节点索要数据时触发
  data(inputs: Record<string, any[]>) {
    const varId = (this.controls['varSelect'] as SelectControl).value;
    
    // 优先读取注入的 workflowVariables，否则降级读取编辑器里的 globalVars
    const variables = (this as any).workflowVariables || globalVars.variables;
    const v = variables.find((v: any) => v.id === varId);
    
    // 优先读取注入的 workflowState，否则使用编辑器运行时的全局状态
    const state = (this as any).workflowState || globalVars.runtimeState;
    let val = v ? state[v.name] : undefined;

    // 提供类型安全的默认值
    if (val === undefined && v) {
      if (v.initialValue !== undefined) val = v.initialValue;
      else if (v.type === 'boolean') val = false;
      else if (v.type === 'number') val = 0;
      else if (v.type === 'string') val = '';
    }

    console.log(`%c[🧬 数据提取] 获取变量节点 %c读取【${v ? v.name : '未知变量'}】 = ${val}`, 'background: #f59e0b; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #f59e0b;');

    return { valOut: val };
  }

  execute(_input: string, forward: (output: string) => void) { }
}
