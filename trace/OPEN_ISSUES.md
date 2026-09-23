# OPEN_ISSUES · 作品集已知问题与残余风险

> 不阻塞落地的已知问题，持续跟踪。

| ISS-ID | 日期 | 问题 | 影响 | 状态 |
|---|---|---|---|---|
| ISS-20260923-01 | 2026-09-23 | commit 时间可伪造（GIT_COMMITTER_DATE/--date），时间序校验可绕过 | 低：F-20260924-03 以 GitHub 平台时间为权威缓解（PR merged_at / PushEvent created_at，落盘快照），非完全解决 | open（缓解中） |
| ISS-20260923-02 | 2026-09-23 | 本地 hook 可被 --no-verify 绕过 | 低：CI review-gate 为不可绕过兜底 | open |
| ISS-20260923-03 | 2026-09-23 | squash merge 时 PR 内 commit 校验需改 squash message 含 PF-RV-ID | 低：CI 层校验 squash message | open |
| ISS-20260923-04 | 2026-09-23 | 新克隆默认不生效 core.hooksPath，需手动 git config core.hooksPath .githooks | 中：preflight 增加 hooksPath 自检 | open |
| ISS-20260924-01 | 2026-09-24 | 两项目复核工作流统一=方案A（流程等价）：命令集一致/三闸门同构，差异仅在红线清单与域前缀私有配置 | 中：需随本次放行冻结等价性依据 | open |
| ISS-20260924-02 | 2026-09-24 | 暴露事件：旧 feat/portfolio-gate-migration 分支（dcebe53/5c3abc8）含内部项目标识词，已推送远程公开仓 | 中：删除 ref 后 commit 在 GC 前仍可通过 SHA 直链访问；处置=删除分支+风险认领（不重写已公开历史） | open（认领中） |
| ISS-20260924-03 | 2026-09-24 | 文件内裸 RV- 文本不拦截（check 只扫 commit message） | 低：本次放行不含此能力，v2 增强项 | open |
