import { ClassicPreset } from 'rete';

export const ExecutionSocket = new ClassicPreset.Socket('execution');
export const BooleanSocket = new ClassicPreset.Socket('boolean');
export const NumberSocket = new ClassicPreset.Socket('number');
export const StringSocket = new ClassicPreset.Socket('string');
export const AnySocket = new ClassicPreset.Socket('any');

export function getSocketByType(type: string) {
  switch(type) {
    case 'boolean': return BooleanSocket;
    case 'number': return NumberSocket;
    case 'string': return StringSocket;
    default: return AnySocket;
  }
}
