# 项目档案 / PROJECT BRIEF

> 本文档供复核AI（DeepSeek）快速了解项目全貌。每次重大更新后同步更新。

---

## 1. 这是什么

一个**交互式HTML作品集**，展示"财务+金融+精算+AI"复合背景。

- 在线访问：https://kaihu8766-netizen.github.io/ai-finance-portfolio/
- 技术栈：单文件HTML + ECharts + 原生JS，无框架
- 部署方式：GitHub Pages

---

## 2. 作者画像

| 维度 | 内容 |
|------|------|
| 教育 | 精算本科（惠灵顿维多利亚大学）+ 金融投资学（专业会计）硕士（宁波诺丁汉，2025.09-2027.07） |
| 实习 | Smart Automobile 财务资金部（2026.05-至今）+ 中审众环审计（2025.12-2026.03） |
| 技能 | Python / SQL / Excel / SAP / 精算建模 / AI工具应用 |
| 求职目标 | 2027届秋招，方向：财务数字化、资金管理、AI+财务、职能团队AI Builder |

---

## 3. 作品集定位（非常重要）

**所有作品均来自实习中的观察与深度思考，是个人动手尝试的项目，并未落地到公司实际业务中。**

- 作者是实习生，作品水平尚未达到可落地程度
- 文案避免过度使用"落地""实际应用""公司项目"等表述
- 应诚实反映"基于实习观察的思考与尝试"

---

## 4. 目标岗位

1. **字节跳动 RFT AI Builder** — 职能团队第一代AI Builder，财务/税务/法务/投资/采购的AI工作流设计
2. **京东 JDS 管培生** — 财务/资金方向
3. **美的/比亚迪 财务数字化/资金岗** — 总部岗位
4. **银行/金融机构 资金运营、国际财税** — 宁波银行等

**作品集要回答的核心问题**：这个候选人能不能把财务专业知识和AI工具结合起来，解决真实业务问题？

---

## 5. 作品列表

| 编号 | 作品名称 | 类型 | 核心方法 |
|------|---------|------|---------|
| w01 | 第三方支付资金渠道与结算效率分析 | 研究型 | 行业研究、数据分析 |
| w03 | LPR走势预测与融资成本压力测试 | 建模型 | Vasicek均值回复、蒙特卡洛模拟 |
| w05 | 供应链金融资金流分析与AI预测模型 | 分析型 | 资金归集建模、账期错配诊断、现金流预测 |
| w06 | SOX审计Agent：网易游戏内控测试工具 | 工具型 | 控制矩阵、属性抽样、ITGC评估 |
| w07 | 集团现金流压力测试与现金调度决策系统 | 核心作品 | 多变量随机建模、压力测试、流动性VaR |

---

## 6. 文案风格分区（重要约束）

**不是一刀切的"去AI味"，而是分区处理：**

| 区域 | 风格 | 例子 |
|------|------|------|
| 作品介绍（业务背景/方法论/数据/结论） | 严谨专业，像公司项目汇报 | "采用蒙特卡洛模拟生成10,000条现金流路径，计算95%置信度下的流动性VaR" |
| 个人定位/关于我/AI协作经验 | 自然口语化，像真人说话 | "我在Smart实习的时候注意到..." |
| 局限性分析/数据来源 | 诚实直接，不回避问题 | "本模型为演示用途，参数需按实际业务重新校准" |

**禁止**：
- "赋能""抓手""底层逻辑""全链路""闭环"等AI高频词
- 过度宣称"落地""生产级""企业级"
- 空洞的套话和模板化表达

---

## 7. 设计风格约束

- 深色主题（深蓝/深灰背景），商务感
- 不使用emoji（沟通中），作品内可少量使用
- 手机端必须适配
- 图表用ECharts，颜色统一

---

## 8. 三Agent协作机制（事前对齐 + 事后复核 + 三闸门）

作者采用"人 + 2 Agent"的协作模式，从协作A成熟机制迁移而来：

| 角色 | 定位 | 工具 |
|------|------|------|
| 胡凯（人） | 定方向、拍板、最终确认 | — |
| 主力AI | 拆任务、想方案、写代码与文档、执行落地 | 豆包 |
| 复核AI | 独立审查方案与实施，发现盲区 | DeepSeek（API直连，flash思考模式） |

**复核AI的职责**：
- 事前：方案评审（phase=scheme），判断方案是否成立、有无阻断项
- 事后：实施复核（phase=review），校验 diff_hash 匹配、有无遗漏
- 评审档案自动落盘到 `trace/03-会议与日志/DeepSeek评审/`（PF-RV 档案，唯一权威源）

---

## 8.1 协作流程（主力AI与复核AI必读）

### 工作目录
仓库根目录（`ai-finance-portfolio/`）。主力AI和复核AI通过 `trace/` 目录和 Git 共享状态，不再通过 REVIEW_REPORT.md 文件交接。

### 决策追踪结构（trace/）
```
trace/
├── 00-START-HERE.md          ← 入口
├── DECISIONS.md              ← 跨RV拍板结论（强制引用PF-RV-ID）
├── OPEN_ISSUES.md            ← 已知问题与残余风险
├── CHANGELOG.md              ← 机制变更日志
├── project-state.md          ← 自动生成的决策记忆视图（给DeepSeek注入）
└── 03-会议与日志/
    ├── DeepSeek评审/         ← PF-RV档案（唯一权威源）+ 索引.md
    ├── 功能登记/             ← F-ID功能立项
    └── 门禁记录/             ← GATE-ID大动作门禁
```

### 分工
| 角色 | 负责什么 | 不负责什么 |
|------|---------|-----------|
| 复核AI（DeepSeek） | 方案评审、实施复核、业务逻辑、数据一致性、文案风格、代码质量 | 渲染效果（排版/配色/UI）、交互体验、写代码 |
| 主力AI（豆包） | 修改代码、视觉效果、交互体验、部署、发起评审 | 独立复核（自己审自己有盲区） |
| 作者（人） | 最终拍板、判断性问题决策、查看渲染效果 | — |

### 标准工作流
```
【事前对齐】
1. 作者提需求 → 主力AI判断是否为功能/大改动
2. 功能改动：python3 tools/trace_gate.py preflight --desc "描述" → 生成 F-ID
3. 主力AI写方案 → DEEPSEEK_API_KEY=sk-xxx python3 tools/deepseek_gate.py \
     --topic "主题" --feature F-xxx --phase scheme --prompt "方案..."
4. DeepSeek 输出评审结论（自动存 PF-RV 档案）→ 作者拍板（adopted/rejected）
5. 方案通过后才开始实施

【实施】
6. 主力AI写代码 → git add → git commit
   commit-msg 三闸门自动拦截：
   ① message 必须含 ID 引用（GATE/PF-RV/DEC/ISS）
   ② 命中红线文件必须带已批准且 diff_hash 匹配的 PF-RV
   ③ 功能提交（feat/fix/refactor/perf）必须带已批准 scheme-RV

【事后复核】
7. 主力AI完成修改 → 主动发起事后复核：deepseek_gate.py --phase review
8. DeepSeek 复核（自动记录当前 staged diff_hash）→ 作者拍板
9. 复核通过 → 更新 REVIEW_STAMP.md 批准行（引用 PF-RV-ID）→ push → PR → 合并
10. CI review-gate 兜底校验（不可绕过）
```

**【强制规则1】功能改动必须先过事前对齐（scheme评审），不得先写代码再补方案。**
- commit-msg 闸门3机器强制：feat/fix/refactor/perf 提交无已批准 scheme-RV → 拒绝提交

**【强制规则2】红线文件改动必须带已批准且 diff_hash 匹配的 PF-RV。**
- 红线：index.html / echarts.min.js / demo/ / tools/ / .githooks/ / .github/workflows/ / gate_rules.yaml / PROJECT_BRIEF.md / REVIEW_STAMP.md
- commit-msg 闸门2机器强制

**【强制规则3】主力AI根据复核意见修改前，必须先核实：**
- 用 Grep 确认报告中提到的代码确实存在、行号准确
- 用 Read 确认上下文理解正确
- 不允许"报告说什么就改什么"，必须自己验证

**【强制规则4】Windows文本编码——详见§9.7**
- 写任何文本文件必须用Python `io.open(encoding='utf-8', newline='')`
- 禁止用PowerShell任何形式回写文本文件

**【强制规则5】hotfix白名单**：仅限「纯恢复/单行纯文本/单行路径/单行关键词/revert」可跳过复核直接push；其余一律走常规通道。

### 真相源优先级
1. **PF-RV 档案**（trace/03-会议与日志/DeepSeek评审/）= 唯一权威源
2. **project-state.md** = 自动生成的缓存视图，手工编辑无效，冲突时以 RV 档案为准
3. **DECISIONS.md** = 跨 RV 拍板结论汇总，强制引用 PF-RV-ID，禁止与 RV 档案矛盾
4. **REVIEW_REPORT_v6.md** = 已冻结历史档案（截至2026-09-23），只读，不再新增

### Git权限
- 主力AI：git add / commit / push（push 到新分支，PR 合并由作者或 CI 批准后执行）
- 复核AI：通过 API 调用，不直接操作 Git
- 禁止直接 push master（pre-push 钩子拦截，CI review-gate 兜底）

### 本地钩子安装
新克隆后必须执行：
```bash
git config core.hooksPath .githooks
```
否则 commit-msg 三闸门不生效（preflight 会自检提示）。

### 能力边界（复核AI须知）
- 你不能看HTML渲染效果，只能读源码——排版/配色问题请标注"需人工确认渲染效果"
- 你通过 API 调用，评审结论自动落盘到 trace/，不需要手动写文件
- 评审时 project-state.md 会自动注入历史决策（熔断时跳过注入）


---

## 9. 已知的坑和教训

1. **改内容前先搜全文件**：同一个内容可能在卡片版和详情页都出现，只改一处会遗漏
2. **TRAE图标裁剪**：用户给的截图带蓝色背景，需要裁剪掉背景并填满
3. **手机端适配**：作品详情页在手机端可能点击无反应，需要检查JS事件
4. **图表加载**：ECharts在iframe中可能加载失败，需要用safeInit包装
5. **数据标注**：模拟数据和真实数据必须明确区分，真实数据要可验证
6. **版本号管理**：大版本更新要归档到versions/，更新CHANGELOG
7. **Windows GBK编码陷阱（已复发5次，强制规则）**：
   - **写任何文本文件必须用** `Python io.open(path, 'w', encoding='utf-8', newline='')`
   - **读文本文件必须用** `open(path, encoding='utf-8')`（不带encoding会按cp936读，中文内容会出错）
   - **禁止用 PowerShell 任何形式回写仓库内文本文件**（`Set-Content`、`Out-File`、`>`重定向、`Get-Content | Set-Content`管道、`(Get-Content …) -replace … | Set-Content`）。原因：Windows PowerShell 5.1的`Set-Content`/`Out-File`/`>`不带`-Encoding`时默认按ANSI/GBK或UTF-16LE写（实测落盘字节`d6 d0 ce c4…`或`ff fe…`，非UTF-8）——这就是历次"闭标签`<`被吃掉"和整页乱码的成因；而`-Encoding utf8`反而会写成UTF-8+BOM（内容不坏，但会平白引入BOM差异）。**要改文本一律用 Python `io.open`**
   - **读子进程输出必须用** `encoding='utf-8', errors='replace'`
   - **脚本stdout必须用** `sys.stdout.reconfigure(encoding='utf-8', errors='replace')`
   - **恢复类操作必须同时验内容与编码**（乱码特征0 + 坏闭标签0 + 逻辑功能存在）
   - preflight检查8已覆盖：全仓乱码扫描（标签形态+特征字+非法UTF-8检测）

---

## 10. 仓库结构

```
/
├── index.html              # 作品集主文件（单文件）
├── echarts.min.js          # ECharts库
├── README.md               # 项目说明
├── PROJECT_BRIEF.md        # 本文档
├── REVIEW_CHECKLIST.md     # 复核清单
├── DECISIONS.md            # 决策记录
├── CHANGELOG.md            # 版本更新日志
├── assets/                 # 图片资源（logo、图标）
├── demo/                   # 可交互Demo
│   ├── LPR蒙特卡洛预测模拟器.html
│   ├── 供应链现金流压力测试模拟器.html
│   ├── SOX控制测试工作台.html
│   └── 现金流压力测试模拟器.html
└── versions/               # 历史版本归档
```

---

*最后更新：2026-09-10*

