# -*- coding: utf-8 -*-
"""
LPR 蒙特卡洛路径模拟 —— 精算方法演示
======================================
借鉴随机利率模型的均值回复思想（CIR / Vasicek 类）：
    r_{t+1} = r_t + κ(θ - r_t) · Δt + σ · √Δt · ε

- θ: 长期利率中枢（演示设定 2.7%，依据日韩低利率轨迹 + 国内机构 2026 共识外推）
- κ: 均值回复速度（演示设定，非市场校准）
- σ: 波动率（由 2019 年 LPR 改革后 1Y LPR 历史调整序列估计）

⚠️ 诚实标注：
1. θ / κ 为演示设定，非市场校准参数
2. σ 用 2019 改革后 1Y LPR 序列估计（调整间隔非均匀，为近似估计）
3. 5Y 模拟的 θ=3.0% / κ=0.25 / σ=0.22 均为叙事假设（地产政策定向引导 5Y 更快下行），比 1Y 更严格——没有任何一项由历史数据估计；θ5>θ1 保证期限溢价为正、利差收敛不倒挂
4. 本脚本只演示「用概率表达不确定性的精算方法」，输出结果非真实预测

运行：python lpr_monte_carlo.py
输出：demo/lpr_mc_paths.png（抽样路径图）+ demo/lpr_mc_quantiles.csv（未来 60 个月 1Y/5Y 的 10/50/90 分位序列）+ 终端概率分布
"""

import sys
import os

# GBK 控制台兼容：强制 stdout/stderr 使用 UTF-8，避免 ⚠️ 等非 GBK 字符打印崩溃
# （Python 3.7+；.bat 里的 chcp 65001 是另一道保险，双保险覆盖「直接 python 运行」场景）
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

# 中文字体（Windows: Microsoft YaHei / SimHei）
plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_PNG = os.path.join(SCRIPT_DIR, "lpr_mc_paths.png")

# ===== 1. 参数设定 =====
np.random.seed(42)

# LPR 历史序列（1Y，2019-08 改革至今，%）
lpr_hist = [4.25, 3.85, 3.80, 3.70, 3.70, 3.65, 3.55, 3.45, 3.35, 3.10, 3.00, 3.00]

# σ 估计：用历史调整幅度的样本标准差（近似）
diffs = np.diff(lpr_hist)              # 每次调整的绝对变化
sigma = float(np.std(diffs))           # 年化波动率近似（%）
sigma = max(sigma, 0.05)               # 下限保护，避免为 0

theta = 2.7        # 长期中枢（%）：演示设定
kappa = 0.10       # 均值回复速度：演示设定
r0 = lpr_hist[-1]  # 当前 1Y LPR = 3.0%

dt = 1 / 12        # 月步长
years = 5
steps = years * 12 # 60 步
N = 5000           # 路径数

# ===== 2. 蒙特卡洛模拟（1Y） =====
r = np.full((N, steps + 1), r0, dtype=float)
eps = np.random.normal(0, 1, (N, steps))
for t in range(steps):
    r[:, t + 1] = r[:, t] + kappa * (theta - r[:, t]) * dt + sigma * np.sqrt(dt) * eps[:, t]

final = r[:, -1]  # 5 年末的 5000 个 LPR 值

# ===== 2.1 蒙特卡洛模拟（5Y） =====
# 叙事假设（非市场校准）：地产政策定向引导 5Y 更快下行——体现在「距中枢更远 + 回复更快」，
# 长期中枢 θ5=3.0% 保住期限溢价（5Y 恒高于 1Y），利差收敛但不倒挂（Architect 2026-08-15 裁决，decision 记录）
theta5 = 3.0       # 长期中枢（%）：叙事假设，> θ1 保证期限溢价为正
kappa5 = 0.25      # 均值回复速度：叙事假设（快于 1Y 的 0.10 → 更快下行）
sigma5 = 0.22      # 波动率（%）：叙事假设
r0_5 = 3.5         # 当前 5Y LPR
r5 = np.full((N, steps + 1), r0_5, dtype=float)
eps5 = np.random.normal(0, 1, (N, steps))
for t in range(steps):
    r5[:, t + 1] = r5[:, t] + kappa5 * (theta5 - r5[:, t]) * dt + sigma5 * np.sqrt(dt) * eps5[:, t]

final5 = r5[:, -1]  # 5 年末 5Y LPR 分布

# ===== 2.5 分位数序列（未来 60 个月，供图表区间带） =====
q10 = np.percentile(r, 10, axis=0)   # 每月 1Y 的 10% 分位
q50 = np.percentile(r, 50, axis=0)   # 每月 1Y 的中位数（50% 分位）
q90 = np.percentile(r, 90, axis=0)   # 每月 1Y 的 90% 分位
q10_5 = np.percentile(r5, 10, axis=0)  # 每月 5Y 的 10% 分位
q50_5 = np.percentile(r5, 50, axis=0)  # 每月 5Y 的中位数
q90_5 = np.percentile(r5, 90, axis=0)  # 每月 5Y 的 90% 分位

# 未来月份标签：2026-08 起 60 个月（t=1..60）
import datetime as _dt
start = _dt.date(2026, 8, 1)
month_labels = [(start + _dt.timedelta(days=30 * m)).strftime("%Y-%m") for m in range(1, steps + 1)]

# CSV 导出（供图表/复盘使用）
OUT_CSV = os.path.join(SCRIPT_DIR, "lpr_mc_quantiles.csv")
with open(OUT_CSV, "w", encoding="utf-8") as f:
    f.write("month,q10,q50,q90,q10_5y,q50_5y,q90_5y\n")
    for m in range(1, steps + 1):
        f.write(f"{month_labels[m-1]},{q10[m]:.4f},{q50[m]:.4f},{q90[m]:.4f},"
                f"{q10_5[m]:.4f},{q50_5[m]:.4f},{q90_5[m]:.4f}\n")

# ===== 3. 概率分布 =====
p_lt_25 = float(np.mean(final < 2.5) * 100)
p_25_30 = float(np.mean((final >= 2.5) & (final < 3.0)) * 100)
p_gt_30 = float(np.mean(final >= 3.0) * 100)
mean_final = float(np.mean(final))

print("=" * 56)
print("LPR 蒙特卡洛路径模拟结果（演示）")
print("=" * 56)
print(f"1Y 参数：θ={theta}% κ={kappa} σ≈{sigma:.3f}% r0={r0}%")
print(f"5Y 参数：θ={theta5}% κ={kappa5} σ={sigma5}% r0={r0_5}% （叙事假设，非市场校准）")
print(f"公共：N={N} 条  T={years} 年")
print("-" * 56)
print(f"5 年后 1Y LPR 概率分布：")
print(f"  P(LPR < 2.5%)    = {p_lt_25:.1f}%")
print(f"  P(2.5% ≤ LPR < 3.0%) = {p_25_30:.1f}%")
print(f"  P(LPR ≥ 3.0%)    = {p_gt_30:.1f}%")
print(f"  期望 E(LPR)       ≈ {mean_final:.2f}%")
print("-" * 56)
p5_lt_30 = float(np.mean(final5 < 3.0) * 100)
p5_30_35 = float(np.mean((final5 >= 3.0) & (final5 < 3.5)) * 100)
p5_gt_35 = float(np.mean(final5 >= 3.5) * 100)
mean_final5 = float(np.mean(final5))
print(f"5 年后 5Y LPR 概率分布：")
print(f"  P(LPR < 3.0%)    = {p5_lt_30:.1f}%")
print(f"  P(3.0% ≤ LPR < 3.5%) = {p5_30_35:.1f}%")
print(f"  P(LPR ≥ 3.5%)    = {p5_gt_35:.1f}%")
print(f"  期望 E(LPR)       ≈ {mean_final5:.2f}%")
print("-" * 56)
print("未来 60 个月分位数序列（10% / 50% / 90%）：")
for m in range(1, steps + 1, 6):   # 每 6 个月打印一行（供快速核对）
    print(f"  {month_labels[m-1]}  1Y: q10={q10[m]:.2f}% q50={q50[m]:.2f}% q90={q90[m]:.2f}%  "
          f"5Y: q10={q10_5[m]:.2f}% q50={q50_5[m]:.2f}% q90={q90_5[m]:.2f}%")
print(f"  完整序列已导出 {OUT_CSV}")
print("-" * 56)
print("⚠️ 参数为演示设定，结果仅演示精算方法，非真实预测")
print("=" * 56)

# ===== 4. 路径图 =====
fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))

# 左图：抽样 100 条路径
sample = r[np.random.choice(N, 100, replace=False), :]
t_axis = np.arange(steps + 1) / 12
for path in sample:
    axes[0].plot(t_axis, path, lw=0.4, alpha=0.15, color="#6d7cff")
axes[0].axhline(theta, color="#f87171", ls="--", lw=1.2)
axes[0].text(4.55, theta + 0.06, f"长期中枢 θ={theta}%", color="#f87171", fontsize=9, ha="right")
axes[0].axhline(r0, color="#4fd1c5", ls=":", lw=1.2)
axes[0].text(0.05, r0 + 0.05, f"当前 {r0}%", color="#4fd1c5", fontsize=9)
axes[0].set_title("100 条抽样利率路径", fontsize=11)
axes[0].set_xlabel("年份", fontsize=10)
axes[0].set_ylabel("1Y LPR (%)", fontsize=10)
axes[0].set_ylim(1.0, 4.0)

# 右图：5 年末分布直方图（1Y + 5Y 对比）
axes[1].hist(final, bins=40, color="#6d7cff", alpha=0.75, edgecolor="none", label="1Y LPR")
axes[1].hist(final5, bins=40, color="#4fd1c5", alpha=0.55, edgecolor="none", label="5Y LPR")
axes[1].axvline(2.5, color="#f87171", ls="--", lw=1.2)
axes[1].axvline(3.0, color="#f87171", ls="--", lw=1.2)
axes[1].axvline(3.5, color="#4fd1c5", ls="--", lw=1.2)
axes[1].text(2.52, axes[1].get_ylim()[1] * 0.92, f"<2.5%: {p_lt_25:.1f}%", color="#f87171", fontsize=9)
axes[1].text(2.72, axes[1].get_ylim()[1] * 0.72, f"2.5-3.0%: {p_25_30:.1f}%", color="#e8eaf0", fontsize=9)
axes[1].text(3.02, axes[1].get_ylim()[1] * 0.92, f">3.0%: {p_gt_30:.1f}%", color="#4fd1c5", fontsize=9)
axes[1].text(3.10, axes[1].get_ylim()[1] * 0.52, f"5Y 期望 {mean_final5:.2f}%", color="#4fd1c5", fontsize=9)
axes[1].axvline(mean_final, color="#fbbf24", ls="-.", lw=1.5)
axes[1].text(mean_final + 0.02, axes[1].get_ylim()[1] * 0.5, f"1Y 均值 {mean_final:.2f}%", color="#fbbf24", fontsize=9)
axes[1].legend(loc="upper left", fontsize=9)
axes[1].set_title("5 年后 LPR 概率分布对比（5000 条）", fontsize=11)
axes[1].set_xlabel("LPR (%)", fontsize=10)
axes[1].set_ylabel("路径数", fontsize=10)

fig.suptitle("LPR Monte Carlo Path Simulation (Demo)", fontsize=12, fontweight="bold")
fig.tight_layout(rect=[0, 0, 1, 0.94])
fig.savefig(OUT_PNG, dpi=150, bbox_inches="tight")
plt.close(fig)

print(f"已输出 {OUT_PNG}")
