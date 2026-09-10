"""
供应链金融资金流分析
对应作品：w05 供应链金融资金流分析与AI预测模型
方法：资金归集建模、账期错配诊断、委贷定价分析
"""

import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import List, Dict


@dataclass
class SupplyChainParams:
    """供应链金融参数"""
    monthly_purchase: float = 5000  # 月均采购（万元）
    accounts_reivable_days: int = 90  # 应收账期
    accounts_payable_days: int = 60  # 应付账期
    loan_amount: float = 20000  # 委贷规模（万元）
    loan_rate: float = 0.045  # 委贷利率（年化）
    bank_channel_fee: float = 0.001  # 银行通道费率
    risk_premium: float = 0.015  # 信用风险溢价


def calculate_mismatch(params: SupplyChainParams) -> dict:
    """计算账期错配"""
    # 账期错配天数
    mismatch_days = params.accounts_reivable_days - params.accounts_payable_days

    # 资金缺口 = 月均采购 * 错配天数 / 30
    funding_gap = params.monthly_purchase * mismatch_days / 30

    # 资金占用成本
    occupancy_cost = funding_gap * params.loan_rate * mismatch_days / 365

    return {
        'mismatch_days': mismatch_days,
        'funding_gap': funding_gap,
        'occupancy_cost': occupancy_cost,
        'gap_ratio': funding_gap / params.monthly_purchase
    }


def calculate_entrusted_loan_pricing(params: SupplyChainParams) -> dict:
    """委托贷款定价分析"""
    # 资金成本（集团内部资金成本）
    capital_cost = 0.035  # 假设3.5%

    # 委贷定价 = 资金成本 + 风险溢价 + 通道费 + 利润
    total_cost = capital_cost + params.risk_premium + params.bank_channel_fee
    target_profit = 0.005  # 目标利润0.5%
    suggested_rate = total_cost + target_profit

    # 利息收入
    annual_interest = params.loan_amount * params.loan_rate
    channel_fee = params.loan_amount * params.bank_channel_fee

    return {
        'capital_cost': capital_cost,
        'risk_premium': params.risk_premium,
        'bank_channel_fee': params.bank_channel_fee,
        'total_cost': total_cost,
        'suggested_rate': suggested_rate,
        'actual_rate': params.loan_rate,
        'annual_interest': annual_interest,
        'channel_fee': channel_fee,
        'net_income': annual_interest - channel_fee - params.loan_amount * capital_cost
    }


def cashflow_forecast(months: int = 12) -> pd.DataFrame:
    """现金流预测（四表一警框架）"""
    np.random.seed(42)
    dates = pd.date_range(start='2026-09-01', periods=months, freq='M')

    # 基础现金流
    base_inflow = 6000
    base_outflow = 4500

    data = []
    for i, date in enumerate(dates):
        # 季节性因子
        seasonality = 1 + 0.1 * np.sin(2 * np.pi * i / 12)

        # 趋势外推
        trend = 1 + 0.005 * i

        # 随机波动
        noise = np.random.normal(1, 0.05)

        inflow = base_inflow * seasonality * trend * noise
        outflow = base_outflow * seasonality * (1 + 0.003 * i)

        net_flow = inflow - outflow
        opening_balance = 8000 + sum([base_inflow * (1 + 0.005 * j) - base_outflow * (1 + 0.003 * j) for j in range(i)])
        closing_balance = opening_balance + net_flow

        # 预警判断
        if closing_balance < 2000:
            alert = 'RED'
        elif closing_balance < 4000:
            alert = 'ORANGE'
        else:
            alert = 'GREEN'

        data.append({
            'month': date.strftime('%Y-%m'),
            'opening_balance': round(opening_balance, 0),
            'inflow': round(inflow, 0),
            'outflow': round(outflow, 0),
            'net_flow': round(net_flow, 0),
            'closing_balance': round(closing_balance, 0),
            'alert': alert
        })

    return pd.DataFrame(data)


def three_level_warning(balance: float, monthly_expense: float) -> str:
    """三级预警机制"""
    safety_ratio = balance / monthly_expense

    if safety_ratio < 0.5:
        return 'RED: 资金缺口严重，立即启动应急融资'
    elif safety_ratio < 1.0:
        return 'ORANGE: 资金偏紧，准备授信提款'
    else:
        return 'GREEN: 资金充足，正常运营'


if __name__ == '__main__':
    print("=" * 60)
    print("供应链金融资金流分析")
    print("=" * 60)

    params = SupplyChainParams()

    print("\n【账期错配分析】")
    mismatch = calculate_mismatch(params)
    print(f"  账期错配天数: {mismatch['mismatch_days']}天")
    print(f"  资金缺口: {mismatch['funding_gap']:.0f}万元")
    print(f"  资金占用成本: {mismatch['occupancy_cost']:.1f}万元/年")
    print(f"  缺口占月采购比例: {mismatch['gap_ratio']*100:.0f}%")

    print("\n【委贷定价分析】")
    pricing = calculate_entrusted_loan_pricing(params)
    print(f"  资金成本: {pricing['capital_cost']*100:.2f}%")
    print(f"  风险溢价: {pricing['risk_premium']*100:.2f}%")
    print(f"  通道费率: {pricing['bank_channel_fee']*100:.2f}%")
    print(f"  建议利率: {pricing['suggested_rate']*100:.2f}%")
    print(f"  实际利率: {pricing['actual_rate']*100:.2f}%")
    print(f"  年利息收入: {pricing['annual_interest']:.0f}万元")
    print(f"  净收益: {pricing['net_income']:.0f}万元")

    print("\n【现金流预测（前6个月）】")
    forecast = cashflow_forecast(6)
    print(forecast.to_string(index=False))

    print("\n【三级预警测试】")
    for balance in [1500, 3500, 6000]:
        print(f"  余额{balance}万: {three_level_warning(balance, 4500)}")
