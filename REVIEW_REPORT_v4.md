# REVIEW_REPORT_v4 — v5.3.3 第四轮复核（完整版）

> **本文件是自包含的**：不依赖任何聊天记录、也不依赖前三轮报告的上下文即可阅读和照做。
> 前三轮报告仍在 `REVIEW_REPORT.md`（第一~三轮，含数据核验台账），本文件只做**第四轮**；两者的关系见「§0.4」。

---

## §0 基线、方法、如何复现

### 0.1 复核基线

| 项 | 值 |
|---|---|
| `HEAD` | `656bb8e`（v5.3.3） |
| 上一节点 | `c7f4418`「v5.3.3: DeepSeek第三轮复核修复 - P0/P1/P2/P3全部完成」 |
| `index.html` | 6060 行 / 651 KB / SHA256 `15CD282EB35F7DC0ADEC30265EC7415A3FAEFAC11F6F358FF5DE474C0DF60F56` |
| 本文件行号 | **全部为当前 `index.html` 行号**（第一~三轮报告的行号基于 5911/6066 行旧版，已失效，勿混用） |
| 工作区 | `git status` 仅 `?? REVIEW_REPORT_v4.md`（未跟踪、未被忽略，**勿误提交**） |
| 本轮动作 | **未 push、未 commit、未改动任何被跟踪文件** |

本轮审查的两个提交：
- `c7f4418`：`CHANGELOG.md` / `DECISIONS.md` / `README.md` / `demo/sox_sampling.py` / `index.html`(216 行) / `tools/preflight.py`(新增 145 行)
- `656bb8e`：`demo/lpr_monte_carlo.py`(80 增 80 删，英文化)

### 0.2 复核方法（每一项结论都有可复现的检查过程）

1. **脚本化解析 21 个图表 option 对象字面量**：用括号配对 + 字符串感知扫描，提取每个 `safeInit('x', {…})` 的 **depth-1 键**、`grid/xAxis/yAxis/legend` 的形态（对象/数组/缺失）、`series` 的 `type`、是否用 `yAxisIndex`。（**不是抽样目测**）
2. **5 份 `safeInit` 归一化比对**：去空白后比较函数体与 media 块，识别副本漂移。
3. **实际运行**：`python tools/preflight.py`、`python demo/sox_sampling.py`，看退出码与真实输出。
4. **翻译等价性比对**：把 `lpr_monte_carlo.py` 改前/改后**剥离注释**后逐行比对非注释代码行集合。
5. **文档 diff 比对**：`git diff 8989b77 HEAD -- CHANGELOG.md README.md DECISIONS.md`。
6. **仓库事实核查**：体积分层统计、`.github/workflows/pages.yml`、`.gitignore`、未跟踪文件、行数分层统计。
7. **行号自检**：本报告引用的**每一个** `index.html:行号` 都用脚本逐条回读校验过（50 项，全部命中后才定稿）；修正了 5 处偏差（`共10项` `:2133→:2143`、`AI Portfolio v1.0` `:4631→:4466`、`@media 860/640/480` `:433/:448/:513→:435/:450/:515`、`@media 767` `:565→:567`），并新增 2 处更精确的定位（`:3774` / `:3866`）。**复现命令见 §附B。**

### 0.3 能力边界（必须声明的盲区）

- **无法查看任何渲染效果**（无浏览器/截图能力）。凡结论依赖"实际画出来是什么样"的，都标注「**需上手机实测**」，并给出推理依据。
- 本轮**无法运行** `lpr_monte_carlo.py`（本机缺 `matplotlib`）与 `cashflow_pressure_test.py`（缺 `scipy`），因此这两者只做静态审查 + 依赖核查。
- 未使用作者的 API Key 做任何调用（含免费接口）。相关核验命令已写入 §6.3，请自行执行。

### 0.4 本文件与 `REVIEW_REPORT.md` 的关系

| 文件 | 内容 | 状态 |
|---|---|---|
| `REVIEW_REPORT.md`（647 行，10 节） | 第一轮全量复核 + 第二轮增量（commit `c41cd38`）+ 数据真实性核验台账 | 行号已失效；**数据台账（第十节）仍然有效**，共核 9 项数据（4 项精确命中）、⚠️ 2 项部分、⬜ 6 组未能核实 |
| **`REVIEW_REPORT_v4.md`（本文件）** | 第四轮：v5.3.3 的 P2 手机端适配、preflight 工具、新 bug、翻译、文档同步、**四轮遗留总账** | 当前有效 |

**给下一位复核AI**：先读本文件 §10（四轮遗留总账）了解全貌，再读 `REVIEW_REPORT.md` §5（已核实通过清单）避免重复劳动。

---

## §1 结论摘要（一页速览）

| 焦点 | 结论 |
|---|---|
| **① P2 手机端适配（21 张图）** | ⚠️ **1 个 🔴 + 3 类 🟡**。多 grid 图：**0 张**，不会踩数组坑 ✓；双 y 轴：**1 张**，只覆盖第 0 个轴（不崩、适配减半）；雷达图：**2 张**，会被注入不存在的坐标系（不崩）；**另有 4 张非笛卡尔图被注入坐标系、7 张图被注入图例、且 w03 两张主图 x 轴标签会大幅消失（🔴）** |
| **② `tools/preflight.py`** | 5 项检查**逻辑各有漏检**：检查 1 **漏掉"模板无 IO 脚本"这一真实发生过的形态**；检查 2/3 因目标已修而**永远恒绿**；检查 4 有效但只扫 `index.html`、只认 `sk-`；检查 5 **基本空转**。**更关键：脚本能跑且实测抓到 API Key（exit 1），但没接入任何自动执行点 → 抓到了也拦不住** |
| **③ 新 bug** | 🔴 1 个（media 覆盖自定义 `interval` → w03 主图 x 轴标签消失）；🟡 6 个（`portfolioPersona` 防御返回类型错误、5 份 safeInit 漂移成 3 版、R4 修复实际无效、注入坐标系/图例、`requirements.txt` 缺依赖、版本号不一致）；🟢 4 个。**数据与文案本轮零改动** ✓、**无新重复 id** ✓ |
| **④ `lpr_monte_carlo.py` 英文翻译** | ✅ **逻辑零变化**（141 行非注释代码逐行比对，38 行差异全是 docstring/print）→ CSV 与站点数据仍一致。术语合格，**2 条专业性建议**（"CIR/Vasicek family" 与所写公式不符、"annualized volatility" 口径不准），1 条**引用了 DECISIONS 里不存在的记录** |
| **⑤ 文档同步** | ✅ 已同步 4 项（CHANGELOG 有 v5.3.3、README 加 LESSONS、D008 补注、CHANGELOG 记"已知问题"）；❌ **未同步 7 项**，最严重的是 **CHANGELOG 声称"手机端适配待重做"而代码已实现**，会直接误导下一位复核AI 排查不到 §2 的全部问题 |

**一句话**：v5.3.3 把第三轮的 P0/P1 修得很扎实（R1/R2/R3/R5/R9、`.sec-title`/`.stp`、图表高度、`闭环` 清零全部落实，`sox_sampling` 的 FPC 修法与 `_pendingWork` 竞态守卫**完全正确**），**但 P2 用"一个通解套所有图"，对 21 张图不做区分，产生 1 个 🔴 + 3 类 🟡**；而 P3 工具**写对了却没人跑**。

---

## §2 P2 手机端适配：21 张图逐个判定

### 2.1 实现方式（代码事实）

`safeInit` / `safeInit7` 共 **5 份副本**（`:3107`(page-01) / `:3695`(page-03) / `:4473`(page-05) / `:5375`(proto2) / `:5694`(page-07，名为 `safeInit7`）），每份都在 `setOption` 前自动包裹一层**固定** media：

```js
if (!option.baseOption) {
  option = {
    baseOption: option,
    media: [{
      query: { maxWidth: 768 },
      option: {
        grid:   { left: 8, right: 8, top: 56, bottom: 64, containLabel: true },
        legend: { bottom: 0, top: 'auto', itemWidth: 10, itemHeight: 6, textStyle: { fontSize: 9 }, type: 'scroll' },
        xAxis:  { axisLabel: { fontSize: 9, rotate: 45, interval: 'auto' } },
        yAxis:  { axisLabel: { fontSize: 9 }, nameTextStyle: { fontSize: 9 } }
      }
    }]
  };
}
```

**已核实 ✅**：5 处 media 块去掉空白后**完全一致（不同版本数 = 1）**——这一层没有漂移。
**已核实 ✅**：`interval: 'auto'` 的精确行号为 **`:3121` / `:3709` / `:4487` / `:5389` / `:5708`**。

**为什么 media 一定会生效（原理核对）**：ECharts 的 media `query.maxWidth` 判据是**图表容器宽度**，而这些图表都在全宽的 iframe 内（`#workIframe` `width:100%`），所以手机上容器宽 ≈ 视口宽 ≈ 343px（375 减 padding）< 768 → media 命中 ✓。桌面窄窗口同样命中 ✓。**机制本身没问题，问题在覆盖内容。**

### 2.2 逐图判定（21 张全覆盖）

「原有」列 = 该图**在 media 之前**的结构（`对象` = 单对象；`数组` = 数组；`无` = 完全不存在该组件）。

| 图 | 行 | 页面 | series 类型 | 原有 grid/xAxis/yAxis/legend | 判定 |
|---|---|---|---|---|---|
| chart1 | 3142 | w01 | pie（玫瑰） | 无/无/无/对象 | 🟡 media 注入 grid+xAxis+yAxis |
| **chart2** | **3176** | **w01** | **bar+line（`yAxisIndex:1`）** | 对象/对象/**数组**/对象 | **🟡 双 y 轴只覆盖第 0 个轴** |
| chart3 | 3236 | w01 | bar（横向） | 对象/对象/对象/**无** | 🟡 media 注入 legend |
| chart4 | 3282 | w01 | bar（堆叠） | 对象/对象/对象/对象 | — |
| chart5 | 3351 | w01 | radar | 无/无/无/对象 | 🟡 media 注入 grid+xAxis+yAxis |
| **chart1** | **3750** | **w03** | line（LPR 走势，72 类目） | 对象/对象/对象/对象 | **🔴 自定义 interval 被覆盖** |
| chart2 | 3825 | w03 | bar | 对象/对象/对象/对象 | — |
| **chart3** | **3850** | **w03** | line（期限利差） | 对象/对象/对象/对象 | **🔴 自定义 interval 被覆盖** |
| chart5_1 | 4508 | w05 | sankey | 无/无/无/**无** | 🟡 注入坐标系 + 注入 legend |
| chart5_2 | 4569 | w05 | bar | 对象/对象/对象/对象 | — |
| chart5_3 | 4617 | w05 | line | 对象/对象/对象/对象 | — |
| chart5_4 | 4671 | w05 | gauge+radar | 无/无/无/**无** | 🟡 注入坐标系 + 注入 legend |
| chartP1 | 5406 | proto2 | bar+line | 对象/对象/对象/对象 | — |
| chartP2 | 5420 | proto2 | bar | 对象/对象/对象/对象 | — |
| chartP3 | 5432 | proto2 | bar | 对象/对象/对象/对象 | — |
| chartP4 | 5444 | proto2 | line | 对象/对象/对象/**无** | 🟡 注入 legend |
| chartP5 | 5452 | proto2 | bar | 对象/对象/对象/**无** | 🟡 注入 legend |
| chartP6 | 5460 | proto2 | line | 对象/对象/对象/对象 | — |
| chart7_1 | 5740 | w07 | line | 对象/对象/对象/对象 | — |
| chart7_2 | 5780 | w07 | bar | 对象/对象/对象/**无** | 🟡 注入 legend |
| chart7_3 | 5812 | w07 | bar（直方图） | 对象/对象/对象/**无** | 🟡 注入 legend |

**汇总统计**（可用于验收）：

| 指标 | 数量 |
|---|---|
| 图表总数 | **21**（w01:5 / w03:3 / w05:4 / proto2:6 / w07:3） |
| 原有 grid+xAxis+yAxis（笛卡尔） | **17** |
| 原有 legend | **14** |
| **grid 是数组（多 grid）** | **0** ✅ |
| **yAxis 是数组（双/多轴）** | **1**（w01 `chart2`） |
| **非笛卡尔图（pie/radar/sankey/gauge）** | **4**（3142 / 3351 / 4508 / 4671） |
| **`xAxis.axisLabel.interval` 是函数** | **2**（3750 / 3850） |
| 使用 `yAxisIndex` | **1** |

### 2.3 回答你的三个子问题

#### ① 多 grid 图会被破坏吗？——**不会，因为本项目一张都没有。**

21 张图的 `grid` **全部是单对象**（数组 0 张），所以 media 的单对象 `grid` 只会**按预期**合并进原有 grid，不会出现"数组当对象合并"导致配置损坏（那正是 2026-09-11 问题一的根因）。

**但要写进注释**：这是靠"当前恰好没有多 grid 图"成立的，不是靠设计。建议在 media 旁加一行：
```js
// 注意：若将来出现多 grid 图（grid 为数组），此处的 grid 必须改成等长数组，否则只覆盖 grid[0]
```

#### ② 双 y 轴会被破坏吗？——**不会崩，但"适配只生效一半"。**（1 张：w01 `chart2`，`:3176`）

- 该图 `yAxis` 是**数组**（左轴「业务量(万亿笔)」、右轴「笔均(元)」），`series[1]` 用 `yAxisIndex:1` 绑定右轴。
- ECharts 对数组型组件**按索引合并**：media 给的是**单个对象** → **只覆盖 `yAxis[0]`，右轴仍保留桌面字号/名称字号**。
- 后果：手机端双轴图左右字号不一致（视觉不统一），**不崩、不丢数据**。
- **真正的坑在以后**：谁要是在 media 里加 `yAxis: { name: '…' }` 或 `min/max`，**会改到第 0 个轴而不是他以为的那个轴**——这种"改错对象"的 bug 极难排查。

#### ③ 雷达图会被破坏吗？——**不会崩，但会被注入原本不存在的组件。**（雷达 2 张：w01 `chart5` `:3351`、w05 `chart5_4` `:4671`）

- 这 2 张 + pie（`:3142`）+ sankey（`:4508`）**共 4 张图原本完全没有 `grid`/`xAxis`/`yAxis`**，media 会替它们**新建一个笛卡尔坐标系**。
- ECharts 对"**已声明但没有任何 series 绑定**"的坐标轴是否绘制轴线/刻度，**我无法从源码断定**（没有浏览器可验证）→ **需上手机实测这 4 张图是否出现多余轴线或刻度文字**。
- 参考：`xAxis.axisLabel.rotate:45` 也会作用在这个新建的轴上，若真渲染出来，观感会很突兀。

### 2.4 🔴 新-1：w03 两张主图的 x 轴标签在手机端会大幅消失

**位置**：`index.html:3750`（w03 `chart1`，LPR 走势主图，72 个类目，全宽大图）与 `:3850`（w03 `chart3`，期限利差图）

**证据（源码提取，两图写法一致）**：这两张图的 `xAxis.axisLabel` **同时**含自定义 `interval` 与依赖**同一白名单**的 `formatter`：

```js
interval:  function(idx){ var keep=[0,4,8,11,24,36,48,60,71]; return keep.indexOf(idx) !== -1; },
formatter: function(v, idx){ var keep=[0,4,8,11,24,36,48,60,71]; return keep.indexOf(idx) !== -1 ? v : ''; }
```

**冲突机制**：media 把 `interval` 覆盖为 `'auto'`，但 `formatter` 的**白名单保留**（media 没有覆盖 formatter）→ 最终显示逻辑变成

> **实际显示的标签 = ECharts 按"是否重叠"自动挑选的索引 ∩ `keep` 白名单**

`keep` 只有 **9 个**索引（0/4/8/11/24/36/48/60/71）。ECharts 的 `'auto'` 在 72 个类目、旋转 45°、容器约 340px 宽的条件下大约每 6~12 个挑一个，**其挑选结果与 `keep` 的交集可能只剩 0~2 个**。

**后果**：手机端这两张图（恰好是 LPR 作品**最核心**的两张）的 x 轴**几乎变成空白轴**。这是"为了适配反而变差"的典型回归——正是 LESSONS 反思第 1 条要避免的那类改动。

**修法（二选一，各 1 行 × 5 处）**：
1. **推荐**：media 里**不要覆盖 `interval`**（删掉 `interval: 'auto'`），保留原自定义函数；
2. 或把 base 的 `formatter` 改成不依赖白名单（`return v;`），让 `interval` 全权决定显示哪些。

**精确行号**：
- **要被删掉的 media 字段**（`interval: 'auto'`）：`:3121` / `:3709` / `:4487` / `:5389` / `:5708`
- **两张图的自定义 interval/formatter**（改完请确认这两处未被碰到）：`:3774`（w03 `chart1`）、`:3866`（w03 `chart3`）

**定级说明**：定 🔴 的依据是"**新引入的行为退化 + 命中核心图 + 与本轮目标相反**"，而非崩溃。逻辑推理很硬（ECharts 的 interval/formatter 语义是确定的），但**最终渲染请上手机确认**。

### 2.5 🟡 新-5：4 张图被注入坐标系、7 张图被注入图例

**原本没有 legend 的 7 张**：w01 `chart3`(`:3236`)、w05 `chart5_1`(`:4508`)、w05 `chart5_4`(`:4671`)、proto2 `chartP4`(`:5444`)、`chartP5`(`:5452`)、w07 `chart7_2`(`:5780`)、`chart7_3`(`:5812`)。

media 会为它们**新建** `legend` 组件：
- 对**笛卡尔图**（chart3 / chartP4 / chartP5 / chart7_2 / chart7_3，series 有 `name`）**几乎必然渲染出新图例**，例如 chart7_2 多出「最低现金余额」、chart7_3 多出「概率分布」；
- 对 **sankey / gauge / radar**（chart5_1 / chart5_4），图例项的来源是 series 或 data 的 `name`，可能为空——**需实测**。

**这与初衷相反**：手机端本来就空间紧张，却给 7 张图各加了一条图例，还挤占 §2.6 里刚调高的图表高度。

### 2.6 ✅ 本轮 P2 已确认做对的

| 项 | 证据 |
|---|---|
| 图表容器高度已按建议调整 | `:624` `.chart-echarts{height:290px !important}`（原 220px）、`:625` `.big-chart{height:360px !important}`（原 320px） |
| 断点判据不再双重 | `isMobile()` 已删除，media 成为唯一判据，不再有"JS 认为手机、ECharts 认为桌面"的错位（`isMobile` 全文件 0 残留） |
| `resize` 监听齐备 | ECharts 的 media 需在 resize 时重新匹配；5 个含图模板的 `window.addEventListener('resize', …)` 均在 |
| media 块 5 处一致 | 去空白后不同版本数 = 1 |

### 2.7 根治方案（1 处改动同时解决 ①②③ 与图例注入）

把 media 从"固定模板"改成"**按需生成**"，只覆盖该图真正拥有的组件：

```js
// 放在各 safeInit 内，替换现有固定 media
var mob = {};
if (option.grid)   mob.grid   = { left: 8, right: 8, top: 56, bottom: 64, containLabel: true };
if (option.legend) mob.legend = { bottom: 0, top: 'auto', itemWidth: 10, itemHeight: 6,
                                  textStyle: { fontSize: 9 }, type: 'scroll' };
if (option.xAxis)  mob.xAxis  = { axisLabel: { fontSize: 9, rotate: 45 } };   // 不再写 interval，保留各图自定义
if (option.yAxis)  mob.yAxis  = Array.isArray(option.yAxis)
    ? option.yAxis.map(function(){ return { axisLabel: { fontSize: 9 }, nameTextStyle: { fontSize: 9 } }; })
    : { axisLabel: { fontSize: 9 }, nameTextStyle: { fontSize: 9 } };

var hasMedia = Object.keys(mob).length > 0;
option = hasMedia ? { baseOption: option, media: [{ query: { maxWidth: 768 }, option: mob }] } : option;
```

这一段的收益：**消除 4 张图的坐标系注入、7 张图的图例注入、双 y 轴漏覆盖，并顺手修掉 🔴（不再覆盖 `interval`）**——且**不需要逐图手改**。

---

## §3 `tools/preflight.py`：5 项检查逐项判定

### 3.1 实测结果（最重要的发现）

我实际运行了它：

```
🔍 检查1：reveal时序        ✅ 通过
🔍 检查2：函数作用域        ✅ 通过
🔍 检查3：CSS类名           ✅ 通过
🔍 检查4：敏感串
  发现疑似API Key（sk-开头）
🔍 检查5：baseOption/media配对  ✅ 通过
❌ 发现 1 个问题，请修复后再提交     [退出码 1]
```

**脚本能跑、检测有效、退出码正确**——但它抓到的那个 Key（`index.html:2123`）**仍在仓库里**。结论只有一个：

> **这个脚本没有被接入任何自动执行点**（无 pre-commit hook、无 CI 步骤）。**P3 的价值 90% 取决于"有没有人跑它"**——现在它是"一件放在抽屉里的好工具"。

**接入建议（二选一，推荐 B）**：
- **A. pre-commit hook**：新建 `.githooks/pre-commit`（内容 `python tools/preflight.py || exit 1`），然后 `git config core.hooksPath .githooks`。
  缺点：`git commit --no-verify` 可绕过。
- **B. CI 步骤（更稳）**：在 `.github/workflows/pages.yml` 的 `Checkout` 之后加一步
  ```yaml
      - name: Preflight check
        run: python tools/preflight.py
  ```
  这样 push 后 CI 会红、**部署不会成功**，比本地 hook 更硬。

### 3.2 逐项判定表

| 检查 | 有效性 | 漏检（False Negative） | 误报（False Positive） |
|---|---|---|---|
| **1 reveal 时序** | ⚠️ 部分有效 | **❌ 严重：模板完全没有 IO 脚本时，整项被跳过** | 模板内有 2 段 IO 脚本时，第二段之后的 reveal 会被误报 |
| **2 函数作用域** | ⚠️ 只防已知 | ❌ 只认 3 个硬编码函数名；不认 `var f = function(){}` 写法；只看模板内不反向检查 | 🟡 未剥离注释，`// 不再调用 isMobile()` 会被误报 |
| **3 CSS 类名** | ⚠️ 只防已知 | ❌ 只认 `sec-title` / `stp` 两个类名，**其他任何无定义类永远查不出** | 🟡 正则 `\.cls[\s:{]` 漏 `,` `>`，写在选择器列表里会误报 |
| **4 敏感串** | ✅ 实测有效 | ❌ 只扫 `index.html`（`demo/*.py`、`demo/*.html` 里的 Key 查不出）；只认 `sk-` 一种格式 | 轻微（占位串 `sk-xxxx…` 会报警，但这正是想要的） |
| **5 baseOption/media 配对** | ❌ **基本空转** | media 与 baseOption 由 `safeInit` **成对生成**，`media>0 且 baseOption==0` 几乎永不成立 | — |

### 3.3 检查 1 的漏检最要紧（它漏掉的正是上一轮真实踩过的坑）

```python
io_match = re.search(r'IntersectionObserver', content)
reveal_matches = list(re.finditer(r'class="[^"]*reveal[^"]*"', content))
if io_match and reveal_matches:        # ← 没有 IO 脚本时，整段直接跳过
```

上一轮的 reveal 问题有两种形态，**这个检查只能抓到其中一种**：

| 形态 | 描述 | 检查 1 能否抓到 |
|---|---|---|
| A | 模板**有** IO 脚本，但 `.reveal` 排在它之后 | ✅ 能（page-06 那次即属此类） |
| B | 模板**完全没有** IO 脚本 | ❌ **`io_match` 为 `None` → `if` 不成立 → 一条都不报** |

而**形态 B 正是第三轮 page-05 / page-proto2 六个区块永久不可见的成因**。**漏检恰好漏在真实发生过的那个形态上。**

**改法（3 行）**：
```python
if reveal_matches and not io_match:
    errors.append(f"  [{name}] 模板内有 {len(reveal_matches)} 个 .reveal 但没有任何 IntersectionObserver -> 全部永久不可见")
    continue
```

**另一个体验问题**：报错里的"行约 N"是**模板内相对行号**，不是文件行号 → 按它去找会找错位置。建议连同模板起始偏移一起输出，或明确标注"模板内第 N 行"。

### 3.4 检查 2 / 3 的本质问题：**只防"已经发生过的那一次"**

- 检查 2 的 `dangerous_funcs = ['isMobile','applyMobileOption','getMobileChartOption']` 是硬编码三名字。而这三个函数**本轮已被删除** → 这个检查**从此永远 ✅**，它防守的是一个**已经不存在的东西**。
- 检查 3 的 `known_issues = ['sec-title','stp']` 同理：这两个类**本轮已补上 CSS** → 这个检查也**永远 ✅**。

**两个检查现在"绿得毫无意义"。** 建议换成通用扫描（我这次就是靠通用扫描发现 `.sec-title`/`.stp`/`applyMobileOption` 三类问题的，硬编码版永远不会发现**下一个**新问题）：

```python
# 通用版思路
GLOBALS = {'window','document','console','Math','JSON','Object','Array','String','Number','Boolean',
           'Date','setTimeout','clearTimeout','setInterval','parseInt','parseFloat','isNaN',
           'IntersectionObserver','fetch','Promise','AbortController','ReadableStream','TextDecoder',
           'echarts','encodeURIComponent','decodeURIComponent','String','RegExp','Error'}
JS_ADDED_CLASSES = {'reveal','in','open','active','show','on','done'}   # 由 JS 动态添加，不算漏定义

# CSS 类：从 <style> 收集 .name（正则放宽到 (?=[\s,{:>+~])），与 HTML 的 class token 求差集
# 函数：先剥离 // 与 /* */ 注释，再按模板收集 function X( 定义 与 X( 调用，去掉 GLOBALS 与定义本身
```

### 3.5 检查 4 的具体补强

```python
PATTERNS = [
    r'sk-[A-Za-z0-9]{20,}',  r'sk-ant-[A-Za-z0-9\-_]{20,}',
    r'ghp_[A-Za-z0-9]{20,}', r'github_pat_[A-Za-z0-9_]{20,}',
    r'AIza[0-9A-Za-z\-_]{30,}', r'AKIA[0-9A-Z]{16}',
    r'xox[baprs]-[A-Za-z0-9\-]{10,}', r'-----BEGIN [A-Z ]*PRIVATE KEY-----',
]
# 扫描范围从 index.html 扩到仓库：**/*.{html,js,py,sql,md}
# 排除：echarts.min.js、versions/、.git/、node_modules/
```

理由：现在只扫 `index.html`，而**本轮新增的 3 个 `.py` + 1 个 `.sql`（以及 `tools/preflight.py` 自身）完全没有被扫描**。

### 3.6 检查 5 的重做 + 新增一项（直接防本轮 🔴）

现在：文件级"出现次数比较"→ 恒等 → 永远通过。建议改成**逐图判定**：
1. 某个 option 顶层出现 `media` 但**同一对象内没有 `baseOption`** → 报错；
2. media 的 `query.maxWidth` 与 CSS 手机端断点不一致 → 警告（**当前就存在：media = 768，CSS 主力块 = `max-width:767px`**，见 §5 P2-14）；
3. **新增检查 6**：若某图 base 的 `xAxis.axisLabel.interval` 是**函数**，而 media 又覆盖了 `interval` → 报错「自定义 interval 会被覆盖，导致 x 轴标签消失」（**直接防住本轮 🔴 新-1**）。

---

## §4 新增 bug 排查（按 REVIEW_CHECKLIST 七类逐项）

### 4.1 七类逐项结论

| 类别 | 结论 | 关键发现 |
|---|---|---|
| 一、业务逻辑 | ⚠️ 有 1 项 | `portfolioPersona()` 的防御分支**返回类型错误**（🟡 新-3） |
| 二、数据真实性 | ✅ **本轮零改动** | `index.html` 的 diff **全部是 CSS/JS/safeInit**，没有任何数据行或文案行被改；`lpr_monte_carlo.py` 翻译**逻辑零变化** → CSV 与页面内嵌分位数仍然一致（第二轮已逐值核过 6 序列 × 60 月 = 360 个数值） |
| 三、文案风格 | ✅ 明显改善 | **`闭环` 从 11 处 → 0 处**；`赋能`/`抓手`/`全链路` 均 0；`落地` 剩 **4** 处（第一部作品页 2 处 + SOX 2 处） |
| 四、作品集定位 | ✅ | 无变化、无夸大、无"落地到公司业务"式表述 |
| 五、技术质量 | ❌ **见 §2 与下方清单** | P2 引入 1 个 🔴 + 3 类 🟡；5 份 `safeInit` 已漂移成 3 个版本；`requirements.txt` 缺依赖 |
| 六、一致性 | ⚠️ | 版本号 v5.3 vs v5.3.3 不一致；CHANGELOG 与代码自相矛盾（见 §6）；`.gitignore` 未覆盖新报告名 |
| 七、岗位匹配度 | ✅ | 无变化；精算/资金/审计/AI 四线仍完整 |

### 4.2 新增问题清单

#### 🔴 新-1：w03 两张主图 x 轴标签在手机端大幅消失
详见 **§2.4**（`:3750`、`:3850`；修法：删掉 media 里的 `interval:'auto'`，精确行号 `:3121/:3709/:4487/:5389/:5708`）。

#### 🟡 新-2：5 份 `safeInit` 已漂移成 **3 个不同版本**（media 块一致，差异在 catch 分支）

| 版本 | 出现于 | catch 行为 |
|---|---|---|
| A | `:3107`(page-01)、`:4473`(page-05) | 显示「图表加载失败，请刷新重试」（`#999`） |
| B | `:3695`(page-03)、`:5694`(page-07，`safeInit7`) | 显示「错误: 」+ `e.message`（`#f87171`，**最有排障价值**） |
| C | `:5375`(proto2) | **只 `console.error`，不给用户任何提示** |

- 后果：同一功能 5 份副本、3 种行为；**proto2 出图失败时用户看到的是空白区域**，失败原因只有开控制台才知道。
- 这正是第三轮我提的"同一逻辑在 5 个模板各写一遍，改一处要改 5 处"的结构病，**现在已经开始漂移了**。
- **建议**：把 `safeInit` 抽成**一份**，放进 `showWork` 注入的公共脚本块（照 `:5880-5881` 注入 `ai-engine` 的写法，注意 `</script>` 转义），5 个模板共用；catch 统一用版本 B。

#### 🟡 新-3：`portfolioPersona()` 的防御分支**返回了错误的类型**

`index.html:2170-2174`：
```js
portfolioPersona: function() {
  var kb = this.portfolioKB;
  if(!kb){ return {works:[],prototypes:[],structure:[]}; }   // ← 函数契约是返回字符串
  return '你是"作品集助手"——…';
}
```
- 调用方是主页面助手：`persona = window.SmartReconAI.portfolioPersona() + '\n\n【你的长期记忆】' + …`
- 对象 + 字符串 → **`"[object Object]\n\n【你的长期记忆】…"` 被当成系统提示词发给模型**。
- **触发条件**：`#portfolioKB-data` 的 JSON 解析失败时（`portfolioKB` 变 `null`）。此时**不会崩**，但助手会带着一段垃圾人设回答，且没有任何报错——比"直接报错"更难排查。
- **修法**：`if(!kb){ return '你是作品集助手。'; }`（返回**字符串**）。
- **对照**：同一轮加的另一个守卫**写对了**——`kbSearch` 的 `:2220` `if(!this.portfolioKB){ return []; }` ✓ 返回数组，类型正确。

#### 🟡 新-4：R4（`showWork` 被调用两次）**的修复实际无效**——但被 `_pendingWork` 兜住了

- `CHANGELOG.md` v5.3.3 写：「AI助手重复调用…已加 `e.stopPropagation()`」。
- **实际代码**：`index.html:2689` 的 `e.stopPropagation()` 位于 AI 助手 `#assistantBody` 的 click 监听里（**默认 = 冒泡阶段**）；而全局委托在 `:5943-5949` 注册为 `document.addEventListener('click', fn, **true**)`（**捕获阶段**）。
- **事件执行顺序（逐步）**：
  1. 点击「查看《…》→」按钮（`data-work`，`:2914` 生成）
  2. **捕获阶段**：`window → document` → **全局委托先触发** → `findWork()` 命中 `data-work` → **`showWork()` 第 1 次**
  3. 继续捕获到 target（按钮）
  4. **冒泡阶段**：`button → #assistantBody` → 助手的监听触发 → **`showWork()` 第 2 次** → 然后才执行 `e.stopPropagation()`
  5. `stopPropagation()` 只能阻止**之后**的向上冒泡，**无法回头取消第 2 步已经跑完的捕获监听**
- **结论：仍然是两次调用。**
- **严重度不高的原因**：`_pendingWork` 已生效（`:5852` 声明 / `:5856` showWork 内清 / `:5888-5890` 设置 / `:5898` showHome 内清），第二次调用只是 `clearTimeout` 后用**同一份 html** 重设一次，用户看不出问题。**该竞态守卫实现完全正确 ✅**
- **但这是一次"以为修了其实没修"**——与 LESSONS 反思第 5 条（改完要验证）属同一类问题。
- **真正有效的两种改法**：
  1. **推荐**：删掉助手里的这段 jump-btn 监听，把 `panel.classList.remove('open')` 挪进全局委托（它已经拿到了 `id`）→ **一个动作只留一条处理链**；
  2. 或在全局捕获监听里判断 `e.target.closest('#assistantBody')`，命中则跳过，交给助手处理。
- **附带副作用提醒**：`stopPropagation()` 虽然没拦住捕获监听，但会**拦住该点击继续冒泡**，可能影响 `document` 上其他**冒泡**监听（例如手机端菜单的"点外部关闭"）。属边缘场景，但说明"随手加 stopPropagation"是有副作用的做法。

#### 🟡 新-5：4 张非笛卡尔图被注入坐标系、7 张图被注入图例
详见 **§2.5**。

#### 🟡 新-6：`demo/requirements.txt` 仍未补齐依赖（第二轮已提，跨轮遗留）

实测各脚本 `import`：

| 脚本 | 依赖 | requirements 是否覆盖 |
|---|---|---|
| `lpr_monte_carlo.py` | numpy, matplotlib | ✅ |
| `cashflow_pressure_test.py` | numpy, pandas, **scipy** | ❌ 缺 pandas/scipy |
| `supply_chain_analysis.py` | **pandas**, numpy | ❌ 缺 pandas |
| `sox_sampling.py` | 纯标准库 | ✅ |

而 `demo/requirements.txt` 仍只有：
```
numpy>=1.24
matplotlib>=3.7
```
注释还写着「LPR 蒙特卡洛 Demo 依赖」。→ **别人 clone 后按文档 `pip install -r`，4 个脚本里有 2 个跑不起来**，与"脚本可复现"的宣称不符。

#### 🟡 新-7：版本号不一致

| 位置 | 值 |
|---|---|
| `CHANGELOG.md:3` | **v5.3.3**（2026-09-11） |
| `index.html:1930` 页脚 | **v5.3** |
| `index.html:1700` 迭代历程 | **v5.3** 标为「当前版本」 |
| `index.html:4466` w05 页脚 | **AI Portfolio v1.0**（第二轮已提，第三轮仍未修） |

按 D004（小修改不升版本号）本可不升，但既然 CHANGELOG 升了 v5.3.3，站点上的版本号就应同步，否则访客看到的版本与 CHANGELOG 对不上。

### 4.3 🟢 小项

1. **`min-width:640px` 与 `.wrap .sec{overflow-x:auto}` 已加** ✓（第三轮 R9 主项完成），但**「← 左右滑动 →」提示仍未加**（全文件 0 处）——手机上用户未必知道表格可横向滑动。
2. `落地` 仍有 4 处（`赋能`/`抓手`/`全链路`/`闭环` 均已清零）。
3. **本轮没有引入新的重复 id** ✓。全文件仅 `chart1/chart2/chart3` 跨模板重名——它们分别注入**独立 iframe 文档**，**不构成冲突**；另有 `'+thinkId+'` 是模板字符串片段，非真实 id。
4. **`.gitignore` 只忽略 `REVIEW_REPORT.md`**：本文件 `REVIEW_REPORT_v4.md` **不在忽略列表**，`git status` 显示为 `??`，**请勿误提交**；若要长期保留，建议把 `.gitignore:20` 改为 `REVIEW_REPORT*.md`。
5. `demo/__pycache__/` 存在但已被 `.gitignore` 的 `__pycache__/` 覆盖 ✓，不会误提交。

---

## §5 `demo/lpr_monte_carlo.py` 英文翻译审查

### 5.1 ✅ 先确认最重要的：**逻辑零变化**

用「剥离注释后逐行比对」核过：

| 项 | 值 |
|---|---|
| 改前（`c7f4418`）非注释代码行 | **141** |
| 改后（`656bb8e`）非注释代码行 | **141** |
| 差异行 | **38**，全部是 docstring 与 `print()` 文案 |
| 未变化的 | `np.random.seed(42)`、`lpr_hist`、`sigma/theta/kappa/r0`、`theta5/kappa5/sigma5`、`N=5000`、OU 迭代式、分位数计算、CSV 写出格式 |

→ **推论（重要）**：脚本输出不变 → `demo/lpr_mc_quantiles.csv` 不变 → `index.html` 内嵌的 6 个分位数数组**仍然有效**（第二轮已与 CSV **逐值核对 360 个数值全等**）。**翻译没有破坏站点数据一致性** ✓。

### 5.2 术语与表达问题（10 条）

| # | 位置 | 级别 | 问题 | 建议改法 |
|---|---|---|---|---|
| 1 | `:5-6` | **🟡 专业性** | **"CIR / Vasicek family" 与所写公式不符**：给出的 `r_{t+1}=r_t+κ(θ−r_t)Δt+σ√Δt·ε` 是 **Vasicek（Ornstein–Uhlenbeck）** 的欧拉离散；**CIR 的特征是平方根扩散** `σ√r_t dW`，属于另一支模型。并列成 "family" 而只写 Vasicek 式子，对固收/量化背景的读者不严谨 | `Inspired by the Vasicek (Ornstein–Uhlenbeck) mean-reverting short-rate model. (The CIR family differs by its square-root diffusion term, sigma*sqrt(r_t).)` |
| 2 | `:6` | 🟢 | **`epsilon` 与 `dt` 未定义**：未说明 `ε ~ N(0,1)` i.i.d.、`dt = 1/12` | 公式下补 `where epsilon ~ N(0,1) i.i.d., dt = 1/12 (monthly step)` |
| 3 | `:54` | **🟡 专业性** | **`# annualized volatility approximation (%)` 口径不准**：`sigma = np.std(np.diff(lpr_hist))` 是**每次调整幅度**的离散度（非等间隔、约 11 个样本），与 `sqrt(dt)` 搭配使用就**不能叫 annualized**。docstring（`:14`）已诚实注明"approximate / non-uniform"，但**代码注释与它口径冲突** | `# dispersion of per-adjustment changes (proxy only; NOT annualized)` |
| 4 | `:8` | 🟡 | **"based on Japan/Korea low-rate trajectory + domestic institution 2026 consensus extrapolation" 无出处**：同一份代码 `:13` 与站点都强调「θ/κ 为演示设定、非市场校准」，而"国内机构 2026 共识"是一个**听起来可溯源但没给来源**的表述，与"诚实披露"定位有张力 | 改为 `theta = 2.7% — demo setting only, not calibrated to any market survey`，或补上具体机构与报告名 |
| 5 | `:76` | 🟡 | **引用了 `DECISIONS.md` 里不存在的记录**：`(Architect 2026-08-15 ruling, decision record)` —— `DECISIONS.md` 现有 **D001–D010，最早日期 2026-09-10**，**没有任何 2026-08-15 的裁决**；且 "Architect" 是内部角色称呼，公开仓库读者无从理解 | 删掉括号引用，或改为指向存在的 D 编号（如 D010） |
| 6 | `:19` | 🟢 | `Output: … + terminal probability distribution` —— 概率分布只**打印到终端**，不是产物文件，与两个 PNG/CSV 并列易误读；"terminal" 也可能被读成"终端"而非"第 5 年末" | `Output files: lpr_mc_paths.png, lpr_mc_quantiles.csv. Also prints the 5-year horizon probability distribution to stdout.` |
| 7 | `:18` | 🟢 | `Usage: python lpr_monte_carlo.py` —— 从仓库根目录运行应为 `python demo/lpr_monte_carlo.py` | 补一行 `(from repo root: python demo/lpr_monte_carlo.py)` |
| 8 | `:39-41` | 🟢 | **注释已成误导**：`# Chinese font (Windows: Microsoft YaHei / SimHei)` —— 输出已全英文，这行配置与注释属历史遗留（保留无害） | 删除该行，或注明 `# keep CJK-capable fallback (harmless; output is ASCII)` |
| 9 | `:25-26` | 🟢 | 英文化后仍保留 "GBK console compatibility…avoid crash printing non-GBK chars like emoji" 的说明——**现在输出已无 emoji/中文**，描述已过时 | 保留代码、简化注释 |
| 10 | commit `656bb8e` | 🟢 | 提交信息写「**避免手机端中文乱码**」，但这是 **Python 脚本**、不是移动端渲染；真正的风险是 **Windows GBK 控制台**（脚本自己的注释也是这么写的） | 提交信息口径改为"避免 Windows GBK 控制台乱码"（不影响代码） |

### 5.3 总体评价

**翻译本身合格**：主体术语（mean-reversion、quantile、narrative assumption、not market-calibrated、confidence band、terminal value）用法准确，**诚实话术完整保留**，无中式英语硬伤，无因翻译导致的语义漂移。
上面 10 条里**只有 #1、#3 属专业性**，#5 属引用准确性，其余是表达精确度与遗留清理，**不影响结论正确性**。若要动手，**建议只改 #1 / #3 / #5**。

---

## §6 文档同步（CHANGELOG / README / DECISIONS）

### 6.1 ✅ 已同步的 4 项

1. `CHANGELOG.md` 新增 **v5.3.3（2026-09-11）**，6 条修复写得具体、可追溯 ✓
2. `CHANGELOG.md` 新增 **「已知问题」** 小节，把 API Key 记为已知风险 ✓（**这是很好的实践**，值得保留）
3. `README.md` 复核指引加入 **`LESSONS_2026-09-11.md`**（并重排 1→7）✓ ← 第三轮 P0-5 已落实
4. `DECISIONS.md` D008 补上 **「回退=功能性禁用，手机端适配的代码仍在 git 历史中」** ✓ ← 第三轮 P0-5 已落实

### 6.2 ❌ 未同步的 7 项（按重要性排序）

#### ① 🔴 CHANGELOG 与代码自相矛盾（会直接误导下一位复核AI）

`CHANGELOG.md` v5.3.3 的「已知问题」写：
> 「手机端图表适配暂时禁用，**待使用 ECharts 原生 media query 重做**」

**但同一个 commit 已经实现了它**（5 处 `safeInit` 自动注入 `baseOption`+`media`，21 张图全部生效），而且「### 修复」列表里**完全没有提到 P2 与 P3 两项工作**。

→ **后果**：下一位复核AI 读到这里会以为手机端适配还没做，**从而根本排查不到 §2 的全部问题**（1 个 🔴 + 3 类 🟡）。
→ **修法**：v5.3.3 的「修复」补两条（P2 手机端 media 适配、P3 preflight 工具），并把「已知问题」那句改为：
> 「手机端 media 适配已上线；**待实测确认**：4 张非笛卡尔图是否被注入多余坐标系、双 y 轴是否只覆盖首个轴、w03 两图 x 轴标签是否消失」

#### ② 🟡 `tools/preflight.py` 在两份文档里都不存在

`README.md` 的目录结构区块（第 44-56 行一带）与正文**都没有 `tools/`**；`CHANGELOG.md` 也未提。
→ 结果是「写了工具但没人知道它存在」，与 §3.1 的结论互相印证。
→ **修法**：README 目录树补 `├── tools/preflight.py  # 提交前自动化体检`，CHANGELOG 的 v5.3.3 补一条。

#### ③ 🟡 API Key 的「暂不处理」决定没有进 `DECISIONS.md`

`DECISIONS.md` 的格式说明写着「有新的争议时，按格式添加到决策列表」。而「**用户确认暂不处理 API Key**」是一个典型的、需要留痕的**风险接受决策**，现在只写在 CHANGELOG 的「已知问题」里。
→ **建议补 D011：API Key 明文的风险接受**，格式建议含：日期 / 争议点 / 各方观点 / 最终决定 / 理由 / **复审条件**（例如"面试演示前处理"或"出现异常计费时立即作废"）。

#### ④ 🟡 media 适配方案本身没有决策记录

`safeInit` 自动注入 media 是一个**架构选择**（"一处自动包、全图生效" vs "逐图手写 media"）。D010 只说「未来用 ECharts 原生 media query」，**没说"用 `safeInit` 统一注入"**。而 §2 发现的 ①②③ 三类问题**全部源自这个"通用包"的取舍**。
→ **建议补 D012：media 适配采用 `safeInit` 统一注入**，并写明"非笛卡尔图与多轴图的例外处理"（即 §2.7 的按需生成）。

#### ⑤ 🟡 `LESSONS_2026-09-11.md` 问题五的行数与仓库实际不符（差近 10 倍）

LESSONS 问题五声称修复后：
> 「HTML: 5730行 / **Python: 5488行** / SQL: 152行」

实测分层统计：

| 范围 | .py 文件数 | 行数 |
|---|---|---|
| 根目录 + `demo/` + `tools/`（**当前代码**） | 5 | **594** |
| `versions/`（**归档副本**） | 28 | 5048 |
| 合计 | 33 | 5642 |

→ **那个「5488 行」几乎全部来自 `versions/` 里的归档副本**。而本轮 `.gitattributes` 恰恰把 `versions/*` 标成了 `linguist-vendored`（即**排除**）——所以修复后 GitHub 语言条上的 Python 只有约 **594 行**，而 `index.html` 是 **6060 行 / 651 KB**。

**这意味着两件事**：
1. LESSONS 里"修复后 Python: 5488 行"这个**结果数字是错的**，会让下一个人以为 Python 已占近半壁江山（实际约 9%）。**建议订正。**
2. **"调整语言比例"这个优化目标，靠现有代码量无法达成**：HTML ≈6060 行 vs Python ≈594 行 vs SQL 152 行 → HTML 仍会占约 **89%**。方向上的改善是真实的（HTML 从 96.8% → ~89%，Python 从 1.3% → ~9%），但**不要期待 Python 变成第一大语言**。
3. **顺带一个架构约束（重要，别踩）**：**不能把内联 CSS/JS 抽成独立文件来压 HTML 占比**——`showWork` 依赖 `appStyle.textContent` / `pageStyle.textContent`（`:5871-5876`）把样式注入 iframe，抽出去会**直接破坏 iframe 注入机制**。若真的想改变语言比例，正确方向是**继续新增真实代码**（Python/SQL），而不是重构 HTML。

#### ⑥ 🟡 版本号未同步
见 §4.2 🟡 新-7。

#### ⑦ 🟡 `demo/requirements.txt` 未同步
见 §4.2 🟡 新-6（它虽不是"文档"，但属对外交付说明）。

---

## §7 改进建议（按优先级）

### 7.1 P0 — 必须马上修（合计不到 20 行改动，30 分钟内可完成）

| # | 事项 | 精确位置 | 成本 |
|---|---|---|---|
| 1 | **修 w03 两图 x 轴标签消失**：删掉 media 里的 `interval:'auto'`（保留各图自定义 interval） | `:3121` / `:3709` / `:4487` / `:5389` / `:5708` | 5 行删除 |
| 2 | **`portfolioPersona()` 防御分支改回字符串** | `:2172` | 1 行 |
| 3 | **把 preflight 接入流程**（推荐 CI 步骤） | `.github/workflows/pages.yml` Checkout 之后，或新建 `.githooks/pre-commit` | 2–5 行 |
| 4 | **修 CHANGELOG 与代码的矛盾**（补 P2/P3 两条 + 改写「已知问题」） | `CHANGELOG.md` v5.3.3 区块 | 3 行 |
| 5 | **`requirements.txt` 补依赖**：加 `pandas>=2.0`、`scipy>=1.10`，注释改为「全部 Demo 依赖」 | `demo/requirements.txt` | 2 行 |

> **关于 API Key（`index.html:2123`）**：CHANGELOG 已注明「用户确认暂不处理」，**我按作者决策处理，不再列为待修项**。仅补充两点供你自行决定：
> ① 最省事的兜底是**面试演示前把 `apiKey` 置空**——页面本就有「自定义 Key」入口（`sessionStorage`），1 行、随时可改回；
> ② 想确认这个风险是否仍然"活跃"，可先跑一次**免费**的 `GET https://api.deepseek.com/v1/models`（该接口不消耗 token）——**401 = 已失效，200 = 仍在生效**。**我没有代你调用**（涉及使用你的凭证），请自行或让豆包执行。

### 7.2 P1 — 本周内

6. **把 media 改成"按需生成"**（§2.7 的代码）→ **一处改动同时消掉**：4 张图坐标被注入、7 张图图例被注入、双 y 轴只覆盖第 0 轴，并顺手修掉 🔴。**本轮性价比最高的一项。**
7. **`safeInit` 收敛成一份**（放进 `showWork` 注入的公共脚本块），消掉 5 副本 / 3 版本的漂移；catch 统一用版本 B（显示 `e.message`）。
8. **preflight 四项改进**：检查 1 补"无 IO 脚本"分支；检查 2/3 换通用扫描；检查 4 扩正则 + 扩扫描范围；检查 5 改逐图并**新增"media 覆盖自定义 interval"检查**。
9. **修 R4 的正确做法**：删掉助手的 jump-btn 监听、把 `panel.classList.remove('open')` 并入全局委托。
10. **版本号同步**：`:1930` 页脚与 `:1700` 迭代历程升到 v5.3.3；顺手修 `:4466` 的 `AI Portfolio v1.0`。
11. **表格横滑提示**：给 `.wrap .sec table` 上方加「← 左右滑动 →」提示（R9 收尾项）。

### 7.3 P2 — 手机端适配的收尾与验收

12. **顺序（照 LESSONS 反思第 5 条"每次只改一个问题"）**：先做 §2.7 的按需生成 → 再分批上手机：
    - 第 1 批：**w03（3 张，含 2 张本轮出问题的图）** → commit → 手机验证
    - 第 2 批：**w01（5 张，含唯一双 y 轴图 + 2 张非笛卡尔图）**
    - 第 3 批：**w05（4 张，含 sankey 与 gauge+radar）**
    - 第 4 批：**w07（3 张）+ proto2（6 张）**
13. **每批必查 6 点（本轮新增 2 点）**：
    ① 图是否出现 ② 图例是否遮挡 ③ **x 轴标签是否还在（w03 重点）** ④ **是否凭空多出图例/轴线（4 张非笛卡尔图重点）** ⑤ **双 y 轴右侧字号是否也变小（w01 chart2 重点）** ⑥ 高度是否够看。
    出现 `Chart init failed` 立即 `git checkout` 该页并停止下一项。
14. **断点统一**：media 用 `maxWidth:768`，而 CSS 手机主力块仍是 `max-width:767px`（**`:567`**）→ **768px 设备（iPad 竖屏）会落进"ECharts 认为手机、CSS 认为桌面"的错位**。建议把 CSS 的 767 统一为 768（或 media 改 767），并合并 **`:435`/`:450`/`:515`** 与 **`:567`** 两套手机规则（第三轮 R8）。
    全文件 @media 断点分布（本轮实测）：`:435`(860) `:450`(640) `:515`(480) **`:567`(767，第二套，大量 !important)** `:1317`(860) `:1326`(600) `:1329`(640) `:1457`(1100) `:1458`(640) `:1757`(768) `:2002`(600) —— **共 11 处、7 种阈值**。

### 7.4 P3 — 可以慢慢做

15. **剩余文档同步**：README 目录树补 `tools/`；DECISIONS 补 **D011**（API Key 风险接受）与 **D012**（media 采用 safeInit 统一注入）；订正 `LESSONS` 问题五的 Python 行数。
16. **`lpr_monte_carlo.py` 只改 #1/#3/#5**（§5.2），其余不动。
17. **`sox_sampling.py` 的默认值提示**：现在默认参数（预计偏差 1%）输出 **95**，而站点/在线计算器宣称的是 **59 笔**（对应预计偏差 0%，此时脚本输出 **60**）。**两个数都对**（95 与 AICPA 表 1% 预计的 ~93 接近；60 与站点 59 属表版本差异），但**默认值不同**，面试官"跑脚本看到 95、看站点看到 59"会困惑 → 建议在输出里同时打印一行：「若预计偏差为 0，样本量 = 60 笔（与站点 59 笔同为 AICPA 表口径）」。
18. **仓库体积（第一轮 🟡-16，仍未处理）**：工作区 **300.3 MB**，其中 `versions/` **209.5 MB（708 文件）**、`.git` **88.9 MB**；而 `.github/workflows/pages.yml:31` 仍是 `path: '.'` → **整仓约 300MB 被当作 Pages 产物上传**。建议：`.gitignore` 加 `versions/**/qa_shots/`（QA 截图是过程产物），或把归档移出仓库。

---

## §8 需要作者拍板（判断性问题，我不替作者决定）

| # | 议题 | 我的建议（仅供参考） |
|---|---|---|
| 1 | **API Key 是否继续保留** | 你在 CHANGELOG 已决定"暂不处理"，我尊重该决定。仅提示：面试演示前置空 `:2123` 是 1 行成本；若担心被刷额度，可用免费接口确认它是否仍生效（§7.1 注②） |
| 2 | **是否接受"按需生成 media"带来的代码复杂度** | 建议接受——它换来的是 3 类问题的永久消除；§2.7 已给可直接粘贴的实现 |
| 3 | **是否把 `safeInit` 抽成公共注入** | 建议做，但可放在 P2 之后；若怕动到大结构，至少先把 3 个版本统一为 1 个（纯复制粘贴） |
| 4 | **是否继续追"GitHub 语言比例"** | 建议**降低这个目标优先级**。理由：真实代码量决定了 HTML 仍占 ~89%；而抽离内联 CSS/JS 会破坏 iframe 注入机制（§6.2 ⑤）。**用真实作品说话，比调语言条更有价值** |
| 5 | **`lpr_monte_carlo.py` 的 D 编号引用**（`:76` `Architect 2026-08-15 ruling`） | 建议删掉该括号（公开仓库里引用一个内部且不存在的裁决记录，读者无法核实） |
| 6 | **表格横滑提示的呈现方式** | 建议纯文字「← 左右滑动 →」，避免增加图标资源 |

---

## §9 本轮未覆盖 / 不在此范围的说明（诚实边界）

1. **渲染效果**：全部视觉结论（坐标轴是否真渲染、图例是否真遮挡、标签交集是否真的只剩 0~2 个）**我无法验证**，已逐条标注「需上手机实测」。
2. **未运行的两个脚本**：`lpr_monte_carlo.py`（缺 matplotlib）、`cashflow_pressure_test.py`（缺 scipy）——只做静态审查与依赖核查。
3. **未核验的数据**：第一~三轮台账里标 ⬜ 的 6 组（易观 2026Q1 份额、IDC −42%、金鼎奖 83%/6 个月、吉利/光大/浙商数据、微信渗透率、社融存量绝对值）**本轮未重新核**，状态不变——详见 `REVIEW_REPORT.md` 第十节。
4. **未审查**：`demo/audit_queries.sql`（本轮未变动，第三轮已审：方言声明不实、第 4 条标题与实现不符）、`versions/` 归档内容、`echarts.min.js` 第三方库内部。
5. **未做**：GitHub Issue / PR（无写凭证）；`git push`（按项目约定由主力AI 统一执行）。

---

## §10 四轮遗留问题总账（供豆包一次清账）

### 10.1 本轮（第四轮）新增

| 级别 | 问题 | 位置 | 状态 |
|---|---|---|---|
| 🔴 | media 覆盖自定义 `interval` → w03 两图 x 轴标签消失 | `:3121/:3709/:4487/:5389/:5708` | 待修（P0-1） |
| 🟡 | 5 份 `safeInit` 漂移成 3 版本（proto2 无错误提示） | `:3107/:3695/:4473/:5375/:5694` | 待修（P1-7） |
| 🟡 | `portfolioPersona` 防御返回类型错误 | `:2172` | 待修（P0-2） |
| 🟡 | R4 的 `stopPropagation` 修复实际无效（被 `_pendingWork` 兜住） | `:2689` vs `:5943-5949` | 待修（P1-9） |
| 🟡 | 4 张图被注入坐标系 / 7 张图被注入图例 | §2.5 | 待修（P1-6） |
| 🟡 | `requirements.txt` 缺 pandas/scipy | `demo/requirements.txt` | 待修（P0-5） |
| 🟡 | 版本号 v5.3 vs v5.3.3 | `:1930`/`:1700` | 待修（P1-10） |
| 🟡 | CHANGELOG 声称"手机端适配待重做"但代码已实现 | `CHANGELOG.md` v5.3.3 | 待修（P0-4） |
| 🟡 | `LESSONS` 问题五 Python 行数错误（5488 实为归档副本） | `LESSONS_2026-09-11.md` | 待订正（P3-15） |
| 🟡 | `tools/` 未进 README 目录树、未进 CHANGELOG | `README.md`/`CHANGELOG.md` | 待补（P3-15） |
| 🟡 | API Key 风险接受未进 DECISIONS、media 方案未进 DECISIONS | `DECISIONS.md` | 待补 D011/D012（P3-15） |
| 🟢 | 表格缺"左右滑动"提示 | `.wrap .sec table` 上方 | 可选（P1-11） |
| 🟢 | `落地` 剩 4 处 | — | 可选 |
| 🟢 | `lpr_monte_carlo.py` 10 条术语/表达 | §5.2 | 建议只改 #1/#3/#5 |
| 🟢 | `sox_sampling.py` 默认值 95 vs 站点 59 需加说明 | `demo/sox_sampling.py` | 可选（P3-17） |
| 🟢 | `.gitignore` 未覆盖 `REVIEW_REPORT_v4.md` | `.gitignore:20` | 建议改 `REVIEW_REPORT*.md` |
| 🟢 | 仓库 300MB / Pages 整仓上传 | `pages.yml:31` | 可选（P3-18） |

### 10.2 前三轮遗留（逐条对照，含已修项）

| 来源 | 问题 | 现状 |
|---|---|---|
| 第一轮 🔴-1 | API Key 明文（`:2123`） | ⚠️ **作者决定暂不处理**（CHANGELOG 已记录）→ 建议补 D011 |
| 第一轮 🟡-16 | 仓库体积 / Pages 整仓上传 | ❌ 未处理（本轮实测 300.3MB） |
| 第二轮 🟡 | `requirements.txt` 缺 scipy/pandas | ❌ 仍未修（= 本轮 🟡 新-6） |
| 第二轮 🟡-18 | 5 项数据标「✓可溯源」却无链接 | ❌ 未处理（数据本身已核，但链接仍缺） |
| 第三轮 🔴 R1 | page-06 reveal 时序（SOX 模块不可见） | ✅ 已修（IO 移到 `:4976`；本轮 6 模板全绿） |
| 第三轮 🔴 R2 | 手机端函数地雷（`isMobile` 等只在 page-01） | ✅ 已删（3 函数 + 5 处注释调用，全文件 0 残留） |
| 第三轮 🟡 R3 | `srcdoc` + 50ms 竞态无取消机制 | ✅ 已修（`_pendingWork`，**实现正确**） |
| 第三轮 🟡 R4 | `showWork` 被两套监听重复调用 | ❌ **修复无效**（= 本轮 🟡 新-4），被 `_pendingWork` 兜住 |
| 第三轮 🟡 R5 | iframe 内 `portfolioKB` 为 null 无防御 | ⚠️ 加了防御但 `portfolioPersona` **返回类型错**（= 本轮 🟡 新-3） |
| 第三轮 🟡 R6 | iframe 内存泄漏 | ✅ 未发现泄漏（第三轮结论），本轮无变化 |
| 第三轮 🟡 R7/R8 | 断点不统一 / 两套手机端 CSS 并存 | ❌ 未处理（= 本轮 P2-14） |
| 第三轮 🟡 R9 | 手机端表格拥挤 | ⚠️ 主项已修（`min-width:640` + `overflow-x:auto`），**缺横滑提示** |
| 第三轮 🟡 R10 | 文档与代码/仓库状态不同步 | ⚠️ 部分修（README 加 LESSONS、D008 补注），**CHANGELOG 反而新增矛盾** |
| 第三轮 P0-5 | CHANGELOG/README/DECISIONS 同步 | ⚠️ 部分完成（§6） |
| 第三轮 P2-3 | `<body onload>` 换 `iframe.addEventListener('load')` | ⚠️ 未采纳（仍用 `onload`，`:5881`）——**可接受，非缺陷** |
| 第三轮 🟢 | `.sec-title` / `.stp` 无 CSS 定义 | ✅ 已修（`:288` / `:893`） |
| 第三轮 🟢 | `4Agent` 残留 | ✅ 0 处（`1人+3AI` 6 处） |
| 第三轮 🟢 | w05 页脚 `AI Portfolio v1.0` | ❌ 仍在（`:4466`） |
| 第三轮 🟢 | 缺陷数「共10项」vs defectLog 15 项 | ❌ 仍在（`:2143`） |
| 第一轮 🟡-11 | `闭环` 等 AI 高频词 | ✅ 已清零（`落地` 剩 4 处） |

---

## §11 总体结论

**一句话**：v5.3.3 把第三轮提的 P0/P1 修得很扎实（**R1/R2/R3/R5/R9、`.sec-title`/`.stp`、图表高度、`闭环` 清零全部落实；`sox_sampling` 的 FPC 修法与 `_pendingWork` 竞态守卫写得完全正确**），**但 P2（手机端 media 适配）用"一个通解套所有图"，对 21 张图不做区分，引入了 1 个 🔴 + 3 类 🟡**；而 P3（preflight）**写对了却没人跑**——它自己抓到的 API Key 依然漏过。

**诊断（延续第三轮的判断）**：
> 第三轮的病是「**修一个错引出另一个错**」；这一轮换了形态——「**用一个通解套所有特殊情况**」。`safeInit` 统一包 media 对 17 张笛卡尔图是对的，但对 **2 张自定义 interval 图、1 张双轴图、4 张非笛卡尔图、7 张无图例图**各自产生了不同副作用。
> 而 `preflight.py` 恰好证明团队**已经具备"把教训固化成自动检查"的能力**——**只差最后一步：让它真的跑起来**。

**本轮优先做 §7.1 的 5 件事（合计不到 20 行）**，其中 **P0-1（w03 的 `interval`）** 与 **P0-3（把 preflight 接进流程）** 投入产出比最高。

---

## 附A：可直接粘贴的补丁清单

### A1. 修 🔴（5 处，每处删一个字段）

```diff
-        xAxis:  { axisLabel: { fontSize: 9, rotate: 45, interval: 'auto' } },
+        xAxis:  { axisLabel: { fontSize: 9, rotate: 45 } },
```
位置：`:3121`、`:3709`、`:4487`、`:5389`、`:5708`

### A2. 修 `portfolioPersona` 返回类型（1 行）

```diff
-    if(!kb){ return {works:[],prototypes:[],structure:[]}; }
+    if(!kb){ return '你是作品集助手。'; }
```
位置：`:2172`

### A3. `tools/preflight.py` 检查 1 补漏检（3 行）

```diff
     for name, content in templates.items():
         io_match = re.search(r'IntersectionObserver', content)
         reveal_matches = list(re.finditer(r'class="[^"]*reveal[^"]*"', content))
+        if reveal_matches and not io_match:
+            errors.append(f"  [{name}] 模板内有 {len(reveal_matches)} 个 .reveal 但没有任何 IntersectionObserver -> 全部永久不可见")
+            continue
         if io_match and reveal_matches:
```

### A4. `requirements.txt`（2 行）

```diff
 numpy>=1.24
 matplotlib>=3.7
+pandas>=2.0
+scipy>=1.10
```

### A5. Pages 工作流加 preflight 步骤（3 行）

```diff
       - name: Checkout
         uses: actions/checkout@v4
+      - name: Preflight check
+        run: python tools/preflight.py
       - name: Setup Pages
         uses: actions/setup-pages@v5
```
（实际为 `actions/configure-pages@v5`，插入位置在 `Checkout` 之后即可）

### A6. media 按需生成（§2.7 的完整片段，替换 5 处 `if (!option.baseOption) { … }` 整块）

见 §2.7 代码块。

---

## 附B：复现本报告结论的命令

```powershell
# 0. 基线
git log --oneline -1                       # 应为 656bb8e
(Get-FileHash index.html -Algorithm SHA256).Hash   # 应为 15CD282E…
(Get-Content index.html).Count             # 6060

# 1. preflight 实测（应 exit 1，报 API Key）
python tools/preflight.py

# 2. sox 抽样实测（默认参数应输出 95）
python demo/sox_sampling.py

# 3. 21 张图的 media 冲突点定位
Select-String -Path index.html -Pattern "interval: 'auto'"      # 5 处：3121/3709/4487/5389/5708
Select-String -Path index.html -Pattern "safeInit7?\("          # 5 处定义 + 21 处调用

# 4. 自定义 interval 的两张图（本轮 🔴 的证据）
Select-String -Path index.html -Pattern "interval: function"     # 出现在 3750 / 3850 两张图内

# 5. 双 y 轴图定位
Select-String -Path index.html -Pattern "yAxisIndex"             # 1 处（w01 chart2）

# 6. 注入坐标系/图例的图（原本无 grid/xAxis/legend）
#    需按 §2.2 表格逐行查看：3142 / 3351 / 4508 / 4671（无坐标系）
#                              3236 / 4508 / 4671 / 5444 / 5452 / 5780 / 5812（无 legend）

# 7. 竞态守卫（应看到 4 处 _pendingWork）
Select-String -Path index.html -Pattern "_pendingWork|clearTimeout"

# 8. R4 事件顺序证据（冒泡 vs 捕获）
Select-String -Path index.html -Pattern "stopPropagation"        # 2689（助手，冒泡）
Select-String -Path index.html -Pattern "\}, true\);"            # 5949（全局，捕获）
```

---

*本报告由复核AI（DeepSeek Harness）生成，第四轮，**未提交、未 push**。*
*基线：`HEAD = 656bb8e`，`index.html` 6060 行 / SHA256 `15CD282EB35F7DC0ADEC30265EC7415A3FAEFAC11F6F358FF5DE474C0DF60F56`。*
*复核过程仅新增本文件；分析用临时脚本已全部删除。*
*⚠️ `.gitignore:20` 只忽略 `REVIEW_REPORT.md`，**本文件不会被忽略**（`git status` 显示为 `??`）——请勿误提交；若要长期保留，建议把 `.gitignore` 改为 `REVIEW_REPORT*.md`。*
