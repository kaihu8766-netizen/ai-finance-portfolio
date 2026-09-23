# DECISIONS · 作品集决策记录

> 跨 PF-RV 的拍板结论汇总。每条必须引用 PF-RV-ID，禁止与 RV 档案矛盾。

| DEC-ID | 日期 | 决策 | 依据 PF-RV | 状态 |
|---|---|---|---|---|
| DEC-20260923-01 | 2026-09-23 | 作品集讨论机制迁移：API直连DeepSeek / trace放公开仓 / 保留PR流程 / REVIEW_REPORT_v6保留根目录 | RV-66, RV-67（发票trace仓评审） | adopted |
| DEC-20260923-02 | 2026-09-23 | RV编号加域前缀 PF-RV-YYYYMMDD-NN（P0变更：全局唯一→仓内唯一+域前缀即全局唯一） | RV-66 B1 | adopted |

## DEC-20260924-01 · 跨项目机制回灌（作品集侧记录）
- 事件：F-20260923-02 回灌方案实施；作品集侧 B1 audit-scheme / B2 门禁记录待实测
- 依据：PF-RV-20260923-10/11（方案+修订确认，adopted）
- 交叉引用：协作A DEC-20260924-01（RV-域）；编号规则：裸 RV- 仅协作A专用，PF-RV- 作品集专用
- 状态：adopted
- B1 audit-scheme 实测（2026-09-24）：正确解析 F-20260923-01 方案评审入库时间（2026-09-23 23:20:22），git log 对 trace/ 路径适配生效；F-20260923-02 未评审状态正常识别
- B2 门禁记录实测（2026-09-24）：gate 正确命中"部署/数据迁移"大动作，生成 GATE-20260924-01 记录，目录结构正常

## DEC-20260924-03 · F-20260924-02 公开性整改（契约中性化）
- 事件：跨项目机制契约彻底中性化，消除公开仓可反推内部业务方向的标识
- 依据：PF-RV-20260923-10/11（机制契约）+ RV-14（有条件采纳）+ 修订确认（待 PF-RV-16）
- content_sha256（契约文件内容，校验命令 sha256sum CROSS_PROJECT_CONTRACT.md）：`fcb4d662cf8a8cf4259dec4232a6ef5ad6373bd228da37deebeb97a775a5de1c`
- git_blob_sha1（契约 Git 对象，校验命令 git hash-object CROSS_PROJECT_CONTRACT.md）：`7cbc0d25295b5c05c8c0c90fa3313bdecdd8ab42`
  校验方式：作品集侧与协作A侧各存一份，两边逐字一致（diff 验证 ✅）；任一侧修改须同步更新本 hash
- 状态：待 PF-RV-16 修订确认后转 adopted
