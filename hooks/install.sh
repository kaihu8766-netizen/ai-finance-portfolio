#!/bin/bash
# 安装git hooks到.git/hooks目录
# 运行方式: bash hooks/install.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔧 正在安装git hooks..."

# 复制pre-push hook
cp "$SCRIPT_DIR/pre-push" "$REPO_ROOT/.git/hooks/pre-push"
chmod +x "$REPO_ROOT/.git/hooks/pre-push"

echo "✅ pre-push hook已安装到 .git/hooks/pre-push"
echo ""
echo "📋 Hook功能："
echo "  - 拦截直接push到master的未复核commit"
echo "  - 检查commit是否在REVIEW_STAMP.md批准列表中"
echo "  - 未批准的commit会被拒绝push"
echo ""
echo "⚠️  紧急hotfix（纯恢复/单行纯文本）可使用: git push --no-verify"
