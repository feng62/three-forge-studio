import { ClassicPreset } from 'rete';

export interface SelectOption {
  label: string;
  value: string;
}

export class SelectControl extends ClassicPreset.Control {
  constructor(
    public label: string,
    public options: SelectOption[],
    public value: string = '',
    public onChange?: (val: string) => void
  ) {
    super();
  }

  setValue(val: string) {
    this.value = val;
    if (this.onChange) {
      this.onChange(val);
    }
  }
}
