import { ClassicPreset } from 'rete';
import { SelectControl, type SelectOption } from '../../visual-logic/engine/nodes/common/SelectControl';
import { ExecutionSocket, BooleanSocket } from '../../visual-logic/engine/nodes/common/sockets';
import { LabelEditorPlugin } from '../editor';
import { LabelCorePlugin } from '../core';

const BOOL_OPTIONS: SelectOption[] = [
  { label: '是 (True)', value: 'true' },
  { label: '否 (False)', value: 'false' }
];

export class SetLabelVisibleNode extends ClassicPreset.Node {
  width = 280;
  height = 230;
  logColor = '#3b82f6';

  public onControlUpdate?: (key: string) => void;

  constructor(private dataflow?: any) {
    super('设置标签显示状态');

    this.addInput('execIn', new ClassicPreset.Input(ExecutionSocket, '输入'));

    // 尝试从编辑器插件加载标签配置
    let options: { label: string, value: string }[] = [];
    try {
      const data = LabelEditorPlugin.loadData();
      const labels = data.labels || [];
      options = labels.map((l: any) => ({
        label: l.name || l.id,
        value: l.id
      }));
    } catch (e) {
      // 忽略
    }

    const labelCtrl = new SelectControl('选择标签', options);
    this.addControl('labelId', labelCtrl);

    // 数据流输入，带备用控制
    const visibleInput = new ClassicPreset.Input(BooleanSocket, '是否显示');
    visibleInput.addControl(new SelectControl('无连线时默认值', BOOL_OPTIONS, 'true'));
    this.addInput('visibleIn', visibleInput);

    this.addOutput('out', new ClassicPreset.Output(ExecutionSocket, '执行完成'));
  }

  data(inputs: Record<string, any[]>) { return { out: undefined }; }

  async execute(_input: string, forward: (output: string) => void) {
    const labelId = (this.controls['labelId'] as SelectControl).value;
    if (!labelId) {
      console.warn(`[Engine] 🛑 设置标签隐藏状态节点 执行中止：尚未选择标签！`);
      return;
    }

    let isVisible = true;
    const ctrl = this.inputs['visibleIn']?.control as SelectControl;
    
    if (this.dataflow) {
      try {
        const inputs = await this.dataflow.fetchInputs(this.id);
        if (inputs.visibleIn && inputs.visibleIn.length > 0) {
          const val = inputs.visibleIn[0];
          isVisible = val === true || val === 'true';
        } else {
          isVisible = ctrl?.value === 'true';
        }
      } catch (err) {
        console.error('[SetLabelVisibleNode] fetchInputs Error:', err);
        isVisible = ctrl?.value === 'true';
      }
    } else {
      isVisible = ctrl?.value === 'true';
    }

    const labelObj = LabelCorePlugin.getLabelState(labelId);
    const labelName = labelObj ? (labelObj.name || labelObj.id) : labelId;
    const actionStr = isVisible ? '显示 ✅' : '隐藏 ❌';
    
    console.log(`%c[🚀 执行节点] 设置标签状态 %c正在将标签【${labelName}】设置为: ${actionStr}`, 'background: #3b82f6; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #3b82f6; font-weight: bold;');

    LabelCorePlugin.setLabelVisible(labelId, isVisible);

    forward('out');
  }
}
