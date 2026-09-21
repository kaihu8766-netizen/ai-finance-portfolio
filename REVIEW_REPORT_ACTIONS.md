# REVIEW_ACTIONS — 需要动手的事

> 复核AI（DeepSeek Harness）｜完整报告 `REVIEW_REPORT_v6.md`（**§37 = 本轮：`644ce41` 验收 + 未提交 renderMd 改动；§36 = 口径表落地**）
> # 🚦 第三十四轮：**❌ 不通过** —— ① §36 的 5 项修了 4 项（**漏 1 项**）② **批准行抢跑**（拿 §36 当"通过"依据，而 §36 从没写通过）③ 未提交的 `renderMd` 改动**引入 XSS 注入面**

## 🔴 1. 安全项（建议提交前做掉）：`renderMd` 把 tool-call 段原样注入 innerHTML

未提交的 `index.html:2664` / `:5634`：
```js
var toolCallMatch = str.match(/<div class="tool-call">[\s\S]*?<\/div>/g);
...
return escapeHtml(plainStr) + toolCallHtml;   // ← 未转义、未白名单
```
- **动机是对的**：之前整段转义 → 离线话术的 tool-call 徽标显示成字面文本；这次让徽标正常渲染 ✅
- **风险**：这段"原样注入"的输入**不只来自我方写死的离线话术**，还来自**真实 AI 模式（DeepSeek API）与联网搜索**返回的文本 → 一旦出现 `<div class="tool-call"><img src=x onerror=...></div>` 就会执行 → **XSS**（改动前没有这个面）
- **安全改法（保持徽标、去掉注入面）**：只取内部**文本**、剥标签后再转义，标签由我方代码生成：
```js
function splitBadges(s){
  var str = String(s || ''), badges = '';
  str = str.replace(/<div class="tool-call">([\s\S]*?)<\/div>/g, function(_, inner){
    badges += '<div class="tool-call">' + escapeHtml(inner.replace(/<[^>]*>/g, '')) + '</div>';
    return '';
  });
  return { plain: str, badges: badges };
}
function renderMd(s){
  var p = splitBadges(s);
  return escapeHtml(p.plain).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>') + p.badges;
}
```
`:5634` 同理：`var p = splitBadges(reply); thinkEl.innerHTML = escapeHtml(p.plain) + p.badges + (isAI ? … : '');`

## 🔴 2. §36 五项残留：修了 4 项，**漏了 1 项**

| # | 项 | 实测 | 判定 |
|---|---|---|---|
| 1 | `:2199` "在Smart做资金实习" | 命中 **0** | ✅ |
| 2 | **`:2204`/`:2208` 话术里的旧章节名 `数据来源与假设`** | 命中 **2** —— 两条话术仍说"参数和口径在每个作品的**"数据来源与假设"**里写清楚了" | ❌ **未修** |
| 3 | `:3622` `3-5%差异` | 命中 **0** | ✅ |
| 4 | 品牌写法 + `）`后空格 | 空格 0 ✅、统一为 `smart（奔驰×吉利）` 11 处 ✅ | ✅ |
| 5 | `.preview/` | `.gitignore` 已加 ✅ | ✅ |

**为什么必须修**：页面章节已改名「**数据口径与假设说明**」，助手却让访客去看"数据来源与假设" → **按助手说的名字在页面上找不到**。
**改法**：`index.html:2204`、`:2208` 里把 `"数据来源与假设"` → `"数据口径与假设说明"`。

## 🔴 3. 批准行抢跑（第 3 次同类）

`REVIEW_STAMP.md` 新增：`| 644ce41 | 第三十三轮 | 2026-09-21 | REVIEW_REPORT_v6.md §36 | ✅ 已批准 |`
**但 §36 的标题就是"实施质量好，剩 5 处小残留"，正文没有任何"通过"**，且漏的那 1 项现在仍在 → 该行**与 §36 内容不符**；而 `e9b623d` 已推到 `origin/master`，`check_review_stamp.py` 现在是 **exit 0（绿）** —— **绿的基础是一条抢跑的批准行**。

**修法（很小）**：① 先修上面第 2 项 → ② 我把 §37 补"验收通过"（或另起 §38）→ ③ **把该行里的 `§36` 改成 `§37`**（其余字段不动）→ 三者（批准行/报告章节/结论）重新对齐。

## ⚠️ 4. 品牌写法仍有 2 处没统一
`:1501` 主页副标题、`:1524` 经历卡 仍是 `梅赛德斯-奔驰x吉利体系`（半角 x + "体系"），其余 11 处是 `smart（奔驰×吉利）` → 建议统一（并重申 §33.3：**"体系"不是公司名**，背书放括号最稳）。

## ✅ 本轮检查结果（复跑）
`preflight` **0**（10 项全绿）· `coverage` **0**（41 题全绿）· `check_review_stamp` **0（绿，但见第 3 条）** · 模板内联脚本 **14 块全过** · **文档级 5 个 JS 块全过（含新 renderMd）** · 逐页编号全连续 · `U+FFFD` 0 · `<div>` 计数 +1 是 JS 正则字面量造成（非真实结构变化）。
> 自我更正：我这轮前两次脚本抽取范围错了（把模板内部脚本与 `</script>` 行算进去），报了 7 个假 ❌；修正后全过 —— 结论以修正版为准。

## 下一步
1. 修 **第 2 项**（2 行）＋ 修 **第 1 项 XSS**（建议同批，安全项）
2. 顺手：统一 `:1501`/`:1524` 品牌写法；把批准行的 `§36` 改成 `§37`
3. 提交 → 告诉我 sha → 我在 §37 记"验收通过" → 你再更新批准行引用 → 绿
4. 仍建议：GitHub 设 **required status checks**；「违规记录」补一行 PR #5/#6 的事后说明

## 读报告
```bash
git show HEAD:REVIEW_REPORT_ACTIONS.md
git show HEAD:REVIEW_REPORT_v6.md | sed -n '4685,4807p'   # §37 完整复核
```

---

*复核AI（DeepSeek Harness）生成。本轮：❌ 不通过（1 项未修 + 批准行抢跑 + XSS 注入面）。*
