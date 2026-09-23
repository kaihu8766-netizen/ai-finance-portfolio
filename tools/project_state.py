#!/usr/bin/env python3
"""
project_state.py —— F-20260923-07 Token 价值最大化机制：决策表自动生成器

从 project-trace/03-会议与日志/DeepSeek评审/*.md 的 frontmatter 解析评审档案，
生成 project-state.md（P0 红线模板 + P1 决策表），供 deepseek_gate.py 按需注入。

设计约束（RV-54/55/56 闭环）：
- schema_version: 1；必填 id/date/topic/status/phase；status∈{pending,adopted,superseded}
- RV-ID 全局唯一；supersedes/superseded_by 双向一致性 + 联动校验（被指向者必须 superseded）
- 熔断（RV-53 红队阈值）：活跃决策>50 / 注入估算>1500 token / 元数据缺失率>20% → tripped
- 任一校验失败 → 整份禁用注入（gate 端二次校验，--force 仅生成器端跳过）
- scope_note: infra_gap_fix_in_C_batch（可拆批反向检索）

用法：
    python3 project_state.py                # 生成 project-state.md（默认）
    python3 project_state.py --force        # 校验失败仍生成（breaker=tripped）
    python3 project_state.py --print        # 只打印决策表，不写文件
"""

import argparse
import hashlib
import re
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
TRACE = HERE.parent / "trace"  # 作品集仓 trace/ 目录（本文件位于 tools/）
RV_DIR = TRACE / "03-会议与日志" / "DeepSeek评审"
OUT = TRACE / "project-state.md"

SCHEMA_VERSION = "1"
GENERATOR_VERSION = "1.0.0"
# RV-53 红队熔断阈值
MAX_ACTIVE_DECISIONS = 50
MAX_INJECT_TOKENS = 1500
MAX_METADATA_MISSING_RATE = 0.20

# P0 红线/架构约束（静态模板，≤300 token；变更须走 RV 评审，生成器只读不写）
P0_TEMPLATE = """P0 红线与架构约束（不可变，变更须 PF-RV 评审）：
- 仓库拓扑：ai-finance-portfolio=作品集仓（公开，GitHub Pages 部署）；trace/=仓内决策追踪目录（公开，排除出 Pages 构建）
- RV 编号：PF-RV-YYYYMMDD-NN 仓内唯一+域前缀即全局唯一（裸 RV- 仅协作A专用）；档案=唯一权威源，project-state.md 仅缓存视图
- 红线类别：index_html/echarts_lib/demo_publish/gate_self；命中红线提交必须带已批准且 diff_hash 匹配的 PF-RV-ID
- 提交纪律：先归档后提交；message 带 PF-RV-ID；功能提交须有已批准 phase=scheme 的方案评审
- 公开渠道（GitHub/作品集/简历）不出现具体外部人名与原话（作者本人署名除外）
- 作品集定位：基于实习观察的思考与尝试，不宣称落地/公司项目/生产级"""

STATUS_SET = {"pending", "adopted", "superseded"}
PHASE_SET = {"scheme", "review"}
# RV-59：脱敏改白名单（黑名单 fail-open 有残留风险）——topic 必须匹配受控字符集，
# 任何引号/人名称呼/特殊符号/超长都拒绝注入（白名单模式，漏检即阻断而非泄露）
TOPIC_WHITELIST_RE = re.compile(r"^[\u4e00-\u9fffA-Za-z0-9 _\-+()（）·，。、.]+$")
TOPIC_MAX_LEN = 60
SENSITIVE_RE = re.compile(
    r"[“”『』「」]|[\u4e00-\u9fff]{1,4}(?:先生|女士|经理|总监|老师|同学)|原话")


def parse_frontmatter(text: str) -> dict:
    """解析 YAML 前言的简单实现（够用即可，不引第三方库）。"""
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return {}
    meta = {}
    COMMENT_KEYS = {"status", "phase", "supersedes", "superseded_by"}
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        k, _, v = line.partition(":")
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k in COMMENT_KEYS:
            v = v.split("#")[0].strip()  # 剥离行内注释（历史档案带" # 用户拍板…"）
        meta[k] = v
    return meta


def scan_archives() -> list[dict]:
    """扫描全部 RV 档案 frontmatter。"""
    entries = []
    for f in sorted(RV_DIR.glob("*.md")):
        if f.name == "索引.md":
            continue
        meta = parse_frontmatter(f.read_text(encoding="utf-8"))
        if not meta.get("id"):
            continue
        meta["_file"] = f.name
        entries.append(meta)
    return entries


def _parse_refs(e: dict, key: str) -> list[str]:
    """解析 supersedes/superseded_by：兼容 list、空字符串、YAML 空列表 '[]'。"""
    raw = e.get(key)
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(x).strip() for x in raw if str(x).strip()]
    vals = [v.strip().strip("[]") for v in str(raw).split(",")]
    return [v for v in vals if v]


def validate(entries: list[dict]) -> tuple[list[str], float, int]:
    """schema 校验。返回 (errors, metadata_missing_rate, active_count)。"""
    errors = []
    seen_ids = {}
    by_id = {}
    for e in entries:
        rid = e.get("id", "")
        if rid in seen_ids:
            errors.append(f"RV-ID 重复（全局唯一）：{rid} 出现于 {seen_ids[rid]} 与 {e['_file']}")
        else:
            seen_ids[rid] = e["_file"]
        by_id[rid] = e
        for field in ("id", "date", "topic", "status", "phase"):
            if not e.get(field):
                errors.append(f"{e.get('_file', '?')} 缺必填字段 {field}")
        if e.get("status") and e["status"] not in STATUS_SET:
            errors.append(f"{e['id']} status 非法：{e['status']}（须 ∈ {sorted(STATUS_SET)}）")
        if e.get("phase") and e["phase"] not in PHASE_SET:
            errors.append(f"{e['id']} phase 非法：{e['phase']}（须 ∈ {sorted(PHASE_SET)}）")
        # RV-58 A / RV-59：注入内容白名单校验（topic 将进入第三方 API，白名单模式防漏检）
        t = e.get("topic") or ""
        if t and (SENSITIVE_RE.search(t) or not TOPIC_WHITELIST_RE.match(t) or len(t) > TOPIC_MAX_LEN):
            errors.append(f"{e['id']} topic 未通过白名单（含引号/人名称呼/特殊符号/超长）：{t[:40]}，拒绝注入")
    # 双向一致性 + 联动校验
    for rid, e in by_id.items():
        for ref in _parse_refs(e, "supersedes"):
            if ref not in by_id:
                errors.append(f"{rid} supersedes 指向不存在：{ref}")
                continue
            # 联动：被指向者 status 必须为 superseded
            if by_id[ref].get("status") != "superseded":
                errors.append(f"{rid} supersedes {ref}，但 {ref} status={by_id[ref].get('status')}（须 superseded）")
            # 双向一致性：被指向者 superseded_by 应含 rid
            if rid not in _parse_refs(by_id[ref], "superseded_by"):
                errors.append(f"{rid} supersedes {ref}，但 {ref} 的 superseded_by 未回指 {rid}")
        for ref in _parse_refs(e, "superseded_by"):
            if ref not in by_id:
                errors.append(f"{rid} superseded_by 指向不存在：{ref}")
            elif rid not in _parse_refs(by_id[ref], "supersedes"):
                errors.append(f"{rid} superseded_by {ref}，但 {ref} 的 supersedes 未回指 {rid}")
        # 循环检测（两级即可，更深循环由 supersedes/superseded_by 对称性暴露）
        for ref in _parse_refs(e, "supersedes"):
            if ref in by_id and rid in _parse_refs(by_id[ref], "supersedes"):
                errors.append(f"循环替代：{rid} ↔ {ref}")
    # 元数据缺失率（date/status 缺失占比）
    missing = sum(1 for e in entries if not e.get("date") or not e.get("status"))
    rate = missing / len(entries) if entries else 0.0
    active = sum(1 for e in entries if e.get("status") == "adopted")
    return errors, rate, active


def build_decisions(entries: list[dict]) -> list[dict]:
    """决策表：只列 adopted 与 superseded（被替代仍可检索），跳过 pending（未拍板不注入）。"""
    rows = []
    for e in entries:
        if e.get("status") not in ("adopted", "superseded"):
            continue
        rows.append({
            "id": e.get("id", "?"),
            "topic": e.get("topic", "?"),
            "status": e.get("status", "?"),
            "date": e.get("date", "?"),
            "phase": e.get("phase", "?"),
            "superseded_by": e.get("superseded_by", ""),
        })
    # 排序：adopted 在前、日期新在前
    rows.sort(key=lambda r: (r["status"] != "adopted", r["date"]), reverse=False)
    return rows


def estimate_tokens(rows: list[dict]) -> int:
    """粗略 token 估算：中文按 1 字/ token，ASCII 按 4 字符/ token。"""
    def _est(s: str) -> int:
        cjk = sum(1 for ch in s if "\u4e00" <= ch <= "\u9fff")
        ascii_len = len(s) - cjk
        return cjk + ascii_len // 4 + 1
    total = _est(P0_TEMPLATE) + 40  # 固定标注开销
    for r in rows:
        total += _est(f"|{r['id']}|{r['topic']}|{r['status']}|{r['date']}|{r['phase']}|{r['superseded_by']}|")
    return total


def main() -> int:
    ap = argparse.ArgumentParser(description="生成 project-state.md（决策表自动生成）")
    ap.add_argument("--force", action="store_true", help="校验失败仍生成（breaker=tripped）")
    ap.add_argument("--print", dest="print_only", action="store_true", help="只打印决策表不写文件")
    args = ap.parse_args()

    entries = scan_archives()
    errors, missing_rate, active = validate(entries)
    rows = build_decisions(entries)
    tok = estimate_tokens(rows)

    # 熔断判定（RV-53）
    breaker = "ok"
    reasons = []
    if active > MAX_ACTIVE_DECISIONS:
        breaker, reasons = "tripped", reasons + [f"活跃决策 {active} > {MAX_ACTIVE_DECISIONS}"]
    if tok > MAX_INJECT_TOKENS:
        breaker, reasons = "tripped", reasons + [f"注入估算 {tok} > {MAX_INJECT_TOKENS} tokens"]
    if missing_rate > MAX_METADATA_MISSING_RATE:
        breaker, reasons = "tripped", reasons + [f"元数据缺失率 {missing_rate:.0%} > {MAX_METADATA_MISSING_RATE:.0%}"]

    if errors and not args.force:
        for e in errors[:10]:
            print(f"✗ {e}", file=sys.stderr)
        print(f"✗ schema 校验失败（共 {len(errors)} 条），默认禁用注入；--force 跳过（breaker=tripped）", file=sys.stderr)
        return 1
    if errors:
        print(f"⚠ --force 生效：忽略 {len(errors)} 条校验错误，breaker 强制 tripped", file=sys.stderr)
        breaker = "tripped"

    # checksum：对决策表 markdown 行计算（gate 端按同格式重算校验）
    table_text = "".join(
        f"| {r['id']} | {r['topic']} | {r['status']} | {r['date']} | {r['phase']} | {r['superseded_by']} |\n"
        for r in rows)
    checksum = hashlib.sha256(table_text.encode()).hexdigest()[:16]

    lines = []
    lines.append("---")
    lines.append(f"schema_version: {SCHEMA_VERSION}")
    lines.append(f"generator_version: {GENERATOR_VERSION}")
    lines.append(f"generated_at: {datetime.now().strftime('%Y-%m-%dT%H:%M:%S')}")
    lines.append(f"source_commit: portfolio@git")
    lines.append(f"checksum: {checksum}")
    lines.append(f"counts: total={len(entries)}, active={active}, superseded={sum(1 for r in rows if r['status']=='superseded')}")
    lines.append(f"token_estimate: {tok}")
    lines.append(f"metadata_missing_rate: {missing_rate:.2f}")
    lines.append(f"circuit_breaker_state: {breaker}")
    lines.append(f"scope_note: infra_gap_fix_in_C_batch")
    lines.append("---")
    lines.append("")
    lines.append("# project-state.md · 给 DeepSeek 的决策记忆视图（非权威源）")
    lines.append("")
    lines.append("> 权威源永远是 RV 档案（03-会议与日志/DeepSeek评审/）。本文件由 project_state.py 自动生成，仅作评审注入缓存。")
    lines.append("")
    lines.append("## P0 红线与架构约束")
    lines.append("```")
    lines.append(P0_TEMPLATE)
    lines.append("```")
    lines.append("")
    lines.append("## P1 决策表（仅已拍板/已替代；pending 不入表）")
    lines.append("")
    lines.append("| id | topic | status | date | phase | superseded_by |")
    lines.append("|---|---|---|---|---|---|")
    for r in rows:
        lines.append(f"| {r['id']} | {r['topic']} | {r['status']} | {r['date']} | {r['phase']} | {r['superseded_by']} |")
    if not rows:
        lines.append("| （暂无已拍板决策） | | | | | |")

    content = "\n".join(lines) + "\n"

    if args.print_only:
        print(content)
        return 0
    OUT.write_text(content, encoding="utf-8")
    print(f"[project_state] 已生成 {OUT}")
    print(f"[project_state] entries={len(entries)} active={active} token≈{tok} missing={missing_rate:.0%} breaker={breaker}")
    if breaker == "tripped":
        print(f"[project_state] ⚠ 熔断已触发：{'；'.join(reasons)}（gate 端将拒绝注入）", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
