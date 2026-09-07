# 胡凯 AI 财务作品集 — CHANGELOG

## v3.2 (2026-08-11)

基于 v3.0（原版），整合 SOX 控制测试工作台 v4 为第 6 个作品（Claude task PORTFOLIO-INTEGRATE-SOX-V4）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | 新增第 6 个作品卡 | works 区末尾（page-03 卡后）插入 SOX 工作台卡，AUDIT · INTERNAL CONTROL 分类（cyan #22d3ee），带"★ 核心亮点" |
| 2 | 新增 page-06 模板 | 完整内审专业设计说明页：cover + 4 KPI + 功能全景表（5 模块 × SOX 环节）+ 实务设计理念 3 条 + 学术设计思路 5 段（COSO 2013 / SOX 404 / PCAOB AS 2201 / AICPA 属性抽样 / ITGC-COBIT）+ launch 按钮（新窗口打开工作台） |
| 3 | portfolioKB 更新 | structure 追加 w06；keyNumbers 追加 soxWorkbench；versions 追加 v3.2 |
| 4 | Hero stats | "4 递进式作品" → "6" |
| 5 | 主线故事 | 第三层（AI SYSTEM）追加 "SOX 工作台 →" 入口 |
| 6 | 标题更新 | "作品主线" → "作品矩阵"，en 改 "RESEARCH → PRODUCT → AI SYSTEM → AUDIT" |
| 7 | 文案一致性 | work-lead 引导语补充第 4 层（审计·守规）；home 知识卡 "5 作品入口" → "6 作品入口" |

### 技术说明与偏离

- **launch 链接路径修正**：Claude 原稿 `面试备战-网易SOX/...` 为相对路径，但作品集位于 `outputs/作品集/` 子目录，已改为 `../面试备战-网易SOX/SOX控制测试工作台-v4/SOX控制测试工作台.html`
- **section id 说明**：page-05 的 section id 已为 `work-06`（历史编号错位），page-06 沿用 Claude 模板的 `work-06`，两者位于独立 `<script type="text/html">` 模板中，每次仅注入一个 iframe，无运行时冲突；showWork() 按 `page-{id}` 取模板，不受影响
- **glass 样式**：page-06 的 glass div 全部使用内联样式（不依赖 page-05 的 scoped `.page05 .glass`），已验证全局 `.wrap/.kpis/.kpi.hot/.sec/.sec-head/.portfolio-page table` 均存在，无需额外 scope
- **版本说明**：v3_1 目录（5 项视觉优化）已不在 outputs 中，v3.2 基于 v3.0 原版整合，versions 字段如实记录
- 旧版 `胡凯-AI财务作品集.html`（原版）未动

## v3.2.1 (2026-08-11) 热修复

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | 修复 page-06 空白 bug | page-06 模板缺少 IntersectionObserver，5 个 `.reveal` 元素永远 `opacity:0`。已在模板末尾补齐 observer（与其他页面一致），Playwright 验证内容正常渲染 |
| 2 | launch 链接改为同目录 | 预览服务器只映射单目录，`../面试备战-网易SOX/...` 跨目录 404。SOX 工作台已复制到 `demo/SOX控制测试工作台.html`（单文件自包含），链接改为相对路径 `demo/SOX控制测试工作台.html` |

### 验证

- iframe 注入：h1 "SOX 控制测试工作台 · 内审 AI 效率工具" ✅
- launch 链接：HTTP 200，页面标题 "SOX 控制测试工作台 · 胡凯"，内容完整加载 ✅

## v3.3 (2026-08-11) 双 Agent 协作实战

基于 v3_2，替换"人机协作方法论"为"双 Agent 协作实战"（Claude task PORTFOLIO-BRIDGE-STORY）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | 主页 pipeline 区重写 | "人机协作方法论"（AI方法论三步流程）→ "双 Agent 协作实战"：三角分工（参谋/执行者/决策者）+ 工程化机制 6 条（熔断/视觉自检/Token预算/版本化/上下文压缩/GitHub技能栈）+ SOX v1→v4 完整协作闭环示例 + 诚实披露已知边界与 5 处 bug 记录 |
| 2 | SmartRecon 页桥接入口 | page-05 KPI 区后插入入口条："这个作品本身由双 Agent 系统协作完成" → 点击返回主页滚动至双 Agent 协作实战区 |
| 3 | showHomeAndGo() 函数 | 主页新增：关闭 iframe 后平滑滚动到指定区域（SmartRecon 入口调用，目标 id=pipeline） |
| 4 | portfolioKB.versions | 追加 v3.3 双 Agent 协作实战展示；助手"迭代/版本"回复同步更新 |

### 技术说明与数据核实

- **通信次数如实修正**：任务原稿写"56 次通信"，实测 bridge 下 MSG-*.md 共 57 封，页面按 57 记录；archive 主题 8 个 ✅
- **bug 数量如实修正**：任务原稿写"4 个 bug"，实际已知 Bug 记录 5 项（回信方向反/空信损坏/v3_1 目录消失/page-06 白屏/launch 404），页面诚实披露 5 项
- **showWork('xx') 方案不可行**：showWork 仅支持 page-{id} 模板（page-01~06），pipeline 区无模板；按任务备选方案改为 showHome() + scrollIntoView 定位（新增 showHomeAndGo）
- **熔断机制状态**：如实表述"尚未被实战触发，以上 bug 均为人工发现+协作修复——轻量 bug 人工修更高效，熔断是最后保险"，未夸大为触发过

## v3.4 (2026-08-11) 作品矩阵重排

基于 v3_3，作品矩阵大小分级布局（Claude task PORTFOLIO-WORKS-LAYOUT-V4）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | 作品顺序重排 | 3 个核心作品（w04 智对账 / w05 供应链 / w06 SOX）全宽在上（grid-column:1/-1），w01/w02/w03 三件研究·产品作品包入 `.works-mini` wrapper 三列紧排在下 |
| 2 | 三列小型卡样式 | `.works-mini` 内卡紧凑化（padding 20/22/18、title 15px、desc 11.5px、badge 9px），仅作用于 wrapper 内，不影响 wide 卡 |
| 3 | 响应式 | ≤860px 三列→两列；≤600px 两列→单列（gap 12px） |
| 4 | works-lead 引导语 | "一条主线串起全部作品" → "核心作品展示 AI 系统构建与审计实务落地能力；研究·产品体现行业认知与方案思维" |

### 技术说明

- 卡内 desc 文字未改动（保留 HTML 原文，紧凑感由 CSS 控制）
- `.works-mini` 内联样式含 grid-column:1/-1 + repeat(3,1fr)，响应式用 !important 覆盖列数

### 验证

- 视觉自检：四视口（375/768/1280/1920）无溢出、3 wide + 3 mini 排列无悬空

## v3.4.1 (2026-08-11) 热修复：work-05 id 错位

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | page-05 模板 section id 修正 | `id="work-06"` → `id="work-05"`（供应链金融页）。历史编号错位（v3.2 起已知），视觉自检中确认 showWork('05') 渲染出的 section id 错误，现已对齐 `page-{id}` ↔ `work-0{id}` 映射 |

### 影响与验证

- 修复前：点击"供应链金融"卡，iframe 内作品页 id 为 work-06（内容正确，锚点/状态识别错误）
- 修复后：6 个作品页 id 映射全部正确（work-01~06）
- 完整视觉自检 37/37 通过：四视口加载/溢出/reveal/矩阵布局 + 6 作品页 iframe 渲染 + demo 链接 HTTP 200

## v3.5 (2026-08-11) 数据修正 + 面试官速览

基于 v3_4，修正 Hero 数据并新增面试官速览模块（Claude task PORTFOLIO-V3_5-POLISH）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | Hero stats 数据修正 | 可运行 AI Agent `1 → 2`（SmartRecon demo + SOX 工作台可运行）；高保真原型模块 `6 → 12`（w04/w05/w06 各含 2 个功能模块 + 页面/弹窗/表格等细分共 12 个） |
| 2 | Hero 副标题重写 | "我搭了一套 AI 协同工作流" 叙事：从审计一线痛点到双 Agent 系统落地，不是"我用过 AI"，是"我搭了一套 AI 协同工作流" |
| 3 | 新增「面试官速览」模块 | 插在 works 区与双 Agent 协作实战区之间：3 张岗位卡（审计/内控、资金运营、财务产品）+ 1 张通用亮点卡（双 Agent 协作实战）。每张岗位卡含对应作品入口与 w0N 跳转链接 |
| 4 | portfolioKB 更新 | purpose 从"研究/产品/系统 三层递进"改为"研究 → 产品 → 系统 → 审计 四层递进"；versions 追加 v3.5 |

### 技术说明

- 面试官速览网格采用 `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`，响应式自然切换：375px → 1 列、768px → 2 列、1280px+ → 3 列
- 岗位卡跳转链接使用 `onclick="showWork('0N');return false;"`，与作品矩阵共用同一套渲染逻辑，无需新路由
- 通用亮点卡文案"57 封通信"与双 Agent 协作实战区保持一致

### 验证

- 视觉自检：四视口（375/768/1280/1920）49/49 通过，无横向溢出
- 面试官速览：4 张卡片完整、6 个 showWork 链接正确（02,03,04,04,05,06）、响应式列数正常
- 作品页 id 映射：6 个作品页 iframe 渲染 + demo 链接 HTTP 200
- 无 console / JS 错误

## v3.6 (2026-08-12) 角色升级：Manager + Specialist

基于 v3_5，角色称呼升级 + 协作进化实例 + 图标（Claude task PORTFOLIO-V3_6-ROLE-UPGRADE + notify 追加）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | 三角分工卡 → 三层角色 | pipeline 区第一张 about-card 重写：Manager (Claude) 只评不改方向决策 / Senior Specialist (WorkBuddy) 执行+主动性提醒风险 / 最终决策者 (胡凯)；副块改为"讨论型协作"（Manager 提方案 → Specialist 提示风险 → Manager 决策 → Specialist 执行，取长补短不是单向发令） |
| 2 | 协作进化实例段落 | SOX v1→v4 闭环 glass 卡片末尾追加「⚡ Token 效率讨论（2026-08-11 深夜）」：Manager 发讨论 → Specialist 量化数据 → 否决模板化方案 → 采纳预检规则。收尾金句"这不是'我用 AI'，是'我管理了一个 AI 团队，有讨论、有否决、有进化'" |
| 3 | 亮点卡称呼更新 | 面试官速览通用亮点卡 "参谋+执行者" → "Manager + Senior Specialist" |
| 4 | 徽章图标（方案 B） | 三层角色卡 Manager 前紫色渐变 "C" 徽章、Specialist 前蓝色渐变 "DS" 徽章；主页 AI 工具链 DeepSeek/Claude 前同款徽章 |
| 5 | Footer 更新 | "协作引擎 Claude + DeepSeek" 纯文字追加（不加图标） |
| 6 | portfolioKB 更新 | versions 追加 v3.6 角色升级 Manager+Specialist+图标(当前) |

### 技术说明

- 徽章采用内联样式 span（圆角小方块、渐变、10px 级字号、vertical-align 对齐），不依赖全局 CSS 类，自包含
- 三角分工卡原"📁 完整协作协议 bridge/PROTOCOL.md"提示块按任务方案由"讨论型协作"块替代（协议信息仍可溯源至 bridge/archive）
- SOX 段落内部历史称呼（参谋/执行者）不在本次任务范围，未改动

### 验证

- 待视觉自检（用户切换视觉模型后执行）

