#!/usr/bin/env python3
"""
作品集提交前自动化体检脚本
用法：python tools/preflight.py
覆盖：reveal时序、函数作用域、CSS类名、敏感串、baseOption/media配对、media覆盖自定义interval
"""

import re
import sys
import subprocess
from pathlib import Path

# 修复Windows GBK控制台输出emoji崩溃（输出侧编码）
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

HTML_FILE = Path(__file__).parent.parent / 'index.html'

def load_html():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        return f.read()

def extract_templates(html):
    """提取所有page-*模板的内容"""
    templates = {}
    pattern = r'<script type="text/html" id="(page-[^"]+)">(.*?)</script>'
    for m in re.finditer(pattern, html, re.DOTALL):
        templates[m.group(1)] = m.group(2)
    return templates

def check_reveal_timing(templates):
    """检查1：每个模板的.reveal是否出现在IO脚本之后（会导致不可见），以及有reveal但无IO脚本"""
    errors = []
    for name, content in templates.items():
        io_match = re.search(r'IntersectionObserver', content)
        reveal_matches = list(re.finditer(r'class="[^"]*reveal[^"]*"', content))
        # 形态B：有reveal但完全没有IO脚本 -> 全部永久不可见
        if reveal_matches and not io_match:
            errors.append(f"  [{name}] 模板内有 {len(reveal_matches)} 个 .reveal 但没有任何 IntersectionObserver -> 全部永久不可见")
            continue
        # 形态A：有IO脚本，但reveal排在它之后
        if io_match and reveal_matches:
            io_pos = io_match.start()
            for rm in reveal_matches:
                if rm.start() > io_pos:
                    errors.append(f"  [{name}] .reveal在IO脚本之后（模板内第{content[:rm.start()].count(chr(10))+1}行），会导致永久不可见")
    return errors

def check_function_scope(templates):
    """检查2：模板内调用但未定义的全局函数（简化版，检查常见危险函数）"""
    errors = []
    dangerous_funcs = ['isMobile', 'applyMobileOption', 'getMobileChartOption']
    for name, content in templates.items():
        for func in dangerous_funcs:
            # 检查是否有调用（不是定义），先剥离注释避免误报
            content_no_comment = re.sub(r'//.*', '', content)
            content_no_comment = re.sub(r'/\*.*?\*/', '', content_no_comment, flags=re.DOTALL)
            calls = re.findall(r'(?<!function\s)' + re.escape(func) + r'\s*\(', content_no_comment)
            defs = re.findall(r'function\s+' + re.escape(func), content_no_comment)
            if calls and not defs:
                errors.append(f"  [{name}] 调用了{func}()但未在模板内定义")
    return errors

def check_css_classes(html):
    """检查3：HTML中用到但CSS未定义的类（简化版，检查已知问题类）"""
    errors = []
    known_issues = ['sec-title', 'stp']
    # 提取CSS部分（<style>标签内）
    css_blocks = re.findall(r'<style[^>]*>(.*?)</style>', html, re.DOTALL)
    all_css = '\n'.join(css_blocks)
    for cls in known_issues:
        used_in_html = bool(re.search(r'class="[^"]*\b' + re.escape(cls) + r'\b[^"]*"', html))
        defined_in_css = bool(re.search(r'\.' + re.escape(cls) + r'(?=[\s,{:>+~])', all_css))
        if used_in_html and not defined_in_css:
            errors.append(f"  HTML使用了.{cls}但CSS未定义")
    return errors

def check_sensitive_strings(html):
    """检查4：敏感串扫描（API Key等，多种格式）"""
    errors = []
    patterns = [
        (r'sk-[A-Za-z0-9]{20,}', 'DeepSeek/OpenAI API Key（sk-开头）'),
        (r'sk-ant-[A-Za-z0-9\-_]{20,}', 'Anthropic API Key'),
        (r'ghp_[A-Za-z0-9]{20,}', 'GitHub Personal Access Token'),
        (r'github_pat_[A-Za-z0-9_]{20,}', 'GitHub Fine-grained Token'),
        (r'AIza[0-9A-Za-z\-_]{30,}', 'Google API Key'),
        (r'AKIA[0-9A-Z]{16}', 'AWS Access Key ID'),
        (r'-----BEGIN [A-Z ]*PRIVATE KEY-----', '私钥文件'),
    ]
    for pattern, desc in patterns:
        if re.search(pattern, html):
            errors.append(f"  发现疑似敏感信息：{desc}")
    return errors

def check_baseoption_media(html):
    """检查5：baseOption/media配对检查"""
    errors = []
    # 统计出现次数
    baseoption_count = len(re.findall(r'baseOption\s*:', html))
    media_count = len(re.findall(r'media\s*:\s*\[', html))
    if media_count > 0 and baseoption_count == 0:
        errors.append("  出现media配置但缺少baseOption")
    return errors

def check_media_covers_custom_interval(html):
    """检查6：media是否覆盖了自定义interval函数（会导致x轴标签消失）"""
    errors = []
    # 提取所有safeInit调用的option对象
    # 简化检查：如果某段代码同时有 interval: function 和 media 里的 interval: 'auto'
    # 更精确：检查每个safeInit块内是否有自定义interval函数，以及media块是否有interval
    safeinit_pattern = r'safeInit\w*\s*\([^,]+,\s*(\{.*?\})\s*\)'
    # 由于option对象可能很复杂，用更简单的方法：检查文件中是否同时存在
    has_custom_interval = bool(re.search(r'interval\s*:\s*function', html))
    has_media_interval_auto = bool(re.search(r"interval\s*:\s*'auto'", html))
    if has_custom_interval and has_media_interval_auto:
        errors.append("  存在自定义interval函数，同时media里有interval:'auto' -> 自定义会被覆盖，x轴标签可能消失")
    return errors

def check_encoding_garbled():
    """检查8（v2·全仓）：扫描所有被 git 跟踪的文本文件，发现乱码即报错。
       为什么要全仓：历史上乱码事故全部发生在 demo/*.html，只扫 index.html 拦不住。
       四个要点（均已实测）：
         ① 必须带 -c core.quotepath=false：否则中文文件名会被转义成 "demo/\344..."，
            不以 .html 结尾 → 被 endswith 静默漏掉（实测：默认模式只能扫到 105/147 个文件，
            漏掉的 42 个恰好是 demo/ 与 versions/ 里的中文名文件——本检查的主要目标）
         ② 用 git ls-files 枚举 → 天然排除未跟踪的复核报告（它们也含特征字表）
         ③ 排除本文件自身 → 本文件含特征字表字面量与 ?/div> 注释，否则必然自命中
         ④ 多字序列必须整串匹配，不能拆成单字（会误报，如『滑』）
    """
    import subprocess
    TAG = r'\?/(?:div|span|section|h1|h2|h3|h4|p|b|table|tr|td|title|label|button|script|style|body|html)>'
    SINGLE = "\u951b\u9286\u9225\u9428\u93c4\u6d63\u6d93\u9422\u9473\u9366\u93c8\u9359"
    SEQS = ["\u6d93\u5d85", "\u93b4\u621c\u6ed1", "\u9359\ufffd"]
    exts = (".html", ".js", ".py", ".md", ".css", ".sql", ".txt", ".csv", ".yml", ".json")
    listing = subprocess.run(["git", "-c", "core.quotepath=false", "ls-files"],
                             cwd=str(HTML_FILE.parent), capture_output=True,
                             text=True, encoding="utf-8", errors="replace").stdout.split("\n")
    errors = []
    for f in [x.strip() for x in listing if x.strip().endswith(exts)]:
        if f == "tools/preflight.py":
            continue
        try:
            text = open(HTML_FILE.parent / f, encoding="utf-8").read()
        except Exception:
            continue
        hits = re.findall(TAG, text)
        if hits:
            errors.append(f"  {f}: 发现 {len(hits)} 处闭标签被吃掉的乱码（如 {hits[0]}）")
        bad = sorted({c for c in text if c in SINGLE})
        bad += [s for s in SEQS if s in text]
        if bad:
            errors.append(f"  {f}: 发现乱码特征（{''.join(bad[:5])}）")
    return errors

def check_page_wrap_structure(html):
    """检查9（v2）：每个作品模板里
       ① .wrap 闭合之后不允许再出现任何 div（不限类名）
       ② 模板内 div 必须完全闭合
       ③ 模板里必须存在 .wrap"""
    errors = []
    for m in re.finditer(r'<script type="text/html" id="(page-[^"]+)">(.*?)</script>', html, re.S):
        name, body = m.group(1), m.group(2)
        if name == "page-proto2":
            continue
        body = re.sub(r'<script[^>]*>.*?<\\/script>', '\n', body, flags=re.S)
        body = re.sub(r'<!--.*?-->', '', body, flags=re.S)
        depth, wrap_depth, closed_at = 0, None, None
        for i, line in enumerate(body.split('\n'), 1):
            for tok in re.findall(r'<div\b[^>]*>|</div>', line):
                if tok.startswith('</'):
                    if depth:
                        depth -= 1
                    if wrap_depth and depth < wrap_depth and closed_at is None:
                        closed_at = i
                    continue
                depth += 1
                if 'class="wrap' in tok and wrap_depth is None:
                    wrap_depth = depth
                elif closed_at is not None:
                    cls = re.search(r'class="([^"]*)"', tok)
                    errors.append("%s: 第 %d 行有 div（class=%s）落在 .wrap 之外"
                                  "（.wrap 已在第 %d 行闭合）→ 移动端会失去卡片样式、占满屏幕宽度"
                                  % (name, i, cls.group(1) if cls else "无", closed_at))
        if wrap_depth is None:
            errors.append("%s: 模板里找不到 .wrap" % name)
        elif depth != 0:
            errors.append("%s: 模板内 div 未完全闭合（结束时仍有 %d 个未闭合）" % (name, depth))
    return errors

def main():
    print("=" * 60)
    print("作品集提交前自动化体检")
    print("=" * 60)
    
    html = load_html()
    templates = extract_templates(html)
    
    all_errors = []
    
    print(f"\n📋 发现 {len(templates)} 个模板")
    
    print("\n🔍 检查1：reveal时序")
    e = check_reveal_timing(templates)
    if e:
        all_errors.extend(e)
        for err in e: print(err)
    else:
        print("  ✅ 通过")
    
    print("\n🔍 检查2：函数作用域")
    e = check_function_scope(templates)
    if e:
        all_errors.extend(e)
        for err in e: print(err)
    else:
        print("  ✅ 通过")
    
    print("\n🔍 检查3：CSS类名")
    e = check_css_classes(html)
    if e:
        all_errors.extend(e)
        for err in e: print(err)
    else:
        print("  ✅ 通过")
    
    print("\n🔍 检查4：敏感串")
    e = check_sensitive_strings(html)
    if e:
        all_errors.extend(e)
        for err in e: print(err)
    else:
        print("  ✅ 通过")
    
    print("\n🔍 检查5：baseOption/media配对")
    e = check_baseoption_media(html)
    if e:
        all_errors.extend(e)
        for err in e: print(err)
    else:
        print("  ✅ 通过")
    
    print("\n🔍 检查6：media覆盖自定义interval")
    e = check_media_covers_custom_interval(html)
    if e:
        all_errors.extend(e)
        for err in e: print(err)
    else:
        print("  ✅ 通过")
    
    print("\n🔍 检查7：离线助手覆盖率回归（Node跑真JS）")
    try:
        result = subprocess.run(
            ['node', 'tools/coverage_test.js'],
            cwd=str(HTML_FILE.parent),
            capture_output=True, text=True, timeout=30, encoding='utf-8', errors='replace'
        )
        if result.returncode == 0:
            # 提取覆盖率数字
            for line in result.stdout.split('\n'):
                if '覆盖率' in line and '%' in line:
                    print(f"  ✅ {line.strip()}")
                    break
            else:
                print("  ✅ 通过")
        else:
            all_errors.append("  ❌ 覆盖率测试失败")
            print(result.stdout[-500:] if len(result.stdout) > 500 else result.stdout)
            if result.stderr:
                print(result.stderr[-300:])
    except FileNotFoundError:
        all_errors.append("  ❌ Node.js未安装，无法运行覆盖率测试")
    except subprocess.TimeoutExpired:
        all_errors.append("  ❌ 覆盖率测试超时")
    
    print("\n🔍 检查8：编码乱码扫描（全仓）")
    e = check_encoding_garbled()
    if e:
        all_errors.extend(e)
        for err in e: print(err)
    else:
        print("  ✅ 通过")
    
    print("\n🔍 检查9：作品模板.wrap容器结构")
    e = check_page_wrap_structure(html)
    if e:
        all_errors.extend(e)
        for err in e: print(err)
    else:
        print("  ✅ 通过")
    
    print("\n" + "=" * 60)
    if all_errors:
        print(f"❌ 发现 {len(all_errors)} 个问题，请修复后再提交")
        sys.exit(1)
    else:
        print("✅ 全部通过，可以提交")
        sys.exit(0)

if __name__ == '__main__':
    main()
