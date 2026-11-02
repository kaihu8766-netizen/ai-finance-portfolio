# -*- coding: utf-8 -*-
"""LPR 浮动计息与蒙特卡洛路径模拟（最小可复用模块）。

用途：企业流贷/按揭等浮动利率负债的
  1) 按 Actual/360 逐日计息
  2) LPR 重定价（每年 1 月 1 日或放款日调整）
  3) 蒙特卡洛利率路径下的利息分布估算

说明：这是教学/研究用原型，不构成任何投资或财务建议；参数需按实际合同校准。
"""
from __future__ import annotations

import datetime as _dt
from dataclasses import dataclass
from typing import Iterable, List, Sequence

import numpy as np


@dataclass
class Loan:
    principal: float          # 本金（元）
    start: _dt.date           # 放款日
    end: _dt.date             # 到期日
    spread_bp: float = 0.0    # 加点（基点，100bp = 1%）
    day_count: str = "actual/360"


def _days(d1: _dt.date, d2: _dt.date) -> int:
    return (d2 - d1).days


def interest_actual_360(principal: float, rate: float, start: _dt.date, end: _dt.date) -> float:
    """Actual/360 单段利息。"""
    return principal * (rate + 0.0) * _days(start, end) / 360.0


def lpr_reset_dates(start: _dt.date, end: _dt.date, anniversary: bool = False) -> List[_dt.date]:
    """返回重定价日：默认每年 1 月 1 日；anniversary=True 时按放款日周年。"""
    dates = []
    y = start.year + (1 if anniversary else 0)
    if not anniversary:
        d = _dt.date(start.year + 1, 1, 1)
        while d < end:
            dates.append(d)
            d = _dt.date(d.year + 1, 1, 1)
        return dates
    while True:
        try:
            d = start.replace(year=y)
        except ValueError:  # 2/29
            d = start.replace(year=y, day=28)
        if d >= end:
            break
        dates.append(d)
        y += 1
    return dates


def schedule_interest(loan: Loan, lpr: Sequence[tuple[_dt.date, float]]) -> List[dict]:
    """按重定价日切段计息。

    lpr: [(生效日, LPR 年化利率)]，需覆盖放款日至到期日。
    """
    points = sorted(lpr)
    resets = [loan.start] + lpr_reset_dates(loan.start, loan.end) + [loan.end]
    out = []
    for i in range(len(resets) - 1):
        s, e = resets[i], resets[i + 1]
        rate = next((r for d, r in reversed(points) if d <= s), points[0][1])
        out.append({
            "from": s.isoformat(), "to": e.isoformat(), "days": _days(s, e),
            "annual_rate": round(rate + loan.spread_bp / 10000.0, 6),
            "interest": round(interest_actual_360(loan.principal, rate + loan.spread_bp / 10000.0, s, e), 2),
        })
    return out


def simulate_total_interest(loan: Loan, lpr0: float, sigma: float = 0.0035,
                            years: int = 3, paths: int = 10000, seed: int = 42) -> dict:
    """在 LPR 随机游走假设下，估算总利息分布（仅原型用）。"""
    rng = np.random.default_rng(seed)
    shocks = rng.normal(0, sigma, size=(paths, years))
    results = np.zeros(paths)
    for p in range(paths):
        rate = lpr0
        pts = [(loan.start, rate)]
        d = loan.start
        for _ in range(years):
            rate = max(0.0, rate + shocks[p, _])
            d = _dt.date(d.year + 1, 1, 1)
            if d >= loan.end:
                break
            pts.append((d, rate))
        res = schedule_interest(loan, pts)
        results[p] = sum(x["interest"] for x in res)
    return {
        "paths": paths,
        "mean": float(np.mean(results)),
        "p05": float(np.percentile(results, 5)),
        "p50": float(np.percentile(results, 50)),
        "p95": float(np.percentile(results, 95)),
    }


if __name__ == "__main__":
    loan = Loan(principal=100_000_000, start=_dt.date(2026, 1, 1), end=_dt.date(2029, 1, 1), spread_bp=50)
    sched = schedule_interest(loan, [(_dt.date(2026, 1, 1), 0.0345)])
    print("各计息段:", sched[:2], "...")
    print("蒙特卡洛:", simulate_total_interest(loan, 0.0345))
