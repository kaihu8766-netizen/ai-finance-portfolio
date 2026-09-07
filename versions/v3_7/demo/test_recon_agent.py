# -*- coding: utf-8 -*-
"""
智对账 SmartRecon · Agent 核心逻辑单元测试（pytest）
====================================================
覆盖：数据生成 / 规则引擎匹配 / AI 模糊匹配 / 异常识别 / 报告输出

运行：  python -m pytest test_recon_agent.py -v
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pytest
from recon_agent_demo import (
    gen_data, rule_match, ai_fuzzy_match, detect_anomalies, gen_report
)


# ---------- 1. 数据生成 ----------
class TestGenData:
    def test_default_size(self):
        internal, bank = gen_data()
        assert len(internal) == 2000
        assert len(bank) >= 2000  # 含重复付款会多产生流水

    def test_seed_deterministic(self):
        a1, b1 = gen_data(500, seed=7)
        a2, b2 = gen_data(500, seed=7)
        assert a1 == a2
        assert b1 == b2

    def test_all_internal_unmatched_initially(self):
        internal, _ = gen_data(100)
        assert all(i["matched"] is False for i in internal)


# ---------- 2. 规则引擎匹配 ----------
class TestRuleMatch:
    def test_exact_match(self):
        internal = [{"id": "ACC-1", "amount": 100.00, "date": "2026-07-01",
                     "memo": "x", "matched": False}]
        bank = [{"id": "BNK-1", "amount": 100.00, "date": "2026-07-01",
                 "memo": "x", "ref": "ACC-1"}]
        logs = []
        matched, _ = rule_match(internal, bank, logs=logs)
        assert matched == 1
        assert internal[0]["matched"] is True
        assert any("规则引擎" in l for l in logs)

    def test_tolerance_matches_0_01(self):
        internal = [{"id": "ACC-1", "amount": 100.01, "date": "2026-07-01",
                     "memo": "x", "matched": False}]
        bank = [{"id": "BNK-1", "amount": 100.00, "date": "2026-07-01",
                 "memo": "x", "ref": "ACC-1"}]
        matched, _ = rule_match(internal, bank, amount_tol=0.01)
        assert matched == 1  # 容差内应命中

    def test_date_mismatch_not_matched(self):
        internal = [{"id": "ACC-1", "amount": 100.00, "date": "2026-07-01",
                     "memo": "x", "matched": False}]
        bank = [{"id": "BNK-1", "amount": 100.00, "date": "2026-07-02",
                 "memo": "x", "ref": "ACC-1"}]
        matched, _ = rule_match(internal, bank)
        assert matched == 0  # 日期不同不应命中


# ---------- 3. AI 模糊匹配 ----------
class TestAiFuzzyMatch:
    def test_fuzzy_hit_with_confidence(self):
        internal = [{"id": "ACC-1", "amount": 100.00, "date": "2026-07-01",
                     "memo": "付款-供应商1-合同123", "matched": False}]
        bank = [{"id": "BNK-1", "amount": 100.03, "date": "2026-07-01",
                 "memo": "供应商1货款-合同123", "ref": None}]
        logs = []
        matched, logs = ai_fuzzy_match(internal, bank, logs=logs)
        assert matched == 1
        assert any("置信度" in l or "AI" in l for l in logs)

    def test_conflicting_memo_no_match(self):
        internal = [{"id": "ACC-1", "amount": 100.00, "date": "2026-07-01",
                     "memo": "付款-供应商1-合同123", "matched": False}]
        bank = [{"id": "BNK-1", "amount": 100.00, "date": "2026-07-01",
                 "memo": "供应商99-完全不同", "ref": None}]
        matched, _ = ai_fuzzy_match(internal, bank)
        assert matched == 0


# ---------- 4. 异常识别 ----------
class TestDetectAnomalies:
    def test_repeat_payment_detected(self):
        internal = [{"id": "ACC-1", "amount": 5000.00, "date": "2026-07-01",
                     "memo": "重复", "matched": True}]
        bank = [
            {"id": "BNK-1", "amount": 5000.00, "date": "2026-07-01",
             "memo": "重复", "ref": "ACC-1", "anomaly": "repeat_payment"},
            {"id": "BNK-2", "amount": 5000.00, "date": "2026-07-01",
             "memo": "重复", "ref": "ACC-1"},
        ]
        anomalies, _ = detect_anomalies(internal, bank)
        repeat = [a for a in anomalies if a.get("kind") == "repeat_payment"]
        assert len(repeat) == 1
        assert "重复" in repeat[0].get("reason", "")

    def test_fx_mismatch_detected(self):
        internal = [{"id": "ACC-1", "amount": 1000.00, "date": "2026-07-01",
                     "memo": "x", "matched": True}]
        bank = [{"id": "BNK-1", "amount": 1007.50, "date": "2026-07-01",
                 "memo": "x", "ref": "ACC-1", "anomaly": "fx_mismatch"}]
        anomalies, _ = detect_anomalies(internal, bank)
        fx = [a for a in anomalies if a.get("kind") == "fx_mismatch"]
        assert len(fx) == 1
        assert "汇兑" in fx[0].get("reason", "")

    def test_outstanding_item_detected(self):
        internal = []
        bank = [{"id": "BNK-1", "amount": 100.00, "date": "2026-07-01",
                 "memo": "银行手续费", "anomaly": "outstanding_item"}]
        anomalies, _ = detect_anomalies(internal, bank)
        out = [a for a in anomalies if a.get("kind") == "outstanding_item"]
        assert len(out) == 1

    def test_level_mapping(self):
        internal, bank = gen_data(300)
        anomalies, _ = detect_anomalies(internal, bank)
        levels = {a["level"] for a in anomalies}
        assert levels <= {"高风险", "中风险", "低风险"}


# ---------- 5. 报告输出 ----------
class TestGenReport:
    def test_report_contains_key_metrics(self):
        internal, bank = gen_data(200)
        logs = []
        m1, logs = rule_match(internal, bank, logs=logs)
        m2, logs = ai_fuzzy_match(internal, bank, logs=logs)
        anomalies, logs = detect_anomalies(internal, bank, logs=logs)
        text = gen_report(internal, bank, anomalies, logs)
        assert "对账" in text
        assert "异常" in text
        assert "证据链" in text
        assert "人在回路" in text  # 设计原则必须体现


# ---------- 6. 端到端（小样本全流程） ----------
class TestEndToEnd:
    def test_full_pipeline_match_rate(self):
        internal, bank = gen_data(500)
        logs = []
        m1, logs = rule_match(internal, bank, logs=logs)
        m2, logs = ai_fuzzy_match(internal, bank, logs=logs)
        anomalies, logs = detect_anomalies(internal, bank, logs=logs)
        total_matched = sum(1 for i in internal if i["matched"])
        rate = total_matched / len(internal)
        # 正常匹配率应 ~94%（96% 正常 + 部分异常被规则/AI 处理）
        assert 0.90 <= rate <= 0.985
        assert isinstance(anomalies, list)
        assert len(logs) >= 3  # 三个环节都应留痕
