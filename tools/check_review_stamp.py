#!/usr/bin/env python3
"""CI用：HEAD的内容必须等于REVIEW_STAMP.md中最新一条批准记录所指的内容（忽略凭证文件自身）。
   为什么不用「逐个commit的sha列表」：新增批准记录本身会产生新commit，其hash不可能写在自己里面
   → 永远不收敛（见REVIEW_REPORT_v6.md §18.5）。"""
import re
import subprocess
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")  # Windows GBK控制台保护
    except Exception:
        pass


def sh(*a):
    return subprocess.run(a, capture_output=True).stdout.decode("utf-8", "replace").strip()


def main():
    stamp = sh("git", "show", "HEAD:REVIEW_STAMP.md")
    if not stamp:
        print("❌ HEAD里没有REVIEW_STAMP.md")
        sys.exit(1)

    # 提取已批准表格中的commit SHA（最新一条在最上面）
    rows = re.findall(r"^\|\s*([0-9a-f]{7,40})\s*\|.*✅\s*已批准", stamp, re.M)
    if not rows:
        print("❌ REVIEW_STAMP.md里没有已批准记录")
        sys.exit(1)
    approved = rows[0]  # 最新一条批准记录 = 被复核的内容基线

    # 验证commit存在
    if subprocess.run(["git", "cat-file", "-e", approved + "^{commit}"]).returncode != 0:
        print("❌ 凭证里的commit %s不存在（可能被rebase掉了）" % approved)
        sys.exit(1)

    # 内容相等判据：忽略REVIEW_STAMP.md自身
    d = subprocess.run(
        ["git", "diff", "--quiet", approved, "HEAD", "--", ".", ":(exclude)REVIEW_STAMP.md"]
    )
    if d.returncode != 0:
        print("❌ 当前内容与已复核的内容（%s）不一致 → 禁止合并：" % approved[:7])
        print(sh("git", "diff", "--stat", approved, "HEAD", "--", ".", ":(exclude)REVIEW_STAMP.md"))
        sys.exit(1)

    print("✅ 复核凭证有效（内容 = %s）" % approved[:7])


if __name__ == "__main__":
    main()
