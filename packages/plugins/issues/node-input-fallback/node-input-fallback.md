# 节点数据输入口的回退（Fallback）机制

在基于 Rete.js v2 构建的可视化逻辑引擎中，常常需要实现这样一个需求：
**“当输入口有连线时，优先使用连线上游传过来的值；当没有连线时，使用当前节点自身控件（如下拉框、输入框）设置的默认值。”**

这就是节点数据输入口的**输入回退（Fallback）机制**。

## 为什么需要这个机制？

为了提高工作流编辑的灵活性。对于同一个配置项（例如：“是否显示标签”）：
- 用户可以直接在当前节点上通过下拉框选中 `true` 或 `false`。
- 用户也可以用另外一个节点的输出（比如逻辑取反的结果），通过连线动态地把值传给当前节点。
如果节点不支持该机制，就只能二选一（要么纯手动输入，要么强制连线）。

## 核心实现原理

实现该功能重点在于两处：
1. **构造函数中的视图配置**：把一个控件挂载到 `Input` 上。
2. **执行函数中的逻辑判断**：使用 `dataflow.fetchInputs` 获取连线数据并判断数组长度。

### 1. 视图层：在 `constructor` 中为 Input 附加备用控件

在创建 `Input` 时，需要调用 `.addControl()` 将一个控件绑定给这个输入口。
Rete.js 引擎会自动处理视图层的智能交互：没有连线时展示该控件，有连线接入时自动隐藏该控件。

```typescript
import { ClassicPreset } from 'rete';
import { SelectControl, type SelectOption } from '../../visual-logic/engine/nodes/common/SelectControl';
import { BooleanSocket } from '../../visual-logic/engine/nodes/common/sockets';

const BOOL_OPTIONS: SelectOption[] = [
  { label: '是 (True)', value: 'true' },
  { label: '否 (False)', value: 'false' }
];

export class ExampleNode extends ClassicPreset.Node {
  constructor() {
    super('示例节点');

    // 1. 创建一个接受布尔值的数据流输入口
    const visibleInput = new ClassicPreset.Input(BooleanSocket, '是否显示');
    
    // 2. ⭐ 把下拉框控件挂载到输入口上，作为备用值！
    visibleInput.addControl(new SelectControl('无连线时默认值', BOOL_OPTIONS, 'true'));
    
    // 3. 将输入口添加到节点中
    this.addInput('visibleIn', visibleInput);
  }
}
```

### 2. 逻辑层：在 `execute` 或 `data` 方法中进行回退判断

在节点执行过程中，我们需要分别获取“连线传入的值”和“控件本身的值”，然后根据 `fetchInputs` 返回的数组长度决定采用哪一个。

```typescript
async execute(_input: string, forward: (output: string) => void) {
  // 1. 获取我们绑在输入口上的备用控件实例
  const ctrl = this.inputs['visibleIn']?.control as SelectControl;
  
  // 准备最终结果变量，赋初始默认值
  let finalValue = true; 

  if (this.dataflow) {
    try {
      // 2. 向 dataflow 引擎索取上游节点通过连线传入的数据
      const inputs = await this.dataflow.fetchInputs(this.id);
      
      // 3. ⭐ 判断连线数组是否有值
      if (inputs.visibleIn && inputs.visibleIn.length > 0) {
        // [情况A] 存在连线数据：优先读取连线传入的数据
        const val = inputs.visibleIn[0];
        finalValue = (val === true || val === 'true');
      } else {
        // [情况B] 没有连线数据：降级读取备用控件上的值
        finalValue = (ctrl?.value === 'true');
      }
    } catch (err) {
      console.error('[ExampleNode] fetchInputs Error:', err);
      // 发生异常时也降级使用控件值
      finalValue = (ctrl?.value === 'true'); 
    }
  } else {
    // [情况C] 引擎未初始化 dataflow 的异常情况，直接降级
    finalValue = (ctrl?.value === 'true');
  }

  console.log('最终使用的值是：', finalValue);
  
  // 继续执行后续业务逻辑...
  forward('out');
}
```

## 总结
凡是遇到**“怎么让输入口既能连线又能手动填值”**的场景，或遇到**“连了线为什么没生效”**的问题，重点排查：
1. `addInput` 时有没有正确 `.addControl()` 绑定备用控件。
2. 提取数据时有没有正确调用 `fetchInputs`，并根据 `inputs.xxx.length > 0` 来做 `if-else` 分支判断！
