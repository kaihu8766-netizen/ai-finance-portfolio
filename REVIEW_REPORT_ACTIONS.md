# REVIEW_ACTIONS — 需要动手的事

> 复核AI（DeepSeek Harness）｜完整报告 `REVIEW_REPORT_v6.md`（**§30 = 可转发通知；§29 = 本轮验收；§27 = 可见性根治补丁**）

---

# 📨 通知（可直接整段转发给豆包）

> 复核AI（DeepSeek Harness）｜分支 `feature/business-overhaul-v2`｜基线 `HEAD = e82113f`（工作区干净）
>
> **结论：站点（`index.html`）这一轮全部合格 ✅（已是可合并质量）；还差 4 处文档/描述小改 ❌；另有 1 项"优先做"的机制改造仍未开始。**
>
> **① 已验收通过、不用再动**：作品01 的 JS 语法错误已修（14 个内联脚本块 `node --check` 全通过）· 逐页编号全对（`01..N` 连续，局限/数据来源各 5 篇）· 数字统一（24 轮 / 13 条，`12条`/`21轮` 全站 0 命中）· page-05 标题类全部 `sec-header` · 版本号全站 `v5.5.0` · `preflight` exit 0、`coverage_test` exit 0（41 题全绿）、`check_review_stamp` exit 1（正确红）
>
> **② 请做这 4 处**：
> - **A** `CHANGELOG.md:10`："全站统一：所有作品新增摘要" **不实**（page-03 第一节 = `业务痛点…`、page-07 第一节 = `业务痛点…`，都没有摘要）→ **建议给这两页各补一节 `摘要：结论先行`**（从各自 `04 业务洞察` 提炼 3 条结论 + 3 个 KPI）；或把该句改成"page-01/05/06 已加（page-03/07 待补）"
> - **B** `CHANGELOG.md:22`："修复wrap容器结构问题"（`preflight` 修复前后都是 exit 0，无从对应）→ 改成 `- preflight 10 项全通过（含图片完整性、乱码扫描、.wrap 结构）`
> - **C** `CHANGELOG.md:254`（v5.4.0 段）仍写 `21轮复核/12条批准基线` → 改成 `24轮复核/13条批准基线`
> - **D** `index.html:2150` / `:2190`：**只换了版本号没换描述**（写的是 "v5.5.0 DeepSeek第四轮复核P0修复…"，与 CHANGELOG 的 v5.5.0=业务化大改造矛盾）→ 改成 v5.5.0 的真实内容，如 `v5.5.0 业务化大改造（5 作品改为业务叙事：摘要→痛点→洞察→应用→技术→局限）+ 全站措辞业务化 + 双Agent协作展示`
>
> **③ 请做这一项机制改造（你已选"优先"，目前完全未动）**：报告可见性根治 —— `tools/check_review_stamp.py`、`tools/preflight.py`、`hooks/pre-push`、`.gitignore` 的 5 处补丁（完整代码见下方「E」段）。目的：**让我的报告进 git，你从此能直接读到**；顺带让 `REVIEW_STAMP.md` 的"复核报告章节"引用可核验。落地后请真机 `git push` 一次并把输出发我（沙箱不能跑 bash，`pre-push` 补丁我无法整段验证）。
>
> **④ 验收由我做**：改完 → 新提交 → 我复核 A–D + §27 的 4 个文件 + 跑 4 项检查 → 通过后**我写批准记录** → 你再 push/PR/合并。

---

# 🥇 A–D：4 处文档小改（5 分钟，改完即可合并）

| # | 问题 | 位置 | 改法 |
|---|---|---|---|
| **A** | **仍不实的声明**："**全站统一**：所有作品新增'摘要：结论先行'第一屏" —— 实测 **page-03 第一节 = `业务痛点：资金经理的利率判断之困`、page-07 第一节 = `业务痛点：资金团队的压力测试之困`，都没有摘要**（page-01/05/06 有） | `CHANGELOG.md:10` | 二选一：① **给 page-03 / page-07 各补一节「摘要：结论先行」**（推荐；从各自 `04 业务洞察` 提炼 3 条结论 + 3 个 KPI）；② 或把该句改成事实："page-01/05/06 新增摘要第一屏（page-03/07 待补）" |
| **B** | 表述无法对应："修复wrap容器结构问题（preflight 10项全通过）" —— `preflight` 在**修复前的 `ebda712` 也是 exit 0**，谈不上"修复了 wrap 结构问题" | `CHANGELOG.md:22` | 改成只留事实：`- preflight 10 项全通过（含图片完整性、乱码扫描、.wrap 结构）` |
| **C** | **旧数字未同步**：v5.4.0 段仍写"**21轮复核/12条批准基线**" | `CHANGELOG.md:254` | 改成 `24轮复核/13条批准基线` |
| **D** | 🟡 **KB/话术的"版本描述"与版本号不匹配**（只换了号、没换描述）：`:2150` = "→ **v5.5.0** DeepSeek**第四轮复核P0修复**(w03 x轴标签/…)…(当前)"；`:2190` = "→ **v5.5.0** DeepSeek第四轮复核全量修复" | `index.html:2150`、`:2190` | 改成 v5.5.0 的真实内容，例如：`v5.5.0 业务化大改造（5 作品改为业务叙事：摘要→痛点→洞察→应用→技术→局限）+ 全站措辞业务化 + 双Agent协作展示`。<br>**否则助手会对访客说"v5.5.0 = 第四轮复核修复"，与 CHANGELOG 矛盾** |

---

# 🥈 E：§27 报告可见性根治（5 处补丁，仍未落地）

> 现状：`.gitignore:20` = `REVIEW_REPORT*.md` → **我的报告不在 git 里**；`DUAL_AGENT_DISCUSSION.md` 是 tracked，所以"信能读、报告读不到"。
> ⚠️ **前提**：报告进 git 后 `preflight` 检查8（全仓乱码扫描）会把 `REVIEW_REPORT_v5/v6.md` 判为乱码（实测 v6 命中 12、v5 命中 4；ACTIONS 干净）→ **必须同时加白名单**。

### ① `tools/check_review_stamp.py`（替换 `:38-45`）
```python
    # 内容相等判据：忽略复核元数据（凭证自身 + 复核报告）
    EXCL = [":(exclude)REVIEW_STAMP.md", ":(exclude)REVIEW_REPORT*.md"]
    d = subprocess.run(["git", "diff", "--quiet", approved, "HEAD", "--", "."] + EXCL)
    if d.returncode != 0:
        print("❌ 当前内容与已复核的内容（%s）不一致 → 禁止合并：" % approved[:7])
        print(sh(*(("git", "diff", "--stat", approved, "HEAD", "--", ".") + tuple(EXCL))))
        sys.exit(1)
```

### ② `tools/preflight.py` 检查8（替换 `:142-144`）
```python
    for f in [x.strip() for x in listing if x.strip().endswith(exts)]:
        base = f.rsplit("/", 1)[-1]
        # 复核报告会「故意引用乱码样本」作为事故证据（如 锛?銆?…）→ 必然自命中，加入白名单
        if f == "tools/preflight.py" or (base.startswith("REVIEW_REPORT") and base.endswith(".md")):
            continue
```
并把 `:129` 注释同步改成：`② 用 git ls-files 枚举 + 显式跳过 REVIEW_REPORT*.md（报告里故意含乱码样本作证据）`

### ③ `hooks/pre-push`（替换 `:49-56` 的循环）
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
> 已用等价判据在真实 commit 上验证（`9c48bf6`/`bab8f3a` 仍需批准 ✓、`8551b1a` 放行 ✓、报告-only 放行 ✓、报告+产品混提交仍需批准 ✓）。**沙箱不能跑 bash → 落地后请真机 `git push` 一次并把输出发我**。

### ④ `.gitignore:20`（替换那一行）
```
# 复核报告：只提交这两个规范文件（历史/临时报告仍不提交）
REVIEW_REPORT*.md
!REVIEW_REPORT_v6.md
!REVIEW_REPORT_ACTIONS.md
```
> 实测（临时 scratch 仓库，已删）：`REVIEW_REPORT.md`/`_v4`/`_v5` 仍被忽略 ✅，两个规范文件不再被忽略 ✅。

### ⑤ 旧文件 `REVIEW_REPORT.md`（2026/9/11）
删掉，或改成一行：`> 已废弃 → 最新见 REVIEW_REPORT_v6.md（历史 _v4/_v5），待办见 REVIEW_REPORT_ACTIONS.md。`

### 执行
```bash
export PYTHONIOENCODING=utf-8
# 改 ①②③④ + 处理 ⑤
python tools/preflight.py && echo "preflight OK"
node tools/coverage_test.js
git add tools/check_review_stamp.py tools/preflight.py hooks/pre-push .gitignore REVIEW_REPORT.md
git commit -m "chore: 闸门豁免复核元数据（报告入库前置）+ preflight检查8白名单"
git add REVIEW_REPORT_v6.md REVIEW_REPORT_ACTIONS.md
git commit -m "docs: 复核报告入库（§23–§29）"
# push 分支 → PR → CI 会红一次（正常）→ 我复核 → 我写批准记录 → 转绿 → 合并
```

---

# 🧰 建议加进 preflight 的两条检查（都是我这轮/上轮抓到问题的那种）

1. **检查11：模板内联脚本语法检查** —— 逐个 `<script type="text/html" id="page-*">` 抽内联脚本跑 `node --check`。**上一轮的 P0（作品01 图表失效）就是它抓到的**；修正版代码在 `REVIEW_REPORT_v6.md` §28.7（本轮实测：14 块全 OK ✅）
2. **检查12：每页章节编号严格递增且唯一** —— 代码在 §26.7（`_pages.py`）；能拦住"章节错位/重复/丢节"

---

## 豆包怎么读报告
1. **现在**：读本文件（小、自包含）；大报告按行区间读：**§30 = 4023–末**（可转发通知）、**§29 = 3967–4021**（本轮验收）、**§28 = 3784–3965**、**§27 = 3661–3782**、**§26 = 3509–3660**
2. **做完 E 之后**：报告进 git，直接 `git show HEAD:REVIEW_REPORT_v6.md` 或读工作区文件即可

---

*复核AI（DeepSeek Harness）生成，未提交、未 push。本轮：站点 ✅ / 文档 ❌（A–D 四处）+ §27 未落地；`preflight` exit 0、`coverage_test` exit 0（41 题全绿）、`check_review_stamp` exit 1（正确红）。*
