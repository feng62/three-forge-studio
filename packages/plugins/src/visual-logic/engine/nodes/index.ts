/**
 * 统一导出文件 (Barrel File)
 * 作用：将分散在各个文件里的代码汇集到一起向外暴露，方便其他模块统一引入。
 */

// ==========================================
// 1. 基础配置与类型声明
// ==========================================
// 定义了节点之间连线接口（Socket）的类型（数据线和执行线）
export * from './common/sockets';
// 存放共享的静态模拟数据（如级联的省份、城市）
export * from './common/constants';
// 存放 TypeScript 类型定义（如 Node、Connection、Schemes）
export * from './types';

// ==========================================
// 2. 执行流节点（带有执行线，用于控制程序流向）
// ==========================================
// 系统动作节点：模拟执行系统级任务（写日志、清理缓存等）
export * from './system-action/SystemActionNode';
// 业务动作节点：模拟执行业务层任务（发短信、建订单等）
export * from './business-action/BusinessActionNode';
// 延时节点：阻断并延迟执行流的继续
export * from './delay/DelayNode';
// 判断/条件节点：接收布尔值数据，类似 if-else 控制执行流走向（满足/不满足分支）
export * from './condition/ConditionNode';

// ==========================================
// 3. 变量与数据操作节点（操作纯数据流）
// ==========================================
// 获取全局变量节点：从系统中读取全局变量，无执行线
export * from './variables/GetVariableNode';
// 设置全局变量节点：带有执行线，当执行流经时，更新全局变量的值
export * from './variables/SetVariableNode';
// 逻辑运算节点：无执行线，对数据进行算术或逻辑比较，输出布尔结果
export * from './logic/LogicNode';
// 逻辑取反节点：对布尔值进行取反
export * from './logic/NotNode';
