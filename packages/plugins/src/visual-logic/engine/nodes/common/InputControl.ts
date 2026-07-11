import { ClassicPreset } from 'rete';

export class InputControl extends ClassicPreset.Control {
  constructor(public label: string, public value: string, public onChange?: (val: string) => void, public readonly?: boolean) {
    super();
  }

  setValue(val: string) {
    this.value = val;
    if (this.onChange) {
      this.onChange(val);
    }
  }
}
