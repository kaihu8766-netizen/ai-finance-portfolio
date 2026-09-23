---
id: PF-RV-20260923-04
date: 2026-09-23T23:12:17
topic: project_state白名单正则修复
status: adopted
diff_hash: 5c5cdd9219215106
decision_ids: []
issue_ids: []
task_ids: []
phase: review
feature: ""
commits: []
decision_maker: 用户
reviewers: [DeepSeek, 豆包, 用户]
model: deepseek-v4-flash
raw_file: rv-20260923-04-70d580e617cd.json
raw_hash: sha256:ab49b4daf09d80a7c1ba4d70535331dfefce023faf7286325d1edec0f1a97f57
supersedes: []
superseded_by: []
provenance: live
---
# PF-RV-20260923-04 · project_state白名单正则修复

- 时间：2026-09-23T23:12:17
- 阶段：review（实施复核）
- 请求人：豆包（执行）｜决策：用户｜顾问：DeepSeek
- 原始响应：/home/user/Doubao/chats/38443714366494466/ai-finance-portfolio/tools/raw/rv-20260923-04-70d580e617cd.json（sha256:ab49b4daf09d80a7c1ba4d70535331dfefce023faf7286325d1edec0f1a97f57）

## 问题

【事后复核 · project_state.py 白名单正则修复】机制实施后的工具缺陷修复：
问题：project_state.py 的 TOPIC_WHITELIST_RE 不允许点号"."，导致 topic 含 "v1.0" 的 RV 档案（PF-RV-20260923-02/03）被拒绝注入，schema 校验失败（breaker=tripped），决策记忆视图无法生成。
修复：白名单正则字符集加 "."（一行改动）。
验证：project_state.py 重新生成成功，entries=3 active=3 token≈364 missing=0% breaker=ok，3条adopted决策全部入表。
请确认修复正确，可以合并进本次机制迁移提交。…

## DeepSeek 结论（原文节选）

## 结论：修复方向对，但按现有证据**不能放行合并**。请先补齐下面几项。
### 1. 先判定是否命中 `gate_self` 红线（关键）
本项目改的是 `project_state.py` 的**注入/校验门禁逻辑本身**（白名单正则决定哪些 RV 档案能进记忆视图）。这正是"门禁自审"的语义域，**倾向命中 `gate_self`**。
- 若命中：提交必须带**已批准且 diff_hash 匹配**的 PF-RV-ID，一行改动也不例外，"改动很小"不是豁免理由。
- 若不命中：需要显式给出理由（例如该文件不被视为门禁组件），不要默认跳过。
### 2. diff_hash 会失配，原批准覆盖不到这一行
你说要"合并进本次机制迁移提交"。但 PF-RV-20260923-01/02/03 的批准是基于**旧的 diff**计算的 diff_hash；新增这一行后 diff 变了，**hash 不再匹配，原批准不覆盖该改动**，提交侧校验应当拒绝。
→ 要么单开一份修复档案（建议 `PF-RV-<当日>-04`）并让 diff_hash 对齐，要么更新原档案并重新批准。不能直接并入。

## 采纳状态

adopted（决策人：用户授权确认）
