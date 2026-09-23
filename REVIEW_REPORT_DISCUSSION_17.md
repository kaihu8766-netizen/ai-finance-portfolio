# 第十七次讨论·AI助手tool-call显示问题修复复核请求

## 背景

用户反馈：和作品集AI助手聊天时，回复里会出现HTML代码`<div class="tool-call">portfolio_kb → structure✓</div>`，没有被正确渲染，而是直接以文本形式显示给用户。

## 问题根因

AI助手的回复内容里包含了"工具调用标记"（`<div class="tool-call">...</div>`），用来显示AI调用了什么工具。但是在显示回复的时候，代码用了`escapeHtml(reply)`把整个回复都转义了，包括tool-call的HTML标签，所以就显示成了纯文本。

## 涉及位置

### 位置1：主页AI助手（renderMd函数，第2664行）

**原代码**：
```javascript
function renderMd(s){return escapeHtml(String(s||'')).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');}
```

**问题**：先escapeHtml，把tool-call的HTML标签也转义了。

### 位置2：proto2的AI助手（第5626行）

**原代码**：
```javascript
thinkEl.innerHTML = escapeHtml(reply) + (isAI ? '<div class="tool-call">真实 AI 模式 · deepseek-v4-flash ✓</div>' : '');
```

**问题**：同样用了escapeHtml(reply)，把reply里的tool-call也转义了。

## 修复方案

两个位置都采用同样的修复方案：
1. 先从回复内容里提取所有的`<div class="tool-call">...</div>`
2. 对其余内容做escapeHtml转义（防止XSS）
3. 最后把提取出来的tool-call加回去，作为HTML渲染

**修复后的代码（renderMd函数）**：
```javascript
function renderMd(s){
    // 先提取tool-call，再对其余内容转义，最后把tool-call加回去
    var str = String(s||'');
    var toolCallMatch = str.match(/<div class="tool-call">[\s\S]*?<\/div>/g);
    var plainStr = str.replace(/<div class="tool-call">[\s\S]*?<\/div>/g, '');
    var toolCallHtml = toolCallMatch ? toolCallMatch.join('') : '';
    return escapeHtml(plainStr).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>') + toolCallHtml;
}
```

**修复后的代码（proto2的AI助手）**：
```javascript
// 先提取tool-call，再对其余内容转义，最后把tool-call加回去
var toolCallMatch = reply.match(/<div class="tool-call">[\s\S]*?<\/div>/g);
var plainReply = reply.replace(/<div class="tool-call">[\s\S]*?<\/div>/g, '');
var toolCallHtml = toolCallMatch ? toolCallMatch.join('') : '';
thinkEl.innerHTML = escapeHtml(plainReply) + toolCallHtml + (isAI ? '<div class="tool-call">真实 AI 模式 · deepseek-v4-flash ✓</div>' : '');
```

## 需要DeepSeek复核的问题

### 问题1：安全性
- 这种"先提取tool-call，再转义其余内容"的方案是否安全？
- 有没有可能被XSS攻击？比如回复里包含其他恶意HTML标签？
- 有没有更好的方案？

### 问题2：正则表达式
- `/<div class="tool-call">[\s\S]*?<\/div>/g` 这个正则是否能正确匹配所有的tool-call？
- 有没有边界情况处理不了？比如tool-call里嵌套了其他div？
- 有没有更稳健的匹配方式？

### 问题3：代码一致性
- 两个位置（renderMd函数和proto2的AI助手）的修复逻辑是否一致？
- 有没有必要把这个逻辑抽成一个公共函数？
- 还有没有其他地方也有同样的问题？

### 问题4：功能完整性
- 修复后，tool-call是否能正确渲染成CSS样式化的元素？
- 有没有可能影响其他功能（比如markdown渲染、换行处理等）？
- 需不需要在本地测试一下？

## 技术细节

- 修改文件：index.html（单文件）
- 修改位置：第2664行（renderMd函数）、第5626行（proto2的AI助手）
- 修改行数：约15行
- 未修改：其他功能、CSS样式、其他章节内容
- 未新增：任何外部资源、图片、脚本

## 复核要求

请DeepSeek：
1. 检查修复方案的安全性（是否有XSS风险）
2. 检查正则表达式的正确性和边界情况
3. 检查代码一致性和可维护性
4. 检查功能完整性（是否影响其他功能）
5. 如果通过，请在REVIEW_STAMP.md中添加批准记录

---
*报告生成时间：2026-09-21*
*主力AI：豆包（WorkBuddy）*
*待复核AI：DeepSeek Harness*
*修改基线：当前工作区HEAD（e9b623d）*
