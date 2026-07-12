import { ClassicPreset } from 'rete';
import { SelectControl } from '../../visual-logic/engine/nodes/common/SelectControl';
import { BooleanSocket } from '../../visual-logic/engine/nodes/common/sockets';
import { LabelEditorPlugin } from '../editor';
import { LabelCorePlugin } from '../core';

export class GetLabelVisibleNode extends ClassicPreset.Node {
  width = 240;
  height = 140;
  logColor = '#3b82f6';

  public onControlUpdate?: (key: string) => void;

  constructor(private dataflow?: any) {
    super('获取标签显示状态');

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

    this.addOutput('isVisible', new ClassicPreset.Output(BooleanSocket, '是否显示 (布尔)'));
  }

  data(inputs: Record<string, any[]>) {
    const labelId = (this.controls['labelId'] as SelectControl).value;
    if (!labelId) {
      return { isVisible: false };
    }

    const labelObj = LabelCorePlugin.getLabelState(labelId);
    const isVisible = labelObj ? !!labelObj.visible : false;
    
    const labelName = labelObj ? (labelObj.name || labelObj.id) : labelId;
    console.log(`%c[🧬 数据提取] 获取标签显示状态 %c读取【${labelName}】当前状态 = ${isVisible}`, 'background: #3b82f6; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #3b82f6;');

    return { isVisible };
  }

  execute(_input: string, forward: (output: string) => void) { }
}
