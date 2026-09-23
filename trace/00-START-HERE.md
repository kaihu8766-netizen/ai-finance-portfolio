# 00-START-HERE · 作品集决策追踪入口

本目录（trace/）是作品集项目的**决策追踪与可溯源基建**，从协作A成熟机制迁移而来。

## 目录结构
```
trace/
├── 00-START-HERE.md          ← 你在这里
├── DECISIONS.md              ← 跨RV拍板结论（强制引用PF-RV-ID）
├── OPEN_ISSUES.md            ← 已知问题与残余风险
├── CHANGELOG.md              ← 机制变更日志
├── project-state.md          ← 自动生成的决策记忆视图（给DeepSeek注入，非权威源）
└── 03-会议与日志/
    ├── DeepSeek评审/         ← RV档案（唯一权威源）+ 索引.md
    ├── 功能登记/             ← F-ID功能立项
    └── 门禁记录/             ← GATE-ID大动作门禁
```

## 核心规则
1. **RV 档案 = 唯一权威源**。project-state.md 是自动生成的缓存，手工编辑无效。
2. **RV 编号**：PF-RV-YYYYMMDD-NN（作品集域前缀，与协作A RV- 独立）。
3. **事前对齐**：功能提交（feat/fix/refactor/perf）必须先有已批准 phase=scheme 的方案评审 RV。
4. **事后复核**：红线文件改动必须带已批准且 diff_hash 匹配的 RV。
5. **REVIEW_REPORT_v6.md** 已冻结（截至 2026-09-23 历史档案只读），后续评审一律进 trace/。

## 常用命令
```bash
# 立项
python3 tools/trace_gate.py preflight --desc "功能描述"

# 方案评审（事前对齐）
DEEPSEEK_API_KEY=sk-xxx python3 tools/deepseek_gate.py \
  --topic "主题" --feature F-20260923-01 --phase scheme --prompt "..."

# 实施复核（事后）
DEEPSEEK_API_KEY=sk-xxx python3 tools/deepseek_gate.py \
  --topic "主题" --phase review --prompt "..."

# 检索历史
python3 tools/deepseek_gate.py --search "关键词"

# 生成决策视图
python3 tools/project_state.py

# 安装钩子
git config core.hooksPath .githooks
```
