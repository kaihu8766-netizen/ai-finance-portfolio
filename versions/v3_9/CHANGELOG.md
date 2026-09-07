# 胡凯 AI 财务作品集 — CHANGELOG

## 📌 最近 3 版本速览

| 版本 | 一句话 |
|---|---|
| v3.9 | 协作技术栈术语升级：通信层/质检层/风控层 → Agentic Workflow / Quality Engineering / System Governance |
| v3.8 | 去审计化重定位：能力全景 + 工具链分层 + 技术栈分组卡片，全站旧称呼清零 |
| v3.7 | 收敛前终版：能力全景卡片 + 协作技术栈 + 称呼统一 + 协议链接补回 |

---

## v3.9.1 (2026-08-12) 热修复：--accent CSS 变量未定义

基于 v3_9 原地修复（Claude task COLLAB-IMPROVEMENTS-BATCH，A1 裁决：v3.9 未定版不配独立版本号，原地改）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | `:root` 补 `--accent: var(--hk-primary)` | 三组技术栈卡片标题（Agentic Workflow / Quality Engineering / System Governance）原用 `var(--accent)` 但变量未定义 → fallback 成 `--text` 白色，与正文同色无层次。补定义后标题恢复主色 #6d7cff（主文档 + iframe 模板两处 :root 均已补） |
| 2 | pipeline 引导段去数字 | "57 次通信" → "全部通信与决策记录"（与技术栈卡片"零丢失"口径统一，不写统计数字） |
| 3 | CHANGELOG v3.9 标签修正 | "上下文工程·强制讨论+预检门禁" → "上下文工程·Observation Masking + Context Compaction"（以 HTML 实际为准） |

### 验证

- 视觉自检：重建 375+1280 截图基线后 6/6 passed（日常 diff 模式可重复匹配）
- 断言覆盖：四视口 38 DOM + 2 截图 + 内容 21 + 交互 9 = 68 项全部 PASS

## v3.9 (2026-08-12) 协作技术栈术语升级：对齐 2026 大厂热词

基于 v3_8，重写协作技术栈三组卡片（Claude task PORTFOLIO-V3_9-TECH-TERMS）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | 通信层 → Agentic Workflow | `Bridge Protocol` / `异步消息协议` / `Context Optimization` → `Multi-Agent 编排` / `异步消息协议·文件信箱式通信零丢失` / `上下文工程·Observation Masking + Context Compaction` |
| 2 | 质检层 → Quality Engineering | `Playwright 视觉自检` / `GitHub Skills 设计规范` → `视觉回归测试·toHaveScreenshot 像素基线` / `E2E 自动化覆盖·断言+iframe遍历+基线管理` / `预检门禁·30秒结构扫查` |
| 3 | 风控层 → System Governance | 新增 `Circuit Breaker·同Bug≤3次升级` / `Token Budget·信件硬限制` / `Immutable Artifacts·独立目录+CHANGELOG` |
| 4 | 旧词清零 | 全站 `通信层`、`质检层`、`风控层`、`Bridge Protocol`、`Bug 熔断` 全部清零；新 QA 断言 N6 加固旧词检查，新增 N7 检查 `57 轮` 等过时/矛盾数字 |
| 5 | portfolioKB | versions 追加 `→ v3.9协作技术栈术语升级(当前)` |

### 技术说明

- 三组卡片保持玻璃态样式、flex 1 1 30% + min-width 240px 响应式布局；375 视口自动降 1 列
- QA 脚本同步更新：L147 三组组名断言改为 Agentic Workflow / Quality Engineering / System Governance；N6 全改新词；N7 新增「57 轮」清零检查
- 保留范围：SOX 工作台项目页 / portfolioKB versions 历史记录 / 诚实披露 bug 记录中的旧称呼与旧数据一律保留（作品自身主题或内部知识库）

### 验证

- 视觉自检 v8.1：6/6 passed，23.2s
  - 四视口结构断言：mobile_375 10/10 ✅、tablet_768 9/9 ✅、desktop_1280 10/10 ✅、wide_1920 9/9 ✅
  - 内容断言：21/21 ✅
  - 交互断言：9/9 ✅
- v3.9 内容变更导致页面高度微增（mobile +88px / desktop +22px），属预期 diff；已重建 375+1280 截图基线，日常 diff 模式可重复匹配
- 无横向溢出，iframe 遍历正常，demo 链接 HTTP 200，无 console 错误

## v3.8 (2026-08-12) 去审计化重定位 + 内容校准 + 技术栈升级

基于 v3_7 新目录（Claude task PORTFOLIO-V3_8-DE-AUDIT，胡凯反馈：作品集太偏审计/SOX，应展示个人能力而非为岗位定制）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | P0-1 SOX v1→v4 旧称呼清零 | 8 处"参谋/执行者" → Claude/WorkBuddy（含"修正参谋指令的索引用法错误"→"修正 Claude 指令"） |
| 2 | P0-2 去审计化定位 | Hero 副标题"审计一线"→"财务一线"；矩阵英文 AUDIT→FINANCE；引导语"审计实务"→"财务实务" |
| 3 | P1-1 审计内控卡实习归实习 | "Mazars 审计 · SOX 404 · COSO 五要素 · ITGC 三大域" → "Mazars：货币资金与往来款项测试 · 穿行测试 · 内控识别"（SOX/COSO/ITGC 归 SOX 工作台作品页） |
| 4 | P1-2 产品能力重组 | 3 行 → 2 行：产品设计（4 作品名顿号紧凑 + 全链路）/ 技术实现（3 技能） |
| 5 | P1-3 AI 工具链分层 | 拆「底层模型」6 个纯文字标签（去 DS/C 徽章）+「Agent 系统」WorkBuddy 独立带 WB 徽章；全站 DS 徽章清零 |
| 6 | P1-4 协作技术栈分组 | 6 平铺标签 → 3 组玻璃卡片（📡通信层/🔍质检层/🛡️风控层）；删 GitHub Skills 标签 + "57 封通信"数据行 |
| 7 | P2-1 AI Agent 卡 | "双 Agent 协作 · 熔断 & 自检 · 57 封通信 · 即你正在看的这套系统" → "即你正在看的这套系统——自定义通信协议 + 自动化质检流水线 + 熔断 & 自检"（保留伏笔，删 57 封与双 Agent 重复） |
| 8 | R2 归档块换说法 | L1545 "57 封往来信件、8 个主题分类" → "所有往来信件按主题归档，每一条决策可追溯"（不写数字，与 L1509 叙述主位区分） |
| 9 | portfolioKB | versions 追加 v3.8（去审计化重定位+工具链分层+技术栈分组，当前） |

### 技术说明

- 全站验证：参谋/执行者 0 残留、DS 徽章 0 残留、"57 封" 0 残留；L1509 "57 次通信"叙述主位按裁决保留
- "审计一线"残留 3 处均在 w03/w06 作品页内（作品自身主题），非首页定位文案，符合 P2-3 首页扫描要求
- 技术栈三组卡片：flex 1 1 30% + min-width 240px，375 视口自动降 1 列；复用 about-card 玻璃态样式
- 讨论过程：R1-R4 建议 → Architect 批判性复审（撤回橡皮图章 202500）→ 三处双向讨论 → 210000 最终裁决全共识

### 验证

- 视觉自检 v8（VISUAL-TEST-UPGRADE-TOHAVESCREENSHOT）：
  - @playwright/test test runner + toHaveScreenshot() 像素基线对比
  - 70/70 通过（四视口 36 DOM 断言 + 4 张整页截图基线 + 内容 21 + 交互 9）
  - reducedMotion + animations:'disabled' 双保险关动画；截图前隐藏 fixed/sticky 元素避免导航栏重复渲染造成 diff 噪音
  - 日常 diff 模式连续两次 6/6 passed，4 张基线可重复匹配
  - 无横向溢出，iframe 遍历正常，demo 链接 HTTP 200，无 console 错误
- 视觉自检 v8.1（2026-08-12 速度/Token 优化，Architect 001000 确认四项全采纳）：
  - **报告分组**：输出从逐条 PASS → 每段一行摘要（如 `[交互断言] 9/9 ✅`），只列 FAIL 明细，报告体积省 ~90%
  - **iframe 就绪轮询**：交互测试固定 waitForTimeout(1300)×6 → readyState==='complete' + visible===1 轮询（100ms 间隔，8s 超时），交互断言 10.8s → 3.2s（省 70%）
  - **demo HTTP 并行**：request.get 提前发起与作品遍历并行
  - **视口截图精简**：768/1920 降为仅 DOM 断言（768 是 767 断点上一档必须保留断言；1920 与 1280 无布局差异），截图基线 4 → 2（375+1280）
  - 总时长 33.5s → 23.6s（省 30%）；断言 70 → 68（截图相关检查随截图精简）
  - 三次全量验证 + 一次最终日常 diff 均 6/6 passed，新基线（375/1280）可重复匹配

## v3.8.1 (2026-08-12) 数据分析能力卡文案适配行业写法

基于 v3_8 原地单行修改（Architect 直接执行，胡凯确认）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | 能力全景卡数据分析行 | `Python · Power BI · SQL · AICPA 属性抽样 · 泊松近似` → `Python · Power BI · SQL · 财务数据建模 · 经营分析报告`（行业写法，弱化审计专业词） |
| 2 | 保留范围 | SOX 工作台项目页 / portfolioKB / 作品列表 w06 中的 AICPA/泊松描述一律保留不动（作品自身主题内容） |

### 验证

- QA 断言脚本无 AICPA/泊松旧文案断言，无需同步更新
- 文案变长致 desktop_1280 截图基线变化 → 重建基线（375+1280），日常 diff 模式 6/6 passed (23.7s)

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

- 视觉自检 55/55 通过（四视口 + v3.6 内容断言 + iframe 遍历），Architect 复审 10/10 + 55/55 通过，无 P0/P1

## v3.7 (2026-08-12) 收敛前终版：称呼统一 + 能力全景 + 协作技术栈

基于 v3_6，收敛前终版（Claude task PORTFOLIO-V3_7-CONVERGE + notify 纠正/追加）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | 主线故事 → 能力全景卡片 | Hero 下"研究→方案→落地"三层故事替换为 4 张能力全景卡（💰资金运营 / 🔍审计内控 / 🤖AI Agent 系统 / 📊数据分析），≤767px 4 列→2 列 |
| 2 | 面试官速览 → 协作技术栈 | 4 岗位卡+1 亮点卡替换为「协作技术栈 TECH STACK」：6 个技术标签一行排开（Claude(Architect) 紫 / DeepSeek(Builder) 蓝 / Playwright 视觉自检 / GitHub Skills 设计规范 / Bridge Protocol 通信 / Context Optimization 压缩），底部真实数据一行（57 封通信 / 8 主题归档 / 4 协作项目） |
| 3 | 全站称呼统一 | 诚实披露段落"执行者某次将回信误写入 outbox"→"Senior Specialist"；w04 智对账协作描述块"决策者+参谋 / 执行者"→"决策者+Manager / Senior Specialist"。SOX v1→v4 流水账为历史记录，按任务要求不改 |
| 4 | 协议链接补回 | "讨论型协作"块内补回 `📁 完整协作协议：bridge/PROTOCOL.md`（code 样式，与 v3.3 原版一致） |
| 5 | portfolioKB 更新 | versions 追加 v3.7，标注"收敛前终版(当前)" |

### 技术说明

- 能力全景卡片全部内联 style，不新增 CSS 类；响应式 4→2 列通过 767px media query 内属性选择器 `.sec[style*="margin-bottom:48px"] > div[style*="repeat(4,1fr)"]` 实现
- 协作技术栈标签样式复用 v3.6 徽章风格（渐变圆点 + 胶囊边框），Claude 紫系 / DeepSeek 蓝系 / 其余中性
- 替换后 reveal 数量不变（面试官速览 .sec.reveal → 技术栈 .sec.reveal；主线故事 .story.reveal → 能力全景 .sec.reveal），主文档 observer 加载时一次性绑定，无需额外处理

### 验证

- 视觉自检 62/62 通过（四视口 + v3.6/v3.7 内容断言 + iframe 遍历），Architect 复审 13/13 + 62/62 通过，连续两轮无 P0/P1，达到收敛标准

## v3.7.1 (2026-08-12) 称呼修正：对外统一 agent 名

基于 v3_7 原地更新（Claude task PORTFOLIO-NAMING-FIX）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | 技术栈标签 | DeepSeek (Builder) → WorkBuddy (Builder & Archive)——对外展示用 agent 名，不用底层模型名 |
| 2 | 三层角色卡 | Manager (Claude) → Claude（Architect）；Senior Specialist (WorkBuddy) → WorkBuddy（Builder & Archive）；DS 徽章 → WB |
| 3 | 讨论型协作副块 | Manager/Specialist → Claude/WorkBuddy（同卡内副块，保持一致性） |
| 4 | 协作进化实例 | Manager/Specialist → Claude/WorkBuddy（SOX 闭环卡 Token 效率讨论段落） |
| 5 | 诚实披露段落 | Senior Specialist → WorkBuddy（回信方向反 bug 记录） |
| 6 | w04 协作描述块 | "决策者+Manager / Senior Specialist" → "决策者+Architect / Builder & Archive"（作品页 iframe 内） |
| 7 | Footer | "协作引擎 Claude + DeepSeek" → "协作引擎 Claude + WorkBuddy" |

### 保留范围（Architect 裁决）

- AI 工具链列表（Kimi/DeepSeek/Claude/...）保留 DeepSeek——历史语义（全流程用过哪些工具）
- 作品技术栈/API 说明（DeepSeek API、deepseek-v4-flash 等）保留——真实实现记录
- portfolioKB versions 保留 "v3.6角色升级Manager+Specialist"——内部知识库（助手自我认知），非对外展示
- SOX v1→v4 流水账旧称呼（参谋/执行者）保留——历史记录
- PROTOCOL/skill/讨论分级表格不动

### 验证

- 视觉自检 63/63 通过（新增「对外称呼 Manager/Specialist 清零」「徽章 C+WB」断言），无横向溢出，iframe 遍历正常

