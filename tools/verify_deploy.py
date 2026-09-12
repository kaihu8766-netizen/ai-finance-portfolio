#!/usr/bin/env python3
"""
verify_deploy.py - 线上部署校验脚本
用法: python tools/verify_deploy.py [--local-only]
功能: 比对GitHub Pages线上版本与本地HEAD，确认部署成功且无旧文案残留
"""
import sys
import os
import hashlib
import urllib.request
import urllib.parse
import subprocess
import re

# 修复Windows GBK控制台输出emoji崩溃（输出侧编码）
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

BASE_URL = "https://kaihu8766-netizen.github.io/ai-finance-portfolio"
REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 关键内容必须存在
MUST_HAVE = [
    "v5.3.4",
    "隐私保护模式",
    "buildOfflineAnswer",
    "assistantStateDot",
]

# 旧文案/敏感内容必须不存在
MUST_NOT_HAVE = [
    "在线 · 了解全部5个作品",
    "可接入真实大模型",
    "sk-e46307ffee254b49824dfc1da723fdb0",
]

# 需要检查200的资源
RESOURCES = [
    "index.html",
    "echarts.min.js",
    "demo/lpr_monte_carlo.py",
    "demo/sox_sampling.py",
    "demo/LPR蒙特卡洛预测模拟器.html",
    "demo/供应链现金流压力测试模拟器.html",
    "demo/现金流压力测试模拟器.html",
    "demo/SOX控制测试工作台.html",
]

def fetch(url, timeout=15):
    """获取URL内容，返回(status, body_bytes)"""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "verify-deploy/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read()
    except Exception as e:
        return None, str(e)

def normalize(text):
    """换行归一化：\r\n -> \n"""
    if isinstance(text, bytes):
        text = text.decode("utf-8", errors="replace")
    return text.replace("\r\n", "\n").replace("\r", "\n")

def get_local_head():
    """获取本地HEAD的index.html内容"""
    try:
        result = subprocess.run(
            ["git", "show", "HEAD:index.html"],
            cwd=REPO_DIR, capture_output=True, text=True, encoding='utf-8', errors='replace'
        )
        if result.returncode == 0:
            return result.stdout
    except Exception:
        pass
    # fallback: 读本地文件
    path = os.path.join(REPO_DIR, "index.html")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return None

def check_homepage():
    """检查首页"""
    print("=" * 60)
    print("1. 首页HTTP状态")
    status, body = fetch(f"{BASE_URL}/index.html")
    if status == 200:
        print(f"   ✅ 200 OK ({len(body)} bytes)")
        return normalize(body)
    else:
        print(f"   ❌ 失败: {body}")
        return None

def check_content_match(online_body):
    """比对线上与本地HEAD"""
    print("=" * 60)
    print("2. 线上与本地HEAD内容比对")
    local = get_local_head()
    if local is None:
        print("   ❌ 无法获取本地HEAD，比对失败")
        return False
    local_norm = normalize(local)
    online_norm = normalize(online_body)
    if local_norm == online_norm:
        print("   ✅ 完全一致（线上 = 最新版）")
        return True
    else:
        local_hash = hashlib.sha256(local_norm.encode()).hexdigest()[:12]
        online_hash = hashlib.sha256(online_norm.encode()).hexdigest()[:12]
        print(f"   ❌ 不一致（本地={local_hash}，线上={online_hash}）")
        print(f"       可能是GitHub Pages还在部署中，等1-2分钟再试")
        return False

def check_keywords(online_body):
    """检查关键内容和旧文案"""
    print("=" * 60)
    print("3. 关键内容抽查")
    all_ok = True
    for kw in MUST_HAVE:
        if kw in online_body:
            print(f"   ✅ 存在: {kw}")
        else:
            print(f"   ❌ 缺失: {kw}")
            all_ok = False

    print("-" * 40)
    print("4. 旧文案/敏感内容残留检查")
    for kw in MUST_NOT_HAVE:
        if kw in online_body:
            print(f"   ❌ 残留: {kw}")
            all_ok = False
        else:
            print(f"   ✅ 无残留: {kw}")
    return all_ok

def check_resources():
    """检查资源文件200"""
    print("=" * 60)
    print("5. 资源文件HTTP状态")
    all_ok = True
    for res in RESOURCES:
        # 中文文件名编码
        encoded = urllib.parse.quote(res)
        url = f"{BASE_URL}/{encoded}"
        status, _ = fetch(url, timeout=10)
        if status == 200:
            print(f"   ✅ 200: {res}")
        else:
            print(f"   ❌ {status}: {res}")
            all_ok = False
    return all_ok

def main():
    print("线上部署校验 (verify_deploy.py)")
    print(f"目标: {BASE_URL}")
    print()

    online_body = check_homepage()
    if online_body is None:
        print("\n❌ 首页无法访问，终止校验")
        sys.exit(1)

    match_ok = check_content_match(online_body)
    kw_ok = check_keywords(online_body)
    res_ok = check_resources()

    print("=" * 60)
    if match_ok and kw_ok and res_ok:
        print("✅ 全部通过，线上部署正常")
        sys.exit(0)
    else:
        print("❌ 存在问题，请检查")
        sys.exit(1)

if __name__ == "__main__":
    main()
