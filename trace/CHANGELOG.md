# CHANGELOG · 作品集机制变更日志

## 2026-09-23 · 机制迁移 v1.0
- 新增 tools/deepseek_gate.py / deepseek_client.py / project_state.py / trace_gate.py
- 新增 trace/ 决策追踪目录（RV档案/功能登记/DECISIONS/OPEN_ISSUES/CHANGELOG）
- 新增 .githooks/commit-msg 三闸门（ID引用 / 红线diff_hash / 功能提交事前对齐）
- hooks/pre-push 移至 .githooks/
- 新增 tools/gate_rules.yaml 红线定义
- REVIEW_REPORT_v6.md 冻结为历史档案
- pages.yml 改白名单构建（排除 trace/）
- PROJECT_BRIEF.md §8 协作流程更新
- 评审依据：RV-66（方案评审）、RV-67（修订确认），用户拍板
