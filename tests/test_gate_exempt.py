# -*- coding: utf-8 -*-
"""门禁例外回归测试（PF-RV-20261021-78 条件6）。

验证 check_review_stamp.py 的「内容相等」判据在评审产物豁免下的行为：
A. 纯评审档案 commit（内容 commit 之后落盘）→ 应通过（v7.1 起评审后置落盘的正常形态）
B. 在豁免目录塞入代码（tools/raw/evil.py）→ 应拒绝（防藏代码绕过）
C. 代码 + 档案混合 commit → 应拒绝（防止把未评审内容混进档案提交）
"""
import os
import shutil
import subprocess
import tempfile

STAMP_TEMPLATE = """# 复核凭证 (Review Stamp)

## 已批准的内容基线

| Commit SHA | 复核轮次 | 复核日期 | 复核报告章节 | 状态 |
|------------|----------|----------|--------------|------|
| {sha} | 测试轮（gate-exempt 回归） | 2026-10-22 | pytest 构造 | ✅ 已批准 | 依据 test |
"""


def _git(repo, *args):
    return subprocess.run(["git", "-C", repo] + list(args),
                          capture_output=True, text=True, check=True)


def _setup_repo():
    """构造：c1=内容 commit；stamp 批准 c1。返回 (repo, c1_sha)。"""
    tmp = tempfile.mkdtemp(prefix="gate_exempt_")
    _git(tmp, "init", "-q")
    _git(tmp, "config", "user.email", "test@test")
    _git(tmp, "config", "user.name", "test")
    os.makedirs(os.path.join(tmp, "tools/raw"), exist_ok=True)
    os.makedirs(os.path.join(tmp, "trace/03-会议与日志/DeepSeek评审"), exist_ok=True)
    with open(os.path.join(tmp, "index.html"), "w", encoding="utf-8") as f:
        f.write("<html>content</html>")
    _git(tmp, "add", "index.html")
    _git(tmp, "commit", "-q", "-m", "c1 content")
    c1 = _git(tmp, "rev-parse", "HEAD").stdout.strip()
    # stamp 批准 c1
    with open(os.path.join(tmp, "REVIEW_STAMP.md"), "w", encoding="utf-8") as f:
        f.write(STAMP_TEMPLATE.format(sha=c1[:7]))
    _git(tmp, "add", "REVIEW_STAMP.md")
    _git(tmp, "commit", "-q", "-m", "stamp")
    return tmp


def _run_check(repo):
    return subprocess.run(["python3", os.path.join(
        os.path.dirname(__file__), "..", "tools", "check_review_stamp.py")],
        cwd=repo, capture_output=True, text=True)


def _cleanup(tmp):
    shutil.rmtree(tmp, ignore_errors=True)


def test_纯档案commit通过():
    repo = _setup_repo()
    try:
        f = os.path.join(repo, "trace/03-会议与日志/DeepSeek评审/2026-10-22-test.md")
        with open(f, "w", encoding="utf-8") as fh:
            fh.write("---\nid: PF-RV-TEST\nstatus: adopted\n---\n")
        _git(repo, "add", "trace/03-会议与日志/DeepSeek评审/2026-10-22-test.md")
        _git(repo, "commit", "-q", "-m", "review archive")
        r = _run_check(repo)
        assert r.returncode == 0, f"纯档案 commit 应通过，实际 rc={r.returncode}: {r.stdout}{r.stderr}"
    finally:
        _cleanup(repo)


def test_豁免目录藏代码拒绝():
    repo = _setup_repo()
    try:
        with open(os.path.join(repo, "tools/raw/evil.py"), "w", encoding="utf-8") as fh:
            fh.write("print('evil')\n")
        _git(repo, "add", "tools/raw/evil.py")
        _git(repo, "commit", "-q", "-m", "sneak code")
        r = _run_check(repo)
        assert r.returncode != 0, "tools/raw/ 下塞代码应被拒绝"
    finally:
        _cleanup(repo)


def test_代码档案混合commit拒绝():
    repo = _setup_repo()
    try:
        f = os.path.join(repo, "trace/03-会议与日志/DeepSeek评审/x.md")
        with open(f, "w", encoding="utf-8") as fh:
            fh.write("archive")
        with open(os.path.join(repo, "index.html"), "a", encoding="utf-8") as fh:
            fh.write("<!-- unreviewed change -->")
        _git(repo, "add", "-A")
        _git(repo, "commit", "-q", "-m", "mixed commit")
        r = _run_check(repo)
        assert r.returncode != 0, "代码+档案混合 commit 应被拒绝"
    finally:
        _cleanup(repo)
