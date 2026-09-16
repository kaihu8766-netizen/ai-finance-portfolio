#!/usr/bin/env python3
"""把图标转成可直接粘贴的 <img data:image/...> 标签。
   关键：全程二进制读写；生成后做 base64 往返校验；顺带提示文件是否过大。
   用法: python tools/make_icon_datauri.py assets/doubao_icon.png assets/deepseek_icon.png
"""
import base64, io, os, sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

MAGIC = {b"\x89PNG\r\n\x1a\n": "png", b"\xff\xd8\xff": "jpeg"}
STYLE = ('style="width:18px;height:18px;border-radius:4px;vertical-align:-4px;'
         'margin-right:6px;object-fit:cover"')

for path in sys.argv[1:]:
    raw = io.open(path, "rb").read()
    kind = next((v for k, v in MAGIC.items() if raw.startswith(k)), None)
    if not kind:
        print("❌ %s 不是合法 PNG/JPEG（前8字节=%s）→ 拒绝生成" % (path, raw[:8].hex()))
        sys.exit(1)
    b64 = base64.b64encode(raw).decode("ascii")
    if base64.b64decode(b64) != raw:
        print("❌ %s base64 往返校验失败" % path); sys.exit(1)
    alt = os.path.splitext(os.path.basename(path))[0]
    print("✅ %-30s %6d 字节 → base64 %6d 字符%s" % (
        path, len(raw), len(b64), "   ⚠️ 偏大，建议压到 ≤3KB" if len(raw) > 3072 else ""))
    print('   <img src="data:image/%s;base64,%s" %s alt="%s">' % (kind, b64, STYLE, alt))
