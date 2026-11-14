# -*- coding: utf-8 -*-
"""LPR 浮动计息与蒙特卡洛路径模拟（最小可复用模块）。

用途：企业流贷/按揭等浮动利率负债的
  1) 按 Actual/360 逐日计息
  2) LPR 重定价（计息与模拟接口固定每年 1 月 1 日）
  3) 随机游走假设下的示意利息分布（独立于 demo/ 的 Vasicek 原型）

利率用小数（0.03=3%），本金用元，加点用 bp。区间左闭右开。
只支持本金不变、Actual/360；不建模摊还、季/月付息及节假日扣款。
lpr_reset_dates 辅助函数可单独生成周年日，但计息与模拟接口不提供该模式。

说明：这是教学/研究用原型，不构成任何投资或财务建议；参数需按实际合同校准。
"""
from __future__ import annotations

import datetime as _dt
import math
from dataclasses import dataclass
from typing import List, Sequence

import numpy as np


def _number(value: float, name: str, *, positive: bool = False) -> None:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f"{name} must be finite")
    if value < 0 or (positive and value == 0):
        raise ValueError(f"{name} must be {'positive' if positive else 'non-negative'}")


def _dates(start: _dt.date, end: _dt.date, *, allow_equal: bool = False) -> None:
    if type(start) is not _dt.date or type(end) is not _dt.date:
        raise ValueError("start/end must be datetime.date values")
    if end < start or (end == start and not allow_equal):
        raise ValueError("end must be after start")


@dataclass
class Loan:
    principal: float          # 本金（元）
    start: _dt.date           # 放款日
    end: _dt.date             # 到期日
    spread_bp: float = 0.0    # 加点（基点，100bp = 1%）
    day_count: str = "actual/360"

    def __post_init__(self) -> None:
        _number(self.principal, "principal", positive=True)
        _number(self.spread_bp, "spread_bp")
        _dates(self.start, self.end)
        if not isinstance(self.day_count, str) or self.day_count.lower() != "actual/360":
            raise ValueError("only Actual/360 is supported")


def _days(d1: _dt.date, d2: _dt.date) -> int:
    return (d2 - d1).days


def interest_actual_360(principal: float, rate: float, start: _dt.date, end: _dt.date) -> float:
    """Actual/360 单段利息。"""
    _number(principal, "principal", positive=True)
    _number(rate, "rate")
    _dates(start, end, allow_equal=True)
    return principal * (rate + 0.0) * _days(start, end) / 360.0


def lpr_reset_dates(start: _dt.date, end: _dt.date, anniversary: bool = False) -> List[_dt.date]:
    """返回重定价日：默认每年 1 月 1 日；anniversary=True 时按放款日周年。"""
    _dates(start, end)
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

    lpr: [(报价生效日, LPR 小数年利率)]，至少一条生效日不晚于放款日。
    重定价时取当时最新已生效报价，后续无新报价时沿用，拒绝空值与重复日期。
    """
    loan.__post_init__()
    if not lpr:
        raise ValueError("lpr must not be empty")
    for date, rate in lpr:
        if type(date) is not _dt.date:
            raise ValueError("LPR effective dates must be datetime.date")
        _number(rate, "LPR rate")
    points = sorted(lpr)
    if len({d for d, _ in points}) != len(points):
        raise ValueError("duplicate LPR effective dates")
    if points[0][0] > loan.start:
        raise ValueError("LPR quotes must cover the loan start")
    resets = [loan.start] + lpr_reset_dates(loan.start, loan.end) + [loan.end]
    out = []
    for i in range(len(resets) - 1):
        s, e = resets[i], resets[i + 1]
        rate = next(r for d, r in reversed(points) if d <= s)
        out.append({
            "from": s.isoformat(), "to": e.isoformat(), "days": _days(s, e),
            "annual_rate": round(rate + loan.spread_bp / 10000.0, 6),
            "interest": round(interest_actual_360(loan.principal, rate + loan.spread_bp / 10000.0, s, e), 2),
        })
    return out


def simulate_total_interest(loan: Loan, lpr0: float, sigma: float = 0.0035,
                            years: int = 3, paths: int = 10000, seed: int = 42) -> dict:
    """在 LPR 随机游走假设下，估算总利息分布（仅原型用）。"""
    loan.__post_init__()
    _number(lpr0, "lpr0")
    _number(sigma, "sigma")
    for value, name in [(years, "years"), (paths, "paths")]:
        if type(value) is not int or value <= 0:
            raise ValueError(f"{name} must be a positive integer")
    reset_dates = lpr_reset_dates(loan.start, loan.end)
    if years < len(reset_dates):
        raise ValueError("years must cover every repricing date in the loan term")
    rng = np.random.default_rng(seed)
    shocks = rng.normal(0, sigma, size=(paths, years))
    results = np.zeros(paths)
    for p in range(paths):
        rate = lpr0
        pts = [(loan.start, rate)]
        for i, d in enumerate(reset_dates):
            rate = max(0.0, rate + shocks[p, i])
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
