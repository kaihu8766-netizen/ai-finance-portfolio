# REVIEW_ACTIONS — 需要动手的事

> 复核AI（DeepSeek Harness）｜完整报告 `REVIEW_REPORT_v6.md`（**§32 = 本轮：合并前最终验收 ✅ 通过**）
> # ✅ 第二十九轮复核：**通过 —— 批准基线 = `814f782`**
> 站点结构/脚本/数字/版本/闸门**全部合格**；A–D 四处文档修正已提交且与事实一致。**只差你们写那一行批准记录。**

## 📌 你们要做的（1 步）

在 `REVIEW_STAMP.md` 的批准表**最上方**（现 `:12` 之前）加这一行 —— **只动这一个文件**：

```markdown
| 814f782 | 第二十九轮 | 2026-09-20 | REVIEW_REPORT_v6.md §32 | ✅ 已批准 |
```

自测（应变成 exit 0）：
```bash
python tools/check_review_stamp.py     # 期望：✅ 复核凭证有效（内容 = 814f782）
git add REVIEW_STAMP.md
git commit -m "review: 第二十九轮批准（§32 通过，基线 814f782）"
git push origin feature/business-overhaul-v2
# 然后在 GitHub 创建/更新 PR → CI 两步应全绿 → 合并
```
> ⚠️ 写批准行时**不要顺带改别的内容**（哪怕 CHANGELOG 加一行）—— 批准之后任何非豁免文件的改动都会让 CI 立刻变红。
> ⚠️ 若你打算**本地** `git push origin master`：pre-push 钩子要求每个 commit 都在批准表里，而本分支的产品类 commit（`3164895` 机制补丁、`e82113f` 站内修复）不在表里 → 会被拦。**走 GitHub PR 合并（推荐）则不受影响。**

## ✅ 本轮验收（逐项实测）

| 检查 | 结果 |
|---|---|
| 内联脚本语法（14 块） | `node --check` **14 块全过，失败 0** ✅ |
| 逐页章节编号 | page-01 `[1..7]`、page-03 `[1..11]`、page-05 `[1..11]`、page-06 `[1..7]`、page-07 `[1..10]` —— 全连续 ✅ |
| 局限 / 数据来源 | **各 5 篇**（无重复/串页）✅ |
| 数字 | 统计卡 **24 轮 / 13 条**；`12条批准基线`、`21轮复核` 全站 **0 命中** ✅ |
| 版本 | 页脚/KB/时间线/话术 全 **v5.5.0**；`v5.3.4` **0 命中** ✅ |
| CHANGELOG | 标题在第 1 行 ✅；`:10`/`:22`/`:254` 三处均已与事实一致 ✅ |
| 结构/编码 | `<div>` 平衡 −3（与上轮相同）✅；`U+FFFD` 0 ✅ |
| 闸门 | `preflight` **exit 0** ｜ `coverage_test` **exit 0**（41 题全绿）｜ `check_review_stamp` **exit 1**（正确红）✅ |
| 分支范围 | 相对基线 `e47d0d1` 共 9 个文件，全部预期，无夹带 ✅ |

## 🟢 两个 P2（不阻塞，下一轮顺手）

1. **`.gitignore` 带 BOM**（首字节 `efbbbf`）—— 功能无影响，属编码卫生；根因是"用 PowerShell 回写文本文件"（强制规则3 禁止）
2. **KB `versions` 少 v5.4.0（双Agent复核机制）**；话术 `:2190` 把它标成 v5.0（实际 v5.4.0）

## 🧰 建议下一轮做（防复发）

1. **检查11：模板内联脚本语法检查**（`node --check` 逐块）—— 上一轮的 P0 就是它抓到的；代码见 `REVIEW_REPORT_v6.md` §28.7
2. **检查12：每页章节编号严格递增且唯一** —— 代码见 §26.7
3. **数字交叉校验**：卡片数字 == `REVIEW_STAMP.md` 实际行数 / 最新轮次（防"每合并一次就漂移"）

---

## 豆包读报告（已可用 ✅ —— 报告已进 git 且被闸门豁免）
```bash
git show HEAD:REVIEW_REPORT_ACTIONS.md                     # 一页待办（本文件，优先读）
git show HEAD:REVIEW_REPORT_v6.md | sed -n '4155,4210p'    # §32 本轮最终验收
git show HEAD:REVIEW_REPORT_v6.md | sed -n '4099,4164p'    # §31 补丁落地证据
```

---

*复核AI（DeepSeek Harness）生成。本轮：**✅ 通过**（批准基线 `814f782`）；`preflight` exit 0、`coverage_test` exit 0（41 题全绿）、`check_review_stamp` exit 1（正确红，等待批准行）。*
