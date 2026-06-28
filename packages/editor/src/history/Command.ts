/**
 * 命令模式接口定义
 */
export interface Command {
  /**
   * 执行命令
   */
  execute(): void;
  
  /**
   * 撤销命令
   */
  undo(): void;

  /**
   * 命令名称，用于调试或在界面上显示操作历史
   */
  name: string;
}
