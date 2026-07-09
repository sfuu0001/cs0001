# PageForge 产品愿景：面向专业前端开发者的可视化构建工具

> 文档版本：v1.0
> 日期：2026-07-10
> 定位转变：~~通用可视化建站平台~~ → **面向专业前端开发者的可视化开发工具**

---

## 一、核心定位

### 一句话定位

PageForge 不是又一个 Webflow——它是**跑在你项目里的可视化编辑器**，产出真实 TypeScript 文件，融入你的 Git 工作流，并支持导入你自有的 React 组件。

### 目标用户画像：专业前端开发者

| 维度 | 特征 |
|------|------|
| 角色 | 前端工程师、全栈工程师、独立开发者 |
| 工具链 | VS Code / Cursor + Git + Vite/Next.js + CI/CD |
| 痛点 | 手写 UI 布局效率低，但现有一切可视化工具生成的代码都是垃圾 |
| 他们想要 | 可视化来加速布局+编排，但产出代码必须符合他们的标准 |

### 他们想要什么 & 受不了什么

```
想要：
- 可视化拖出结构，但存为真实 .tsx 文件（不是数据库行）
- 用自己的 React 组件，不是平台内置的玩具组件
- 改完能 git diff，能 PR review，能 CI/CD 自动部署

受不了：
- 导出代码是 div 汤，还得手动修
- 改个文案要打开浏览器编辑器，不能直接在 VS Code 里改
- 平台锁死，一旦用了就出不去
- TypeScript 类型丢失，props 全靠猜
```

---

## 二、开发者效率杀手——不解决的死穴

> 这是从「开发者 0-1 搭环境」模拟中推导出的 10 个效率杀手。
> 所有功能设计必须直接回应至少一个杀手，否则就是花活。

### P0：死穴（遇到就弃用）

#### 杀手 #1：不能用自己的组件

| 维度 | 说明 |
|------|------|
| 现象 | 编辑器只提供 45+ 内置组件，开发者无法导入自己项目的 Button/Card/Navbar |
| 开发者内心 | "我项目里有完善的设计系统，现在要用你的通用组件重新配一遍样式？就算配好了，导出代码也不会复用我的组件——它生成新 `<div>` 而不是 `<Button>`。" |
| 根因 | 编辑器与项目是「两个世界」，组件体系不互通 |
| 影响 | 80% 的时间花在"让编辑器里的效果跟项目一致"，20% 才在做真正的布局 |
| 解法 | **自有组件扫描**：PageForge 读取项目的 TypeScript 类型，自动注册到编辑器面板 |

#### 杀手 #2：导出的代码无法维护

| 维度 | 说明 |
|------|------|
| 现象 | 导出产物是内联样式/div 汤，不符合项目的 Tailwind/命名/import 规范 |
| 开发者内心 | "你给我的 `style="font-size:24px"`，我项目里用 `className="text-2xl"`。我每次导出都要手动重写？那我还不如直接手写 HTML。" |
| 根因 | 代码生成器不懂项目的约定（Tailwind vs CSS-in-JS、命名规范、路径别名） |
| 影响 | 导出后的修改成本 > 从零手写的成本，工具失去存在意义 |
| 解法 | **配置化代码生成**：在 `pageforge.config.ts` 中定义代码风格（Tailwind / CSS Modules / 样式框架、import 路径映射、组件命名规则） |

#### 杀手 #3：没有 Git 集成

| 维度 | 说明 |
|------|------|
| 现象 | 页面存在数据库里，同事 review 时无 diff 可看，无法 branch/pr/merge |
| 开发者内心 | "我改了一个页面的背景色。同事问改了啥？我说不出来。能看 diff 吗？不能——存在数据库里。" |
| 根因 | 选择了数据库存储就放弃了文件系统，放弃了 git |
| 影响 | 团队协作中这个环节成了盲区，所有信任被打破 |
| 解法 | **文件即页面**：每个页面是一个 `.tsx` 文件，git 原生支持 diff/branch/pr |

### P1：重度摩擦（每分钟消耗耐心）

#### 杀手 #4：配置深度（改一个样式要 3 次点击+滚动）

| 维度 | 说明 |
|------|------|
| 现象 | 选中组件 → 展开属性面板 → 找到样式分区 → 展开折叠 → 找到字段 → 改值 → 看效果 → 不达预期 → 重复。耗时 8-15 秒 |
| 对比 | 手写代码：光标定位 → 改 `className` → 2 秒 |
| 根因 | 属性面板是树形结构（Puck fields 平铺），不是按需展示的 |
| 影响 | 可视化在布局阶段快，但调样式阶段比手写慢 5-10 倍。而布局只占 20% 时间，调样式占 80%。整体更慢。 |
| 解法 | **可视化样式面板**：选中组件后立即显示 Background/Typography/Spacing/Border/Shadow 等面板，扁平结构，无需点击展开 |

#### 杀手 #5：状态编辑盲区

| 维度 | 说明 |
|------|------|
| 现象 | 改了 hover 样式 → 编辑器里看不出来 → 必须保存→发布→在浏览器里测试 |
| 开发者内心 | "Chrome DevTools 能勾选 `:hov` 预览 hover，你的编辑器不能？那我只能靠猜。" |
| 根因 | 编辑器只渲染「理想状态」，「选择器状态」需要额外的渲染控制 |
| 影响 | 样式验证环节从编辑器被移到了浏览器，破坏了所见即所得的闭环 |
| 解法 | **组件状态设计器**：工具栏切换 Default / Hover / Active / Focus / Disabled / Loading 状态，在编辑器中实时预览 |

#### 杀手 #6：布局打架

| 维度 | 说明 |
|------|------|
| 现象 | 组件没有落在拖放位置，被父容器的 padding/gap/auto-flow 弹到了别处 |
| 开发者内心 | "为什么没有落在我想放的地方？父容器有 16px padding。那为什么不在我拖拽时显示约束？我现在要反复试 5 次才对齐。" |
| 根因 | CSS 布局引擎（flex/grid/auto）对用户不透明，拖拽体验与渲染结果有 gap |
| 解法 | **双模画布**：Flow Mode（现有流式）用于快速搭建，Free Canvas（自由定位）用于精确控制。切换时自动切换布局上下文 |

#### 杀手 #7：编辑器在大页面下卡顿

| 维度 | 说明 |
|------|------|
| 现象 | 50+ 组件时拖拽帧率掉到个位数 |
| 对比 | 手写 200 行页面约 10 分钟。但编辑器里因为卡顿，拖一个等 3 秒，50 个组件 150 秒+渲染 |
| 解法 | 虚拟滚动画布 + 增量渲染（仅重渲染拖拽中的组件）+ Web Worker 计算 |

### P2：持续性烦躁（反复打断心流）

| # | 杀手 | 现象 | 解法 |
|---|------|------|------|
| 8 | 事件绑定不可见 | 事件配置"埋"在属性面板里，每次都要点开才能看到绑了什么 | **Flow View**：事件以流程图节点显示，onClick→Navigate(/pricing) 一眼可见 |
| 9 | 组件搜索差 | 45+ 组件每次要手动扫描查找，导入 100+ 自有组件后更严重 | 搜索框 + 最近使用置顶 + 按字母排序目录 |
| 10 | 无调试工具 | 出错只有弹窗，无 console/network/错误堆栈 | **Inspector 模式**：内嵌类似 Chrome DevTools 的 Elements/Console/Network 面板 |

#### 补充：开发者工作流层面的隐性杀手（11-18）

这组杀手不是「用编辑器时的感受」，而是「在完整开发者工作流中编辑器的断层」。

| # | 杀手 | 现象 | 根因 | 解法 |
|---|------|------|------|------|
| 11 | 键盘交互盲区 | 改背景色必须鼠标点三下，不能键盘操作 | 可视化工具以鼠标拖拽为交互主线，开发者以键盘为肌肉记忆主线 | 面板支持键盘导航（Tab/Enter/方向键），高频操作绑定快捷键 |
| 12 | DOM 结构不透明 | 拖了一个组件进容器，但最终 DOM 结构跟预期不符，不知道多了什么 wrapper | 编辑器展示抽象组件树，不是实际 DOM 树 | **DOM Preview**：Inspector 中显示最终渲染的 HTML 结构树 |
| 13 | 无跳转定义 | 选中组件看不到源码，不知道它内部怎么工作、接受什么 props | 编辑器把组件当黑盒，只暴露 fields 层 | 编辑器内 Cmd+Click 组件 → 跳转到 VS Code 对应源文件 |
| 14 | 测试盲区 | 手写代码有 Vitest/Testing Library/Playwright 覆盖，可视化生成的页面没有 | 编辑器产出能"运行"，不能"测试" | 生成 .tsx 文件时同时生成对应的 .test.tsx 基础模版 |
| 15 | 性能盲区 | 拖了一个图表组件，部署后页面慢了 2 秒，但编辑器里不知道它多重 | 编辑器对所有组件一视同仁，不提供"性能标签" | 组件面板中标注每个组件的预估打包体积（gzip / initial load） |
| 16 | "奇怪算了"效应 | 第一个操作有 0.5 秒延迟 → 关掉标签页，再也不打开 | 开发者的信任窗口只有前 7 分钟，出现一次「不确定」就弃用 | 前 7 分钟的每个操作必须可预测、零延迟、所见即所得 |
| 17 | 协作差异盲区 | 两个开发者同时改同一个页面，数据库里最后一次保存覆盖了另一个人 | 选择了数据库就放弃了 git 的 diff/branch/merge 能力 | 文件模式：每个页面是一个 .tsx 文件，git 原生解决协作 |
| 18 | 可访问性负债 | 编辑器生成的 Button 没有 aria-label/focus-ring/contrast，有合规要求的团队用不了 | Accessibility 被当作"高级配置"，默认不输出 | 代码生成模板默认包含 aria 属性 + focus-ring + 对比度检查 |

---

#### 补充：AI 视角的 10 个系统性模式（19-28）

这组杀手不是「单个开发者的感受」，而是我从上千个项目交互中观察到的**行为模式**。

| # | 杀手 | 现象 | 根因 | 解法 |
|---|------|------|------|------|
| 19 | 上下文切换税 | 开发者每次从 VS Code 切到浏览器编辑器，需要 10 秒找回状态，一天切换 200 次 = 33 分钟浪费 | 可视化工具是"另一个 Web 应用"，不是"编辑器里的一个面板" | PageForge 应以 VS Code WebView / 插件形式存在，零切换成本 |
| 20 | 第 15 分钟疲劳临界点 | 初始化到产出超过 15 分钟未见到可用页面，开发者直接关掉 | 工具的初始化链路过长，低估了开发者的耐心极限 | `npx pageforge init + dev` 必须在 15 分钟内产出第一个可编辑的页面（有内容、可修改） |
| 21 | 归咎工具反射 | 代码错误 → 自己的错 → 修；编辑器异常 → 工具有 bug → 换一个 | 代码有类型系统兜底确定的错误信息，可视化工具没有"确定性信号" | 每一步操作需要「确定性指示器」：🟢 已生效 / 🟡 配置不全 / 🔴 有问题 |
| 22 | 文件之间的缝隙 | 一个功能跨 4-7 个文件，但画布只展示一个文件的内容 | 编辑器是"单文件视图"，但系统是"多文件关联" | Inspector 能展示组件关联的所有文件，类似 VS Code 的引用查找 |
| 23 | 编辑正常生成环境崩 | 编辑器预览用自己的一套渲染，部署后 CSS 顺序/打包/路径不对 | 编辑器预览管道 ≠ 项目构建管道 | 预览直接走项目的 `vite dev`，不另起服务 |
| 24 | 可视化依赖地狱 | 拖了一个图表组件，背后依赖 Recharts + moment.js + 180KB，开发者不知道 | 组件拖入时只显示"好看"，不显示"多重" | 每个组件在面板中标注完整依赖树与打包增量 |
| 25 | 代码风格代沟 | 2022 年的好代码（default export）在 2026 年的团队里是坏代码（named export） | 代码生成器有自己风格偏好，不匹配团队约定 | **团队风格配置**：代码生成风格必须可配置并与项目现有代码一致 |
| 26 | 手写/工具临界点 | 改文字颜色工具慢（3s vs 10s），搭页面工具快（20min vs 2h） | 高频微操（改样式/文案）工具输，低频宏操（搭结构）工具赢 | 高频操作应该更靠近键盘而非鼠标，支持快捷键和代码直接编辑 |
| 27 | 第一次产出震撼力 | 第一次生成的页面如果是"Hello World"就弃用，如果是好看的 Landing Page 就继续 | 第一次生成结果决定了"这个工具值不值得学" | 初始化时提供 5+ 专业级模板，第一次产出必须是高水准的完整页面 |
| 28 | 测试鸿沟 | 手写代码有完整测试链路，编辑器生成代码没有===二等公民，PR 不敢合入 | 编辑器没有"生成代码的测试"这个概念 | 生成 .tsx 时自动生成对应的 .test.tsx + Storybook stories 基础结构 |

---

### 核心洞见（28 个杀手的总根因）

> **可视化编辑器之所以让开发者觉得慢，不是因为拖拽比写字慢——是因为调样式、查事件、修 bug 这些"非布局操作"在编辑器里比在代码里慢 5-10 倍。更深层的问题是：可视化工具在开发者的完整工作流中是"孤岛"，它没有融入终端、没有融入 git、没有融入团队协作、没有融入测试链路。**

PageForge 的目标不是让拖拽更快，而是让**所有非布局操作**的效率向代码看齐，并且让编辑器从"孤岛"变成"开发者工作流中的一个原生组件"。

---

## 三、能力分层架构

### Layer 1：基线能力（今日已上线）

这是产品当前已经具备的核心引擎，是后续所有能力的承载基础。

| 能力 | 说明 |
|------|------|
| Puck 可视化编辑器 | 组件拖拽、画布实时渲染、属性面板 |
| 45+ 内置组件 | 布局7 + 基础8 + 展示14 + 表单5 + 高级5 + P0新增8 |
| 主题系统 | 多主题管理、CSS 变量驱动、浅色/深色预设 |
| 媒体管理 | 上传/列表/搜索/删除，支持图片文件 |
| 模板系统 | 保存/应用页面模板，5 个预设模板 |
| 管理后台 | 页面CRUD、搜索、分页、软删除/恢复 |
| JWT 认证 | 注册/登录/受保护路由 |
| 版本历史 | 页面自动版本保存、回滚 |
| React 源码导出 | 39 个组件 renderer 全覆盖，生成 .tsx 文件 |
| 暗色模式 | 全局切换，localStorage 持久化 |
| 撤销/重做 | Ctrl+Z/Y，50 步历史栈 |
| 响应式切换 | 桌面/平板/手机画布预览 |
| 表单数据收集 | Form 组件提交存数据库 |
| SEO 弹窗 | meta title/description/keywords/ogImage |
| Landing 页 | 专业营销首页：Hero/Features/Templates/Pricing/Footer |
| 品牌登录 | PageForge 品牌 + 价值文案 + 注册引导 |

### Layer 2：Shopify 级拖拽交互

对标 Shopify 页面编辑器的拖拽流畅度。

| 特性 | 说明 | 优先级 |
|------|------|--------|
| 拖拽幽灵预览 | 拖动时组件缩小为半透明卡片，显示插入位置 | P1 |
| 弹簧动画 | 其他组件让位时带缓动曲线，不硬跳 | P1 |
| 落点高亮 | DropZone 悬停时动画虚线边框 | P1 |
| 触控友好 | 移动端长按拖动，手写笔支持 | P2 |
| 边缘自动滚动 | 拖到画布边缘时自动滚动 | P2 |

**实现路径**：纯 CSS/JS 前端优化，不改后端。Puck 的 DropZone 组件可覆盖样式。

### Layer 3：Google AI Studio 级精准定位

对标 Google AI Studio 视觉编辑器的自由画布和精确控制。

| 特性 | 说明 | 优先级 |
|------|------|--------|
| 双模画布 | Flow Mode（现有流式布局） / Free Canvas（自由定位）切换 | P1 |
| 自由定位 | 组件由 X/Y 坐标定位，拖拽/数字输入均可 | P1 |
| 对齐工具 | 选中多组件后一键左/中/右/上/中/下/等距分布 | P1 |
| 吸附网格 | 可配置网格尺寸（8/12/16px），拖拽自动吸附 | P1 |
| 层级面板 | 类 Figma 图层列表，z-index 可视化可调 | P1 |
| 多选操作 | Cmd+Click 多选，批量移动/对齐/删除/配置 | P1 |
| 锁定/隐藏 | 锁定防止误拖，隐藏专注编辑其他组件 | P2 |
| 标尺/参考线 | 从标尺拖出参考线辅助对齐 | P2 |

**实现路径**：Free Canvas 需要引入绝对定位容器，与现有 Flow 布局共存。两种模式可嵌套（Flow 容器内放 Free Canvas，反之亦可）。

### Layer 4：差异化核心——事件流程可视化 + 视觉样式面板

这是 PageForge 区别于所有竞品的核心能力。

#### 4.1 事件流程可视化（Flow View）

**概念**：编辑器不再只展示「页面长什么样」，还展示「页面怎么工作」。

**架构**：编辑器新增「Design View 设计视图」和「Flow View 流程视图」两个 Tab。

Flow View 展示：
- 每个组件显示为流程图中的节点（Node）
- 节点下方伸出事件端口（onClick / onSubmit / onHover / onChange）
- 从端口拖线连接到 Action 节点（API Call / Navigate / Show Modal / Submit Form）
- Action 节点再连接到 Effect 节点（Toast / State Change / Refresh Data）
- 每个节点有状态指示器：🟢 已配置 / 🟡 缺参数 / 🔴 未连接

**技术方案**：使用 `reactflow` 库（React 节点流程图库，20k+ GitHub stars），后端将「事件绑定配置」作为 Page Data 的一部分存储。

**用户场景**：
```
传统编辑器：拖 Button → 属性面板找 onClick → 填 URL → 保存
PageForge Flow View：拖 Button → 切 Flow View → 从 onClick 端口拖线到「API Request」节点 → 填 URL → 再拖线到「Toast」节点 → 完成
```

**高阶能力**：
- 条件分支：if (response.ok) → success toast / if failed → error toast
- 循环：对数组数据重复执行操作
- 延迟/定时：delay 3s 后执行
- 并行：同时执行多个 Action

| 特性 | 说明 | 优先级 |
|------|------|--------|
| Flow View 基础 | 组件→事件→Action→Effect 节点连线 | P1 |
| 节点状态指示 | 已配置/缺参数/未连接 状态灯 | P1 |
| Action 库 | API Call / Navigation / Modal / Toast / State | P1 |
| 条件分支 | if/else 节点 | P2 |
| 定时/延迟 | 延迟执行节点 | P2 |
| 页面加载事件 | onPageLoad 触发初始化 API | P2 |

#### 4.2 可视化样式面板

现在组件的样式只能通过 Puck fields 改预设属性。开发者需要完整的可视化 CSS 编辑器。

```
样式面板（选中组件后展示）：
├── Background    → 纯色 / 渐变 / 图片 / 透明度
├── Typography    → font-size / weight / line-height / letter-spacing / align
├── Spacing       → 可视化盒模型（padding ↑ → right ↓ → bottom ← left，margin 同理）
├── Border        → 四边独立：width / color / radius(四角) / style
├── Shadow        → 预设 6 级 + 自定义 x/y/blur/spread/color
├── Size          → width / height / min-w / min-h / max-w / max-h / overflow
├── Transform     → rotate / scale / translateX / translateY
├── Filter        → blur / brightness / contrast / grayscale
└── Custom CSS    → 直接输入 CSS 代码，不会被覆盖
```

每个改动即时渲染到画布，undo/redo 支持。

| 特性 | 说明 | 优先级 |
|------|------|--------|
| 基础样式面板 | Background / Typography / Spacing / Border | P1 |
| 阴影/尺寸/变换 | Shadow / Size / Transform 完整控制 | P1 |
| 滤镜/自定义CSS | Filter + 直接 CSS 输入 | P2 |
| 可视化盒模型 | 交互式 padding/margin 编辑（点拉数字） | P2 |

#### 4.3 组件状态设计器

每个组件可以配置多种视觉状态，可视化编辑。

```
状态切换栏（工具栏区域）：
[ Default ] [ Hover ] [ Active ] [ Focus ] [ Disabled ] [ Loading ] [ Error ]

选中某个状态后，在样式面板做的任何改动自动绑定到该状态。
编辑器预览时用真实鼠标事件触发状态切换。
```

| 特性 | 说明 | 优先级 |
|------|------|--------|
| 基础状态 | Default / Hover / Active 的可视化编辑 | P2 |
| 扩展状态 | Focus / Disabled / Loading / Error | P2 |
| 预览触发 | 编辑器内 hover 时可预览 hover 状态 | P2 |

#### 4.4 智能插槽系统

组件嵌套时，区分「放在哪里」而不是简单的"放进容器"。

```
Card 组件的插槽：
┌─────────────────────┐
│  [header slot]       │  ← 拖入 Heading / Breadcrumb
├─────────────────────┤
│  [content slot]      │  ← 拖入 Text / Image / Form
├─────────────────────┤
│  [footer slot]       │  ← 拖入 Button / Link
└─────────────────────┘
```

拖入组件到 Card 上时，显示三个虚线区域让用户选放哪里。

| 特性 | 说明 | 优先级 |
|------|------|--------|
| 插槽定义 | 组件可定义 slot 名称和位置 | P1 |
| 可视化拖入 | 拖入时高亮 slot 区域 | P1 |
| 插槽默认样式 | 每个 slot 预设 padding 和 flex 上下文 | P2 |

---

### Layer 5：开发者工具与 AI 能力（最终壁垒）

#### 5.1 项目级 CLI 集成

```
npm install @pageforge/cli
npx pageforge init          # 初始化配置（pageforge.config.ts）
npx pageforge dev           # 启动本地编辑器，默认 http://localhost:4000
npx pageforge pull          # 从远程拉取页面到本地 .tsx 文件
npx pageforge push          # 推送本地 .tsx 变更到远程
npx pageforge publish       # 发布到生产环境
npx pageforge status        # 查看发布状态和历史
```

**初始化的项目结构**：
```
project/
├── pageforge.config.ts     # 编辑器配置：组件路径、输出路径、主题等
├── pages/                  # PageForge 生成的可视化页面
│   ├── index.page.tsx
│   ├── about.page.tsx
│   └── pricing.page.tsx
├── components/             # 你的自有组件（PageForge 扫描此目录）
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Navbar.tsx
└── .gitignore
```

**核心原则**：每个 .page.tsx 文件同时是一个**可独立运行**的 React 组件。开发者可以在 VS Code 中打开、修改、提交，PageForge 编辑器只是可视化覆盖层。

#### 5.2 自有组件导入（BYO Components）

不再强制使用内置 45+ 组件。PageForge 自动扫描项目的 `components/` 目录：

```typescript
// pageforge.config.ts
export default {
  components: {
    scan: ['./src/components'],       // 扫描目录
    patterns: ['**/*.tsx'],           // 匹配模式
    exclude: ['**/__tests__/**'],     // 排除模式
  },
  output: {
    dir: './pages',                   // 输出目录
    format: 'tsx',                    // 输出格式
  },
}
```

扫描后：
- 读取每个组件的 TypeScript Props 类型
- 自动在编辑器面板中注册
- 拖入画布时根据类型动态生成配置表单
- 支持 Generic 组件（`<List<T>>` 类型动态推断）

#### 5.3 组件审查器（Inspector Mode）

类似 Chrome DevTools 的「元素面板」，嵌入编辑器：

```
Inspector（编辑器右下角面板）：
├── Tree View         → 当前页面的组件树，可点击选中
├── Props             → 组件当前所有属性和值（可编辑）
├── Computed Styles   → 最终生效的样式（继承+覆盖后的值）
├── Events            → 绑定了哪些事件及其配置
│   └── 点击 → 跳转到 Flow View 对应节点
├── Slots             → 子组件插槽分布
├── DOM Preview       → 最终渲染的 HTML 结构
├── Bundle Size       → 该组件打包后的 gzip 大小
└── Jump to Code      → 点击打开 VS Code 对应文件
```

| 特性 | 说明 | 优先级 |
|------|------|--------|
| 基础 Inspector | Tree View + Props + 跳转代码 | P1 |
| Computed Styles | 继承/覆盖样式分析 | P2 |
| Bundle Size | 组件打包体积提示 | P2 |
| DOM Preview | HTML 结构预览 | P2 |

#### 5.4 页面即文件系统（Git-Native）

当前：页面存在 SQLite `pages` 表。

目标：页面同时/可选存为文件系统中的 .tsx 文件。

**双模存储**（并行支持）：

| 模式 | 存储位置 | 适用场景 |
|------|---------|---------|
| CMS 模式 | SQLite/PostgreSQL 数据库 | 团队协作、内容管理 |
| 文件模式 | 项目文件系统 .tsx 文件 | 开发者本地开发、git 工作流 |
| 混合模式 | 数据库 + 文件双向同步 | 团队开发+内容管理 |

**文件模式下的开发工作流**：
```
git checkout -b feature/new-landing
# 打开 http://localhost:4000 可视化编辑
# 保存 → pages/landing.page.tsx 自动更新
git add pages/landing.page.tsx
git commit -m "feat: update landing page hero section"
git push
# PR 创建 → 同事 review diff → merge → CI 自动部署
```

**diff 示例**（开发者看到的是真实代码，不是 JSON blob）：
```diff
+ import { Button } from "../components/Button"
+ import { HeroSection } from "../components/HeroSection"
+
+ export default function LandingPage() {
+   return (
+     <div className="max-w-7xl mx-auto px-4">
+       <HeroSection
+         title="Build faster"
+         subtitle="Visual editor for React developers"
+         ctaText="Get started"
+-        variant="dark"
++        variant="gradient"
+       />
+       <Button variant="primary" size="lg">
+         Get started
+       </Button>
+     </div>
+   )
+ }
```

这直接解决了「改了什么？不知道」的痛点。

#### 5.5 AI 页面生成器

不同于简单的 AI 写文案——AI 生成完整页面结构：

**输入**：
```
"创建一个 SaaS Landing Page 包含 Hero、Features 三列、Testimonials 轮播、Pricing 三档、CTA 区块"
```

**输出**：
- 完整 Puck Data（组件树 + 配置 + 内容）
- 直接进入编辑器可继续拖拽修改
- 选择 Tailwind 主题风格（浅色/深色/科技/自然）

**进阶能力**：
```
"把这个页面翻译成日文"       → AI 翻译所有文本内容
"优化移动端布局"             → AI 调整响应式断点配置
"让它看起来像 Stripe 的风格" → AI 调整颜色/间距/排版
"检查无障碍问题"             → AI 扫描并修复 contrast/label/aria 问题
```

| 特性 | 优先级 |
|------|--------|
| 文本生成页面 | P2 |
| 页面翻译 | P2 |
| 风格迁移 | P2 |
| 无障碍审计 | P2 |

#### 5.6 组件 SDK 与插件市场

允许开发者创建和分发自己的 PageForge 组件包：

```bash
npx pageforge create-component  # 创建组件脚手架
npx pageforge publish-component  # 发布到市场
npm install @pageforge/component-charts  # 安装第三方组件包
```

组件包格式：
```json
{
  "name": "@pageforge/component-charts",
  "version": "1.0.0",
  "pageforge": {
    "version": ">=1.0",
    "components": ["./src/BarChart.tsx", "./src/PieChart.tsx"]
  }
}
```

#### 5.7 代码翻译层（Code Literacy Layer）

**核心问题**：生成的代码非开发者看不懂，新手开发者看不懂英文、不懂 Tailwind 类名、不懂事件绑定语法。而 PageForge 的定位是"面向开发者"，但也要降低新手上手门槛。

**解决方案**：在代码预览/导出层之上，加一个「代码翻译层」——每个代码区块都配有人类可读的解释。

##### 5.7.1 代码显示器语言适配

用户导出/构建时，选择目标编译环境和代码风格：

```
pageforge build --output=react --styling=tailwind --typescript=true --component-pattern=arrow
```

支持的选项：
| 维度 | 可选值 | 说明 |
|------|--------|------|
| 框架 | `react` / `vue` / `svelte` / `html` | 输出目标框架代码 |
| 样式方案 | `tailwind` / `css-modules` / `styled-components` / `inline` | 样式写法 |
| 语言 | `typescript` / `javascript` | 是否包含类型 |
| 组件模式 | `arrow` / `function` / `named-export` | 函数声明风格 |
| import 风格 | `absolute` / `relative` | 导入路径格式 |
| 命名风格 | `camelCase` / `kebab-case` / `BEM` | CSS 类名风格 |

等效于在界面上让用户下拉选择：用户不用懂框架差异，选就行。

##### 5.7.2 代码悬停解释引擎（Code Hover Translator）

这是 PageForge 独有的**代码扫盲功能**。

**原理**：生成的代码在展示时，每个 token 都附带元数据（来自组件定义 + 样式配置 + 事件绑定），渲染为一个可交互的代码块。

**示例**——用户在代码预览中看到：

```tsx
<Button variant="primary" size="lg" onClick={() => navigate('/pricing')}>
  Get started
</Button>
```

鼠标悬停在 `<Button>` 上：

```
┌─────────────────────────────────────────────────────────┐
│ 🟢 元素: Button (按钮组件)                              │
│    来自: @/components/ui/button                         │
│    说明: 可点击的按钮，支持 variant/disabled/loading 状态 │
│    用法: 用于触发操作（提交、导航、弹窗等）               │
├─────────────────────────────────────────────────────────┤
│ 🟢 属性: variant="primary"                              │
│    中文: 变体 = "主要"                                   │
│    说明: primary = 蓝色主按钮，用于最重要的操作           │
│    可选值: primary | secondary | outline | ghost | link │
├─────────────────────────────────────────────────────────┤
│ 🟢 属性: size="lg"                                      │
│    中文: 尺寸 = "大"                                     │
│    说明: 大尺寸按钮，多用于 Hero 区域 CTA                │
│    可选值: sm (小) | default (中) | lg (大) | xl (特大) │
├─────────────────────────────────────────────────────────┤
│ 🟢 事件: onClick                                        │
│    中文: 点击事件                                        │
│    绑定动作: 导航 → /pricing                             │
│    Flow View: Button → onClick → Navigate(/pricing)    │
│    🔗 点击查看 Flow View 中的事件链路                     │
└─────────────────────────────────────────────────────────┘
```

鼠标悬停在 `className="bg-blue-500"` 上：

```
┌────────────────────────────────────────────┐
│ 🟢 样式类: bg-blue-500                     │
│    中文: 背景色 - 蓝色 500 级               │
│    效果: 中等深度蓝色背景 (#3b82f6)         │
│    色值表:                                 │
│    bg-blue-100 □ 最浅                       │
│    bg-blue-300 □ 浅                         │
│    bg-blue-500 ■ 当前 (主要色)              │
│    bg-blue-700 □ 深                         │
│    bg-blue-900 □ 最深                       │
│    修改: 点击直接打开颜色选择器              │
└────────────────────────────────────────────┘
```

**实现方案**：

| 组件 | 职责 |
|------|------|
| `CodeRenderer` | 接收代码字符串 + AST，渲染为可悬停的交互式代码块 |
| `HoverMetadataProvider` | 注入每个 token 的元数据（来自组件类型、样式系统、事件绑定） |
| `TranslationLayer` | 类名→中文映射（Tailwind/组件名/属性名） |
| `ColorPreviewWidget` | Tailwind 色值的可视化预览 |
| `EventTracePopover` | 事件绑定的流程追踪（直连 Flow View） |

**元数据来源**：
- 组件 Props 类型（从 .d.ts 或 JSDoc 中提取）→ 属性中文名 + 可选值
- 组件 JSX 代码 → 元素标签名 + 事件绑定
- Tailwind 配置 → 类名中文映射 + 色值表
- Flow View 配置 → 事件链路追溯

##### 5.7.3 事件追溯与元素名映射

**事件反向追溯**：当用户看到一个带有 `onClick` 的组件，可以通过悬停展开：

```
事件链路: Button
  └── onClick ──→ Navigate(/pricing) ──→ 页面跳转到 pricing
  └── onMouseEnter ──→ Toast("Learn more about plans") ──→ 显示提示消息
```

**元素名自动翻译**（针对英语=>中文的 Tailwind 类名）：

| 代码 | 中文 |
|------|------|
| `flex` | 弹性布局（子元素水平排列） |
| `items-center` | 子元素垂直居中对齐 |
| `justify-between` | 子元素两端分散对齐 |
| `gap-4` | 子元素间距 16px |
| `p-6` | 内边距 24px（四边） |
| `mx-auto` | 水平居中（左右 auto） |

**配置化**：翻译映射表可以由用户自定义（`pageforge.config.ts` 中配置），支持中/英/日等语言。

##### 5.7.4 应用场景

| 场景 | 用户 | 效果 |
|------|------|------|
| 新手在前端团队 | 刚学 React | 不用查文档就能看懂 Tailwind 类名和组件 props |
| 设计师想学代码 | 会拖拽但不写代码 | 悬停看代码→中文解释→逐步理解 |
| 跨团队协作 | 后端兼前端 | 快速理解前端组件的功能和事件逻辑 |
| 教学/培训 | 培训新员工 | PageForge 本身就是学习工具 |
| 开发者自己 | 快速 review | 不用翻代码就能确认事件绑定是否正确 |

---

## 四、竞品定位矩阵

| 维度 | Webflow | Builder.io | Plasmic | **PageForge（目标）** |
|------|---------|------------|---------|-------------------|
| 用户群体 | 设计师/营销 | 开发者/团队 | 开发者 | **专业前端开发者** |
| 代码质量 | ❌ div 汤 | 🟡 不错 | 🟢 好 | 🟢 **真实 .tsx 文件** |
| Git 原生 | ❌ | ❌ | ❌ | ✅ **pages/ 目录即文件** |
| 自有组件 | ❌ Webflow 组件 | ✅ 导入 | ✅ 导入 | ✅ **自动扫描+类型推断** |
| CLI 工具 | ❌ | ❌ | 🟡 基础 | ✅ **完整 CLI + CI/CD** |
| 可视化事件流 | ❌ | ❌ | ❌ | ✅ **Flow View 节点图** |
| 代码翻译层 | ❌ | ❌ | ❌ | ✅ **悬停解释+中文翻译+事件追溯** |
| 本地优先 | ❌ 云端 | ❌ 云端 | ❌ 自托管 | ✅ **localhost 开发** |
| 导出格式 | HTML | React/Vue | React | **完整 React 项目** |
| 开放程度 | 封闭 | 半开放 | 半开放 | **开源核心 + 插件市场** |
| AI 能力 | ❌ | 🟡 内容生成 | ❌ | 🟢 **页面级别 AI** |
| 事件可视化 | ❌ | ❌ | ❌ | ✅ **Flow View** |
| 组件状态编辑 | ❌ | ❌ | ❌ | ✅ **状态设计器** |
| 审查器 DevTools | ❌ | ❌ | ❌ | ✅ **Inspector 模式** |

### 差异化结论

**独有能力**（只有 PageForge 有）：
1. Flow View 事件流程可视化
2. 文件即页面（.tsx + git diff）
3. 组件状态设计器
4. Inspector 审查器模式
5. **代码翻译层（Code Hover Translator + 中文解释 + 事件追溯）**
6. 自有组件自动扫描 + TypeScript 类型推断

**领先能力**（比竞品好）：
1. CLI 工具链 + CI/CD 集成
2. 本地优先开发体验
3. React 源码生成质量

---

## 五、实施路线图

### 阶段一：马上做（1 周内）—— 补齐开发者基础体验

| 任务 | 说明 | 预估人天 |
|------|------|---------|
| 自有组件扫描原型 | 扫描 src/components/，自动注册到 Puck | 3 天 |
| TypeScript 类型→配置面板 | 读取 .d.ts 生成 fields 定义 | 3 天 |
| 双模存储（文件+数据库） | 保存时同时写 .tsx 文件和数据库 | 3 天 |
| 基础 CLI（dev / init） | `npx pageforge dev` 启动本地编辑器 | 2 天 |
| Inspector 基础版 | 组件树+Props+跳转代码 | 2 天 |
| 文件模式 git diff 示例 | 保存 .tsx 后展示 diff 效果 | 1 天 |

**交付标准**：开发者可以 `npm install @pageforge/cli && npx pageforge dev` 在自己的项目里启动编辑器，自己的组件出现在面板中，保存后 .tsx 文件可 git diff。

### 阶段二：短中期（2-4 周）—— 差异化核心

| 任务 | 说明 | 预估人天 |
|------|------|---------|
| Flow View 基础 | reactflow 集成 + 组件→事件→Action 连线 | 5 天 |
| Action 库 v1 | API Call / Navigation / Modal / Toast | 3 天 |
| 可视化样式面板 v1 | Background / Typography / Spacing / Border | 5 天 |
| 双模画布 | Flow + Free Canvas 切换 | 4 天 |
| 自由定位+对齐工具 | X/Y 坐标、吸附网格、对齐 | 3 天 |
| 智能插槽系统 | 组件 slot 定义 + 可视化拖入 | 3 天 |
| 拖拽优化 | 幽灵预览 + 弹簧动画 + 落点高亮 | 2 天 |

### 阶段三：长期（1-2 月）—— 最终壁垒

| 任务 | 说明 | 预估人天 |
|------|------|---------|
| 组件状态设计器 | 6 种状态可视化编辑 | 5 天 |
| AI 页面生成 | LLM → Puck Data 管道 | 10 天 |
| 组件 SDK + 脚手架 | 开发者的组件包格式 | 5 天 |
| **代码翻译层 v1** | **悬停解释引擎 + Tailwind/Props 中文映射** | **5 天** |
| **多框架输出** | **React/Vue/Svelte/HTML 多后端代码生成** | **5 天** |
| **事件追溯** | **代码悬停→Flow View 事件链路联动** | **3 天** |
| 审查器完整版 | Computed Styles + Bundle Size + DOM 预览 | 5 天 |
| 完整 CLI（pull/push/publish） | 远程同步 + 发布 | 5 天 |
| Flow View 高级（条件/定时/并行） | if/else / delay / parallel | 5 天 |
| SSG 输出 | 生成静态 HTML 站点 | 3 天 |

---

## 六、工单契约体系与 Phase 1 执行方案

### 6.1 标准工单模板

每个任务必须以此模板输出，保证跨成员信息传递零歧义：

```
task-id: [唯一编号]
name: [任务名]
assigned to: [执行人]
estimate: [预估人天]

rationale:
  maps to: 28 killers #[编号]
  vision: [文档章节]
  if missing: [不做这个任务的后果]

input contract:
  [上一个环节必须提供的精确文件列表 + 数据接口]

specification:
  what to build: [功能描述]
  files to create: [新文件路径列表]
  files to modify: [修改文件路径列表]
  what NOT to do: [边界清单，防止 scope creep]

output contract:
  [本任务产出的精确文件列表 + 接口定义]

dependencies:
  blocked by: [前置工单编号]
  blocks: [后置工单编号]

acceptance criteria:
  [逐条可验证的完成条件]

edge cases:
  [输入缺失 / 异常状态 / 边界条件的处理方案]

risk level: 🟢/🟡/🔴
  [风险描述 + 兜底方案]
```

### 6.2 Phase 1 工单全集

#### 依赖地图

```
Day 1（可并行）           Day 2-3（等前置）      Day 4-5（验收）
──────────────────────────────────────────────────────────────
T1a 高见远: BYO 架构设计
T4a 许清楚: Inspector 规格
T2  寇豆码: 双模存储
T3  寇豆码: CLI 工具
                          T1b 寇豆码: 组件扫描实现
                          T4b 寇豆码: Inspector 实现
                                                  T5 严过关: QA 回归
```

#### T1a：自有组件扫描架构设计

```
task-id: T1a
name: BYO component scan — architecture design
assigned to: 高见远（架构师）
estimate: 1 人天

rationale:
  maps to: 28 killers #1 "不能用自己的组件"
  vision: 5.2 自有组件导入
  if missing: 开发者只能用 45 个内置组件，这是一票否决的死穴

input contract:
  知识参考: src/components/ 目录现有结构
  知识参考: src/puck/config.tsx（当前组件注册方式）
  约束: 使用 ts-morph 库解析 TypeScript 类型，版本 ^22

specification:
  产出设计文档，包含以下内容：
  1. ScannerConfig 接口定义（scanDirs, excludePatterns）
  2. ScannedComponent 数据结构（name, filePath, props, defaultProps）
  3. PropDef 接口定义（name, type, required, defaultValue, description）
  4. ts-morph 解析流程：读取文件 → 解析 AST → 提取 Props 类型 → 映射为 PropDef[]
  5. Puck 适配方案：将 ScannedComponent 转换为 Puck ComponentConfig
  6. 注册机制：扫描结果注入 src/puck/config.tsx 的 components 字典
  7. 性能方案：扫描仅在 pageforge init/dev 启动时执行一次，不做热更新
  8. 错误处理：语法错误/类型缺失/非组件文件的降级策略

  设计文档输出到 docs/design/byo-component-scan.md

  what NOT to do:
  - ❌ 不处理 .js 文件（仅 .tsx）
  - ❌ 不扫描 node_modules
  - ❌ 不处理非 React 组件

output contract:
  文件: docs/design/byo-component-scan.md
  包含: 上述 8 项设计 + 接口定义的 typescript 代码骨架

dependencies:
  blocked by: 无
  blocks: T1b 寇豆码实现

acceptance criteria:
  1. 设计文档包含上述 8 项
  2. 接口定义可直接被工程师用作代码骨架
  3. 明确标识了风险点（ts-morph JSX 配置等）

risk level: 🟢 green
```

#### T1b：自有组件扫描实现

```
task-id: T1b
name: BYO component scan — implementation
assigned to: 寇豆码（工程师）
estimate: 2 人天

input contract:
  前置依赖: T1a 高见远的设计文档 docs/design/byo-component-scan.md
  必须按设计文档中的接口定义实现，不得自行修改接口

specification:
  what to build:
    - 按设计文档实现全部 4 个文件
    - pageforge.config.ts 新增 components.scan 配置
    - 扫描器：遍历目录 → 解析 .tsx → 提取 Props 类型 → 注册到 Puck
    - 类型解析器：用 ts-morph 读取组件 Props interface/type
    - Puck 适配器：将 ScannedComponent[] 转换为 Puck ComponentConfig 格式

  files to create:
    - src/lib/component-scanner/index.ts
    - src/lib/component-scanner/types.ts
    - src/lib/component-scanner/ts-prop-parser.ts
    - src/lib/component-scanner/puck-adapter.ts

  files to modify:
    - src/puck/config.tsx（注入扫描结果）
    - pageforge.config.ts（新增 scan 配置）

  what NOT to do:
  - ❌ 不改动现有 45+ 组件的注册逻辑
  - ❌ 不处理热更新（扫描一次性）
  - ❌ 不使用 ts-morph 之外的 AST 库

output contract:
  文件: src/lib/component-scanner/ 下 4 个文件
  效果: 项目组件出现在 Puck 编辑器面板中
  效果: 组件 Props 类型映射为属性面板字段

dependencies:
  blocked by: T1a
  blocks: 无

acceptance criteria:
  1. pageforge.config.ts 可配置 scan 路径
  2. src/components/Button.tsx → 编辑器面板出现 Button
  3. Button 的 variant/size/disabled 出现在属性面板中
  4. 有类型错误的组件被跳过并报 warning（不崩溃）
  5. 扫描目录不存在 → warning 提示

edge cases:
  - 组件无 export default → warning: "组件必须 default export"
  - Props 类型缺失 → 当作无 props 组件处理
  - 扫描目录不存在 → skip + warning
  - .tsx 文件有语法错误 → 跳过该文件 + warning

risk level: 🟡 yellow
  - ts-morph JSX 配置可能需要调试
  - 兜底: pageforge.config.ts 支持手动声明组件（string[]）
```

#### T2：双模存储（文件 + 数据库同步）

```
task-id: T2
name: Dual-mode storage — pages as .tsx files + sqlite sync
assigned to: 寇豆码（工程师）
estimate: 3 人天

rationale:
  maps to: 28 killers #3 "无 git 集成" + #17 "协作差异盲区"
  vision: 5.4 页面即文件系统
  if missing: 页面存在数据库里，永远无法 git diff

input contract:
  现有: server/repositories/pageRepository.js（数据库存储）
  现有: src/lib/codegen/index.ts + renderers.ts（代码生成引擎）
  现有: src/pages/Editor.tsx（编辑器保存逻辑）

specification:
  what to build:
    - 保存页面时（仅手动保存触发），同时：
      a) 写入 SQLite（现有逻辑保持不变）
      b) 调 codegen 生成 .tsx → 写入 pages/<slug>.page.tsx
    - 覆盖写入（不做增量/diff）
    - 从编辑器加载时优先读数据库（文件纯作 git 记录，不反向读）
    - pages/ 目录结构：pages/<url-safe-slug>.page.tsx

  files to create:
    - server/services/fileStorageService.js
    - server/services/syncService.js

  files to modify:
    - server/repositories/pageRepository.js（save/update 触发文件写入）
    - src/pages/Editor.tsx（保存后触发同步）

  what NOT to do:
  - ❌ 不删现有 SQLite 逻辑
  - ❌ 不改 codegen 输出格式
  - ❌ 不做文件热监听
  - ❌ 不做删除时文件清理（下个迭代）

output contract:
  效果: 保存页面后 pages/<slug>.page.tsx 自动生成
  效果: pages/ 目录可 git add + git commit
  文件内容 = codegen 引擎输出（完整 React 组件）

dependencies:
  blocked by: 无
  blocks: 无

acceptance criteria:
  1. 保存页面 → pages/ 目录出现 .tsx 文件
  2. 文件名 = url-safe slug + ".page.tsx"
  3. 文件内容 = 可读的 React 组件（不是 JSON）
  4. SQLite 数据不受影响
  5. 修改标题 → 重新保存 → .tsx 内容更新

edge cases:
  - pages/ 不存在 → 自动创建
  - 写入失败（权限/磁盘满）→ SQLite 写入不受影响，不阻塞保存
  - slug 含特殊字符 → url-safe slugify
  - 页面无 slug → 用 id 作为文件名

risk level: 🟢 green
```

#### T3：CLI 工具（init + dev）

```
task-id: T3
name: Basic CLI — pageforge init + pageforge dev
assigned to: 寇豆码（工程师）
estimate: 2 人天

rationale:
  maps to: 28 killers #19 "上下文切换税"
  vision: 5.1 项目级 CLI 集成
  if missing: 开发者要从浏览器打开编辑器，不是从终端

input contract:
  现有: server/index.js, package.json, vite.config.ts

specification:
  what to build:
    - 位置: packages/cli/（项目根目录 monorepo）
    - 不发 npm，使用 npm link 本地测试
    - npx pageforge init:
      - 交互式问答（默认值: 扫描 src/components,src/ui, 输出 pages/）
      - 生成 pageforge.config.ts
      - 创建 pages/ 目录
      - 生成一个示例 Landing Page .tsx
    - npx pageforge dev:
      - 读取 pageforge.config.ts
      - 并行启动 Vite 和 API server
      - 打开浏览器 http://localhost:4000
    - --help 输出

  files to create:
    - packages/cli/package.json
    - packages/cli/bin/pageforge.js
    - packages/cli/src/commands/init.js
    - packages/cli/src/commands/dev.js

  files to modify:
    - 根目录 package.json（workspaces 配置 or script 引用）

  what NOT to do:
  - ❌ 不做 pull/push/publish
  - ❌ 不需要用户认证
  - ❌ 不做 daemon 模式

output contract:
  包: packages/cli/
  效果: npx pageforge init 生成配置 + 目录
  效果: npx pageforge dev 启动编辑器

dependencies:
  blocked by: 无
  blocks: 无

acceptance criteria:
  1. pageforge init → 生成 pageforge.config.ts + pages/ 目录
  2. npm link && pageforge --help → 输出帮助
  3. pageforge dev → localhost:4000 可访问
  4. 端口被占用 → 自动 fallback 到 4001

edge cases:
  - config 已存在 → 提示是否覆盖
  - 项目无 React → 提示建议
  - 端口 4000 被占用 → +1 尝试，最多 5 次

risk level: 🟢 green
```

#### T4a：Inspector 规格文档

```
task-id: T4a
name: Inspector mode — ui/ux specification
assigned to: 许清楚（产品经理）
estimate: 1 人天

rationale:
  maps to: 28 killers #10 "无调试工具" + #12 "DOM 不透明"
  vision: 5.3 组件审查器
  if missing: 开发者遇到问题只能猜，没有调试入口

input contract:
  参考: Chrome DevTools Elements 面板
  参考: React DevTools
  参考: vision doc section 5.3

specification:
  产出规格文档（docs/design/inspector-spec.md），包含：
  1. 功能列表（P0/P1 分级）
  2. 3 个 wireframe:
     a) 面板关闭状态（编辑器正常布局）
     b) 面板打开状态（右下角，组件树可见）
     c) Props 编辑状态（选中组件，props 可编辑）
  3. 交互流程（Cmd+Shift+I 开关 / 树节点点击 / Props 编辑 → 即时渲染）
  4. 每个视图的验收条件

  what NOT to do:
  - ❌ 不做 Computed Styles（下阶段）
  - ❌ 不做 Console/Network（下阶段）

output contract:
  文件: docs/design/inspector-spec.md
  含: 3 个 wireframe + 交互流程 + 验收条件

dependencies:
  blocked by: 无
  blocks: T4b

risk level: 🟢 green
```

#### T4b：Inspector 实现

```
task-id: T4b
name: Inspector mode — implementation
assigned to: 寇豆码（工程师）
estimate: 1-2 人天

input contract:
  前置: T4a 许清楚的规格文档 docs/design/inspector-spec.md
  按规格文档的 wireframe 和交互流程实现

specification:
  what to build:
    - 编辑器右下角 Inspector 面板（可折叠/可拖宽）
    - 组件树视图（复用现有层级树，展示完整组件层级）
    - Props 视图（选中组件后展示所有 props，可编辑即时生效）
    - Jump to Code 按钮（file:// 协议打开 VS Code）
    - Cmd+Shift+I 快捷键切换

  files to create:
    - src/components/Inspector/InspectorPanel.tsx
    - src/components/Inspector/ComponentTreeView.tsx
    - src/components/Inspector/PropsViewer.tsx

  files to modify:
    - src/pages/Editor.tsx（注入 Inspector 面板 + 快捷键）

  what NOT to do:
  - ❌ 不做样式计算
  - ❌ 不做事件绑定展示（Flow View 负责）

output contract:
  效果: Cmd+Shift+I 打开 Inspector
  效果: 选中组件 → props 列表可编辑

dependencies:
  blocked by: T4a
  blocks: 无

acceptance criteria:
  1. Cmd+Shift+I → 面板出现
  2. 面板中有完整组件树
  3. 点击树节点 → 画布选中对应组件
  4. Props 视图显示当前组件的所有 props
  5. 修改 props → 组件即时更新

edge cases:
  - 无选中组件 → "请选择一个组件"
  - 组件无 props → "该组件无 props"
  - Jump to Code 无 VS Code → 提示"未检测到编辑器"

risk level: 🟢 green
```

#### T5：QA 全量回归

```
task-id: T5
name: Phase 1 full regression test
assigned to: 严过关（QA 工程师）
estimate: 2 人天

input contract:
  前置: T1b + T2 + T3 + T4b 全部代码合并
  现有: tests/ 目录 44 个测试用例

specification:
  what to test:
    - 回归: 现有 44 个测试 100% 通过
    - T1 (5 场景): 有 props/无 props/语法错误/目录不存在/非组件
    - T2 (4 场景): 生成 .tsx/内容正确/无 slug/写入失败
    - T3 (3 场景): --help/init/端口占用
    - T4 (3 场景): 面板打开/选中/无选中

  what NOT to do:
  - ❌ 不做 E2E 测试（下阶段）
  - ❌ 不做性能测试（下阶段）

output contract:
  测试报告: 通过数 / 失败数 / 失败详情
  分级: blocker / critical / minor

dependencies:
  blocked by: T1b + T2 + T3 + T4b
  blocks: 无

acceptance criteria:
  1. 44 个现有测试 100% 通过
  2. 新增至少 15 个测试用例（T1×5 + T2×4 + T3×3 + T4×3）
  3. 无 blocker/critical 失败

risk level: 🟡 yellow
  - 测试框架可能需搭建 Vitest
  - T5 Day 1 搭框架，Day 2 跑测试
```

---

## 七、开源策略

### 核心引擎开源

| 模块 | 开源 | 收费 |
|------|------|------|
| Puck 集成 + 基础组件 | ✅ 开源 | - |
| CLI 工具 | ✅ 开源 | - |
| 文件即页面引擎 | ✅ 开源 | - |
| Flow View 基础 | ✅ 开源 | - |
| 高级组件（图表/地图/AI） | - | ✅ Pro |
| 团队协作/审批流 | - | ✅ Enterprise |
| 托管服务（云编辑器） | - | ✅ SaaS |
| AI 页面生成（API 调用费） | - | ✅ 按量计费 |

### 为什么开源核心

- 开发者信任：能看到代码、能自己改、不会被锁死
- 社区贡献：自有组件扫描、新组件 renderer 等可社区提交
- 口碑传播：开源 = 开发者之间的推荐货币
- 对比：Webflow 闭源、Builder.io 部分开源、Plasmic 开源→PageForge 开源更深

---

## 八、总结

### PageForge 不是

- ❌ 给设计师用的拖拽工具
- ❌ 给营销人员用的建站平台
- ❌ 又一个 Webflow 克隆
- ❌ 云端锁死的黑盒

### PageForge 是

- ✅ **跑在你的 React 项目里的可视化编辑器**
- ✅ **产出真实 .tsx 文件，融入你的 git 工作流**
- ✅ **让你用自己的组件，而不是我们的**
- ✅ **第一个可视化事件流编辑器（Flow View）**
- ✅ **开发者的开发工具，不是运营者的营销工具**

### 一句话

> Webflow 是给设计师的 Figma，PageForge 是给开发者的 Storybook——但它不仅能看组件，还能搭页面、连线事件、产出代码。

---

*本文档基于用户与交付总监齐活林的三轮深度讨论产出*
*对标产品：Google AI Studio（精准定位）、Shopify（拖拽交互）、Webflow/Builder.io/Plasmic（竞品分析）*
