# Three.js 3D 编辑器：鼠标交互事件插件（InteractionPlugin）开发任务书

## 任务一：插件数据模型与状态设计 (Plugin Data Model & State Design)
### 1.1 目标
定义插件在内存中的核心数据结构（Schema），为 UI 渲染、事件检索以及后续的序列化/反序列化建立数据标准。
### 1.2 详细开发步骤
1. **定义原生事件池 (Event Pool)**：
   - 建立一个静态常量数组，枚举所有支持的鼠标事件：`['click', 'dblclick', 'contextmenu', 'pointerdown', 'pointerup', 'pointermove']`。
2. **设计响应式状态结构 (State Schema)**：
   - 创建一个名为 `pluginState` 的核心状态对象，内部包含一个 `events` 字典（Map）。
   - 字典的键（Key）为事件类型字符串（如 `"click"`），值（Value）为一个存储模型唯一标识的数组：`string[] (UUID)`。
   - 示例结构：
     ```json
     {
       "events": {
         "click": ["uuid-model-a", "uuid-model-b"],
         "dblclick": ["uuid-model-c"]
       }
     }
     ```
3. **架构解耦要求**：
   - **严禁直接存储 Three.js 的 `Object3D` 实例对象**。必须通过 `object3d.uuid` 作为唯一纽带，确保数据层与场景渲染层的绝对分离，以此满足序列化要求。

---

## 任务二：核心事件引擎与射线检测开发 (Event Engine & Raycaster Development)
### 2.1 目标
在编辑器基础包中实现高效的底层事件监听与靶向射线检测，使原生的 2D Canvas 鼠标事件能够精准映射到 3D 场景中的指定模型。
### 2.2 详细开发步骤
1. **画布事件动态监听 (Dynamic Canvas Listener)**：
   - 在插件初始化或事件配置变更时，接管渲染画布（Canvas）的鼠标 DOM 事件监听。
   - **性能优化策略**：只针对当前 `pluginState.events` 中已存在的事件类型挂载 `addEventListener`。如果用户没有添加任何右键事件，则不监听 `contextmenu`，避免高频事件对主线程的无效消耗。
2. **归一化坐标转换 (NDC Coordinates)**：
   - 在触发任意 DOM 鼠标事件时，精确获取鼠标相对 Canvas 的像素坐标，并转换为 Three.js 所需的归一化设备坐标 (NDC，即 X/Y 轴范围在 [-1, 1] 之间)。
3. **靶向射线检测 (Targeted Raycasting)**：
   - 实例化一个全局复用的 `THREE.Raycaster` 射线投射器。
   - 当某类事件（例如 `click`）被触发时，根据当前事件类型从模型包管理器（Model Manager）中筛选出与之关联的模型对象数组：
     `const targetModels = scene.children.filter(obj => pluginState.events['click'].includes(obj.uuid));`
   - 将射线方向设置为当前相机与鼠标 NDC 坐标的连线。
   - **核心逻辑**：调用 `raycaster.intersectObjects(targetModels, true)`，**仅对这批指定的模型进行相交检测**，忽略场景中的其他未绑定模型。
4. **自定义事件分发 (Custom Event Dispatching)**：
   - 若射线成功命中目标模型，提取首个相交点（最前端的模型），并向外抛出一个自定义的 3D 编辑器事件（如 `onModelTrigger`），参数中携带被命中的 `Object3D` 对象、事件类型、以及相交点信息（Intersection Data）。

---

## 任务三：编辑器 UI 逻辑与状态控制 (UI Logic & State Control)
### 3.1 目标
实现前端交互面板，处理用户“添加事件”、“互斥选择”以及“多选绑定模型”的业务逻辑。
### 3.2 详细开发步骤
1. **添加事件按钮与动态互斥下拉菜单 (Exclusive Dropdown)**：
   - 在界面上设计一个“添加鼠标事件”按钮，点击后展开支持的事件下拉菜单。
   - **互斥核心逻辑**：每次展开下拉菜单前，计算当前可用的事件列表。
     `可用事件 = 完整事件池 - Object.keys(pluginState.events)`
   - 已被配置过的事件（例如已添加过 `click`）在下拉列表中必须自动置灰（Disabled）或隐藏，严格保证一类事件只能被创建一次。
2. **事件配置卡片与模型绑定面板 (Event Card & Model Binding)**：
   - 用户成功添加某种事件类型后，在 UI 上动态渲染一个对应的事件配置卡pt（Card）。
   - 卡片内包含一个模型绑定组件，支持以下三种形式之一：
     - **多选下拉框**：列出当前模型包中所有可用的 3D 模型名称与 UUID 供勾选。
     - **场景拾取器**：激活一个“吸管”工具，允许用户直接在 3D 视口中点击模型进行绑定。
     - **拖拽响应**：允许用户将场景树（Scene Tree）中的模型节点直接拖拽到该事件卡片内。
3. **状态双向绑定**：
   - 当用户在卡片中添加或移除模型绑定时，实时更新内存中的 `pluginState.events[eventType]` 数组。若卡片被彻底删除，则从 `pluginState.events` 中 `delete` 对应的 Key，并触发任务二中的事件解绑逻辑。

---

## 任务四：插件的序列化与反序列化生命周期 (Serialization Lifecycle)
### 4.1 目标
实现插件的 `toJSON` 和 `fromJSON` 核心方法，确保交互事件配置能够无缝融入编辑器的工程项目保存和整案加载流程。
### 4.2 详细开发步骤
1. **序列化实现 (toJSON / Export)**：
   - 为插件类编写 `toJSON()` 方法。
   - 提取当前插件的元数据与状态数据，打包成标准的 JSON 对象返回：
     ```javascript
     toJSON() {
       return {
         type: "MouseInteractionPlugin",
         version: "1.0.0",
         enabled: true,
         data: {
           events: this.pluginState.events
         }
       };
     }
     ```
2. **反序列化实现 (fromJSON / Import)**：
   - 为插件类编写 `fromJSON(jsonConfig, sceneManager)` 方法。
   - 将 `jsonConfig.data.events` 重新赋值给内存中的 `this.pluginState.events`。
3. **关键生命周期时序控制 (Execution Timing)**：
   - **核心时序要求**：在加载工程文件时，**必须先恢复模型包（Model Package）中的所有 3D 模型，待它们全部创建完毕并挂载到 Three.js Scene 树之后，才能执行本插件的 `fromJSON` 方法**。
   - 否则，底层事件引擎在根据 UUID 查找 `Object3D` 实例时会因找不到对象而失效。
4. **脏数据校验与清理 (Data Validation)**：
   - 在反序列化完成后，遍历所有绑定的 UUID，比对当前场景中的实际模型。
   - 如果发现某个 UUID 在当前场景中已不复存在（可能在保存前被用户删除，或者由于其他异常原因丢失），自动将该 UUID 从状态字典中剔除，防止底层射线检测时发生空指针异常。
   - 重新调用任务二中的逻辑，恢复画布上的 DOM 事件监听。
