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
