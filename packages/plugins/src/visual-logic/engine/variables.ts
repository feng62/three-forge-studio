import { reactive } from 'vue';

export interface WorkflowVariable {
  id: string;
  name: string;
  type: string;
  initialValue?: any;
}

export function createVariableStore() {
  const variables = reactive<WorkflowVariable[]>([]);
  
  const subscribers = new Set<() => void>();

  const notify = () => {
    subscribers.forEach(cb => cb());
  };

  const setVariables = (vars: WorkflowVariable[]) => {
    variables.splice(0, variables.length, ...vars);
    notify();
  };

  const addVariable = () => {
    const id = 'var_' + Math.random().toString(36).substr(2, 9);
    variables.push({
      id,
      name: `NewVar_${variables.length + 1}`,
      type: 'boolean',
      initialValue: false
    });
    notify();
  };

  const removeVariable = (id: string) => {
    const idx = variables.findIndex(v => v.id === id);
    if (idx > -1) {
      variables.splice(idx, 1);
      notify();
    }
  };

  const updateVariable = (id: string, updates: Partial<WorkflowVariable>) => {
    const v = variables.find(v => v.id === id);
    if (v) {
      Object.assign(v, updates);
      notify();
    }
  };

  const subscribe = (cb: () => void) => {
    subscribers.add(cb);
    return () => subscribers.delete(cb);
  };

  const runtimeState = reactive<Record<string, any>>({});

  const resetRuntimeState = () => {
    Object.keys(runtimeState).forEach(key => delete runtimeState[key]);
  };

  return {
    variables,
    runtimeState,
    setVariables,
    addVariable,
    removeVariable,
    updateVariable,
    subscribe,
    notify,
    resetRuntimeState
  };
}

export const globalVars = createVariableStore();
