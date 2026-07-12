// 导入 rete 的 ClassicPreset，用于创建经典节点
import { ClassicPreset } from 'rete';
// 导入自定义的下拉选择控件
import { SelectControl } from '../common/SelectControl';
// 导入自定义的文本输入控件
import { InputControl } from '../common/InputControl';
// 导入执行插座类和根据类型获取插座的方法
import { ExecutionSocket, getSocketByType } from '../common/sockets';
// 导入全局变量管理器
import { globalVars } from '../../variables';

// 定义“设置变量”节点类，继承自经典节点
export class SetVariableNode extends ClassicPreset.Node {
  // 节点的固定宽度
  width = 240;
  // 节点的固定高度
  height = 180;
  // 控制台打印该节点日志时使用的颜色（橙色）
  logColor = '#f97316';

  // 节点更新时的回调函数，可选
  public onNodeUpdate?: () => void;
  // 控件值更新时的回调函数，接收控件的 key 作为参数，可选
  public onControlUpdate?: (key: string) => void;
  // 存储取消订阅全局变量变更的函数
  private unsubscribe: () => void;

  // 构造函数，接收一个可选的 dataflow 引擎实例
  constructor(private dataflow?: any) {
    // 调用父类构造函数，设置节点名称为 '设置变量'
    super('设置变量');
    
    // 添加执行输入插座，命名为 'execIn'，标签为 '执行输入'
    this.addInput('execIn', new ClassicPreset.Input(ExecutionSocket, '执行输入'));
    
    // 初始化选择控件，用于选择要设置的变量
    const varCtrl = new SelectControl('变量', this.getVarOptions(), '', (newVarId) => {
      // 当选择的变量发生变化时，同步更新输入输出插座的类型
      this.syncSocketType(newVarId);
      // 如果定义了控件更新回调，则触发回调，通知 'varSelect' 已更新
      if (this.onControlUpdate) this.onControlUpdate('varSelect');
    });
    // 将变量选择控件添加到节点中，标识为 'varSelect'
    this.addControl('varSelect', varCtrl);

    // 初始化时根据当前选中的变量同步插座类型
    this.syncSocketType(varCtrl.value);
    
    // 添加执行输出插座，命名为 'execOut'，标签为 '继续执行'
    this.addOutput('execOut', new ClassicPreset.Output(ExecutionSocket, '继续执行'));
    
    // 订阅全局变量的变更事件
    this.unsubscribe = globalVars.subscribe(() => {
      // 当全局变量变化时，更新下拉框的选项
      varCtrl.options = this.getVarOptions();
      // 如果当前选中的变量已被删除，则清空选中值
      if (!globalVars.variables.find(v => v.id === varCtrl.value)) {
        varCtrl.value = '';
      }
      // 根据新的变量状态再次同步插座类型
      this.syncSocketType(varCtrl.value);
      // 通知编辑器该控件的选项或值已更新
      if (this.onControlUpdate) this.onControlUpdate('varSelect');
    });
  }

  // 获取变量选项列表，将全局变量映射为 label 和 value 的数组
  getVarOptions() {
    return globalVars.variables.map(v => ({ label: v.name, value: v.id }));
  }

  // 根据选中的变量 ID 动态同步输入和输出插座的数据类型
  syncSocketType(varId: string) {
    // 查找选中的变量信息
    const v = globalVars.variables.find(v => v.id === varId);
    // 获取变量类型，如果未找到则默认为 'any'
    const type = v ? v.type : 'any';
    
    // 获取当前名为 'valIn' 的输入插座
    const currentIn = this.inputs['valIn'];
    // 获取当前名为 'valOut' 的输出插座
    const currentOut = this.outputs['valOut'];
    // 根据变量类型获取对应的新插座实例
    const newSocket = getSocketByType(type);
    
    // 标记是否需要触发节点更新
    let shouldUpdate = false;

    // 如果不存在输入插座，或者当前输入插座的名称与新插座不同，则需要重建输入插座
    if (!currentIn || currentIn.socket.name !== newSocket.name) {
      // 移除旧的 'valIn' 输入插座
      if (currentIn) this.removeInput('valIn');
      
      // 创建一个新的输入插座，标签为 '设置值'
      const valInput = new ClassicPreset.Input(newSocket, '设置值');
      
      // 根据变量类型，添加无连线时的默认手动输入控件
      if (type === 'boolean') {
        // 如果是布尔类型，添加下拉选择控件 (True/False)
        valInput.addControl(new SelectControl('无连线填入', [
          { label: 'True', value: 'true' },
          { label: 'False', value: 'false' }
        ], 'false', () => {
          // 控件值改变时触发更新回调
          if (this.onControlUpdate) this.onControlUpdate('valIn');
        }));
      } else {
        // 如果是其他类型，添加文本输入控件
        valInput.addControl(new InputControl('无连线填入', '', () => {
          // 控件值改变时触发更新回调
          if (this.onControlUpdate) this.onControlUpdate('valIn');
        }));
      }

      // 将构建好的输入插座添加到节点
      this.addInput('valIn', valInput);
      shouldUpdate = true; // 标记已发生更新
    }

    // 如果不存在输出插座，或者当前输出插座的名称与新插座不同，则需要重建输出插座
    if (!currentOut || currentOut.socket.name !== newSocket.name) {
      // 移除旧的 'valOut' 输出插座
      if (currentOut) this.removeOutput('valOut');
      // 创建并添加新的输出插座，标签为 '输出值'
      this.addOutput('valOut', new ClassicPreset.Output(newSocket, '输出值'));
      shouldUpdate = true; // 标记已发生更新
    }

    // 如果有发生插座变更并且存在更新回调，则调用回调刷新节点视图
    if (shouldUpdate && this.onNodeUpdate) {
      this.onNodeUpdate();
    }
  }

  // 节点执行逻辑，由执行引擎在执行流到达该节点时调用
  async execute(_input: string, forward: (output: string) => void) {

    // 获取当前选中的变量 ID
    const varId = (this.controls['varSelect'] as SelectControl).value;
    
    // 优先读取注入的 workflowVariables，否则降级读取编辑器里的 globalVars
    const variables = (this as any).workflowVariables || globalVars.variables;
    // 根据 ID 获取对应的变量信息
    const v = variables.find((v: any) => v.id === varId);
    // 定义一个变量准备存储要设置的值，初始为 null
    let valueToSet: any = null;
    // 如果存在 dataflow 引擎实例
    if (this.dataflow) {

        // 通过 dataflow 获取该节点的输入数据（包含连线传入的数据）
        const inputs = await this.dataflow.fetchInputs(this.id);
        console.log(`[DEBUG SetVariableNode] ${this.id} fetchInputs result:`, inputs);
        // 如果 valIn 有通过连线传入的数据，并且数据有效，则优先使用传入的数据
        if (inputs.valIn && inputs.valIn.length > 0 && inputs.valIn[0] !== undefined && inputs.valIn[0] !== null) {
          valueToSet = inputs.valIn[0];
          console.log(`[DEBUG SetVariableNode] ${this.id} using inputs.valIn[0]:`, valueToSet);
        } else {
          // 如果没有连线传入数据，则尝试从节点自身的输入控件中获取手动填写的值
          let rawVal: any = undefined;
          // 获取 valIn 输入插座
          const valInSocket = this.inputs['valIn'];
          console.log(`[DEBUG SetVariableNode] ${this.id} valInSocket:`, valInSocket, 'control:', valInSocket?.control);
          
          // 如果插座存在且带有控件，并且控件包含 value 属性，则提取控件的值
          if (valInSocket && valInSocket.control && 'value' in valInSocket.control) {
             rawVal = (valInSocket.control as any).value;
             console.log(`[DEBUG SetVariableNode] ${this.id} extracted rawVal from control:`, rawVal, typeof rawVal);
          }

          // 防御性处理：如果上述方式仍未获取到值，尝试从节点绑定的 workflowData 中读取
          if (rawVal === undefined || rawVal === null) {
             const workflowData = (this as any).workflowData;
             if (workflowData && workflowData.nodes) {
                const nodeData = workflowData.nodes.find((n: any) => n.id === this.id);
                if (nodeData && nodeData.controls && nodeData.controls['input_valIn'] !== undefined) {
                   rawVal = nodeData.controls['input_valIn'];
                }
             }
          }

          // 如果获取的值仍然为空，则默认给一个空字符串，防止数据转换报错
          if (rawVal === undefined || rawVal === null) {
            rawVal = '';
          }

          // 根据目标变量的数据类型对获取到的原始值进行类型转换
          if (v?.type === 'boolean') {
             // 字符串 'true' 转换为布尔值 true，其他转为 false
             valueToSet = (String(rawVal) === 'true');
          } else if (v?.type === 'number') {
             // 转换为数字
             valueToSet = rawVal ? Number(rawVal) : 0;
             // 如果转换后为 NaN（非数字），则回退为 0
             if (isNaN(valueToSet)) valueToSet = 0;
          } else {
             // 字符串等其他类型直接赋值
             valueToSet = rawVal;
          }
          console.log(`[DEBUG SetVariableNode] ${this.id} computed valueToSet:`, valueToSet, 'v.type:', v?.type);
        }

    } else {
      // 找不到 dataflow 引擎的警告
      console.warn(`[DEBUG SetVariableNode] ${this.id} this.dataflow is undefined!`);
    }

    // 如果成功匹配到了变量，将值更新到专属状态对象中
    if (v) {
      // 优先获取注入的状态对象，否则使用全局 runtimeState
      const state = (this as any).workflowState || globalVars.runtimeState;
      // 将值写入状态中，变量名作为键
      state[v.name] = valueToSet;
      
      // 打印执行成功的美化日志
      console.log(`%c[🚀 执行节点] 设置变量节点 %c【${v.name}】 = ${valueToSet}`, 'background: #f59e0b; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #f59e0b; font-weight: bold;');
    }

    // 继续调用下游节点，触发 'execOut' 输出执行流
    forward('execOut');
  }

  // data 方法用于在 dataflow 数据流请求该节点输出时提供数据
  data(inputs: Record<string, any[]>) {
    // 获取当前选中的变量 ID
    const varId = (this.controls['varSelect'] as SelectControl).value;
    
    // 优先读取注入的 workflowVariables，否则降级读取编辑器里的 globalVars
    const variables = (this as any).workflowVariables || globalVars.variables;
    const v = variables.find((v: any) => v.id === varId);
    
    // 优先读取注入的状态对象，否则使用编辑器运行时的全局状态
    const state = (this as any).workflowState || globalVars.runtimeState;
    // 从状态中提取变量当前的值，如果没有找到变量则为 undefined
    let val = v ? state[v.name] : undefined;

    // 如果状态中还没有该变量的值，则根据类型赋予初始默认值
    if (val === undefined && v) {
      if (v.initialValue !== undefined) val = v.initialValue;
      else if (v.type === 'boolean') val = false;
      else if (v.type === 'number') val = 0;
      else if (v.type === 'string') val = '';
    }

    // 将计算出的值作为 'valOut' 输出供下游数据流节点使用
    return { valOut: val, execOut: undefined };
  }
}
