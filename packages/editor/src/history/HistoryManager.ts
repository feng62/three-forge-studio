import { Command } from './Command';

/**
 * 历史记录管理器，负责处理撤销(Undo)和重做(Redo)逻辑
 */
export class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly maxHistory: number = 50;

  /**
   * 执行一个命令并将其推入撤销栈
   * 执行新操作时，会清空重做栈
   */
  public execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    
    // 如果超过最大历史记录数，移除最老的记录
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }

    // 有新的操作发生，之前的重做记录作废
    this.redoStack = [];
    
    console.log(`[History] Executed: ${command.name}`);
  }

  /**
   * 撤销上一步操作
   */
  public undo(): void {
    if (this.undoStack.length === 0) {
      console.log('[History] Nothing to undo');
      return;
    }

    const command = this.undoStack.pop()!;
    command.undo();
    this.redoStack.push(command);
    
    console.log(`[History] Undid: ${command.name}`);
  }

  /**
   * 重做被撤销的操作
   */
  public redo(): void {
    if (this.redoStack.length === 0) {
      console.log('[History] Nothing to redo');
      return;
    }

    const command = this.redoStack.pop()!;
    command.execute();
    this.undoStack.push(command);
    
    console.log(`[History] Redid: ${command.name}`);
  }

  /**
   * 清空所有历史记录
   */
  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

// 导出单例实例，方便全局调用
export const historyManager = new HistoryManager();
