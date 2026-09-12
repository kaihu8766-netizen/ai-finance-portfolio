# -*- coding: utf-8 -*-
"""
LPR Monte Carlo Path Simulation — Actuarial Method Demo
=======================================================
Inspired by the Vasicek (Ornstein-Uhlenbeck) mean-reverting short-rate model:
    r_{t+1} = r_t + kappa(theta - r_t) * dt + sigma * sqrt(dt) * epsilon
(The CIR family differs by its square-root diffusion term, sigma*sqrt(r_t).)

- theta: long-term rate mean (demo setting 2.7%, based on Japan/Korea low-rate trajectory + domestic institution 2026 consensus extrapolation)
- kappa: mean-reversion speed (demo setting, not market-calibrated)
- sigma: volatility (estimated from 1Y LPR historical adjustment series since 2019 reform)

Honest disclosure:
1. theta / kappa are demo settings, not market-calibrated parameters
2. sigma estimated from post-2019 reform 1Y LPR series (non-uniform adjustment intervals, approximate estimate)
3. 5Y simulation theta=3.0% / kappa=0.25 / sigma=0.22 are all narrative assumptions (property policy targeted guidance for 5Y faster decline), stricter than 1Y — none estimated from historical data; theta5 > theta1 ensures positive term premium, spread converges but does not invert
4. This script only demonstrates "actuarial method of expressing uncertainty with probability", output is not a real forecast

Usage: python lpr_monte_carlo.py
Output: demo/lpr_mc_paths.png (sampled path chart) + demo/lpr_mc_quantiles.csv (10/50/90 percentile series for next 60 months 1Y/5Y) + terminal probability distribution
"""

import sys
import os

# GBK console compatibility: force stdout/stderr to UTF-8, avoid crash printing non-GBK chars like emoji
# (Python 3.7+; chcp 65001 in .bat is another layer of insurance, dual coverage for "direct python run" scenario)
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Chinese font (Windows: Microsoft YaHei / SimHei)
plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_PNG = os.path.join(SCRIPT_DIR, "lpr_mc_paths.png")

# ===== 1. Parameter Setup =====
np.random.seed(42)

# LPR historical series (1Y, since 2019-08 reform, %)
lpr_hist = [4.25, 3.85, 3.80, 3.70, 3.70, 3.65, 3.55, 3.45, 3.35, 3.10, 3.00, 3.00]

# sigma estimation: sample std of historical adjustment magnitudes (approximate)
diffs = np.diff(lpr_hist)              # absolute change per adjustment
sigma = float(np.std(diffs))           # dispersion of per-adjustment changes (proxy only; NOT annualized)
sigma = max(sigma, 0.05)               # floor protection, avoid zero

theta = 2.7        # long-term mean (%): demo setting
kappa = 0.10       # mean-reversion speed: demo setting
r0 = lpr_hist[-1]  # current 1Y LPR = 3.0%

dt = 1 / 12        # monthly step
years = 5
steps = years * 12 # 60 steps
N = 5000           # number of paths

# ===== 2. Monte Carlo Simulation (1Y) =====
r = np.full((N, steps + 1), r0, dtype=float)
eps = np.random.normal(0, 1, (N, steps))
for t in range(steps):
    r[:, t + 1] = r[:, t] + kappa * (theta - r[:, t]) * dt + sigma * np.sqrt(dt) * eps[:, t]

final = r[:, -1]  # 5000 LPR values at year 5

# ===== 2.1 Monte Carlo Simulation (5Y) =====
# Narrative assumption (not market-calibrated): property policy targeted guidance for 5Y faster decline — reflected in "further from mean + faster reversion",
# long-term mean theta5=3.0% preserves term premium (5Y always above 1Y), spread converges but does not invert
theta5 = 3.0       # long-term mean (%): narrative assumption, > theta1 ensures positive term premium
kappa5 = 0.25      # mean-reversion speed: narrative assumption (faster than 1Y's 0.10 -> faster decline)
sigma5 = 0.22      # volatility (%): narrative assumption
r0_5 = 3.5         # current 5Y LPR
r5 = np.full((N, steps + 1), r0_5, dtype=float)
eps5 = np.random.normal(0, 1, (N, steps))
for t in range(steps):
    r5[:, t + 1] = r5[:, t] + kappa5 * (theta5 - r5[:, t]) * dt + sigma5 * np.sqrt(dt) * eps5[:, t]

final5 = r5[:, -1]  # 5Y LPR distribution at year 5

# ===== 2.5 Quantile Series (next 60 months, for chart confidence bands) =====
q10 = np.percentile(r, 10, axis=0)   # monthly 1Y 10th percentile
q50 = np.percentile(r, 50, axis=0)   # monthly 1Y median (50th percentile)
q90 = np.percentile(r, 90, axis=0)   # monthly 1Y 90th percentile
q10_5 = np.percentile(r5, 10, axis=0)  # monthly 5Y 10th percentile
q50_5 = np.percentile(r5, 50, axis=0)  # monthly 5Y median
q90_5 = np.percentile(r5, 90, axis=0)  # monthly 5Y 90th percentile

# Future month labels: 60 months from 2026-08 (t=1..60)
import datetime as _dt
start = _dt.date(2026, 8, 1)
month_labels = [(start + _dt.timedelta(days=30 * m)).strftime("%Y-%m") for m in range(1, steps + 1)]

# CSV export (for chart / review use)
OUT_CSV = os.path.join(SCRIPT_DIR, "lpr_mc_quantiles.csv")
with open(OUT_CSV, "w", encoding="utf-8") as f:
    f.write("month,q10,q50,q90,q10_5y,q50_5y,q90_5y\n")
    for m in range(1, steps + 1):
        f.write(f"{month_labels[m-1]},{q10[m]:.4f},{q50[m]:.4f},{q90[m]:.4f},"
                f"{q10_5[m]:.4f},{q50_5[m]:.4f},{q90_5[m]:.4f}\n")

# ===== 3. Probability Distribution =====
p_lt_25 = float(np.mean(final < 2.5) * 100)
p_25_30 = float(np.mean((final >= 2.5) & (final < 3.0)) * 100)
p_gt_30 = float(np.mean(final >= 3.0) * 100)
mean_final = float(np.mean(final))

print("=" * 56)
print("LPR Monte Carlo Path Simulation Results (Demo)")
print("=" * 56)
print(f"1Y params: theta={theta}% kappa={kappa} sigma~{sigma:.3f}% r0={r0}%")
print(f"5Y params: theta={theta5}% kappa={kappa5} sigma={sigma5}% r0={r0_5}% (narrative assumption, not market-calibrated)")
print(f"Common: N={N} paths  T={years} years")
print("-" * 56)
print(f"1Y LPR probability distribution after 5 years:")
print(f"  P(LPR < 2.5%)    = {p_lt_25:.1f}%")
print(f"  P(2.5% <= LPR < 3.0%) = {p_25_30:.1f}%")
print(f"  P(LPR >= 3.0%)    = {p_gt_30:.1f}%")
print(f"  E[LPR]            ~ {mean_final:.2f}%")
print("-" * 56)
p5_lt_30 = float(np.mean(final5 < 3.0) * 100)
p5_30_35 = float(np.mean((final5 >= 3.0) & (final5 < 3.5)) * 100)
p5_gt_35 = float(np.mean(final5 >= 3.5) * 100)
mean_final5 = float(np.mean(final5))
print(f"5Y LPR probability distribution after 5 years:")
print(f"  P(LPR < 3.0%)    = {p5_lt_30:.1f}%")
print(f"  P(3.0% <= LPR < 3.5%) = {p5_30_35:.1f}%")
print(f"  P(LPR >= 3.5%)    = {p5_gt_35:.1f}%")
print(f"  E[LPR]            ~ {mean_final5:.2f}%")
print("-" * 56)
print("Quantile series for next 60 months (10% / 50% / 90%):")
for m in range(1, steps + 1, 6):   # print every 6 months (for quick verification)
    print(f"  {month_labels[m-1]}  1Y: q10={q10[m]:.2f}% q50={q50[m]:.2f}% q90={q90[m]:.2f}%  "
          f"5Y: q10={q10_5[m]:.2f}% q50={q50_5[m]:.2f}% q90={q90_5[m]:.2f}%")
print(f"  Full series exported to {OUT_CSV}")
print("-" * 56)
print("Note: parameters are demo settings, results only demonstrate actuarial method, not real forecast")
print("=" * 56)

# ===== 4. Path Chart =====
fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))

# Left: 100 sampled paths
sample = r[np.random.choice(N, 100, replace=False), :]
t_axis = np.arange(steps + 1) / 12
for path in sample:
    axes[0].plot(t_axis, path, lw=0.4, alpha=0.15, color="#6d7cff")
axes[0].axhline(theta, color="#f87171", ls="--", lw=1.2)
axes[0].text(4.55, theta + 0.06, f"Long-term mean theta={theta}%", color="#f87171", fontsize=9, ha="right")
axes[0].axhline(r0, color="#4fd1c5", ls=":", lw=1.2)
axes[0].text(0.05, r0 + 0.05, f"Current {r0}%", color="#4fd1c5", fontsize=9)
axes[0].set_title("100 Sampled Interest Rate Paths", fontsize=11)
axes[0].set_xlabel("Years", fontsize=10)
axes[0].set_ylabel("1Y LPR (%)", fontsize=10)
axes[0].set_ylim(1.0, 4.0)

# Right: 5-year distribution histogram (1Y + 5Y comparison)
axes[1].hist(final, bins=40, color="#6d7cff", alpha=0.75, edgecolor="none", label="1Y LPR")
axes[1].hist(final5, bins=40, color="#4fd1c5", alpha=0.55, edgecolor="none", label="5Y LPR")
axes[1].axvline(2.5, color="#f87171", ls="--", lw=1.2)
axes[1].axvline(3.0, color="#f87171", ls="--", lw=1.2)
axes[1].axvline(3.5, color="#4fd1c5", ls="--", lw=1.2)
axes[1].text(2.52, axes[1].get_ylim()[1] * 0.92, f"<2.5%: {p_lt_25:.1f}%", color="#f87171", fontsize=9)
axes[1].text(2.72, axes[1].get_ylim()[1] * 0.72, f"2.5-3.0%: {p_25_30:.1f}%", color="#e8eaf0", fontsize=9)
axes[1].text(3.02, axes[1].get_ylim()[1] * 0.92, f">3.0%: {p_gt_30:.1f}%", color="#4fd1c5", fontsize=9)
axes[1].text(3.10, axes[1].get_ylim()[1] * 0.52, f"5Y mean {mean_final5:.2f}%", color="#4fd1c5", fontsize=9)
axes[1].axvline(mean_final, color="#fbbf24", ls="-.", lw=1.5)
axes[1].text(mean_final + 0.02, axes[1].get_ylim()[1] * 0.5, f"1Y mean {mean_final:.2f}%", color="#fbbf24", fontsize=9)
axes[1].legend(loc="upper left", fontsize=9)
axes[1].set_title("LPR Probability Distribution After 5 Years (5000 paths)", fontsize=11)
axes[1].set_xlabel("LPR (%)", fontsize=10)
axes[1].set_ylabel("Path Count", fontsize=10)

fig.suptitle("LPR Monte Carlo Path Simulation (Demo)", fontsize=12, fontweight="bold")
fig.tight_layout(rect=[0, 0, 1, 0.94])
fig.savefig(OUT_PNG, dpi=150, bbox_inches="tight")
plt.close(fig)

print(f"Output saved to {OUT_PNG}")
