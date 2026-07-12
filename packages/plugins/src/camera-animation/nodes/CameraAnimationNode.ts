import { ClassicPreset } from 'rete';
import { SelectControl } from '../../visual-logic/engine/nodes/common/SelectControl';
import { ExecutionSocket } from '../../visual-logic/engine/nodes/common/sockets';
import { CameraAnimationEditorPlugin } from '../editor';
import { CameraAnimationCorePlugin } from '../core';

export class CameraAnimationNode extends ClassicPreset.Node {
  width = 240;
  height = 180;
  logColor = '#a855f7';

  public onControlUpdate?: (key: string) => void;

  constructor() {
    super('播放视角动画');
    
    this.addInput('execIn', new ClassicPreset.Input(ExecutionSocket, '输入'));

    // options 尝试从编辑器插件加载，如果在 headless 环境则 options 暂时为空
    let options: { label: string, value: string }[] = [];
    try {
      const data = CameraAnimationEditorPlugin.loadData();
      const viewpoints = data.viewpoints || [];
      options = viewpoints.map((vp: any) => ({
        label: vp.name || vp.id,
        value: vp.id
      }));
    } catch (e) {
      // 忽略
    }

    const viewpointCtrl = new SelectControl('选择视角', options);
    this.addControl('viewpoint', viewpointCtrl);

    this.addOutput('before', new ClassicPreset.Output(ExecutionSocket, '立刻继续'));
    this.addOutput('after', new ClassicPreset.Output(ExecutionSocket, '动画完成继续'));
  }

  execute(_input: string, forward: (output: string) => void) {
    const viewpointId = (this.controls['viewpoint'] as SelectControl).value;
    if (!viewpointId) {
      console.warn(`[Engine] 🛑 播放视角动画节点 执行中止：尚未选择视角！`);
      return;
    }

    // 在运行时从 Core Plugin 重新获取
    const viewpoints = CameraAnimationCorePlugin.getViewpoints();
    const vp = viewpoints.find(v => v.id === viewpointId);
    if (!vp) {
      console.warn(`[Engine] 🛑 播放视角动画节点 执行中止：视角 ${viewpointId} 不存在！`);
      return;
    }

    const vpName = vp.name || vp.id;
    console.log(`%c[🚀 执行节点] 播放视角动画节点 %c开始切换至视角: 【${vpName}】...`, 'background: #10b981; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #10b981;');

    // 立即释放 Before 分支
    forward('before');

    // 延后释放 After 分支（动画播放完毕后）
    return new Promise<void>((resolve) => {
      CameraAnimationCorePlugin.switchToViewpoint(vp, viewpoints, () => {
        console.log(`%c[✅ 任务完成] 播放视角动画节点 %c【${vpName}】`, 'background: #059669; color: #fff; font-size: 12px; padding: 2px 4px; border-radius: 4px;', 'color: #059669;');
        forward('after');
        resolve();
      });
    });
  }

  data(inputs: Record<string, any[]>) { return { before: undefined, after: undefined }; }
}
