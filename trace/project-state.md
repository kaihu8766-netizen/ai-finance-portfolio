---
schema_version: 1
generator_version: 1.0.0
generated_at: 2026-09-24T00:37:31
source_commit: portfolio@git
checksum: ab5c5d7167f65ccc
counts: total=15, active=11, superseded=0
token_estimate: 574
metadata_missing_rate: 0.00
circuit_breaker_state: ok
scope_note: infra_gap_fix_in_C_batch
---

# project-state.md · 给 DeepSeek 的决策记忆视图（非权威源）

> 权威源永远是 RV 档案（03-会议与日志/DeepSeek评审/）。本文件由 project_state.py 自动生成，仅作评审注入缓存。

## P0 红线与架构约束
```
P0 红线与架构约束（不可变，变更须 PF-RV 评审）：
- 仓库拓扑：ai-finance-portfolio=作品集仓（公开，GitHub Pages 部署）；trace/=仓内决策追踪目录（公开，排除出 Pages 构建）
- RV 编号：PF-RV-YYYYMMDD-NN 仓内唯一+域前缀即全局唯一（裸 RV- 仅协作A专用）；档案=唯一权威源，project-state.md 仅缓存视图
- 红线类别：index_html/echarts_lib/demo_publish/gate_self；命中红线提交必须带已批准且 diff_hash 匹配的 PF-RV-ID
- 提交纪律：先归档后提交；message 带 PF-RV-ID；功能提交须有已批准 phase=scheme 的方案评审
- 公开渠道（GitHub/作品集/简历）不出现具体外部人名与原话（作者本人署名除外）
- 作品集定位：基于实习观察的思考与尝试，不宣称落地/公司项目/生产级
```

## P1 决策表（仅已拍板/已替代；pending 不入表）

| id | topic | status | date | phase | superseded_by |
|---|---|---|---|---|---|
| PF-RV-20260923-01 | 作品集机制迁移v1.0事后复核 | adopted | 2026-09-23T23:04:39 | review | [] |
| PF-RV-20260923-02 | 作品集机制迁移v1.0修订复核 | adopted | 2026-09-23T23:08:31 | review | [] |
| PF-RV-20260923-03 | 作品集机制迁移v1.0最终放行 | adopted | 2026-09-23T23:09:37 | review | [] |
| PF-RV-20260923-04 | project_state白名单正则修复 | adopted | 2026-09-23T23:12:17 | review | [] |
| PF-RV-20260923-05 | 作品集机制迁移v1.0最终冻结 | adopted | 2026-09-23T23:15:02 | review | [] |
| PF-RV-20260923-06 | 作品集机制迁移v1.0放行确认 | adopted | 2026-09-23T23:16:25 | review | [] |
| PF-RV-20260923-07 | F-20260923-01方案评审-机制迁移 | adopted | 2026-09-23T23:18:07 | scheme | [] |
| PF-RV-20260923-08 | B1密钥保护与依赖声明落地 | adopted | 2026-09-23T23:18:55 | review | [] |
| PF-RV-20260923-09 | PF-RV-08证据闭环最终冻结 | adopted | 2026-09-23T23:19:49 | review | [] |
| PF-RV-20260923-10 | F-20260923-02跨项目机制回灌方案 | adopted | 2026-09-23T23:56:08 | scheme | [] |
| PF-RV-20260923-11 | F-20260923-02回灌方案修订确认 | adopted | 2026-09-23T23:56:51 | scheme | [] |
