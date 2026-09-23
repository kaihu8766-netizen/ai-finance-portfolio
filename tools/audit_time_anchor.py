#!/usr/bin/env python3
"""audit_time_anchor.py — 轻量时间锚定（F-20260924-03，PF-RV-20260924-22）

原则：本地 GIT_COMMITTER_DATE 可伪造，但 GitHub 平台时间不可伪造。
本工具查询 GitHub API 获取平台时间锚点，并落盘快照保证长期可复现。

锚点来源（DeepSeek B-1 修正，GitHub 无 commit 级 pushed_at）：
- PR merged_at：合并入 main 的平台时间，长期可查（主锚点）
- PushEvent created_at：events API，仅存 90 天（短期校验）
- Actions run created_at：CI 运行时间（辅助）

用法：
  python3 tools/audit_time_anchor.py --commit <sha> [--pr <number>] [--json]
  python3 tools/audit_time_anchor.py --audit-scheme-anchor <F-ID>   # 供 audit-scheme 调用

本地无 GITHUB_TOKEN 或网络不可达 → 输出 SKIP (unverified)，exit 0。
CI 中（review-gate.yml，有 GITHUB_TOKEN）→ 真实校验，失败 exit 1。

依赖：GITHUB_TOKEN 环境变量（CI 自动注入；本地可空跑跳过）
"""
import json
import os
import sys
import argparse
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

API = "https://api.github.com"
REPO = os.environ.get("GITHUB_REPOSITORY", "kaihu8766-netizen/ai-finance-portfolio")
TOKEN = os.environ.get("GITHUB_TOKEN", "").strip()
SNAPSHOT_FILE = "trace/platform-time-anchors.jsonl"  # append-only 落盘


def _api(path: str) -> dict:
    req = urllib.request.Request(f"{API}/repos/{REPO}{path}")
    if TOKEN:
        req.add_header("Authorization", f"token {TOKEN}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.load(resp)


def _write_snapshot(entry: dict) -> None:
    """append-only 落盘（B-1：保证 90 天后审计可复现）"""
    root = Path(os.environ.get("TRACE_GATE_ROOT", "")) if os.environ.get("TRACE_GATE_ROOT") else Path(
        __file__).resolve().parent.parent
    f = root / SNAPSHOT_FILE
    f.parent.mkdir(parents=True, exist_ok=True)
    with f.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False) + "\n")


def _fetch_commit_time(sha: str) -> dict:
    """主锚点：查 PR merged_at（若该 commit 是 PR 的 merge commit）；回退 PushEvent created_at"""
    anchors = {}
    # 1) 尝试 PR merged_at（先查关联 PR）
    try:
        pulls = _api(f"/commits/{sha}/pulls")
        for p in pulls:
            if p.get("merged_at"):
                anchors["pr_merged_at"] = p["merged_at"]
                anchors["pr_number"] = p["number"]
                break
    except Exception:
        pass
    # 2) PushEvent created_at（短期，90 天内有效）
    if not anchors.get("pr_merged_at"):
        try:
            events = _api(f"/events?per_page=100")
            for ev in events:
                if ev.get("type") == "PushEvent" and ev.get("payload", {}).get("head") == sha:
                    anchors["push_event_created_at"] = ev["created_at"]
                    break
        except Exception:
            pass
    return anchors


def cmd_anchor(sha: str, pr: str = "") -> int:
    if not TOKEN:
        print("[anchor] SKIP (unverified)：无 GITHUB_TOKEN，本地空跑不校验")
        return 0
    try:
        if pr:
            prd = _api(f"/pulls/{pr}")
            merged = prd.get("merged_at")
            if merged:
                anchors = {"pr_merged_at": merged, "pr_number": pr, "commit": sha}
                _write_snapshot({"event": "anchor", "ts": datetime.now(timezone.utc).isoformat(), **anchors})
                print(f"[anchor] OK：PR #{pr} merged_at={merged}（commit {sha[:8]}）")
                return 0
        anchors = _fetch_commit_time(sha)
        if anchors:
            _write_snapshot({"event": "anchor", "ts": datetime.now(timezone.utc).isoformat(), "commit": sha, **anchors})
            print(f"[anchor] OK：{json.dumps(anchors, ensure_ascii=False)}（commit {sha[:8]}）")
            return 0
        print(f"[anchor] WARN：commit {sha[:8]} 无可用平台时间锚点（非PR合并或超90天），快照不可补录", file=sys.stderr)
        return 1
    except urllib.error.HTTPError as e:
        print(f"[anchor] FAIL：GitHub API HTTP {e.code}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"[anchor] FAIL：{e}", file=sys.stderr)
        return 1


def main() -> int:
    ap = argparse.ArgumentParser(description="轻量时间锚定（GitHub 平台时间）")
    ap.add_argument("--commit", help="commit SHA")
    ap.add_argument("--pr", default="", help="PR number（可选，主锚点）")
    args = ap.parse_args()
    if not args.commit:
        ap.print_usage()
        return 2
    return cmd_anchor(args.commit, args.pr)


if __name__ == "__main__":
    sys.exit(main())
