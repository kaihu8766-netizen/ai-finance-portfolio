#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""提交前体检：确认 Pages 发布所需文件齐全（原版 preflight 已随仓库清理移除，本版仅做存在性校验）。"""
import os, sys
REQUIRED = ["index.html", "echarts.min.js", "assets/app.css", "assets/app.js", "assets/avatar.jpg", "demo"]
ok = True
for p in REQUIRED:
    exists = os.path.exists(p)
    print(("OK   " if exists else "MISS ") + p)
    ok = ok and exists
sys.exit(0 if ok else 1)
