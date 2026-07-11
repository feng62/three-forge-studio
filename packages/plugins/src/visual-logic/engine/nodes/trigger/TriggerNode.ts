import { ClassicPreset } from 'rete';
import type { ControlFlowEngine } from 'rete-engine';
import { ButtonControl } from '../common/ButtonControl';
import { SelectControl } from '../common/SelectControl';
import { ExecutionSocket } from '../common/sockets';
import { PROVINCES, CITIES, getProvinceLabel, getCityLabel } from '../common/constants';
import type { Schemes } from '../types';
import { globalVars } from '../../variables';

export class TriggerNode extends ClassicPreset.Node {
  width = 260;
  height = 320;
  logColor = '#a855f7'; // 紫色

  public onControlUpdate?: (key: string) => void;

  constructor(private engine?: ControlFlowEngine<Schemes>, private dataflow?: any) {
    super('触发器节点');
    this.addOutput('exec', new ClassicPreset.Output(ExecutionSocket, '执行 (输出)'));
    
    const cityCtrl = new SelectControl('城市', []);
    const provCtrl = new SelectControl('省份', PROVINCES, '', (newProvValue) => {
      cityCtrl.options = CITIES[newProvValue] || [];
      cityCtrl.value = '';
      if (this.onControlUpdate) this.onControlUpdate('city');
    });

    this.addControl('province', provCtrl);
    this.addControl('city', cityCtrl);

    this.addControl(
      'triggerBtn', 
      new ButtonControl('🚀 立即执行', () => this.onClick())
    );
  }

  onClick() {
    const provCtrl = this.controls['province'] as SelectControl;
    const cityCtrl = this.controls['city'] as SelectControl;

    if (!provCtrl.value || !cityCtrl.value) {
      alert('请先选择省份和城市，然后再执行！');
      return;
    }

    const provLabel = getProvinceLabel(provCtrl.value);
    const cityLabel = getCityLabel(provCtrl.value, cityCtrl.value);

    console.log(`%c[🚀 执行节点] 触发器节点 %c参数:【${provLabel}】【${cityLabel}】`, 'background: #8b5cf6; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #8b5cf6;');
    if (this.engine) {
      if (this.dataflow) this.dataflow.reset();
      globalVars.resetRuntimeState();
      this.engine.execute(this.id);
    }
  }

  execute(_input: string, forward: (output: string) => void) {
    const provCtrl = this.controls['province'] as SelectControl;
    const cityCtrl = this.controls['city'] as SelectControl;
    const provLabel = getProvinceLabel(provCtrl.value);
    const cityLabel = getCityLabel(provCtrl.value, cityCtrl.value);
    
    console.log(`%c[🚀 执行节点] 触发器节点 %c匹配成功！参数:【${provLabel}】【${cityLabel}】`, 'background: #8b5cf6; color: #fff; font-size: 14px; padding: 4px; border-radius: 4px;', 'color: #8b5cf6;');
    forward('exec');
  }
  
  data(inputs: Record<string, any[]>) { return { exec: undefined }; }
}
