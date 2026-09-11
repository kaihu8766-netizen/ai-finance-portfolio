"""
SOX审计属性抽样计算器
对应作品：w06 SOX审计Agent：网易游戏内控测试工具
方法：属性抽样、样本量计算、偏差率评估
参考：AICPA审计准则第1314号（审计抽样）
"""

import math
from dataclasses import dataclass
from typing import Tuple


@dataclass
class SamplingParams:
    """属性抽样参数"""
    confidence_level: float = 0.95  # 置信水平
    tolerable_deviation_rate: float = 0.05  # 可容忍偏差率
    expected_deviation_rate: float = 0.01  # 预计偏差率
    population_size: int = 1000  # 总体规模


def calculate_sample_size(params: SamplingParams) -> int:
    """
    计算属性抽样样本量
    使用泊松置信因子法（AICPA审计抽样指南）：
    n = 置信因子(0偏差) / 可容忍偏差率
    置信因子：90%→2.31, 95%→3.00, 99%→4.61
    """
    # 置信水平对应的0偏差置信因子
    confidence_factors = {0.90: 2.31, 0.95: 3.00, 0.99: 4.61}
    cf = confidence_factors.get(params.confidence_level, 3.00)

    # 样本量 = 置信因子 / 可容忍偏差率
    n = cf / params.tolerable_deviation_rate

    # 如果预计偏差率>0，需要调整（预计偏差率每增加1%，样本量约增加置信因子对应的偏差数）
    if params.expected_deviation_rate > 0:
        # 预计偏差数 = 预计偏差率 × 样本量
        expected_deviations = params.expected_deviation_rate * n
        # 找到对应的置信因子
        deviation_factors = {
            0.90: {0: 2.31, 1: 3.89, 2: 5.33, 3: 6.69},
            0.95: {0: 3.00, 1: 4.75, 2: 6.30, 3: 7.76},
            0.99: {0: 4.61, 1: 6.64, 2: 8.41, 3: 10.05}
        }
        dev_count = int(expected_deviations) + 1
        cf_adj = deviation_factors.get(params.confidence_level, {}).get(dev_count, cf + dev_count * 1.5)
        n = cf_adj / params.tolerable_deviation_rate

    # 属性抽样中，当总体规模较大（>500）时，通常不做有限总体修正（FPC）
    # 原因：属性抽样关注的是偏差率，而非均值估计，FPC对样本量影响极小
    # AICPA审计抽样指南中的样本量表也不做FPC
    # 此处与在线计算器口径保持一致：不做FPC
    return math.ceil(n)


def evaluate_sample(deviations: int, sample_size: int, params: SamplingParams) -> dict:
    """
    评估样本结果
    计算上偏差率上限（Upper Deviation Rate）
    """
    # 使用泊松近似计算上偏差率
    confidence_factor = {
        0.90: {0: 2.31, 1: 3.89, 2: 5.33, 3: 6.69},
        0.95: {0: 3.00, 1: 4.75, 2: 6.30, 3: 7.76},
        0.99: {0: 4.61, 1: 6.64, 2: 8.41, 3: 10.05}
    }

    cf = confidence_factor.get(params.confidence_level, {}).get(deviations, None)

    if cf is None:
        # 如果偏差数超过表中范围，用公式近似
        cf = deviations + 1 + math.sqrt(deviations + 1)

    upper_deviation_rate = cf / sample_size

    result = {
        'sample_size': sample_size,
        'deviations_found': deviations,
        'sample_deviation_rate': deviations / sample_size,
        'upper_deviation_rate': upper_deviation_rate,
        'tolerable_deviation_rate': params.tolerable_deviation_rate,
        'control_effective': upper_deviation_rate <= params.tolerable_deviation_rate
    }

    return result


def generate_audit_program() -> list:
    """生成审计程序清单"""
    return [
        {'cycle': '收入循环', 'control': '信用审批', 'frequency': '每笔', 'sample_size': 25},
        {'cycle': '收入循环', 'control': '发货单匹配', 'frequency': '每日', 'sample_size': 25},
        {'cycle': '采购循环', 'control': '三方匹配', 'frequency': '每笔', 'sample_size': 30},
        {'cycle': '采购循环', 'control': '付款审批', 'frequency': '每笔', 'sample_size': 30},
        {'cycle': '资金循环', 'control': '银行对账', 'frequency': '每月', 'sample_size': 12},
        {'cycle': '资金循环', 'control': '印章管理', 'frequency': '每次', 'sample_size': 20},
        {'cycle': 'ITGC', 'control': '权限变更审批', 'frequency': '每次', 'sample_size': 15},
        {'cycle': 'ITGC', 'control': '程序变更管理', 'frequency': '每次', 'sample_size': 15},
    ]


if __name__ == '__main__':
    print("=" * 60)
    print("SOX属性抽样计算器")
    print("=" * 60)

    params = SamplingParams()
    sample_size = calculate_sample_size(params)

    print(f"\n抽样参数:")
    print(f"  置信水平: {params.confidence_level*100:.0f}%")
    print(f"  可容忍偏差率: {params.tolerable_deviation_rate*100:.1f}%")
    print(f"  预计偏差率: {params.expected_deviation_rate*100:.1f}%")
    print(f"  总体规模: {params.population_size}")
    print(f"  计算样本量: {sample_size}")

    print(f"\n样本结果评估（不同偏差数）:")
    for deviations in [0, 1, 2, 3]:
        result = evaluate_sample(deviations, sample_size, params)
        status = "✓ 控制有效" if result['control_effective'] else "✗ 控制无效"
        print(f"  发现{deviations}个偏差: 上偏差率={result['upper_deviation_rate']*100:.2f}% {status}")

    print(f"\n审计程序清单:")
    for program in generate_audit_program():
        print(f"  [{program['cycle']}] {program['control']} - 样本量{program['sample_size']}")
