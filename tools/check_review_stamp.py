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

    # 提取已批准表格中的commit SHA，按提交时间取最新（免除书写顺序依赖）
    rows = re.findall(r"^\|\s*([0-9a-f]{7,40})\s*\|.*✅\s*已批准", stamp, re.M)
    if not rows:
        print("❌ REVIEW_STAMP.md里没有已批准记录")
        sys.exit(1)
    approved = max(rows, key=lambda r: int(sh("git", "log", "-1", "--format=%ct", r) or 0))

    # 验证commit存在
    if subprocess.run(["git", "cat-file", "-e", approved + "^{commit}"]).returncode != 0:
        print("❌ 凭证里的commit %s不存在（可能被rebase掉了）" % approved)
        sys.exit(1)

    # 内容相等判据：忽略复核元数据（凭证自身 + 复核报告 + 评审档案 + 评审原始响应）
    # v7.1（RV-20261021-77 收尾）起：评审必然发生在内容 commit 之后、档案独立落盘，
    # 若不排除评审产物目录，任何"内容后置评审档案"都会使 diff 非空 → 永远无法通过。
    # 档案目录可信性由 git 历史保证（不可篡改），不纳入 CI 内容相等判据。
    # 注意：排除必须限定文档/数据扩展名（.md/.json），目录级 ** 会连带排除藏匿代码
    # （如 tools/raw/evil.py）→ 门禁盲区（PF-RV-20261021-78 条件2/6 回归测试锁定）。
    EXCL = [":(exclude)REVIEW_STAMP.md", ":(exclude)REVIEW_REPORT*.md", ":(exclude)REVIEW_CHECKLIST.md",
            ":(exclude)trace/03-会议与日志/DeepSeek评审/*.md",
            ":(exclude)trace/03-会议与日志/DeepSeek评审/*.json",
            ":(exclude)tools/raw/*.json", ":(exclude)tools/raw/*.md"]
    d = subprocess.run(["git", "diff", "--quiet", approved, "HEAD", "--", "."] + EXCL)
    if d.returncode != 0:
        print("❌ 当前内容与已复核的内容（%s）不一致 → 禁止合并：" % approved[:7])
        print(sh(*(("git", "diff", "--stat", approved, "HEAD", "--", ".") + tuple(EXCL))))
        sys.exit(1)

    print("✅ 复核凭证有效（内容 = %s）" % approved[:7])


if __name__ == "__main__":
    main()
