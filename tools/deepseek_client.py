#!/usr/bin/env python3
"""
deepseek_client.py —— 稳定的 DeepSeek API 客户端（保留思考模式，解决长输出截断）

根因：deepseek-v4-flash 默认开启思考模式，且 max_tokens 覆盖「思考链 + 回答」总配额，
配额太小时思考链把配额吃完，回答就被截断（finish_reason=length）。

本客户端策略（思考模式保留）：
1. max_tokens 默认 32000，给「思考 + 回答」足够总配额；
2. 流式接收（stream=true），避免长文本生成的连接超时/中断（ChunkedEncodingError）；
3. 自动重试：网络层错误指数退避重试；
4. finish_reason=length 时自动把 max_tokens 翻倍重试一次（仍截断则提示拆分问题）。

用法：
    export DEEPSEEK_API_KEY=sk-xxx
    python3 deepseek_client.py "你的问题"                        # 思考模式 + 32000 tokens
    python3 deepseek_client.py "问题" --max-tokens 64000         # 更长输出
    python3 deepseek_client.py "问题" --no-thinking              # 可选手动关闭思考（默认保留）
    python3 deepseek_client.py "问题" --model deepseek-v4-pro
"""

import argparse
import json
import os
import sys
import time

import requests

DEEPSEEK_BASE_URL = "https://api.deepseek.com"


def _chat_stream(payload, key, timeout):
    """流式调用 /chat/completions，返回 (content, tool_calls, finish_reason, usage)。

    usage（F-20261001-02 成本台账升级）：payload 含 stream_options.include_usage 时，
    末 chunk 带真实 token 用量；接口未返回时 usage=None（不崩溃）。
    tool_calls 作品集侧暂未启用，恒为 None（保留签名与 project-trace 对齐）。
    """
    resp = requests.post(
        DEEPSEEK_BASE_URL + "/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json=payload,
        timeout=timeout,
        stream=True,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:300]}")
    content = []
    finish_reason = None
    usage = None
    for line in resp.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if data == "[DONE]":
            break
        try:
            chunk = json.loads(data)
        except json.JSONDecodeError:
            continue
        if chunk.get("usage"):
            usage = chunk["usage"]
        if chunk.get("choices"):
            delta = chunk["choices"][0].get("delta", {})
            if delta.get("content"):
                content.append(delta["content"])
            fr = chunk["choices"][0].get("finish_reason")
            if fr:
                finish_reason = fr
    return "".join(content), None, finish_reason, usage


def chat(messages, model="deepseek-v4-flash", max_tokens=32000, thinking=True,
         temperature=0.7, timeout=600, retries=3, auto_grow=True):
    """调用 /chat/completions（流式）。返回 (内容, tool_calls, finish_reason, usage)。

    finish_reason: "stop"=正常完成；"length"=达到 max_tokens 上限（自动放大重试或提示拆分）。
    usage（F-20261001-02）：真实 token 用量 dict 或 None（接口未返回时）。
    """
    key = os.environ.get("DEEPSEEK_API_KEY")
    if not key:
        sys.exit("缺少 DEEPSEEK_API_KEY 环境变量")

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "thinking": {"type": "enabled" if thinking else "disabled"},
        "stream": True,
        "stream_options": {"include_usage": True},  # 成本台账（F-20261001-02）：末 chunk 带真实 usage
    }

    def attempt(ml, mx):
        p = dict(payload, max_tokens=mx)
        last_err = None
        for i in range(1, retries + 1):
            try:
                content, _tc, finish, _usage = _chat_stream(p, key, timeout)
                if finish == "length" and auto_grow and mx < 128000:
                    return content, finish, mx * 2, _usage  # 触发自动放大
                return content, finish, mx, _usage
            except Exception as e:
                last_err = repr(e)
            time.sleep(min(2 * i, 6))
        raise RuntimeError(f"DeepSeek 调用失败（重试 {retries} 次）：{last_err}")

    content, finish, mx_used, _u1 = attempt(model, max_tokens)
    if finish == "length":
        # 配额翻倍后再试一次
        content, finish, mx_used, _u2 = attempt(model, mx_used)
    return content, None, finish, _u2 if "length" == finish and "_u2" in locals() else _u1


def main():
    ap = argparse.ArgumentParser(description="DeepSeek 稳定客户端（保留思考模式）")
    ap.add_argument("question", help="问题内容")
    ap.add_argument("--model", default="deepseek-v4-flash")
    ap.add_argument("--max-tokens", type=int, default=32000)
    ap.add_argument("--no-thinking", action="store_true", help="关闭思考模式（默认保留思考）")
    ap.add_argument("--system", default="你是 DeepSeek，回答专业、直接、简体中文。")
    args = ap.parse_args()

    messages = [
        {"role": "system", "content": args.system},
        {"role": "user", "content": args.question},
    ]
    content, _tc, finish, usage = chat(messages, model=args.model, max_tokens=args.max_tokens,
                                         thinking=not args.no_thinking)
    print(f"[finish_reason={finish}] [模型={args.model}] [思考模式={'开' if not args.no_thinking else '关'}]"
          + (f" [usage={usage.get('total_tokens')}tok]" if usage else ""))
    print(content)
    # F-20261001-02：机器可读哨兵（gate 解析真实 usage；密钥仍在 client 子进程，gate 零密钥）
    if usage:
        print(f"[gate_usage_json] {json.dumps({k: int(usage.get(k, 0) or 0) for k in ('prompt_tokens', 'completion_tokens', 'total_tokens')})}")


if __name__ == "__main__":
    main()
