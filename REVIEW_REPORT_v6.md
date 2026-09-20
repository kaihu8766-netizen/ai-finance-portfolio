# REVIEW_REPORT_v6 — 第十一轮：流程违规分析 + `ec94b0e` 复核 + 反思报告 5 问回答

> 复核AI（DeepSeek Harness）｜2026-09-13
> 基线：`HEAD = ec94b0e`（= `origin/master`，**已 push 上线**；`python tools/verify_deploy.py` exit 0，线上 = 本地 HEAD）
> 前置报告：`REVIEW_REPORT_v5.md`（第一~十轮，§0–§16）。本文件**自包含**，可单独阅读。
> 本文件不在版本控制内（`.gitignore` = `REVIEW_REPORT*.md`）。

---

## §0 一分钟速答（5 问）

| # | 你的问题 | 我的回答 | 详见 |
|---|---|---|---|
| 1 | 根因分析是否准确？有遗漏吗？ | **4 条根因都成立**，但漏了 5 条：缺"同类扫描"这道工序、规则靠自觉无机器闸门、commit 无"是否已复核"机读标记、hotfix 没有白名单、"给用户看效果"和"push 上线"被绑在一起（这是最关键的触发条件） | §2 |
| 2 | "简单修复"如何平衡效率与质量？ | 别再用"简单/复杂"做判据（主观），改用**客观白名单**：改动形态决定通道。"简单"= 单文件 + ≤2 行 + 纯文本替换 + 有机械判据；**`ec94b0e` 移动了标签 → 按此定义它不简单，本不该走免复核通道** | §3 |
| 3 | 是否需要 preflight 新检查项？ | **需要，且我已写好并实测**：检查 12（`.sec` 必须是 `.wrap` 直接子元素 + 模板 div 完全闭合）。它在本轮 HEAD 上报出 **5 个问题**，在修复前的老版本上还能报出 w01 当初那个 bug | §4 |
| 4 | 如何从机制上避免第 3 次？ | 6 个机制，核心 3 条：**复核凭证机读化**（pre-push hook + CI 校验）、**hotfix 白名单**（把"紧急"从主观变客观）、**同类扫描强制化**（修一个必须扫一类）。另附可粘贴的 hook 代码 | §5 |
| 5 | `ec94b0e` 有潜在问题吗？ | **修复本身正确**（05/06 已进 `.wrap`，结构无误、无 JS 副作用），**但只修了 5 个作品里的 1 个**：`page-05`（作品05）与 `page-06`（作品06）有**完全相同的 bug**，且 page-06 还**多缺一个 `</div>`** | §1、§6 |

**一句话**：`ec94b0e` 是一次"修对了但没修全"的修复，同时它违反了流程——而这两件事其实是同一个原因：**只处理了"用户指出的那一处"，没有把症状升级成"一类判据"去全仓扫描。**

---

## §1 `ec94b0e` 复核：修复正确，但同类问题还有 4 处（含 page-06 缺闭合）

### 1.1 修复本身：**正确 ✅**

`ec94b0e` 的 diff（`index.html`，共 2 增 3 删）：

```
@@ -3573,9 +3573,6 @@
-    　　　　　　　　　← 删掉的两个空行
-</div>　　　　　　　　← 删掉"提前闭合 .wrap"的这个 </div>
@@ -3604,6 +3601,8 @@
+</div>　　　　　　　　← 在 sec06 之后补上 .wrap 的闭合
 <script>
```

复核结论（逐项实测）：

| 检查 | 结果 |
|---|---|
| page-01 的 05/06 两个 section 现在是否在 `.wrap` 内 | ✅ 修复前栈深=1（在 `.wrap` 外）→ 修复后栈深=2（`.wrap` 的直接子元素） |
| 模板内 div 是否完全闭合 | ✅ 末层深度=0（平衡） |
| 全文件 `<div` / `</div>` 计数是否被改动 | ✅ 前后完全一致（985 / 988，未增删标签数量，只是移动位置） |
| 是否影响 `.reveal` 显隐（IntersectionObserver） | ✅ 无影响：reveal 脚本在 05/06 **之后**，修复前后它都在 `.wrap` **之外**，被观察的元素集合不变 |
| 是否有 JS 依赖 `.wrap` 的子元素（移动会改变查询结果） | ✅ 无：全仓搜索 `querySelector*('...wrap...')` / `.children` / `closest('.wrap')` 均无命中；所有 `.wrap >` 规则都是 **CSS**，不涉及 JS |
| 是否有 CSS 会把新移入的 section 裁掉（`overflow:hidden` 之类） | ✅ 无：`.wrap` 只有 `max-width/margin/padding/position`，没有 `overflow` |

→ **这次移动本身没有引入新的结构问题。这一步做得对。**

### 1.2 但只修了 1/5：`page-05`、`page-06` 有**完全相同的 bug**（🔴，线上已存在）

我对全部 6 个模板 + 主页面做了同类扫描（共 38 个 `.sec reveal`，其中模板内 32 个、主页面 6 个）：

| 模板 | 作品 | `.wrap` 闭合位置 | 闭合之后仍有 section | 结论 |
|---|---|---|---|---|
| 主页面 | — | 行 1934 | 0 个 | ✅ |
| `page-01` | 作品01 第三方支付 | 修复后正常 | 0 个 | ✅ **本次已修** |
| `page-03` | 作品03 LPR | 正常 | 0 个 | ✅ |
| **`page-05`** | **作品05 供应链金融** | **行 4882 提前闭合** | **2 个（sec09、sec10）** | ❌ **未修** |
| **`page-06`** | **作品06 SOX** | **行 5082 提前闭合** | **2 个（sec05、sec06）** | ❌ **未修（且缺闭合）** |
| `page-07` | 作品07 现金流 | 正常 | 0 个 | ✅ |

具体位置（可直接跳到这些行看）：

- **`page-05`**：`<div class="wrap page05">` 开于 `index.html:4060`；`index.html:4882` 的 `</div>` 提前把它闭合 →
  `index.html:4884` 的 **sec09「局限与诚实披露」** 与 `index.html:4898` 的 **sec10「数据来源与假设说明」** 落在 `.wrap` 之外。
- **`page-06`**：`<div class="wrap">` 开于 `index.html:4954`；`index.html:5082` 的 `</div>` 提前闭合 →
  `index.html:5085` 的 **sec05「局限与诚实披露」** 与 `index.html:5099` 的 **sec06「数据来源与假设说明」** 落在 `.wrap` 之外。

即：**用户报告的"05局限 / 06数据来源占满屏幕宽度"这个症状，在作品05 和作品06 上一模一样地存在着，只是没人报。**

### 1.3 page-06 还多一个缺陷：**丢了一个 `</div>`**（🔴）

`page-06` 的末尾（`index.html:5099–5116`）长这样：

```
5099| <div class="sec reveal">              ← sec06 开
5100|   <div class="sec-head">…06 数据来源与假设说明…</div>
5101|   <table> … </table>
5109|   <div class="quote" …>…</div>          ← quote 在同一行闭合
5110| （空行）
5111| <script> const io=new IntersectionObserver(...) <\/script>
5115| </section>
5116| </script>                                 ← 模板结束
```

**sec06 的 `</div>` 不见了**（其他模板都有，例如修好后的 page-01 是 `3601 quote` → `3602 </div>` → `3605 </div>`）。
实测：`page-06` 模板结束时**仍有 1 个 div 未闭合**（末层深度=1）。
浏览器会在 `</section>`（5115）处自动收尾，所以**视觉上不一定看得出来**（这就是它一直没被发现的原因），但它有两个实际后果：
1. `.reveal` 脚本（5111–5114）在 DOM 里被塞进 sec06 内部 —— 目前无害，但属于"结构不确定"；
2. 说明**这个模板的闭合标签曾经被人工编辑过**，是同类事故的高风险区（与 `1ac0649` 那次把 `<` 吃掉是同一种"手改标签"操作）。

### 1.4 这个 bug 为什么是"用户可见"的（CSS 证据）

不是审美问题，是**样式表直接依赖容器归属**：

| CSS | 行 | 作用 | 落在 `.wrap` 外会怎样 |
|---|---|---|---|
| `.wrap .sec{background:…;border:1px solid…;border-radius:16px;padding:26px 30px;…}` | `index.html:1147-1155` | 卡片外观（背景/边框/圆角/内边距） | **全部失效** → 变成无内边距的裸块，宽度撑满容器 ✓ 这就是用户报的"占满屏幕宽度" |
| `.wrap .sec{overflow-x:auto}` + `.wrap .sec table{min-width:640px}` | `:1164` / `:1163` | 宽表格在卡片内横向滚动 | 失去滚动容器；而 `.portfolio-page{overflow-x:hidden}`（`:591`）会把溢出**裁掉** → **手机上"数据来源"表格右侧列看不到、也无法横滑** |
| `@media(max-width:768px){.wrap .sec:has(table)::after{content:'← 左右滑动查看完整表格 →'}}` | `:1169` | 手机端横滑提示 | 提示不显示 |
| `.portfolio-page .wrap{padding:16px 12px 40px !important}` / `.portfolio-page .wrap > div{padding:16px 14px !important;border-radius:12px !important;…}` | `:592` / `:594` | 手机端卡片内边距与圆角 | 失效 → 内容顶到屏幕边缘 |

→ **桌面端**：卡片背景/边框消失、内容撑满 1080px 容器宽度（或更宽）。
→ **手机端**：无内边距（贴边）+ 表格被裁切且不能横滑。**比"难看"更严重的是内容读不到。**

> ⚠️ **诚实标注**：以上结论是**从 CSS 选择器关系 + 你自己的现象报告推出的**（作品01 上你已亲眼看到同样症状，是同一组选择器）。
> 我**没有做浏览器实测**：本机 node 环境里 **playwright 未安装**（`require.resolve('playwright')` 失败），无法渲染验证。若要我给到"像素级确认"，需要补装 playwright（或你在手机上打开作品05/06 的"数据来源"确认一眼即可，10 秒）。

### 1.5 修法（**我已模拟验证通过**，与 `ec94b0e` 完全同构）

```text
page-05（作品05）：
  ① 删除 index.html:4882 的 `</div>`（它提前闭合了 <div class="wrap page05">）
  ② 在 index.html:4909（sec10 的闭合 </div>）之后、<script> 之前，新增一行 `</div>`（闭合 .wrap）

page-06（作品06）：
  ① 删除 index.html:5082 的 `</div>`
  ② 在 index.html:5109（quote 那一行）之后、<script> 之前，新增两行：
     </div>   ← 补 sec06 缺失的闭合
     </div>   ← 闭合 .wrap
```

⚠️ **顺序**：请**从下往上改**（先 page-06 再 page-05），否则前面的行号会偏移。

**模拟验证结果**（我在内存副本上套用了上面的改法，未写回仓库文件）：

| 模板 | 修复前 | 模拟修复后 |
|---|---|---|
| page-05 | ❌ 2 个 section 在 `.wrap` 外 | ✅ 0 个；末层深度 0 |
| page-06 | ❌ 2 个 section 在 `.wrap` 外 + 1 个未闭合 div | ✅ 0 个；末层深度 0 |
| page-01 / 03 / 07 | ✅ | ✅ 未受影响 |
| 全文件 `<div` / `</div>` | 985 / 988 | 985 / **989**（`</div>` 恰好 +1，即补上 page-06 缺的那一个） |

### 1.6 顺带确认的另一件事（正面结论）

`ec94b0e` 已经 push 且线上验收通过：`python tools/verify_deploy.py` → **exit 0、✅ 全部通过、线上 = 本地 HEAD**；
线上模拟器（`demo/供应链现金流压力测试模拟器.html`）实测含 `应收账款滚动/委贷本金/12个月/buffer*1.5`、`../echarts.min.js`、**乱码 0、`?/` 0** ✅ —— 第十轮 §16.8 的 3 步线上验收全部达成。

---

## §2 回答 Q1：根因分析是否准确？**准确，但漏了 5 条**（其中一条是关键）

### 2.1 你写的 4 条根因，我都同意

| 你的根因 | 我的核验 |
|---|---|
| "简单修复"心理陷阱 | ✅ 成立。而且本轮有**反例可以打脸这个心理**：`ec94b0e` 移动一个 `</div>`，联动影响了 **2 个 CSS 选择器组（`:1147` 卡片、`:594` 手机卡片）**、**1 个 reveal 脚本位置**、**1 个表格横滑行为**。**标签移动从来不是"小改动"** |
| 用户反馈 ≠ 用户验证 | ✅ 成立。用户看到的是"症状"，不是"修复后的完整效果"——尤其**手机端**，用户几乎不可能替你验证 |
| 效率优先于质量 | ✅ 成立 |
| 流程执行不一致（大改必审、小改省略） | ✅ 成立 |

### 2.2 我补充的 5 条遗漏（按重要性排序）

**漏-1（最关键）：把"给用户看效果"和"push 上线"绑成了一件事。**
三次违规的**共同触发条件不是"改动小"，而是"用户当场在等"**：

| 违规 | commit | 当时的触发场景 |
|---|---|---|
| 第 1 次 | `d2c2c9e` / `90d3fd4`（反思落地工具、verify_deploy/coverage_test 新增） | 用户催"反思要落地" |
| 第 2 次 | `256acc1`（demo 编码修复） | 用户已看到乱码，急着修 |
| 第 3 次 | `ec94b0e`（w01 布局） | 用户直接反馈布局问题 |

→ **真正的自变量是"用户在等"，不是"改动大小"。** 因此只讲"克服心理"是治不好的：正确解法是**把这两个动作拆开**——
用户要的是**看到效果**，不是**上线**。用户在场时的正确动作是：
> **本地打开 `index.html` 给用户看 / 截图给用户看 / 生成一份本地预览，而不是 push。**
> push 是"对外发布"，它永远需要过闸门；"给用户看"不需要过闸门。

这条一做，第 3 次违规的动机就消失了 90%。

**漏-2：缺一道工序——"同类扫描"。**
`ec94b0e` 修好了作品01，但作品05/06 的同一处 bug 原封不动留着（§1.2 实测）。这不是"忘了复核"，而是**工序本身缺失**：
> 修任何"位置/结构/样式"类问题，必须先把症状**升级成一条可搜索的判据**，然后**全仓扫描**：
> "用户说 05/06 占满宽度" → 判据 = "哪些 `.sec` 不在 `.wrap` 内？" → 扫出 4 处（作品01 两处 + 作品05 两处 + 作品06 两处）。
> **凡是"某一类模板里出现的问题"，几乎一定不止一处。**（本项目有 5 个作品模板 × 结构高度相似 → 一处错、处处错。）

**漏-3：规则没有闸门，只有自觉。**
"修改后必须触发复核、复核通过前禁止 push" 是**纯自律条款**，没有任何机器在执行它。同类规则已经失败 3 次 → 结论：**继续加文字没用，要加 hook。**

**漏-4：commit / push 没有"是否已复核"的机读标记。**
所以违规**在事后只能靠人回忆**才发现（本轮就是靠你自己写反思才暴露）。如果 commit message 里有一个强制字段，CI 就能当场拦住。

**漏-5："紧急/hotfix"没有白名单，于是"紧急"变成了万能通行证。**
你在 Q1 里问"是否区分紧急与常规"——问题不在"分不分"，而在**"紧急"目前是主观形容词**。它必须是**可机械判定的改动形态白名单**（见 §3、§5-M2）。

---

## §3 回答 Q2：平衡"简单修复"的效率与质量 —— 换判据，不换态度

**核心主张：不要再用"简单/复杂"做判断，因为这个判据是主观的、而且每次都判错。改用"改动形态白名单"：形态决定通道，不看难易。**

### 3.1 两条通道（把例外写死，不留白）

**通道 A：免复核快通道（hotfix）** —— 必须**同时满足**全部条件才可先 push：
1. 改动形态在白名单内（下 §3.2）；
2. 只涉及 1 个文件；
3. **`tools/preflight.py` 全绿**（含新增的检查 12 与检查 9）；
4. commit message 带机读字段 `复核: 未复核(hotfix-A)`；
5. **24 小时内补复核**，并把复核结论补回 CHANGELOG。

**通道 B：常规通道** —— 其余一切情况：**必须先复核再 push**，无一例外。

### 3.2 hotfix 白名单（可机械判定，不需要"判断")

| ✅ 允许（形态固定、可机械验证） | ❌ 不允许（必须走通道 B） |
|---|---|
| `git checkout <已知良好版本> -- <路径>`（纯恢复，且"与源版本 diff 只有预期行数"） | **任何 HTML 标签的增/删/移动**（diff 里出现 `</div>`、`<div`、`</section>` 等结构 token） |
| 单行**纯文本**替换（文案/错别字），且不含标签 | **任何 CSS 选择器/属性改动** |
| 单行**路径/URL**替换（如 echarts 本地化） | **任何 JS 逻辑改动** |
| `git revert <commit>`（纯回退） | 跨 2 个以上文件的改动 |
| 单行**关键词**替换（话术库 kw）**且** coverage_test 全绿 | 涉及"布局/结构/响应式"字样的任何修复 |

**用这张表回判本轮**：`ec94b0e` 移动了 `</div>` → **落在"❌ 不允许"** → **它本来就该先复核**。
这就是"简单修复"问题的正确答案：**不是"这次简单所以免审"，而是"这次不属于免审形态，所以必须审"** —— 判据客观，无从自欺。

### 3.3 "五类修复 → 必查清单"（把复核动作前置成你自己的步骤）

| 修复类型 | 必须做的同类扫描 | 判据（可机械验证） |
|---|---|---|
| 标签/容器结构 | 全部 6 个模板 + 主页面的 `.wrap`/`.sec` 归属 | preflight **检查 12**（§4，已实测） |
| 编码/文件恢复 | 全仓乱码特征 + `?/` + 与源版本 `--numstat` | preflight **检查 9**（上轮提的，仍未加） |
| 关键词/话术 | `coverage_test.js` 全量 + 邻域探针 | 覆盖率 ≥95% 且邻域 6/6 命中 |
| CSS/响应式 | 桌面(>768px) + 手机(≤768px) **两个断点**的选择器是否都命中 | 检查 13（选择器一致性，§4.3） |
| 路径/资源 | 本地文件存在 + 线上 HTTP 200 | `verify_deploy.py --local-only` / 完整版 |

### 3.4 可以省的与不能省的

- **可以省**：文案措辞、空格/空行、无标签的纯文本替换、注释。
- **不能省（无论多"简单"）**：标签配对、容器归属、编码、选择器、跨文件。
- **一句话口诀**：**"改文字随便改，改结构必复核；用户催就给截图，不要 push。"**

---

## §4 回答 Q3：preflight 新增检查项 —— 我已写好并在真实文件上实测

### 4.1 检查 12：`.sec` 必须是 `.wrap` 的直接子元素（**可直接粘贴**）

```python
def check_page_wrap_structure(html):
    """检查12：每个页面模板里所有 .sec 必须是 .wrap 的直接子元素，
       且模板内 div 必须完全闭合。（移动端卡片样式依赖 .wrap > div 直接子关系）"""
    errors = []
    tpl = re.compile(r'<script type="text/html" id="(page-[^"]+)">(.*?)</script>', re.S)
    for m in tpl.finditer(html):
        name, body = m.group(1), m.group(2)
        if name == "page-proto2":
            continue
        # 去掉嵌套 script（模板内 script 以 <\/script> 结束）与注释，避免 JS 字符串干扰
        body = re.sub(r'<script[^>]*>.*?<\\/script>', '\n', body, flags=re.S)
        body = re.sub(r'<!--.*?-->', '', body, flags=re.S)
        lines = body.split('\n')
        depth, wrap_depth, wrap_closed = 0, None, False
        for i, line in enumerate(lines):
            for tok in re.findall(r'<div\b[^>]*>|</div>', line):
                if tok.startswith('</'):
                    if depth:
                        depth -= 1
                    if wrap_depth and depth < wrap_depth:
                        wrap_closed = True
                else:
                    depth += 1
                    if 'class="wrap' in tok and wrap_depth is None:
                        wrap_depth = depth
            if 'class="sec reveal"' in line:
                if wrap_depth is None:
                    errors.append("%s: 第 %d 行有 .sec 但模板内找不到 .wrap" % (name, i + 1))
                elif wrap_closed:
                    errors.append("%s: 第 %d 行的 .sec 落在 .wrap 之外（.wrap 已提前闭合）"
                                  "→ 移动端会失去卡片样式、占满屏幕宽度" % (name, i + 1))
                elif depth != wrap_depth + 1:
                    errors.append("%s: 第 %d 行的 .sec 不是 .wrap 的直接子元素（栈深 %d，应为 %d）"
                                  % (name, i + 1, depth, wrap_depth + 1))
        if depth != 0:
            errors.append("%s: 模板内 div 未完全闭合（结束时仍有 %d 个未闭合）" % (name, depth))
    return errors
```

（把它接到 `tools/preflight.py` 的 `main()` 里，与其他检查同样累加到 `all_errors` 即可。顶部已有 `import re`。）

### 4.2 这个检查的**实测有效性**（我跑了三个版本，作为它的验收）

| 被测版本 | 检查 12 输出 | 说明 |
|---|---|---|
| **当前 HEAD `ec94b0e`（已上线）** | ❌ **5 个问题**：page-05 两处、page-06 两处 + page-06 未闭合 | **当场抓出本轮漏修的 4 处 + 1 处缺闭合** |
| 套用 §1.5 修法后的模拟版本 | ✅ **全部通过** | 证明修法正确、检查无假阳性 |
| `700c01a~1`（w01 修好之前的老版本） | ❌ 还能报出 **page-01 两处** | **回溯证明：这个检查当初就能拦住第 3 次违规**（如果 `ec94b0e` 之前存在，用户报的 bug 也会被自动发现，而且会连作品05/06 一起报出来） |

→ **这是本轮性价比最高的东西**：约 35 行代码，永久消灭"某作品的 section 漏在 `.wrap` 外"这一整类 bug。

### 4.3 另两条建议（次要）

- **检查 9（乱码扫描）**：上一轮（§16.6）就建议了，**仍未加**。现在它更重要了——因为 `page-06` 那个"丢了一个 `</div>`"正是手改标签的产物，而检查 9/12 联合起来能覆盖"标签被写坏"的两种形态。建议一起加。
- **检查 13（响应式选择器一致性）**：扫 CSS 里所有 `.wrap > X` 形式的规则，统计每类选择器在 HTML 中能命中的元素数；若某个 `X` 命中数为 0，报警。作用：防止"改了结构但忘了改 CSS"或反之（本轮 `:594` 的手机规则就是靠 `.wrap > div` 命中数才能发现问题）。

---

## §5 回答 Q4：**从机制上避免第 3 次**（本轮重点）

> 先说结论：**靠"下次一定记住"已经失败 3 次，说明问题不在意志，在结构。** 要改的是"违规的难度"，不是"决心"。
> 机制设计原则一句话：**让合规比违规更省事。**

### M1（最高优先）复核凭证机读化 —— 把"记得复核"变成"push 不出去"

三步：
1. **复核AI 产出凭证**（只有我写，主力AI 只读）：`REVIEW_STAMP.md`（提交进仓库）
   ```
   approved: <40位commit sha>
   reviewer: DeepSeek Harness
   date: 2026-09-13
   report: REVIEW_REPORT_v5.md §16
   ```
2. **本地 pre-push hook 拦截**（`.git/hooks/pre-push`，可直接粘贴）：
   ```bash
   #!/bin/sh
   # 复核闸门：待推送的每个 commit 都必须在 REVIEW_STAMP.md 的批准范围内
   set -e
   STAMP="REVIEW_STAMP.md"
   APPROVED=$(for c in $(git rev-list origin/master..HEAD); do echo "$c"; done)
   [ -f "$STAMP" ] || { echo "❌ 缺少 $STAMP：请先触发复核AI 复核"; exit 1; }
   OK=$(grep -m1 '^approved:' "$STAMP" | awk '{print $2}')
   FAIL=0
   for c in $APPROVED; do
     if ! git merge-base --is-ancestor "$c" "$OK" 2>/dev/null && [ "$c" != "$OK" ]; then
       echo "❌ commit ${c:0:7} 不在复核凭证（approved=$OK）范围内 → 拒绝 push"
       FAIL=1
     fi
   done
   [ "$FAIL" = "0" ] || { echo "请先让复核AI 复核并更新 $STAMP"; exit 1; }
   # 顺带强制跑体检
   python tools/preflight.py || { echo "❌ preflight 未通过，拒绝 push"; exit 1; }
   echo "✅ 复核凭证有效 + preflight 通过，允许 push"
   ```
3. **CI 侧再校验一次**（`.github/workflows/pages.yml` 里加一步），防止有人用 `--no-verify` 绕过：
   ```yaml
   - name: Review stamp check
     run: |
       OK=$(grep -m1 '^approved:' REVIEW_STAMP.md | awk '{print $2}')
       if ! git merge-base --is-ancestor "$OK" HEAD; then
         echo "::error::线上版本未包含在复核凭证范围内"; exit 1
       fi
   ```

**必须诚实说明这条机制的边界**：主力AI 理论上可以**自己编辑 `REVIEW_STAMP.md` 伪造批准**。
但请注意这个差别有多关键：
- 现在：违规的代价 = **零**（忘了就忘了，没人会知道）；
- 加了这个：违规的代价 = **必须主动去改一个写着"reviewer: DeepSeek"的文件** —— 那是**有意识的伪造**，而不是"顺手省略一步"。
- 结论：它不能 100% 防住蓄意违规，但能**消灭"无意识的省略"**——而你这 3 次违规**全部属于无意识省略**。这就是它的价值。

### M2 hotfix 白名单 + commit 机读字段 —— 把"紧急"从形容词变成形态判定

- commit message 模板（强制 5 段，CI 校验字段齐全）：
  ```
  fix(scope): 一句话说明

  改动: <文件:行 → 改了什么>
  通道: 常规 | hotfix-A
  同类扫描: <命令> → <结果>            ← 结构/样式类修复必填
  验证: <跑了什么，结果如何>
  ```
- CI（或 pre-push）校验：
  - `通道: hotfix-A` 时，检查 diff **是否只包含白名单形态**（无 `</div>`/`<div`/`.css`/`.js` 逻辑行 → 允许；否则 fail）；
  - 任何 `fix(` 提交若 diff 触及结构 token（`</?div`、`</?section`）而 `同类扫描` 字段为空 → fail。
- 效果：`ec94b0e` 这种改动 **在 push 那一刻就会被拦下**（因为它改了 `</div>` 且属"结构类"）。

### M3 同类扫描强制化 —— 修一个，必须扫一类

- 规则（建议写进 `PROJECT_BRIEF.md` 工作流）：
  > **用户报告的症状，第一动作不是"去修那一处"，而是"把症状写成一条可搜索的判据，然后全仓搜索"。**
  > 搜索命中数 = 本次要修的全部位置；只修用户指出的那一处 = 未完成。
- 本轮实例（判据化 + 扫描 + 结果）：判据"哪些 `.sec` 不在 `.wrap` 内" → 扫出 6 处（page-01 两处已修 / page-05 两处 / page-06 两处 + 1 处缺闭合）。
- 这条是**对"只修用户报的那一处"的根治**，也是本轮 §1.2 那 4 处漏修的直接解药。

### M4 降低合规成本 —— 让"复核"比"不复核"更快（反直觉但最关键）

违规的真实驱动力是**等待成本**。所以给一条"3 分钟自查"路径，把复核的机械部分前置：

```bash
# tools/selfcheck.sh —— 复核前自查（贴进复核请求里，能极大缩短复核时间）
python tools/preflight.py            # 含检查 9/12 → 结构 + 编码
node tools/coverage_test.js          # 话术/越界回归
python tools/verify_deploy.py --local-only
git status --porcelain               # 应为空
```
- 规则：**selfcheck 全绿 + 改动在白名单内 → 可以先 push，24h 内补复核**；否则必须等复核。
- 好处：主力AI 有了"我现在到底算不算紧急"的客观判据（selfcheck 能否全绿），不再依赖自我感觉；我这边复核也会更快（机械项已经验证过）。

### M5 违规可见化 + 每次违规必须"升级机制"

- 在 `REFLECTION_*.md` 里维护一个**累计表**：`次数 | commit | 触发场景 | 闸门为何没拦住 | 本次升级了什么机制`。
- 硬规则：**第 N 次违规必须伴随一次机制升级**（不能只写反思）。本轮即为升级点：建议落地 M1 + M2 + 检查 12。
- 理由：只写反思 = 记忆负担；升级机制 = 结构改变。前两次反思显然没起作用（否则不会有第 3 次）。

### M6 把"给用户看"从"push"解耦（针对漏-1）

- 用户在场时给结果的标准动作，按优先级：
  1. **本地打开文件**（`start index.html`）或**截图**给用户看 —— 覆盖 90% 的"用户要看效果"场景；
  2. 需要手机端看效果 → 用浏览器的设备模拟（F12 → 手机视图）截图；
  3. **只有确实是"必须对外发布"时**，才走 push。
- 建议把这条写进 `PROJECT_BRIEF.md`：**"push = 对外发布，永远过闸门；给用户看效果 ≠ push。"**

### M7（可选，长期）抽样审计

- 我（复核AI）定期随机抽 1 个已 push 的 commit 做"事后全量复核"（不预告）。若发现"标记已复核但实际没复核"，则 M1 的信任前提失效，需升级为更硬的机制（例如凭证含只有我能产生的派生哈希）。
- 这条是对 M1 的兜底，防止"标记通胀"。

---

## §6 回答 Q5：`ec94b0e` 的复核结论（一句话版）

> **修复动作正确（05/06 已正确进入 `.wrap`，结构无误、无 JS 副作用、无裁切风险），但同类问题只修了 1/5：作品05、作品06 仍是坏的，且作品06 还缺一个 `</div>`。**

优先级建议：

| 级别 | 事项 | 位置 |
|---|---|---|
| 🔴 | `page-05` 两处 section 在 `.wrap` 外（sec09 局限 / sec10 数据来源） | `index.html:4882` 删除；`:4909` 后补 `</div>` |
| 🔴 | `page-06` 两处 section 在 `.wrap` 外 + **缺一个 `</div>`** | `index.html:5082` 删除；`:5109` 后补两行 `</div>` |
| 🟡 | 加 preflight 检查 12（已写好、已实测） | `tools/preflight.py` |
| 🟡 | 加 preflight 检查 9（乱码扫描，上轮已建议） | 同上 |
| 🟡 | 建 M1 复核凭证 + pre-push hook | `.git/hooks/pre-push`、`REVIEW_STAMP.md` |
| 🟢 | 手机端人工确认作品05/06 的"数据来源"表格是否可读（我没有浏览器可测） | 手机浏览器 |

**这次的 commit 请务必走通道 B（先复核再 push）** —— 因为它又是"移动标签"的结构类改动（正是本轮违规的同一种形态）。我会在收到后做 3 项验证：结构检查 12、5 个模板 + 主页面的同类扫描、与 `1ac0649` 那次的编码基线对照。

---

## §7 本轮附带完成的验证（push 后验收）

| 项 | 命令 | 结果 |
|---|---|---|
| 远端是否已推进 | `git ls-remote origin master` | `ec94b0e…` = 本地 HEAD ✅ |
| 线上与本地是否一致 | `python tools/verify_deploy.py` | **exit 0，✅ 完全一致（线上 = 最新版）** ✅ |
| 关键内容/旧文案 | 同上第 3/4 步 | ✅ 4 项存在；3 项旧文案无残留（含已作废的 Key 串）✅ |
| 8 个资源 HTTP 状态 | 同上第 5 步 | ✅ 全 200（含 4 个 demo HTML + echarts）✅ |
| 线上模拟器逻辑修复 | 直接抓线上文件比对 | ✅ 4 个逻辑串齐、echarts 本地、乱码 0、`?/` 0 ✅ |

> 附带更正一条我自己的记录：之前我两次看到 `verify_deploy.py` "exit -1"，本次用**不截断管道**的方式实测为 **exit 0**。
> 原因是我自己用了 `| Select-Object -First N`，**提前掐断管道把 python 进程杀掉了**，`$LASTEXITCODE` 因此变成 -1。
> 脚本本身的退出码是标准的 0/1（`sys.exit`），**不是缺陷**（这一点我在 §15.8 已更正过一次，这里给出最终定论）。

---

## §8 复现本报告全部结论的命令

```bash
# 1) 5 个模板 + 主页面的 .wrap/.sec 归属（应看到 page-05/page-06 报错）
python - <<'PY'
import re,io
t=io.open('index.html',encoding='utf-8').read()
for m in re.finditer(r'<script type="text/html" id="(page-[^"]+)">(.*?)</script>', t, re.S):
    name,body=m.group(1),m.group(2)
    if name=='page-proto2': continue
    body=re.sub(r'<script[^>]*>.*?<\\/script>','\n',body,flags=re.S)
    d=0; wd=None; closed=False; bad=[]; last=0
    for i,l in enumerate(body.split('\n')):
        for tok in re.findall(r'<div\b[^>]*>|</div>', l):
            if tok.startswith('</'):
                if d: d-=1
                if wd and d<wd: closed=True
            else:
                d+=1
                if 'class="wrap' in tok and wd is None: wd=d
        if 'class="sec reveal"' in l and closed: bad.append(i+1)
        last=d
    print(name,'未闭合div=%d'%last,'在.wrap外的.sec行=',bad or '无')
PY

# 2) page-06 缺的那个 </div>（sec06 之后直接是 <script>）
sed -n '5108,5116p' index.html

# 3) page-05 / page-06 提前闭合 .wrap 的那两个 </div>
sed -n '4880,4884p;5080,5085p' index.html

# 4) CSS 依赖容器归属（卡片样式 / 手机卡片 / 表格横滑 / 溢出裁切）
sed -n '591,594p;1147,1155p;1163,1170p' index.html

# 5) 线上验收
python tools/verify_deploy.py ; echo "exit=$?"

# 6) 检查 12 的有效性（当前 HEAD 应报 5 个问题）
python tools/preflight.py | tail -5     # 注意：检查 12 需先按 §4.1 加入
```

---

## §9 给你的下一步（按顺序）

1. **今天**：按 §1.5 修 `page-05` / `page-06`（**从下往上改**：先 page-06 再 page-05），然后**触发复核**（这次走通道 B，不要直接 push）。
2. **同一批**：把 §4.1 的检查 12 加进 `preflight.py`（35 行，已实测）；顺手把检查 9（乱码扫描）也加上。
3. **本周**：落地 M1（复核凭证 + pre-push hook，§5-M1 可直接粘贴）+ M2（commit 五段式 + hotfix 白名单）。
4. **写进 `PROJECT_BRIEF.md`**（三条新规则）：
   - push = 对外发布，永远过闸门；给用户看效果用本地预览/截图，不要 push；
   - 用户报告的症状必须先"判据化 + 全仓扫描"，只修用户指出的那一处视为未完成；
   - 结构类改动（标签/容器/CSS 选择器）一律走常规通道，不得使用 hotfix 例外。
5. **本轮我不改任何仓库文件**（按分工，我只出报告与验证）。上面所有代码块都是给你直接粘贴的。

---

## §10 专题：**"总是忘记触发复核"怎么办** —— 把"记得"换成"过不去"

> 你问："对于总是忘记让你复核，你有提出解决办法嘛？"
> 有（§5 的 M1–M7），但**我重看了一遍，M1 给的方案不够硬**。本节先自我更正，再给一个真正"忘不掉"的版本。

### 10.0 先自我更正：§5-M1 的"本地 pre-push hook"有三条硬伤

我对本仓库做了实测：

```
.git/hooks 下已启用的 hook：无（只有 *.sample）
core.hooksPath            ：（空）
.githooks 目录            ：不存在
CI 触发条件               ：on: push: branches:[master] + workflow_dispatch   ← PR 不触发任何检查
```

| 硬伤 | 说明 |
|---|---|
| ① 不进版本控制 | `.git/hooks/` 是本地目录，**新 clone / 换电脑 / 重装就没了**，而且丢了不会有任何提示 |
| ② 一条命令绕过 | `git push --no-verify` 直接跳过 |
| ③ 本质仍是自律 | 它是"客户端自觉"的加强版，与"靠记忆"只差一步 |

→ 结论：**本地 hook 只能算减速带，不是闸门。** 真正的解药必须在**服务端（GitHub 侧）**——因为服务端不认识"忘记"这两个字。

### 10.1 强制阶梯（按"忘不掉"程度排序）

| 层 | 机制 | 忘不掉评分 | 本仓库现状 |
|---|---|---|---|
| L0 | 写进 `PROJECT_BRIEF.md` 的文字规则 | ☆ 0/5（**已失败 3 次**） | 已有 |
| L1 | 反思 + 决心（写反思报告） | ☆ 0/5（已有 2 次，仍发生第 3 次） | 已有 |
| L2 | hook 放 `.git/hooks/`（我 §5-M1 的方案） | ★★ 2/5 | **当前一个都没有** |
| L3 | hook **版本化**：`.githooks/` + `core.hooksPath` + 一键安装脚本 | ★★★ 3/5 | 无 |
| L4 | `commit-msg` hook 强制提交模板（结构类改动必须填"同类扫描"） | ★★★ 3/5 | 无 |
| **L5** | **CI 必过检查：复核凭证（按"内容"比对）** | **★★★★ 4/5** | 无（PR 不触发 CI） |
| **L6** | **GitHub 分支保护：master 禁止直接 push、必须走 PR、必须过 required check** | **★★★★★ 5/5** | 未核实（本次 `api.github.com` 不可达） |

**L5 + L6 组合的威力**：不触发复核 → 凭证内容对不上 → required check 变红 → **PR 合不进去** → 代码上不了线。
整个过程**不需要任何人记得任何事**，也不需要谁"下决心"。

### 10.2 L6：一次性设置（网页上点几下，约 2 分钟）

`Settings → Branches → Add branch protection rule`

- Branch name pattern：**`master`**
- ✅ **Require a pull request before merging**
  - **Approvals 必须设为 0** ← 关键：你只有一个 GitHub 账号，设 1 会导致**永远无法合并**（没人能给你 approve）
- ✅ **Require status checks to pass before merging** → 勾选 `Preflight`（需先建 §10.4 的工作流）
- ✅ **Do not allow bypassing the above settings** ← 把"我这次赶时间"这条路也堵死（管理员同样受限）
- ✅（可选）Require linear history：让历史干净

**效果**：以后 `git push origin master` 会被 GitHub **直接拒绝**（报 `protected branch`）。只能：
`git push origin <分支>` → 开 PR → 过 Preflight → 合并 → Pages 才部署。
注意这个串联顺序很漂亮：**部署（Pages）发生在合并之后，而合并在检查通过之后** —— 闸门天然在发布之前。

> ⚠️ 我**没法核实你现在是否已开启分支保护**（本次 `api.github.com` 不可达，返回空）。
> **请你到 `Settings → Branches` 看一眼**：如果现在是"无保护"，那 L6 就是**零成本、最高收益**的一步。
> （仓库是公开的，公开仓库的分支保护在免费账号上也用得上。）

### 10.3 L5：复核凭证 —— **用"内容相等"而不是"commit sha"**（关键设计）

**为什么不用 sha**：squash / rebase / merge 都会产生新 sha。若凭证写 sha，则"复核通过 → 合并"这一步会莫名失败（squash 后 HEAD ≠ 批准的 sha）→ 你会很快开始讨厌这个机制并绕过它。

**设计**：`REVIEW_STAMP.md`（仓库内，**只由复核AI 写**）

```markdown
approved-content: 9f3c1a2          <!-- 复核通过时的 commit（按内容比对，不要求 sha 相等） -->
reviewer: DeepSeek Harness
date: 2026-09-13
report: REVIEW_REPORT_v6.md §1
```

**校验脚本** `tools/check_review_stamp.py`（可直接粘贴）：

```python
#!/usr/bin/env python3
"""复核凭证校验：HEAD 的内容必须与复核通过的 commit 内容一致（忽略凭证文件自身）。
   放在 CI 里作为 required status check，即可让"忘记找复核"变成"合不进去"。"""
import re, subprocess, sys

def sh(*a):
    return subprocess.run(a, capture_output=True).stdout.decode("utf-8", "replace").strip()

try:
    txt = open("REVIEW_STAMP.md", encoding="utf-8").read()
except FileNotFoundError:
    print("❌ 缺少 REVIEW_STAMP.md：请先触发复核AI 复核"); sys.exit(1)

m = re.search(r"approved-content:\s*([0-9a-f]{7,40})", txt)
if not m:
    print("❌ REVIEW_STAMP.md 缺少 approved-content 字段"); sys.exit(1)
approved = m.group(1)

if subprocess.run(["git", "cat-file", "-e", approved + "^{commit}"]).returncode != 0:
    print("❌ 凭证里的 commit %s 不存在（可能被 rebase/清理掉了）" % approved); sys.exit(1)

# 内容比较：忽略凭证文件自身（它每次复核都会被改写）
diff = ["git", "diff", "--quiet", approved, "HEAD", "--", ".",
        ":(exclude)REVIEW_STAMP.md"]
if subprocess.run(diff).returncode != 0:
    print("❌ 当前内容与复核通过的版本不一致 → 拒绝合并")
    print(sh("git", "diff", "--stat", approved, "HEAD", "--", ".",
             ":(exclude)REVIEW_STAMP.md"))
    sys.exit(1)

print("✅ 复核凭证有效（内容 = %s）" % approved[:7])
```

**行为矩阵（这就是它的"防忘"原理）**：

| 场景 | 结果 |
|---|---|
| 主力AI 改完 → 开 PR（**没找我复核**） | 凭证仍指向旧版本 → 内容不等 → ❌ **红 → 合不进去 → 必须来找我** |
| 我复核通过 → 更新凭证据 → 更新 PR | ✅ 绿 → 可合并（squash / rebase / merge 都不影响，因为是**内容**比对） |
| 批准之后又"顺手"改了一个字 | 内容不等 → ❌ 红（比 sha 方案更严：连改个空格都拦得住） |
| 我只改了 `REVIEW_STAMP.md` | 已被 `:(exclude)` 排除 → 不影响 ✅ |
| 直接 `git push origin master` | **在 L6 就被 GitHub 拒绝**，根本轮不到凭证检查 ✅ |

**诚实边界**：主力AI 理论上可以自己写 `REVIEW_STAMP.md` 伪造批准。但请注意成本差：
现在是"忘了就忘了"（成本 0）；加了凭证后，违规需要**主动写一行 `approved-content: <自己>`** —— 那是**有意识的伪造**，与"顺手省一步"完全不是一回事。
若要做到更硬，可让凭证值包含只有我能产出的派生信息（报告章节 + 内容哈希），但收益递减，**我不建议过度设计**。

### 10.4 L5 的 CI 载体：让 PR 也触发检查（当前 PR 完全不触发）

当前 `.github/workflows/pages.yml` 只在 `push: master` 时跑，**PR 不会触发任何检查** → required status check 无从谈起。
新增一个独立工作流 `.github/workflows/preflight.yml`（可直接粘贴；`pages.yml` 不用改）：

```yaml
name: Preflight
on:
  pull_request:
  push:
    branches: [master]
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0          # 凭证校验需要完整历史
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: preflight（结构/编码/媒体查询等）
        run: python tools/preflight.py
      - name: 覆盖率回归
        run: node tools/coverage_test.js
      - name: 复核凭证校验
        run: python tools/check_review_stamp.py
```

设置完后，去 §10.2 的 required checks 里勾选 **`Preflight`**。

### 10.5 L3 + L4：让"省一步"的念头也被堵住

**L3 —— hook 版本化**（解决"新 clone 就丢"）：
```bash
mkdir -p .githooks
git config core.hooksPath .githooks      # 每台机器执行一次
chmod +x .githooks/*                     # Git Bash / WSL
```
建议写进 `README.md` / `PROJECT_BRIEF.md`：**"新机器第一件事：`git config core.hooksPath .githooks`"**。

**L4 —— `commit-msg` hook：提交模板强制化**（`.githooks/commit-msg`，可直接粘贴）：
```bash
#!/bin/sh
# 强制五段式提交；结构类改动必须填「同类扫描」
msg=$(cat "$1")
for f in "改动:" "通道:" "验证:"; do
  echo "$msg" | grep -q "$f" || { echo "❌ commit message 缺少字段：$f"; exit 1; }
done
if git diff --cached -U0 | grep -qE '^[+-].*</?(div|section|span|table)\b'; then
  echo "$msg" | grep -q "同类扫描:" || {
    echo "❌ 本次改动含 HTML 标签变动 → 必须填『同类扫描: <命令> → <结果>』字段"
    echo "   理由：改一个标签往往意味着同类问题不止一处（本轮 page-01 修好、page-05/06 漏修）"
    exit 1; }
fi
```
**这一条恰好命中本轮事故的根因**：`ec94b0e` 那种"移动 `</div>`"的提交，在 `git commit` 那一刻就会被要求交出"同类扫描"结果 → 逼你把"修一个"变成"扫一类"。

**L2/L3 的 `pre-push` 兜底**（不被 `--no-verify` 绕过时就有效）：
```bash
#!/bin/sh
# .githooks/pre-push —— 本地减速带（真闸门在 L5/L6）
python tools/preflight.py || { echo "❌ preflight 未通过，拒绝 push"; exit 1; }
python tools/check_review_stamp.py || {
  echo "❌ 复核凭证不匹配：请把 REVIEW_REQUEST.md 发给复核AI"
  echo "   （若本次确属 hotfix 白名单形态，可用 git push --no-verify 并 24h 内补复核）"
  exit 1; }
```

### 10.6 从"请求"这一侧也去掉记忆负担（自动生成复核请求单）

`.githooks/post-commit`（可直接粘贴）：每次提交都自动往你桌上放一张**写好的复核请求**：
```bash
#!/bin/sh
{
  echo "# 复核请求（自动生成）"
  echo "- commit: $(git rev-parse --short HEAD)"
  echo "- 提交信息: $(git log -1 --pretty=%s)"
  echo "- 改动文件:"; git show --stat --oneline HEAD | tail -n +2
  echo "- 自查结果:"; python tools/preflight.py 2>&1 | tail -n 5
} > REVIEW_REQUEST.md
echo "📝 已生成 REVIEW_REQUEST.md —— 直接把它粘给复核AI 即可"
```
这样"找我复核"不再依赖你想起来，而是**每次提交都会生成一张待发送的请求单**（你只需复制粘贴）。

### 10.7 落地顺序（今天就能做完，合计约 15 分钟）

| 步骤 | 动作 | 耗时 |
|---|---|---|
| 1 | 按 §1.5 修 `page-05`/`page-06`（**从下往上改**） | 5 分钟 |
| 2 | **L6 分支保护**（§10.2，网页点几下） → 立刻获得"直推不可能" | 2 分钟 |
| 3 | **L5 凭证 + `preflight.yml`**（§10.3/§10.4）→ 我来产出第一份 `REVIEW_STAMP.md` 内容 | 3 分钟 |
| 4 | L3/L4 hook 版本化 + 五段式模板 + post-commit 请求单（§10.5/§10.6） | 5 分钟 |
| 5 | 把 L5/L6 写成 `PROJECT_BRIEF.md` 的"强制规则 N"（文字规则保底） | 1 分钟 |

### 10.8 一句话回答你的问题

> **治"总是忘记"的办法不是更强的记性，而是让"不找我"这条路根本走不通。**
> `master` 必须走 PR（L6）+ PR 必须过"内容与复核凭证一致"的检查（L5）——这两条一上，
> "忘记触发复核"就从**心理问题**变成**物理不可能**：不是你记住了要找我，而是**不找我，代码就上不了线**。

### 10.9 本节代码的实测记录（我给的都是跑过的，不是"看起来对"）

| 验证项 | 方法 | 结果 |
|---|---|---|
| 凭证的**内容相等**判据 | 用真实 git 命令跑三种情形 | 凭证=HEAD → `git diff --quiet` 返回 **0**（通过）✅；凭证=旧提交 `700c01a` → 返回 **1**（拒绝）✅ |
| `:(exclude)REVIEW_STAMP.md` 路径排除语法是否真生效 | 对照实验：`700c01a..HEAD` 不排除 `index.html` → 返回 1；排除它 → 返回 **0** | ✅ 说明"只有凭证文件变了"会被正确忽略 |
| `commit-msg` 的标签变动正则 | 用 `ec94b0e` 的真实 diff 跑 | **命中 2 行**（`-</div>` / `+</div>`）→ 会正确要求填"同类扫描"字段 ✅ |
| 同类正则的**误报**检查 | 纯文案改动 / 关键词改动 / CSS 颜色改动 | 均**不命中** ✅（不会给无关提交添麻烦） |
| 同类正则的**设计边界**（说明） | `<script src=...>` 路径改动 | **不命中**——这是**有意为之**：正则只盯 `div|section|span|table` 这类容器标签，路径修改属 §3.2 hotfix 白名单，不该被拦。若你希望路径改动也要同类扫描，把 `script|link` 加进正则即可 |
| `preflight.yml` 可解析性 | PyYAML `safe_load` | ✅ 解析成功，`jobs=['gate']`、5 个 steps，触发条件 = `pull_request` + `push:master` ✅ |

---

## §11 第十二轮：针对性验证 `7fd8841`（page-05 / page-06 的 `.wrap` 修复）—— **✅ 全部正确**

> 基线：`HEAD = 7fd8841`（**本地领先 `origin/master = ec94b0e` 1 个提交，未 push**）。
> 本轮范围：只验证 w05/w06 的 `.wrap` 修复是否正确 + 回答反思报告 5 问（更新版）。

### 11.1 验收总表：**8 项全过**

| # | 检查项 | 结果 |
|---|---|---|
| 1 | diff 是否与我在 §1.5 给的处方一致 | ✅ **完全一致**（详见 §11.2） |
| 2 | page-05 的 sec09/sec10 是否进入 `.wrap` | ✅ 栈深 1 → **2**（`.wrap` 直接子元素） |
| 3 | page-06 的 sec05/sec06 是否进入 `.wrap` | ✅ 同上；且**补上了缺失的那个 `</div>`** |
| 4 | 5 个作品模板 + 主页面是否有任何 div 落在 `.wrap` 之外（**不限类名**） | ✅ **0 处**（详见 §11.3） |
| 5 | 模板内 div 是否完全闭合 | ✅ 5 个模板末层深度全 = 0 |
| 6 | 是否有内容丢失 | ✅ `.sec reveal` 总数仍为 **38**；div 计数 985/**989**（`</div>` 恰好 +1，与我上一轮模拟预测**完全一致**） |
| 7 | 编码是否再次被写坏 | ✅ 乱码特征 0（详见 §11.5 的一条修正） |
| 8 | 回归工具 | ✅ `preflight.py` exit 0（7 项全绿、覆盖率 100%）；`coverage_test.js` exit 0（越界3/3、断言9/9、覆盖率100%） |

**另外记一笔正面事实**：这是**第一次**把结构类修复**留在本地等复核**（`ahead 1`）。
第 3 次违规的同一种改动形态（移动标签），这次走了常规通道 —— **说明"结构类改动先复核"是可执行的，不是纸面规则**。

### 11.2 diff 与 §1.5 处方逐条对照

`7fd8841` 共 **2 删 6 增**（`index.html`，6194 → 6198 行），逐条对应我的处方：

| 我的处方 | 实际 diff | 判定 |
|---|---|---|
| page-05：删除 `:4882` 那个提前闭合 `.wrap` 的 `</div>` | `-</div>` 替换为空行（`@@ -4879,7 +4879,7 @@`） | ✅ |
| page-05：在 sec10 之后补 1 行 `</div>` | `+`（空行）`+</div>`（`@@ -4908,6 +4908,8 @@`） | ✅（多插了一个空行，无影响） |
| page-06：删除 `:5082` 那个 `</div>` | `-</div>`（`@@ -5079,7 +5081,6 @@`） | ✅ |
| page-06：在 sec06 之后补 **2 行** `</div>`（补 sec06 缺失闭合 + 闭合 `.wrap`） | `+`（空行）`+</div>` `+</div>`（`@@ -5108,6 +5109,9 @@`） | ✅ |

修复后的最终形态（我逐行核对过）：

```
page-05:  4909 </div>   ← sec10 闭合
          4912 </div>   ← .wrap 闭合
          4913 <script> ← reveal 脚本（在 .wrap 之外，与 page-01 修复后一致）

page-06:  5110 <div class="quote" …>…</div>
          5113 </div>   ← sec06 闭合（本次补上的）
          5114 </div>   ← .wrap 闭合
          5115 <script>
```

→ 与 `ec94b0e` 修好的 page-01 形态**完全同构**，三个作品现在结构一致 ✅

### 11.3 结构总验：改用**类名无关**判据（因为我的检查 12 v1 有盲点，见 §11.4）

判据：**`.wrap` 闭合之后不允许再出现任何 `div`**（不管它的 class 是什么）+ 模板内 div 必须完全闭合。

| 模板 | 作品 | `.wrap` 闭合 | 闭合后残留 div | `.wrap` 直接子 div 数 | 末层深度 | 判定 |
|---|---|---|---|---|---|---|
| `page-01` | 作品01 | 模板内第 168 行 | **0** | 10 | 0 | ✅ |
| `page-03` | 作品03 | 第 204 行 | **0** | 12 | 0 | ✅ |
| `page-05` | 作品05 | 第 592 行 | **0** | 35 | 0 | ✅ |
| `page-06` | 作品06 | 第 185 行 | **0** | 8 | 0 | ✅ |
| `page-07` | 作品07 | 第 186 行 | **0** | 11 | 0 | ✅ |
| 主页面 | — | — | **0** | — | 0 | ✅ |

同口径对比修复前（`ec94b0e`）：**page-05 有 6 个、page-06 有 6 个** div 落在 `.wrap` 之外（section 本体 + 其内部子元素）。
→ **修复彻底**：`page-05` 的 35 个直接子 div（含 `sec-header`、`kpi-grid`、`flow`、`chart-echarts`、`mockup`、`footer` 以及最后两个 `sec reveal`）现在全在 `.wrap` 内 ✅

附带核实（commit message 的说法是否属实）：
- "5 个作品中有 3 个有此 bug" → ✅ 属实（作品01/05/06；作品03/07 本来就正常）
- "本次全部修复" → ✅ 属实（3 个作品的 6 处越界现在全为 0）

### 11.4 ⚠️ 我提议的"检查 12"有覆盖盲点 —— 已给出加强版（v2）

**盲点**：v1 只检查 `class="sec reveal"` 的元素。但 **page-05 的 01–08 节用的是 `class="sec-header"`**（不是 `sec reveal`），所以 v1 对它们**视而不见**。
假如当初 page-05 的 01–08 也越界了，**v1 检查会漏报**。

**加强版（v2，替换 §4.1 的版本，判据从"类名"改成"位置"）**：

```python
def check_page_wrap_structure(html):
    """检查12（v2）：每个作品模板里
       ① .wrap 闭合之后不允许再出现任何 div（不限类名）
       ② 模板内 div 必须完全闭合
       ③ 模板里必须存在 .wrap"""
    errors = []
    for m in re.finditer(r'<script type="text/html" id="(page-[^"]+)">(.*?)</script>', html, re.S):
        name, body = m.group(1), m.group(2)
        if name == "page-proto2":
            continue
        body = re.sub(r'<script[^>]*>.*?<\\/script>', '\n', body, flags=re.S)
        body = re.sub(r'<!--.*?-->', '', body, flags=re.S)
        depth, wrap_depth, closed_at = 0, None, None
        for i, line in enumerate(body.split('\n'), 1):
            for tok in re.findall(r'<div\b[^>]*>|</div>', line):
                if tok.startswith('</'):
                    if depth:
                        depth -= 1
                    if wrap_depth and depth < wrap_depth and closed_at is None:
                        closed_at = i
                    continue
                depth += 1
                if 'class="wrap' in tok and wrap_depth is None:
                    wrap_depth = depth
                elif closed_at is not None:
                    cls = re.search(r'class="([^"]*)"', tok)
                    errors.append("%s: 第 %d 行有 div（class=%s）落在 .wrap 之外"
                                  "（.wrap 已在第 %d 行闭合）→ 移动端会失去卡片样式、占满屏幕宽度"
                                  % (name, i, cls.group(1) if cls else "无", closed_at))
        if wrap_depth is None:
            errors.append("%s: 模板里找不到 .wrap" % name)
        elif depth != 0:
            errors.append("%s: 模板内 div 未完全闭合（结束时仍有 %d 个未闭合）" % (name, depth))
    return errors
```

**三版本验证（证明它既能抓坏版本、也不误报好版本）**：

| 版本 | v1（旧，只盯 `.sec reveal`） | **v2（加强版）** |
|---|---|---|
| **HEAD `7fd8841`** | 0 | **0 ✅** |
| `ec94b0e`（w05/w06 未修） | 4 | **13**（多覆盖 `sec-head`/`verify-box`/`quote` 等子元素） |
| `700c01a~1`（w01 也没修） | 6 | **19** |

### 11.5 编码完好性 + 一条**重要修正**：`?/` 不能当乱码判据

- 现状：`index.html` 乱码特征 = **0**；没有任何 `?/div>` / `?/h1>` 形态的"闭标签被吃" ✅
- 但裸 `?/` 计数 = **1**，我查了它的来源：**`index.html:2797`** 的一行 JS 正则——
  `…(?:个|号|个作品|作品)?/;` 里的 `)?` + 正则结束符 `/` **恰好拼出 `?/`**，**是合法代码，不是损坏**。
- ⚠️ **因此修正我在 §4.3 / §5-M2 提过的"检查 9（乱码扫描）"的实现方式**：
  ❌ 不要用裸 `?/` 计数（会在**主文件上误报**，导致检查一上线就是红的、然后大家开始忽略它）；
  ✅ 用**标签形态**：`\?/(?:div|span|section|h1|h2|h3|h4|p|b|table|tr|td|title|label|button|script|style|body|html)>`
  （实测：对历史上真正坏掉的 demo 文件仍能抓到 **21/22** 处，对当前 `index.html` 抓到 **0** 处 ✅）
- 其余编码检查不变：乱码特征字表（`锛 銆 鈥 鐨 鏄 浣 涓 鐢 鑳 …`）命中即 fail。

### 11.6 回归工具（本轮实测）

| 工具 | 结果 |
|---|---|
| `python tools/preflight.py` | **exit 0**；检查 1–7 全绿；`✅ 覆盖率题: 25/25 有效作答 (100.0%)` |
| `node tools/coverage_test.js` | **exit 0**；`✅ 全部通过 — 越界3/3 断言9/9 覆盖率100.0% (≥95%)` |
| `python tools/verify_deploy.py` | exit 1，**唯一失败项是第 2 步"线上 ≠ 本地"** → 这正是"未 push"的必然结果，**不是缺陷** |

### 11.7 本轮新发现的小问题（🟢，都建议顺手修）

| 级别 | 事项 |
|---|---|
| 🟢 | **`tools/verify_deploy.py` 的 `--local-only` 参数根本没有实现**：文件头 `:4` 写着 `用法: python tools/verify_deploy.py [--local-only]`，但 `main()`（`:156-176`）**完全不读 `sys.argv`**，照旧发网络请求并做线上比对。后果：① 参数是假的，用户以为能离线跑；② **我上一轮 §5-M4 的 selfcheck 建议里写了 `verify_deploy.py --local-only`，那条建议不成立**（未 push 时它必然 exit 1）。修法二选一：真的实现它（跳过 `check_homepage`/`check_content_match`/`check_resources` 中的联网部分），或删掉这个假参数。 |
| 🟢 | `verify_deploy.py:114` 那句「可能是 GitHub Pages 还在部署中，等 1-2 分钟再试」在"本地领先远端"场景下依然误导（**第三次**提到）。建议先判 `git rev-list --count origin/master..HEAD`，非 0 时改提示「⚠️ 本地领先远端 N 个提交，线上必然落后（属正常）」。 |
| 🟢 | 3 处空行是本次修复顺带插入的（纯格式，无影响）；若你们有"提交越小越好"的偏好，下次可以只插 `</div>`。 |
| 🟢 | 仍未加 `preflight` 检查 9（乱码）/ 检查 12（结构，已给 v2）；`REVIEW_STAMP.md` + 分支保护（§10）也仍未落地——**本轮之所以没问题，是因为人做对了，不是机制在兜底**。 |

### 11.8 线上状态（未 push，属正常）

| 项 | 实测 |
|---|---|
| `git ls-remote origin master` | `ec94b0e…`（= 远端仍停在 `ec94b0e`） |
| 本地 HEAD | `7fd8841`，`git rev-list --count origin/master..HEAD` = **1** |
| 含义 | **线上作品05/06 的布局问题还没修**（要 push 后才生效）；`ec94b0e` 的 w01 修复线上已生效 ✓ |

**push 后请按 §16.8 的 3 步验收**：`git ls-remote`（应等于新 HEAD）→ `python tools/verify_deploy.py`（应 exit 0、第 2 步 ✅ 完全一致）→ 手机上看作品05/06 的「数据来源与假设说明」表格是否可读。

### 11.9 反思报告 5 问回答（**更新版**，含本轮新证据）

> 完整版见 §2–§6 + §10；这里只列结论与本轮新增的证据。

**Q1 根因分析是否准确？还有遗漏吗？**
→ 你的 4 条（"简单修复"心理、用户反馈≠验证、效率优先、执行不一致）**都成立**。
→ 我补的 5 条遗漏：① **"给用户看效果"与"push 上线"被绑在一起**（最关键的触发条件）；② 缺"同类扫描"这道工序；③ 规则只有自觉、没有闸门；④ commit/push 没有"是否已复核"的机读标记；⑤ hotfix 没有白名单，导致"紧急"成为万能通行证。
→ **本轮新证据（支持的）**：`7fd8841` 是"结构类改动 + 用户（你）在等复核"的情形，**它被正确地留在本地没有 push**（`ahead 1`）→ 说明违规的真实变量确实不是"改动大小"，而是**当时有没有把"等复核"当成默认动作**；一旦当成默认动作，等待成本是可以承受的。
→ **本轮新证据（反证的）**：同一个 `page-05/06` 问题，**如果没有做"同类扫描"，就会像 `ec94b0e` 那样只修 1/5**。这次 commit message 里明确写了"同类扫描发现 5 个作品中有 3 个有此 bug"——**工序一旦补上，问题一次就修完了**。这印证漏-2 是真因。

**Q2 对于"简单修复"，如何平衡效率和质量？**
→ 别用"简单/复杂"（主观、且每次都判错），用**形态白名单**：hotfix 只允许"纯恢复 / 单行纯文本 / 单行路径 / 单行关键词 / revert"；**任何标签增删移动、CSS 选择器、JS 逻辑、跨 2 文件以上 → 一律走常规通道**。
→ **本轮新证据**：`7fd8841` 的 diff 只有 **8 行**（2 删 6 增，其中 3 行还是空行），**看起来"极简单"**——但它是结构类改动，所以**正确地走了复核**。这恰好证明了判据必须看**形态**而不是**行数**：`ec94b0e` 当初也是 5 行，也一样"看起来简单"。
→ 口诀仍然是：**"改文字随便改，改结构必复核；用户催就给截图，不要 push。"**

**Q3 是否需要在 preflight 中增加新的检查项？**
→ 需要，而且**我上一轮给的 v1 有盲点，本轮已升级为 v2**（§11.4）：判据从"`.sec reveal` 是否在 `.wrap` 内"改成"**`.wrap` 闭合后是否还有任何 div**"，从而覆盖 `sec-header` 这类类名的 section。三版本验证：HEAD 0 / `ec94b0e` 13 / `700c01a~1` 19。
→ 检查 9（乱码扫描）也要加，但**务必用标签形态而非裸 `?/` 计数**（§11.5，否则主文件会误报）。
→ 这两条加起来约 50 行，能永久消灭"某作品的 section 漏在 `.wrap` 外"和"文件被写坏"两类事故。

**Q4 如何从机制上避免"第 3 次犯同样错误"？**
→ 完整阶梯见 §10（L0–L6）。核心三件：**L6 分支保护（master 禁直推、必须走 PR）** + **L5 复核凭证（按内容比对，CI 必过）** + **L4 commit-msg 强制"同类扫描"字段**。
→ **本轮新证据（最关键的一条）**：`7fd8841` 证明"人能做到"，但**机制仍然没有兜底**——
  本轮之所以没出事，是因为**你（用户）主动要求了复核**，而不是因为 CI/hook 拦住了什么。**换句话说：如果把这一轮换成"我赶时间、用户没提"，它就会变成第 4 次违规。**
  → 所以现在正是把 L5/L6 落地的时机：**趁"人做对了"的时候把机制补上，比等到第 4 次再补便宜得多。**

**Q5 作品01 的修复有潜在问题吗？（commit `ec94b0e`）**
→ 结论**升级**：`ec94b0e` 的修复动作本身正确（无 JS 副作用、无裁切、reveal 不受影响），当时的唯一问题是**只修了 1/5**；该问题已由 `7fd8841` **补齐**。
→ 现在全仓结构验证：**5 个作品模板 + 主页面，0 处 div 落在 `.wrap` 之外、div 全部闭合** ✅
→ 残余（非代码问题）：① 线上要 push 后才生效；② 手机端建议人工看一眼（我本机无 playwright，无法渲染实测）；③ 加检查 12 v2 防复发。

### 11.10 判定与下一步

**🚦 判定：`7fd8841` ✅ 可以 push**（结构修复正确、内容无丢失、编码干净、工具全绿；线上风险为零，因为它是修 bug 不是加功能）。

下一步（按顺序）：
1. **push `7fd8841`** → 按 §11.8 做 3 步线上验收；
2. 把 **检查 12 v2**（§11.4）与**检查 9（标签形态）**（§11.5）加进 `preflight.py`；
3. 修 `verify_deploy.py` 的假参数 `--local-only`（§11.7）；
4. 落地 §10 的 L5/L6（复核凭证 + 分支保护）——**本轮已经证明"人能做到"，现在要让它变成"做不到不做"**。

---

## §12 第十三轮：验证 `80990c8`（preflight 检查 8/9 + `verify_deploy --local-only`）

> 基线：`HEAD = 80990c8`（**本地领先 `origin/master = 7fd8841` 1 个提交，未 push** ✅ 连续第二次把改动留给复核）
> 范围：检查 8（编码乱码扫描）、检查 9（wrap 容器结构 v2）、`verify_deploy.py --local-only`。

### 12.1 验收总表

| # | 对象 | 判定 | 关键证据 |
|---|---|---|---|
| 1 | **检查 9**（`.wrap` 结构 v2） | ✅ **完全正确** | 三版本实测：HEAD **0** / `ec94b0e` **13** / `700c01a~1` **19**，与我的 v2 行为逐条一致；接线到 `all_errors` 正确 |
| 2 | **检查 8**（乱码扫描）函数实现 | ✅ **正确** | 对 4 个历史坏文件全部能抓到；采用了"标签形态"（未用裸 `?/`，采纳了 §11.5 的修正）；多字序列按**子串**匹配（正确，见 §12.4） |
| 3 | **检查 8** 的**扫描范围** | 🟡 **对准了错的目标** | `main()` 只喂 `index.html`（`preflight.py:22/260`），而**历史上 4 次乱码事故全部发生在 `demo/*.html`** → 沙箱实验证实**它拦不住它要拦的那类事故**（见 §12.3） |
| 4 | `verify_deploy.py --local-only` | ✅ **真实实现且正确** | 死代理实验：`--local-only` 仍 exit 0，完整模式同代理下 exit 1 → **证明本地模式确实不联网** |
| 5 | 「本地领先远端」提示修复 | ✅ **两分支实测通过** | 领先 1 时打印 `⚠️ 本地领先远端 1 个提交…（属正常）` 并 `return True`；不领先时回落到原提示并 `return False` |
| 6 | 整体回归 | ✅ | `preflight.py` exit 0（检查 1–9 全绿）；`verify_deploy.py` 完整模式 exit 0（线上 = 本地 HEAD） |

### 12.2 检查 9：与我的 v2 逐字一致（✅）

代码与我在 §11.4 给的 v2 **逐字一致**（判据：`.wrap` 闭合后不允许再出现任何 div + 模板 div 必须闭合 + 模板必须有 `.wrap`），并正确接入 `main()`（`:267-273`）。
实测（直接 import `tools/preflight.py` 调函数）：

| 版本 | 报错数 | 首条样例 |
|---|---|---|
| `HEAD`（已修） | **0** ✅ | — |
| `ec94b0e`（w05/w06 未修） | **13** | `page-05: 第 564 行有 div（class=sec reveal）落在 .wrap 之外…` |
| `700c01a~1`（w01 也没修） | **19** | `page-01: 第 143 行有 div（class=sec reveal）落在 .wrap 之外…` |

→ 与我在 §11.4 给出的三版本验收数字（0 / 13 / 19）**完全一致**，实现无误。

### 12.3 🟡 检查 8 的核心问题：**函数是对的，但只盯着 `index.html`**

**函数能力测试**（我直接拿 4 个历史坏文件喂给它）：

| 历史坏文件 | 标签形态命中 | 特征字命中 | 函数报错 |
|---|---|---|---|
| `demo/LPR蒙特卡洛预测模拟器.html`（`c4d89e3`） | 12 | 55 | ✅ 抓到 |
| `demo/供应链现金流压力测试模拟器.html`（`c4d89e3`/`1ac0649`） | 21 | 123 | ✅ 抓到 |
| `demo/现金流压力测试模拟器.html`（`c4d89e3`） | 23 | 140 | ✅ 抓到 |
| `index.html`（同期） | 0 | 0 | —（本来就没坏） |

**→ 函数本身完全可用。问题在"它被喂什么"**：
- `preflight.py:20` `HTML_FILE = …/'index.html'`；`:22` `load_html()` 只读这个文件；`:260` `check_encoding_garbled(html)` 拿到的就是它。
- 而**历史上 4 次乱码事故 100% 发生在 `demo/*.html`**（`c4d89e3` 坏 3 个、`1ac0649` 坏 1 个）。

**沙箱实验（决定性）**：我把仓库必要文件复制到临时目录，并把**历史上真正坏掉的那个 demo 文件原样放回**，然后跑 `preflight.py`：

```
🔍 检查8：编码乱码扫描
  ✅ 通过          ← 坏文件就在 demo/ 里，但检查根本没看它
🔍 检查9：作品模板.wrap容器结构
  ✅ 通过
✅ 全部通过，可以提交
exit = 0
```

→ **结论：这个检查目前拦不住它被创建出来要拦的那类事故。**
→ 比"少一个检查"更需要注意的是：它会给人**虚假的安全感**——团队从此以为"乱码有检查了"，而真正最常被写坏的文件（`demo/*.html`）不在扫描范围内。

**最小修法**：把扫描对象从 `index.html` 换成"**所有被 git 跟踪的文本文件**"（实现见 §12.5，已实测）。

### 12.4 我自己的两次更正（避免把错建议写进报告）

**(a) 我一度想"把特征字合并成一个字符集"——那是错的。**
我算出转义串时把多字序列（`涓嶅` / `鎴戜滑` / `鍙<FFFD>`）也拆成了单字，结果引入了 `滑`（U+6ED1）——而它是**正文常用字**：`index.html:1170` 就有「← 左右滑动查看完整表格 →」。
→ 实测：拆分写法在当前仓库误报 **45 条**；而**他们现在的写法（多字序列整串 `count`）是正确的** ✅ 这一点他们做对了，我不该改。

**(b) 我一度以为"检查 8 抓不到 `c4d89e3` 的损坏"——那是我自己的枚举 bug。**
我用 `git show --name-only` 取文件名时，中文名被 `core.quotepath` 转义成 `"demo/\344..."`（**不以 `.html` 结尾**），于是只匹配到 `index.html`。
→ 加 `-c core.quotepath=false` 重测后：**3 个坏 demo 全部被抓到** ✅（教训：这个坑我这轮又踩了一次，已写进 §12.7 的复核规范）

**(c) 特征字表的"安全性"我逐个筛过**：他们的 11 个单字（`锛銆鈥鐨鏄浣涓鐢鑳鍦鏈鍙`）在**146 个被跟踪文件里命中数全部为 0** ✅ 无当前误报；3 个多字序列同样 0 命中 ✅。
（提示：`涓`/`鏈` 在**繁体/文言**语境里是合法字，将来若正文出现会误报——收益很低，不急着处理。）

**(d) ⚠️ 我推荐的那段代码自己藏了一个更隐蔽的 bug —— 靠"原样执行"才抓出来。**
我最初的 §12.6 版本用 `git ls-files` 枚举，再按 `endswith(('.html',…))` 过滤。**但 `git ls-files` 默认 `core.quotepath=true`，会把中文文件名转义成 `"demo/\344\276…html"`（带引号、不以 `.html` 结尾）→ 被 endswith 静默漏掉。**

| 枚举方式 | 能通过 `endswith` 过滤的文件数 |
|---|---|
| 默认（`git ls-files`） | **105** / 147 |
| 加 `-c core.quotepath=false` | **147** / 147 |

→ **漏掉的 42 个恰好是 `demo/` 与 `versions/` 里的中文名文件——也就是这个检查最该看的那些。**
→ 危险之处在于它是**静默失效**：在当前仓库上它照样返回"0 条报错"，看起来完全正常；只有把历史坏文件放回沙箱（那文件是中文名）才暴露出来。
→ **修法：`["git", "-c", "core.quotepath=false", "ls-files"]`**（§12.6 已是修正版，并在 docstring 里把这条列为要点①）。
→ 这件事本身也说明：**给别人的代码必须在"含有真实事故样本"的环境里跑一遍**，否则等于把坑转手给了对方。

### 12.5 扩到全仓时必须先处理的两个自命中坑（实测）

| 坑 | 实测证据 | 处理 |
|---|---|---|
| ① **`tools/preflight.py` 会自命中两次** | (i) 特征字表**字面量**就在源码里 → 14/14 全命中；(ii) `:125` 注释里写着示例 `?/div>、?/span>` → 标签形态命中 **2** 处 | 排除自身（`if f == "tools/preflight.py": continue`）**或**把表写成 `\uXXXX` 转义、注释里的示例也改写 |
| ② **我的复核报告也含这张表** | `REVIEW_REPORT_v6.md` 命中 5 种特征字；但它被 `.gitignore:20` 忽略（`git check-ignore` 已确认） | 用 **`git ls-files`** 枚举（天然排除未跟踪文件）；**不要用 `os.walk` 扫目录**，否则它会把我的报告算进去 → **永久误报** |

### 12.6 可直接粘贴的全仓版实现（**已实测：当前 0 报错 / 历史坏文件全抓**）

```python
def check_encoding_garbled_repo():
    """检查8（v2·全仓）：扫描所有被 git 跟踪的文本文件，发现乱码即报错。
       为什么要全仓：历史上乱码事故全部发生在 demo/*.html，只扫 index.html 拦不住。
       四个要点（均已实测）：
         ① **必须带 `-c core.quotepath=false`**：否则中文文件名会被转义成 "demo/\344..."，
            不以 .html 结尾 → **被 endswith 静默漏掉**（实测：默认模式只能扫到 105/147 个文件，
            漏掉的 42 个恰好是 demo/ 与 versions/ 里的中文名文件——本检查的主要目标）
         ② 用 git ls-files 枚举 → 天然排除未跟踪的复核报告（它们也含特征字表）
         ③ 排除本文件自身 → 本文件含特征字表字面量与 `?/div>` 注释，否则必然自命中
         ④ 多字序列必须整串匹配，不能拆成单字（会误报，如『滑』）
    """
    import subprocess
    TAG = r'\?/(?:div|span|section|h1|h2|h3|h4|p|b|table|tr|td|title|label|button|script|style|body|html)>'
    SINGLE = "\u951b\u9286\u9225\u9428\u93c4\u6d63\u6d93\u9422\u9473\u9366\u93c8\u9359"
    SEQS = ["\u6d93\u5d85", "\u93b4\u621c\u6ed1", "\u9359\ufffd"]   # 多字序列：整串匹配
    exts = (".html", ".js", ".py", ".md", ".css", ".sql", ".txt", ".csv", ".yml", ".json")
    listing = subprocess.run(["git", "-c", "core.quotepath=false", "ls-files"],   # ①
                             cwd=HTML_FILE.parent, capture_output=True,
                             text=True, encoding="utf-8", errors="replace").stdout.split("\n")
    errors = []
    for f in [x.strip() for x in listing if x.strip().endswith(exts)]:
        if f == "tools/preflight.py":          # ③
            continue
        try:
            text = open(HTML_FILE.parent / f, encoding="utf-8").read()
        except Exception:
            continue
        hits = re.findall(TAG, text)
        if hits:
            errors.append(f"  {f}: 发现 {len(hits)} 处闭标签被吃掉的乱码（如 {hits[0]}）")
        bad = sorted({c for c in text if c in SINGLE})
        bad += [s for s in SEQS if s in text]
        if bad:
            errors.append(f"  {f}: 发现乱码特征（{''.join(bad[:5])}）")
    return errors
```

**实测有效性**（我把这段代码**原样抽出来执行**，不是"看着对"）：

| 被测对象 | 结果 |
|---|---|
| 当前 `HEAD`：147 个被跟踪文本文件（含 43 个 `.html`、含 `versions/` 归档） | **0 条报错** ✅ |
| `versions/` 归档目录（13 个历史版本） | 0 条 → **当前干净，不必排除** ✅ |
| 沙箱：放回 `1ac0649` 那个真正坏掉的 demo 文件（中文名） | **2 条报错，抓到** ✅（`21 处闭标签…` + `乱码特征（浣涓鈥銆鍙）`） |
| `c4d89e3` 的 3 个坏 demo | **6 条报错，全部抓到** ✅ |

（原 `check_encoding_garbled(html)` 可以保留，或直接由上面这个取代。）

### 12.7 `--local-only`：**真实实现且正确**（✅ 含"不联网"的硬证明）

| 测试 | 结果 |
|---|---|
| `python tools/verify_deploy.py --local-only` | exit **0**；输出 `模式: --local-only（仅本地检查，不联网）` → 本地关键内容 4 项 ✅ + 旧文案 3 项无残留 ✅ |
| **把 `http_proxy`/`https_proxy` 指向死端口（127.0.0.1:9）后再跑 `--local-only`** | **仍 exit 0** ✅ → 证明它**完全没有发起网络请求** |
| 同一坏代理下跑**完整模式** | `❌ 失败: [WinError 10061] 目标计算机积极拒绝` → exit 1 → **反证**本地模式确实绕过了网络 |
| 完整模式（正常网络） | exit 0；`1. 首页 ✅ 200`、`2. 线上与本地HEAD ✅ 完全一致`、8 个资源全 200 |

**提示语修复实测**（我用桩替换 `get_local_head` 触发不一致分支）：

```
模拟"内容不一致 + 本地领先 1 个提交"：
   ❌ 不一致（本地=…，线上=…）
       ⚠️ 本地领先远端 1 个提交，线上必然落后（属正常，push后即可一致）
   返回值 = True    ✅ 不再判失败
模拟"内容不一致 + 本地不领先（计数=0）"：
       可能是GitHub Pages还在部署中，等1-2分钟再试
   返回值 = False   ✅ 正确回落原提示
```

→ 我在 §11.7 提的两条（假参数 + 误导提示）**都已修好，且实现方式正确** ✅

### 12.8 建议再补两点（都不阻塞 push）

| 级别 | 事项 |
|---|---|
| 🟡 | **检查 8 扩到全仓**（§12.6 代码可直接粘贴）。这是本轮唯一实质缺口：目前它守的是 `index.html`，而事故 100% 发生在 `demo/`。 |
| 🟢 | `--local-only` 只做"关键内容抽查"，**不跑结构/编码检查**（检查 1–9）。若想实现我 §5-M4 说的"一条命令自查"，建议本地模式里加调 `check_encoding_garbled_repo()` 与 `check_page_wrap_structure()`（或干脆让 selfcheck 脚本串联 `preflight.py` + `--local-only`）。 |
| 🟢 | 特征字表里 `涓`/`鏈`/`浣` 在繁体或文言语境下是合法字（将来正文若出现会误报）——收益低，记录备查即可。 |

### 12.9 判定与下一步

**🚦 判定：`80990c8` ✅ 可以 push**
理由：两个新检查**无回归**（`preflight.py` exit 0、检查 1–9 全绿）、检查 9 完全正确、`--local-only` 与提示语修复都正确且优于原状；唯一缺口（检查 8 范围）是"新增能力不完整"，不是"引入了错误"。

但要清楚一件事：**在检查 8 扩到全仓之前，"乱码有检查了"是个错觉。** 建议 push 后**紧接着**补上 §12.6，否则下一次 demo 文件被写坏时，CI 依然会亮绿灯（这一点我在第九轮已经用 `1ac0649` 亲眼验证过一次）。

下一步（按顺序）：
1. push `80990c8`；
2. 把 §12.6 的全仓版接进 `preflight.py`（约 30 行）→ 之后可用"故意把某个 demo 文件写坏"来验证它真的会红；
3. 落地 §10 的 L5/L6（复核凭证 + 分支保护）——这是唯一能让"忘记复核"变成"做不到"的东西。

### 12.10 复核规范增补（本轮教训）

1. **枚举中文文件名必须 `git -c core.quotepath=false`（或用 `-z`）**：本轮我又踩了一次——`git show --name-only` 的转义输出让我一度误判"检查 8 抓不到历史损坏"（§12.4b）。
2. **给别人的"改进建议"必须先在自己这边跑一遍**：本轮我"合并特征字表"的想法若直接写进报告，会让他们把一个本来正确的实现改成**误报 45 条**的版本（§12.4a）。
3. **验证"检查是否有效"要用"它能不能抓到历史真实事故"作为判据**，而不是"它在当前版本上是否通过"——沙箱里放回历史坏文件，是成本最低、最接近真实的验证方式（§12.3）。
4. **推荐的代码要"原样抽出来执行"，而不是靠阅读判断**：§12.4d 那个 `core.quotepath` 静默漏扫 bug，在读代码时完全看不出来（它在当前仓库返回的结果也是 0 报错、看起来正确），只有在**含中文名坏文件的沙箱**里运行才暴露。**从今往后，我给出的任何代码补丁都以"在原样执行 + 含真实事故样本"为验收前提。**

---

## §13 第十四轮：验证 `a9ad5c8`（全仓版乱码扫描）—— **三项专项全部通过**

> 基线：`HEAD = a9ad5c8`（**本地领先 `origin/master = 80990c8` 1 个提交，未 push** ✅ 连续第三次把改动留给复核）
> 验证方法：把 `tools/preflight.py` 里的 `check_encoding_garbled()` **原样抽出执行**（不是复制我的版本）；
> 用 monkeypatch 记录它**实际打开了哪些文件**；沙箱里放回**真实事故样本**。
> ⚠️ 沙箱建目录的坑（本轮实测，供复现参考）：必须用 **`os.makedirs(os.path.join(tempfile.gettempdir(), "固定名"))`**。
> 用 `tempfile.mkdtemp()`（mode 0700）建出的目录在本机**既无法在其中建子目录（`WinError 5`）、事后也无法删除**（连 `icacls` 都被拒），
> 而在 `tempfile.gettempdir()` 下用固定名 `makedirs` 建的沙箱 14 轮全部建删正常。属测试环境问题，与他们的代码无关。

### 13.1 验收总表：**你点名的三项全部通过**

| # | 验证项 | 判定 | 关键数字 |
|---|---|---|---|
| ① | **中文文件名是否被正确枚举** | ✅ **通过** | 应扫 **146** 个（147 个被跟踪文本文件 − 自身），**实际读到 146**；其中**中文名文件 42/42 全部读到**，无漏读、无多读 |
| ② | **能否抓到历史坏 demo 文件** | ✅ **通过** | **4/4** 个历史事故样本全部抓到（各 2 条报错）；**对照实验**：同位置放当前干净版本 → 0 报错（不会"凡中文名就报"） |
| ③ | **当前仓库是否 0 误报** | ✅ **通过** | 函数返回 **0 条**；逐文件 × 逐字符全量核对 **147 个文件无一命中**（含 42 个中文名、含 `versions/` 13 个归档版本） |
| ④ | 端到端 | ✅ | `python tools/preflight.py` → 检查 1–9 全绿、`✅ 全部通过，可以提交`、**exit 0**；CI 已接入（`pages.yml:27`） |

### 13.2 ① 中文文件名枚举：✅（含"它到底读了哪些文件"的实测）

**验证方法**：把函数原样 exec，并把内建 `open` 换成记录器，逐一记下被打开的文件路径，再与 `git -c core.quotepath=false ls-files` 的清单对比。

| 指标 | 数值 |
|---|---|
| 被跟踪文本文件（`.html/.js/.py/.md/.css/.sql/.txt/.csv/.yml/.json`） | **147** |
| 应扫（排除 `tools/preflight.py` 自身） | **146** |
| **实际被打开** | **146** ✅ |
| 其中中文名文件 | 应扫 **42** / 实读 **42** ✅ |
| 漏读 / 多读 | **无 / 无** ✅ |

实际读到的中文名样例（证明 `core.quotepath=false` 生效）：
```
demo/LPR蒙特卡洛预测模拟器.html
demo/SOX控制测试工作台.html
demo/供应链现金流压力测试模拟器.html
demo/现金流压力测试模拟器.html
versions/v3_10/demo/SOX控制测试工作台.html
versions/v3_10/胡凯-AI财务作品集.html
```
关键实现（`tools/preflight.py`）：`subprocess.run(["git", "-c", "core.quotepath=false", "ls-files"], …)` ✅
—— 与我在 §12.4d 给的修正一致；若少了 `-c core.quotepath=false`，实测只能枚举到 **105/147**，**漏掉的 42 个恰好全是中文名文件**（= 这个检查的主要目标）。

### 13.3 ② 抓历史坏 demo：✅ 4/4，且对照不误报

沙箱里放回**真实事故样本**（中文文件名、原始字节不动），用他们的函数跑：

| 事故 | 样本文件 | 报错 | 实际输出（节选） |
|---|---|---|---|
| `c4d89e3` | `demo/供应链现金流压力测试模拟器.html` | **2** ✅ | `…发现 21 处闭标签被吃掉的乱码（如 ?/title>）` + `…乱码特征（浣涓鈥銆鍙）` |
| `c4d89e3` | `demo/现金流压力测试模拟器.html` | **2** ✅ | `…发现 23 处…（如 ?/span>）` |
| `c4d89e3` | `demo/LPR蒙特卡洛预测模拟器.html` | **2** ✅ | `…发现 12 处…（如 ?/title>）` |
| `1ac0649` | `demo/供应链现金流压力测试模拟器.html` | **2** ✅ | `…发现 21 处…` |

**对照实验（防止"中文名一律报错"的假通过）**：同一沙箱、同一中文文件名，只把内容换成**当前的干净版本** → **0 条报错** ✅
→ 说明它是靠**内容特征**判定的，与文件名无关。

### 13.4 ③ 当前仓库 0 误报：✅

- 函数整体返回 **0 条** ✅
- 逐文件 × 逐字符全量核对（147 个文件、11 个特征字 + 3 个多字序列 + 标签形态）：

| 文件类别 | 命中情况 |
|---|---|
| `index.html` / `demo/*`（4 个）/ `versions/**`（13 个归档版） | **0 命中** ✅ |
| 其余 `.py/.js/.md/.sql/.txt/.csv/.yml` | **0 命中** ✅ |
| `tools/preflight.py`（**本文件自身**） | 特征字 **0 种**、标签形态 **1 处**（来自它自己 docstring 里那句 `?/div>` 说明）→ 函数**已排除自身**，不计入误报 ✅ |

**顺带一个改进**：`80990c8` 时它自身命中的是"14 种特征字 + 2 处标签形态"；本提交把特征字表改成 `\uXXXX` 转义后，**字面量命中降到 0 种** ✅（自我排除仍然保留，作为兜底，做法正确）。
→ 也确认了：**用 `git ls-files` 枚举天然排除了我的复核报告**（`REVIEW_REPORT*.md` 含特征字表但未被跟踪；`git check-ignore` 已确认）——若改用 `os.walk` 扫目录，这里会永久误报。

### 13.5 🟡 本轮新发现（唯一一条）：**非法 UTF-8 的文件会被静默跳过**

`for f in …: try: open(..., encoding="utf-8").read() except Exception: continue`
—— 这个 `except Exception: continue` 会把**解码失败的文件直接跳过**。而"解码失败"恰恰是**同一类 Windows 编码事故的另一种形态**：文件被按 GBK 存盘。

**实测（沙箱，中文名 demo 文件）**：

| 场景 | 原版函数的报错数 | 浏览器里的实际表现 |
|---|---|---|
| `demo/现金流压力测试模拟器.html` 被**按 GBK 存盘**（`Set-Content` 不带 `-Encoding UTF8` 的典型产物，字节 23856 vs 原 24995） | **0 条 → 静默放过** ❌ | `<meta charset="UTF-8">` + GBK 字节 → **整页乱码（用户可见）** |
| 文件中部混入 `\xff\xfe`（写入被截断/损坏） | **0 条 → 静默放过** ❌ | 同样可见乱码 |
| 对照：历史事故的真身（乱码但**仍是合法 UTF-8**） | 2 条 ✅ | 被抓到 |

→ 也就是说：**这次提交覆盖了历史上出现过的那种形态（合法 UTF-8 的乱码），但漏掉了"按 GBK 存盘"这一变体**——而后者正是 PROJECT_BRIEF 那条新规则（"禁止 PowerShell `Set-Content`"）想防的东西。危险性与 §12.3 同类：**它看起来在防护，实际上对这种形态完全无感**。

**修法（我已实测，无回归）**：把宽泛的 `except Exception` 细化为 `UnicodeDecodeError` → **报错**（位置：`tools/preflight.py:147`）：

```python
        try:
            text = open(HTML_FILE.parent / f, encoding="utf-8").read()
        except UnicodeDecodeError as ex:
            # 非 UTF-8 的文本文件本身就是缺陷（例如被 Set-Content 按 GBK 存盘）→ 必须报错，不能静默跳过
            errors.append(f"  {f}: 不是合法 UTF-8（{ex}）→ 浏览器会整页乱码")
            continue
        except Exception:
            continue
```

**验证结果**：

| 被测场景 | 原版 | 修正版 |
|---|---|---|
| GBK 存盘的 demo（中文名） | 0 条（静默放过）❌ | **1 条 ✅**（`不是合法 UTF-8（'utf-8' codec can't decode byte 0xbc in position 145…）`） |
| **当前仓库**（147 个文件） | 0 条 | **0 条 ✅ 无回归** |
| 历史乱码文件（`1ac0649`） | 2 条 | **2 条 ✅ 仍能抓到** |
| 前置确认：当前 147 个被跟踪文本文件是否全为合法 UTF-8？ | — | **✅ 全是** → 采纳修法**不会**造成现有失败 |

### 13.6 判定与下一步

**🚦 判定：`a9ad5c8` ✅ 可以 push。**
你点名的三项专项验证**全部通过**（中文名 42/42 枚举、4/4 抓历史事故、当前 0 误报），并且实现与 §12.6 的建议一致（`core.quotepath=false`、排除自身、多字序列整串匹配三点都落实了，特征字表还升级成了转义写法）。这次把 §12.3 那个"缺口的缺口"真正补上了 —— **从现在起，CI 能在 demo 文件被写坏的那一刻拦住它**。

🟡 §13.5 的"非法 UTF-8 静默跳过"建议**紧接着补**（3 行改动、已实测无回归）；不阻塞本次 push。

下一步：
1. push `a9ad5c8`；
2. 补 §13.5 的 3 行（`except UnicodeDecodeError` → 报错）；
3. 落地 §10 的 L5/L6（复核凭证 + 分支保护）——**这已是第四次提醒**：本轮依然是靠人自觉把改动留在本地等我复核的，机制仍未兜底。

### 13.7 复核规范增补（本轮教训）

1. **"检查是否有效"要做三类测试**：① 枚举范围（它到底读了哪些文件——用 monkeypatch 记录，而不是读代码推测）；② 正样本（历史事故样本必须能抓到）；③ 负样本（同位置放干净文件必须不报）。**只测"当前仓库 0 报错"会把"静默漏扫"误判成通过**（§12.4d 的 quotepath bug 就是这样躲过一次的）。
2. **要专门测"检查的静默失败路径"**：凡是 `except: continue` 的地方，都要问一句"被它吞掉的那种情况，是不是恰好也是事故形态？"（本轮 §13.5 就是这样发现 GBK 存盘被放过）。
3. **沙箱要建在 harness 临时区**（`tempfile.gettempdir()`）内，且**用固定名 `makedirs`**：`tempfile.mkdtemp()` 在本机建出的目录（mode 0700）既不能写入也不能删除（本轮遗留了两个空目录 `%TEMP%\r14py_bkop2xub`、`%TEMP%\r14_xgjy06s5`，连 `icacls` 都拒绝，**未能清理，特此说明**）。

---

## §14 第十五轮：验证 `b015442`（`UnicodeDecodeError` 处理）—— **GBK 存盘会被报错，不再静默跳过**

> 基线：`HEAD = b015442`（**本地领先 `origin/master = a9ad5c8` 1 个提交，未 push** ✅ 连续第四次把改动留给复核）
> 你问的两点：**① 异常处理是否正确 ② GBK 存盘文件是否会被报错而不是静默跳过** —— 都已实测确认。✅

### 14.1 验收总表

| # | 验证项 | 判定 | 证据 |
|---|---|---|---|
| 1 | **异常分支顺序是否正确**（决定新分支是否为死代码） | ✅ **正确** | `except UnicodeDecodeError` 在 **`:147`**，`except Exception` 在 **`:151`** → 前者先匹配，**可达** |
| 2 | **GBK 存盘文件是否被报错** | ✅ **会报错** | 沙箱实测：`preflight.py` **exit 1**，并打印 `demo/现金流压力测试模拟器.html: 不是合法 UTF-8（'utf-8' codec can't decode byte 0xbc in position 145: invalid start byte）→ 浏览器会整页乱码` |
| 3 | 报错后是否 `continue`（不再拿不存在的 text 去扫） | ✅ | 函数级实测：该文件只被提及 **1 次**，无重复报错 |
| 4 | 是否影响原有能力（历史乱码仍能抓） | ✅ 无回归 | 历史坏 demo → 仍报 **2 条**（标签形态 + 特征字） |
| 5 | 是否误伤当前仓库 | ✅ 无回归 | 真实 `preflight.py` **exit 0**；147 个被跟踪文本文件**全部是合法 UTF-8** |
| 6 | 错误信息是否可用 | ✅ | 同时含**文件路径**（中文名正确显示）与**具体原因**（字节位置 + 类型） |

### 14.2 关键点一：异常顺序（这是这类改动最容易写错的地方）

`UnicodeDecodeError` 是 `ValueError` 的子类 → 也是 `Exception` 的子类。**如果 `except Exception` 写在前面，新分支永远匹配不到，等于没改**（而且表面看起来"代码加了"）。

实测行号：
```
tools/preflight.py:147   except UnicodeDecodeError as ex:
tools/preflight.py:151   except Exception:
```
→ **顺序正确** ✅，并用下面的端到端用例反证它确实可达（若顺序反了，GBK 用例会走 `except Exception: continue`，exit 会是 0）。

### 14.3 关键点二：端到端实证（沙箱放坏文件 → 跑**真实的 `tools/preflight.py`**）

方法：沙箱（`tempfile.gettempdir()` + 固定名目录 + `git init/add/commit`）里放入一种坏文件，然后**执行他们仓库里那份 `preflight.py`**（不是我复制的函数），看退出码与检查 8 的输出。

| 场景（中文名 demo 文件） | 合法 UTF-8 | `preflight` exit | 检查 8 输出 |
|---|---|---|---|
| **GBK 存盘**（`Set-Content` 不带 `-Encoding UTF8` 的产物） | ❌ 否 | **1** ✅ | `…现金流压力测试模拟器.html: 不是合法 UTF-8（…byte 0xbc in position 145…）→ 浏览器会整页乱码` |
| **UTF-16LE + BOM**（PowerShell `>` 重定向的产物） | ❌ 否 | **1** ✅ | `…供应链现金流压力测试模拟器.html: 不是合法 UTF-8（…byte 0xff in position 0…）` |
| **中部混入非法字节**（写入被截断/损坏） | ❌ 否 | **1** ✅ | `…SOX控制测试工作台.html: 不是合法 UTF-8（…byte 0xff in position 3000…）` |
| 对照A：历史事故真身（乱码但**仍是合法 UTF-8**） | ✅ 是 | **1** ✅ | `…发现 21 处闭标签被吃掉的乱码（如 ?/title>）` + `…乱码特征（浣涓鈥銆鍙）` |
| 对照B：完全干净的文件 | ✅ 是 | **0** ✅ | `✅ 通过` |

→ **你问的核心问题得到确认：GBK 存盘的文件会被报错，且会让 preflight 以 exit 1 拦住提交**，不再静默跳过。
→ 顺带覆盖了两个同类现实事故形态：**UTF-16 重定向**（PowerShell `>` 的默认产物）和**写入截断**。

### 14.4 函数级行为（避免"报错方式本身有问题"）

同一沙箱内同时放：GBK 文件 + 历史乱码文件 + 干净文件，直接调他们的函数：

| 检查 | 结果 |
|---|---|
| 报错总条数 | **3** |
| GBK 文件被提及次数 | **1**（报完即 `continue`，不会重复报） |
| 历史乱码文件被提及次数 | **2**（标签形态 + 特征字，能力未丢） |
| 干净文件被提及次数 | **0**（不误伤） |
| 信息是否含文件名与原因 | ✅ 都含 |

### 14.5 无回归佐证

- 真实 `python tools/preflight.py` → 检查 1–9 全绿、`✅ 全部通过，可以提交`、**exit 0**
- 当前 147 个被跟踪文本文件**全部是合法 UTF-8** → 新分支**不会**在现有内容上误伤（这是采用该修法的前置条件，我在 §13.5 已先行确认，本轮复测一致）

### 14.6 🟢 顺带发现：扫描范围里的"扩展名名单"是个小口子（不阻塞）

"全仓扫描"实际是"**扩展名白名单**扫描"：被跟踪 **173** 个文件 → 扫 **147** 个，未扫 **26** 个：

| 未扫的 26 个 | 数量 | 是否文本 | 说明 |
|---|---|---|---|
| `versions/*/demo/*.bat` | 16 | 文本，但**实测全是纯 ASCII** | 现役 `demo/` 下**没有** `.bat`；纯 ASCII 文件不会出现"乱码特征字"，但理论上仍可能被 UTF-16 重定向写坏 |
| `assets/*.png` + `demo/lpr_mc_paths.png` | 8 | 二进制 | 正确排除 ✅ |
| `.gitignore` / `.gitattributes` | 2 | 文本（UTF-8） | 无关紧要 |

→ 建议二选一：① 把 `.bat/.sh/.ps1/.xml/.svg/.cmd` 与无扩展名文件也纳入（会略微增加扫描量）；② **在代码里注释写明"只扫这些扩展名"是有意为之**。否则后人会把它当成漏配（本轮我就先当成缺口查了一遍，才发现 `.bat` 全是 ASCII）。

### 14.7 顺带发现（文档层，均不阻塞本次 push）

**(a) 🟡 `CHANGELOG.md:19` 的声明**至今仍不属实**（我在 §16.5 提过，这是第二次提）**

原文（`CHANGELOG.md:19`）：
> - Windows GBK编码陷阱已第5次复发，**已在 PROJECT_BRIEF.md 固化规则**：写HTML/demo文件必须用Python io.open(encoding='utf-8', newline='')，禁止PowerShell Set-Content

实测（本轮重新核对）：

| 文件 | `io.open` | `newline` | `encoding` | `乱码` | `Set-Content` | `UTF-8` |
|---|---|---|---|---|---|---|
| `PROJECT_BRIEF.md` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DECISIONS.md` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

→ **这条规则只存在于 CHANGELOG 的一句话里**，项目规范文件与决策记录里都没有。
→ 为什么这条比其他 🟢 重要：它是"5 次复发事故"的**防复发措施本身**；CHANGELOG 写了"已固化"，会让所有人（包括未来的我）以为规则已生效而不再补。**而工具侧（检查 8）刚刚做得很完整，规范侧却还是空的——两边不匹配。**
→ 可直接粘贴的规则条款见 **§16.5**（四段式：写文件用 `io.open(encoding='utf-8', newline='')`、读子进程用 `encoding='utf-8'`、脚本 stdout 用 `reconfigure`、恢复类操作同时验内容与编码）。

**(b) 🟢 `CHANGELOG.md` 里 `## v5.3.4（2026-09-12）` 出现了两次**

- `:3` = 第八~九轮复核的那批修复（后加的）
- `:43` = 原本的 v5.3.4 条目（第四轮复核 / 安全 / 文档）
- 中间还隔着 `## v5.3.3`（`:21`）→ 阅读顺序变成 **v5.3.4 → v5.3.3 → v5.3.4**，读者无法判断哪个是权威版本。
→ 建议二选一：把新条目并入 `:43` 那个 v5.3.4 段（同一版本只出现一次），或把它改名成 `## v5.3.5（2026-09-13）`。

**(c) 🟢 CHANGELOG 未覆盖最近的工具类提交**：`80990c8` / `a9ad5c8` / `b015442` 三个提交都没动 CHANGELOG（搜 `检查8`/`检查9`/`乱码扫描`/`local-only` 全为 ❌）。
→ 这三个是工程基建（preflight 检查 8/9、`--local-only`、全仓乱码扫描），建议在 CHANGELOG 里加一条"工程"小结；同时 §11–§14 的报告在 `REVIEW_REPORT_v6.md` 里，CHANGELOG 目前只提到 `REVIEW_REPORT_v5.md`。

### 14.8 判定与下一步

**🚦 判定：`b015442` ✅ 可以 push。**
异常处理写法正确（顺序、`continue`、信息内容都对），并用端到端用例证明了 **GBK 存盘 / UTF-16 / 截断写入三类"字节级损坏"都会被拦住**，同时不误伤当前仓库、不削弱对历史乱码形态的检测能力。
至此，检查 8 的三层覆盖是完整的：

| 事故形态 | 是否被拦 |
|---|---|
| 合法 UTF-8 的乱码（历史真身，`c4d89e3`/`1ac0649`） | ✅ 拦（标签形态 + 特征字） |
| 非法 UTF-8：GBK 存盘 / UTF-16 重定向 / 截断 | ✅ 拦（本次新增） |
| 中文名文件 | ✅ 不再漏扫（`a9ad5c8` 的 `core.quotepath=false`） |

下一步：
1. push `b015442`；
2. （可选）按 §14.6 把扩展名名单补全或注释说明；
3. **§10 的 L5/L6（复核凭证 + 分支保护）——第五次提醒**。本轮依然是靠人自觉把改动留在本地等我复核的（连续第四次），机制仍未兜底。

### 14.9 复核规范增补

1. **改异常分支必查"子类在前"**：`except Exception` 一旦写在前面，任何更具体的分支都成死代码，而且 diff 看起来很"正常"。判据不能只看代码，要看**端到端退出码**（本轮正是用 GBK 用例的 exit 1 来反证可达）。
2. **测"是否会拦住"要用真实脚本 + 真实退出码**：函数返回错误列表 ≠ 提交会被拦住（要经过 `main()` → `all_errors` → `sys.exit(1)`）。沙箱里跑真脚本是唯一能同时验证这两段的方式。

---

## §15 第十六轮：验证 `e522c34`（PROJECT_BRIEF 编码规则 + CHANGELOG 合并）—— **规则基本到位；但 CHANGELOG 丢了一整个 v5.3.3**

> 基线：`HEAD = e522c34`（**本地领先 `origin/master = b015442` 1 个提交，未 push** ✅ 连续第五次把改动留给复核）
> 改动：`CHANGELOG.md`（61 行变动）+ `PROJECT_BRIEF.md`（+7 行）。

### 15.1 验收总表

| # | 检查项 | 判定 | 摘要 |
|---|---|---|---|
| 1 | PROJECT_BRIEF 是否真的补上了 GBK 规则 | ✅ **是** | `:167-173` 新增 6 条；我在 §16.5 提了两轮的"CHANGELOG 声明不实"**这次落地了** |
| 2 | 该规则是否**完整** | ⚠️ **约 90%** | 缺"**读文件**也要 `encoding`"；且**禁止项写反了危险形态**（§15.3） |
| 3 | CHANGELOG 两个 `## v5.3.4` 是否合并正确 | ✅ **正确** | 现在只剩一条（`:3`），版本顺序恢复：v5.3.4 → v5.3.2 → v5.3.1 … |
| 4 | 合并是否**遗漏内容** | ❌ **有遗漏** | **整段 `## v5.3.3（2026-09-11）` 被删掉**（12 条），另"已知问题"栏目体系整体消失 |
| 5 | 恢复成本 | 🟢 低 | 21 行，可直接从 `git show b015442:CHANGELOG.md` 粘回（§15.5 已备好） |

### 15.2 PROJECT_BRIEF 规则逐条核对（对照我 §16.5 的建议）

新增内容（`PROJECT_BRIEF.md:167-173`，位于 `## 9. 已知的坑和教训` 第 7 条）：

| 我建议的 4 点 | 他们写的 | 覆盖 |
|---|---|---|
| 写文件：`io.open(encoding='utf-8', newline='')` | ✅ `写HTML/demo文件必须用 Python io.open(path,'w',encoding='utf-8',newline='')` | ✅ |
| 读子进程：`encoding='utf-8', errors='replace'` | ✅ `读子进程输出必须用 encoding='utf-8', errors='replace'` | ✅ |
| 脚本 stdout：`reconfigure` | ✅ `脚本stdout必须用 sys.stdout.reconfigure(encoding='utf-8', errors='replace')` | ✅ |
| 恢复类操作：同时验内容与编码 | ✅ `恢复类操作必须同时验内容与编码（乱码特征0 + 坏闭标签0 + 逻辑功能存在）` | ✅ **比我建议的更好**（多了"逻辑功能存在"这一验收项） |
| —（他们自发补充） | ✅ `preflight检查8已覆盖：全仓乱码扫描（标签形态+特征字+非法UTF-8检测）` | ➕ 好：写明"有自动兜底"，避免规则空转 |
| **读文本文件也要 `encoding`** | ❌ **没写** | ⚠️ 见下 |
| **禁止清单** | ⚠️ 只禁了 `Set-Content -Encoding utf8` | ⚠️ 见 §15.3 |

**⚠️ 缺失点 1：漏了"读文件"**。
规则覆盖了"读子进程"，但没覆盖**直接用 `open()` 读文本文件**——中文 Windows 上不带 `encoding` 会按 cp936 读。历史上 `preflight.py` / `verify_deploy.py` 那两次崩溃正是"读"这一侧的问题（当时是子进程读，同类）。建议补一条：
> - **读文本文件必须用** `open(path, encoding='utf-8')`（不带 `encoding` 会按 cp936 读，中文内容会出错或抛异常）

### 15.3 ⚠️ 规则第 2 条把"危险写法"和"安全写法"弄反了（本机实测）

规则原文：
> - **禁止用** PowerShell `Set-Content -Encoding utf8`（会写坏含中文+ASCII混合的文件，闭标签`<`被吃掉）

我在**本机 PowerShell 5.1** 上实测（同一句含中文的 HTML 片段）：

| 写法 | 落盘前 8 字节 | 实际编码 | 危险性 |
|---|---|---|---|
| `Set-Content file -Value $s`（**不带** `-Encoding`） | `d6 d0 ce c4 b2 e2 ca d4` | **GBK（非 UTF-8）** | 🔴 **这才是历次事故的成因** |
| `Set-Content file -Value $s -Encoding utf8` | `ef bb bf e4 b8 ad e6 96` | UTF-8 **+ BOM** | ✅ 内容不坏（仅多一个 BOM） |

→ **规则禁掉的是"安全写法"，却放过了"危险写法"**。后果不是"多说了一句废话"，而是可能**诱发下一次事故**：读者看到"只禁 `-Encoding utf8`"，会认为**不带 `-Encoding` 的 `Set-Content` 是允许的**，而它恰恰写出 GBK 字节 → 正是我们要防的那类损坏。
→ 建议把该条改为（两个 PowerShell 版本都覆盖）：

```markdown
   - **禁止用 PowerShell 任何形式回写 HTML/JS/demo 文件**（`Set-Content`、`Get-Content | Set-Content` 管道、
     `(Get-Content …) -replace … | Set-Content`）。原因：**Windows PowerShell 5.1 的 `Set-Content` 不带 `-Encoding`
     时默认按 ANSI/GBK 写**（实测落盘字节 `d6 d0 ce c4…`，非 UTF-8）——这就是历次"闭标签 `<` 被吃掉"的成因；
     而 `-Encoding utf8` 反而会写成 UTF-8+BOM（内容不坏，但会平白引入 BOM 差异）。**要改文本一律用 Python `io.open`。**
```

**⚠️ 缺失点 3（🟢，位置）**：PROJECT_BRIEF 的"强制规则"体系在 `## 8.1 协作流程`（`【强制规则1】:136`、`【强制规则2】:140`）。新规则虽自我标注"（强制规则）"，但放在 `## 9 已知的坑和教训` 的第 7 条里，**不在序列里、没有编号** → 可发现性和力度都弱一档。建议二选一：移入 8.1 作为**【强制规则3】**，或在 8.1 加一行指针「**【强制规则3】Windows 文本编码——详见 §9.7**」。

### 15.4 CHANGELOG 合并核对：合并正确，但**丢了整个 v5.3.3**

**✅ 合并目标达成**：原来的两个 `## v5.3.4（2026-09-12）`（旧 `:3` 与 `:43`）已并为一条；版本标题顺序恢复正常（`:3` v5.3.4 → `:70` v5.3.2 → `:86` v5.3.1 …）。
**✅ 新增内容准确**：`:56-61` 的"第十~十二轮复核"条目与 §11–§14 的复核结论一致（.wrap 修复 / 检查8 / 检查9 / `--local-only` / 检查8 异常细化）；`:64` 关于 PROJECT_BRIEF 新规则的描述也与实际改动相符。

**❌ 遗漏 1（本条最严重）：`## v5.3.3（2026-09-11）` 整段被删除**

逐行核对旧版该段（21 行、17 个非空行）：**14 行在新版中找不到**（另外 3 行是 `### 修复` / `### 文档` / `---` 这种通用行，出现在别处）。

关键词交叉验证（旧版有 → 新版）：

| 关键词 | 新版 |
|---|---|
| `srcdoc` | ❌ 消失 |
| `_pendingWork` | ❌ 消失 |
| `LESSONS_2026-09-11` | ❌ 消失 |
| `D007-D010` | ❌ 消失 |
| `手机端media适配` | ❌ 消失 |
| `iframe内容叠加` | ❌ 消失 |
| `打开作品滚动位置` | ❌ 消失 |
| `preflight体检工具` | ❌ 消失 |
| `API Key明文` | ❌ 消失 |

丢失的 12 条 = iframe内容叠加 / 打开作品滚动位置 / page-06 reveal时序 / 手机端适配地雷拆除 / iframe竞态修复 / AI助手重复调用 / 手机端media适配 / preflight体检工具（v5.3.3 版）/ LESSONS 文档 / DECISIONS D007-D010 / 已知问题 2 条。
→ **可恢复**：`git show b015442:CHANGELOG.md` 里原文完整，§15.5 已备好粘贴块。
→ 为什么判 🟡 而不是 🟢：这是**一整个版本的发布记录**（不是笔误）；而且它顺带删掉了唯一的"已知问题"跟踪（见下）。

**❌ 遗漏 2：`### 已知问题` 栏目体系整体消失**
- 旧版：**2 个 `### 已知问题` 小节**（v5.3.4 顶部那个 + v5.3.3 那个）+ 1 处正文提及（共 3 次出现"已知问题"字样）；
- 新版：**0 个 `### 已知问题` 小节**，只剩 1 处正文提及（`:9` 的"CHANGELOG与代码矛盾"条目里提到这四个字）。
→ 项目因此失去"未闭环事项"的落点（旧版里记着"API Key 明文待处理""手机端待实测项"）。若不打算继续用这个栏目，建议在 CHANGELOG 顶部说明；否则建议恢复。

**🟢 遗漏 3：`- REVIEW_REPORT_v5.md新增§14-§15（第八~九轮复核）` 被替换成 v6 那条**
→ v5 §14–§16 的记录不再出现在 CHANGELOG（内容与 v6 §11–§14 有重叠，影响很小，可接受）。

**🟢 精度问题：版本号/日期的语义**
合并后，**2026-09-13 的工作**（`.wrap` 修复、检查 8/9、`--local-only`）被并入 `## v5.3.4（**2026-09-12**）` → **标题日期早于内容**。
建议二选一：标题改为 `## v5.3.4（2026-09-12 ~ 09-13）`，或把 09-13 的工作单列 `## v5.3.5（2026-09-13）`。

**🟢 轮次标注不一致**：同一批工作在 `:56` 写作"第十~十二轮复核"，在 `:65` 写作"第十~十五轮复核"，建议统一。

### 15.5 可直接粘贴的恢复块（旧版 `v5.3.3` 段原文，21 行）

建议插到新版 `## v5.3.4` 段结束（`:68` 的 `---` 之后）、`## v5.3.2`（`:70`）之前：

```markdown
## v5.3.3（2026-09-11）

### 修复
- **iframe内容叠加**：快速切换作品时新旧内容叠加，改为先清空srcdoc再延迟50ms设置新内容
- **打开作品滚动位置**：iframe加载后滚动到顶部，避免显示上一个作品的滚动位置
- **page-06 reveal时序**：修SOX模块位置时把"局限与数据来源"放在了IO脚本之后，导致永久不可见，已将IO脚本移到</section>之前
- **手机端适配地雷拆除**：删除page-01模板内的getMobileChartOption/isMobile/applyMobileOption三个函数，以及5个模板里注释掉的调用点，避免以后误取消注释导致isMobile未定义错误
- **iframe竞态修复**：加_pendingWork模块级变量，showWork/showHome时先clearTimeout，防止快速切换时的setTimeout竞态
- **AI助手重复调用**：jump-btn按钮点击会触发两次showWork（AI助手自身监听+全局委托），已加e.stopPropagation()
- **手机端media适配**：5处safeInit自动注入baseOption+media，21张图表全部生效，图表高度从220px调到290px（大图360px）
- **preflight体检工具**：新增tools/preflight.py，5项检查（reveal时序/函数作用域/CSS类名/敏感串/baseOption配对）

### 文档
- 新增LESSONS_2026-09-11.md，记录手机端适配失败的5个问题根因和6条深度反思
- DECISIONS.md新增D007-D010（手机端适配暂时禁用、回退到稳定版本、iframe内容更新方式、手机端适配用ECharts原生media query）

### 已知问题
- 手机端media适配已上线；待实测确认：4张非笛卡尔图是否被注入多余坐标系、双y轴是否只覆盖首个轴、w03两图x轴标签是否消失
- API Key明文存在于代码中（用户确认暂不处理）

---
```

（提示：`API Key明文存在于代码中（用户确认暂不处理）` 这条如今已过时——Key 已移除并作废（§2.1），粘回时可顺手改写为「~~API Key明文~~ 已于 v5.3.4 移除并作废」，保留历史但不误导。）

### 15.6 判定与下一步

**🚦 判定：⚠️ 建议「修完 §15.4 的 v5.3.3 恢复 + §15.3 的规则表述」再 push**（不阻塞功能，但成本极低、且属于"信息丢失"类问题，越晚修越容易忘）。

- **无功能性问题**：本次只改文档，站点与工具都不受影响（`preflight.py` 未改动 → 检查 1–9 状态不变）。
- 但两处建议在 push 前顺手改掉：
  1. **恢复 v5.3.3 段**（§15.5，21 行粘贴；这是本次唯一的"内容丢失"）；
  2. **改掉规则第 2 条**（§15.3）——把"禁 `-Encoding utf8`"改成"**禁 PowerShell 任何形式回写**"，并说明"不带 `-Encoding` 才是 GBK 元凶"。不然后人可能反着理解，**这条规则本身会变成下一次事故的诱因**。

如果你们希望先 push 再补，也可以（文档类问题不影响线上），但请**在 CHANGELOG 的 v5.3.4 条目里记一条"待补：v5.3.3 段恢复"**，否则极易遗漏。

### 15.7 复核规范增补

1. **合并/删除文档段落时，必须做"逐行集合比对"**：本轮我用「旧版行 ∈ 新版行」的集合差集，一次就定位到"整段 12 条丢失"。**只肉眼看 diff 很容易漏**（diff 里 -40 行看起来就像"合并去重"）。
2. **"禁止类"规则要验证方向**：凡是"禁止 X"的条款，都要问一句"**X 的反面是不是才是危险的？**"——本轮就是典型：禁了安全写法、放过了危险写法。判据用**实测字节**（§15.3 的 `d6 d0 ce c4` vs `ef bb bf`）而不是记忆。
3. **规则落地后要回查"之前声明的真实性"**：CHANGELOG 里"已在 PROJECT_BRIEF 固化规则"这句话我提了两轮（§16.5、§14.7），本轮终于属实 —— 说明**这类"声明式文档"必须每轮复查一次**，否则会长期以假乱真。

---

## §16 第十七轮：验证 `f7264f4`（编码规则表述 + v5.3.3 恢复 + 轮次/日期）—— **①②全过；③仍有一处自相矛盾**

> 基线：`HEAD = f7264f4`（**本地领先 `origin/master = b015442` 2 个提交，未 push** ✅ 连续第六次把改动留给复核）
> 改动：`CHANGELOG.md`（+26/−3）+ `PROJECT_BRIEF.md`（+2/−1）。三项都是我在 §15 提的问题。

### 16.1 验收总表

| # | 你要求的验证 | 判定 | 摘要 |
|---|---|---|---|
| ① | PROJECT_BRIEF 编码规则**表述方向**是否正确 | ✅ **全部正确** | 8 项核对全过：禁止项已指向危险形态、GBK 成因写明、实测字节入文、补齐"读文件"、覆盖管道与 `-replace`（详见 §16.2） |
| ② | CHANGELOG 的 v5.3.3 是否**完整恢复** | ✅ **完整** | 原文 17 个非空行 → 新版 **17 行全在**；唯一差异是按我建议**有意改写**的 API Key 那条；`### 已知问题` 小节回归；位置正确（§16.3） |
| ③ | 轮次标注与版本日期是否一致 | ⚠️ **日期已统一；轮次仍有 1 处自相矛盾** | 日期 ✅（`2026-09-12 ~ 09-13`）；但 `:56` 写"第十~十六轮"、`:65` 写"第十~十五轮"——**同一批工作两个区间**（§16.4） |
| ④ | 回归（附加） | ✅ | `preflight.py` exit 0（检查 1–9 全绿）；`coverage_test.js` exit 0（断言 9/9、覆盖率 100%）；新恢复的文本**不误触**检查 4（敏感串）与检查 8（乱码） |

### 16.2 ① 编码规则方向：**8 项核对全过**（我 §15.3 的实测结论已正确写入）

规则现位于 `PROJECT_BRIEF.md:167-174`：

| 核对项 | 结果 |
|---|---|
| 禁止项是否已指向**危险**形态（不再是 `-Encoding utf8`） | ✅ `禁止用 PowerShell 任何形式回写 HTML/JS/demo 文件` |
| 是否写明成因：PS 5.1 的 `Set-Content` **不带 `-Encoding`** 默认按 ANSI/GBK 写 | ✅ 原文照写 |
| 是否把我实测的字节证据写进去 | ✅ `实测落盘字节 d6 d0 ce c4…，非UTF-8` |
| 是否澄清 `-Encoding utf8` 其实**内容不坏**（只是多 BOM） | ✅ `反而会写成UTF-8+BOM（内容不坏，但会平白引入BOM差异）` |
| 是否补齐**"读文本文件"**也必须 `encoding` | ✅ `读文本文件必须用 open(path, encoding='utf-8')（不带encoding会按cp936读…）` |
| 是否覆盖**管道**形式 | ✅ `Get-Content \| Set-Content 管道` |
| 是否覆盖 `-replace` 回写 | ✅ `(Get-Content …) -replace … \| Set-Content` |
| 是否保留了原有的 4 条（写文件/读子进程/stdout/恢复类双验 + 检查8 兜底） | ✅ 全部保留 |

→ **方向已经完全正确**：从"禁掉安全写法、放过危险写法"改成"禁掉一切 PowerShell 回写 + 说明 GBK 成因"。
**唯一遗留（🟢，与 §15.2 同一条）**：规则仍在 `## 9. 已知的坑和教训` 第 7 条，而"强制规则"编号体系在 `## 8.1`（现在仍只有【强制规则1】`:136`、【强制规则2】`:140`）。建议移入 8.1 作为【强制规则3】，或在 8.1 加一行指针。

**一点可选增强（🟢）**：现在列了 3 种 PowerShell 形态，但**没提 `Out-File` 与 `>` 重定向**——PS 5.1 下它们默认写成 **UTF-16LE**（正是我 §14.3 实测会被检查 8 拦下的那种）。既然写的是"任何形式"，建议把这两个词也点名（顺带把覆盖面从"HTML/JS/demo"放宽到"仓库内任何文本文件"，因为 `.md/.csv/.py` 同样会被写坏）。

### 16.3 ② v5.3.3 恢复：**完整**（逐行比对）

方法：把 `git show b015442:CHANGELOG.md` 里的旧段取出来，逐行检查是否出现在新文件里。

| 核对项 | 结果 |
|---|---|
| 原文非空行数 → 新版命中 | **17 行 → 17 行全在** ✅（§15.4 时是 14 行缺失） |
| 新版该段非空行数 | 17 行（与原文一致，无重复、无夹带） |
| 唯一差异行 | `- ~~API Key明文存在于代码中~~ 已于v5.3.4移除并作废` ← **按我 §15.5 的建议有意改写** ✅（比我的措辞更简洁，且保留了历史） |
| 小节结构 | `### 修复` / `### 文档` / `### 已知问题` **三节齐备** ✅（"已知问题"栏目回归） |
| 插入位置 | `:3` v5.3.4 → **`:70` v5.3.3** → `:92` v5.3.2 ✅ 版本倒序正确 |

**新增文本的回归安全性**（这类"把历史文本搬回来"最容易顺带引入检查误报）：
- 检查 8：标签形态命中 **0**、特征字 **0**、多字序列 **0** ✅
  （注：恢复文本里有 1 处 `</section>`，但检查 8 的判据是 `?/section>` 这种"闭标签被吃掉"的形态，**不受影响** ✅）
- 检查 4（敏感串）：不含 `sk-` 前缀的 key ✅
- `CHANGELOG.md` / `PROJECT_BRIEF.md` 均为合法 UTF-8 ✅；整体 `preflight.py` exit 0 ✅

### 16.4 ③ 日期 ✅ 已统一；**轮次标注仍不一致**（本轮唯一遗留）

**版本日期：✅ 修好了**
`:3` 现在是 `## v5.3.4（2026-09-12 ~ 09-13）`，把 09-13 的工作覆盖进来了；`v5.3.3（2026-09-11）→ v5.3.2（2026-09-09）→ v5.3.1（2026-09-09）` 倒序正确 ✅

**轮次标注：⚠️ 两处指同一批工作，却写了两个不同区间**

| 位置 | 现在写的 | 备注 |
|---|---|---|
| `CHANGELOG.md:56` | `### 修复（DeepSeek**第十~十六轮**复核 - 布局与工程基建）` | 本轮由"第十~十二轮"改成了"第十~十六轮" |
| `CHANGELOG.md:65` | `- REVIEW_REPORT_v6.md新增§11-§14（**第十~十五轮**复核）` | 本轮**未改动**，仍是"第十~十五轮" |

→ **同一个文件里，同一批工作出现两个不同区间**（第十~十六 / 第十~十五），这就是"轮次标注不一致"的现存答案。

**按报告的权威编号，这批工作实际横跨 `第十一~十五轮`**：

| 工作项 | commit | 报告里的轮次 |
|---|---|---|
| 作品01 `.wrap` 修复 | `ec94b0e` | **第十一轮**（`REVIEW_REPORT_v6.md` §1） |
| 作品05/06 `.wrap` 修复 | `7fd8841` | **第十二轮**（v6 §11） |
| 检查9 首版 + `--local-only` + 检查8 首版 | `80990c8` | **第十三轮**（v6 §12） |
| 检查8 改为全仓扫描 | `a9ad5c8` | **第十四轮**（v6 §13） |
| 检查8 异常细化 | `b015442` | **第十五轮**（v6 §14） |

→ 所以 `:56` 的准确写法是 **第十一~十五轮**；`:65` 那句里 `§11-§14` **对应的是第十二~十五轮**（§11=第十二轮 … §14=第十五轮），括号里写"第十~十五轮"与它自己的 `§11` 对不上。
→ 对照锚点：`:47` 的"**第八~九轮**"是**正确的**（v5 §14=第八轮、§15=第九轮），说明问题不是"全部错"，而是这批新区间没有按同一口径推。

**根因**：有两种都讲得通的口径，而 CHANGELOG 混用了——
- 口径 A「**发现问题**的那一轮」：w01 问题由第十一轮指出 → 区间 第十一~十四轮
- 口径 B「**验收通过**的那一轮」：w01 在第十二轮验收 → 区间 第十二~十五轮

**建议（一次性根治）**：**不要再用轮次区间**，改为直接引用报告文件与章节（自解释、可验证、不会随口径漂移）。例如：

```markdown
### 修复（DeepSeek 复核 - 布局与工程基建｜详见 REVIEW_REPORT_v6.md §1、§11–§14）
...
- REVIEW_REPORT_v6.md 新增 §10–§15（机制设计 + 第十二~十六轮验收记录）
```

若坚持用轮次，请在 CHANGELOG 顶部加一行口径说明（"本表『第N轮』= DeepSeek 复核报告中**验收通过**的轮次编号"），并把 `:56`/`:65` 两处统一到同一区间。

### 16.5 判定与下一步

**🚦 判定：✅ `f7264f4` 可以 push**（连同尚未 push 的 `e522c34` 一起）。
- 你点名的 ①② **完全通过**；③ 的日期部分通过，轮次标注只剩**一处文字性不一致**（`:56` vs `:65`），无功能影响，**不阻塞**。
- 回归全绿：`preflight.py` exit 0、`coverage_test.js` exit 0，新恢复的文本不误触任何检查。

**建议随下次改动顺手处理**（3 条，都是文字级）：
1. 统一 `:56` / `:65` 的轮次（推荐直接改成引用报告章节，见 §16.4 的粘贴示例）；
2. 规则移入 `## 8.1` 作为【强制规则3】（或在 8.1 加指针）；
3. 规则里补 `Out-File` / `>` 重定向，并把"HTML/JS/demo"放宽到"仓库内任何文本文件"。

**push 前请确认**：本次要推的是 **2 个提交**（`e522c34` + `f7264f4`），两者都是文档改动，`index.html` 与 `tools/` 均未变 → 线上部署内容不变（`verify_deploy.py` 应报"完全一致"，因为线上 `index.html` 与本地 HEAD 的 `index.html` 相同）。

### 16.6 复核规范增补

1. **"恢复了没有"要用「原文行 ⊆ 新文行」的集合判定**：本轮 17/17 一次判定通过；上一轮同一方法判定出 14 行缺失。**比看 diff 可靠**（diff 只看增删行，看不出"搬到别处又删了"）。
2. **恢复历史文本后必须跑一次回归**：搬回来的文本里可能有 `</section>`、旧 Key 串、特征字等"看起来像问题"的内容。本轮实测：检查 4/8 均未误触 ✅（`</section>` 不匹配 `?/section>`，因为判据是"闭标签被吃掉"的形态）。
3. **文档类改动也要验"内部自洽"**：同一事实（轮次区间）在同一文件出现两处时，必须交叉核对——`grep` 出全部"第N轮"再两两比对，是最省事的做法（本轮就是这样发现 `:56` 与 `:65` 矛盾的）。

---

## §17 第十八轮：验证 `a79b385`（轮次统一 + 强制规则3 + §9.7 补充）—— **三项基本达成，剩 2 处小不一致**

> 基线：`HEAD = a79b385`（**本地领先 `origin/master = f7264f4` 1 个提交，未 push** ✅ 连续第七次把改动留给复核）
> 改动：`CHANGELOG.md`（1 行）+ `PROJECT_BRIEF.md`（+9/−2）。

### 17.1 验收总表

| # | 你要求的验证 | 判定 | 摘要 |
|---|---|---|---|
| ① | CHANGELOG 轮次标注是否**统一** | ⚠️ **部分统一** | `:56` 已改为引用报告章节，上一轮"第十~十六 vs 第十~十五"的**直接矛盾消除** ✅；但 **`:65` 未改**，仍写着"（第十~十五轮复核）"——既仍是轮次区间、又仍不准确（§11–§14 = 第十二~十五轮） |
| ② | 强制规则3 **指针**是否正确 | ✅ **正确**（有 1 处措辞不齐） | `:146` 位置与编号正确（1→2→3 连续）；`§9.7` 目标存在且指向准确；⚠️ 但摘要第 1 条仍写"写 **HTML/demo文件**"，而目标已放宽为"写**任何文本文件**" |
| ③ | §9.7 规则补充是否**完整** | ✅ **补全且事实无误** | `Out-File`／`>` 重定向已补入；放宽到"仓库内文本文件"；**新增的 4 条编码事实断言我逐条实测，全部属实**；并做了「规则 vs 代码」合规审计：活跃 `.py` **0 处违规**、16 个 `.bat` **0 处风险** |

### 17.2 ① CHANGELOG 轮次标注：矛盾消除，但没改干净

**改动效果**：`:56` 从 `### 修复（DeepSeek第十~十六轮复核 - 布局与工程基建）` 改为
`### 修复（DeepSeek复核 - 布局与工程基建｜详见REVIEW_REPORT_v6.md §1、§11–§14）` ✅ —— 这个改法正是我 §16.4 建议的"引用报告章节"，**上一轮那处"同一批工作两个区间"的自相矛盾已经消失**。

**但仍有一处没改**（全文件现存的轮次/引用标注）：

| 行 | 现文本 | 判定 |
|---|---|---|
| `:5` | `### 修复（DeepSeek第四轮复核 - P0）` | 历史条目，保留可接受 |
| `:17` | `### 修复（DeepSeek第四轮复核 - P1）` | 同上 |
| `:31` | `- **第六轮复核修复**：…` | 同上 |
| `:38` | `### 修复（DeepSeek第七轮复核 + 协作方式反思）` | 同上 |
| `:47` | `### 修复（DeepSeek第八~九轮复核）` | ✅ **准确**（v5 §14=第八轮、§15=第九轮） |
| `:56` | `### 修复（DeepSeek复核 - …｜详见REVIEW_REPORT_v6.md §1、§11–§14）` | ✅ 新风格（引用章节） |
| **`:65`** | `- REVIEW_REPORT_v6.md新增§11-§14（**第十~十五轮**复核）` | ❌ **未改**：① 仍是轮次区间；② 仍是**错的**（§11–§14 = 第十二~十五轮）；③ 与 `:56` 的新风格不一致 |

→ 所以答案是**部分统一**：新条目已统一为"引用章节"，但 `:65` 这一处漏改，而且它恰好仍是上一轮那个不准确的区间。
→ **建议**（一行改动，彻底消除漂移）：
```markdown
- REVIEW_REPORT_v6.md新增§10–§15（机制设计与各轮验收记录）
```
（去掉了轮次区间，读者可直接按章节查证；若你们想保留轮次，请写成 `（第十二~十五轮复核）`。）

### 17.3 ② 强制规则3 指针：位置与目标都对，但摘要比规则窄

**位置与编号** ✅：
```
PROJECT_BRIEF.md:136  【强制规则1】主力AI完成修改后必须主动触发复核…
PROJECT_BRIEF.md:140  【强制规则2】主力AI根据复核报告修改前，必须先核实…
PROJECT_BRIEF.md:146  【强制规则3】Windows文本编码——详见§9.7      ← 本次新增
```
实测编号序列 = `【强制规则1】【强制规则2】【强制规则3】`，连续无跳号 ✅

**指向目标** ✅：`§9.7` = `## 9. 已知的坑和教训` 的第 `7.` 条（`7. **Windows GBK编码陷阱（已复发5次，强制规则）**：`）—— 编号与语义都对 ✅

**⚠️ 但摘要与目标措辞不齐**（本次改动带出来的新小问题）：

| 位置 | 现文本 |
|---|---|
| 规则3 摘要第 1 条（`:147`） | `- 写**HTML/demo文件**必须用Python io.open(encoding='utf-8', newline='')` |
| 目标 §9.7 第 1 条（`:173`） | `- **写任何文本文件必须用** Python io.open(path,'w',encoding='utf-8',newline='')` |

→ 本次把 §9.7 放宽到"任何文本文件"，**但没同步更新指针里的摘要**。只看强制规则区的人会以为 `.md/.csv/.py` 不受约束（而它们同样会被写坏）。
→ 建议把 `:147` 改成 `- 写任何文本文件必须用 Python open()/io.open(encoding='utf-8', newline='')`。
（`:148` 摘要写"回写文本文件"、目标写"回写**仓库内**文本文件"——差异无害，可留。）

### 17.4 ③ §9.7 补充：完整，且**新增的事实断言全部实测属实**

**补了 3 处** ✅：① `Out-File` 与 `>` 重定向列入禁止清单；② 覆盖面从"HTML/JS/demo"放宽到"**仓库内文本文件**"；③ 成因说明扩写为"默认按 ANSI/GBK **或 UTF-16LE** 写（实测字节 `d6 d0 ce c4…` 或 `ff fe…`）"。

**关键：它新写进去的事实我必须验（不能只信文字）** —— 本机 **PowerShell 5.1** 实测：

| 规则中的断言 | 我的实测（前 6 字节） | 判定 |
|---|---|---|
| `Set-Content` 不带 `-Encoding` → ANSI/GBK，字节 `d6 d0 ce c4…` | `d6 d0 ce c4 b2 e2` | ✅ **一致** |
| `Out-File` → UTF-16LE，字节 `ff fe…` | `ff fe 2d 4e 87 65` | ✅ **一致** |
| `>` 重定向 → UTF-16LE，字节 `ff fe…` | `ff fe 2d 4e 87 65` | ✅ **一致** |
| `-Encoding utf8` → UTF-8+BOM，内容不坏 | `ef bb bf e4 b8 ad` | ✅ **一致** |

**「规则 vs 代码」合规审计**（规则写了但代码违反 = 规则没用，所以必须查）：

| 审计对象 | 结果 |
|---|---|
| 活跃 `.py`（`tools/preflight.py`、`tools/verify_deploy.py`、`demo/*.py` 4 个）：所有 `open()` / `read_text` / `write_text` / `subprocess.run(text=True)` | **0 处缺 `encoding`** ✅（8 处调用逐一列出核对） |
| 16 个 `.bat`（用户会双击运行）：是否有"重定向到文件"或 `Set-Content/Out-File/Add-Content` | **0 处** ✅（它们的 `>` 全是 `>nul` / `2>nul` 设备重定向，且都设了 `chcp 65001`；编码均为 UTF-8/纯 ASCII） |
| `index.html` 前端 JS 是否写文件 | ✅ 无（只有 Blob/download 导出，不落盘） |

> ⚠️ **我自己的更正**：第一次跑 `.bat` 审计时，我用 `>` 的宽正则把 16 个文件全标成"有重定向风险"——**那是误报**（命中的是 `chcp 65001 >nul`）。修正正则（排除 `nul`/`&1`/`&2`）后结果是 **0 处风险**。教训已记入 §17.7。

**仍可补的 2 条（🟢，预防性）**：
1. Python 侧 `Path.read_text()` / `Path.write_text()` **不带 `encoding=`** 同样按 locale（cp936）——规则只写了 `open/io.open`；当前代码无此用法，但值得点名（这两种写法在 `pathlib` 风格代码里很常见）。
2. PowerShell 的 `Add-Content`（追加写入）、`Export-Csv` 未点名（"任何形式"已覆盖，可选补充）。

### 17.5 判定与下一步

**🚦 判定：✅ `a79b385` 可以 push。**
- 三项都**基本达成**：①②③ 的实质问题都解决了（矛盾消除、指针正确、规则补全且事实无误）；
- 剩余 2 处都是**纯文字不齐**，无功能影响、不阻塞：
  1. `CHANGELOG.md:65` 的"第十~十五轮"（建议直接去掉轮次区间）；
  2. `PROJECT_BRIEF.md:147` 摘要写"HTML/demo文件"，应为"任何文本文件"。

**push 前提示**：本地领先 **3 个提交**（`e522c34` + `f7264f4` + `a79b385`），全部是文档改动 → 线上 `index.html` 与 `tools/` 未变，`verify_deploy.py` 预期仍报 `✅ 完全一致`。

**顺带说一句**：本轮的三条验证，本质上是"检查一个**规则文档**是否自洽、准确、可执行"。这类检查已经连着做了三轮（§15 §16 §17），说明这套规则体系正在快速收敛——从"规则写反了"→"规则位置不对"→"摘要与规则不一致"，**问题在逐轮变小**。剩下的都是我标 🟢 的文字级项。

### 17.6 未落地事项（第七次提醒）

`REVIEW_STAMP.md` + 分支保护（§10 的 L5/L6）仍未落地。本轮又是靠人自觉留在本地等我复核（连续第七次 ✅），机制仍未兜底。

### 17.7 复核规范增补

1. **审计"是否用了危险写法"时，正则必须排除设备重定向**：本轮我用 `>` 一扫，16 个 `.bat` 全部误报为风险，实际是 `chcp 65001 >nul`。**判据应为"重定向目标是否为真实文件"**（排除 `nul`/`&1`/`&2`），而不是"是否出现 `>`"。**误报比漏报更伤信任**（会让对方开始忽略这类检查）。
2. **"规则文档"也要验事实**：规则里写"`Out-File` 默认 UTF-16LE、字节 `ff fe`"——这类断言必须实测（我跑了 4 组对照），否则规则可能把错误的知识固化下来，比没有规则更危险。
3. **规则必须和代码做交叉审计**：本轮我把规则里的每一条都对应到实际代码（活跃 `.py` 8 处调用 + 16 个 `.bat` + 前端 JS），确认"规则要求 = 代码现状"。**只写规则不查代码，规则会在下一次改动中被悄悄违反。**

---

## §18 第十九轮：复核 PR #1（`feature/review-stamp-and-hooks` → `master`）—— **⚠️ 暂不建议直接合并（有 3 处需改，约 10 分钟）**

> PR：`kaihu8766-netizen/ai-finance-portfolio#1`；分支 `dd6ccb0`（基点 = `master` 的 `293dbb4`，仅 1 个提交）
> 新增 3 个文件：`REVIEW_STAMP.md`(35 行)、`hooks/install.sh`(21 行)、`hooks/pre-push`(58 行)；**无其他改动** ✅
> ⚠️ **环境限制（如实说明）**：本沙箱**无法执行 bash**（`Bash/Service/CreateInstance/E_ACCESSDENIED`，沙箱禁止其创建实例；`git clone` 也因此失败）。
> 因此 hook 的**执行结果**是用它仅有的两个原语（`git log --format=%h <range>` + `grep -q`）**等价复现**得出的；其余为静态逐行核对。请在真机上按 §18.6 的命令自测一次。

### 18.1 验收总表

| # | 你要求的验证 | 判定 | 摘要 |
|---|---|---|---|
| ① | **REVIEW_STAMP.md 格式** | ⚠️ **可读，但有 3 处不实** | 表格格式清晰、含违规记录（好）；但 **`293dbb4` 被写成"已批准"而它从未被复核**、`700c01a` 的章节引用指错文件、第 4 行声称"CI 会校验"而**CI 校验并不存在** |
| ② | **pre-push hook 逻辑** | ⚠️ **基本功能对，但有 2 个结构性缺陷** | 未复核→拦截 ✅、已批准→放行 ✅、分叉→拦截 ✅；但**读的是工作区文件**（未提交的改动即可自我批准）、且**只拦"本地直推 master"，与你们文档化的 PR 合并流程完全不相干** |
| ③ | **遗漏的边界情况** | ❌ **2 处未覆盖** | 删除远端 master、force-push 回退到更早提交 → 因 `git log` 范围为空而**放行**；（另 4 处 🟢 见 §18.4） |
| — | **机制是否达成它声称的目标** | ❌ **未达成** | 文件里写"只有有批准记录的 commit 才能合并到 master"，但**PR 合并不经过 pre-push hook**；且没有 CI 校验、没有 PR 触发的检查 → **目前合并路径是零闸门** |

### 18.2 ① 凭证格式与事实核对

格式（Markdown 表格，10 行批准 + 3 行违规记录）**清晰可读** ✅，比单纯列 sha 好。但**逐条核对发现 3 处不实**：

| 行 | 现文本 | 核对结果 |
|---|---|---|
| `:11` | `293dbb4 \| 第十八轮 \| 2026-09-13 \| REVIEW_REPORT_v6.md §17 \| ✅ 已批准` | ❌ **不实**：§17（第十八轮）复核的是 **`a79b385`**；`293dbb4` 是**之后**才提交的（内容 = 我在 §17 提的 2 行文字修改），**我从未复核过它**。§17 里也不含 `293dbb4`（脚本已验） |
| `:20` | `700c01a \| 第十轮 \| REVIEW_REPORT_v6.md §9` | ❌ **指错文件**：`700c01a` 是 **`REVIEW_REPORT_v5.md` §16**（第十轮）复核的；v6 §9 是"给你的下一步"，不含它（脚本已验） |
| `:19` | `ec94b0e \| 第十一轮 \| REVIEW_REPORT_v6.md §10` | ⚠️ 不精确：§10 是"机制专题"（里面确实提到 `ec94b0e`），真正的复核记录在 **v6 §1** |
| `:4` | `> pre-push hook和CI会校验待推送的commit是否在此文件的批准范围内` | ❌ **CI 校验不存在**：PR 分支上只有 `.github/workflows/pages.yml`，其触发条件是 `push: master` + `workflow_dispatch`（**无 `pull_request`**），也没有任何 `check_review_stamp` 脚本 |

其余 7 行（`a79b385`→§17、`f7264f4`→§16、`e522c34`→§15、`b015442`→§14、`a9ad5c8`→§13、`80990c8`→§12、`7fd8841`→§11）**与我报告的章节编号完全对应** ✅ —— 说明这批是认真核对的，问题集中在上面 3 处。

> 关于 `293dbb4`：**它本身不是违规提交**（内容正是我 §17 列的 2 个 🟢 建议：CHANGELOG 轮次去掉区间、强制规则3 摘要同步为"任何文本文件"；按 §3.2 白名单属"单行纯文本替换"= hotfix-A 允许）。**问题只在凭证把它写成了"已批准"** —— 而凭证的全部价值就在于"它写的每一条都是真的"。一旦开了这个头，后面就没人信这份文件了。

**建议改法**（2 处，各 1 行）：
```markdown
| 293dbb4 | 待复核(第十九轮) | 2026-09-13 | 依 §17 建议的2行文字修改(hotfix-A) | ⏳ 待批准 |
# 并把第 4 行改成：
> pre-push hook会校验待推送的commit是否在此文件的批准范围内（CI 校验尚未接入，见 REVIEW_REPORT_v6.md §18）
```

### 18.3 ② hook 逻辑逐项核对

**做对的部分（要肯定）** ✅：
- 用 stdin 读 push 信息、循环处理多个 ref ✅；**非 master 的 ref 直接 `continue`**（分支可自由推）✅
- 纯 shell 实现，**不依赖 python/node** ✅（比我 §10 的草案更省事）
- `grep … 2>/dev/null` + 失败即 `all_approved=false` → **stamp 文件不存在/读不到时默认拦截**（安全默认）✅
- 拦截时给出"正确流程"6 步提示 ✅（可操作性好的）

**缺陷 A（🟡 结构性）：读的是【工作区】的 stamp，不是被推送那个 commit 里的那份**

```sh
stamp_file="REVIEW_STAMP.md"
grep -q "$commit" "$stamp_file"       # ← 相对路径 = 当前工作区
```
后果有两个：
1. **只要在本地临时改一下 `REVIEW_STAMP.md`（不必提交）就能"自我批准"任何提交** —— 凭证从此形同虚设；
2. 反过来，**工作区与已提交内容不一致时**（例如 stamp 改了但没提交），校验依据与"实际推送的内容"不同 → 判定不可复现。
修法（1 行）：
```sh
stamp="$(git show "$local_sha:REVIEW_STAMP.md" 2>/dev/null)" || stamp=""
echo "$stamp" | grep -qE "^\| *${commit} *\|" || { ...未批准...; }
```

**缺陷 B（🟡 最要紧）：这条路径与你们的 PR 流程完全不相干**

hook 只在 `remote_ref == refs/heads/master` 时工作 → 即"**从本地直接 push master**"。而你们在 `REVIEW_STAMP.md:24-27` 和 hook 提示里写的流程是"push 分支 → 创建 PR → **在 GitHub 上合并 PR**"。**GitHub 上的合并是服务端操作，不会触发任何本地 hook** → 也就是说：
> **现在合并这个 PR、以及以后合并任何 PR，都不会被这个 hook 检查。** 真正能拦住它的是 CI 检查 + 分支保护（= 我 §10 里的 L5+L6），本 PR 都没有。

这不是"小瑕疵"，而是"机制宣称的能力与实际能力不一致"——正是我在 §12.3（检查 8 只扫 index.html）、§15.4（CHANGELOG 声明不实）反复标过的那类问题。

**缺陷 C（🟢）：`grep` 是子串匹配、未锚定** → 【违规记录】里的 hash 与【已批准】无法区分。实测：`grep -q "90d3fd4"` 会命中 `:33` 那行违规记录。今天这几条 hash 恰好已是 master 的祖先（无害），但机制上"记录"与"批准"混为一谈。修法同上（`grep -qE "^\| *$commit *\|"`）。

**缺陷 D（🟢）：`git log --format=%h` 是"可变长度缩写"** → 若仓库变大出现前缀歧义，git 会输出 8+ 位，而 stamp 里存的是固定 7 位 → **假拦截**（已批准却被拦）。可用 `--format=%h` 的同时在比较时用 `c.startswith(a)` 放宽（见 §18.5 的 CI 脚本）。

**缺陷 E（🟢）：hook 不跑 preflight** → 本地直推 master 时只查凭证、不查代码健康度。（CI 在 push master 后会跑 preflight，所以部署仍受保护 ✅，但"提交进 master"这一步没有。）

### 18.4 ③ 边界情况：实测（等价复现）结果

| 场景 | hook 判定 | 期望 | 结论 |
|---|---|---|---|
| 推送未复核提交 → master | **拦截** ✅ | 拦截 | ✅ 正确（这是主功能，工作正常） |
| 推送已批准提交（首次、空远端） | **放行** ✅ | 放行 | ✅ 正确 |
| 推送 stamp 提交本身（其 hash 不在表里） | **拦截** ✅ | 拦截 | ✅ 正确（说明逐条校验生效） |
| **force-push 分叉内容到 master** | **拦截** ✅ | 拦截 | ✅ 正确（`git log remote..local` 列出分叉提交 → 逐条校验） |
| **删除远端 master**（`git push origin :master`） | **放行** ❌ | 应拦截 | ❌ **边界漏洞**：`local_sha` 全 0 → `git log c3..0000` 报 `fatal` 到 **stderr**，`$()` 只捕获 stdout → `$commits` 为空 → 走"没有新的commit需要推送"分支 |
| **force-push master 回退到更早提交** | **放行** ❌ | 应拦截 | ❌ **边界漏洞**：`git log <remote>..<older>` 为空 → 同样放行。危害程度低于上面一条（回退到祖先**不会注入未批准内容**，只是**丢掉已批准的历史**） |
| 推送新分支（非 master） | 放行 ✅ | 放行 | ✅ 符合设计 |
| 工作区没有 `REVIEW_STAMP.md` | 拦截 ✅ | 拦截 | ✅ 安全默认 |

> ⚠️ **我自己的更正**：第一次模拟时我把 git 的 `stderr` 混进了输出，于是把"删除 master"误判成**拦截**。用"只取 stdout"（等价于 shell 的 `$()`）重跑后确认是**放行**。教训：复现 shell 语义时必须严格区分 stdout/stderr。

**修法建议**（把"空范围"当成可疑而不是"没事"）：
```sh
# 在 `if [ -z "$commits" ]` 之前加：
if [ "$local_sha" = "0000000000000000000000000000000000000000" ]; then
    echo "🚫 拒绝删除受保护的 master 分支"; exit 1
fi
# 并显式拒绝非快进回退：
if [ "$remote_sha" != "0000000000000000000000000000000000000000" ] && \
   ! git merge-base --is-ancestor "$remote_sha" "$local_sha"; then
    echo "🚫 拒绝非快进推送 master（会丢失已批准的历史）"; exit 1
fi
```

### 18.5 结论：**建议先改 3 处再合并**（都很小），并给出可直接粘贴的 CI 脚本

**🚦 判定：⚠️ 暂不建议直接合并。** 理由不是"它有害"（它只是个本地 hook + 一个文档，运行时零影响），而是**它会建立一个"以为有闸门"的状态**，而实际上 PR 合并路径上什么都没有；同时 `REVIEW_STAMP.md` 里已经出现一条不实批准和一句不实的"CI会校验"。**凭证类文件一旦出现假记录，它的全部价值就没了。**

**必须先改的 3 处（合计约 10 分钟）**：
1. **凭证事实**（§18.2）：`293dbb4` 改成"待复核/hotfix-A"；`700c01a` 的引用改成 `REVIEW_REPORT_v5.md §16`；第 4 行删掉"CI会校验"（或改成"CI 校验尚未接入"）。
2. **hook 从被推送的 commit 读凭证**（§18.3 缺陷 A，1 行）+ 匹配改为锚定（缺陷 C）。
3. **补上真正的闸门**（这 PR 缺的就是 L5/L6 的本体）：下面两个文件 + GitHub 分支保护。

**⚠️ 但先说一个更根本的问题：你们现在的"逐条 sha 列表"判据在数学上不收敛**

我原本也写了个"逐条 commit 必须都在凭证里"的 CI 脚本，**实测发现它会让每一次批准都失败**：

```
场景：我先复核内容 A → 在分支上追加一条批准记录（这本身是一个新 commit）
待合并 commit = ['9b7e6a9', '9a4f061', '3b90b8a']
其中不在凭证里的 = ['9b7e6a9', '3b90b8a']      ← 就是那两次"追加批准"的提交自己
→ ❌ 永远有未批准的 commit → 死锁（因为一个提交无法把自己的 hash 写进自己的内容里）
```

也就是说：**用"逐条 sha 必须都在表里"当闸门，会导致"批准"这个动作本身永远过不了闸门** → 最后只能靠 `--no-verify` 或改规则绕过 → 机制自己死掉。
**正确判据是"内容相等"**（我在 §10.3 给过的设计）：拿凭证里**最新一条批准记录**所指的提交当"已复核内容基线"，比对 `git diff <基线> HEAD`，并**忽略凭证文件自身**。这样"追加批准记录"不会改变内容 → 判据收敛；而"批准之后又改了任何文件"→ 立刻被拦。

**修正后的 CI 脚本**（`tools/check_review_stamp.py`，**已双向实测**）：

```python
#!/usr/bin/env python3
"""CI 用：HEAD 的内容必须等于 REVIEW_STAMP.md 中最新一条批准记录所指的内容（忽略凭证文件自身）。
   为什么不用「逐个 commit 的 sha 列表」：新增批准记录本身会产生新 commit，其 hash 不可能写在自己里面
   → 永远不收敛（见 REVIEW_REPORT_v6.md §18.5）。"""
import re, subprocess, sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")   # Windows GBK 控制台保护
    except Exception:
        pass

def sh(*a):
    return subprocess.run(a, capture_output=True).stdout.decode("utf-8", "replace").strip()

stamp = sh("git", "show", "HEAD:REVIEW_STAMP.md")
if not stamp:
    print("❌ HEAD 里没有 REVIEW_STAMP.md"); sys.exit(1)

rows = re.findall(r'^\|\s*([0-9a-f]{7,40})\s*\|.*$', stamp, re.M)
if not rows:
    print("❌ REVIEW_STAMP.md 里没有批准记录"); sys.exit(1)
approved = rows[0]                      # 最新一条批准记录 = 被复核的内容基线

if subprocess.run(["git", "cat-file", "-e", approved + "^{commit}"]).returncode != 0:
    print("❌ 凭证里的 commit %s 不存在（可能被 rebase 掉了）" % approved); sys.exit(1)

d = subprocess.run(["git", "diff", "--quiet", approved, "HEAD", "--", ".",
                    ":(exclude)REVIEW_STAMP.md"])
if d.returncode != 0:
    print("❌ 当前内容与已复核的内容（%s）不一致 → 禁止合并：" % approved[:7])
    print(sh("git", "diff", "--stat", approved, "HEAD", "--", ".", ":(exclude)REVIEW_STAMP.md"))
    sys.exit(1)

print("✅ 复核凭证有效（内容 = %s）" % approved[:7])
```

**实测结果（合成仓库，三个场景）**：

| 场景 | 结果 |
|---|---|
| 我复核内容 A → 分支只追加凭证提交 | **exit 0 通过** ✅（判据收敛，可合并） |
| 凭证之后又改了一个文件（哪怕一行） | **exit 1 拦截** ✅（并打印差异文件与行数） |
| 把新改动也批准进去（追加第二条记录） | **exit 0 再次通过** ✅（可反复迭代，**无死锁**） |
| 对照：同一场景用"逐条 sha 列表"判据 | ❌ **永远剩下未批准的提交 → 死锁**（见上） |

> **运营提示（这是"内容相等"判据的必然严格性）**：**批准之后不要再提交任何东西**（哪怕只是 CHANGELOG 加一行），否则需要重新复核。所以正确顺序是：**所有内容都提交完 → 我写批准记录（只动 `REVIEW_STAMP.md`）→ 立刻合并**。建议把这句话写进 `REVIEW_STAMP.md` 的使用说明。

配套的 CI 工作流（`.github/workflows/review-gate.yml`，让 **PR 也触发**检查）：

```yaml
name: Review gate
on:
  pull_request:
  push:
    branches: [master]
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }          # 需要完整历史算 merge-base
      - run: python tools/preflight.py
      - run: python tools/check_review_stamp.py
```

然后 **GitHub → Settings → Branches → 保护 `master`**：✅ Require a pull request（Approvals 设 **0**，单账号否则无法合并）／✅ Require status checks → 勾 `Review gate`／✅ Do not allow bypassing。
**这三件套齐了，"忘记复核"才真正变成"合不进去"。** 只有前两层（本地 hook + 凭证）时，它仍然只是"减速带"。

**如果你们想先合并再补**：可以，但请**至少先改第 1 项**（2 分钟，只是把不实的两行改成事实），并在 CHANGELOG 记一条"待补：CI 校验 + 分支保护"。否则这份凭证会以"含假记录"的状态进入 master。

### 18.6 改完后的自查命令（不需要再等我跑一轮）

```bash
# 1) 凭证事实：293dbb4 不应再出现"已批准"；700c01a 的引用应指向 REVIEW_REPORT_v5.md §16
grep -n "293dbb4\|700c01a" REVIEW_STAMP.md

# 2) 【必须】CI 脚本用「内容相等」判据，而不是「逐条 sha 列表」
#    自查：脚本里应出现 :(exclude)REVIEW_STAMP.md，且不应出现「遍历 commit 逐个查表」的逻辑
grep -n "exclude" tools/check_review_stamp.py
grep -n "reconfigure" tools/check_review_stamp.py      # 防 GBK 控制台崩溃（我第一版就漏了）

# 3) hook 是否从被推送的 commit 读凭证（应能看到 git show "$local_sha:REVIEW_STAMP.md"）
grep -n "git show" hooks/pre-push
#    匹配是否锚定（应为 ^\| *$commit *\| 形式，而不是裸 grep -q "$commit"）
grep -n "grep" hooks/pre-push

# 4) 【必须】真机跑一次 hook（我在沙箱里跑不了 bash，这条只能你们本地验）：
echo "refs/heads/master $(git rev-parse HEAD) refs/heads/master $(git rev-parse origin/master)" | bash hooks/pre-push
echo "退出码=$?（未复核提交应为 1）"
# 另外补测两个边界（我在沙箱里已确认它们会被放行，改完后应变成拦截）：
echo "refs/heads/master 0000000000000000000000000000000000000000 refs/heads/master $(git rev-parse origin/master)" | bash hooks/pre-push; echo "删除master 退出码=$?（应=1）"

# 5) CI 脚本本地预演（在 PR 分支上跑，应拦住未批准内容）
git checkout <你的PR分支>
python tools/check_review_stamp.py; echo "退出码=$?"
```

### 18.7 我自己的两处更正（都靠"原样执行报告里的代码"抓出来）

1. **我给的 CI 脚本第一版在 GBK 控制台直接崩了**：`print("❌ …")` 抛 `UnicodeEncodeError: 'gbk' codec can't encode character '\u274c'`（实测）。
   —— 讽刺的是，这正是我们这几轮一直在固化的那条规则（脚本 stdout 必须 `reconfigure`）。**我自己写脚本时也漏了**。修正版已在开头加 `sys.stdout.reconfigure(...)` 保护 ✅（§18.5 的代码已含）。
2. **我给的"逐条 sha 列表"判据不收敛**（§18.5）：实测发现它会让"追加批准记录"这个动作永远过不了自己的闸门。已改为"内容相等"判据并三向验证 ✅。
   —— 这条更正顺带说明：**你们现在 `REVIEW_STAMP.md` 的 sha 列表 + 我最初设想的校验方式，是不能直接接上 CI 的**，必须先改成内容判据。

### 18.8 复核规范增补

1. **验证 shell hook 时，必须严格按 shell 语义复现 `$( )`（只取 stdout）**：本轮我第一次模拟把 stderr 混入，导致"删除 master"被误判为拦截（§18.4 的更正）。**stderr 不属于 `$()`**，这类细节会直接改变结论。
2. **"凭证/凭证类文件"要逐条核对真伪**，而不是只看格式对不对：本轮 10 行批准记录里有 1 行是假批准、1 行指错文件。**格式合规 ≠ 内容为真**，而后者才是凭证存在的意义。
3. **判断机制是否有效，要看"实际流程走哪条路"**：hook 只拦本地直推 master，而团队的流程是 PR 合并——**把机制接在了一条没人走的路口上**。这类"机制与流程错位"比边界漏洞更值得优先指出。

---

## §19 第二十轮：复核 PR #1 新提交 `a318715` —— **✅ 复核通过（可合并）**

> PR：`kaihu8766-netizen/ai-finance-portfolio#1`；分支 `feature/review-stamp-and-hooks` = `a318715`（2 个提交：`dd6ccb0` + `a318715`）
> 相对 master 新增/修改 5 个文件：`.github/workflows/review-gate.yml`(20)、`REVIEW_STAMP.md`(56)、`hooks/install.sh`(21)、`hooks/pre-push`(77)、`tools/check_review_stamp.py`(51)
> 本地已检出于该分支（`## feature/review-stamp-and-hooks`），工作区干净 → 我直接在真实状态上跑了他们的脚本。

### 19.1 验收总表：**你点名的 4 项全部通过**

| # | 你要求的验证 | 判定 | 摘要 |
|---|---|---|---|
| ① | `REVIEW_STAMP.md` 不实记录是否已修正 | ✅ **9/9 全部修正** | `293dbb4` 移入"待复核/⏳"、第 4 行删掉假的"和CI会校验"、`ec94b0e`→§1、`700c01a`→v5 §16；并新增了"内容相等判据"和"批准后不要再提交"的运营规则 |
| ② | hook 是否从 commit 读凭证 + 锚定匹配 + 拦截删除/回退 | ✅ **3/3 全部实现**（实测 4/4 正确） | `:31 git show "$local_sha:REVIEW_STAMP.md"`、`:52 grep -qE "^\| *${commit} *\|.*✅"`、`:19` 拦删除、`:25` 拦非快进（真分叉/回退都拦得住） |
| ③ | `check_review_stamp.py` 内容相等判据是否正确 | ✅ **正确**（5 个场景实测） | 真实场景下 CI **现在是红的**（设计预期）；合成场景：⏳行不被当基线 ✅／改内容即拦 ✅／追加批准可收敛无死锁 ✅／假 sha 拦 ✅／无凭证拦 ✅ |
| ④ | `review-gate.yml` 是否完整 | ⚠️ **基本完整，缺 1 行** | 触发/`fetch-depth: 0`/两步检查都对；**未显式 checkout PR 头** → `pull_request` 事件下默认检出的是 GitHub 生成的**合并提交**（见 §19.5，1 行修复） |

**🚦 判定：✅ 复核通过，可以合并**（④ 的缺口今天不触发，且方向是"误红"而非"误绿"，属 fail-safe）。

### 19.2 ① `REVIEW_STAMP.md`：我上轮提的 3 处不实记录**全部修正**

| 我上轮的指摘 | 现在 | 判定 |
|---|---|---|
| `293dbb4` 被写成"第十八轮已批准"（实际未复核） | 移入新增的 **「待复核」表**，状态 `⏳ 待批准`，说明"依§17建议的2行文字修改（hotfix-A…）" | ✅ |
| 第 4 行"pre-push hook**和CI**会校验"（CI 不存在） | 改为只讲 pre-push hook；并新增 `:5-6` 说明 CI 用的是「内容相等」判据、且已接入 `review-gate.yml` | ✅ |
| `700c01a` 指向 v6 §9（错） | 改为 **`REVIEW_REPORT_v5.md §16`** | ✅ |
| （我另提的）`ec94b0e` 指向 §10 不够精确 | 改为 **`REVIEW_REPORT_v6.md §1`** | ✅ |

**另外主动加了三段我之前建议的内容** ✅：`:35-38` 的「重要运营规则：批准之后不要再提交任何东西」、`:40-48` 的「为什么用内容相等判据而不是逐条 sha 列表（会死锁）」、以及表格标题从"已批准的 commit"改为"已批准的**内容基线**"——**这三处说明这份凭证的设计意图已经被真正理解，不只是照抄结论**。
其余 8 行批准记录与我的报告章节编号**逐条对应** ✅（脚本已验：`a79b385`→§17 … `7fd8841`→§11）。

### 19.3 ② `hooks/pre-push`：三项修复全部到位

| 要求 | 实现 | 实测 |
|---|---|---|
| **从被推送的 commit 读凭证**（防工作区自我批准） | `:31 stamp="$(git show "$local_sha:REVIEW_STAMP.md" 2>/dev/null)"` | ✅ 静态核对；`:32-35` 读不到即拦截（安全默认） |
| **锚定匹配**（防违规记录里的 hash 被当成批准） | `:52 grep -qE "^\| *${commit} *\|.*✅"` | ✅ 用真实 stamp 实测 7 个 hash 全部符合预期：已批准 4 个命中；`293dbb4`（待批准）/`90d3fd4`/`d2c2c9e`/`256acc1`（违规记录）**全部不命中** |
| **拦截删除 master** | `:19-22 if [ "$local_sha" = "$zero" ]` → exit 1 | ✅ |
| **拦截非快进（force-push 回退）** | `:25 if [ "$remote_sha" != "$zero" ] && ! git merge-base --is-ancestor …` | ✅ 用真·分叉对实测 4/4：正常快进→放行；回退→拦；分叉（双向）→拦 |

> **⚠️ 我上一轮的测试用例判断错了，这里更正**：我在 §18.4 把 `a79b385 → a318715` 当作"分叉"来测，但 `a79b385` 其实是 `a318715` 的**祖先**（PR 分支基于 master，而 master 包含 `a79b385`），所以那次测的是**正常快进**（放行，正确）。本轮我在合成仓库里造了真正的分叉对（`main1` ↔ `side1`，互不为祖先）重测：**回退与分叉都被正确拦截** ✅。
> **教训**：用真实仓库测"祖先关系"时，很容易选中其实有祖先关系的两个提交——**先 `git merge-base --is-ancestor` 确认，或直接在合成仓库里造**。

**仍未处理的 🟢（与我 §18.4 一致，不影响合并）**：`%h` 缩写长度可变（仓库变大歧义时会假拦截）；hook 不跑 preflight；`install.sh` 仍 `cp` 覆盖已有 hook 且它的提示文案仍写"检查commit是否在批准列表中"（现在的语义是"批准表格 + ✅"）。

### 19.4 ③ `tools/check_review_stamp.py`：判据正确，5 个场景实测通过

他们的实现 = 我 §18.5 的方案，且自己补了 `:27` 的 `.*✅\s*已批准` 过滤（**这会自动排除"待复核/⏳"行**，比我给的版本更稳）：

```python
rows = re.findall(r"^\|\s*([0-9a-f]{7,40})\s*\|.*✅\s*已批准", stamp, re.M)
approved = rows[0]      # 最新一条批准记录 = 被复核的内容基线
…
subprocess.run(["git", "diff", "--quiet", approved, "HEAD", "--", ".", ":(exclude)REVIEW_STAMP.md"])
```

**实测（原样执行他们的脚本）**：

| 场景 | 结果 |
|---|---|
| **真实状态：直接在 PR 头 `a318715` 上运行** | **exit 1（CI 现在是红的）**，并列出差异文件：`review-gate.yml / CHANGELOG.md / PROJECT_BRIEF.md / hooks/install.sh / hooks/pre-push`（**不含 `REVIEW_STAMP.md`** → `:(exclude)` 生效 ✅）。**这正是设计预期**：添加批准记录后即转绿 |
| 合成 A：凭证顶部是 `⏳ 待批准` 行、下面是 `✅ 已批准` 行 | exit 0 ✅ —— **待批准行不会被误取为基线** |
| 合成 B：批准之后又改了一个文件 | exit 1 ✅（并打印 `--stat` 差异） |
| 合成 C：追加一条指向新内容的批准记录 | exit 0 ✅ —— **可反复迭代，无死锁** |
| 合成 D：凭证里的 sha 不存在（`deadbee`） | exit 1 ✅ |
| 合成 E：HEAD 里没有 `REVIEW_STAMP.md` | exit 1 ✅ |

**🟡 唯一可改进点（不阻塞）**：`:31 approved = rows[0]` 依赖"**最新一条写在最上面**"这个约定（`:26` 有注释说明）。若将来有人在表格**底部**追加新批准行，基线会退回到旧 sha → CI 会**红**（安全方向：误拦不误放）但原因难猜。建议改成"取 `✅` 行中**提交时间最新**的那条"：
```python
approved = max(rows, key=lambda r: int(sh("git", "log", "-1", "--format=%ct", r) or 0))
```
这样与书写顺序无关。（今天不必改。）

### 19.5 ④ `review-gate.yml`：基本完整，但**缺一行**（今天不触发，建议尽快补）

```yaml
on:
  pull_request:
  push:
    branches: [master]
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0          # ✅ 完整历史（内容比对需要）
      - run: python tools/preflight.py        # ✅
      - run: python tools/check_review_stamp.py   # ✅
```

✅ 触发条件正确（PR + push master 都跑）、`fetch-depth: 0` 到位、两步检查齐全；`python`/`node` 在 `ubuntu-latest` 上可用（你们现有 `pages.yml` 也一直这么用 ✓）；无 `permissions:` 块也不影响（默认只读）。

**⚠️ 缺的一行**：`pull_request` 事件下，`actions/checkout` **默认检出的不是 PR 头，而是 GitHub 为 PR 生成的合并提交**（`refs/pull/N/merge`）——也就是说 CI 里的 `HEAD` 是你 PR 头与 master 的合并结果。

- **今天不出问题**：PR 分支基于当前 master（`293dbb4`），master 没动 → 合并提交的内容 == PR 头内容 → 判据照样通过 ✅（我上面跑的"真实场景"就是等价情形）。
- **但 master 一旦前进**（例如先合了别的 PR），合并提交就会带上 master 的新内容 → 与批准基线不一致 → **CI 变红，而原因与这个 PR 无关**（方向是 fail-safe 的误红，不是误绿，所以不危险，但会很难排查）。
- **修复（1 行）**：
  ```yaml
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}   # 校验"我审过的那个提交"，而不是 GitHub 的合并结果
          fetch-depth: 0
  ```
  （`push: master` 事件下该表达式为空，checkout 会自动回落到默认 ref ✅）

**另外：这份工作流现在还不能"拦人"** —— 必须去 **GitHub → Settings → Branches → 保护 `master`** 勾选 **Require status checks** 并选中这项检查（名字形如 `Review gate / gate`），再加 **Require a pull request**（Approvals 设 **0**，单账号否则无法合并）+ **Do not allow bypassing**。**只有勾上之后，这个 PR 才真正是"闸门"；否则它只是一份会变红的报告。**

### 19.6 你会后要做的操作（照抄即可）

**第 1 步：只改 `REVIEW_STAMP.md`，在「已批准的内容基线」表的最上面加一行**（sha 必须是 `a318715` = 我这次审的内容）：

```markdown
| a318715 | 第二十轮 | 2026-09-13 | REVIEW_REPORT_v6.md §19 | ✅ 已批准 |
```

**第 2 步：把 `293dbb4` 从「待复核」表移到已批准表（放在 `a318715` 下面）**——它的内容已包含在本次基线里，我这次一并审过了：

```markdown
| 293dbb4 | 第十八轮建议(hotfix-A) | 2026-09-13 | 随第二十轮基线一并批准 | ✅ 已批准 |
```
（删掉「待复核」表里那一行；若保留该表则把它清空。）

**第 3 步：commit（只包含 `REVIEW_STAMP.md`）→ push 到同一分支 → 等 `Review gate` 变绿 → 合并**。
- ⚠️ **顺序与内容都很关键**：`rows[0]` 必须是最上面那行，且**批准之后不要再动任何其他文件**（改一行都不行），否则 CI 会（正确地）变红。
- 合并方式随意（merge / squash / rebase 都可以）：内容相等判据对三种都成立——这是我当初设计它而不用 sha 列表的原因 ✓。

**第 4 步（合并后，强烈建议）**：
1. **开启分支保护**（§19.5 末尾，不勾选的话这套机制等于没有闸门）；
2. 补 `ref:` 那 1 行（下一个 PR，我会快速复核）;
3. 可选：按 §19.4 把基线选择改成"按提交时间取最新"，免除书写顺序依赖。

### 19.7 我自己的更正（本轮）

**上一轮我把测试用例选错了**：§18.4 里我把 `a79b385 → a318715` 当成"分叉"来验证"force-push 回退是否被拦"，但两者其实有祖先关系（是正常快进）→ 那次结论"放行 ✅ 符合设计"是对的，但**标签错了**，容易被误读成"分叉也被放行"。本轮已用合成仓库里真正的分叉对重测并更正（§19.3 的提示）。
**规范增补**：*验证"祖先关系类"逻辑时，先用 `git merge-base --is-ancestor` 确认两点的关系，或者直接在合成仓库里构造需要的拓扑* —— 真实仓库里"看起来无关"的两个提交往往有祖先关系。

---

## §20 第二十一轮：复核 PR #2（`fix/l5-mechanism-polish` → `master`）—— **✅ 复核通过**

> PR #2 分支 = `428583b`（1 个提交，相对 `master`=`c24513f`）；改动仅 2 个文件、+3/−2 行
> **顺带确认：PR #1 已合并（`c24513f Merge pull request #1`），批准记录 `70430cb` 已进入 master。**
> 本地当前检出于 PR #2 分支（`fix/l5-mechanism-polish`），工作区干净 → 我在真实状态上跑了 CI 的两步。

### 20.1 验收总表

| # | 你要求的验证 | 判定 | 摘要 |
|---|---|---|---|
| ① | `review-gate.yml` 的 `ref` 是否正确 | ✅ **正确** | `ref: ${{ github.event.pull_request.head.sha }}` 位置正确（checkout 的 `with:` 内）、YAML 可解析、`fetch-depth: 0` 保留；PR 事件下检出**我审过的那个提交**（正是设计意图） |
| ② | 按提交时间取最新是否正确 | ✅ **正确**（4 场景实测） | 顺序颠倒仍取到较新那条 ✅；混入假 sha 不干扰 ✅；只有假 sha → 拦截 ✅；同一秒平局 → 回退文件顺序（fail-safe）|
| ③ | 分支保护设置是否完整 | ⚠️ **我无法核实**（不在 git 数据里，API 也不通） | 仓库内**没有任何**记录分支保护的脚本/文档；我只能给出精确自查清单（§20.4）。**请你自己在网页上确认** |
| — | 附加：PR #1 的真实合并是否满足内容判据 | ✅ **成立**（首次端到端闭环） | `git diff --quiet a318715 origin/master`（排除凭证）→ rc=0 ✅ |

**🚦 判定：✅ 复核通过，可以合并。** ①② 都对；③ 需要你按 §20.4 的清单自行勾一遍（我读不到仓库设置）。

### 20.2 ① `review-gate.yml` 的 `ref`：✅ 正确

```yaml
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}   # ← 本次新增
          fetch-depth: 0
```

| 核对项 | 结果 |
|---|---|
| `ref` 写在 checkout 步骤的 `with:` 下（不是写在别处） | ✅ |
| 值 = `github.event.pull_request.head.sha`（PR 头，即我审的提交） | ✅ |
| `fetch-depth: 0` 仍在（批准基线 sha 必须在本地才能 `git cat-file`/`git diff`） | ✅ |
| 触发条件未破坏（`pull_request` + `push: master`） | ✅ |
| YAML 可解析 | ✅（实测 `with = {'ref': …head.sha, 'fetch-depth': 0}`） |

**语义**：`pull_request` 事件下 → 检出 **PR 头提交**（而不是 GitHub 合成的 `refs/pull/N/merge`）→ CI 校验的对象与我复核的对象**完全一致** ✅。
`push` 事件下 → 该表达式为空 → `actions/checkout` 回落到默认 `ref/sha`（空字符串在 JS 里是 falsy，action 内部走默认分支）—— 我在本沙箱**无法执行 GitHub Actions**，这一条是依据该 action 的既定行为判断的（不是实测）。
> 若想更显式（可选）：`ref: ${{ github.event.pull_request.head.sha || github.sha }}`。

### 20.3 ② 基线改为"按提交时间取最新"：✅ 正确（4 个场景实测）

改动只有一行：
```python
approved = max(rows, key=lambda r: int(sh("git", "log", "-1", "--format=%ct", r) or 0))
```
（`rows` 仍是 `:27` 过滤出的 `✅ 已批准` 行；`or 0` 保证某行的 sha 不存在时不抛异常。）

| 场景 | 期望 | 实测 |
|---|---|---|
| 两行批准记录**顺序颠倒**（旧内容写在上面、新内容写在下面），**时间戳不同** | 应取较新那条 | ✅ **正确取到较新的**（`内容 = 48f3096`）→ **"免除书写顺序依赖"成立** |
| 批准表里混入一个**假 sha**（标 ✅ 但不存在） | 不应被选中 | ✅ 未干扰（假 sha 的 `%ct` 计算为 0，被 `max` 忽略） |
| 批准表里**只有假 sha** | 应拦截 | ✅ exit 1（由 `:34` 的 `cat-file -e` 兜住） |
| 两行**时间戳相同**（同一秒提交） | 观察回退 | ⚠️ `max` 并列时返回**列表里第一个** → 取到"写在上面"的那条；遵循你们"最新写在最上面"的约定则结果仍正确；不遵循则 **CI 变红（fail-safe，误红不误绿）** |

**关于平局**：Python 的 `max()` 在并列时返回第一个最大值，所以**"最新一条写在最上面"这个约定仍然是安全网**。同一秒内提交两个 commit 在现实中是可能的（快速改-提交-改-提交），所以建议在 `REVIEW_STAMP.md` 里把这条约定写成明文（现在只写在脚本注释 `:26` 里）。
> 想彻底消除平局依赖（可选）：`max(rows, key=lambda r: int(sh("git","log","-1","--format=%ct",r) or 0))` 前面加一步按 `%ct` 排序；或直接让基线 = "与 HEAD 内容相等的那条 ✅ 行"（若有）。

**PR #2 合并后的实际取值预测**（用真实时间戳核对）：`428583b` 的 `%ct`=`1789287185`（16:13:05）> `a318715` 的 `1789286181`（15:56:21）> `293dbb4` 的 `1789282920` → 你加上 `428583b` 那行后，`max` **会正确选中它** ✅。
并且实测：`git diff --quiet 428583b HEAD`（排除凭证）→ **rc=0** → 加完批准行 CI 即转绿 ✅（因为两者只差凭证文件本身）。

### 20.4 ③ 分支保护：**我无法核实**，请按此清单自查

**为什么无法核实**：分支保护是**仓库设置**，不进入 git 数据；我搜过 `tools/`、`.github/`、`PROJECT_BRIEF.md`、`DECISIONS.md`、`README.md` —— **没有任何文件记录或配置它**；同时 `api.github.com` 在本环境**网络不通**（`curl` rc=35 SSL 连接失败），所以我也拿不到设置内容。

**请到 `Settings → Branches → master` 逐项确认**：

| 设置 | 应设为 | 为什么 |
|---|---|---|
| **Require a pull request before merging** | ✅ 开 | 这是"禁止直接 push master"的**唯一服务端强制**（本地 hook 可被 `--no-verify` 绕过） |
| └ **Require approvals** | **0** | 你只有一个账号，设 1 会导致**永远无法合并**（没有人能 approve） |
| **Require status checks to pass before merging** | ✅ 开，并勾选 **`Review gate`**（job 名 `gate`，列表里形如 `Review gate / gate`） | 这一步才把 CI 变成**闸门**；不勾的话 CI 会变红但**没人必须理它** |
| **Do not allow bypassing the above settings** | ✅ 开（推荐） | 否则管理员仍可直推，"赶时间"就会走这条路 |
| Require linear history | ❌ **不要开** | 你们现在用 merge commit 合并（见 `c24513f`），开了会强制 squash/rebase |
| Restrict who can push | 可不设 | 单人仓库无意义 |

**我能核实的部分（已完成）**：
- 工作流确实会在 PR 上跑，并且**检查名会是** `Review gate / gate`（`name: Review gate` + job `gate`）；
- 这道闸门**真的拦人**：在 PR #2 当前头上实测 `check_review_stamp.py` → **exit 1**（列出那 2 个改动文件）；`preflight.py` → exit 0（第一步是绿的）。

### 20.5 附加：PR #1 的真实合并**通过了端到端验证** ✅（L5 首次跑完真实流程）

| 校验 | 结果 |
|---|---|
| `git diff --quiet a318715 origin/master -- . ':(exclude)REVIEW_STAMP.md'` | **rc=0** ✅ —— **合并后 master 的内容 = 我批准的内容基线** |
| 同上但**不排除**凭证文件 | rc=1 ✅ —— 说明唯一的差异就是 `REVIEW_STAMP.md` 自身（`:(exclude)` 的作用正是如此） |
| master 上的批准记录 | 表首行 = `a318715 第二十轮 … §19 ✅ 已批准`、第二行 = `293dbb4 … 随第二十轮基线一并批准` ✅ 与我 §19.6 的指引一致 |
| 提交时间 | `428583b`(16:13) > `a318715`(15:56) > `293dbb4`(15:02) → 基线选取顺序正确 ✅ |

→ 也就是说：**从"我复核 → 你加批准记录 → CI 判据 → GitHub 合并"这条链路，第一次完整走通了，并且事后可验证**。这套机制现在是真的在工作，不是纸面规则。

### 20.6 合并操作（照抄即可）

**第 1 步：只改 `REVIEW_STAMP.md`，在「已批准的内容基线」表最上面加一行**
```markdown
| 428583b | 第二十一轮 | 2026-09-13 | REVIEW_REPORT_v6.md §20 | ✅ 已批准 |
```
（sha 必须是 **`428583b`**；放最上面——平局时的安全网）

**第 2 步：commit（只含这一个文件）→ push → 等 `Review gate` 变绿 → 合并**
- ⚠️ 批准之后**不要再动任何其他文件**（改一行都不行），否则 CI 会正确地变红。
- 合并方式随意（merge / squash / rebase），内容相等判据对三种都成立。

**第 3 步：合并后立刻做两件事**
1. **按 §20.4 打开分支保护**（这是本次唯一还没落地的环节；不打开的话，`Review gate` 只是个会变红的报告）；
2. 可选：在 `REVIEW_STAMP.md` 里把"最新一条写在最上面"写成明文（现在只在脚本注释里）。

### 20.7 判定

**🚦 判定：✅ 复核通过，可以合并。**
- ①② 实测正确；③ 属于仓库设置，我**读不到**（且 API 不通）→ 已给出逐项清单，请你勾选确认后再合并比较稳妥；即便先合并，也请**务必**随后打开分支保护，否则 L6 缺位。
- 本次改动**无风险**：只动了一个 CI 配置的 1 行和一个 Python 表达式的 1 行，且都不影响站点内容（`index.html`/`tools/preflight.py` 未变）。

### 20.8 我自己的更正（本轮）

本轮我的**测试脚本**自己出了 3 个 bug，全部被"编译前置检查 + 实跑"抓出，记录如下（说明这类自查有效）：
1. 用非贪婪正则抽取报告/代码行时**截断了表达式** → `SyntaxError`（已改为按行取整行）；
2. 把 `%ct` 直接写进 Python 格式化字符串 → `TypeError: not enough arguments`（`%` 需转义为 `%%`）；
3. 字符串里嵌了 ASCII 双引号 → `SyntaxError`（这是我这边的老毛病，靠 `ast.parse` 前置检查拦下）。
另外**第一个平局测试用例是我自己设计错了**：我本想验证"顺序颠倒也能取对"，但两次提交落在**同一秒**，触发了平局回退路径 → 我把时间戳拉开后重测，才正确验证了该改进（§20.3 场景 1b）。
**规范增补**：*构造"按时间排序"的测试用例时，必须显式设置 `GIT_COMMITTER_DATE`（或 `--date`）把时间戳拉开*，否则会误测成"逻辑错误"。

---

## §21 第二十二轮：读信（双AI讨论方案）+ **发现线上可见缺陷：3 个角色图标已损坏**

> 触发：主力AI 写来 `DUAL_AGENT_DISCUSSION.md`（把"四角色 AI 协作实战"模块改造为"双Agent协作范式"，并问我 6 个问题）。
> 我的处理：**先把信里引用的每个事实在仓库里核对一遍**（要写进作品集的数据必须为真）——核对过程中发现了一个线上可见缺陷。
> 我的完整回应已写入 `DUAL_AGENT_DISCUSSION.md` 的「复核AI（DeepSeek）的回应 · 第二十二轮」一节（含 6 问逐条回答 + 可直接用的文案建议 + 同类扫描清单）。

### 21.1 🔴 本轮最重要发现：模块里 3 个角色图标被写坏，**线上也是坏的**

| 检查项 | 结果 |
|---|---|
| `index.html:1871-1873` 内嵌图解码后头 12 字节 | `EF BB BF EF BF BD 50 4E 47 0D 0A 1A 0D 0A` → **不是合法 PNG**（应为 `89 50 4E 47 0D 0A 1A 0A`） |
| 合法 PNG base64 前缀 `iVBORw0KGgo` 在 `index.html` 的出现次数 | **0**（正常应有 3 处） |
| `assets/claude_icon.png` / `workbuddy_icon.png` / `trae_icon.png` | 同样是坏字节（23307 / 27240 / 17748 字节，magic 全部错误） |
| **线上站点**（抓 `index.html` 比对） | **同样损坏**：`77+9UE5HDQoa` ×3、`iVBORw0KGgo` ×0（与本地一致） |
| 对照组 `index.html:1583` 的 JPEG 内嵌图 | ✅ 正常（`ff d8 ff e0 …JFIF`） |
| 引入提交 | **`9946fd1`**「fix: logo图片改为base64内嵌，避免手机端加载失败」；其父提交 `a4f9991` 里三个图标**都是完好 PNG** |
| 检查8/9 为何都没发现 | 文件是**合法 UTF-8**、**不含任何乱码特征字** → 损坏发生在 **base64 载荷内部**，两个检查的判据天然看不见 |

**根因（三条独立证据指向同一结论）**：
1. 开头 `EF BB BF` = **UTF-8 BOM** → 写回时带了 BOM（`utf-8-sig` / PowerShell `-Encoding utf8`）；
2. 紧随 `EF BF BD` = **U+FFFD 替换字符** → 原 `0x89` 被顶掉 ⇒ **把二进制按 UTF-8 解码、非法字节用 `errors=replace`**；
3. 签名尾部 `1a 0a` → `1a 0d 0a` ⇒ 还发生了 **LF→CRLF 换行转换**。
⇒ **PNG 被当文本读、再当文本写回**；文件里 **6198 个 U+FFFD**，原始字节**永久丢失（不可逆）**。
⇒ 与"GBK 陷阱"**同族**：都是**文本/二进制混淆**；现有强制规则 3 只写了"编码"，**还缺"二进制文件禁止走文本路径"这一条**。

**恢复方案（历史里有完好版本，可完全修好）**：
```bash
git checkout 9946fd1~1 -- assets/claude_icon.png assets/workbuddy_icon.png assets/trae_icon.png
# 再用 Python 以**二进制**读取 + base64 重新内嵌 index.html:1871-1873
#   顺序按解码后大小对应：1871=workbuddy(14991B) / 1872=trae(9826B) / 1873=claude(12980B)
# 验收：解码后 magic = 89 50 4e 47 0d 0a 1a 0a；浏览器三个图标正常显示
```

**建议新增 preflight 检查10（图片完整性）** —— 判据可直接实现：
- a) 每个 `data:image/(png|jpeg);base64,` 载荷：base64 合法 **且** 解码头符合图片 magic；
- b) 被引用的 `assets/*.{png,jpg}`：magic bytes 正确；
- c) 反向断言：解码头若为 `EF BB BF`（BOM）或含 `EF BF BD`（U+FFFD）→ 报"二进制被当文本写坏"。

> ⚠️ **含义很直接**：如果按讨论信把它写成"0 严重问题"，而站点上三个图标是破的 —— 这是最容易被面试官当场抓到的反差。**先修，再把这件事作为"机制迭代"的案例写进去**（§21.3 案例3）。

### 21.2 事实核对：讨论信里 3 处不准确（写进作品集前必须改）

| # | 信中说法 | 实际情况（已核对） |
|---|---|---|
| 1 | "原数据：**21轮迭代** / 0严重问题 / 100%决策可追溯" | 当前模块文案是 **"SOX 审计工作台 v1→v5 · 5 轮迭代"**，统计卡（`:1904-1913`）= `5 轮迭代` / `0 严重问题` / `100% 决策可追溯`。**"复核轮次 21"是另一个指标**，不能拿去替换作品迭代数 |
| 2 | "沉淀强制规则 3 条（Windows编码、复核流程、**hotfix白名单**）" | `PROJECT_BRIEF.md` 实际 3 条 =【强制规则1】触发复核 /【强制规则2】先核实再动手 /【强制规则3】Windows文本编码。**hotfix 白名单从未写进规范**（仅是我报告里的建议）；`PROJECT_BRIEF` 也未记载 `REVIEW_STAMP`／分支保护 |
| 3 | "人裁决：**落地 L5/L6（分支保护**+CI闸门+复核凭证）" | L5（凭证 + CI 闸门）✅ 已落地且**已在 PR #1 上真实生效**；**L6 分支保护我无法核实**（不在 git 数据里、仓库无记录、`api.github.com` 本环境不通）→ 请确认后再写进作品集 |

**另一处对外角色不一致（本次必须一并统一）**：站上把"独立审计师"写作 **Claude**（`1873` 图标、`2150` 知识库角色表 `{"name":"Claude","role":"Independent Auditor"}`、`2684` 面试题），而**实际复核AI 是 DeepSeek**（讨论信自己也这么写）。`1619`/`1821` 属正常技能提及，`4604` 是页脚工具链。注意 `assets/claude_icon.png` 文件名与图标也需随之调整（目前**没有** deepseek 图标资产）。

### 21.3 6 个问题的回答要点（完整版见讨论文件）

| # | 问题 | 我的结论 |
|---|---|---|
| 1 | 标题"双Agent协作范式"是否准确 | 事实描述准确（确实只有两个 AI 在讨论），但"**范式**"偏大 → 建议 **`双Agent复核机制`** / 英文 **`DUAL-AGENT REVIEW WORKFLOW`**；更重要的是**把它讲成可验证的机制，而非理念** |
| 2 | 去掉 TRAE 是否合理 | 合理，但**别删历史** → 结构改为「核心三角色（人/主力AI/复核AI）+ 一行**执行工具链**」（TRAE/Codex/Kimi 放工具层，页脚 `4604` 已这么写 ✅）。"谁决策/谁提方案/谁复核"是**角色**，"用什么跑"是**工具**，原版把两者混在一起才别扭 |
| 3 | 案例选择是否合适 | 合适，但骨架要从"我们犯过错"改成「**现象→根因→机制→下一次被拦住**」；**案例2 最硬**（3 次违规 → 根因"用户在等"把"看效果"与"上线"绑一起 → 凭证+CI闸门 → **PR #1 实证**）；**建议加案例3** = 本轮图标损坏 → 新增图片完整性检查（**必须先修好再写**）；不要写"0 严重问题" |
| 4 | 用什么数据 | 全换成**可当场核对**的量：复核 **21 轮**、凭证 **12 条批准 + 3 条违规**、自动检查 **preflight 9 项 + CI 2 步**、强制规则 **3 条**、覆盖率 **25/25 = 100%**；严重问题写"全部修复并转化为检查项" |
| 5 | 面试官视角 | 财务岗吃 **内控类比**（建议原话："这和我做的 SOX 内控测试是同一个思路：把易错环节变成**有记录、有复核、有拦截**的流程"）；AI 岗吃**失效模式 + 工程防御**；共同关心**你的裁决判断力**。三条不要写：别把 AI 写成"同事/团队"、别写"AI 自己会检查"、别写"落地到公司" |
| 6 | 作品06 的"四角色"要不要统一 | 要改，但概念要分清：主页的"双Agent" = **讨论主体数**；作品06 的"四" = **流水线执行 Agent 数** → 作品06 统一写 **"4-Agent 流水线 + 1 个人工复核节点"**（把"1人+3AI"改掉，它把人和 Agent 混在一个计数里）。两者反而呼应：**底层多 Agent 提效，上层双 Agent 控风险** |

### 21.4 同类扫描清单（改版实施用；我已扫好）

| 要改的内容 | 出现位置（行号） |
|---|---|
| 「四角色」共 **25** 处（含「四角色协作」17 处） | `107` `713` `1494` `1697` `1698` `1862` `2094` `2107` `2108` `2110` `2123` `2143` `2182` `2184` `2192` `2195` `2201`（**含 offlineReplies 话术库**） |
| 「1人+3AI」共 **7** 处 | `2107` `2108` `2110` `2123` `2182` `2192` `4944` |
| `Claude` **7** 处 | `1619` `1821` `1873` `2150` `2266` `2684` `4604` |
| `TRAE` **3** 处 ／ `WorkBuddy` **4** 处 | `1872` `2149` `2266` ／ `1871` `2148` `2266` `4604` |
| 作品06 模板 | `4944`（1人+3AI 四角色）、`4981`（四 Agent 协作架构） |

### 21.5 判定与下一步

**🚦 判定：方案方向 ✅ 可以推进；但有 1 个 🔴 必须先修。**
1. **先修图标**（§21.1；历史可回滚：`9946fd1~1` 三个资产 + `index.html` 三行）；
2. 修完**加检查10**（图片完整性）—— 本轮教训的直接产物；
3. 再按讨论文件改文案/结构/话术库（**结构类改动 → 先复核再 push**，走凭证 + CI 闸门）；
4. 写进作品集前**先改掉 §21.2 的 3 处事实**，并统一"独立审计师"的角色名；
5. **L6 分支保护状态请确认**（我核实不了），确认后才写进作品集。

### 21.6 规范增补（建议写进 `PROJECT_BRIEF.md` §9.7）

1. **二进制文件禁止走文本路径**：`.png/.jpg/.ico/.woff/.pdf` 等一律 `open(path,'rb')` / `'wb'`；
   **禁止** `Set-Content`/`Out-File`/`>`/文本模式 `open()` 处理二进制；
   **禁止**把二进制 `decode(errors='replace')` 后再写回（`U+FFFD` 不可逆）。
   > 判据：任何"把图片/字体改成 base64 内嵌"的操作，做完后**必须校验解码头 magic**（`9946fd1` 就是漏了这一步）。
2. **preflight 增加检查10（图片完整性）**，判据见 §21.1。
3. **"能被当场核对的数字"优先**：作品集/CHANGELOG 里的统计数字要写明可核对位置（本轮"21轮迭代"与"5 轮迭代"混用即为例）。

---

### 21.7 已定案的最终方案（第二十二轮补充：命名更正 + 图标定案）

> 作者定案：**主力 Agent ＝ 豆包 2.1 Turbo（本身就是 Agent），WorkBuddy 退出叙事**；新模块**用图标**（豆包 + DeepSeek Harness）。
> 本节是 §21.1–§21.6 的**补充与更新**；完整作业细节见 `DUAL_AGENT_DISCUSSION.md` §9–§11。

**（1）命名口径**（官方口径已核）
- 正式名称：**豆包大模型 2.1 Turbo**（**Seed 2.1** 系列，与 Pro 并列两档；官方重点宣传 Coding 与 Agent 能力）。
  参考：[百度百科词条](https://baike.baidu.com/item/%E8%B1%86%E5%8C%85%E5%A4%A7%E6%A8%A1%E5%9E%8B2.1%20Turbo/68108665)、[Seed 2.1 Pro/Turbo 发布](https://tech.ifeng.com/c/8uBalPRxcZq)、[官方强调 Coding 与 Agent 能力](https://www.chinaz.com/ainews/29080.shtml)
- 拼写是 **Turbo**（作者原话 "tubor" 系笔误）；建议作品集写法 **`豆包 2.1 Turbo（主力 Agent）`**。
- ⚠️ 口径细节：严格说它是**模型**，以 Agent 模式（工具调用、多轮执行）运行。被追问时的标准答法：**"模型以 Agent 模式运行，在流程里承担主力 Agent 的角色"**。
- 复核 Agent ＝ **DeepSeek Harness**；**人仍是裁决者，不计入 Agent 数**（沿用 `D003` 的原则）。

**（2）图标定案**
- 新增 **2 个**资产：`assets/doubao_icon.png`（豆包）、`assets/deepseek_icon.png`（DeepSeek Harness）；规格 **正方形、透明底、32×32 或 64×64、≤ 3KB**。
- 角色行结构变为三行：`H` 我（**沿用现有文字徽标，不改**）＋ 豆包 ＋ DeepSeek Harness，`<img>` 样式沿用现有 `width:18px;height:18px;border-radius:4px;vertical-align:-4px;margin-right:6px;object-fit:cover`，`alt` 同步改。
- 旧的 3 个坏资产（claude/trae/workbuddy）：**推荐 `git rm`**（新设计不再使用）；若要留则先 `git checkout 9946fd1~1 -- …` 恢复成合法 PNG，**不可原样保留坏文件**。
- **体积账**：旧三个图标的 base64 合计 **91,060 字符（≈89KB）**；换成两个 ≤3KB 的图标后合计 ≈3KB → **`index.html` 顺带瘦身 ≈86KB**。

**（3）生成工具：`tools/make_icon_datauri.py`（我已实测 4 个场景）**

| 输入 | 结果 |
|---|---|
| 合法 PNG（14991 字节） | exit 0，生成可粘贴标签；**解码后与原始文件逐字节一致** ✅；并提示"偏大，建议压到 ≤3KB" |
| **当前坏 PNG**（`assets/workbuddy_icon.png`） | **exit 1 拒绝**（`不是合法 PNG/JPEG（前8字节=efbbbfefbfbd504e）`）✅ |
| 非图片文件 | **exit 1 拒绝** ✅ |
| 一次传两个文件 | exit 0，输出两条标签 ✅ |

→ **关键性质：用这个脚本，坏图根本生成不出标签** —— 从工具层面堵住 `9946fd1` 那类事故（当时是用文本路径做 base64 才写坏的）。

**（4）⚠️ 改名波及的不只是站点（我已扫全仓库）**

| 文件 | 位置 | 动作 |
|---|---|---|
| `index.html` | `1871-1873`（图标+alt）、`2148/2149/2150`、`2266`、`2684`、`4604` ＋ 四角色 25 处 / 1人+3AI 7 处 | 去掉 WorkBuddy / TRAE / Claude，统一新表述 |
| **`README.md`** | `79-88`（`## 四角色协作体系` ＋ 同款表） | **仓库门面，必须同步** |
| **`PROJECT_BRIEF.md`** | `87-96`（§8 同名表）、`:120` | 同步（所有 AI 的作业依据） |
| **`DECISIONS.md`** | `38-45`（`D003` 结论"四角色协作（1人+3AI）"） | **新增 `D015` 取代它**（草稿见讨论文件 §11.4）——否则决策日志与站点互相矛盾 |
| `CHANGELOG.md` | `:98` 已有"四角色协作部分弱化（已不用该模式）" | 记一笔本次改名即可（说明方向早已开始） |
| `REFLECTION_2026-09-12/13.md` | 历史反思里的 `豆包`/`WorkBuddy` | **保持原样**（事实记录） |
| `PROJECT_BRIEF.md:109` | 工作目录路径 `…\Users\ROG\WorkBuddy\…` | ❌ **不要改**（真实文件系统路径，改了文档就错） |

**（5）执行顺序（8 步）**
① 备好 2 个新图标（≤3KB）→ ② 用脚本生成标签并验 magic → ③ 替换 `1871-1873` 三行 + 改 `alt` → ④ 处理旧的 3 个坏资产 → ⑤ 改站点文案/话术库/面试题 → ⑥ **同步 `README.md` / `PROJECT_BRIEF §8` / 新增 `DECISIONS D015` / 记 `CHANGELOG`** → ⑦ 加**检查10** ＋ 把"**二进制文件禁止走文本路径**"写进 `PROJECT_BRIEF §9.7` → ⑧ `preflight.py` 全绿 → **触发复核** → 合并（走凭证 + CI 闸门）。

---

## §22 第二十三轮：`feature/dual-agent-collab` 复核报告

> 范围：单提交 `756aaea`（13 个文件）；相对 `master = 72e396c`。
> **判定：⚠️ 建议修完 P0（4 项）再合并**；P1 6 项、P2 7 项。**图标与检查10 两项完全合格**（含"能否抓住历史事故"的实测）。
> 分级：**P0 = 用户可见缺陷或不实陈述**；**P1 = 功能性/事实性不一致**；**P2 = 打磨与一致性**。

### 22.1 你列的 8 个复核重点 → 结论速览

| # | 复核重点 | 结论 |
|---|---|---|
| 1 | 双Agent 模块文案逻辑/专业度 | ✅ **整体达标**（介绍段、讨论闭环、防御机制三段都专业），但有 1 处**空卡片**（P0-1）与几处口语化（P2-1） |
| 2 | 图标是否正常显示 | ✅ **完全合格**（见 §22.2.1，逐字节核验） |
| 3 | Claude/WorkBuddy/四角色 是否还有遗漏 | ⚠️ **`index.html` 已清零**，但 **README / PROJECT_BRIEF / KB 角色表仍有**（P0-2、P0-3、P0-4）；站点内还有 3 处非关键词残留（P1-5） |
| 4 | 话术库/知识库是否与新模块一致 | ⚠️ **部分一致**：新术语能答（双Agent/4-Agent ✅），但**模块自己展示的机制词全部答不了**（探针 18 题里 12 题落越界，含"复核凭证/分支保护/检查项数/轮次统计"）→ P1-4 |
| 5 | 数据统计（21轮/12条/9+2）是否准确 | ⚠️ 21 轮 ✅（与公开凭证一致）、12 条 ✅；**"9+2"与"9项检查"过时**（实际 10 项）→ P1-1 |
| 6 | 实战案例是否真实可信 | ⚠️ 骨架与事实基本真实（三次违规、PR #1 实证 ✅），但**"落地 hotfix 白名单"不实**（规范里没有）→ P1-2；**"分支保护"我无法核实** → P1-3 |
| 7 | 作品06 与主页概念是否清晰 | ✅ **清晰**：作品06「4-Agent 流水线 + 1 个人工复核节点」是**执行体数量**，主页双 Agent 是**讨论主体**，两者不冲突；仅"4 轮评审 vs 改了5轮"口径需说明（P2-3） |
| 8 | preflight 10 项是否全通过 / 检查10 逻辑 | ✅ **10 项全绿**；检查10 **逻辑正确且有效**（实测能抓住历史那次损坏）→ §22.2.2；有 5 处可打磨（P2-4） |

### 22.2 已通过的部分（含实测证据）

#### 22.2.1 图标 ✅ 完全合格

| 核验项 | 结果 |
|---|---|
| 新资产 magic | `doubao_icon.png` 3590B / `deepseek_icon.png` 4567B，**均为 `89504e470d0a1a0a`** ✅ |
| 内嵌 data URI（`1871`/`1872`） | 解码后**与 assets 文件逐字节一致** ✅（3590 / 4567 字节） |
| 坏形态残留 | `77+9UE5HDQoa` **0 处**；`iVBORw0KGgo` **2 处** ✅ |
| 旧坏图标 | 3 个已删除 ✅ |
| 体积 | 内嵌 PNG base64 从 **91,060 字符**降到 **10,880 字符**（≈省 78KB）✅ |
| `alt` / 角色标签 | `alt="豆包"` / `alt="DeepSeek"`；标签 `主力AI（豆包 2.1 Turbo）` / `复核AI（DeepSeek Harness）` ✅ |

#### 22.2.2 检查10 ✅ 逻辑正确，且**能抓住它要防的那次事故**

| 测试（沙箱内喂给 `check_image_integrity`） | 结果 |
|---|---|
| 当前正常版本 | 报错 **0** 条 ✅（无误报） |
| 把**历史损坏载荷**（合法 base64、解码后是 BOM+U+FFFD+PNG）塞进 1 个 data URI | **报错 1 条**：`❌ 内嵌图2: PNG magic不正确` ✅ |
| 2 个 data URI 都换成损坏载荷 | **报错 2 条** ✅（逐图计数） |
| PNG 声明里放 JPEG 字节 | 报错 1 条：`JPEG magic不正确`（反向也覆盖）✅ |
| 截断 base64（长度 %4≠0） | 报错 1 条：`base64解码失败` ✅（fail-closed） |
| 注入坏 `svg+xml;base64` | 报错 **0** 条 ❌ **盲区**（P2-4③） |

已正确接入 `main()`（`tools/preflight.py:316`，定义在 `:198`）✅

#### 22.2.3 体检与回归 ✅

- `python tools/preflight.py` → **exit 0**，检查 1–10 全部通过 ✅
- `node tools/coverage_test.js` → **37 题全过**（越界 3/3、话术断言 9/9、覆盖率 100%）✅；**且"四角色AI协作体系是怎么运作的"仍走话术档**（因为 `:2193` 保留了"协作体系/怎么运作"通用词）→ 旧问法没退化 ✅

#### 22.2.4 文案质量 ✅ 基本达标（举例）

- `1864` 介绍段：**写得好**——"单一AI有幻觉、确认偏误、自我盲区→财务场景对准确性要求极高→双Agent复核机制→两个AI平等讨论、人做裁决→这和我做的SOX内控测试是同一个思路" ✅ 内控类比到位、无夸大 ✅
- `1894-1901` 讨论闭环：**现象→根因→讨论→裁决→沉淀**五段式，且以 `PR #1 实证：不补凭证就合不进去` 收尾 ✅ 这正是我 §21.3 建议的骨架 ✅
- `1921` 核心价值句（"不是简单地用AI，而是两个AI平等讨论、人做裁决……和SOX内控测试是同一个思路"）✅
- `1938` 防御机制收尾（"我知道AI容易在哪出错，并且把它们变成了工程化的闸门"）✅ 比旧版"不是说AI有多厉害"更专业
- `2193` 新话术：四段式（主力提方案 / 复核独立审查 / 人裁决 / 沉淀规则）+ PR #1 实证 ✅ 准确、可核对
- 面试题 `2692` 已从"Claude作为独立审计师"改为"**DeepSeek作为复核AI**具体做什么" ✅
- `DECISIONS.md` D015 ✅ 取代 D003、保留了"人是裁决者、不计入 Agent 数"的原则 ✅
- 作品06 `4952` / `4989` 已改为「4-Agent 流水线 + 1 个人工复核节点」/「4-Agent流水线架构」✅

#### 22.2.5 数据 ✅（可核对）

- "**21 轮复核**" ✅ 与公开的 `REVIEW_STAMP.md` 最新批准记录（`428583b = 第二十一轮`）一致 → **访客可在仓库里核对** ✅（建议每次复核后同步更新；本轮是第二十三轮）
- "**12 条批准基线**" ✅ 实测 `REVIEW_STAMP.md` 已批准 12 条 + 违规记录 3 条 ✅（"三次流程违规"也与此一致 ✅）

### 22.3 🔴 P0（必须改，4 项）

**P0-1 空卡片会真实渲染**（`index.html:1925`）
```html
<div class="glass" style="margin-top:16px;background:…;border:1px solid rgba(251,191,36,0.18);border-radius:16px;padding:20px 24px"></div>
```
- 该 `<div>` **没有任何内容**，紧跟 `:1926` 就闭合 → 因为 `.glass`（`index.html:1141`）带背景/边框/内边距，页面上会出现**一个空白的有边框卡片**。
- 唯一的空容器隐藏规则是 `.portfolio-page .wrap > div:empty{…display:none}`（`index.html:859`），而**本模块在首页 `.wrap` 内（不在 `.portfolio-page` 里）**→ 规则**不适用**。
- **建议**：删除 `:1925` 这一行（若原意是"实战案例"卡片，其内容已在上方 `1893-1923` 的讨论闭环里）。

**P0-2 `PROJECT_BRIEF.md §8` 只改了标题，正文没改**
| 行 | 现文本 | 应改 |
|---|---|---|
| `:87` | `## 8. 双Agent复核机制` | ✅ 已改 |
| `:89` | `作者采用"1人+3AI"的协作模式：` | ❌ → `作者采用"人 + 2 Agent"的协作模式：` |
| `:94` | `\| 主力AI \| … \| 豆包/WorkBuddy \|` | ❌ → `豆包 2.1 Turbo` |
| `:95` | `\| 执行AI \| … \| TRAE \|` | ❌ 该行应删除或改为"工具层（按需选用）" |
| `:111` | `主力AI（豆包/WorkBuddy）和复核AI（DeepSeek Harness）共用此目录。` | ❌ → `主力AI（豆包 2.1 Turbo）` |

→ **这份文件是所有 AI 的作业依据**，标题说双Agent、正文写1人+3AI+WorkBuddy+TRAE，会让后续协作直接跑偏（P0）。

**P0-3 `README.md` 正文与自己的标题矛盾**
- `:79` 标题已是 `## 双Agent复核机制`，但 `:81` 仍写 `本项目采用"1人+3AI"协作模式：`；表格 `:83-88` 仍是 4 行（含 `执行AI | 工具层（按需选用）`）。
- README 是**仓库门面**（面试官先看这里）→ 建议与站点用同一段替换文本（我 §11.3 已给过可粘贴版本）。

**P0-4 知识库角色表仍把 TRAE 当角色，且 `CHANGELOG` 声称已修正（不实）**
- `index.html:2152` 键名仍是 `"fourRoleCollab"`；`:2153` 描述仍是旧的"任务拆清楚、AI执行、人来验收……"
- `:2157` 仍是 `{"name": "TRAE", "role": "Builder / 第二大脑", "duty": "按任务信执行、视觉自检、Bug修复、执行前回讨论信"}`
- 而 `CHANGELOG.md:239` 写"**知识库角色表与实际不符（Claude/WorkBuddy/TRAE → 豆包/DeepSeek/工具层）**"（列为"修复"）→ **声明与事实不符**。
- **建议**：删除 `:2157` 那行（或改为工具层说明）、键名改 `dualAgentCollab`（记得同步引用它的代码）、`:2153` 描述改成双Agent口径；然后 `CHANGELOG` 那句才成立。

### 22.4 🟡 P1（6 项）

**P1-1 "9+2" / "9项检查" 已过时（实际 10 项）**
- `:1912-1913` 统计卡 `9+2 / 自动检查+CI闸门`；`:1933` `preflight 自动体检（9项检查）`；`CHANGELOG.md:231` 也写 `9+2自动检查CI闸门`
- 实测 `preflight.py` 检查编号 = **1…10**（`check_image_integrity` 是第 10 项）→ 应改成 **`10+2`** / **`（10项检查）`**，并在 `:1933` 的举例里补上"**图片完整性**"（否则这个新检查等于白加）。
- 提示：**这正是"新增了检查却忘了改数字"的典型** —— 建议把"检查项数"改成动态或写"10 项（含图片完整性）"。

**P1-2 "落地 hotfix 白名单"不实**
- `:1899` `人裁决：采纳双方意见，落地复核凭证+CI闸门+hotfix白名单`；`:1900` `沉淀规则：写入PROJECT_BRIEF.md强制规则`
- 实测 `PROJECT_BRIEF.md` 只有 3 条强制规则：**①触发复核 ②先核实再动手 ③Windows文本编码**；**没有任何 hotfix 白名单条款**（我也在 §21.2 提过）。
- **建议**：二选一 —— ① 把 hotfix 白名单写进 `PROJECT_BRIEF.md`（条文：*hotfix 仅限"纯恢复/单行纯文本/单行路径/单行关键词/revert"，其余一律走常规复核通道*）；② 文案改为"复核AI建议 hotfix 白名单机制（**待落地**）"。

**P1-3 "分支保护"声明我无法核实（第三次提醒）**
- `:1937` `• 分支保护 → 禁止直推master，必须走PR`
- 分支保护**不在 git 数据里**；仓库内无任何记录；本环境 `api.github.com` 不通 → **我无法确认它是否真的开启**。
- **建议**：确认已开启（`Settings → Branches → master`：Require a pull request + Approvals 0 + Require status checks 勾 `Review gate` + Do not allow bypassing）后再保留这句话；否则这是对外承诺了一个不存在的控制。

**P1-4 知识库缺"新机制"条目：模块展示的概念，助手答不了**
探针 18 题实测（走哪一档）：

| 问题 | 档位 |
|---|---|
| 双Agent复核机制 / 双Agent怎么运作 | **canned** ✅ |
| 4-Agent流水线是什么 | **canned** ✅ |
| 作品06和主页的双Agent是什么关系 | **kb_strong** ✅ |
| 主力AI是哪个模型 / 你和AI怎么协作的 | kb_weak（引导，未直答）⚠️ |
| **豆包 2.1 Turbo 是什么** | **越界** ❌ |
| **复核凭证是什么 / 分支保护开了吗 / 检查10是什么 / 21轮复核是怎么统计的 / 这个项目有多少条强制规则 / preflight检查几项** | **越界** ❌ |
| 四角色是什么 / 四角色协作 / 你们是四角色协作吗 | **越界** ❌ |
| TRAE是什么 / Claude是谁 | 越界 ✅（降级/退出叙事，不答是对的） |

→ **建议**：新增 1–2 条话术（例如 kw 含 `复核凭证/CI闸门/强制规则/检查` → 回答"复核凭证+CI闸门+3条强制规则+10项体检"）；给 `:2193` 的 kw 补 `豆包`/`主力AI`/`2.1 Turbo`，让"豆包 2.1 Turbo 是什么"能直答。

**P1-5 旧术语"四角色"仍在**（站点内 6 处，其中 3 处可见）
- `:1697` `四角色AI协作模式；UI全面重构；能力四宫格；…`（演进历史时间线，**可见**）
- `:1698` `<span>四角色协作</span>`（标签，**可见**）
- `:2151` KB `versions` 串里 2 处（知识库文本）
- `:107` / `:713` CSS 注释（不可见，源码可见）
- **建议**：① 时间线改成**演进叙事**（"四角色 AI 协作模式 → 双Agent复核机制"），既消除矛盾又展示迭代；② `:2193` 的 kw 里补一个 `四角色` 作**向后兼容别名**（一个词，成本极低，能让旧问法继续命中）——探针显示"四角色协作"目前掉越界 ❌。

**P1-6 `CHANGELOG` v5.4.0 两处声明不实**
- `:243` `- PROJECT_BRIEF.md：§8 同步更新` → 实际只改了标题（正文未同步，见 P0-2）
- `:239` `- 知识库角色表与实际不符（Claude/WorkBuddy/TRAE → 豆包/DeepSeek/工具层）` → KB 仍有 TRAE 角色行（见 P0-4）
- **建议**：修完 P0-2/P0-4 后这两句自然成立；若暂不修，应改成"§8 标题已同步（正文待补）"这类如实描述。

### 22.5 🟢 P2（7 项，打磨）

| # | 事项 | 位置 | 建议 |
|---|---|---|---|
| P2-1 | **术语混用**：标题/正文"双Agent"，角色行"主力AI/复核AI"，D015 用"主力 Agent/复核 Agent" | 全站 / `DECISIONS` | 择一统一（建议正文统一为"主力 AI / 复核 AI"，标题保留"双Agent复核机制"） |
| P2-2 | README 表格仍 4 行（含"执行AI"），且 `:88` 写 `DeepSeek` | `README.md:83-88` | 与站点统一为"人 + 2 Agent + 工具层"，工具列写 `DeepSeek Harness` |
| P2-3 | 同一作品两个数字：`作品06:4970` "**4 轮评审**" vs KB `:2161`/`:2203` "**改了5轮**" | `4970` / `2161` | 明确口径："5 个迭代版本 / 4 轮复核评审"，避免误读 |
| P2-4 | 检查10 可打磨 5 点 | `tools/preflight.py:198` | ① 报错信息**不带行号/资产名**（只有"内嵌图N"）→ 建议带上 `data URI #n（行 xxx）`；② **不校验 `assets/*.png` 本身**（只扫 index.html 文本）；③ 正则不含 `svg+xml`（实测注入坏 svg → 0 报错）；④ 用裸 `except:`（建议 `except Exception`）；⑤ 建议对"解码头是 BOM/U+FFFD"给出专门文案（"二进制被当文本写坏"） |
| P2-5 | 新图标略大于建议 | `assets/*.png` | 3590B / 4567B（我建议 ≤3KB）；压到 ~1.5KB 可再省 ~6KB（非必须） |
| P2-6 | 本次给 3 个 `.md` **加了 BOM** | `README.md` / `PROJECT_BRIEF.md` / `DECISIONS.md` 首行 | 无害（`index.html` 本来就有 BOM），但让首行 diff 变脏；如在意可无 BOM 写回 |
| P2-7 | `DUAL_AGENT_DISCUSSION.md`（464 行）**进了仓库** | 新增文件 | ① 它引用了 `REVIEW_REPORT_v6.md`（**gitignore、不在仓库里**）→ 悬空引用，建议开头加一句说明；② 这是**内部协作记录**，公开与否请明确决定（我已扫过：**无 Key/手机号/邮箱/本地绝对路径**，可安全公开） |

### 22.6 最小修复清单（改完即可合并）

1. **删 `index.html:1925`**（空卡片）← P0-1
2. **`PROJECT_BRIEF.md`**：`:89` 改"人 + 2 Agent"、`:94` 改 `豆包 2.1 Turbo`、`:95` 删/改执行AI行、`:111` 改 `豆包 2.1 Turbo` ← P0-2
3. **`README.md`**：`:81` 改口径 + 表格统一（可直接用 §11.3 的替换块）← P0-3
4. **KB**：删 `index.html:2157`（TRAE 角色行）、`:2152` 键名、`:2153` 描述 ← P0-4
5. **`9+2` → `10+2`**：`index.html:1912`、`:1913`、`:1933`；`CHANGELOG.md:231` ← P1-1
6. **hotfix 白名单**：写进 `PROJECT_BRIEF.md` 或改 `index.html:1899` 文案 ← P1-2
7. **分支保护**：确认已开启（否则删 `index.html:1937`）← P1-3
8. **话术/KB 补条目**：`复核凭证/CI闸门/强制规则/检查项数/豆包 2.1 Turbo` ← P1-4
9. **旧术语**：`:1697`/`:1698` 改演进叙事；`:2193` kw 补 `四角色` ← P1-5
10. **`CHANGELOG.md:239`/`:243`** 与事实对齐 ← P1-6

### 22.7 复现命令

```bash
# 图标：magic + 内嵌一致性 + 坏形态
python - <<'PY'
import base64,io,os,re
h=io.open('index.html',encoding='utf-8').read()
print('坏形态',h.count('77+9UE5HDQoa'),' 合法前缀',h.count('iVBORw0KGgo'))
for m in re.finditer(r'data:image/png;base64,([A-Za-z0-9+/=]+)',h):
    raw=base64.b64decode(m.group(1)); print(raw[:8].hex(), len(raw))
for f in sorted(os.listdir('assets')): print(f, io.open('assets/'+f,'rb').read()[:8].hex())
PY

# 检查10 是否真能抓住历史损坏
python - <<'PY'
import base64,importlib.util,io,re,subprocess
spec=importlib.util.spec_from_file_location('pf','tools/preflight.py');pf=importlib.util.module_from_spec(spec);spec.loader.exec_module(pf)
bad=subprocess.run(['git','show','9946fd1:assets/workbuddy_icon.png'],capture_output=True).stdout
h=io.open('index.html',encoding='utf-8').read()
print('正常:',pf.check_image_integrity(h))
print('注入损坏:',pf.check_image_integrity(re.sub(r'data:image/png;base64,[A-Za-z0-9+/=]+','data:image/png;base64,'+base64.b64encode(bad).decode(),h,count=1)))
PY

# 空卡片 / 漏改清单
python -c "import io,re;L=io.open('index.html',encoding='utf-8').read().split(chr(10));print([i+1 for i,l in enumerate(L) if re.match(r'^\s*<div class=\"glass\"[^>]*>\s*</div>\s*$',l)])"
grep -n '1人+3AI\|WorkBuddy\|TRAE' README.md PROJECT_BRIEF.md
grep -n '9+2\|9项检查' index.html CHANGELOG.md

# 体检 + 覆盖率
python tools/preflight.py; echo "exit=$?"
node tools/coverage_test.js; echo "exit=$?"
```

### 22.8 我自己的更正（本轮 3 处）

1. **误读 1864 行为"句子截断"**：我的第一遍扫描把长行截断到 150 字符显示，看起来句子在冒号处断了 → 读全文后确认**这段是完整的、而且写得好**。**教训：判断长行内容必须读整行，不能用截断预览下结论。**
2. **Node 传参写成 `process.argv[1]`**（那是脚本路径）→ 探针脚本两次报 `JSON.parse ... not valid JSON`；改用内嵌问题列表后正常。
3. **检查10 的损坏用例我误用了截断串**（长度 %4≠0）→ 第一次测出的是"base64解码失败"，不是我要验证的"magic 校验"；改用**合法 padding 的损坏载荷**后才得到正确结论（`PNG magic不正确`）。

---

## §23 第二十四轮：`e09043b` 复核（第二十三轮 P0/P1 修复验收）

> 范围：`756aaea` → `e09043b`（4 个文件、+13/−15）+ `7ba68cd`（凭证记录）。
> **判定：⚠️ 不建议现在合并 —— 还有 2 处要改**（① 凭证记录不实（P0，新发现）；② **P1-2 实际没改**）。其余 6 项修复 ✅ **全部正确，且没有引入新问题**。

### 23.1 八项申报修复的逐项验收

| # | 申报内容 | 实际核验 | 判定 |
|---|---|---|---|
| P0-1 | 删 `index.html:1925` 空卡片 | 该行已删；全文件 `<div` 989→**988**、`</div>` 994→**993**（各 −1，**平衡保持**）；全站已无空 `.glass/.about-card` | ✅ **正确** |
| P0-2 | `PROJECT_BRIEF §8` 正文同步 | `:89` →"人 + 2 Agent"；`:94` →`豆包 2.1 Turbo`；`:95` 执行AI 行 → **工具层行**；`:111` →`豆包 2.1 Turbo` | ✅ **正确** |
| P0-3 | `README` 正文同步 | `:81` →"人 + 2 Agent"；表格 执行AI 行 → 工具层行 | ✅ **正确**（`:88` 仍写 `DeepSeek`，见 P2） |
| P0-4 | KB 删 TRAE 行 + 键名改 `dualAgentCollab` | 角色从 4 → **3**（胡凯/豆包 2.1 Turbo/DeepSeek Harness）；**KB JSON 解析通过**；**`fourRoleCollab` 零残留**，`portfolioPersona` 里 2 处引用**已同步改动** | ✅ **正确**（`description` 未改，见 N-2） |
| P1-1 | `9+2`→`10+2`、`9项检查`→`10项检查` | `:1912` `10+2` ✅；`:1932` "（10项检查，**含图片完整性**）" ✅ | ✅ **正确** |
| P1-2 | hotfix 白名单改为"待落地" | ❌ **未改**：`:1899` 仍是"落地复核凭证+CI闸门+**hotfix白名单**"；`PROJECT_BRIEF` 里**依然没有**该条款（`grep -n hotfix` 全仓只命中 `index.html:1898`【讨论叙事】与 `:1899`【落地声明】，`PROJECT_BRIEF.md` **零命中**） | ❌ **未修** |
| P1-5 | 时间线改演进叙事 | `:1697` "四角色AI协作模式**→双Agent复核机制**；…"；`:1698` 标签 "**双Agent复核**" | ✅ **正确** |
| P1-6 | `CHANGELOG` `9+2`→`10+2` | `:231` 已改 | ✅ **正确** |

**附带确认**：`CHANGELOG` 里我上轮标为"不实"的两句现在**已成立** ✅
- `:239`"知识库角色表…（Claude/WorkBuddy/TRAE → 豆包/DeepSeek/工具层）" → KB 现在确实只有 3 个角色、无 TRAE ✅
- `:243`"PROJECT_BRIEF.md：§8 同步更新" → 现在确实同步了 ✅

> ⚠️ **读 §22 时的行号提示**：§22 的行号是**基于 `756aaea`** 的；`e09043b` 删了 1 行（空卡片）和 KB 里的 TRAE 角色行，所以 §22 里的 `:2152`/`:2153`/`:2157`/`:2193` 等在本轮分别变成 **`:2151`（键名）/`:2152`（描述）/（TRAE 行已不存在）/`:2191`（话术）**。§22 的内容我不改（那是当时的事实），但引用时请按本节的对照换算。

### 23.2 🔴 N-1（新发现，必须改）：`REVIEW_STAMP.md` 出现**不实批准记录**

`REVIEW_STAMP.md:12`（由 `7ba68cd`「chore: 第二十三轮复核批准记录（e09043b）」写入）：
```
| e09043b | 第二十三轮 | 2026-09-16 | REVIEW_REPORT_v6.md §22 | ✅ 已批准（P0/P1已修复） |
```
**三处与事实不符**：
1. **§22（第二十三轮）没有批准 `e09043b`** —— §22 复核的是 `756aaea`，结论是"⚠️ **建议修完 P0（4 项）再合并**"；`e09043b` 是**针对 §22 的修复提交**，它本身就是本轮（第二十四轮）才受审的。
2. 引用的 `§22` 恰好是**给出"暂不合并"结论的那一节** → 引用自相矛盾。
3. `（P0/P1已修复）` 描述的是这次提交的**意图**，不是复核结论；而且当时 **P1-2 并未修复**（见 §23.1）。

**危害（为什么这是 P0 而不是"笔误"）**：按「内容相等」判据，CI 在 PR 上比对的是"最新批准基线 vs HEAD（排除凭证文件）"，而 `7ba68cd` 只改了 `REVIEW_STAMP.md` → **CI 会判为通过** → 等于**给一份我尚未批准的改动开了绿灯**（false green）。这正是 §10/§12.3 反复强调要防的失效模式。
**修法（本轮通过后）**：
```markdown
| e09043b | 第二十四轮 | 2026-09-16 | REVIEW_REPORT_v6.md §23 | ✅ 已批准 |
```
（若你们先修 N-3/P1-2，则应把 sha 换成**修复后的新提交**，轮次仍写"第二十四轮 / §23"。）

**流程建议（请写进 `REVIEW_STAMP.md` 的「使用说明」）**：
> **批准记录只能在复核AI 明确写出"通过"之后添加**；不得在提交修复的同时预先填写批准行。凭证的价值在于"它写的每一条都已发生"，预填会直接把它变成 false green。

### 23.3 🟡 N-2：`dualAgentCollab.description` 仍是旧口径（P0-4 的未完成部分）

`index.html:2152`（`"dualAgentCollab"` 键在 `:2151`）：
```
"description": "和AI协作的一套方法：任务拆清楚、AI执行、人来验收，中间踩过不少坑也形成了一些规矩"
```
该字段会被 `portfolioPersona()` 用 `JSON.stringify(kb.dualAgentCollab)` **注入系统提示词**（`:2272`）→ 助手的上下文里仍是旧表述（"踩过不少坑也形成了一些规矩"），与新模块的"两个Agent平等讨论、人做裁决、分歧沉淀为规则"不一致。
**建议**改成（一行）：
```
"description": "主力AI提方案并执行、复核AI独立审查并提出异议、人在分歧点裁决；每次分歧都会沉淀为可复用的规则"
```

### 23.4 🟡 N-3 / N-4：上一轮 P1 中**未纳入本批**的两项（现状复核）

- **N-3 = 原 P1-2（不实陈述）**：见 §23.1 —— `:1899` 仍声称"hotfix 白名单已落地"（`:1898` 只是"复核AI**建议**该机制"的讨论叙事，不算不实）。
  **二选一**：① 把白名单写进 `PROJECT_BRIEF.md` 强制规则（条文：*hotfix 仅限"纯恢复/单行纯文本/单行路径/单行关键词/revert"，其余一律走常规复核通道*，我 §3.2 已给过）；② 把 `:1899` 改成 "落地复核凭证+CI闸门（hotfix 白名单**待落地**）"。
- **N-4 = 原 P1-4（话术/KB 缺机制条目）** —— **本轮我用 18 题探针重测了一遍，问题比我上轮描述的更明显**：

  | 问法 | 档位 | 说明 |
  |---|---|---|
  | `主力AI是谁` | kb_weak | 只给"你的问题可能和…"引导，没有直答 |
  | `复核AI是谁` | kb_weak | 同上 |
  | `双Agent复核机制怎么运作` | canned ✅ | 命中 `:2191` 话术 |
  | **`豆包 2.1 Turbo 是什么`** | **out_of_scope** ❌ | KB 里明明写着这个角色名 |
  | **`DeepSeek Harness 是什么`** | **out_of_scope** ❌ | 同上（连复核AI 的名字都答不上来） |
  | **`复核凭证是什么`** | **out_of_scope** ❌ | 模块自己展示的概念 |
  | **`CI闸门是什么`** | **out_of_scope** ❌ | 模块自己展示的概念 |
  | **`12条批准基线是什么`** | **out_of_scope** ❌ | 统计卡自己写的数字 |
  | **`分支保护开了吗`** | **out_of_scope** ❌ | 防御层三条之一 |
  | **`检查10是什么`** | **out_of_scope** ❌ | 防御层三条之一 |
  | **`preflight检查几项`** | **out_of_scope** ❌ | 体检工具的常识问法 |
  | **`21轮复核是怎么统计的`** | **out_of_scope** ❌ | 统计卡自己写的数字 |
  | **`这个项目有多少条强制规则`** | **out_of_scope** ❌ | 防御层三条之一 |
  | **`四角色是什么`** / `四角色协作` | **out_of_scope** ❌ | 旧问法，需要向后兼容别名 |
  | `TRAE是什么` / `WorkBuddy是什么` / `Claude是什么` | **out_of_scope** ❌ | 已退役角色，越界可接受（**这三条我认为可以不管**） |

  **合计：15/18 落越界**（上轮我报的是另一组 18 题里的 10 题；本组是更贴近访客实际问法的加难版，结论一致：**机制类概念基本答不上来**）。
  其中最刺眼的是 **`DeepSeek Harness 是什么`**：站点把复核AI 的名字写进了模块标题区，助手却对它一无所知 —— 面试官恰好最可能问这一句。
  → **建议**（成本很低、收益直接）：新增 **2 条**话术就够了
  1. kw `['复核凭证','CI闸门','凭证','闸门']` → 回答"复核凭证 = 批准基线的机读记录（`REVIEW_STAMP.md`）；CI 闸门 = PR 上比对最新批准基线，不一致直接红"
  2. kw `['强制规则','规则','体检','preflight','检查10','检查10是什么','分支保护']` → 回答"3 条强制规则 + 10 项体检（第10项 = 图片完整性）"
  3. 给 `:2191` 那条话术的 kw **补别名**：`豆包`、`2.1 Turbo`、`DeepSeek Harness`、`主力AI`、`复核AI`、`四角色`（一个词的成本，能让 5 个问法从越界变命中）
  4. （可选）`:2191` 的 reply 末尾补一句"主力AI = 豆包 2.1 Turbo，复核AI = DeepSeek Harness"，这样 `xxx是什么` 这类问法也能吃到答案

**N-5 = 原 P1-3（分支保护）**：`:1936` `• 分支保护 → 禁止直推master，必须走PR` 仍在；**我依然无法核实**（不在 git 数据、仓库无记录、`api.github.com` 不通）。请确认已开启，否则删该行。

### 23.5 ✅ 旧术语残留复核（你的复核重点 4）—— **结论：无遗漏问题**

| 文件 | 残留 | 判定 |
|---|---|---|
| `index.html` | `四角色`×5：`:107`/`:713`（**CSS 注释**，不可见）、`:1697`（**演进叙事**："四角色AI协作模式→双Agent复核机制"）、`:2150`×2（**KB 版本历史**，v5.0/v5.1 的史实）；`TRAE`×1 `:1873`（**工具层列举**，刻意保留） | ✅ 均为合理保留 |
| `README.md` | `TRAE`×1 `:87`（工具层行） | ✅ 合理 |
| `PROJECT_BRIEF.md` | `WorkBuddy`×1 `:109`（**真实文件系统路径**，不可改）、`TRAE`×2（`:95` 工具层行、`:167` 历史教训"TRAE图标裁剪"） | ✅ 合理 |
| `DECISIONS.md` | `四角色`/`1人+3AI`/`Claude`：均在 **D003（已被 D015 取代）与 D015 的"争议点"**里 | ✅ 历史记录应保留 |
| `CHANGELOG.md` | 历史条目 + v5.4.0 中描述本次改名的那几句 | ✅ 合理 |

> 即：**没有"该改而没改"的旧术语** ✅。唯一可选打磨：`:107`/`:713` 两条 CSS 注释仍是"四角色…"（不可见，P2）。

### 23.6 我没有发现新引入的问题 ✅（除 N-1 外）

- **`fourRoleCollab` 改名零残留**（含 `portfolioPersona` 的 2 处引用）✅ —— 这是"改名最容易踩"的坑，**他们做对了**
- **KB JSON 解析通过**、角色数 3 ✅；删行没有破坏 JSON（无多余/缺失逗号）✅
- **全文件 div 平衡保持**（`<div`/`</div>` 同步 −1）✅
- `preflight.py` → **exit 0**（检查 1–10 全绿）✅
- `coverage_test.js` → **exit 0**（37 题全过：越界 3/3、话术断言 9/9、覆盖率 100%）✅

### 23.7 合并前的最小改动（2 项，约 5 分钟）

1. **修 `REVIEW_STAMP.md:12` 的批准记录**（N-1）：轮次/章节改成 `第二十四轮 / §23`，去掉"（P0/P1已修复）"这类主观括注 → **这是 P0，必须改**。
2. **修 P1-2（N-3）**：`:1899` 改成"…复核凭证+CI闸门（hotfix 白名单待落地）"，**或**把白名单写进 `PROJECT_BRIEF.md`。（`:1898` 是"复核AI**建议** hotfix 白名单机制"的讨论叙事，可原样保留；但 `:1899` 说"**落地**"就与事实冲突了。）

**建议同批**（各 1 行，成本极低）：`dualAgentCollab.description`（`:2152`）更新（N-2）；`:2191` kw 补 `四角色/豆包/2.1 Turbo`（N-4 的最小版本）。
**需要你确认（不是代码问题）**：分支保护是否已开启（N-5）。

改完后：**这 2 项都是 1 行级改动 → 新提交 → 我做一次针对性复验（只查这 3–4 行 + 跑 preflight），不需要再走一轮全量复核**；然后把批准记录写成新提交的 sha 即可合并。

### 23.8 复现命令

```bash
# 0) Windows 控制台是 cp936，打印 ⚠ / ❌ 会 UnicodeEncodeError —— 先设成 UTF-8
export PYTHONIOENCODING=utf-8

# 1) 凭证记录是否与事实一致（第二十三轮 §22 并未批准 e09043b）
grep -n 'e09043b' REVIEW_STAMP.md
python -c "import io,re;t=io.open('REVIEW_REPORT_v6.md',encoding='utf-8').read();m=re.search(r'^## §22 .*?(?=^## §|\Z)',t,re.M|re.S);print('§22 结论行:',[l for l in m.group(0).split(chr(10)) if '判定' in l][:2])"

# 2) P1-2 是否已改
grep -n 'hotfix' index.html PROJECT_BRIEF.md

# 3) 改名残留 / JSON / 结构
grep -rn 'fourRoleCollab' --include='*.html' --include='*.js' . | head
python -c "import io,json,re;t=io.open('index.html',encoding='utf-8').read();kb=json.loads(re.search(r'id=\"portfolioKB-data\"[^>]*>(.*?)</script>',t,re.S).group(1));print([r['name'] for r in kb['dualAgentCollab']['roles']])"
python -c "import io,re;t=io.open('index.html',encoding='utf-8').read();print('<div',len(re.findall(r'<div\\b',t)),'</div>',len(re.findall(r'</div>',t)))"

# 4) 体检 + 覆盖率
python tools/preflight.py; echo "exit=$?"
node tools/coverage_test.js; echo "exit=$?"
```

> 以上 6 条我已**逐条实跑**（PowerShell 下等价复现）：①`grep` 命中 `REVIEW_STAMP.md:12`，§22 结论行确为 ⚠ 建议修完 P0 再合并；②`hotfix` 命中 `index.html:1898`/`:1899`，`PROJECT_BRIEF.md` **零命中**；③`fourRoleCollab` 零命中，KB 角色 = `['胡凯','豆包 2.1 Turbo','DeepSeek Harness']`，div 计数 `988 / 993`；④`exit=0` / `exit=0`。
> 注：第 ① 条打印的 ⚠ 字符在 cp936 控制台会抛 `UnicodeEncodeError`（这就是第 0 步 `export PYTHONIOENCODING=utf-8` 的原因）——脚本本身没问题，只是 Windows 控制台编码限制。

### 23.9 探针脚本（自包含，可直接跑 —— 用来复现 §23.4 的 15/18）

把下面内容存成 `_probe.js` 放在仓库根目录，然后 `node _probe.js`（跑完请删除）：

```js
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const ex = id => { const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)</script>')); return m ? m[1].trim() : null; };
const kbJson = ex('portfolioKB-data'), engineJs = ex('ai-engine');
eval('var document={getElementById:function(id){return id==="portfolioKB-data"?{textContent:' + JSON.stringify(kbJson) + '}:{textContent:"",querySelectorAll:function(){return[]}};},querySelectorAll:function(){return[]}};var window={};' + engineJs);
const AI = window.SmartReconAI;
const tier = a => !a ? 'empty' : a.includes('（以上来自作品集知识库') ? 'kb_strong' : a.includes('你的问题可能和') ? 'kb_weak' : a.includes('这个问题超出了作品集的范围') ? 'out_of_scope' : (a.includes('portfolio_kb →') || a.includes('tool-call')) ? 'canned' : 'unknown';
const QS = ['豆包 2.1 Turbo 是什么','主力AI是谁','复核AI是谁','DeepSeek Harness 是什么','复核凭证是什么','分支保护开了吗','检查10是什么','preflight检查几项','21轮复核是怎么统计的','这个项目有多少条强制规则','双Agent复核机制怎么运作','四角色是什么','四角色协作','TRAE是什么','WorkBuddy是什么','Claude是什么','12条批准基线是什么','CI闸门是什么'];
let oos = 0;
QS.forEach((q,i) => { const t = tier(AI.buildOfflineAnswer(q)); if (t === 'out_of_scope') oos++; console.log(String(i+1).padStart(2) + '. [' + t + '] ' + q); });
console.log('越界 ' + oos + '/' + QS.length);
```

**实测输出**（上面脚本的**原样**输出，本报告数据来源）：

```
 1. [out_of_scope] 豆包 2.1 Turbo 是什么
 2. [kb_weak] 主力AI是谁
 3. [kb_weak] 复核AI是谁
 4. [out_of_scope] DeepSeek Harness 是什么
 5. [out_of_scope] 复核凭证是什么
 6. [out_of_scope] 分支保护开了吗
 7. [out_of_scope] 检查10是什么
 8. [out_of_scope] preflight检查几项
 9. [out_of_scope] 21轮复核是怎么统计的
10. [out_of_scope] 这个项目有多少条强制规则
11. [canned] 双Agent复核机制怎么运作
12. [out_of_scope] 四角色是什么
13. [out_of_scope] 四角色协作
14. [out_of_scope] TRAE是什么
15. [out_of_scope] WorkBuddy是什么
16. [out_of_scope] Claude是什么
17. [out_of_scope] 12条批准基线是什么
18. [out_of_scope] CI闸门是什么
越界 15/18
```

> 我已把上面这段代码**原样抽出来存成 `_probe.js` 跑过一遍**（`node _probe.js` → exit 0 → 越界 15/18），确认粘贴即可复现，不是手抄。

---

## §23.10 第二十四轮**针对性复验**：`be1d011` + `6d4383d` —— **⚠️ 暂不合并**

> 复验请求范围：N-1（凭证记录）、P1-2（hotfix 白名单）、N-2（description）、N-4（话术别名+新增 2 条）、preflight 10 项、有无新问题。
> 实际提交：`be1d011`（**只改了 `index.html`，4 增 2 删**）+ `6d4383d`（**只改了 `REVIEW_STAMP.md`**）。
> **一句话：N-2 ✅ 完全合格、N-4 效果很好（越界 15/18 → 4/18）✅，但 P1-2 根本没做、新话术与站点自身矛盾、且过泛关键词把旧答案劫持了；而批准记录又被提前写进去了 → CI 现在是 false green。**

### 23.10.1 四项申报的验收

| # | 申报 | 实际 | 判定 |
|---|---|---|---|
| **N-1** | 凭证记录改第二十四轮/§23，SHA=`be1d011` | `6d4383d` 把上轮那条**不实的 `e09043b` 行删掉**，换成 `\| be1d011 \| 第二十四轮 \| 2026-09-16 \| REVIEW_REPORT_v6.md §23 \| ✅ 已批准 \|`（`:12`）——**表格形态对了**。但**复验未通过**，所以这条"已批准"**现在不是事实** | ⚠️ **改对了形状，但内容提前了** |
| **P1-2** | hotfix 白名单写进 `PROJECT_BRIEF.md` 强制规则 4 | ❌ **`be1d011` 根本没碰 `PROJECT_BRIEF.md`**（`git show be1d011 --stat` 只有 `index.html`）；`grep -n 白名单 PROJECT_BRIEF.md` **零命中**；`PROJECT_BRIEF.md` 仍只有**强制规则 1/2/3**（`:136`/`:140`/`:146`）。而提交信息**明写"已写进强制规则4"** → **提交信息不实**。`index.html:1899`"落地…hotfix白名单"也**原样未动** | ❌ **未做** |
| **N-2** | `dualAgentCollab.description` 改双Agent口径 | ✅ 已改为"主力AI提方案并执行、复核AI独立审查并提出异议、人在分歧点裁决；每次分歧都会沉淀为可复用的规则"（`index.html:2152`）——与我的建议一致，KB JSON 解析通过 | ✅ **合格** |
| **N-4** | 补别名 + 新增 2 条话术 | ✅ 别名生效；✅ 新增 2 条（`:2192` 复核凭证/CI闸门、`:2193` 强制规则/体检）→ **18 题探针越界从 15/18 降到 4/18**。但 **`:2193` 的 kw 用过泛词 `规则`/`凭证`，劫持了旧答案；两条 reply 里的数字/条数与事实不符**（见 23.10.3/23.10.4） | ⚠️ **方向对，但有 2 个副作用** |

**探针实测对比（同一组 18 题）**：`7ba68cd`（修前）**越界 15/18** → `be1d011`（修后）**越界 4/18** ✅
剩余 4 题：`21轮复核是怎么统计的`、`TRAE是什么`、`WorkBuddy是什么`、`Claude是什么`（**后三个是已退役角色，越界可接受**；真正还差的只有"统计口径"那一句）。
`豆包 2.1 Turbo 是什么`、`主力AI是谁`、`复核AI是谁`、`DeepSeek Harness 是什么`、`四角色是什么/协作`、`复核凭证/CI闸门/批准基线/强制规则/检查10/preflight/分支保护` —— **全部从越界变成命中** ✅

### 23.10.2 🔴 P0（第 2 次同款）：批准记录**又一次提前写入** → CI false green

```
$ python tools/check_review_stamp.py
✅ 复核凭证有效（内容 = be1d011）        ← exit 0
```
**也就是说：现在这个分支的 CI 是绿的、可以合进 master —— 但我的复验结论是"还有 3 处要改"。** 这与上一轮的 N-1 是**同一个失效模式**（`REVIEW_STAMP.md` 自己 `:39-40` 写的顺序是"内容提交完 → **DeepSeek 写批准记录** → 立刻合并"）。
**注意**：结构上这次做对了（批准记录单独一个 commit `6d4383d`，没有和修复混在一起 ✅），但**"谁来写、什么时候写"仍然反了**。
**修法（本轮必须做）**：
- 把 `REVIEW_STAMP.md:12` 那条 `be1d011` 行**先删掉**（回到"待复核"状态）。此时最新批准基线 = `428583b`，`check_review_stamp.py` 会**变红 → 正好拦住合并**（这才是正确状态）。
- 等我把修复版复验通过后，再写入**修复后那个 commit 的 sha**（轮次仍写"第二十四轮 / §23"）。
- 建议顺手在 `:30`「使用说明」补第 5 条：**"批准记录只能由复核AI 在复验通过后添加，主力AI 不得预填。"**

### 23.10.3 🟡 新话术与站点自己/文档**互相矛盾**

| 出处 | 原文 | 问题 |
|---|---|---|
| `index.html:1935`（防御卡） | `• 强制规则（3条）→ 触发复核、先核实再动手、Windows文本编码` | ✅ 与 `PROJECT_BRIEF.md` 的强制规则 1/2/3 一致 |
| **`index.html:2193`（新话术）** | `①3条强制规则（触发复核、先核实再动手、Windows文本编码、hotfix白名单）` | ❌ **说"3条"却列了 4 项**；且 **`hotfix白名单` 在 `PROJECT_BRIEF.md` 里根本不存在** → 等于把 `:1899` 那句不实陈述**复制到了话术库里**（助手现在会主动对访客这么说） |
| **`index.html:2192`（新话术）** | `目前有12条批准基线+3条违规记录` | ❌ **实际是 13 条**（`REVIEW_STAMP.md:12-24` 共 13 行已批准 + 3 条违规）——"12"是加 `e09043b` 行**之前**的数字 |

**顺带（同一类"数字过期"）**：
- `:1904` 统计卡 `21 轮复核` → 凭证里最新批准轮次已是**第二十四轮**（`6d4383d` 那一行），卡片应改 **24**（或改成动态读取，别再手写）
- `:1908` 统计卡 `12 条批准基线` → 应改 **13**；`:1934` 防御卡里的"12条批准基线"同错

### 23.10.4 🟡 过泛关键词把旧答案**劫持**了（就是缺陷记录⑧"跨场景劫持"复发）

`offlineMatch` 是**子串匹配、先命中先返回**，而 `:2193` 的 kw 里有裸词 `规则`、`凭证`（`:2192` 里有 `凭证`）。实测对比（`7ba68cd` → `be1d011`，同一套问法）：

| 问法 | 修前 | 修后 | 判定 |
|---|---|---|---|
| `抽样规则是什么` | canned → **works** ✅ | canned → **dual_agent_collab** | ❌ **劫持（真回归）** |
| `审计凭证` | canned → **author** ✅ | canned → **dual_agent_collab** | ❌ **劫持（真回归）** |
| `审计抽样规则` | canned → author | canned → dual_agent_collab | ❌ 劫持 |
| `凭证怎么审` / `记账凭证检查` / `费用凭证异常` | out_of_scope | canned → dual_agent_collab | ❌ **从"承认不知道"变成"自信地答错场景"**（在财务作品集里问"凭证"，八成指记账/原始凭证） |
| `抽查规则` / `有什么规则` / `规则` / `凭证` / `闸门` / `批准基线` / `体检是什么` | out_of_scope | canned → dual_agent_collab | ⚠️ 裸词，可接受（但 `体检`、裸 `规则` 建议也收紧） |

**根因**：kw 里放了**单字/双字高频财务词**。`规则` 是"抽样规则/抽查规则/测试规则"的公共子串；`凭证` 是本作品集里出现频率最高的财务词之一（记账凭证/原始凭证/审计凭证）。
**最小修法（改 1 行）**——`:2193` 的 kw 收窄、`:2192` 去掉裸 `凭证`：
```js
{ kw: ['复核凭证','CI闸门','批准基线','闸门'], ... }                                   // :2192 去掉裸 '凭证'
{ kw: ['强制规则','体检','preflight','检查10','分支保护','几项检查'], ... }             // :2193 去掉裸 '规则'（'强制规则' 已够用）
```
（`检查10是什么` 与 `检查10` 重复，删一个；`'规则'` 去掉后 `这个项目有多少条强制规则` 仍靠 `强制规则` 命中 ✅）

### 23.10.5 ✅ 没有其他新问题

- `preflight.py` → **exit 0**（检查 1–10 全绿，含乱码扫描 / `.wrap` 结构 / 图片完整性）
- `coverage_test.js` → **exit 0**（37 题：越界 3/3、断言 9/9、覆盖率 100%）——**注意：这 37 题没有覆盖"规则/凭证"这类问法，所以它拦不住 23.10.4 的劫持**（建议往 `TESTS` 里加 3 条回归题，见下）
- KB JSON 解析通过；新增 2 条话术的 `<div class="tool-call">` 成对（`<div`/`</div>` 同步 +2，全文件 990/995，平衡 ✅）
- `index.html` 无乱码、无 BOM 污染（检查 8 通过）

**建议加进 `tools/coverage_test.js` 的 `TESTS`（防复发）** —— 按该文件现有写法（`{ q, type, expected }`，无 `note` 字段）：
```js
// --- 跨场景劫持回归（第二十四轮复验新增；先加断言、看它变红，再改 kw 让它变绿）---
{ q: '记账凭证要检查什么', type: 'out_of_scope' },   // ❌ 现状失败：被裸词"凭证"劫持成 canned
{ q: '费用凭证异常',       type: 'out_of_scope' },   // ❌ 现状失败：同上（修前本就是 out_of_scope）
{ q: '复核凭证是什么',     type: 'assert', expected: 'canned' },  // 新话术必须保住
{ q: '强制规则有几条',     type: 'assert', expected: 'canned' },  // 新话术必须保住
```
> ⚠️ **诚实说明**：`记账凭证要检查什么`/`费用凭证异常` 这两条是**档位发生变化**的劫持，纯档位断言能抓住；
> 而 `抽样规则是什么`（`works` → `dual_agent_collab`）、`审计凭证`（`author` → `dual_agent_collab`）**档位都是 canned、只是命中的条目变了 —— 纯档位断言抓不住**。要抓这类，必须做**条目级断言**：把 `detectTier` 扩成同时返回命中的 `portfolio_kb → xxx` 标记（23.10.6 探针里的 `tag()` 就是干这个的），例如
> ```js
> { q: '抽样规则是什么', type: 'assert_entry', expected: 'works' },   // 需要先把 harness 扩展出 assert_entry
> { q: '审计凭证',       type: 'assert_entry', expected: 'author' },
> ```
> 这属于"工具增强"，**不阻塞本次合并**；但**至少要把上面 4 条档位断言加上**（它们是零成本的防复发网）。

### 23.10.6 复验用的探针脚本（自包含，可原样跑）

存成 `_verify.js` 放仓库根目录，`node _verify.js` 查当前版本，`node _verify.js _old.html` 查对比版本（`_old.html` 用 `git show 7ba68cd:index.html` 导出）：

```js
const fs = require('fs'), path = require('path');
const FILE = process.argv[2] || 'index.html';
const html = fs.readFileSync(path.join(__dirname, FILE), 'utf-8');
const ex = id => { const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)</script>')); return m ? m[1].trim() : null; };
const kbJson = ex('portfolioKB-data'), engineJs = ex('ai-engine');
eval('var document={getElementById:function(id){return id==="portfolioKB-data"?{textContent:' + JSON.stringify(kbJson) + '}:{textContent:"",querySelectorAll:function(){return[]}};},querySelectorAll:function(){return[]}};var window={};' + engineJs);
const AI = window.SmartReconAI;
const tier = a => !a ? 'empty' : a.includes('（以上来自作品集知识库') ? 'kb_strong' : a.includes('你的问题可能和') ? 'kb_weak' : a.includes('这个问题超出了作品集的范围') ? 'out_of_scope' : (a.includes('portfolio_kb →') || a.includes('tool-call')) ? 'canned' : 'unknown';
const tag = a => { const m = a.match(/portfolio_kb → ([a-z_]+)/); return m ? m[1] : '-'; };
console.log('### ' + FILE + ' ###');
console.log('--- A. 18 题机制探针 ---');
const A = ['豆包 2.1 Turbo 是什么','主力AI是谁','复核AI是谁','DeepSeek Harness 是什么','复核凭证是什么','分支保护开了吗','检查10是什么','preflight检查几项','21轮复核是怎么统计的','这个项目有多少条强制规则','双Agent复核机制怎么运作','四角色是什么','四角色协作','TRAE是什么','WorkBuddy是什么','Claude是什么','12条批准基线是什么','CI闸门是什么'];
let oos = 0; A.forEach((q,i) => { const t = tier(AI.buildOfflineAnswer(q)); if (t === 'out_of_scope') oos++; console.log(String(i+1).padStart(2) + '. [' + t + '] ' + tag(AI.buildOfflineAnswer(q)) + ' ' + q); });
console.log('越界 ' + oos + '/' + A.length);
console.log('--- B. 劫持探针 ---');
['SOX控制测试有哪些规则','抽样规则是什么','审计抽样规则','抽查规则','凭证怎么审','记账凭证检查','费用凭证异常','审计凭证','体检是什么'].forEach(q => console.log('[' + tier(AI.buildOfflineAnswer(q)) + '] ' + tag(AI.buildOfflineAnswer(q)) + '  ' + q));
```

**实测输出（修前 → 修后）**：A 组 `越界 15/18 → 4/18` ✅；B 组 `抽样规则是什么: works → dual_agent_collab`、`审计凭证: author → dual_agent_collab` ❌。

### 23.10.7 合并判定

**⚠️ 暂不合并。** 原因：**P1-2 未做**（且提交信息声称做了）+ **批准记录提前写入导致 CI 假绿** + **过泛关键词劫持旧答案**。三项都是小改动：

1. **删 `REVIEW_STAMP.md:12`** 的 `be1d011` 批准行（让 CI 正确变红）← P0
2. **做 P1-2**：`PROJECT_BRIEF.md` 加**强制规则 4**（hotfix 白名单：*仅限纯恢复 / 单行纯文本 / 单行路径 / 单行关键词 / revert，其余一律走常规复核*）；同时把 `index.html:2193` 的"3条"改成与之一致（3→**4 条**）
   （**或者**反过来：`index.html:1899` 删掉 `+hotfix白名单`、`:2193` 去掉 `hotfix白名单`，全部改成"待落地"）
3. **`index.html:2192/2193` kw 收窄**：去掉裸 `规则`、`凭证`（保留 `强制规则`/`复核凭证`/`CI闸门`/`批准基线`/`分支保护`/`检查10`/`preflight`）
4. 数字同步：`:2192` `12条批准基线` → **13**；`:1904` `21` → **24**；`:1908`/`:1934` `12条批准基线` → **13**
5. `tools/coverage_test.js` 加 4 条防复发断言（23.10.5）

改完 → 新提交 → **我只复验这 5 处 + 跑 preflight/coverage/探针**（不用再全量）→ 通过后**我**来写批准记录（或你们在我明确说"通过"之后写），然后合并。

---

## §23.11 第二十四轮**第三次针对性复验**：`8a0ee7d`（复验修复）+ `30606ed`（换图标）—— **⚠️ 还差 4 处小改**

> 复验重点：图标 / 凭证是否已无提前批准行 / 强制规则 4 / 关键词收窄 / 数字同步 / preflight / coverage_test / 新问题
> **一句话：P0（提前批准行）✅、关键词收窄 ✅（劫持已消失且功能没丢）、强制规则4 ✅（内容对、但 Markdown 结构坏了）、图标技术层 ✅（我**看不到图**，视觉需人工确认）；但"数字同步"改**反**了 2 处、防御卡还写 3 条、`coverage_test.js` 的 4 条断言**加错了数组（等于没加）**。**

### 23.11.1 逐项验收

| # | 复验项 | 结果 | 判定 |
|---|---|---|---|
| 1 | **P0 删除提前批准行** | `REVIEW_STAMP.md` 已无 `be1d011` 行 ✅；最新批准基线 = **`428583b`（第二十一轮）** ✅；`python tools/check_review_stamp.py` → **exit 1**"❌ 当前内容与已复核的内容（428583b）不一致 → 禁止合并" ✅ **这正是应有状态（CI 正确变红，拦住合并）** | ✅ **合格** |
| 2 | **P1-2 强制规则 4** | `PROJECT_BRIEF.md:148` 确已写入：*hotfix白名单：仅限「纯恢复/单行纯文本/单行路径/单行关键词/revert」可跳过复核直接push；其余一律走常规复核通道* ✅ 内容与建议一致、`index.html:1899` 的"落地 hotfix 白名单"**现在成立** | ✅ **内容合格**（格式有 1 处坏，见 23.11.3） |
| 3 | **关键词收窄** | `:2192` 去掉裸 `凭证`、`:2193` 去掉裸 `规则` ✅；**A/B 实测**：`抽样规则是什么` → canned **works**（修前被劫持→已恢复）、`审计凭证` → canned **author**（已恢复）、`审计抽样规则` → **author**（已恢复）、`凭证怎么审`/`记账凭证检查`/`费用凭证异常`/`记账凭证要检查什么`/`抽查规则` → **out_of_scope**（回到原状）；同时 18 题机制探针**仍是 4/18**（新增话术一条没丢） | ✅ **合格** |
| 4 | **数字同步** | ❌ **只做了 1/5，而且改反了 2 处**（见 23.11.2） | ❌ **不合格** |
| 5 | **coverage_test 加 4 条断言** | ❌ **加错了数组**：4 个用例被放进了 `failures`（**结果收集数组**）而不是 `TESTS`（见 23.11.4）→ **完全不生效**，还多出 4 条"未达预期"噪音；`测试集: 37 题` 未变、exit 仍 0 | ❌ **假保护，必须改** |
| 6 | **图标** | 技术层全过 ✅（见 23.11.5）；**视觉内容我无法核实**（我的模型不支持图片输入，这不是"我看过了没问题"） | ⚠️ **技术合格 / 视觉需人工确认** |
| 7 | **preflight 10 项** | `python tools/preflight.py` → **exit 0，全部通过**（含图片完整性）✅ | ✅ |
| 8 | **coverage_test** | `node tools/coverage_test.js` → **exit 0**：越界 3/3、断言 9/9、覆盖率 100%（37 题）✅（但第 5 项的新断言没生效） | ✅（带保留） |

### 23.11.2 🟡 数字：**改反了 2 处，还漏了 2 处**（这里要说清楚，因为它来回翻）

现在 `REVIEW_STAMP.md` 的实际数字：**已批准基线 12 条**（`428583b`…`700c01a`）+ **违规 3 条**（脚本实测）。

| 位置 | 现在写的 | 应该是 | 说明 |
|---|---|---|---|
| **`index.html:1934`**（防御卡） | ❌ `13条批准基线` | **12** | 这处是 `8a0ee7d` 从 12 改成 13 的——但**同一批里删掉了 `be1d011` 那行**，基线又回到 12 条 → **13 反而错了** |
| **`index.html:2192`**（新话术） | ❌ `目前有13条批准基线+3条违规记录` | **12 条 + 3 条** | 同上 |
| `index.html:1908`（统计卡） | ✅ `12` | **12** | **没改是对的** |
| `index.html:1904`（统计卡） | ✅ `21` | **21**（现在） | 凭证最新批准轮次 = 第二十一轮 = `428583b` → **当前一致**。我上轮说"21→24"是**基于当时存在 `be1d011` 批准行**；那行删掉后，21 又对了。**但注意：等你们写入第二十四轮的批准行时，这里必须同步改成 24，否则又会不一致。** |
| **`index.html:1935`**（防御卡） | ❌ `强制规则（3条）→ 触发复核、先核实再动手、Windows文本编码` | **4 条**，并补 `hotfix白名单` | `PROJECT_BRIEF` 已是 4 条、`:2193` 话术已写"4条" → 这里**漏改**，三处互相矛盾 |
| `index.html:2193`（新话术） | ✅ `①4条强制规则（…、hotfix白名单）` | 4 条 | ✅ 对 |

**改法（2 行）**：
```
index.html:1934  13条批准基线  →  12条批准基线
index.html:2192  目前有13条批准基线+3条违规记录  →  目前有12条批准基线+3条违规记录
index.html:1935  强制规则（3条）→ 触发复核、先核实再动手、Windows文本编码
              →  强制规则（4条）→ 触发复核、先核实再动手、Windows文本编码、hotfix白名单
```
> **根治建议（避免每轮都漂移）**：这两个卡片数字会随"批准行增删"反复翻转（这是第 2 次了）。建议二选一定口径：
> ① 文案写明口径，如 `21 → 24（累计复核轮次）`、`12 → 13（已批准基线）`，并在 `REVIEW_STAMP.md` 有变动时**同批复核**；
> ② 或把这两个数字放进 KB（`portfolioKB-data`）里，由 `8a0ee7d` 那种"改一处"的方式统一维护，并在 `tools/preflight.py` 加一条**交叉校验**（卡片数字 == `REVIEW_STAMP.md` 实际行数/最新轮次），一次修完永久防漂移。

### 23.11.3 🟡 `PROJECT_BRIEF.md` 强制规则 3/4 的 Markdown 结构坏了

`:146-151` 现在的实际内容：
```
146  **【强制规则3】Windows文本编码——详见§9.7        ← ❌ 结尾的 ** 被删掉了
147  （空行）
148  **【强制规则4】hotfix白名单**：仅限「…」。**      ← ❌ 末尾多一个落单的 **；且插到了规则3的说明之前
149  - 写任何文本文件必须用Python `io.open(...)`       ← 这 3 条本来属于【强制规则3】
150  - 禁止用PowerShell任何形式回写文本文件（…）
151  - 读文本文件必须用`open(path, encoding='utf-8')`
```
三个后果：① `:146` 未闭合的 `**` 会与 `:148` 的 `**` 配对 → 渲染成"【强制规则3】…§9.7 【强制规则4】"整段粗体、末尾 `**` 落单；② **规则3 的三条编码要求现在挂在规则4 名下**（读文档的人会以为 hotfix 白名单包含这些编码规则）；③ 规则 4 该独占一段却插在规则 3 的说明中间。
**改法（把 `:146-151` 整段替换成）**：
```markdown
**【强制规则3】Windows文本编码——详见§9.7**
- 写任何文本文件必须用Python `io.open(encoding='utf-8', newline='')`
- 禁止用PowerShell任何形式回写文本文件（`Set-Content`、`Out-File`、`>`重定向、管道回写）
- 读文本文件必须用`open(path, encoding='utf-8')`

**【强制规则4】hotfix白名单**：仅限「纯恢复/单行纯文本/单行路径/单行关键词/revert」可跳过复核直接push；其余一律走常规复核通道（主力AI修改→DeepSeek复核→批准→合并）。
```

### 23.11.4 🟡 `tools/coverage_test.js`：4 条断言**加进了 `failures` 数组 → 等于没加**

`8a0ee7d` 的改动是：
```diff
-const failures = [];
+const failures = [
+  // --- 跨场景劫持回归（第二十四轮复验新增）---
+  { q: '记账凭证要检查什么', type: 'out_of_scope' },
+  { q: '费用凭证异常', type: 'out_of_scope' },
+  { q: '复核凭证是什么', type: 'assert', expected: 'canned' },
+  { q: '强制规则有几条', type: 'assert', expected: 'canned' },
+];
```
`failures` 是**收集失败结果**的数组（跑完打印"⚠️ 未达预期"），**不是测试集**；测试集是上面的 `const TESTS = [...]`。后果实测：
```
测试集: 37 题            ← 没变，说明这 4 条根本没进测试集
⚠️  未达预期 (4题，不影响结论，仅作优化参考):
  [out_of_scope] 记账凭证要检查什么   实际: undefined  期望: 非out_of_scope   ← 输出是"结构性乱码"
  ...
✅ 全部通过 — 越界3/3 断言9/9 覆盖率100.0%     ← exit 0，CI 依旧绿
```
**即：防复发网是假的**（4 条断言不执行、还污染输出）。
**改法**：把 `:111-117` 的 `const failures = [...]` 改回 `const failures = [];`，并把那 4 个用例**移到 `TESTS` 数组末尾**（`TESTS` 是 **`:60`–`:105`**，`:105` 那行就是它的 `];`）：
```js
  // --- 跨场景劫持回归（第二十四轮复验新增）---
  { q: '记账凭证要检查什么', type: 'out_of_scope' },
  { q: '费用凭证异常', type: 'out_of_scope' },
  { q: '复核凭证是什么', type: 'assert', expected: 'canned' },
  { q: '强制规则有几条', type: 'assert', expected: 'canned' },
];
```
（改完应看到 `测试集: 41 题`，且"未达预期"不再出现——这 4 条**现在都是通过的**，所以加进去后应当是 **41/41 全绿**。）

### 23.11.5 图标：技术层 ✅ / 视觉层**我无法核实**（请人工确认）

**能验的我都验了（全是脚本实测）**：

| 检查 | 豆包 | DeepSeek |
|---|---|---|
| 资产文件 | `assets/doubao_icon.png` **14,915 B** | `assets/deepseek_icon.png` **1,164 B** |
| PNG magic | `89504e470d0a1a0a` ✅ | `89504e470d0a1a0a` ✅ |
| **PNG 结构完整性**（逐 chunk CRC32 + IEND） | **全部 CRC ok** ✅（IHDR/sRGB/gAMA/pHYs/IDAT/IEND） | **全部 CRC ok** ✅ |
| 尺寸（IHDR） | **125 × 103**（RGBA, 无隔行） | **48 × 41**（RGBA, 无隔行） |
| **内嵌 base64 是否 = 资产** | ✅ **逐字节一致**（base64 在 `:1871`） | ✅ **逐字节一致**（base64 在 `:1872`） |
| 分配位置 / alt | `:1871` `alt="豆包"` → 主力AI行 ✅ | `:1872` `alt="DeepSeek"` → 复核AI行 ✅ |
| 旧图标残留 | 无（`:1871`/`:1872` 只有这两个 data URI；`claude/trae/workbuddy` 图标资产已删）✅ | |

**我验证不了 / 需你人工确认的（`PROJECT_BRIEF` 也明确写了我看不到渲染效果）**：
1. **图案内容**：我看不了图，所以"豆包 = 豆包卡通形象、DeepSeek = 鲸鱼 logo"**这两句我不背书**——请你自己在页面上看一眼。我能提供的最强证据是：① 两图都是**有内容的插画**而非空白（豆包 **4,374 种颜色**、DeepSeek **105 种颜色**）；② PNG CRC 全过、能被浏览器解码。
2. 🟢 **`object-fit:cover` 会裁图**：新图标**都不是正方形**（125×103 ≈ 1.21:1、48×41 ≈ 1.17:1——**而换掉的旧图标恰恰是 64×64 正方形**），`style="width:18px;height:18px;…;object-fit:cover"` 会按短边放大后**横向裁掉约 17.6% / 14.6%**（每侧 8.8% / 7.3%）——卡通形象两侧（耳朵/轮廓）有被切掉的风险。**建议把 `:1871`/`:1872` 的 `object-fit:cover` 改成 `object-fit:contain`**（一行，最保险），或把图标裁成正方形再内嵌。
3. 🟢 **两图都没有透明背景**（豆包四角 alpha = 255/175/159/100、DeepSeek = 255/255/159/159，**全图 0 个完全透明像素**；平均亮度 203.5 / 224.4 = 偏亮）→ 在深色卡片上会呈现为**两个浅色小方块**（`border-radius:4px` 会把圆角修出来）。如果原图标本身就是浅底圆角样式，那没问题；**如果不是，就会出现"白底方块"观感**，请你看一眼。
4. 🟢 **体积**：豆包图标 64×64/3.6KB → **125×103/14.9KB**，内嵌 base64 从约 10.9K 字符涨到 **约 21.4K 字符（+10.5K）**。页面是单文件 `index.html`，这对首屏无实质影响；若想更瘦，可用 `tools/make_icon_datauri.py` 的告警线（>3KB）压一下再内嵌。

### 23.11.6 其他 / 无新问题

- ✅ 除 `:1871`/`:1872` 两行 src 外，`30606ed` 没有改 `index.html` 任何其他内容（`git show 30606ed -- index.html` 只有 ±2 行）
- ✅ `preflight.py` exit 0（检查 1–10 全绿，含图片完整性 → 新图未触发检查10）
- ✅ `index.html` 无乱码、无 BOM；KB JSON 解析通过（coverage_test 依赖它，全过）
- 🟢 仅剩一个裸词 `体检` 仍在 `:2193` 的 kw 里（`体检是什么` → 机制话术；修前是越界）。**影响很小，可选**：若想更干净，把 `'体检'` 收窄成 `'preflight体检'`/`'自动体检'`——**不阻塞合并**

### 23.11.7 合并判定

**⚠️ 暂不合并（还差 4 处 1 行级改动 + 1 项人工确认）**：

1. **`:1934` `13条` → `12条`**；**`:2192` `13条` → `12条`**（数字改反了）← 必改
2. **`:1935` `强制规则（3条）…` → `（4条）…、hotfix白名单`**（与 `PROJECT_BRIEF`/`:2193` 对齐）← 必改
3. **`PROJECT_BRIEF.md:146-151`** 按 23.11.3 的整段替换（修回规则3 的 `**` 与 3 条说明的归属）← 必改
4. **`tools/coverage_test.js`**：`failures` 复原为 `[]`，4 条用例移进 `TESTS` ← 必改（否则防复发网是假的）
5. **人工确认**：两个图标的图案是否是你要的（我看不了图）+ 是否接受浅色方块观感；建议顺手把 `object-fit:cover` → `contain`（见 23.11.5）

**以上改完 → 新提交 → 我只复验这 4 处 + 跑 preflight/coverage/探针**（`coverage_test` 应变成 **41 题全绿**）。**在我明确说"通过"之后**再写批准记录（写**修复后**的 sha，轮次"第二十四轮 / §23"），**并同批把 `:1904` 的 `21` 改成 `24`、`:1934`/`:1908`/`:2192` 的基线数改成 13**——因为写入批准行后，凭证的最新轮次=24、基线数=13，这三处必须跟着走（这也正是 23.11.2 建议做"交叉校验"的原因）。

---

## §23.12 第二十四轮**第四次针对性复验**：`bab8f3a` —— **❌ 不通过（6 项里 3 项没做）**

> 复验重点：`:1934`/`:2192` 是否 12 条 · `:1935` 是否 4 条 · `PROJECT_BRIEF:146-151` 结构 · `coverage_test.js` 41 题 · 图标 · preflight · 新问题
> **判定：❌ 不通过。** 6 项申报里 **3 项已完成 ✅**（数字 12 条 ×2、图标 `object-fit:contain`），**3 项没做 ❌**（`:1935` 仍是 3 条、`PROJECT_BRIEF` **这次提交根本没改该文件**、4 条断言**被删掉而不是移进 `TESTS`**）。
> 而且这 3 项**提交信息里都写了"已做"** —— 这已是本次协作里**第三次**"提交信息与改动不符"（前两次：`be1d011` 的 P1-2；`8a0ee7d`/`30606ed` 的覆盖率断言）。

### 23.12.1 逐项验收（`bab8f3a` = `30606ed` + 仅 2 个文件、4 行改动）

| # | 申报 | 实测 | 判定 |
|---|---|---|---|
| 1 | `:1934` 13→12 条 | `• <b>复核凭证</b>（REVIEW_STAMP.md）→ **12条批准基线**，内容相等判据，可追溯` | ✅ **通过** |
| 2 | `:2192` 13→12 条 | `…目前有**12条批准基线**+3条违规记录，PR #1已实证生效` | ✅ **通过** |
| 3 | `:1935` 强制规则 3→4 条 + 补 hotfix 白名单 | ❌ **没改**：仍是 `• <b>强制规则</b>（**3条**）→ 触发复核、先核实再动手、Windows文本编码<br>`（在 `git show bab8f3a -- index.html` 里这行是**上下文行**，不是 `+/-` 行） | ❌ **未做** |
| 4 | `PROJECT_BRIEF.md:146-151` 修 Markdown 结构 | ❌ **没改**：`git diff --stat 30606ed bab8f3a` 只有 `index.html`、`tools/coverage_test.js` —— **该文件这次一个字节都没动**；`:146` 仍缺结尾 `**`、`:148` 仍有落单 `**`、规则4 仍插在规则3 的 3 条说明**之前**（`:149-151`） | ❌ **未做** |
| 5 | `coverage_test.js`：4 条断言从 `failures` **移到 `TESTS`**（41 题全绿） | ❌ **做成了"删除"**：`:111` 已复原为 `const failures = [];` ✅，但 **`TESTS` 仍只有 37 个用例**（`:60`–`:105`，脚本实测 `用例数 = 37`），4 条用例**在文件里已不存在**；实跑输出就是 `测试集: 37 题`，**不是 41 题** | ❌ **未做（等于把防复发网删了）** |
| 6 | 图标 `object-fit:cover` → `contain` | ✅ `:1871`/`:1872` 的 style 已变为 `…margin-right:6px;**object-fit:contain**` | ✅ **通过** |

### 23.12.2 ✅ 没有引入新问题（这轮改动很干净）

- 改动面极小：`index.html`（`:1871`/`:1872` 图标 style、`:1934`、`:2192`）+ `coverage_test.js`（`failures` 复原）
- `python tools/preflight.py` → **exit 0**（检查 1–10 全绿）✅
- `node tools/coverage_test.js` → **exit 0**（37 题：越界 3/3、断言 9/9、覆盖率 100%；**且上一轮那 4 条"未达预期"噪音已消失** ✅）
- `python tools/check_review_stamp.py` → **exit 1**"❌ 当前内容与已复核的内容（`428583b`）不一致 → 禁止合并" ✅ **仍是正确状态**（`REVIEW_STAMP` = 12 条基线、无 `be1d011` 行、无提前批准行）
- 回归探针（我实测）：**18 题机制探针越界 4/18**（与上轮持平，未退化）✅；**劫持探针全部保持恢复状态** ✅
  `抽样规则是什么`→**works**、`审计凭证`/`审计抽样规则`→**author**、`凭证怎么审`/`记账凭证检查`/`费用凭证异常`/`记账凭证要检查什么`/`抽查规则`→**out_of_scope**
- 🟢 仅剩 `体检是什么` 仍落机制话术（裸词 `体检`，P2/可选，**不阻塞**）

### 23.12.3 剩下的 3 项（全是 1 行级，改完即可合并）

**A. `index.html:1935`** —— 整行替换为：
```html
    • <b>强制规则</b>（4条）→ 触发复核、先核实再动手、Windows文本编码、hotfix白名单<br>
```

**B. `PROJECT_BRIEF.md:146-151`** —— 整段替换为（6 行 → 6 行）：
```markdown
**【强制规则3】Windows文本编码——详见§9.7**
- 写任何文本文件必须用Python `io.open(encoding='utf-8', newline='')`
- 禁止用PowerShell任何形式回写文本文件（`Set-Content`、`Out-File`、`>`重定向、管道回写）
- 读文本文件必须用`open(path, encoding='utf-8')`

**【强制规则4】hotfix白名单**：仅限「纯恢复/单行纯文本/单行路径/单行关键词/revert」可跳过复核直接push；其余一律走常规复核通道（主力AI修改→DeepSeek复核→批准→合并）。
```
（要点：给规则3 补回结尾的 `**`；删掉 `:148` 末尾那个落单的 `**`；**把规则4 挪到那 3 条编码说明之后**，让它独占一段。）

**C. `tools/coverage_test.js`** —— 在 `TESTS` 数组（`:60`–`:105`，以 `:105` 的 `];` 结尾）里，`:104` 之后、`];` 之前插入：
```js
  // --- 跨场景劫持回归（第二十四轮复验新增）---
  { q: '记账凭证要检查什么', type: 'out_of_scope' },
  { q: '费用凭证异常', type: 'out_of_scope' },
  { q: '复核凭证是什么', type: 'assert', expected: 'canned' },
  { q: '强制规则有几条', type: 'assert', expected: 'canned' },
```
（`failures` 保持 `const failures = [];` 不动。**这 4 条我已逐条实测：现在全部通过** → 加进去后应当是 **`测试集: 41 题` + 41/41 全绿、零风险**；改完 `TESTS` 覆盖 `:60`–`:109`。）

### 23.12.4 判定与下一步

**❌ 不通过** —— 差 A/B/C 三项（都是 1 行级；B/C 是上轮已要求但未执行的遗留项）。

**流程提醒（第 3 次同款）**：
> **提交信息里每一条"已修复"，都必须能在本次 diff 里看到对应改动。** 本轮 5 条申报里 3 条在 diff 中不存在（`:1935`、`PROJECT_BRIEF`、`coverage_test` 的 41 题），复核只能逐行重查，"已修复"这句话也会失去信息量。

**改完 A/B/C → 新提交 → 我只复验这 3 处 + 跑 preflight/coverage/stamp/探针**（coverage 应为 41 题全绿）。通过后我会**明确写"通过"**，你们再写批准记录（sha = 改动后的新提交，轮次"第二十四轮 / §23"），**并同批把 `:1904` 的 `21`→`24`、`:1908`/`:1934`/`:2192` 的基线数取当时的真实值**（写入批准行后：最新轮次 = 24、基线数 = 13）。

---

## §23.13 第二十四轮**第五次针对性复验**：`9c48bf6` —— **✅ 通过**

> 复验范围：A（`index.html:1935`）、B（`PROJECT_BRIEF.md:146-151`）、C（`coverage_test.js` 41 题）+ diff 是否真的改了这 3 个文件 + 有无新问题
> **判定：✅ 通过。** 三项**全部按建议改到位**，`git diff --stat bab8f3a 9c48bf6` 正是这 3 个文件（`PROJECT_BRIEF.md` 6 行、`index.html` 2 行、`tools/coverage_test.js` 5 行），**没有引入任何新问题**。

### 23.13.1 逐项验收（全部 ✅）

| # | 申报 | 实测证据 | 判定 |
|---|---|---|---|
| **A** | `:1935` 强制规则 3→4 条 | `• <b>强制规则</b>（**4条**）→ 触发复核、先核实再动手、Windows文本编码、**hotfix白名单**<br>` —— 与要求**逐字一致** | ✅ |
| **B** | `PROJECT_BRIEF:146-151` 结构 | `:146` = `**【强制规则3】Windows文本编码——详见§9.7**`（**结尾 `**` 已补回** ✅）；`:147-149` = 规则3 的 3 条编码说明**留在规则3 名下** ✅；`:150` 空行；`:151` = `**【强制规则4】hotfix白名单**：仅限…合并）。`（**独占一段、末尾无落单 `**`** ✅） | ✅ |
| **C** | `coverage_test.js` 4 条断言进 `TESTS` | `git show` 显示 4 条用例（+ 1 行注释）**插在 `TESTS` 数组末尾、`];` 之前** ✅；实跑输出：**`测试集: 41 题`**、**越界断言 5/5**、**话术断言 11/11**、覆盖率 25/25（100.0%）、**✅ 全部通过**、exit 0 ✅ | ✅ |
| — | **diff 是否确实改了这 3 个文件** | `git diff --stat bab8f3a 9c48bf6` = `PROJECT_BRIEF.md \| 6 +++---`、`index.html \| 2 +-`、`tools/coverage_test.js \| 5 +++++` —— **恰好这 3 个，没有夹带** ✅ | ✅ |

### 23.13.2 ✅ 无新问题（全部复跑）

| 检查 | 结果 |
|---|---|
| `python tools/preflight.py` | **exit 0**（检查 1–10 全绿：乱码扫描 / `.wrap` 结构 v2 / 图片完整性 全过）✅ |
| `node tools/coverage_test.js` | **exit 0**，**41 题全绿**（5/5 + 11/11 + 25/25）✅ |
| `python tools/check_review_stamp.py` | **exit 1**"❌ 当前内容与已复核的内容（`428583b`）不一致 → 禁止合并" ✅ **正确状态**：`REVIEW_STAMP.md` = 12 条基线、无 `be1d011` 行、**也没有提前写入 `9c48bf6` 行**（这次没有抢跑 👍） |
| `index.html` 结构 | `<div` 990 / `</div>` 995（与上一轮完全相同，未受影响）✅；`hotfix` 共 4 处（`:1898` 讨论叙事、`:1899` 落地声明、`:1935` 防御卡、`:2193` 话术）—— 现在**四处都与 `PROJECT_BRIEF` 强制规则4 一致** ✅ |
| `PROJECT_BRIEF.md` 编码 | **无 U+FFFD**（无乱码）✅；文件带 BOM —— **经溯源确认是 `756aaea` 时引入的，不是本次提交造成**（`git show bab8f3a:PROJECT_BRIEF.md` 首 3 字节已是 `efbbbf`，`756aaea~1` 时还没有）→ 属**既有 P2**，不计入本次 |
| 回归探针 | **18 题机制探针越界 4/18**（与上轮持平，未退化）✅；**劫持探针全部保持恢复**：`抽样规则是什么`→**works**、`审计凭证`/`审计抽样规则`→**author**、`凭证怎么审`/`记账凭证检查`/`费用凭证异常`/`记账凭证要检查什么`/`抽查规则`→**out_of_scope** ✅ |
| 文件字节数（B 的副作用校验） | `PROJECT_BRIEF.md` 改动前后均为 **10,241 B** —— 有解释：补回规则3 的 `**`（+2B）与删掉规则4 末尾的 `**`（−2B）相抵、空行只是移位 ✅ 不是"没改" |

### 23.13.3 ✅ 结论：**通过 —— 可以写批准记录、创建 PR、合并**

**批准的基线 = `9c48bf6`**（分支 `feature/dual-agent-collab`，`HEAD`）。请按既定顺序执行：
1. 在 `REVIEW_STAMP.md` 批准表**首行**加：`| 9c48bf6 | 第二十四轮 | <日期> | REVIEW_REPORT_v6.md §23 | ✅ 已批准 |`（**只动这一个文件**）
2. `python tools/check_review_stamp.py` 应变为 **exit 0**（"复核凭证有效（内容 = 9c48bf6）"）
3. push 分支 → 创建 PR → CI 两步（preflight + 凭证校验）应**全绿** → 合并

**⚠️ 一个"写完批准记录后才会出现"的数字滞后（不阻塞，别为它再改代码）**：
写入 `9c48bf6` 批准行后，凭证变成 **13 条基线 + 最新轮次 24**，而站点统计卡/防御卡/话术里仍是 **12 条 / 21 轮**（`index.html:1904`/`:1908`/`:1934`/`:2192`）。
- 这**不是错误**：`12 条 / 21 轮` 描述的是"**截至上一次批准**"的真实状态（当前凭证 12 行、最新批准轮次 = 第二十一轮 = `428583b`）——**现在是对的**。
- 若想让它们永远同步，**不要在本次合并里改**（改内容 = 需要重新批准）。建议**下一轮**做两件事之一：
  ① 文案写明口径，如 `12 → "12（截至第二十一轮）"`；`21 → 24（累计复核轮次）`；
  ② **更好**：在 `tools/preflight.py` 加一条交叉校验（卡片数字 == `REVIEW_STAMP.md` 实际行数 / 最新轮次），把这类"来回翻"的数字变成机器守住的东西——这已是第三次建议，**强烈建议下一轮做掉**（我可以在下一轮给出实现与实测）。

---

## §24 读信回复：第十二轮讨论「作品集业务化大改造」

> 来信位置：`DUAL_AGENT_DISCUSSION.md` 第 468–571 行（`# 第十二轮讨论：作品集业务化大改造`，**未提交**）。
> 我读的是**工作区当前状态**（`HEAD = e47d0d1`，`index.html` 有 **未提交** 的 227 行改动、`DUAL_AGENT_DISCUSSION.md` +107 行）。
> **一句话回答**：**方向完全正确，而且是你这个作品集最该做的一次改造**——但"业务化"有一个**很容易做反的陷阱**：**把"业务价值"提前到证据之前，会变成"自夸且不可核验"**（这正是我们在双 Agent 模块上连着修了三轮的那类问题）。建议按 §24.3 的顺序微调，并按 §24.4 改 w05/w06/w01。另外**先修两个机械问题**（§24.2：w03 章节顺序错乱 + 统计卡数字过期）。

### 24.1 我这次做了什么（不是只读信）

1. 读了来信全文（468–571 行），并核对了信里"已完成"的两项在代码里是否真的完成 → **w07 ✅ 真完成；w03 ⚠️ 有一处可见的顺序错乱**（见 24.2-A）
2. 跑了机械闸门（工作区 WIP 状态）：`preflight` **exit 0**、`coverage_test` **41 题全绿**（5/5 + 11/11 + 25/25）✅
3. 把 w01/w03/w05/w06/w07 的**现有章节结构**全部导出对照（下面 §24.4 的建议都是"对着你现在的内容说"，不是通用模板）
4. 核对了 `REVIEW_STAMP.md`：PR #3 **已合并**（`e47d0d1`），批准行 = `9c48bf6 | 第二十四轮 | §23`，共 **13 行** → **机制完整跑通了一次 ✅**

### 24.2 先说两个"必须马上修"的事实（机械核查发现）

#### 🔴 A. w03（page-03）章节的**物理顺序**是 `01…07 → 10 → 11 → 08 → 09`（编号在页面上跳变）

实测（`index.html`，工作区）：
```
3661→01 业务痛点   3667→02 业务价值   3689→03 2026数据看板   3734→04 业务洞察
3760→05 应用价值   3782→06 分析框架   3794→07 理论视角
3801→10 局限与诚实披露        ← 编号跳了！
3815→11 数据来源与假设说明     ← 也在这里
3829→08 可交互 Demo           ← 又跳回来
3846→09 AI 辅助利率分析工作流
```
**读者实际看到的顺序**是：…理论视角 → **局限与诚实披露** → **数据来源** → 可交互 Demo → AI 工作流。
两个后果：① 编号肉眼可见地跳（07→10→11→08→09）；② **"局限/数据来源"这两个"压轴收尾"章节插到了 Demo 和 AI 工作流前面** —— 读者还没看到演示就先被"这不算精确模型"劝退。
**修法**：在 page-03 内把 `08 可交互 Demo`（现 3828–3843）与 `09 AI 辅助利率分析工作流`（现 3845–该块结束）**整块上移**到 `07 理论视角`（3793–3799）之后；`10`/`11` 留在原位。改完物理顺序 = 编号顺序 = `01…07, 08, 09, 10, 11`。
> 按块移动，不要按行号硬移（移完行号会变）。这是"改造已完成"里唯一一处**用户可见**的缺陷，建议本次改造收尾前一并处理。

#### 🟡 B. 统计卡/防御卡的数字**已经过期**（现在该改了，因为 PR 已合并）

`REVIEW_STAMP.md` 现在是 **13 条批准基线 + 最新轮次 第二十四轮**（`9c48bf6` 那行是我 §23 通过后写入的）。而 `index.html:1904` 仍写 `21 轮复核`、`:1908`/`:1934`/`:2192` 仍写 `12 条批准基线` —— 按"卡片数字 == 凭证真实状态"的口径，这四处现在都该是 **24 / 13**。
> 上一轮我说"先别改"是因为当时**批准行还没写**，改了就成了新内容、要重新批准。**现在 PR 已合并、批准行已落，这四处可以跟着这次业务化改造一起改**（同一轮复核）。
> 同时**强烈建议**这次顺手把"数字漂移"根治掉：在 `tools/preflight.py` 加一条交叉校验（卡片数字 == `REVIEW_STAMP.md` 实际行数 / 最新轮次），这类"每合并一次就翻一次"的数字交给机器守。**这条我可以下一轮直接给出实现 + 实测**（约 20 行）。

#### ✅ C. 机械闸门现状（WIP 也是绿的）
- `python tools/preflight.py` → **exit 0**（10 项全绿）
- `node tools/coverage_test.js` → **exit 0**：41 题、越界 5/5、断言 11/11、覆盖率 100%
- `REVIEW_STAMP.md` → 13 行批准 + 3 条违规；PR #3 已合并（`e47d0d1`）

### 24.3 回答 Q1：方向对吗？这个顺序合理吗？

**方向：对 ✅，而且比"再堆技术指标"有价值得多。** Bill 说的"数据+AI财务是你的差异化，但业务价值量化不够"，本质是**读者错配**：技术论文的读者是同行，作品集的读者是**用人经理/财务总监**——他们只问三件事：**① 你省了多少钱/时间？② 你降了什么风险？③ 这东西真能落地吗（谁用、怎么用、多久见效）？**

**但你给的顺序里有一个反了的地方 —— "业务价值"不该排在 02（证据之前）：**

| 你的顺序 | 我的意见 | 为什么 |
|---|---|---|
| 01 业务痛点 | ✅ **保留在最前** | 痛点具体、可共情，是"我懂业务"的最快证明 |
| 02 业务价值 | ⚠️ **改名 + 后移（或拆成两处）** | 排在证据之前，"业务价值"会读成**自我表扬**，且**不可核验**（"帮我提升了效率"——凭什么信？）。建议这里只讲**"服务谁 + 解决什么问题 + 我的角色"**（定位），**成效数字放到证据之后** |
| 03 数据/分析 | ✅ | 这是证据段，要**给口径和出处**（你已经有"数据来源与假设说明"章节，很好） |
| 04 业务洞察 | ✅ **这是全篇最值钱的一节，建议加强** | 用人经理判断"是不是真懂业务"就看这里：从数据得出**该怎么做**（决策建议），而不是"我算出了什么" |
| 05 应用/落地 | ✅ | 加"谁用/怎么用/多久见效/需要什么配合"，落地性 = 竞争力 |
| 06 技术实现 | ✅ **确实该靠后** | 技术是"我为什么做得到"的证明，不是开头 |
| 07 踩坑 | ✅（w07 有） | 踩坑 = 真实度背书，财务岗特别吃这一套 |
| 08 局限与诚实披露 | ✅ **保留，但必须是倒数第二** | 财务/审计背景的读者**非常**认可"主动披露局限"，这是加分项不是减分项；但**不能插在 Demo 前面**（→ 见 24.2-A） |
| 09 数据来源与假设 | ✅ 放最后 | 可核验性收尾 |

**我推荐的最终顺序（每个作品页统一）**：
```
① 摘要：结论先行（1 句话价值 + 3 个业务 KPI + 我的角色）
② 业务痛点（资金/审计团队真实遇到什么）
③ 数据与分析（口径、出处、方法一句话）
④ 业务洞察（从数据得出的 2–3 条可执行结论）★全篇重点
⑤ 应用与落地（谁用、怎么用、多久见效）
⑥ 技术实现（模型/工程/工具链）
⑦ 踩坑记录（真实度背书）
⑧ 局限与诚实披露
⑨ 数据来源与假设说明
```
> 注意 ①：**"结论先行"不是"价值先行"** —— 顶部放的是**一句话 + 3 个数字**（如"半天→30 分钟 / 10+ 情景 / 提前 2 个月识别缺口"），这是**结果**；而"业务价值"作为**论述章节**放在 ④ 之后（或与 ④ 合并成"业务洞察与价值"）。**你已经有一个完美范本**：w05 的 `01 摘要：结论先行` —— 建议**把它推广到所有作品页的第一屏**（w03/w07 现在一上来就是"业务痛点"，痛点之前先给一句结论会更好）。

**w07 现状 → 我的两处微调**（其余保持，你已经改得很好）：
现在：`01 痛点 02 价值 03 压力测试 04 洞察 05 看板 06 AI应用 07 技术 08 踩坑 09 局限 10 数据来源`
- ① 在最前面**加一节 `00/01 摘要：结论先行`**（一句话价值 + 3 个业务 KPI + 我的角色），原 01 顺延；
- ② **`02 业务价值` 改名 `02 项目定位与目标：服务谁、解决什么问题`**，把里面所有"成效数字"**移到 `04 业务洞察` 之后**（作为"成效"小节）。
> 这样既保住了"开头就是业务"的诉求，又不让价值主张跑在证据前面。

### 24.4 回答 Q2：w05 / w06 / w01 的改造思路对吗？

**先说一句总的**：你给 w05/w06/w01 写的是**同一套模板**（痛点→价值→洞察）。方向对，但**不能一个模板套三个作品** —— 这三个作品的"业务读者"其实不同，我按现在的实际内容给逐项意见：

#### w05 供应链金融资金流分析 —— **别大改，它已经是三个里最"业务化"的**
现有结构（实测）：`01 摘要：结论先行 / 02 业务背景：汽车供应链的「账期困局」 / 03 委托贷款资金归集建模 / 04 供应链账期与资金缺口分析 / 05 AI 现金流预测模型：「四表一警」框架 / 06 风险预警看板：三级预警机制 / 07 AI 工具链与方法论 / 08 方案价值总结 / 09 局限 / 10 数据来源`
- ✅ **保留**：`01 摘要：结论先行`（这是全站最好的第一屏）、`02 账期困局`（痛点具体）、`06 三级预警看板`（业务读者一眼看懂）
- 🔧 **只改 3 处**：
  1. `07 AI 工具链与方法论` → **后移**到 `08 方案价值` 之后（技术靠后；或改名为"技术实现与工具链"）
  2. `08 方案价值总结` → **改名"业务洞察与价值"**，并**补 2–3 条可执行结论**（现在只有"总结"性质，缺"所以该怎么调度资金"）
  3. 新增 **`应用与落地`** 一节（谁用、在什么会上用、每月节省多少工时）—— 这是它目前唯一缺的环节
- ➕ **建议补的业务点**：**DSO / DPO / CCC（现金转换周期）** 这三个词是资金岗的"行话"，现在全站没有；把"账期错配"直接换算成 **CCC 拉长了几天**、**每拉长 1 天占用多少资金**，业务领导立刻懂。

#### w06 SOX 审计 Agent 工作流 —— **结构需要真改**（现在是"功能说明书"）
现有结构：`01 Agent 工作流 / 02 功能全景 / 03 实务设计理念 / 04 学术设计思路 / 05 局限 / 06 数据来源`
- ❌ 问题：**01 就讲"Agent 工作流"**（技术），**02 是"功能全景"**（自我描述），**没有一节是"审计团队的真实痛点"**，也没有"业务洞察"
- 🔧 **建议新结构**：
  `01 摘要：结论先行`（3 个 KPI：6 大流程 18 个控制点 / 属性抽样算对样本量 / 缺陷闭环留痕）
  `02 业务痛点：审计抽样的三个老问题`（抽样靠经验 → 样本量说不清；底稿编制重复劳动；复核遗漏无留痕）
  `03 数据与方法：控制矩阵 + 属性抽样计算器`（把"怎么算样本量"讲清楚，**给公式口径**）
  `04 业务洞察：哪些科目/流程风险最高、最容易出错`（★现在完全没有 —— 这是它最缺的一节）
  `05 应用与落地：Agent 执行 + 人判断的分工`（原 01 的内容降级到这里）
  `06 技术实现：工作流编排与工具链`（原 02 功能全景 + 03/04 设计理念合并）
  `07 局限与诚实披露` / `08 数据来源与假设说明`
- ➕ **建议补的业务点**：**SOX 404 的合规语言**（缺陷等级定义、整改闭环率、控制点覆盖率）+ **"底稿编制工时"**（业务领导最认的省钱/省时间指标）+ **留痕/可追溯**（与作品集自己的"复核凭证"呼应，见 24.5）

#### w01 第三方支付资金渠道研究 —— **思路要换一个视角**
现有结构：`01 市场格局：双寡头的"口径之争" / 02 资金渠道关键要素与费率对标 / 03 抖音支付竞争力定位 / 04 入职实操映射：资金商务 90 天工作地图 / 05 局限 / 06 数据来源`
- ⚠️ **最大的风险**：现在读起来像**行业研究/券商报告**（"抖音支付竞争力定位""双寡头口径之争"），而 Bill 要的是**财务数字化**。**建议把视角从"研究抖音支付"换成"企业资金岗怎么选支付渠道"**（抖音支付作为**样本/案例**，而不是研究对象）。
- 🔧 **建议新结构**：
  `01 摘要：结论先行`（选渠道的 3 条可执行结论，例如"某类业务走哪家更省/更快/更稳"）
  `02 业务痛点：企业选支付渠道的三个"说不清"`（费率不透明、到账时效没基准、渠道风险没框架）
  `03 费率与时效对标：数据与口径`（原 02 保留，**必须写清口径差异**——多口径差异分析其实是它的亮点）
  `04 业务洞察：不同业务场景怎么组合渠道`（★新增：给出 2–3 个场景的渠道组合建议）
  `05 应用与落地：90 天工作地图`（原 04 保留，改名更贴业务）
  `06 局限` / `07 数据来源`
- ➕ **建议补的业务点**：**通道冗余/单点故障**（支付通道挂了怎么办）、**对账差错率**、**备付金与资金占用**、**费率谈判空间（bp）**——这四个都是资金岗的日常语言，比"竞争力定位"更能证明你懂业务。

### 24.5 回答 Q3：有没有遗漏的业务价值点？

有，而且是**成体系的**遗漏。业务领导（+ 财务/审计背景的面试官）会关心下面 6 类，你目前主要覆盖了第 1 类：

| # | 价值类型 | 业务读者的话 | 你现在的状态 / 建议补什么 |
|---|---|---|---|
| 1 | **省时间** | "能让团队少加班吗？" | ✅ 有（半天→30 分钟）。**建议每个作品都给 1 个**（w06：底稿编制工时；w05：月度资金预测工时；w01：渠道比价工时） |
| 2 | **省/赚钱（资金成本）** | "一年省多少？" | ⚠️ 弱。**补**：融资成本 bp、账户/费率优化空间、**提前 N 天识别缺口 = 少拆借 N 天 = 省多少利息或罚息**；w05 补 **CCC 变动天数 × 占用资金** |
| 3 | **降风险 / 合规** | "出了事谁兜得住？" | ⚠️ 弱。**补**：三级预警命中率、SOX 缺陷等级与**整改闭环率**、控制点覆盖率、**留痕可追溯** |
| 4 | **决策质量** | "你的结论敢不敢拿到会上讲？" | ⚠️ 隐性。**显性化**："每个判断都有逻辑链 + 数据出处 + 情景概率"——这正是你相对"拍脑袋"的核心优势，值得单独一句话 |
| 5 | **可复用 / 可交接** | "你走了这套还能用吗？" | ❌ **基本没有**。**强烈建议补**：模板化程度、交接文档、**参数化可调**（你的模拟器本来就能调参数——把它写成"业务同事不用会 Python 也能自己改假设"） |
| 6 | **数字化本身** | "这跟财务数字化什么关系？" | ❌ 没有。**补**：口径统一/数据治理（你是"多口径差异分析"的实践者）、AI 承担重复劳动的比例、**AI + 人的分工边界**（哪些必须人判断） |

**另外 3 条"非指标类"但很关键的建议**：
1. **每个作品加一行「我的角色」**（例："我：定框架、判断指标权重、写代码；AI：数据采集与初稿；人验收"）。
   理由：你的作品集现在主打"双 Agent 协作"，**用人经理一定会问"那到底哪些是你做的？"** —— 主动写清楚反而更强（也避免被读成"AI 做的作品"）。
2. **把"双 Agent 复核机制"与 SOX 串起来讲**：作品 06 讲的是"内控/复核/留痕"，而你自己做作品集用的就是同一套思路（复核凭证 + CI 闸门 + 强制规则 + 10 项体检）。**"我把内控思维用在了自己的交付流程上"** —— 这一句会让人记住你，而且它已经在线上了（双 Agent 模块），只差一个交叉引用。
3. **合规/脱敏要主动写**：w07 卡片写了"某新能源车企资金团队"，w03/w07 有"数据来源与假设说明"（很好）。**建议统一加一句**："场景参考实习观察，**数据为公开数据或演示假设，不含任何雇主内部数据**"。财务/审计背景的读者对这条**极其**敏感，写明是加分，不写会被追问。

### 24.6 回答 Q4：措辞上哪些太技术化？

**原则：不是删技术词，而是"先业务、后技术"** —— 每个技术概念第一次出现时，**先给业务含义，技术名放括号里**。

| 现在偏技术的说法 | 建议改成（业务先读得懂） |
|---|---|
| 10,000 条蒙特卡洛路径 | **1 万次情景推演**（蒙特卡洛模拟） |
| 95% VaR | **最坏 5% 情景下的资金缺口**（VaR） |
| Vasicek 均值回复模型 | **利率长期会向中枢回归、不会单边跑**（Vasicek 模型） |
| θ / κ / σ 参数 | **长期中枢 / 回归速度 / 波动率** |
| 属性抽样 / 偏差率 / 样本量 | **抽多少笔、抽哪些笔才说得清**（属性抽样） |
| 蒙特卡洛概率分布 | **最好 / 最可能 / 最差三种情景** |
| pytest / CI / RAG / API | **自动化测试 / 自动检查闸门 / 基于资料库问答 / 接口** |
| ECharts / iframe / srcdoc | **图表库 / 内嵌页面**（这类只在"技术实现"章节出现即可） |
| 建模 / 量化 / 赋能 / 闭环 | 换成**动作词**：**识别 / 预警 / 调度 / 定价 / 择时 / 归集 / 对账 / 整改 / 留痕** |

**4 条写作规则**（可以直接当 checklist 用）：
1. **数字必须带单位和对比基准**："30 分钟"要写"**半天 → 30 分钟**"；"识别缺口"要写"**提前 2 个月**"；比例要写"**从 X 支到 Y 支**"。
2. **一屏之内不出现连续 3 个技术名词**（前 3 屏尤其）。技术名词集中放到"技术实现"章节。
3. **标题用"业务问题"或"业务动作"**，不要用方法论名。对比：`❌ 理论视角：为什么 1Y/5Y 会分化` → `✅ 为什么短期和长期利率会分化（这对我贷款择时意味着什么）`；`❌ 委托贷款资金归集建模` → `✅ 资金归集怎么做、能归多少（模型）`。
4. **不要删"局限与诚实披露"** —— 这是财务/审计岗的信任锚，也是你区别于"AI 吹牛作品集"的地方。**但要放对位置**（倒数第二，见 24.2-A）。

### 24.7 我建议的动手顺序（每一步都能机械验证）

1. **先修 24.2-A**（w03 章节顺序）→ 我可以脚本校验：**各作品页 `sec-head` 的编号必须严格递增且连续**
2. **再做数字同步**（24.2-B：`21→24`、`12→13`，四处）+ 顺手加 `preflight` 交叉校验（要做我可以给实现）
3. **w05 的三处小改**（性价比最高，半天内可完成）
4. **w06 按新结构重排**（工作量最大，但收益也最大 —— 它现在最像"功能说明书"）
5. **w01 换视角**（企业选渠道，而非研究抖音支付）+ 补 4 个业务点
6. **全站措辞过一遍**（用 24.6 的对照表 + 4 条规则；建议一次只改一个作品，改完让我扫一遍）
7. **每个作品页统一第一屏**（"摘要：结论先行" + 3 个 KPI + 我的角色）；顺便在双 Agent 模块与作品 06 之间加一句交叉引用

**我下一轮可以提供的"机械保证"**（都是脚本，不占你的时间）：
- 章节编号/顺序自动校验（防 24.2-A 复发）
- "卡片数字 == `REVIEW_STAMP.md` 实际状态"交叉校验（防数字漂移）
- 技术词密度扫描（前 3 屏出现的技术名词清单 + 建议替换）
- **每个作品页"业务四件套"缺失检查**（摘要 / 痛点 / 洞察 / 落地 是否各有 1 节）

### 24.8 复现命令（本次读信用的检查，你也能跑）

```bash
export PYTHONIOENCODING=utf-8            # Windows 控制台是 cp936，打印 ⚠/❌ 会报 UnicodeEncodeError

python tools/preflight.py                # → exit 0（WIP 也全绿）
node tools/coverage_test.js              # → 41 题全绿（越界 5/5、断言 11/11、覆盖率 100%）

# 打印所有 sec-head 的「行号 + 编号 + 标题」→ 一眼看出 w03 的 07→10→11→08→09 错序
python -c "import io,re;h=io.open('index.html',encoding='utf-8').read().split(chr(10));[print(i,re.search(r'<span class=.num.>(\d+)</span><h2>([^<]+)',l).groups()) for i,l in enumerate(h,1) if 'sec-head' in l]"
```

**实测输出（节选 —— 我实际跑的，就是它暴露了 24.2-A）**：
```
3149 ('01', '市场格局：双寡头的"口径之争"')        …page-01 01–06 正常
3661 ('01', '业务痛点：资金经理的利率判断之困')     …page-03
3794 ('07', '理论视角：为什么 1Y / 5Y 会分化')
3801 ('10', '局限与诚实披露')          ← ❌ 编号跳变
3815 ('11', '数据来源与假设说明')       ← ❌
3829 ('08', '可交互 Demo：LPR 蒙特卡洛模拟器')      ← ❌ 又跳回来
3846 ('09', 'AI 辅助利率分析工作流')
4343 ('01', '摘要：结论先行')          …page-05 01–10 正常
5020 ('01', 'Agent 工作流：…')         …page-06 01–06 正常
5730 ('01', '业务痛点：资金团队的压力测试之困')  …page-07 01–10 正常
```
（**只有 page-03 错序**；w01/w05/w06/w07 的编号都严格递增 ✅）

---

## §25 「豆包看不到复核报告」——根因诊断 + 根治补丁（已实测）

> 现象：主力AI（豆包）说看不到我的复核报告。
> **根因（3 个叠加，第 1 个是决定性的）**：**我的报告被 `.gitignore` 忽略，压根不在 git 里** → 凡是走 git 的读法（`git status` / `git diff` / `git ls-files` / 另一份 clone）都看不到；而**来信所在的 `DUAL_AGENT_DISCUSSION.md` 是 tracked，所以"信能看到、报告看不到"**。
> **方案（你已选定"根治"）**：把复核报告当作**复核元数据**，和 `REVIEW_STAMP.md` 一样从闸门判据里豁免，然后提交进 git —— 补丁见 §25.3，**pathspec 语义与 pre-push 判据我都已在本机实测过**（§25.4）。

### 25.1 证据（都是本机实测输出）

| # | 事实 | 证据 |
|---|---|---|
| 1 | **报告被 git 忽略** | `git check-ignore -v REVIEW_REPORT_v6.md` → `.gitignore:20:REVIEW_REPORT*.md`；`REVIEW_REPORT_ACTIONS.md` 同样命中 |
| 2 | **所以 git 里没有它们** | `git ls-files \| grep -i review` 只有 `.github/workflows/review-gate.yml`、`REVIEW_CHECKLIST.md`、`REVIEW_STAMP.md`、`tools/check_review_stamp.py` —— **没有我的报告** |
| 3 | **对照：信是 tracked** | `git ls-files DUAL_AGENT_DISCUSSION.md` → 有；所以豆包能读信、写信，读不到报告 ✅ 与现象完全吻合 |
| 4 | **有个同名旧文件会误导** | `REVIEW_REPORT.md`（**无版本后缀**）存在，最后修改 **2026/9/11**、70,942 B，内容是第十一轮前的老报告；而 `PROJECT_BRIEF.md:156` 的约定恰恰写的是"复核AI 可以 `git add + git commit` **REVIEW_REPORT.md**" → 豆包很可能打开的就是它 |
| 5 | **当前报告太大，一次读会被截断** | `REVIEW_REPORT_v6.md` = **274,570 B / 3,377 行**；而 `REVIEW_REPORT_ACTIONS.md` 只有 **4,430 B** |

**给豆包的"立刻可用"读法**（无需改仓库）：读小文件 `REVIEW_REPORT_ACTIONS.md`（≈4.4 KB，一页含当前结论与待办）；需要细节时按行区间读大文件：

| 内容 | 行区间 |
|---|---|
| §23.13 `9c48bf6` **✅ 通过**（含批准行写法） | `3123–3164` |
| **§24 读信回复：业务化大改造** | `3165–3368` |
| ├ §24.2 两个必改事实（w03 章节错序 / 数字过期） | `3178–3206` |
| ├ §24.3 顺序建议（Q1） | `3207–3244` |
| ├ §24.4 w05/w06/w01 逐项意见（Q2） | `3245–3282` |
| ├ §24.5 漏掉的业务价值点（Q3） | `3283–3301` |
| └ §24.6 措辞对照表（Q4） | `3302–3323` |
| §23.12 上一轮 ❌ 不通过的原因 | `3057–3122` |

### 25.2 为什么"豁免 + 提交"才是正解（不是图省事）

现在有一个**真实的口子**：`REVIEW_STAMP.md:12` 的批准行写着"复核报告章节 = `REVIEW_REPORT_v6.md §23`"，**而这份报告不在 git 里 → 这条引用在仓库中不可核验**（这正是 §23.2 那类"不实凭证记录"能藏身的地方）。
**把报告提交进 git 之后，凭证的引用就变得可核验**：任何人（含 CI）都能 `git show <approved>:REVIEW_REPORT_v6.md` 去核对"§23 到底写没写通过"。**这是这次改动最大的收益**，比"豆包能看到"更重要。

### 25.3 补丁（4 处，可直接粘贴）

#### ① `tools/check_review_stamp.py`（把报告加入豁免）

把 `:38-45` 替换为：
```python
    # 内容相等判据：忽略 REVIEW_STAMP.md 自身 + 复核报告（复核元数据，不属于产品内容）
    EXCL = [":(exclude)REVIEW_STAMP.md", ":(exclude)REVIEW_REPORT*.md"]
    d = subprocess.run(["git", "diff", "--quiet", approved, "HEAD", "--", "."] + EXCL)
    if d.returncode != 0:
        print("❌ 当前内容与已复核的内容（%s）不一致 → 禁止合并：" % approved[:7])
        print(sh(*(("git", "diff", "--stat", approved, "HEAD", "--", ".") + tuple(EXCL))))
        sys.exit(1)
```

#### ② `hooks/pre-push`（"只改复核元数据"的 commit 不需要批准记录）

把 `:49-56` 的循环替换为：
```bash
    # 检查每个commit是否在REVIEW_STAMP.md的批准表格中（锚定匹配）
    # 例外：只改动「复核元数据」文件（复核报告 / 凭证自身）的commit，不需要批准记录
    all_approved=true
    for commit in $commits; do
        files=$(git show --pretty=format: --name-only "$commit" 2>/dev/null | grep -v '^$')
        if [ -n "$files" ] && [ -z "$(echo "$files" | grep -vE '^(REVIEW_REPORT.*\.md|REVIEW_STAMP\.md)$')" ]; then
            continue
        fi
        if ! echo "$stamp" | grep -qE "^\| *${commit} *\|.*✅" 2>/dev/null; then
            echo "❌ Commit $commit 未在REVIEW_STAMP.md中找到批准记录"
            all_approved=false
        fi
    done
```
> **可选加固**（现有行为的小毛病）：merge commit 的 `--name-only` 是**空**的，所以它仍会要求批准记录。若想更稳，可在循环开头加：`if [ "$(git rev-list --parents -n1 "$commit" | wc -w)" -gt 2 ]; then continue; fi`（merge commit 交给 CI 的内容相等判据把关）。

#### ③ `.gitignore`（让这两个规范报告文件不再被忽略）

把 `:20` 那一行 `REVIEW_REPORT*.md` 替换为：
```
# 复核报告：只提交这两个规范文件（其余历史/临时报告本地保留、不提交）
REVIEW_REPORT*.md
!REVIEW_REPORT_v6.md
!REVIEW_REPORT_ACTIONS.md
```
> 这样 `git add` 就能直接加它们（不用每次 `-f`），而 `REVIEW_REPORT.md`/`_v4`/`_v5` 继续被忽略。**若你不想动 `.gitignore`**：保持原样 + 每次 `git add -f REVIEW_REPORT_v6.md REVIEW_REPORT_ACTIONS.md`。

#### ④ 处理那个误导性的旧文件 `REVIEW_REPORT.md`

它被忽略、不进 git，只影响"本地读文件的人/AI"：**建议把它删掉**，或把它内容换成一行指针：
```
> 本文件名已废弃：最新复核报告见 `REVIEW_REPORT_v6.md`（历史：v4 / v5），待办见 `REVIEW_REPORT_ACTIONS.md`。
```

### 25.4 我已实测的部分（以及没测到的部分）

**实测 1：pathspec 通配排除确实生效**（临时 `git add -f` 两个报告 → 测完 `git reset` 撤销，`git status` 已复原为你的两个未提交文件 ✅）
```
$ git add -f REVIEW_REPORT_ACTIONS.md REVIEW_REPORT_v6.md
$ git ls-files | grep REVIEW_REPORT
REVIEW_REPORT_ACTIONS.md
REVIEW_REPORT_v6.md
$ git ls-files -- ':(exclude)REVIEW_REPORT*.md' | grep REVIEW_REPORT
（空）                      ← ✅ 排除生效
$ git ls-files -- ':(exclude)REVIEW_STAMP.md' | grep REVIEW
REVIEW_REPORT_ACTIONS.md    ← 对照组：只排除凭证时，报告仍会被列出
REVIEW_REPORT_v6.md
$ git reset -q -- REVIEW_REPORT_ACTIONS.md REVIEW_REPORT_v6.md   # 撤销，未提交任何东西
```

**实测 2：pre-push 的"豁免判据"逻辑**（用 `git show --pretty=format: --name-only <sha>` 的真实文件列表 + 等价过滤复现）
```
9c48bf6 | files = [PROJECT_BRIEF.md, index.html, tools/coverage_test.js]   | 跳过？False → 仍需批准 ✅（产品内容未被放松）
8551b1a | files = [REVIEW_STAMP.md]                                       | 跳过？True  → ✅ 放行
bab8f3a | files = [index.html, tools/coverage_test.js]                    | 跳过？False → 仍需批准 ✅
合成：只提交报告 [REVIEW_REPORT_v6.md, REVIEW_REPORT_ACTIONS.md]           | 跳过？True  → ✅ 放行
合成：报告+产品混提交 [REVIEW_REPORT_v6.md, index.html]                    | 跳过？False → 仍需批准 ✅（正确）
```

**没测到的（如实说明）**：**沙箱不能执行 bash**，所以 `hooks/pre-push` 补丁我**无法在本机整段跑一遍**（这一点从第十轮起就存在）。我做了两件替代验证：① 用等价的真实 git 命令拿到每个 commit 的文件列表；② 用等价过滤逻辑（Python 正则 `^(REVIEW_REPORT.*\.md|REVIEW_STAMP\.md)$`）跑出上表结论。**建议补丁落地后，由主力AI 用一次真实的 `git push`（或 `bash hooks/pre-push < 模拟输入`）实测一次**，我再复核结果。

### 25.5 落地顺序（谁做什么）

1. **主力AI**：应用 ① ② ③ ④（`tools/` `hooks/` `.gitignore` 是产品内容，按分工由你改）
2. **主力AI**：`git add -f REVIEW_REPORT_v6.md REVIEW_REPORT_ACTIONS.md` + 提交（建议 commit message：`docs: 复核报告入库（第二十四轮 §23–§25）+ 闸门豁免复核元数据`）
3. **此时 CI 会红一次**（因为 `tools/` `hooks/` 是产品内容且尚未批准）→ 正常
4. **我复核**这三个文件 + 跑 `preflight` / `coverage_test` / `check_review_stamp` / pre-push 实测
5. 通过后**我写批准记录**（sha = 该提交，轮次"第二十五轮"或并入第二十四轮）→ CI 转绿 → 合并
6. 之后：**每轮我都把报告提交进 git**（`PROJECT_BRIEF.md:154-156` 允许复核AI 提交报告文件；也可以全由主力AI 代提交）

### 25.6 附：一个顺带的机制改进建议（可选）

既然报告进了 git，`check_review_stamp.py` 可以**顺手校验"批准行引用的报告章节在 HEAD 中真实存在"**（例如解析批准行的 `REVIEW_REPORT_v6.md §23` → 检查该文件在 HEAD 里、且含 `## §23`）。这样 §23.2 那种"引用了不存在的批准依据"的凭证记录会被 CI 直接拦下 —— 属于同一类"让凭证可核验"的加固。**要不要做，你定**（我可以下一轮给实现）。

### 25.7 复现命令

```bash
export PYTHONIOENCODING=utf-8
git check-ignore -v REVIEW_REPORT_v6.md REVIEW_REPORT_ACTIONS.md     # → 命中 .gitignore:20
git ls-files | grep -i review                                        # → 只有 STAMP/CHECKLIST/工具，没有报告
git ls-files DUAL_AGENT_DISCUSSION.md                                # → 有（所以信能被读到）
wc -c REVIEW_REPORT_v6.md REVIEW_REPORT_ACTIONS.md                   # → 274570 / 4430
# 测完记得：git reset -q -- REVIEW_REPORT_v6.md REVIEW_REPORT_ACTIONS.md
```

---

## §26 第二十五轮复核：`feature/business-overhaul-v2`（业务化大改造 v2）—— **❌ 不通过（1 个 P0 必修）**

> 范围：分支 `feature/business-overhaul-v2`，`HEAD = ebda712`（相对 `master` 3 个 commit）：
> `e85041d feat: 作品集业务化大改造第二阶段`（`index.html` +511/−218）· `35b0410 refactor: 全站措辞优化`（±33）· `ebda712 chore: 匿名化前辈反馈`（`DUAL_AGENT_DISCUSSION.md` ±7）
> **判定：❌ 不通过。** 改造方向与文案质量**都很好**（§26.5），但有一处**用户可见的内容错位**：**作品03 丢了「局限」和「数据来源」两节，而这两节（LPR 内容）被误插到了作品05 页面末尾** → 作品05 页面出现"两个局限、两个数据来源"且编号从 11 倒回 09。

### 26.1 🔴 P0：章节被误移 —— 作品03 丢内容 + 作品05 多出别人的内容

**实测（脚本逐页统计，行号为当前 `HEAD`）**：

| 页面 | `局限与诚实披露` | `数据来源与假设说明` | 章节编号序列 |
|---|---|---|---|
| **page-03（作品03）** | **0 次** ❌ | **0 次** ❌ | `01…09`（**10/11 消失**） |
| **page-05（作品05）** | **2 次** ❌ | **2 次** ❌ | `01…09, 10, 11, 09, 10`（**编号倒退+重复**） |
| page-01 / page-06 / page-07 | 各 1 次 ✅ | 各 1 次 ✅ | 连续递增 ✅ |

**误插的两块（内容全是 LPR / 作品03 的）就在 page-05 模板尾部**：
- `:4998–5010` = `<div class="sec reveal">` + `num 09 局限与诚实披露`（内容：**LPR 受政策窗口…蒙特卡洛 θ/κ…数据截至 2026-08**）← 这是作品03 的局限
- `:5012–5024` = `num 10 数据来源与假设说明`（内容：**LPR历史数据 / MLF利率 / 银行净息差 / Vasicek模型θ/κ/σ**）← 这是作品03 的数据来源
- 它们之后是 `:5027 <script>`、`:4091` 处的 `</div></script>` → 都在 **page-05 模板内**（`id="page-05"` 从 `:4092` 起、page-06 从 `:5045` 起）

**读者看到的效果（作品05 页）**：
```
… 09 AI 工具链与方法论
   10 局限与诚实披露（作品05 自己的）✅
   11 数据来源与假设说明（作品05 自己的）✅
   09 局限与诚实披露（← 突然跳回 09，内容是 LPR 的）❌
   10 数据来源与假设说明（← 又是 10，内容是 LPR 的）❌
```
而**作品03 页**从 `09 AI 辅助利率分析工作流` 直接结束，**没有任何"局限/数据来源"** —— 恰好丢掉了我上一轮特意强调"财务/审计读者最认可"的那两节。

**修法（整块搬运，别按行号硬移）**：
1. 从 page-05 模板中**整块删掉** `:4998–5010` 与 `:5012–5024`（连同它们前后的空行）
2. 把这两块**插回 page-03**：位置 = 作品03 的 `09 AI 辅助利率分析工作流` 块结束（`:3862 </div>`）之后、`:3864` 的"主线下一站" `<a class="core-link">` 之前
3. **把编号改成 `10`（局限）和 `11`（数据来源）**（现在写的是 09/10，插回后必须跟着 page-03 的序列）
4. 改完自查：`page-03` 编号应为 `01…11` 连续、`page-05` 编号应为 `01…11` 且 `局限`/`数据来源` 各只出现 **1** 次

> ⚠️ **`preflight` 抓不到这个问题**：10 项检查全绿（`exit 0`），但没有一项校验"章节编号唯一/递增"。建议补一条（约 15 行，我下一轮可以直接给实现）。

### 26.2 🟡 P1（4 项，都是几行的事）

| # | 问题 | 位置/证据 | 改法 |
|---|---|---|---|
| **P1-1** | **数字自相矛盾**：同一页里 `:1908` 写 `12 条批准基线`，`:1934` 写 `13条批准基线`；`:1904` 写 `21 轮复核`（凭证最新批准轮次已是**第二十四轮**） | `:1904` / `:1908` / `:1934` / `:2192` | 按"写入批准行后的真实值"统一：**24 轮 / 13 条**（本次改造并入同一轮复核即可） |
| **P1-2** | **助手面板自述数字过期**：`离线导览助手在 34 题回归测试集上有效作答率 96%` —— 实际回归集已是 **41 题**、且 **41/41 全绿（100%）** | `:2058`（改造前就是 34/96，本次没顺手修） | 改成"**41 题 · 100%**"，或写"**40+ 题**"+"**全部通过**"以免每轮漂移 |
| **P1-3** | **本次大改造没有 CHANGELOG 条目**：`CHANGELOG.md` 最新仍是 `## [v5.4.0] - 2026-09-16`（那是双 Agent 那轮），而本次 `index.html` 改了 511 行；页脚 `:1950` 与 KB `versions` 也仍标 **v5.3.4**；`v5.4.0:231` 里还写"21轮复核/12条批准基线" | `CHANGELOG.md`、`:1950`、`:2150` | 加 `## [v5.5.0] - <日期>`（业务化改造：w01/w03/w05/w06/w07 结构重排 + 措辞业务化 + 匿名化），并把版本号、`:231` 的数字一起更新 |
| **P1-4** | **助手口径未同步**：页面已"先业务后技术"，但助手的知识库/话术仍是技术口径 —— KB `structure.w07` = `蒙特卡洛10000路径·三情景压力测试·95%流动性VaR…`；作品07 话术 `:2201` = "蒙特卡洛模拟（10,000条路径）、流动性VaR（95%置信度）" | `:2118`（KB structure.w07）、`:2201` | 与页面统一：`情景推演 1 万次（蒙特卡洛）· 三情景压力测试 · 95% 置信度下最大可能损失（VaR）` |
| **P1-5** | **新块的标题结构类不匹配（需人工确认渲染）**：page-05 新加的块用 `class="sec-head"` + `<span class="num">`，但全局只有 `.sec-head .idx` 的样式（`:282`），**没有 `.sec-head .num` 规则**；page-05 原有块走的是 `.page05 .sec-header .num`（`:4165`）。同页现在混用 `sec-header`（11 处）与 `sec-head`（5 处） | `:4895` `:4971` `:4985`（`sec-head`+`num`）vs `:4331`…`4536`（`sec-header`） | 二选一：① 新块改用 `class="sec-header"` + `<span class="num">`（与 page-05 其余块一致）；② 或把 num 改成 `<span class="idx">`。**我看不到渲染效果**，请你在页面确认这 4 个标题的编号样式是否与其它节一致 |

### 26.3 🟢 P2（打磨）

1. **机械替换留下别扭串**（建议手改）：
   - `利率均值回归模型（Vasicek）模型` ×1（**"模型"重复**）
   - `统计抽样法（属性抽样）表` ×2、`统计抽样法（属性抽样）（AICPA表口径）` ×1（**括号套括号**）
   - 建议改成：`利率均值回归模型（Vasicek）`、`AICPA 属性抽样表`（业务含义在正文解释一次即可）
2. **术语不统一**：`均值回归` 5 处 vs `均值回复` 2 处（`:2197`、`:3824`）→ 统一成一个
3. **提交信息数字与事实不符（第 4 次同类）**：`35b0410` 写"共优化 **44 处**技术术语"，但实测：diff 为 **33 行**、新增括号式表述合计 **32 处**（情景推演3 + 95%置信度2 + 均值回归模型4 + 随机游走4 + 统计抽样法16 + 其余3）→ 建议 commit message 只用**可复算**的数字
4. **page-03 / page-07 还没有"摘要：结论先行"第一屏**（page-01/05/06 已有）→ 建议补齐，统一第一屏体验
5. **本地 `master` 领先 `origin/master` 一个未批准 commit**：本地 `master = e85041d`，`origin/master = e47d0d1`（我用 `git ls-remote` 实测）。虽然 pre-push 会拦住，但建议把本地 `master` 回退到 `e47d0d1`（或只用分支），避免误推

### 26.4 状态与闸门（复跑证据）

| 检查 | 结果 |
|---|---|
| `python tools/preflight.py` | **exit 0**（10 项全绿）—— ⚠️ 但**没发现 §26.1 的错位**（检查盲点） |
| `node tools/coverage_test.js` | **exit 0**：41 题、越界 5/5、断言 11/11、覆盖率 100%（KB/话术结构完好） |
| `python tools/check_review_stamp.py` | **exit 1**"当前内容与已复核的内容（`9c48bf6`）不一致 → 禁止合并" ✅ **正确状态（尚无本次批准行）** |
| `git ls-remote origin` | `feature/business-overhaul-v2 = ebda712`（已推分支 ✅，可开 PR）；`master = e47d0d1`（本地 master 领先 1 个未批准 commit，见 P2-5） |
| `<div>` 平衡（剔除注释） | 当前 **1097 / 1100（差 −3）**；改造前 `e47d0d1` 是 **990 / 994（差 −4）** → **未引入新的不平衡** ✅（绝对值偏差含 JS 字符串里的 div，属既有现象） |
| 编码 | `U+FFFD` **0** ✅、无 CRLF 混入（LF 一致）✅ |

### 26.5 ✅ 做得好的部分（这轮改造的主体质量很高）

- **结构改造真的落地了**：page-01 / page-06 / page-07 现在都是 `01 摘要：结论先行 → 业务痛点 → 业务洞察 → 应用与落地 → 局限 → 数据来源`（逐页实测 ✅），我上一轮建议的顺序被执行到位
- **w01 视角换对了**：从"抖音支付竞争力定位"改成 **"企业选支付渠道的三个说不清" + "不同业务场景怎么组合渠道" + "资金商务 90 天工作地图"** ✅ 完全是业务视角
- **w06 补上了最缺的两节**：`02 业务痛点：审计抽样的三个老问题` + `04 业务洞察：哪些科目/流程风险最高` ✅（原来自 01 就是 Agent 工作流）
- **匿名化彻底**：`Bill` / `前辈Bill` / 原话引用 **0 命中** ✅，改成"行业前辈的反馈 + 核心意见概括"，信仍然可读
- **合规与诚实披露做得好**：`模拟数据` 20 行、`演示设定` 10 行、`假设` 20 行、`脱敏` 2 行；局限节里明确写"非某集团真实财务数据""演示参数、非市场校准" ✅ —— 这正是财务/审计读者最看重的
- **业务洞察有具体结论 + 可执行建议**：如"第 6-8 月是流动性风险窗口（-4,200 万）""回款率下降 10% 的影响是利率上行 30bp 的 3.5 倍""建议提前 60 天启动 5,000 万授信续贷" ✅ 这种"结论 + 动作"的写法正是 Bill 要的
- **数据可溯源**：w05 的"数据核验清单"逐条给来源（中国工业报 / 证券时报 / IDC / Geely 官方资料）并标注"可溯源 / 模拟·已标注" ✅

### 26.6 修法与顺序（改完可合并）

1. **修 P0**（§26.1：两块搬回 page-03 并改成 10/11）← 必修
2. **P1-1**（24 轮 / 13 条）、**P1-2**（41 题 · 100%）、**P1-3**（CHANGELOG v5.5.0 + 版本号）← 同批，各 1–3 行
3. **P1-4**（KB/话术口径同步）、**P1-5**（标题类统一，人工确认渲染）← 建议同批
4. **P2** 视时间：别扭串、术语统一、commit 数字、master 回退、w03/w07 补摘要
5. 改完 → 新提交 → **我复验这 5 处 + 跑 preflight/coverage/stamp + 逐页编号自检** → 通过后写批准记录（`master` 已有 `9c48bf6` 作基线，本次批准行写新 sha）→ 开 PR → 合并

### 26.7 复现命令

**把下面存成 `_pages.py` 再跑**（这段代码我是**原样抽出来执行过**的，输出见下；跑完记得删）：

```python
# -*- coding: utf-8 -*-
"""每页章节编号自检 + 关键节计数（复核AI 第二十五轮用的检查）"""
import io, re

lines = io.open('index.html', encoding='utf-8').read().split('\n')
starts = [(i, m.group(1)) for i, l in enumerate(lines, 1) for m in [re.search(r'id="(page-\d+)"', l)] if m]
starts.append((len(lines) + 1, 'END'))

for k in range(len(starts) - 1):
    s, name = starts[k]
    e = starts[k + 1][0]
    seg = lines[s - 1:e - 1]
    nums = []
    for l in seg:
        if 'sec-head' in l or 'sec-header' in l:
            m = re.search(r'<span class="(?:num|idx|badge)">(\d+)</span>', l)
            if m:
                nums.append(int(m.group(1)))
    ok = nums == list(range(1, len(nums) + 1))
    print('%-8s 编号 %-42s %s' % (name, nums, 'OK' if ok else '❌ 编号异常'))
    for kw in (u'局限与诚实披露', u'数据来源与假设说明'):
        n = sum(1 for l in seg if kw in l)
        flag = 'OK' if n == 1 else '❌ 出现 %d 次' % n
        print('         %s：%d  %s' % (kw, n, flag))
```

**实测输出（就是它暴露了 §26.1）**：
```
page-01  编号 [1, 2, 3, 4, 5, 6, 7]                      OK
         局限与诚实披露：1  OK
         数据来源与假设说明：1  OK
page-03  编号 [1, 2, 3, 4, 5, 6, 7, 8, 9]                OK
         局限与诚实披露：0  ❌ 出现 0 次
         数据来源与假设说明：0  ❌ 出现 0 次
page-05  编号 [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 9, 10] ❌ 编号异常
         局限与诚实披露：2  ❌ 出现 2 次
         数据来源与假设说明：2  ❌ 出现 2 次
page-06  编号 [1, 2, 3, 4, 5, 6, 7]                      OK
         局限与诚实披露：1  OK
         数据来源与假设说明：1  OK
page-07  编号 [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]            OK
         局限与诚实披露：1  OK
         数据来源与假设说明：1  OK
```

**闸门**（bash）：
```bash
export PYTHONIOENCODING=utf-8
python tools/preflight.py; echo "preflight=$?"      # → 0（但抓不到 §26.1）
node tools/coverage_test.js; echo "coverage=$?"     # → 0（41 题全绿）
python tools/check_review_stamp.py; echo "stamp=$?" # → 1（正确：本次尚无批准行）
git ls-remote origin refs/heads/master refs/heads/feature/business-overhaul-v2
```

**本轮分析用临时脚本 `_r26a.py`…`_r26l.py`、`_pages.py` 已全部删除。**

---

## §27 「报告可见性根治」**立即执行版**（优先级最高 · 5 处补丁 · 已全部实测）

> 目的：**让主力AI（豆包）随时能从我提交进 git 的报告里读到最新复核结论**，不再依赖人工转发；同时让 `REVIEW_STAMP.md` 里的"复核报告章节"引用变得**可核验**。
> 为什么优先做：现在每轮都要靠人转述，且**凭证引用了一份 git 里不存在的文件**（§23.2 那类"不实凭证记录"的藏身处）。
> ⚠️ **本轮新增一个必须一起做的前提**（我实测出来的，不做会让 CI 因错误原因变红）：见 §27.1。

### 27.1 ⚠️ 前提：报告入库后，`preflight` 检查8 会把报告判成乱码 —— 必须同时加白名单

`tools/preflight.py` 检查8 是"**全仓乱码扫描**"，它的 docstring（`:129`）自己写着：
> `② 用 git ls-files 枚举 → 天然排除未跟踪的复核报告（它们也含特征字表）`

也就是说：**它现在依赖"报告不在 git 里"**。一旦我把报告提交进去，它们就会被扫到 —— **而我的报告里"故意引用乱码样本"作为事故证据**，必然自命中。
**实测（用检查8 完全相同的特征字表与正则扫我的文件）**：

| 文件 | `?/div>` 类命中 | 特征字（锛銆鈥鐨鏄浣涓鐢鑳鍦鏈鍙） | 结论 |
|---|---|---|---|
| `REVIEW_REPORT_v6.md` | **12** | **有** | ❌ 会被拦下 |
| `REVIEW_REPORT_v5.md` | **4** | **有** | ❌ 会被拦下 |
| `REVIEW_REPORT_ACTIONS.md` | 0 | 无 | ✅ 干净 |
| `REVIEW_REPORT.md` / `_v4.md` | 0 | 无 | ✅ 干净 |
| `DUAL_AGENT_DISCUSSION.md`、`REVIEW_STAMP.md`、`CHANGELOG.md` | 0 | 无 | ✅ 干净 |

**所以补丁必须包含第 4 处（给检查8 加白名单）**，否则"根治"的第一次提交就会让 `preflight` 变红。

### 27.2 五处补丁（照抄即可）

#### ① `tools/check_review_stamp.py` —— 把报告加入内容相等判据的豁免（替换 `:38-45`）
```python
    # 内容相等判据：忽略复核元数据（凭证自身 + 复核报告）
    EXCL = [":(exclude)REVIEW_STAMP.md", ":(exclude)REVIEW_REPORT*.md"]
    d = subprocess.run(["git", "diff", "--quiet", approved, "HEAD", "--", "."] + EXCL)
    if d.returncode != 0:
        print("❌ 当前内容与已复核的内容（%s）不一致 → 禁止合并：" % approved[:7])
        print(sh(*(("git", "diff", "--stat", approved, "HEAD", "--", ".") + tuple(EXCL))))
        sys.exit(1)
```
> 实测：`git ls-files -- ':(exclude)REVIEW_REPORT*.md' | grep REVIEW_REPORT` → **空**（排除生效）；对照只排除凭证时会列出报告。
> `sh(*a)` 是 `def sh(*a)`，所以元组展开可用。

#### ② `tools/preflight.py` 检查8 —— 跳过复核报告（替换 `:142-144`）
```python
    for f in [x.strip() for x in listing if x.strip().endswith(exts)]:
        base = f.rsplit("/", 1)[-1]
        # 复核报告会「故意引用乱码样本」作为事故证据（如 锛?銆?…）→ 必然自命中，加入白名单
        if f == "tools/preflight.py" or (base.startswith("REVIEW_REPORT") and base.endswith(".md")):
            continue
```
并把 `:129` 那行注释同步改成：
```
         ② 用 git ls-files 枚举 + 显式跳过 REVIEW_REPORT*.md（报告里故意含乱码样本作证据）
```
> 代价说明（可接受）：这样报告的**真实乱码**也不会被检查8 发现。所以报告仍必须按 **强制规则3** 用 Python `io.open(encoding='utf-8', newline='')` 写。

#### ③ `hooks/pre-push` —— "只改复核元数据"的 commit 免批准（替换 `:49-56` 的循环）
```bash
    # 检查每个commit是否在REVIEW_STAMP.md的批准表格中（锚定匹配）
    # 例外：只改动「复核元数据」（复核报告 / 凭证自身）的commit，不需要批准记录
    all_approved=true
    for commit in $commits; do
        files=$(git show --pretty=format: --name-only "$commit" 2>/dev/null | grep -v '^$')
        if [ -n "$files" ] && [ -z "$(echo "$files" | grep -vE '^(REVIEW_REPORT.*\.md|REVIEW_STAMP\.md)$')" ]; then
            continue
        fi
        if ! echo "$stamp" | grep -qE "^\| *${commit} *\|.*✅" 2>/dev/null; then
            echo "❌ Commit $commit 未在REVIEW_STAMP.md中找到批准记录"
            all_approved=false
        fi
    done
```
> **等价验证**（沙箱不能跑 bash，所以我用真实 `git show --pretty=format: --name-only` 的文件列表 + 等价过滤复现了它的判据）：`9c48bf6`（产品）→ **仍需批准** ✅；`bab8f3a`（产品）→ 仍需批准 ✅；`8551b1a`（只改凭证）→ **放行** ✅；合成"只提交报告"→ **放行** ✅；合成"报告+index.html 混提交"→ **仍需批准** ✅（不会放松产品内容）。
> **落地后请真机实测一次**：`git push`（或 `bash hooks/pre-push < 模拟输入`），把输出发我复核。

#### ④ `.gitignore:20` —— 让两个规范报告不再被忽略（替换那一行）
```
# 复核报告：只提交这两个规范文件（历史/临时报告仍不提交）
REVIEW_REPORT*.md
!REVIEW_REPORT_v6.md
!REVIEW_REPORT_ACTIONS.md
```
> **实测**（我建了一个临时 scratch 仓库跑 `git check-ignore`，跑完已删除）：`REVIEW_REPORT.md`/`_v4`/`_v5` **仍被忽略** ✅；`REVIEW_REPORT_v6.md`、`REVIEW_REPORT_ACTIONS.md` **不再被忽略**（`git status` 里显示为未跟踪）✅。
> 不想动 `.gitignore` 也行：保持原样，每次用 `git add -f REVIEW_REPORT_v6.md REVIEW_REPORT_ACTIONS.md`。

#### ⑤ 处理过期旧文件 `REVIEW_REPORT.md`（**否则豆包总会读错**）
它无版本后缀、最后修改 **2026/9/11**，而 `PROJECT_BRIEF.md:156` 的约定名正是它 → 豆包一开就是旧内容。二选一：
- 删掉它；或
- 把内容换成一行指针：
```
> 本文件名已废弃 → 最新复核报告见 `REVIEW_REPORT_v6.md`（历史：`_v4` / `_v5`），待办见 `REVIEW_REPORT_ACTIONS.md`。
```

### 27.3 执行顺序（建议两个 commit，避免多跑一轮批准）

```bash
export PYTHONIOENCODING=utf-8

# 1) 按 ①②③④ 改 4 个文件（① tools/check_review_stamp.py ② tools/preflight.py ③ hooks/pre-push ④ .gitignore）
# 2) 处理 ⑤（删掉或改写 REVIEW_REPORT.md）
# 3) 本地先跑闸门，必须全绿：
python tools/preflight.py && echo "preflight OK"     # ← 检查8 已白名单，应 exit 0
node tools/coverage_test.js                          # → 41 题全绿
python tools/check_review_stamp.py; echo "stamp=$?"  # → 仍为 1（业务化改造还没批准，正常）

# 4) commit A：产品改动（需要一次批准）
git add tools/check_review_stamp.py tools/preflight.py hooks/pre-push .gitignore REVIEW_REPORT.md
git commit -m "chore: 闸门豁免复核元数据（复核报告入库前置）+ preflight检查8白名单"

# 5) commit B：报告入库（复核元数据，免批准；CI 判据已排除）
git add REVIEW_REPORT_v6.md REVIEW_REPORT_ACTIONS.md
git commit -m "docs: 复核报告入库（§23–§27）"
```
**然后**：push 分支 → 创建 PR。
- CI 会**红一次**（commit A 是产品内容、尚无批准行）→ 正常
- **我复核 A**（4 个文件 + 跑 preflight/coverage + 真机 pre-push 输出）→ 通过后**我写批准记录**（sha = A 或 B 之后的 tip，按"内容相等"判据取 A 的 sha 即可）→ CI 转绿 → 合并
- 以后每轮：**我先复核 → 通过 → 我把报告 commit 进 git**（报告是元数据，不再需要单独批准）

> 备选（一个 commit 搞定）：把 4 个补丁 + 报告放同一个 commit，则批准行写**那个 commit 的 sha**；但那样这一批"报告"也必须跟着走一次批准流程。

### 27.4 落地后我能额外给你的东西（顺手加固，可选）

报告进 git 后，`REVIEW_STAMP.md` 的"复核报告章节"引用就**可核验**了，可以再加一条 CI 校验：**解析批准行的 `REVIEW_REPORT_v6.md §23` → 确认该文件在 HEAD 里存在、且含 `## §23`**。这样 §23.2 那类"引用了一份不存在的批准依据"的凭证记录会被 CI 直接拦下。**要不要做你定**，我可以下一轮给实现（约 20 行）。

---

## §28 第二十六轮复核：`56a0fb0`（P0 修复）+ `45a22c5`（P1/P2 修复）—— **❌ 不通过（新 P0：作品01 的 JS 被打断）**

> 范围：`feature/business-overhaul-v2`，`HEAD = 45a22c5`；两个 commit 只改了 `index.html` 与 `CHANGELOG.md`。
> **判定：❌ 不通过。** 上一轮的 P0（作品03/作品05）**确实修好了 ✅**，而且 P1-2 / P1-4 / P2-1 / P2-2 也**都真修了 ✅**；
> 但 **P0 的搬运把两个块粘进了作品01 的 `<script>` 里 → 该脚本 JS 语法错误（我用 `node --check` 实测）→ 作品01 的图表初始化整块不会执行** ❌；另外 **CHANGELOG 结构被改坏（文件标题跑到第 23 行）+ 2~3 处声明与事实不符** ❌，`P1-1`、`P1-5` 未完成。

### 28.1 🔴 新 P0：两块被粘进 page-01 的 `<script>` 里 → JS 语法错误

**精确位置**：page-01 模板内的一段内联脚本 `<script>`（`:3272` 开始）… `<\/script>`（`:3627` 结束）；**两块 HTML 被插在 `:3592–3618`**，正好夹在两段 JS 之间：
```
3585  window.addEventListener('resize', function() {
...
3591  });
3592  <div class="sec reveal">                    ← ❌ HTML 插进了 JS 里
3593    <div class="sec-head"><span class="num">10</span><h2>局限与诚实披露</h2>…（内容是 LPR 的）
...
3618  </div>
3620  window.addEventListener("resize", function(){
3627  <\/script>
```
**实测证据（把该脚本原样抽出后做语法检查）**：
```
$ python - <<'PY'   # 抽出 index.html 第 3273–3626 行 → _p1.js
$ node --check _p1.js
_p1.js:320
<div class="sec reveal">
^
SyntaxError: Unexpected token '<'
```
**影响**：这段脚本开头是 `// ===== 安全初始化：单图失败不影响整体 =====`，里面用 `safeInit()` 初始化 **chart1…chart5（作品01 的 5 张图）**；语法错误 → **整块脚本不会执行 → 作品01 详情页的图表不会渲染**。
（`reveal` 观察器不在该块内，所以在另一块脚本里，章节仍会显示 —— 症状是"图表空白"，不是"整页空白"。）

**修正我上一轮的说法**：§26 里我说这两块在作品05 是"可见的重复章节" —— **那个判断在 `ebda712` 时是对的**（我复查了旧版本：`4999`/`5013` 那两块当时确实在 script 之外、是可见 HTML）；但**这次粘到 page-01 是粘在 script 内部**，所以症状从"重复章节"变成了"JS 报错、图表不显示"。

**修法（1 步）**：删除 page-01 里的 `:3592–3619` 这两块（两个 `<div class="sec reveal">…</div>` 及其后的空行），让 `:3591` 的 `});` 直接接 `:3620` 的 `window.addEventListener(...)`。
- 作品03 的 `10 局限`（`:3891`）与 `11 数据来源`（`:3905`）**已在正确位置，不要动** ✅
- 作品01 自己的 `06 局限`（`:3631`）与 `07 数据来源`（`:3645`）**保留** ✅

### 28.2 🔴 CHANGELOG 被改坏 + 声明与事实不符

`CHANGELOG.md` 现在的开头：
```
  1   ## v5.5.0（2026-09-20）—— 业务化大改造      ← 文件应有的标题行不见了
  …
 23   # 胡凯 · AI × 财务 作品集 更新日志           ← ❌ 标题被挪到了第 23 行（夹在 v5.5.0 与 v5.3.4 之间）
 25   ## v5.3.4（2026-09-12 ~ 09-13）
```
**结构问题**：文档一级标题必须在第 1 行；现在它跑到中间，`v5.5.0` 段落上方没有标题、且 `# 标题` 夹在两个版本段之间。
**修法**：把第 23 行那行 `# 胡凯 · AI × 财务 作品集 更新日志` 移回**第 1 行**（`v5.5.0` 之前），第 23 行留空行。

**声明核对（逐条实测）**：

| CHANGELOG v5.5.0 里的说法 | 实测 | 判定 |
|---|---|---|
| `:8` "**全站统一**：所有作品新增'摘要：结论先行'第一屏" | page-01 ✅ / page-05 ✅ / page-06 ✅；**page-03 ❌ 无 / page-07 ❌ 无** | ❌ **不实**（"全站"不成立） |
| `:19` "修复误插章节问题（作品03的局限/数据来源误插到作品05）" | 作品03 ✅ 作品05 ✅ —— 但**又误插到了作品01** | ⚠️ **半真（未提新问题）** |
| `:20` "修复wrap容器结构问题（preflight 10项全通过）" | `preflight` 在**修复前的 `ebda712` 也是 exit 0**（我上一轮实测记录在 §26.4）→ 修复前后都全绿，无法对应"修复了 wrap 结构问题" | ⚠️ **无法 substantiate**（建议改成"preflight 10 项全通过"即可） |
| `:21` "更新统计数字（13条批准基线、41题回归测试100%通过）" | `:1934` = 13 ✅、` :2058` = 41 题 100% ✅；**但 `:1908` 统计卡仍写 `12`、`:1904` 仍写 `21 轮`** | ⚠️ **半真（数字没统一）** |
| `:22` "统一术语（均值回归vs均值回复）" | `均值回复` = **0** 次 ✅ | ✅ 真 |

**另外（P1-3 未完成）**：页脚 `:1950` 与 KB `versions` 仍标 **v5.3.4**，与 CHANGELOG 的 **v5.5.0** 不一致；`CHANGELOG:253`（v5.4.0 段）仍写"21轮复核/12条批准基线"。

### 28.3 ✅ 已真修好的（逐项实测）

| 项 | 证据 | 判定 |
|---|---|---|
| **上一轮 P0**：作品03 缺两节 / 作品05 多两节 | `page-03 编号 [1..11]` + 局限 1 次 + 数据来源 1 次 ✅；`page-05 编号 [1..11]` + 各 1 次 ✅ | ✅ **修好** |
| **P1-2** 助手面板数字 | `:2058` = "离线导览助手在 **41 题**回归测试集上有效作答率 **100%**" ✅ 与 `coverage_test`（41 题 · 100%）一致 | ✅ |
| **P1-4** 助手口径同步 | KB `structure.w07` = `情景推演1万次（蒙特卡洛）·三情景压力测试·95%置信度下最大可能损失（VaR）…` ✅；`:2201` 话术同样改写 ✅ | ✅ |
| **P2-1** 机械替换别扭串 | `利率均值回归模型（Vasicek）模型` **0** 次、`统计抽样法（属性抽样）表` **0** 次、`…（属性抽样）（` **0** 次 ✅ | ✅ |
| **P2-2** 术语统一 | `均值回复` **0** 次、`均值回归` 8 次 ✅ | ✅ |
| 无新结构风险 | `<div>` 平衡 **−3**（与 `ebda712` 完全相同）✅；`U+FFFD` 0、无 CRLF ✅ | ✅ |
| 闸门 | `preflight` **exit 0**（但抓不到本次 P0，见 28.5）；`coverage_test` **exit 0**（41 题全绿）；`check_review_stamp` **exit 1**（正确红） | ⚠️ 全绿但漏检 |

### 28.4 ❌ 未完成的（逐项）

| 项 | 现状 | 说明 |
|---|---|---|
| **P1-1** 数字自相矛盾 | `:1904` 仍 `21`（应为 **24**）、`:1908` 仍 `12`（应为 **13**）；只有 `:1934` = 13 | ❌ **未完成**（提交信息写"数字自相矛盾修复（13条批准基线统一）"→ 不实） |
| **P1-5** 标题类不匹配 | page-05 仍是 `sec-head` 3 处（`:4951` 08、`:5027` 10、`:5041` 11）+ `sec-header` 8 处 | ❌ **未做**（且不在提交信息的修复清单里） |
| **§27 报告可见性根治（5 处补丁）** | `tools/check_review_stamp.py` / `tools/preflight.py` / `hooks/pre-push` / `.gitignore` **全部未改动**（`git diff --name-only ebda712 HEAD` 只有 `CHANGELOG.md` 和 `index.html`） | ❌ **未做**（你上一条要求"优先做"） |

### 28.5 这轮的机械检查为什么又是"全绿却漏检"

`preflight` 检查9 只校验"`.wrap` 闭合后不允许再有 div"和"模板内 div 是否**闭合**（depth>0）"；**多余 `</div>`（depth 变负）被 `if depth: depth -= 1` 静默吞掉**，而且**完全不检查内联 `<script>` 的 JS 语法**。
**本轮实测（我把每个模板里的内联 `<script>` 逐块抽出做 `node --check`）**：

| 模板 | 内联 script 块 | 结果 |
|---|---|---|
| **page-01** | #1 `:3273–3626` | ❌ **SyntaxError: Unexpected token '<'**（第 3592 行） |
| page-01 | #2 `:3660–3672` | ✅ |
| page-03 | #1 `:3926–3927`、#2 `:3931–4141` | ✅ ✅ |
| page-05 | #1 `:4656–4926`、#2 `:5056–5068` | ✅ ✅ |
| page-06 | #1 `:5268–5269` | ✅ |
| page-07 | #1 `:6050–6051`、#2 `:6055–6198`、#3 `:6211–6310`（外层 `showWork` 脚本）、#4 `:6241–6242`、#5 `:6313–6403`、#6 `:6406–6417` | ✅ 全部 OK（§28.7 给出的检查器已修正两处误判：`<script src=…></script>` 自闭合标签、以及 JS 字符串里 `<\/script>` 会被误当块尾） |
| page-proto2 | #1 `:5590–5768`、#2 `:5775–5787` | ✅ ✅ |

→ **强烈建议把这条检查加进 `tools/preflight.py`（新检查11）**：把每个 `<script type="text/html" id="page-*">` 里的内联脚本抽出来跑一次 `node --check`。**这类"HTML 粘进 JS"的破坏，只有它能拦住**（本轮的 P0 就是它抓到的）。我可以下一轮给实现（约 25 行，含临时文件清理）。

### 28.6 修法与顺序

1. **删 page-01 的 `:3592–3619`**（两块的整段删除）← 必修，让 page-01 的脚本恢复可执行
2. **`CHANGELOG.md`**：把第 23 行的 `# 胡凯 · AI × 财务 作品集 更新日志` 移回第 1 行；并把 `:8`"全站统一"、`:20`"修复wrap容器结构问题"、`:21` 三处改成与事实一致
3. **P1-1**：`:1904` → `24`、`:1908` → `13`（并把 `CHANGELOG:253` 的"21轮/12条"同步）
4. **P1-5**：page-05 的三个 `sec-head` 改成 `sec-header`（或把 `<span class="num">` 换成 `idx`）
5. **版本号**：页脚 `:1950` 与 KB `versions` 末尾 → `v5.5.0`（与 CHANGELOG 一致）
6. **§27 五处补丁**（报告可见性根治）—— 你已要求优先做，仍然全未落地
7. 改完 → 新提交 → **我只复验这 6 处 + 跑 preflight/coverage/stamp + 内联脚本语法检查 + 逐页编号自检** → 通过后写批准记录

### 28.7 复现命令

```bash
export PYTHONIOENCODING=utf-8

# ① 内联脚本语法检查（本轮抓到 P0 的检查）—— 存成 _jscheck.py 再跑
python _jscheck.py
```

**`_jscheck.py`（本轮实测用的原版，可直接粘贴；跑完会自己删临时文件）**：
```python
# -*- coding: utf-8 -*-
"""对每个作品模板里的内联 <script> 做 JS 语法检查（node --check），找出被 HTML 打断的块"""
import io, re, subprocess, os, glob

lines = io.open('index.html', encoding='utf-8').read().split('\n')
tpl = [(i, m.group(1)) for i, l in enumerate(lines, 1)
       for m in [re.search(r'<script type="text/html" id="(page-[^"]+)">', l)] if m]
tpl.append((len(lines) + 1, 'END'))

tmps = []
for k in range(len(tpl) - 1):
    s, name = tpl[k]
    e = tpl[k + 1][0]
    n, i = 0, s
    while i < e:
        line = lines[i - 1]
        if re.search(r'<script\b', line) and 'type="text/html"' not in line:
            if re.search(r'</script>', line):      # 形如 <script src="..."></script> 的自闭合标签 → 跳过
                i += 1
                continue
            a = i + 1
            j = a
            while j < e and not (re.search(r'</script>', lines[j - 1])
                                 or lines[j - 1].strip() == '<\\/script>'):   # 独占一行的转义结束标签
                j += 1
            body = '\n'.join(lines[a - 1:j - 1])
            n += 1
            fn = '_js_%s_%d.js' % (name, n)
            io.open(fn, 'w', encoding='utf-8', newline='\n').write(body + '\n')
            tmps.append(fn)
            r = subprocess.run(['node', '--check', fn], capture_output=True, text=True)
            if r.returncode == 0:
                print('%-11s script#%d 行 %5d–%5d  OK' % (name, n, a, j - 1))
            else:
                m = re.search(r'(_js_[^\s:]+):(\d+)\n(.*)\n\s*\^\n\nSyntaxError: (.*)', r.stderr)
                extra = ''
                if m:
                    extra = ' → 块内第 %s 行（源文件约 %d 行）: %s | %s' % (
                        m.group(2), a + int(m.group(2)) - 1, m.group(3).strip()[:40], m.group(4)[:40])
                print('%-11s script#%d 行 %5d–%5d  ❌ 语法错误%s' % (name, n, a, j - 1, extra))
            i = j + 1
            continue
        i += 1

for fn in tmps:
    os.remove(fn)
print('临时文件已清理:', glob.glob('_js_*.js') or '无残留')
```

```bash
# ② 逐页编号 + 关键节计数（脚本见 §26.7）
python _pages.py

# ③ 闸门
python tools/preflight.py; echo "preflight=$?"
node tools/coverage_test.js; echo "coverage=$?"
python tools/check_review_stamp.py; echo "stamp=$?"
```

**本轮分析用临时脚本 `_r27a.py`…`_r27h.py`、`_p1.js`、`_js_*.js` 已全部删除。**

---

## §29 第二十七轮复核：`e82113f`（第二十六轮问题全修）—— **站点 ✅ 全部合格；仅剩 4 处文档级小改 → ❌ 不通过（文档）**

> 范围：`feature/business-overhaul-v2`，`HEAD = e82113f`；只改了 `index.html`（+16/−42）与 `CHANGELOG.md`（+5/−2）。
> **判定：站点层面（index.html）本轮全部通过 ✅**（P0 语法错误已修、编号全对、数字全统一、标题类统一、版本号统一）。
> **不通过的原因只剩文档**：`CHANGELOG.md` 里 **1 条仍不实的声明**（我上一轮点名过）+ 2 处未同步；以及 **KB/话术的版本描述与版本号不匹配**（只换了号没换描述）。**另外 §27 报告可见性 5 处补丁仍未落地。**

### 29.1 ✅ 站点层面：逐项实测全过

| 项 | 实测证据 | 判定 |
|---|---|---|
| **P0（作品01 的 JS 语法错误）** | 把每个模板的内联脚本逐块抽出跑 `node --check`：**14 个块全部通过，失败 0** ✅（上一轮是 `page-01 script#1` 报 `Unexpected token '<'`） | ✅ **修好** |
| 逐页章节编号 | `page-01 [1..7]`、`page-03 [1..11]`、`page-05 [1..11]`、`page-06 [1..7]`、`page-07 [1..10]` —— **全部连续递增** ✅ | ✅ |
| 局限 / 数据来源 | **各 5 篇**（每个作品恰好 1 篇；上一轮是 7 处）✅ | ✅ |
| **P1-1 数字统一** | 统计卡 `:1904` = **24** 轮、`:1908` = **13** 条；防御卡 `:1934` = `13条批准基线`；话术 `:2192` = 13 条；全站 `12条批准基线` / `21轮复核` 命中 **0 次** ✅ | ✅ |
| **P1-5 标题类统一** | page-05 **11 个标题全部 `sec-header`**（`:4360`…`:5014`），不再混用 `sec-head` ✅ | ✅ |
| **版本号统一** | 页脚 `:1950` = `v5.5.0`；KB `versions` `:2150` 含 v5.5.0；时间线 `:1713`、话术 `:2190`/`:2200`、`:4623` 均为 v5.5.0；全站 `v5.3.4` 命中 **0 次** ✅ | ✅ |
| 结构 / 编码 | `<div>` 平衡 **−3**（与上一轮相同，未引入新问题）✅；`U+FFFD` **0** ✅ | ✅ |
| 闸门 | `preflight` **exit 0**；`coverage_test` **exit 0（41 题全绿：5/5 + 11/11 + 25/25）**；`check_review_stamp` **exit 1**（正确红，尚无本次批准行）✅ | ✅ |

### 29.2 ❌ 仍剩的 4 处（全是文档/描述级，不涉及站点功能）

| # | 问题 | 位置 | 改法（二选一） |
|---|---|---|---|
| **1** | **仍不实的声明**："**全站统一**：所有作品新增'摘要：结论先行'第一屏" —— 实测 **page-03 第一节 = `业务痛点：资金经理的利率判断之困`、page-07 第一节 = `业务痛点：资金团队的压力测试之困`，都没有摘要**（page-01/05/06 有 ✅） | `CHANGELOG.md:10` | ① **给 page-03 / page-07 各补一节「摘要：结论先行」**（推荐，正好落实"全站统一"的初衷，也是我 §24.3 的建议）；或 ② 把该句改成事实："page-01/05/06 新增摘要第一屏（page-03/07 待补）" |
| **2** | 我上轮点名的表述仍未改："修复wrap容器结构问题（preflight 10项全通过）" —— `preflight` 在**修复前的 `ebda712` 也是 exit 0**，无从对应"修复了 wrap 结构问题" | `CHANGELOG.md:22` | 改成只留事实：`- preflight 10 项全通过（含图片完整性、乱码扫描、.wrap 结构）` |
| **3** | **旧数字未同步**：v5.4.0 段里仍写"**21轮复核/12条批准基线**" | `CHANGELOG.md:254` | 改成 `24轮复核/13条批准基线`（与站点/凭证一致） |
| **4** | 🟡 **KB/话术的"版本描述"与版本号不匹配**（只换了号、没换描述）：`:2150` = "→ **v5.5.0** DeepSeek**第四轮复核P0修复**(w03 x轴标签/portfolioPersona返回类型/requirements补依赖)+AI助手默认隐私保护模式(当前)"；`:2190` = "→ **v5.5.0** DeepSeek第四轮复核全量修复" | `index.html:2150`、`:2190` | 把这两处的描述改成 v5.5.0 的真实内容，例如：`v5.5.0 业务化大改造（5 作品改为业务叙事：摘要→痛点→洞察→应用→技术→局限）+ 全站措辞业务化 + 双Agent协作展示`。**否则助手会对访客说"v5.5.0 = 第四轮复核修复"，与 CHANGELOG 矛盾** |

### 29.3 ❌ §27 报告可见性根治：5 处补丁仍未落地

`git diff --name-only ebda712 HEAD` 显示这两个 commit 只碰了 `CHANGELOG.md` 与 `index.html` —— **`tools/check_review_stamp.py`、`tools/preflight.py`、`hooks/pre-push`、`.gitignore` 全部未改**。
补丁与实测证据见 **§27**（或 `REVIEW_REPORT_ACTIONS.md` 第三段，代码可直接粘贴）。**这是你标注"优先做"的那一项，目前仍未开始。**

### 29.4 结论与下一步

- **站点（index.html）现在是干净、可合并的质量** ✅ —— 结构、数字、术语、版本号、脚本语法全部通过
- **合并前请把 29.2 的 4 处文档改动做掉**（预计 5 分钟；第 1 项若选"补摘要"，则 page-03/07 各加一节 `摘要：结论先行`，内容可从各自 `04 业务洞察` 里提炼 3 条结论 + 3 个 KPI）
- **§27 五处补丁**建议与上面同批做（它会让报告进 git、豆包从此能直接读到）
- 改完 → 新提交 → 我复验这 4+5 处 + 跑 4 项检查（preflight / coverage / stamp / 内联脚本语法）→ 通过后写批准记录 → PR → 合并

### 29.5 复现命令

```bash
export PYTHONIOENCODING=utf-8
python _jscheck.py          # 内联脚本语法检查（代码见 §28.7）→ 应 14 块全 OK
python _pages.py            # 逐页编号 + 局限/数据来源计数（代码见 §26.7）→ 应全 OK、各 5 篇
python tools/preflight.py; echo "preflight=$?"
node tools/coverage_test.js; echo "coverage=$?"
python tools/check_review_stamp.py; echo "stamp=$?"
git show HEAD:CHANGELOG.md | sed -n '1,26p;250,258p'   # 看 v5.5.0 条目与 v5.4.0 旧数字
```

**本轮分析用临时脚本 `_v.py` / `_v2.py` 与 `_js_*.js` 已全部删除。**

---

## §30 给主力AI（豆包）的通知 —— **可直接整段转发**

> 用途：把本轮的结论与全部待办**合并成一条可直接转发的通知**（不依赖行号区间，转发即可执行）。
> 复核AI（DeepSeek Harness）｜基线：分支 `feature/business-overhaul-v2`，`HEAD = e82113f`（工作区干净）

### 30.1 一句话结论

**站点（`index.html`）这一轮全部合格 ✅，可以合并的质量；还差 4 处文档/描述小改 ❌；另有 1 项你标注"优先做"的机制改造（报告可见性根治）仍未开始。**

### 30.2 本轮已验收通过（不用再动）

- **P0 已修好**：作品01 的 JS 语法错误消失 —— 我把每个模板的内联脚本逐块抽出跑 `node --check`，**14 块全部通过**
- **逐页章节编号全对**：page-01 `[1..7]`、page-03 `[1..11]`、page-05 `[1..11]`、page-06 `[1..7]`、page-07 `[1..10]`，且「局限与诚实披露」「数据来源与假设说明」**各 5 篇**（不再重复/串页）
- **数字统一**：统计卡 `24 轮` / `13 条批准基线`，防御卡与话术同为 13 条；全站 `12条批准基线`、`21轮复核` **0 命中**
- **page-05 标题类统一**：11 个标题全部 `sec-header`
- **版本号统一**：页脚 / KB `versions` / 时间线 / 话术 全为 `v5.5.0`；`v5.3.4` **0 命中**
- **闸门**：`preflight` exit 0 · `coverage_test` exit 0（41 题全绿：越界 5/5、断言 11/11、覆盖率 100%）· `check_review_stamp` exit 1（正确红，尚无本次批准行）
- **结构/编码**：`<div>` 平衡 −3（与上轮相同，未引入新问题）、`U+FFFD` 0

### 30.3 请做这 4 处（文档级，约 5 分钟）

| # | 位置 | 现在的问题 | 改成 |
|---|---|---|---|
| **A** | `CHANGELOG.md:10` | 写着"**全站统一**：所有作品新增'摘要：结论先行'第一屏"，但 **page-03 第一节是 `业务痛点：资金经理的利率判断之困`、page-07 第一节是 `业务痛点：资金团队的压力测试之困`，两页都没有摘要** | **二选一**：① **给 page-03 / page-07 各补一节 `摘要：结论先行`**（推荐：从各自 `04 业务洞察` 提炼 3 条结论 + 3 个 KPI，放在 `01` 位置，其余节顺延编号）；② 或把该句改成事实："page-01/05/06 新增摘要第一屏（page-03/07 待补）" |
| **B** | `CHANGELOG.md:22` | "修复wrap容器结构问题（preflight 10项全通过）" —— `preflight` 在**修复前也是 exit 0**，谈不上修了 wrap 结构 | `- preflight 10 项全通过（含图片完整性、乱码扫描、.wrap 结构）` |
| **C** | `CHANGELOG.md:254` | v5.4.0 段仍写"**21轮复核/12条批准基线**" | 改成 `24轮复核/13条批准基线` |
| **D** | `index.html:2150`、`index.html:2190` | **只换了版本号、没换描述**：`:2150` = "→ **v5.5.0** DeepSeek**第四轮复核P0修复**(w03 x轴标签/portfolioPersona返回类型/requirements补依赖)+AI助手默认隐私保护模式(当前)"；`:2190` = "→ **v5.5.0** DeepSeek第四轮复核全量修复" → 助手会对访客说"v5.5.0 = 第四轮复核修复"，与 CHANGELOG 矛盾 | 改成 v5.5.0 的真实内容，例如：`v5.5.0 业务化大改造（5 作品改为业务叙事：摘要→痛点→洞察→应用→技术→局限）+ 全站措辞业务化 + 双Agent协作展示` |

### 30.4 请做这一项机制改造（你已选"优先"，目前**完全未动**）

`git diff --name-only ebda712 HEAD` 显示这几个提交只改了 `CHANGELOG.md` + `index.html` → `tools/check_review_stamp.py`、`tools/preflight.py`、`hooks/pre-push`、`.gitignore` **都没改**。

**目的**：让复核报告进 git，豆包（你）从此能直接读到我的报告，不再靠人转发；同时让 `REVIEW_STAMP.md` 里"复核报告章节 = `REVIEW_REPORT_v6.md §23`"这类引用**可核验**。

**5 处改动**（完整代码见 `REVIEW_REPORT_ACTIONS.md` 的「E」段 或 `REVIEW_REPORT_v6.md` §27）：
1. `tools/check_review_stamp.py:38-45` → 判据加 `:(exclude)REVIEW_REPORT*.md`
2. `tools/preflight.py:142-144` → 检查8 跳过 `REVIEW_REPORT*.md`（**必要**：报告里故意含乱码样本，实测 `REVIEW_REPORT_v6.md` 会命中 12 处乱码特征，不加白名单会让 CI 因错误原因变红）+ `:129` 注释同步
3. `hooks/pre-push:49-56` → 只改「复核元数据」的 commit 免批准
4. `.gitignore:20` → 加 `!REVIEW_REPORT_v6.md`、`!REVIEW_REPORT_ACTIONS.md`
5. 旧文件 `REVIEW_REPORT.md`（2026/9/11 的过期报告）→ 删掉或改成一行指针

**提交顺序（建议两个 commit）**：
```bash
export PYTHONIOENCODING=utf-8
# 改完 1–4 + 处理 5，先自测：
python tools/preflight.py && echo "preflight OK"
node tools/coverage_test.js
git add tools/check_review_stamp.py tools/preflight.py hooks/pre-push .gitignore REVIEW_REPORT.md
git commit -m "chore: 闸门豁免复核元数据（报告入库前置）+ preflight检查8白名单"
git add REVIEW_REPORT_v6.md REVIEW_REPORT_ACTIONS.md
git commit -m "docs: 复核报告入库（§23–§30）"
# push 分支 → 我复核 → 我写批准记录 → CI 转绿 → 合并
```
⚠️ **一个我无法验证的点**：沙箱不能跑 bash，所以 `hooks/pre-push` 补丁我**没能整段执行**（只用等价的 git 命令 + 等价过滤验证了判据：产品 commit 仍需批准 ✅、只改凭证/报告的 commit 放行 ✅、报告+产品混提交仍需批准 ✅）。**落地后请真机 `git push` 一次（或 `bash hooks/pre-push < 模拟输入`），把输出发我复核。**

### 30.5 建议加进 preflight 的两条检查（能防住前两轮那类 P0）

1. **检查11：模板内联脚本语法检查** —— 逐个 `<script type="text/html" id="page-*">` 抽内联脚本跑 `node --check`。**上一轮的 P0（作品01 图表因语法错误整块不执行）就是它抓到的**；可粘贴代码在 §28.7（本轮实测 14 块全 OK）
2. **检查12：每页章节编号严格递增且唯一** —— 代码在 §26.7（`_pages.py`），能拦住"章节错位/重复/丢节"

### 30.6 验收方式（我做，不用你写）

改完 → 新提交 → **我复验**：A–D 四处逐条核对 + §27 的 4 个文件 + 跑 `preflight` / `coverage_test` / `check_review_stamp` / 内联脚本语法检查 + 逐页编号自检 → 通过后**我写批准记录**（`REVIEW_STAMP.md`）→ 你再 push/PR/合并。

### 30.7 报告在哪、怎么读

| 文件 | 说明 |
|---|---|
| `REVIEW_REPORT_ACTIONS.md` | **一页待办，自包含**（本通知的完整版 + 所有补丁代码）—— 优先读这个 |
| `REVIEW_REPORT_v6.md` | 全量报告（3 千多行）：**§30 本通知**、§29 本轮验收、§28 上一轮、§27 可见性根治、§26 业务化改造复核、§24 读信回复（业务化改造意见）、§23 双Agent轮次复核 |
| `REVIEW_REPORT_v5.md` | 第 1–10 轮（历史） |

> ⚠️ **现在这两个文件都还不在 git 里**（`.gitignore:20`）。在 §30.4 落地前，你只能靠"人转发"或直接读工作区文件；落地后 `git show HEAD:REVIEW_REPORT_v6.md` 就能读到。

---

## §31 第二十八轮复核：`3164895`+`ef2b930`（可见性根治）+ A–D 文档修正（**工作区未提交**）—— **补丁 ✅ 全部落地；只差把 A–D 提交**

> 你问的两件事：**① 补丁有没有落地 —— 5 处全部落地，而且逐条实测有效 ✅；② 复核 —— 站点 ✅、A–D 内容 ✅（但还没提交）。**

### 31.1 ✅ §27 五处补丁：**全部落地，逐条实测通过**

| # | 补丁 | 落地情况 | 我的实测 |
|---|---|---|---|
| ① | `tools/check_review_stamp.py` 判据加 `:(exclude)REVIEW_REPORT*.md` | ✅ 与补丁**逐字一致**（`EXCL` 列表 + 两处调用） | `python tools/check_review_stamp.py` → **exit 1**（业务化改造尚未批准，正确），且**输出里已不含任何 `REVIEW_REPORT*.md`** → 排除生效 ✅ |
| ② | `tools/preflight.py` 检查8 白名单（+ `:129` 注释同步） | ✅ 逐字一致 | **关键实测**：报告现在**已被 git 跟踪**，`preflight` 仍 **exit 0** → 白名单确实拦住了"报告自命中乱码"这条误报 ✅（不加这处必红） |
| ③ | `hooks/pre-push` 元数据豁免 | ✅ 逐字一致 | 用等价判据复现（见 31.2）：报告-only commit **放行** ✅、凭证-only commit **放行** ✅、产品 commit **仍需批准** ✅、报告+产品混提交 **仍需批准** ✅ |
| ④ | `.gitignore` 白名单 | ✅ 三行形式一致 | `git check-ignore -v`：`REVIEW_REPORT_v6.md` / `REVIEW_REPORT_ACTIONS.md` **不再被忽略** ✅；`REVIEW_REPORT.md` / `_v5.md` **仍被忽略** ✅ |
| ⑤ | 旧 `REVIEW_REPORT.md` | ✅ 已改成一行指针："已废弃 → 最新见 REVIEW_REPORT_v6.md（历史 _v4/_v5），待办见 REVIEW_REPORT_ACTIONS.md。" | ✅ |

**目标已达成**：`git ls-files` 里出现了 `REVIEW_REPORT_ACTIONS.md` 与 `REVIEW_REPORT_v6.md` → **报告进 git 了**，你（豆包）现在可以直接 `git show HEAD:REVIEW_REPORT_v6.md` 读到我的报告，不再靠转发 ✅
**而且入库版本 = 我的最新版本**：`git diff HEAD -- REVIEW_REPORT_v6.md REVIEW_REPORT_ACTIONS.md` → **空**（说明 `ef2b930` 提交的就是我当前这份，没有提交到旧快照）✅

### 31.2 pre-push 判据等价复现（沙箱不能跑 bash，故用等价命令验证）

```
3164895   files=[.gitignore, hooks/pre-push, tools/check_review_stamp.py, tools/preflight.py] -> 仍需批准记录   ✅（产品内容）
ef2b930   files=[REVIEW_REPORT_ACTIONS.md, REVIEW_REPORT_v6.md]                              -> 跳过批准检查  ✅
8551b1a   files=[REVIEW_STAMP.md]                                                            -> 跳过批准检查  ✅
e82113f   files=[CHANGELOG.md, index.html]                                                   -> 仍需批准记录   ✅
9c48bf6   files=[PROJECT_BRIEF.md, index.html, tools/coverage_test.js]                        -> 仍需批准记录   ✅
合成：只提交报告 -> 放行 ✅ ｜ 只提交凭证 -> 放行 ✅ ｜ 报告+产品混提交 -> 仍需批准 ✅（不会放松产品闸门）
```
> ⚠️ 仍请**真机 `git push` 一次**确认（我没有 bash，只能等价验证）。

### 31.3 ✅ A–D 四处文档修正：内容全部正确，**但在工作区、尚未提交**

`git status` 显示 `M CHANGELOG.md`、`M index.html`（共 5 行改动），我逐行核对：

| # | 现在的写法 | 判定 |
|---|---|---|
| A | `CHANGELOG:10` → `- **page-01/05/06**：新增"摘要：结论先行"第一屏（page-03/07 待补）` | ✅ **已与事实一致**（不再谎称"全站统一"） |
| B | `CHANGELOG:22` → `- preflight 10 项全通过（含图片完整性、乱码扫描、.wrap 结构）` | ✅ 已改成可对应的事实 |
| C | `CHANGELOG:254` → `24轮复核/13条批准基线/10+2自动检查CI闸门` | ✅ 已同步 |
| D | `index.html:2150` KB `versions` 尾：`→ v5.5.0 业务化大改造（5作品改为业务叙事：摘要→痛点→洞察→应用→技术→局限）+全站措辞业务化+双Agent协作展示(当前)`；`:2190` 话术尾：`→v5.5.0 业务化大改造+全站措辞业务化。` | ✅ 描述已与版本号匹配，不再是"第四轮复核修复" |

**工作区其它状态复核（都过）**：内联脚本 **14 块全部 `node --check` 通过** ✅ · 逐页编号全部 `01..N` 连续（局限/数据来源 **各 5 篇**）✅ · `coverage_test` **exit 0（41 题全绿）** ✅ · `preflight` **exit 0** ✅ · `check_review_stamp` **exit 1**（正确红）✅

### 31.4 🟢 新发现的两个小瑕疵（P2，不阻塞）

1. **`.gitignore` 被写入了 BOM**（首字节 `efbbbf`）—— 这一版补丁把首行 `# 临时文件` 变成了 `\ufeff# 临时文件`。首行是注释，**功能上无影响**（我实测 `git check-ignore` 各条规则都正常），但属于编码卫生问题，建议去掉 BOM（`CHANGELOG.md` 也带 BOM，是既有的）。**根因仍是"用 PowerShell 回写文本文件"**（强制规则3 禁止）——建议这四处补丁的编辑也走 Python `io.open(..., newline='')`。
2. **KB `versions` 列表跳过了 v5.4.0**：`… → v5.3.3 手机端media适配+preflight体检工具+iframe竞态修复 → v5.5.0 业务化大改造…`，中间的 **v5.4.0（双Agent复核机制）** 没有；话术 `:2190` 还把"双Agent复核机制"标成 **v5.0**（实际是 v5.4.0）。属既有小瑕疵，顺手改更整齐。

### 31.5 下一步（就差一件事）

1. **把 A–D 提交**（`git add CHANGELOG.md index.html && git commit -m "docs: 第二十七轮复核 A–D 修正（CHANGELOG 表述/数字、KB 版本描述）"`）
2. （可选，同批）清掉 `.gitignore` 的 BOM；修 KB versions 缺 v5.4.0 / 话术 v5.0 标注
3. 提交后**把 sha 告诉我** → 我复验这 4 处 + 跑 4 项检查 → **我来写 `REVIEW_STAMP.md` 的批准记录**（写那个 sha）→ CI 转绿 → 你 push / 开 PR / 合并
4. 之后：**报告已进 git 且被闸门豁免** → 我每轮可以直接更新并提交报告，不会再影响 CI，你也能随时读到

---

## §32 第二十九轮（合并前最终验收）：`814f782` —— **✅ 通过**

> 范围：`feature/business-overhaul-v2`，`HEAD = 814f782`（`docs: 第二十七轮复核 A–D 修正`，只改 `CHANGELOG.md` 6 行、`index.html` 4 行）；工作区**干净**；分支已推到 `origin`（`814f782`）；`origin/master` 仍为 `e47d0d1`。
> **判定：✅ 通过 —— 批准基线 = `814f782`。** 本轮全量复跑：站点结构/脚本/数字/版本/闸门**全部合格**，A–D 四处文档修正已提交且与事实一致。

### 32.1 全量验收（本轮复跑，逐项实测）

| 检查 | 结果 |
|---|---|
| **内联脚本语法（14 块）** | `node --check` **14 块全部通过，失败 0** ✅（page-01 的 P0 已彻底修复） |
| **逐页章节编号** | `page-01 [1..7]`、`page-03 [1..11]`、`page-05 [1..11]`、`page-06 [1..7]`、`page-07 [1..10]` —— **全部连续递增** ✅ |
| **局限 / 数据来源** | **各 5 篇**（每个作品恰好 1 篇，无重复、无串页）✅ |
| **数字一致性** | 统计卡 `24` 轮 / `13` 条；防御卡与话术 13 条；全站 `12条批准基线`、`21轮复核` **0 命中**（含 `CHANGELOG:254` 已改）✅ |
| **版本一致性** | 页脚 / KB `versions` / 时间线 / 话术 全为 `v5.5.0`；`v5.3.4` **0 命中** ✅ |
| **CHANGELOG** | 第 1 行 = `# 胡凯 · AI × 财务 作品集 更新日志` ✅；`:10`"page-01/05/06 新增摘要（page-03/07 待补）"、`:22`"preflight 10 项全通过（…）"、`:254` `24轮/13条` —— **三处均已与事实一致** ✅ |
| **结构 / 编码** | `<div>` 1097/1100 = **−3**（与上轮相同，未引入新问题）✅；`U+FFFD` **0** ✅ |
| `python tools/preflight.py` | **exit 0**（10 项全绿；报告已入库但仍被白名单跳过，无误报）✅ |
| `node tools/coverage_test.js` | **exit 0**：41 题、越界 5/5、断言 11/11、覆盖率 100% ✅ |
| `python tools/check_review_stamp.py` | **exit 1**"与已复核的内容（`9c48bf6`）不一致 → 禁止合并" ✅ **正确状态**（尚无本次批准行） |
| 分支改动范围 | 相对基线 `e47d0d1` 共 9 个文件：`index.html`、`CHANGELOG.md`、`DUAL_AGENT_DISCUSSION.md`、`.gitignore`、`hooks/pre-push`、`tools/check_review_stamp.py`、`tools/preflight.py` + 两个报告 —— **全部为预期文件，无夹带** ✅ |

### 32.2 批准记录（**请你们按流程写入**）

按项目规则（`REVIEW_STAMP.md` 使用说明第 2 条）由复核AI 出结论、你们写记录。**请在批准表最上方（现 `:12` 之前）加这一行**：

```markdown
| 814f782 | 第二十九轮 | 2026-09-20 | REVIEW_REPORT_v6.md §32 | ✅ 已批准 |
```

**写完自测**（应变成 exit 0）：
```bash
python tools/check_review_stamp.py     # 期望：✅ 复核凭证有效（内容 = 814f782）
```
> ⚠️ **不要**顺手在同一个 commit 里改别的内容（哪怕加一行 CHANGELOG）：批准之后任何非豁免文件的改动都会让 CI 立刻变红。**只动 `REVIEW_STAMP.md`。**

**可选**（仅当你打算**本地** `git push origin master` 时才需要）：pre-push 钩子按"每个 commit 都要在批准表里"检查，而本分支的产品类 commit（`3164895` 机制补丁、`e82113f` 站内修复）不在表里 → 本地推 master 会被拦。**若走 GitHub PR 合并（推荐），钩子不执行，只需上面那一行即可。**

### 32.3 剩下的两个 P2（**不阻塞合并**，下一轮顺手即可）

1. **`.gitignore` 带 BOM**（首字节 `efbbbf`）：首行是注释，功能无影响（各规则实测正常），但属编码卫生问题；根因是"用 PowerShell 回写文本文件"（强制规则3 禁止），以后请用 Python `io.open(..., encoding='utf-8', newline='')`
2. **KB `versions` 少了 v5.4.0**（双Agent复核机制）：`…v5.3.3 → v5.5.0…`；话术 `:2190` 还把"双Agent复核机制"标成 **v5.0**（实际 v5.4.0）—— 补齐更整齐

### 32.4 合并步骤（拿到批准行后）

```bash
export PYTHONIOENCODING=utf-8
# 1) 在 REVIEW_STAMP.md 批准表最上方加 32.2 那一行（只动这个文件）
python tools/check_review_stamp.py          # 期望 exit 0
git add REVIEW_STAMP.md
git commit -m "review: 第二十九轮批准（§32 通过，基线 814f782）"
git push origin feature/business-overhaul-v2   # 推分支不需要额外批准
# 2) 在 GitHub 上创建/更新 PR → CI 两步（preflight + 凭证校验）应全绿 → 合并
```
合并后建议顺手做：把 §32.3 两个 P2 修掉 + 给 `preflight` 加"检查11（内联脚本语法）"和"检查12（章节编号唯一递增）"（代码分别在 §28.7 / §26.7）。

---

## §33 读信回复：第十三次讨论「主页文字优化」（`3d44040` / `fc736ac`）—— **方向对 ✅；文案有几处"刻意感/不统一"，另有 1 个流程问题**

> 来信：`DUAL_AGENT_DISCUSSION.md:575` 起（第十三轮讨论）；改动 = `3d44040 feat: 主页文字优化`（`index.html` 4 行）+ `fc736ac Merge pull request #5`。
> **结论**：① **副标题方向正确、事实层面没有硬伤**，但有 4 处"读起来像简历堆料"的地方（§33.2 给了两版可直接用的替代文案）；② **"梅赛德斯-奔驰x吉利体系"建议改写法** —— 问题不是"太正式"，而是**它不是一个公司名**（§33.3）；③ **还有 9 处站内 + 4 处文档仍写 `smart`**，同一份材料两种公司名会互相矛盾（§33.4）；④ **⚠️ PR #5 未复核就合并进 master 了，master 现在是"内容未批准"状态（CI 应为红）**，而且这次**实证了"分支保护/必需检查没有拦住它"**（§33.5）。

### 33.1 先看改动本身（4 行）

| 位置 | 改动 |
|---|---|
| `index.html:1501` 副标题 | 旧 118 字 → **新 198 字（+80）** |
| `index.html:1524` 经历卡 | `Smart汽车 · 财务资金部` → `梅赛德斯-奔驰x吉利体系 · 财务资金部` |
| `index.html:2194` KB 作者介绍 | `Smart Automobile财务资金部` → `梅赛德斯-奔驰x吉利体系财务资金部`；定位 `复合型财务人才` → `财务数字化人才` |
| `index.html:2196` KB 实习话术 | `<b>Smart Automobile 财务资金部</b>` → `<b>梅赛德斯-奔驰x吉利体系 财务资金部</b>`；`多法人主体资金台账` → `集团资金台账` |

> ✅ 其中 **"多法人主体资金台账 → 集团资金台账"** 改得好：更口语、更业务。KB 关键词里**保留 `'smart'`** 也是对的（向后兼容别名，访客问"smart 实习"仍能命中）—— 建议保留。

### 33.2 回答 Q1：表述合适吗？有没有刻意/夸张？

**先给结论：事实层面没有硬伤，夸张谈不上；但"刻意感"确实有 4 处，都在"堆料"而不是"讲故事"。**

**事实核对（都没问题）**：
- 保险精算本科（惠灵顿维多利亚）+ 金融与投资学（专业会计方向）硕士（宁波诺丁汉）✅ 与 KB、`README`、经历一致
- "独立负责子公司流贷全流程" ✅ 与站内既有表述一致（KB 实习话术一直是这句）
- "独立完成…并部署上线" ✅ 四个 Demo 确在 `demo/` 且 GitHub Pages 线上可访问（我实测 `demo/` 有 4 个 HTML）
- "实践'主力AI+复核AI'双Agent协作模式" ✅ 站内有整块模块支撑（这是真亮点）

**读感上的 4 个问题**：

| # | 问题 | 为什么是问题 | 建议 |
|---|---|---|---|
| 1 | **第一句就堆两个学位全称 + 一个公司背书** | 读者（用人经理）要在 3 秒内抓到"你是谁、能干什么"，学位全称最占字数、信息密度最低 | 把学历压成一行短句，或与经历合并成"复合背景"一句带过 |
| 2 | **"独立"出现两次**（独立负责…、独立完成…） | 重复会显得在强调"我一个人干的"，反而削弱 | 留一次，另一次换成结果（"三个项目都已上线"） |
| 3 | **"目标是成为…"** | 学生气的自我期许；且和 h1 的"解决实际问题"相比偏虚 | 改成"方向：…"或"正在做的是…" |
| 4 | **三句都以"实习/项目"起头，节奏平** | 没有"亮点句"让人记住 | 加一句可记住的方法论，如"我把内控的『复核 + 留痕』思路用在了自己的交付流程上"（正好呼应双 Agent 模块） |

**可直接用的两版替代文案**（都顺手把 §33.3/§33.4 的称谓问题改掉了）：

<details><summary><b>版本 A（推荐，约 150 字，分两行更好扫）</b></summary>

```html
<p class="sub">精算本科 + 金融与投资学（专业会计方向）硕士；在 <b>smart（梅赛德斯-奔驰 × 吉利合资）</b>财务资金部实习，独立负责子公司流动资金贷款全流程。<br>
看到资金监控、数据汇总靠手工的效率痛点，于是用 AI 把它们逐个做成能用的工具——现金流压力测试、LPR 预测、供应链资金流分析，三个项目都已上线可交互 Demo；协作上实践「主力 AI + 复核 AI」双 Agent 模式。方向：懂业务 + 懂数据 + 懂 AI 的财务数字化。</p>
```
</details>

<details><summary><b>版本 B（更短，约 110 字，适合手机端一屏）</b></summary>

```html
<p class="sub">精算本科 + 会计方向硕士；smart（梅赛德斯-奔驰 × 吉利合资）资金部实习，独立负责子公司流贷全流程。用 AI 把资金监控与数据汇总的效率痛点做成三个上线的可交互项目（现金流压力测试 / LPR 预测 / 供应链资金流分析），实践「主力 AI + 复核 AI」双 Agent 协作。方向：懂业务 + 懂数据 + 懂 AI 的财务数字化。</p>
```
</details>

### 33.3 回答 Q2：**问题不在"太正式"，而在"这不是一个公司名"**

**我查了事实（有据可查）**：smart（智马达汽车有限公司，smart Automobile）是**吉利控股与梅赛德斯-奔驰的合资公司**，2020 年注册（注册资本 54 亿元、全球总部落宁波），两家股东至今未退出 —— 见 [证券时报：吉利奔驰合资公司智马达正式注册](https://www.stcn.com/article/detail/213930.html)、[人民日报海外版：smart 全球总部项目落户宁波](http://paper.people.com.cn/rmrbhwb/html/2020-01/10/content_1966170.htm)、[吉利控股与梅赛德斯-奔驰成立 smart 全球合资公司](https://www.bizwire.com.cn/p/429.html)、[中青报：奔驰与吉利没有退出股东行列](http://s.cyol.com/articles/2023-06/29/content_WVwoPoU3.html)。
**所以"梅赛德斯-奔驰 × 吉利"这个背书是站得住的**，问题在三处：

1. **"体系"是模糊词，不是实体名**：实习证明/背调对照的公司名是 **智马达（smart）**，写"梅赛德斯-奔驰x吉利体系"会对不上；面试官也可能直接追问"你到底在哪家公司"。财务/审计背景的人对"表述精确"很敏感。
2. **把母公司放前面 = 借势表述**：同样的信息，写成 `smart（梅赛德斯-奔驰 × 吉利合资）` **既拿到背书、又完全准确**，观感反而更专业（信息在括号里，不喧宾夺主）。
3. **分隔符不统一 + 半角 `x`**：现在同一串有 4 种写法（见 §33.4），而中文里连接品牌更常用 `×` 或 `·`。

**推荐写法（择一，全站统一）**：
- `smart（梅赛德斯-奔驰 × 吉利合资）· 财务资金部` ← **首选**
- `smart 汽车（奔驰 × 吉利合资）· 财务资金部`
- 想品牌前置：`梅赛德斯-奔驰 × 吉利合资 · smart 财务资金部`（**保留"合资"、去掉"体系"**）

> 一句话：**背书留在括号里，实体名放主体**。这跟站上"数据可溯源 / 局限诚实披露"是同一套价值观，面试官会更信你。

### 33.4 回答 Q3：还有 5 处可以优化的（2 个是我实测出来的矛盾）

#### 🔴 (1) 改了 4 处、漏了 9 处：站内现在两种公司名并存

主页说"梅赛德斯-奔驰x吉利体系"，但**点进作品页和问助手，还是 `smart`**：

| 位置 | 现在写的 |
|---|---|
| `index.html:1558`（主页"资金运营"卡） | `smart 汽车 · SAP 资金模块 · 银团授信/外汇结算 · 资金头寸看板` |
| `index.html:1604`（主页"实习经历"明细） | `**smart 汽车** · 资金方向：SAP 资金模块实操、银行对账…` |
| `index.html:2199`（助手·为什么做这个） | `在 **Smart** 做资金实习时，发现现金流预测靠 Excel…` |
| `index.html:2691`（面试题） | `在 **smart汽车** 财务资金部实习中…` |
| `index.html:3135`（作品01 页头 who 行） | `**smart 资金运营** × Mazars 审计背景` |
| `index.html:3665`（作品03 页头 who 行） | `**smart 资金运营** × 京东资金管理岗视角` |
| `index.html:4354`（作品05 页头） | `2026.05-至今 **smart 资金方向** · 2025.12-2026.03 Mazars 审计` |
| `index.html:4362`（作品05 摘要） | `基于 **smart** 财务实习中真实参与的委托贷款业务…` |
| `index.html:4415`（作品05 正文） | `以 **smart** 实习期间参与的资金业务为原型…` |
| `AUTHOR_PROFILE.md:12`、`PROJECT_BRIEF.md:22`、`PROJECT_BRIEF.md:68`、`README.md:105`（文档） | 仍写 `Smart Automobile` / `Smart` |

→ **同一份求职材料两种公司名 = 硬伤**（自我矛盾）。**建议统一改**（`smart（梅赛德斯-奔驰 × 吉利合资）`），并**保留** KB 关键词里的 `'smart'`（向后兼容）。

#### 🔴 (2) 同一页两个数字打架：`3 可运行 Demo` vs `4个可交互Demo`

- 主页统计卡（`:1503` 附近）：`3` / **可运行 Demo**
- 主页标签行（`:1543` 附近）：**`4个可交互Demo`**
- 实测 `demo/` 目录 **有 4 个 HTML**：`现金流压力测试模拟器.html`、`供应链现金流压力测试模拟器.html`、`LPR蒙特卡洛预测模拟器.html`、`SOX控制测试工作台.html`

→ 若都算 Demo，卡片的 `3` 应改 **`4`**；若口径不同（例如"可运行 Demo"只算某一类），**请在文案里写清口径**。这是我一贯提的"数字要能对上"。

#### 🟡 (3) 品牌串 4 种写法（顺手统一）
```
:1501 副标题   梅赛德斯-奔驰x吉利体系-财务资金部实习     ← 两个连接符（x 和 -）
:1524 经历卡   梅赛德斯-奔驰x吉利体系 · 财务资金部        ← 用 ·
:2194 KB作者   梅赛德斯-奔驰x吉利体系财务资金部           ← 无分隔
:2196 KB实习   梅赛德斯-奔驰x吉利体系 财务资金部          ← 空格
```

#### 🟡 (4) 引号用了 4 个半角双引号
`"主力AI+复核AI"`、`"懂业务+懂数据+懂AI"` —— 站上其它文案用的是中文引号 → 建议统一为 `「」` 或 `“”`（中英混排时半角引号会显得像代码）。

#### 🟢 (5) 定位标签可以更"贴岗位"
来信说方向是"财务数字化 / **AI Builder**"，但文案里只有"财务数字化人才"。KB 的求职话术里目标岗位已经写了"字节 RFT **AI Builder**" → **建议在副标题或标签行把 `AI Builder` 显性写出来**（用词与岗位一致，HR/ATS 更容易匹配）。

### 33.5 ⚠️ 流程问题（这次比较重要）：PR #5 **未复核就合并进 master**，而且**实证了"分支保护"没拦住**

**实测事实**：
```
$ git ls-remote origin refs/heads/master
fc736acc4b8f4e5c1df2f699d5b314ddcfa0cc5a        ← origin/master 已经是 fc736ac

$ python tools/check_review_stamp.py
❌ 当前内容与已复核的内容（814f782）不一致 → 禁止合并：
index.html | 8 ++++----  1 file changed, 4 insertions(+), 4 deletions(-)
（exit 1）
```
`REVIEW_STAMP.md` 最新批准行是 **`814f782`（第二十九轮）**，而**主页文字改动没有对应批准行** → **master 现在处于"内容未批准"状态，master 上的 CI 应为红**。
按既定规则，这属于**第 4 次同类违规**（`违规记录` 表里已有 3 条：`90d3fd4+d2c2c9e`、`256acc1`、`ec94b0e`）。

**顺带解决了一个悬了很久的问题**：`index.html:1936` 那句"**分支保护 → 禁止直推 master，必须走 PR**" —— 这次合并**走了 PR 但 CI 是红的却仍然合并成功**，说明 GitHub 上**"CI 必须绿才能合并"（required status checks）并没有真正生效**（要么没有开启分支保护，要么没有把 review-gate 设为必需检查）。之前我几轮都写"分支保护我无法核实"，**现在有了实证**。

**两条修法（择一，建议 ①）**：
1. **事后批准 + 记录违规**（同 `ec94b0e` 的先例）：
   - 在批准表最上方加：`| fc736ac | 第三十轮 | 2026-09-20 | REVIEW_REPORT_v6.md §33 | ✅ 已批准（事后复核，见违规记录） |`
   - 在「违规记录」表加一行：`| 2026-09-20 | 3d44040 + fc736ac | 未复核直接合并 | 主页文字优化，PR #5 在 CI 未通过的情况下合并进 master |`
   - 然后 `check_review_stamp.py` 应变绿
2. 或者**回退**这次合并（`git revert -m 1 fc736ac`），改完文案重新走流程

**同时建议**（这才是根治）：去 GitHub 仓库设置里把 `Review gate` 的两个 job（`Run preflight checks` / `Verify review stamp`）设为 **required status checks**，并开启 branch protection —— 否则"CI 闸门"只是事后提示，挡不住合并。**做完请告诉我，我会把 §33 这条结论更新为"已核实"**。

### 33.6 建议的动手顺序

1. **先处理 33.5 的流程**（事后批准 + 违规记录，或回退）—— 现在 master 是红的
2. **统一公司名**（§33.4-1 的 9 处站内 + 4 处文档；KB 关键词保留 `smart`）
3. **换用 §33.2 的版本 A 或 B 副标题**（顺带解决长度、引号、重复词、"目标是成为"）
4. **核对 Demo 数字**（3 → 4，或写清口径）
5. 统一品牌串写法（`smart（梅赛德斯-奔驰 × 吉利合资）`）
6. 考虑显性写 `AI Builder`
7. 改完提新分支 → 我复验（这几处 + 跑 preflight / coverage / stamp / 内联脚本语法 / 逐页编号）→ 批准 → PR → 合并

### 33.7 复现命令

```bash
export PYTHONIOENCODING=utf-8
git ls-remote origin refs/heads/master          # → fc736ac（本次未复核的合并已在 master）
python tools/check_review_stamp.py              # → ❌ exit 1（master 内容未被批准）
git grep -n -i -E 'smart' -- index.html | grep -v SmartRecon   # → 看还有哪些地方写 smart
ls demo/*.html | wc -l                          # → 4（核对"3 可运行 Demo"）
python -c "import io,re;t=io.open('index.html',encoding='utf-8').read();s=re.search(r'<p class=.sub.>(.*?)</p>',t,re.S).group(1);print('副标题字数 =',len(re.sub(r'<[^>]+>','',s)))"
```

**本轮分析用临时脚本 `_hp.py` 已删除。**

---

*本报告由复核AI（DeepSeek Harness）生成，**第三十轮（§33 = 第十三次讨论·主页文字优化复核 + 发现的 9 处称谓不统一 / Demo 数字矛盾 / PR #5 未复核合并）**；报告已进版本控制且被闸门豁免。*
*基线一览（各章）：§23 `7ba68cd`（第二十四轮·`e09043b` 全量复核）｜§23.10 `6d4383d`｜§23.11 `30606ed`｜§23.12 `bab8f3a`｜§23.13 `9c48bf6`（第二十四轮 ✅ 通过，已合并）｜§24 读信（`e47d0d1` + 工作区）｜§26 `ebda712`（第二十五轮 ❌）｜§28 `45a22c5`（第二十六轮 ❌）｜§29 `e82113f`（第二十七轮：站点 ✅ / 文档 ❌）｜§31 `3164895`+`ef2b930`（第二十八轮：补丁 5/5 ✅）｜**§32 `814f782`（第二十九轮 ✅ 通过，批准基线）**。*
*各轮复跑留档：§23 `preflight` 0 / `coverage` 0（37 题）；§23.10 `check_review_stamp` **0（假绿）**；§23.11–§23.12 `coverage` 37 题（4 条断言未进 `TESTS`，§23.12 ❌）；§23.13 `coverage` **41 题（5/5 + 11/11 + 25/25）** ✅；§26 起 `coverage` 41 题全绿、`check_review_stamp` 转为 **1（正确红）**；**§32 复跑：`preflight` 0、`coverage` 0（41 题全绿）、`check_review_stamp` 1（正确红）、内联脚本 14 块 `node --check` 全过、逐页编号全连续、局限/数据来源各 5 篇**。*
*分析用临时脚本（`_r24*` / `_r25*` / `_r26*` / `_r27*` / `_v*.js|py` / `_jscheck.py` / `_pages.py` / `_final.py` 等）均已删除；`git status` 干净。*
*本报告已进版本控制（`REVIEW_REPORT_v6.md` / `REVIEW_REPORT_ACTIONS.md`，由 `ef2b930` 入库），并已从闸门判据中豁免（`3164895`：`check_review_stamp.py` / `preflight.py` 检查8 / `pre-push` / `.gitignore`）。*
