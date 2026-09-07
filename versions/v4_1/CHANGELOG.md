# 胡凯 AI 财务作品集 — CHANGELOG

## 🎯 v5.0 (2026-09-02) 精简聚焦 + 四角色协作体系升级

> 秋招定位进一步聚焦：删除智对账(w04)和月结流程优化(w02)两个作品，保留 5 个高匹配度作品；同时根据《多Agent协作模式说明》将主页"双Agent协作"升级为"四角色协作体系"（胡凯决策者+WorkBuddy架构师+TRAE执行者+Claude独立审计师）。

### 变更

| # | 同步点 | 改动 |
|---|------|------|
| 1 | **删除 w04 智对账 SmartRecon** | 删除作品矩阵卡片、page-04 详情页模板、page-proto 高保真原型（38KB）、portfolioKB 条目、AI 助手 recon 离线场景、navItems、quickQs |
| 2 | **删除 w02 财务月结流程优化** | 删除作品矩阵卡片、page-02 详情页模板（17KB）、portfolioKB 条目、navItems |
| 3 | 作品矩阵 | 4 wide + 3 mini → 3 wide + 2 mini（mini 区 3 列改 2 列）；en 标签改为 RESEARCH → AI SYSTEM → AUDIT → ACTUARIAL RISK；五件作品 |
| 4 | **主页协作区域重写** | 双 Agent 协作实战 → 四角色 AI 协作实战：胡凯(Decision Maker)+WorkBuddy(Architect)+TRAE(Builder/第二大脑)+Claude(Independent Auditor)；新增信箱协作机制(TASK/REPORT)、强制讨论、问题分级 P0/P1/P2、视觉门禁、每日收尾 SOP、真实性红线等机制 |
| 5 | portfolioKB | 删除 w02/w04/智对账原型/recon keyNumbers；purpose 五层→四层；home 6→5 作品；versions 追加 v5.0 |
| 6 | AI 助手 | navItems 5 项；quickQs 智对账→现金流压力测试；portfolio 导览更新；欢迎语 7→5 作品；localPattern 清理智对账/月结/对账关键词 |
| 7 | 全局 | Hero stats 7→5；双 Agent 区 7→5；w03 core-link 改指向 w07；w07 callout 引用 w04→w05；footer 协作引擎更新；关于我-产品设计描述更新 |

### 验证

- portfolioKB JSON 解析通过：6 个结构条目（home + w01/w03/w05/w06/w07）✅
- 作品矩阵 5 卡渲染正常（3 wide + 2 mini）✅
- page-02/page-04/page-proto 模板已完全删除 ✅
- 四角色协作区域渲染正常，角色描述与说明文件一致 ✅
- 无断链（showWork('02')/showWork('04') 已全部清除）✅

---

## 🎯 v4.5 (2026-09-02) 精算复合背景大升级：新增现金流压力测试 + 两作品精算注入

> 秋招定位升级：从「AI×财务」扩展为「财务×金融×精算×AI」复合背景。新增第 7 个核心作品 w07 集团现金流压力测试，同时为 w03 LPR 和 w04 SmartRecon 注入精算方法模块，让精算背景从简历标签变成作品集里的可展示能力。

### 变更

| # | 同步点 | 改动 |
|---|------|------|
| 1 | **新增 w07 作品** | 集团现金流压力测试与资金调度决策系统：蒙特卡洛 10,000 条路径（5 随机变量联合抽样）、三情景压力测试（基准/温和衰退/严重衰退）、95% 流动性 VaR、AI Agent 资金调度建议，含 3 张 ECharts 交互图表（预测区间带/压力对比柱状图/概率分布直方图） |
| 2 | 作品矩阵 | 新增 w07 wide 核心卡（绿色 ACTUARIAL · RISK MODELING 标签 + ★精算核心徽章），4 wide + 3 mini 布局；en 标签改为 RESEARCH → PRODUCT → AI SYSTEM → ACTUARIAL RISK |
| 3 | **w03 LPR 精算注入** | 应用价值段新增「企业融资成本压力测试」模块：1 亿 5 年期贷款三情景利息支出测算（1320/1180/1500 万）、概率加权期望 1319 万、95% VaR 1500 万、IRS 对冲决策建议 |
| 4 | **w04 SmartRecon 精算注入** | Agent 架构段新增「精算风险识别引擎」：Z-score / 马氏距离 / 泊松分布 / 风险概率打分四层统计方法，差异化于纯规则+LLM 的财务 AI 作品 |
| 5 | portfolioKB | 新增 w07 条目（structure/highlights/tags）；w03 highlights 加蒙特卡洛+融资压力测试；w04 highlights 加精算统计风险打分层；purpose 改为五层递进；versions 追加 v4.5 |
| 6 | AI 助手 | navItems 新增 w07；离线导览更新为 10 项（含 w07）；欢迎语/离线 fallback 6→7 作品 |
| 7 | 全局 | Hero stats 6→7 递进式作品；work-lead 六件→七件；双 Agent 区 6→7 作品 |

### 验证

- portfolioKB JSON 解析通过：8 个结构条目（home + w01-w07）✅
- 作品矩阵 7 卡渲染正常（4 wide + 3 mini），w07 卡片绿色标签/徽章正确 ✅
- w07 详情页 iframe 加载正常（srcdoc 810KB），H1/KPI/表格/6 个 section 完整 ✅
- w07 三张 ECharts 图表全部渲染：chart7_1 预测区间带（历史+未来 12 月，10/50/90 分位）、chart7_2 三情景柱状图（含安全垫阈值线）、chart7_3 概率分布直方图（含 VaR 95% 线）✅
- w03 新增融资成本压力测试模块渲染正常（5 表格、含 95% VaR 文本）✅
- w04 新增精算风险识别引擎模块渲染正常 ✅
- 浏览器无 console 报错，页面无横向溢出 ✅

---

## 📊 v4.4.2 (2026-08-30) w03 数据时效更新 + 叙事强化（秋招投递前）

> 联网核实（2026-08-30）：①8 月 LPR 报价出炉，1Y 3.0%/5Y 3.5% **连续 15 个月不变**（此前页面写 14 个月，数据截至 2026-07）②金融监管总局披露 2026Q2 商业银行净息差 **1.41%，四年来首次单季环比回升**（Q1 触底 1.40%）。社融存量 463.27 万亿 +7.4% 与 CPI +0.5%/核心 +0.9% 经核实无误，未动。

### 变更

| # | 同步点 | 改动 |
|---|------|------|
| 1 | page-03 KPI 卡 | LPR「连续 14 个月」→「连续 15 个月」；净息差 1.40%（历史新低）→ 1.41%（四年首现回升），来源标注 Q1→Q2 |
| 2 | page-03 四指标表 | 净息差行分析逻辑更新：Q1 触底 1.40%、Q2 微升 1.41% → 银行让利空间仍紧 → 报价行不愿降加点 → LPR 难降 |
| 3 | page-03 分析结论 | 叙事升级为「触底 1.40%（历史低点）→ Q2 微升 1.41%（四年首现回升）→ 0.01pct 回升远不足以支撑主动降点 = LPR 持稳核心制约」，补「回升反而强化持稳论证链」 |
| 4 | page-03 泰勒规则段 | 补充 Q2 微升 1.41% 仍处历史低位、资本补充压力未解 |
| 5 | page-03 图表区 | chart2 因果链图注更新；xAxis「净息差 1.40% 新低」→「1.41% 微升」；制约降点 label「净息差新低→不愿降点」→「回升微弱→仍不愿降点」 |
| 6 | page-03 关键数据表 | LPR 15 个月；净息差 1.41% + 2026Q2 四年首现回升（Q1 触底 1.40%） |
| 7 | page-03 ALM 联动 | 补 Q2 微升衔接：任何主动降点都会重新挤压息差，是报价行谨慎的深层原因 |
| 8 | page-03 局限披露 | 数据截至 2026-07 → 2026-08（含 8 月报价与 Q2 净息差） |
| 9 | portfolioKB w03 summary | 同步新数据与叙事（AI 助手问答口径一致） |
| 10 | qa_visual_check.js | N10 w03Four 断言同步：加验 1.41% / 15 个月（保留 1.40% 触底表述检查） |

### 验证

- 数据更新静态断言 14/14 ✅（新表述全部就位、旧表述「历史新低/14 个月/Q1 新低」零残留）
- KB JSON 解析 OK（structure 7 / prototypes 2）✅
- demo 引用完整（SOX 工作台 / lpr_monte_carlo.py / lpr_mc_quantiles.csv）✅
- JS 语法快检与未修改的 v4_0 定版版一致（4 OK + 8 个正则误报，非本次改动引入）✅

---

## 🔧 v4.4.1 (2026-08-30) Demo 可靠性加固（秋招投递前）

> 审查发现：蒙特卡洛 Demo 依赖 numpy/matplotlib，但启动器只检查 Python 存在、不检查依赖包 → 面试官机器未装包时裸报 `ModuleNotFoundError`；脚本在 GBK 控制台直接运行时打印 ⚠️ 会崩溃（`UnicodeEncodeError`）。对账 Demo 经核实纯标准库零依赖，无需改动。

### 变更

| # | 同步点 | 改动 |
|---|------|------|
| 1 | demo/lpr_monte_carlo.py | 脚本开头新增 `sys.stdout/stderr.reconfigure(encoding="utf-8")`（Python 3.7+，try/except 包裹）——任何终端直接运行不再因 ⚠️ 崩溃；去重 `import os` |
| 2 | demo/一键运行蒙特卡洛.bat | 重写为四步：①定位 Python（python/py 双探针）②依赖检查 `import numpy, matplotlib` ③缺失时提示并询问「是否自动安装 [Y/n]」→ Y 自动 `pip install numpy matplotlib`（成功 goto run / 失败提示手动命令），N 显示手动安装命令 ④运行脚本。**CRLF 行尾 + 纯 ASCII 提示**（cmd 对 LF-only 批处理解析异常；中文提示在 chcp 65001 下会乱码，统一英文） |
| 3 | demo/requirements.txt | 新增：`numpy>=1.24` / `matplotlib>=3.7`，供手动安装 `pip install -r requirements.txt` |

### 验证（2026-08-30 实测）

- 蒙特卡洛脚本 **GBK 控制台（代码页 936）直跑 exit 0**：概率分布 2.7%/69.7%/27.6%、期望 2.88%、60 个月分位数序列、PNG 输出全部正常，不再崩溃 ✅
- .bat 三分支全测：
  - 缺依赖 + 输入 N → 显示手动安装命令后退出 ✅
  - 依赖满足 → 直接运行脚本（中文输出正常）✅
  - 缺依赖 + Y + 安装失败（无 pip 环境）→ 报错并提示手动命令 ✅
- 对账 Demo（零依赖）回归运行正常 ✅

---

## 📌 最近 3 版本速览

| 版本 | 一句话 |
|---|---|
| v4.4 | 图表 1 改版全宽大图：LPR 走势图独占整行（400px），1Y/5Y 双线历史+未来预测区间带（双期限利差叙事），右侧新增期限利差图；区间带修复为 stack 填充（只在 10%-90% 之间） |
| v4.3 | 图表 1 升级「历史 + 未来 5 年预测区间带」：蒙特卡洛真实分位数（10/50/90）进图，区间随预测期变宽可视化不确定性 |
| v4.2 | LPR 案例精算增强：理论视角（期限结构/泰勒规则）+ 情景概率表 + 概率加权期望 + 5 年展望（含蒙特卡洛 5000 条真实脚本） |
| v4.1 | w03 替换：收入核算产品方案 → LPR 走势预测分析案例（四指标框架 MLF/净息差/社融/CPI + 2 张 ECharts + 五段式叙事） |
| v4.0 | 作品集第四代：AI 助手四方向大更新（流式/快捷提问/快速导览/面试模式/可填Key）+ 机制列表 6→8（由 v3.11 更名定版） |

---

## v4.4 (2026-08-15) 图表 1 改版全宽大图（用户反馈驱动）

> 胡凯反馈（截图）：LPR 走势图不够好看、信息不够全面，要求变成大图并突出 1Y/5Y 双期限值 → 方案 A（全宽大图）确认执行。

### 变更

| # | 同步点 | 改动 |
|---|------|------|
| 1 | page-03 布局 | chart1 所在 chart-box 加 `grid-column:1/-1` 独占整行（桌面 400px 高，移动端 320px 专项适配），chart2（四指标联动）与 chart3（期限利差）并排在下 |
| 2 | demo/lpr_monte_carlo.py | 新增 5Y 蒙特卡洛输出：θ=3.0% / κ=0.25 / σ=0.22（叙事假设），5 年后 5Y 中位数 ≈3.14%，导出 lpr_mc_quantiles.csv 含 1Y/5Y 分位数 |
| 3 | page-03 图表 1 | 1Y/5Y 历史线加粗（2.5px）+ 关键节点数值标注（2019-08 改革首报 / 2022-05 / 2026-07 当前，带 %）；markLine「今天 · 预测起点」竖分界线；**区间带改为 stack 填充**（底座 q10 + 增量 q90-q10），阴影只在 10%-90% 之间；1Y 右端点标 10%/90%/中位数，5Y 右端点只标中位数（避免拥挤） |
| 4 | page-03 图表 3（新增） | 期限利差（5Y-1Y）历史走势 + 未来 5 年预测区间带，右端点标注「利差 0.26pct」，填补 chart2 右侧空白 |
| 5 | page-03 图注/局限披露 | 5Y 蒙特卡洛参数明确为「叙事假设（地产政策定向引导 5Y 更快下行的预期）」，非市场校准；区间带 stack 填充说明 |
| 6 | page-03 tooltip | 预测段 hover 加「▸ 预测段」标识；区间带双序列合并显示为「预测区间 (10%-90%)：低%~高%」一行；所有数值加粗带 % |
| 7 | x 轴 | 新增 2030-08（idx 60）刻度，keep=[0,4,8,11,24,36,48,60,71] |
| 8 | qa_visual_check.js | N10e 断言扩展 5Y/期限利差/叙事假设关键词 |

### 验证

- 内容断言 29/29 ✅
- 视觉自检：chart1 全宽大图、1Y/5Y 双区间带、右端点标注无重叠、chart2/chart3 并排无空白 ✅
- **chart3 标注重合修复（胡凯二轮反馈）**：历史利差端点从 series.label（全 top 易重叠）改为 markPoint 独立定位；标注值修正（0.6/0.75/0.5）；legend 挪到底部避遮挡；三标签方向错开（0.75 左 / 0.6 右上 / 0.5 右）✅
- **chart3 markLine 标签样式（胡凯三/四轮反馈）**：「今天 · 预测起点」横排 + 居中 + 虚线最顶端（position:'end', rotate:0, align:'center'，颜色 #e2e8f0 加亮）✅
- 5Y 参数诚实性：θ=3.0% 经 Architect 讨论确认（避免 5Y 中枢低于 1Y 导致利差倒挂），已在脚本图注标注「叙事假设」

---

## v4.3 (2026-08-15) 图表 1 升级：未来 5 年预测区间带

> Architect PORTFOLIO-LPR-v42 复审通过后新需求（胡凯补充：5 年预测要体现在图表中）：图表 1 从「纯历史走势」升级为「历史事实 + 未来趋势 + 不确定性」三合一。

### 变更

| # | 同步点 | 改动 |
|---|------|------|
| 1 | demo/lpr_monte_carlo.py | 新增分位数序列输出：未来 60 个月（2026-08 ~ 2031-07）10%/50%/90% 分位，导出 lpr_mc_quantiles.csv |
| 2 | page-03 图表 1 | 历史段（2019-08 ~ 2026-07 1Y/5Y 真实双线）+ 未来段（蒙特卡洛中位数虚线 + 10%-90% 区间带 areaStyle，区间随预测期变宽）；x 轴 72 点（历史 12 + 未来 60），y 轴 2.4-5.0 |
| 3 | page-03 图注 | 更新为历史+未来双段说明，未来段诚实标注「θ/κ 演示设定，脚本可复现」 |
| 4 | qa_visual_check.js | 新增 N10e 断言（未来 5 年预测区间/预测区间带/预测中位数/2031-07/lpr_mc_quantiles.csv） |

### 验证

- 蒙特卡洛真实输出：2031-07 中位数 2.88%、10% 分位 2.62%、90% 分位 3.13%（区间带宽 0.51pct，vs 2026-08 带宽 0.08pct → 区间随预测期变宽 ✓）
- 内容断言 29/29 ✅（新增 N10e）

---

## v4.2 (2026-08-15) LPR 案例精算增强：理论视角 + 情景概率 + 蒙特卡洛

> Architect PORTFOLIO-LPR-DEPTH task（胡凯将 v4.1 发给 GPT 获得精算深化建议 → Architect 提炼三补充）：给 w03 补「精算学 + 金融经济学」专业纵深 + 未来 5 年预测。内容增强，版本 v4.2（不触主线叙事）。

### 变更

| # | 同步点 | 改动 |
|---|------|------|
| 1 | page-03 新增 sec 03 | 「理论视角：为什么 1Y/5Y 会分化」（期限结构视角 + 合意利率/泰勒规则框架），轻量文字无图，编号顺延 04-06 |
| 2 | page-03 数据看板段 | 原「预测结论」单点 quote → 「基准判断锚点句 + 三情景概率表（60/25/15）+ 概率加权期望 E(LPR)≈2.95%」 |
| 3 | page-03 新增 | 「5 年趋势展望」：利率中枢长期下行逻辑（日韩轨迹 + 人口结构），区间预测 2.5%-2.8% 中枢，诚实标注「趋势判断非模型预测」 |
| 4 | page-03 新增 | 蒙特卡洛模拟结果（真实脚本输出）：<2.5% 2.7% / 2.5-3.0% 69.7% / ≥3.0% 27.6%，期望 ≈2.88% |
| 5 | page-03 应用价值段 | 开头新增 ALM 联动句（LPR→净息差→资本压力），压缩原开头段 1 句（删「这正是对账提效之外…」） |
| 6 | page-03 局限段 | 新增蒙特卡洛诚实披露（θ/κ 演示设定、σ 序列估计、脚本可复现） |
| 7 | demo/ | 新增 lpr_monte_carlo.py（5000 条路径，θ=2.7%/κ=0.1 演示、σ 由 2019 后 LPR 序列估计）+ 一键运行蒙特卡洛.bat + lpr_mc_paths.png 路径图 |
| 8 | QA 断言 | 新增 N10d（理论+情景+蒙特卡洛+ALM 四组关键词断言） |

### 验证

- 蒙特卡洛脚本真实运行：概率分布 <2.5% 2.7% / 2.5-3.0% 69.7% / ≥3.0% 27.6%，期望 ≈2.88%，PNG 输出正常
- page-03 结构验证：sec 01-06 编号连续，旧内容（预测结论单点/「对账提效」句）零残留

---

> 胡凯拍板（Architect 040000 task）：删除「收入核算自动化产品方案」，替换为「LPR 预测」分析案例。定位=分析案例（非产品方案），版本=v4.1（小版本，作品数不变 6 个，layer 改 RESEARCH）。

### 变更

| # | 同步点 | 改动 |
|---|------|------|
| 1 | 目录名 | v4_0 → v4_1（新目录，v4_0 留档，Immutable Artifacts） |
| 2 | meta description | 删「收入核算自动化」→ 加「LPR 走势预测分析」 |
| 3 | 作品矩阵卡 | badge PRODUCT→RESEARCH；标题/描述改 LPR 四指标框架 |
| 4 | portfolioKB w03 | layer 产品→研究；name/desc/summary/tags 全改（tags: LPR/利率预测/净息差/贷款定价/宏观分析/MLF/社融/CPI） |
| 5 | page-03 详情页 | 全文重写为五段式（背景/四指标框架/数据看板/应用价值/局限披露）；kpis 换四指标卡片；2 张 ECharts（LPR 历史走势 2019-2026 + 四指标联动因果） |
| 6 | CSS step5 | 删除（收入核算专属，仅 w03 使用 4 处） |
| 7 | 主线跳转文案 | 「收入核算方案→AI Agent」→「LPR 宏观分析→AI 对账系统：资金岗的两只眼睛」 |
| 8 | 关于我 | 标题「产品能力」→「产品与数据分析」；新增「数据分析：LPR 走势预测分析」条目 |
| 9 | 助手 persona/导航/关键词 | 作品 03 名称/关键词改 LPR/利率/净息差/MLF/社融/CPI |
| 10 | QA 断言 | N10a 由 G2N 链路 → LPR 四指标 + 诚实披露断言；N4 关于我断言同步 |

### 数据来源（联网核对 2026-08-15）

- LPR 1Y 3.0% / 5Y 3.5%，2025.05 后连续 14 个月持稳（央行/中行序列）
- 净息差 2026Q1 1.40% 历史新低（金融监管总局，较 2025Q4 1.42% 收窄）
- 社融 2026-07 末存量 463.27 万亿 +7.4%；7 月人民币贷款单月 -3400 亿（央行）
- CPI 2026-07 同比 +0.5%、核心 +0.9%（国家统计局）
- 专家预测：政策利率先降 10-20bp、LPR 跟进 5-10bp、5Y 定向下行（董希淼/王青）

### 验证

视觉自检（门禁 v1.2）+ QA 断言更新后复审。

---

## v4.0 (2026-08-13) 作品集第四代：AI 助手四方向大更新（由 v3.11 更名定版）

> 版本号策略定案（Architect 084500）：语义化版本三级划分 + 单向标准（触及叙事主线/对外定位/主导体验形态 → 大版本）。AI 机器人四方向大更新符合"主导体验形态变更"，v3.11 → v4.0。历史 v3_x 目录不动，本版本由 v3_11 复制更名，v3_11 留档。

### 定版同步

| # | 同步点 | 改动 |
|---|------|------|
| 1 | 目录名 | v3_11 → v4_0（新目录，v3_11 留档，Immutable Artifacts） |
| 2 | portfolioKB versions | 追加 `→ v4.0 作品集第四代·AI助手四方向大更新(当前)` |
| 3 | QA 断言 N11 | `kb.versions.includes('v3.11')` → `includes('v4.0')` |
| 4 | CHANGELOG | 本节 + 速览表更新 |

内容即 v3.11（AI 助手四方向大更新 + 机制列表 6→8），详见下方 v3.11 小节。

### 验证

视觉自检分级定案（Architect 091500，PROTOCOL §视觉自检分级触发）：v4.0 纯更名不触可见 DOM → **轻量验证，免截图**（Builder 001500 建议 + Architect 独立验证通过）。

| # | 轻量验证项 | 结果 |
|---|-----------|------|
| 1 | JSON parse 合法 | ✅ structure 7 / prototypes 2 |
| 2 | versions 含 v4.0、无 v3.11(当前) 残留 | ✅ 精确正则复核 |
| 3 | QA 断言 N11 `includes('v4.0')` | ✅ |
| 4 | L2450 离线 fallback 字符串 `v1→v3.11` → `v1→v4.0` | ✅ 本轮新修（grep 旧值发现，截图 diff 抓不到） |
| 5 | QA dump 标签 L494 v3.11 → v4.0 | ✅ Architect 指出后修复 |
| 6 | grep `v3\.11` 全扫 | ✅ 仅剩注释历史标注（功能引入版本记录，保留） |

[执行侧数据] 轻量验证 6 项全过 / 拦截 bug 1 个（L2450 版本号遗漏）/ 未跑截图（分级定案免截图）

## v3.11 (2026-08-13) AI 助手大更新 + 机制列表扩展（v4.0 前身，已更名定版）

基于 v3_10 开新版本（Claude task PORTFOLIO-V3_11-ITERATION-MECHANISM + PORTFOLIO-V3_11-AI-ASSISTANT-OVERHAUL，讨论信 5 判断 + 3 盲区全采纳）。

### v3.11a 机制列表 6→8 条

| # | 改动 | 说明 |
|---|------|------|
| 1 | +每日收尾 | 每天睡前三卡提炼（做对了什么/踩了什么坑/新决策）+ 协议健康检查，当天教训当天固化 |
| 2 | +持续迭代 | 协作模式本身每天更新——今天迭代出的规则，明天就写进协议，机制不是静态文档是活的系统 |

### v3.11b AI 机器人四方向大更新

| # | 方向 | 改动 |
|---|------|------|
| 1 | 界面体验 | 欢迎态（头像+引导语）+ 快捷提问卡 5 个 + 快速导览 6 卡（两层 UI 分离）+ textarea（Enter 发送/Shift+Enter 换行/自动增高）+ loading 三点动画 + 流式光标 |
| 2 | 功能联动 | 主动导览（打开第N个作品/作品名强模式匹配 → showWork）+ 回答嵌入「查看《作品》→」跳转按钮 + 快捷指令动词识别 |
| 3 | 对话智能 | 滑动窗口记忆（16 条 + 早期摘要压缩）+ 主动追问（persona 指令 + 代词检测，只追问一层）+ 面试模拟模式（触发/退出/引导式导览响应） |
| 4 | 知识底座 | portfolioKB 重构为独立 `<script type="application/json">` 数据块（每作品 summary/tags/highlights 结构化）+ RAG 升级为作品级+政策级双通道检索（kbSearch，回答附出处）+ 可填 key 设置入口（sessionStorage 内存态，刷新即清） |

### 工程

- 流式输出：callAPI 支持 SSE（fetch stream:true + ReadableStream 逐块解析 delta），无 ReadableStream 自动回退非流式+模拟打字机；中断（超时/网络断）保留半截文本 + 追加「（已中断）」标记
- 头部三态状态点：🟢 真实 AI / 🟡 离线兜底 / 🔵 本地知识命中；面试模式下变「🎓 面试官模式」可点击退出
- 面试模式不自动打开作品，引导式回答（「作品在下方作品矩阵，您可以点击…查看」），导览动作留给对方

### 同步更新

- QA 断言 +8（N11 KB 独立 JSON 块 / N12 引擎能力 / 助手 v3.11 功能测试 6 项：欢迎态/面试触发退出/主动导览/key 弹层）
- portfolioKB versions 追加 v3.11（标注当前）——KB 已迁至独立 JSON 块维护
- 注意：本版本基于 v3_10 复制，继承 v3.9.1（--accent）+ GEMINI 三条 + v3.10 商业化深度全部改动

### 验证

- 视觉自检（用户确认 Auto 后）：
  - 首次日常 diff：4/7 passed（mobile_375 + desktop_1280 截图高度 diff——v3.11 内容变更导致页面高度增加 mobile +122px / desktop +23px，预期内；QA 脚本 portfolioKB versions 断言旧正则未适配 JSON 块→已修复）
  - QA 脚本修复：`portfolioKB versions` 断言从旧正则 `versions:\s*'([^']*)'` 搜内联 script → 改为读 `#portfolioKB-data` JSON 块（适配 v3.11 架构变更）
  - 重建基线后：7/7 passed (28.7s)，80 条断言全绿
  - 日常复验（幂等）：7/7 passed (28.5s)，基线稳定
  - 断言覆盖：四视口 38（含 2 截图）+ 内容 27 + 交互 9 + 助手功能 6 = 80 项全部 PASS



基于 v3_9（含 v3.9.1 --accent 修复），开新版本 v3_10（Claude task PORTFOLIO-V3_10-COMMERCIAL-DEPTH，讨论信 3 建议全采纳）。

### 改动清单

| # | 改动 | 说明 |
|---|------|------|
| 1 | w03 收入核算页 + G2N 净收入还原 | `GMV − 平台抽成 − 渠道手续费 − 返利/优惠券 − 坏账备抵 = 实际净收入` 链路卡 + 口径差异句（会计关账 vs 商业化结算两个层次），诚实标注"产品方案设计，非生产数据" |
| 2 | w04 SmartRecon + 营运资金 CCC 视角 | 在途资金 = 资金占用：`清算周期缩短 × 日均交易量 × 资金成本率 = 资金占用节省` 公式块，只给公式不编数字（与 keyNumbers 现有 20884/21037/94.2% 数据不冲突） |
| 3 | w04 + 死信队列 + 审计日志 | 三级漏斗后补闭环最后一环：DLQ（<80% 且人工驳回自动进入，归因标签对齐现有分类：重复付款存疑/未达账项存疑/汇率错配存疑）+ Audit Log（Timestamp + Prompt Hash + Agent Version 不可篡改留痕），形成"熔断（事前）+ 留痕（事后）"完整闭环 |

### 同步更新

- QA 断言 +3（N10a G2N / N10b CCC 无编造数字 / N10c DLQ+AuditLog 闭环）
- portfolioKB versions 追加 v3.10（标注当前）
- 注意：本版本编辑基于 v3_9 目录复制，同时继承 v3.9.1 热修复（--accent）与 GEMINI 三条（CSS 语义化类 .cap-sec/.grid-cols-4/.stack-card/.stack-flex、iframe 显式 dispose、N9 一致性断言）

### 验证

- v3_9 日常 diff（验证 GEMINI 三条无回归）：6/6 passed (23.6s)，内容断言 22/22（含 N9 portfolioKB 一致性）
- v3_10 基线重建：6/6 passed (22.7s)
- v3_10 日常复验（幂等）：6/6 passed (23.0s)
- 断言覆盖：四视口 38（含 2 截图）+ 内容 25 + 交互 9 = 72 项全部 PASS

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

