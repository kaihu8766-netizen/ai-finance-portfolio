"""test_trace_gate.py — gate 回归测试套件（F-20260924-03，PF-RV-20260924-22）

覆盖三闸门全部边界，防止 gate 改坏自己（DeepSeek A-1/A-2/A-3）。

设计约束：
- 用 tmp_path 构造隔离 git 仓库 fixture，TRACE_GATE_ROOT 注入，绝不修改真实仓
- fixture 内断言 ROOT != 真实仓根（杜绝误写真实仓）
- PF-RV 合法性判据 = 档案权威源（phase=scheme 且 status=adopted），与缓存视图无关

运行：cd 项目根 && python3 -m pytest tests/ -v
"""
import os
import re
import subprocess
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TRACE_GATE = PROJECT_ROOT / "tools" / "trace_gate.py"


def _run_gate(env_root: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    env = dict(os.environ)
    env["TRACE_GATE_ROOT"] = str(env_root)
    r = subprocess.run(
        [sys.executable, str(TRACE_GATE), *args],
        capture_output=True, text=True, env=env, cwd=str(env_root),
    )
    if check:
        assert r.returncode in (0, 1), f"gate 崩溃: rc={r.returncode} stderr={r.stderr}"
    return r


@pytest.fixture()
def gate_repo(tmp_path: Path) -> Path:
    """构造隔离的 gate 测试仓：最小目录结构 + 假评审档案 + 假功能登记。"""
    root = tmp_path / "gate_repo"
    root.mkdir()
    # git 初始化 + 最小提交
    subprocess.run(["git", "init", "-q", str(root)], check=True)
    subprocess.run(["git", "-C", str(root), "config", "user.email", "t@t.t"], check=True)
    subprocess.run(["git", "-C", str(root), "config", "user.name", "t"], check=True)
    # 目录结构
    (root / "trace/03-会议与日志/DeepSeek评审").mkdir(parents=True)
    (root / "trace/03-会议与日志/功能登记").mkdir(parents=True)
    (root / "tools").mkdir()
    (root / "tools/raw").mkdir()
    # 假评审档案：F-20260924-03 的 scheme+adopted
    rv = root / "trace/03-会议与日志/DeepSeek评审/2026-09-24-22-F-20260924-03基建改进方案.md"
    rv.write_text(
        "---\nid: PF-RV-20260924-22\nphase: scheme\nfeature: F-20260924-03\nstatus: adopted\ndiff_hash: 0000000000000000\n---\n",
        encoding="utf-8",
    )
    # 索引
    (root / "trace/03-会议与日志/DeepSeek评审/索引.md").write_text(
        "| 序号 | 日期 | 主题 | 结论摘要 | 状态 | 档案 | 原始响应 |\n"
        "| 22 | 2026-09-24 | F-20260924-03基建改进方案 | 见档案 | adopted | 2026-09-24-22-F-20260924-03基建改进方案.md | 见档案 |\n",
        encoding="utf-8",
    )
    # 功能登记
    (root / "trace/03-会议与日志/功能登记/F-20260924-03.md").write_text(
        "# F-20260924-03\n- 状态：已采纳\n", encoding="utf-8")
    # gate_rules.yaml（测试用最小规则）
    (root / "tools/gate_rules.yaml").write_text(
        "rules:\n  gate_self:\n    paths:\n      - \"tools/trace_gate.py\"\n      - \"tools/gate_rules.yaml\"\n      - \"tests/\"\n      - \"REVIEW_STAMP.md\"\n",
        encoding="utf-8",
    )
    # 初始提交（让 git log 可用）
    subprocess.run(["git", "-C", str(root), "add", "-A"], check=True)
    subprocess.run(["git", "-C", str(root), "commit", "-q", "-m", "init"], check=True)
    return root


# ============ 边界断言：ROOT 隔离 ============

def test_root_isolated_from_real_repo(gate_repo: Path):
    """A-1：TRACE_GATE_ROOT 生效，且不等于真实仓根。"""
    real = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True).stdout.strip()
    env = dict(os.environ)
    env["TRACE_GATE_ROOT"] = str(gate_repo)
    out = subprocess.run([sys.executable, str(TRACE_GATE), "classify", "--staged"],
                         capture_output=True, text=True, env=env, cwd=str(gate_repo)).stdout
    assert str(gate_repo) != real
    assert "未命中" in out or "命中" in out  # 能正常执行即 ROOT 注入生效


# ============ 闸门1：cmd_check ID 引用 ============

def test_check_no_id_rejected(gate_repo: Path):
    """无 ID 引用 → exit 1。"""
    r = _run_gate(gate_repo, "check", "--message", "feat: 无ID")
    assert r.returncode == 1
    assert "必须含 ID 引用" in r.stdout or "必须含 ID 引用" in r.stderr


def test_check_bare_rv_rejected(gate_repo: Path):
    """裸 RV- → exit 1（域前缀强制，协作A专用）。"""
    r = _run_gate(gate_repo, "check", "--message", "feat: t (RV-20260923-65)")
    assert r.returncode == 1
    assert "协作A专用" in (r.stdout + r.stderr)


def test_check_valid_pf_rv_passes(gate_repo: Path):
    """合法 PF-RV（档案存在）→ exit 0。"""
    r = _run_gate(gate_repo, "check", "--message", "feat: t (PF-RV-20260924-22)")
    assert r.returncode == 0
    assert "OK" in r.stdout


def test_check_forged_pf_rv_rejected(gate_repo: Path):
    """伪造 PF-RV 号（档案不存在）→ exit 1。"""
    r = _run_gate(gate_repo, "check", "--message", "feat: t (PF-RV-20260924-99)")
    assert r.returncode == 1
    assert "未在评审索引中找到" in (r.stdout + r.stderr)


# ============ 闸门2：check-rv 红线 + diff_hash ============

def test_check_rv_redline_hash_mismatch_rejected(gate_repo: Path):
    """红线文件 staged 但 diff_hash 不匹配（档案 0000000000000000）→ exit 1。"""
    (gate_repo / "tools/trace_gate.py").write_text("# modified\n", encoding="utf-8")
    subprocess.run(["git", "-C", str(gate_repo), "add", "tools/trace_gate.py"], check=True)
    r = _run_gate(gate_repo, "check-rv", "--message", "feat: t (PF-RV-20260924-22)")
    assert r.returncode == 1
    assert "diff_hash" in (r.stdout + r.stderr)


def test_check_rv_non_redline_passes_with_plain_id(gate_repo: Path):
    """非红线文件（trace/ 内）→ 不强制 diff_hash，带常规 ID 即可通过。"""
    (gate_repo / "trace/note.md").write_text("x\n", encoding="utf-8")
    subprocess.run(["git", "-C", str(gate_repo), "add", "trace/note.md"], check=True)
    r = _run_gate(gate_repo, "check-rv", "--message", "docs: t (PF-RV-20260924-22)")
    assert r.returncode == 0


# ============ classify：红线命中面 ============

def test_classify_raw_not_redline(gate_repo: Path):
    """A-3 回归：tools/raw/ 不命中红线（证据面排除）。"""
    (gate_repo / "tools/raw/x.json").write_text("{}", encoding="utf-8")
    subprocess.run(["git", "-C", str(gate_repo), "add", "tools/raw/x.json"], check=True)
    r = _run_gate(gate_repo, "classify", "--staged")
    assert "未命中" in r.stdout


def test_classify_gate_script_redline(gate_repo: Path):
    """门禁脚本改动命中 gate_self。"""
    (gate_repo / "tools/trace_gate.py").write_text("# m\n", encoding="utf-8")
    subprocess.run(["git", "-C", str(gate_repo), "add", "tools/trace_gate.py"], check=True)
    r = _run_gate(gate_repo, "classify", "--staged")
    assert "gate_self" in r.stdout


def test_classify_tests_dir_redline(gate_repo: Path):
    """A-3：tests/ 目录改动命中 gate_self（测试文件本身受保护）。"""
    (gate_repo / "tests").mkdir(exist_ok=True)
    (gate_repo / "tests/t.py").write_text("# m\n", encoding="utf-8")
    subprocess.run(["git", "-C", str(gate_repo), "add", "tests/t.py"], check=True)
    r = _run_gate(gate_repo, "classify", "--staged")
    assert "gate_self" in r.stdout


# ============ 闸门3：check-scheme 功能提交 ============

def test_check_scheme_feat_requires_scheme_rv(gate_repo: Path):
    """功能提交（feat:）必须有已批准 scheme-RV（22 已 adopted → 通过）。"""
    r = _run_gate(gate_repo, "check-scheme", "--message", "feat: t (F-20260924-03, PF-RV-20260924-22)")
    assert r.returncode == 0


def test_check_scheme_feat_no_scheme_rejected(gate_repo: Path):
    """功能提交引用无方案评审的 F-ID → exit 1。"""
    # 建一个没有 scheme-RV 的 F 登记（模拟未评审功能）
    (gate_repo / "trace/03-会议与日志/功能登记/F-20260924-99.md").write_text(
        "# F-20260924-99\n- 状态：未评审\n", encoding="utf-8")
    r = _run_gate(gate_repo, "check-scheme", "--message", "feat: t (F-20260924-99)")
    assert r.returncode == 1
    assert "已批准方案评审" in (r.stdout + r.stderr)


def test_check_scheme_docs_skipped(gate_repo: Path):
    """非功能提交（docs:）→ 跳过 scheme 校验。"""
    r = _run_gate(gate_repo, "check-scheme", "--message", "docs: t (PF-RV-20260924-22)")
    assert r.returncode == 0
