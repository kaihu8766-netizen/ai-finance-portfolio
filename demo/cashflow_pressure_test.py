"""
现金流压力测试模拟器
对应作品：w07 集团现金流压力测试与现金调度决策系统
方法：多变量随机建模 + 蒙特卡洛模拟 + 流动性VaR
"""

import numpy as np
import pandas as pd
from scipy import stats
from dataclasses import dataclass
from typing import List, Tuple


@dataclass
class CashFlowParams:
    """现金流模型参数"""
    opening_cash: float = 8000  # 期初现金（万元）
    monthly_inflow_mean: float = 6000  # 月均流入
    monthly_inflow_std: float = 800  # 流入标准差
    monthly_outflow_mean: float = 4500  # 月均支出
    monthly_outflow_std: float = 500  # 支出标准差
    collection_rate_mean: float = 0.85  # 回款率均值
    collection_rate_std: float = 0.08  # 回款率标准差
    months: int = 12  # 预测月数
    simulations: int = 10000  # 模拟次数
    confidence_level: float = 0.95  # 置信度


def simulate_cashflow(params: CashFlowParams) -> pd.DataFrame:
    """蒙特卡洛模拟现金流路径"""
    np.random.seed(42)
    results = []

    for sim in range(params.simulations):
        balance = params.opening_cash
        path = [balance]

        for month in range(params.months):
            # 回款率：Beta分布（均值0.85，标准差0.08）
            alpha = ((1 - params.collection_rate_mean) / params.collection_rate_std**2 - 1 / params.collection_rate_mean) * params.collection_rate_mean**2
            beta = alpha * (1 / params.collection_rate_mean - 1)
            collection_rate = np.random.beta(alpha, beta)

            # 流入：对数正态分布
            inflow = np.random.lognormal(
                mean=np.log(params.monthly_inflow_mean * collection_rate),
                sigma=params.monthly_inflow_std / params.monthly_inflow_mean
            )

            # 支出：正态分布
            outflow = np.random.normal(
                params.monthly_outflow_mean,
                params.monthly_outflow_std
            )

            balance += inflow - outflow
            path.append(balance)

        results.append(path)

    return pd.DataFrame(results).T


def calculate_var(paths: pd.DataFrame, confidence_level: float = 0.95) -> dict:
    """计算流动性VaR"""
    final_balances = paths.iloc[-1]
    var_percentile = (1 - confidence_level) * 100
    var_value = np.percentile(final_balances, var_percentile)
    expected_shortfall = final_balances[final_balances <= var_value].mean()

    return {
        'mean_balance': final_balances.mean(),
        'median_balance': final_balances.median(),
        f'VaR_{int(confidence_level*100)}': var_value,
        f'ES_{int(confidence_level*100)}': expected_shortfall,
        'probability_deficit': (final_balances < 0).mean()
    }


def run_stress_test(scenario: str = 'base') -> dict:
    """压力测试：三种情景"""
    params = CashFlowParams()

    if scenario == 'mild_recession':
        params.monthly_inflow_mean *= 0.85
        params.collection_rate_mean = 0.75
    elif scenario == 'severe_recession':
        params.monthly_inflow_mean *= 0.70
        params.collection_rate_mean = 0.65
        params.monthly_outflow_mean *= 1.10

    paths = simulate_cashflow(params)
    metrics = calculate_var(paths, params.confidence_level)
    metrics['scenario'] = scenario
    return metrics


if __name__ == '__main__':
    print("=" * 60)
    print("现金流压力测试 - 蒙特卡洛模拟")
    print("=" * 60)

    for scenario in ['base', 'mild_recession', 'severe_recession']:
        result = run_stress_test(scenario)
        print(f"\n【{scenario}】")
        print(f"  期末现金均值: {result['mean_balance']:.0f} 万元")
        print(f"  期末现金中位数: {result['median_balance']:.0f} 万元")
        print(f"  95% VaR: {result['VaR_95']:.0f} 万元")
        print(f"  95% ES: {result['ES_95']:.0f} 万元")
        print(f"  资金缺口概率: {result['probability_deficit']*100:.1f}%")
