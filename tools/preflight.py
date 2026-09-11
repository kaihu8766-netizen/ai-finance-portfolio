#!/usr/bin/env python3
"""
作品集提交前自动化体检脚本
用法：python tools/preflight.py
覆盖：reveal时序、函数作用域、CSS类名、敏感串、baseOption/media配对
"""

import re
import sys
from pathlib import Path

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
    """检查1：每个模板的.reveal是否出现在IO脚本之后（会导致不可见）"""
    errors = []
    for name, content in templates.items():
        io_match = re.search(r'IntersectionObserver', content)
        reveal_matches = list(re.finditer(r'class="[^"]*reveal[^"]*"', content))
        if io_match and reveal_matches:
            io_pos = io_match.start()
            for rm in reveal_matches:
                if rm.start() > io_pos:
                    errors.append(f"  [{name}] .reveal在IO脚本之后（行约{content[:rm.start()].count(chr(10))+1}），会导致永久不可见")
    return errors

def check_function_scope(templates):
    """检查2：模板内调用但未定义的全局函数（简化版，检查常见危险函数）"""
    errors = []
    dangerous_funcs = ['isMobile', 'applyMobileOption', 'getMobileChartOption']
    for name, content in templates.items():
        for func in dangerous_funcs:
            # 检查是否有调用（不是定义）
            calls = re.findall(r'(?<!function\s)' + re.escape(func) + r'\s*\(', content)
            defs = re.findall(r'function\s+' + re.escape(func), content)
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
        defined_in_css = bool(re.search(r'\.' + re.escape(cls) + r'[\s:{]', all_css))
        if used_in_html and not defined_in_css:
            errors.append(f"  HTML使用了.{cls}但CSS未定义")
    return errors

def check_sensitive_strings(html):
    """检查4：敏感串扫描（API Key等）"""
    errors = []
    # OpenAI style key
    if re.search(r'sk-[A-Za-z0-9]{20,}', html):
        errors.append("  发现疑似API Key（sk-开头）")
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
    
    print("\n" + "=" * 60)
    if all_errors:
        print(f"❌ 发现 {len(all_errors)} 个问题，请修复后再提交")
        sys.exit(1)
    else:
        print("✅ 全部通过，可以提交")
        sys.exit(0)

if __name__ == '__main__':
    main()
