import { db } from './db';

self.onmessage = async (e: MessageEvent) => {
  const { id, type } = e.data;
  
  if (type === 'LOAD_MODEL') {
    try {
      const model = await db.assets.get(id);
      if (model && model.data) {
        // Transfer the ArrayBuffer back to the main thread (zero-copy)
        self.postMessage({ 
          type: 'MODEL_LOADED', 
          id, 
          data: model.data, 
          ext: model.type,
          name: model.name 
        }, { transfer: [model.data] });
      } else {
        self.postMessage({ type: 'ERROR', id, error: 'Model not found in IndexedDB' });
      }
    } catch (err: any) {
      self.postMessage({ type: 'ERROR', id, error: err.message || 'Unknown error' });
    }
  }
};
