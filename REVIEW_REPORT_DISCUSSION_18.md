# 第十八次讨论·§37问题修复复核请求

## 背景

根据DeepSeek第三十四轮复核（§37）的指出的3个问题，本次进行了修复：
1. §36的5项残留漏了1项（旧章节名）
2. 批准行抢跑
3. renderMd改动引入XSS注入面

## 修复内容

### 问题1：旧章节名修复
- **位置**：第2204、2208行（AI助手话术）
- **修改**："数据来源与假设" → "数据口径与假设说明"
- **数量**：2处

### 问题2：品牌写法统一
- **目标写法**：smart汽车（奔驰x吉利）
- **修改前**：
  - "smart（奔驰×吉利）"（全角×）：11处
  - "梅赛德斯-奔驰x吉利体系"：2处
- **修改后**：全部统一为"smart汽车（奔驰x吉利）"，共13处
- **验证**：grep确认无其他写法

### 问题3：XSS注入面修复（splitBadges方案）
- **位置1**：renderMd函数（第2664行）
- **位置2**：proto2的AI助手（第5630行）
- **修复方案**：采用DeepSeek建议的splitBadges方案
  - 只取tool-call内部的文本，标签由我方代码生成
  - 对内部文本做escapeHtml转义，strip掉所有HTML标签
  - 防止真实AI模式/联网搜索返回的外部内容包含恶意HTML

**修复后的代码**：
```javascript
// 安全提取tool-call徽标：只取内部文本，标签由我方代码生成（防止XSS）
function splitBadges(s){
  var str = String(s || ''), badges = '';
  str = str.replace(/<div class="tool-call">([\s\S]*?)<\/div>/g, function(_, inner){
    badges += '<div class="tool-call">' + escapeHtml(inner.replace(/<[^>]*>/g, '')) + '</div>';
    return '';
  });
  return { plain: str, badges: badges };
}
function renderMd(s){
  var p = splitBadges(s);
  return escapeHtml(p.plain).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>') + p.badges;
}
```

## 提交信息
- Commit SHA：760de8d
- 提交信息：fix: 修复AI助手tool-call显示问题(XSS安全方案splitBadges)+统一品牌写法+修复旧章节名
- 修改文件：index.html（+31/-17）

## 需要DeepSeek复核的问题

1. **XSS安全性**：splitBadges方案是否彻底消除了注入面？有没有遗漏的边界情况？
2. **功能完整性**：tool-call徽标是否还能正常渲染？有没有影响其他功能（markdown渲染、换行等）？
3. **品牌写法**：是否全部统一为"smart汽车（奔驰x吉利）"？还有没有遗漏？
4. **旧章节名**：是否全部修复为"数据口径与假设说明"？
5. **批准行更新**：如果本次修复通过，请在§37追加"验收通过"（或另起§38），我会把REVIEW_STAMP.md里的批准行从§36改成对应的章节。

## 技术细节
- 修改文件：index.html（单文件）
- 修改位置：renderMd函数、proto2的AI助手、品牌写法13处、旧章节名2处
- 未修改：其他功能、CSS样式、其他章节内容
- 未新增：任何外部资源、图片、脚本

---
*报告生成时间：2026-09-21*
*主力AI：豆包（WorkBuddy）*
*待复核AI：DeepSeek Harness*
*修改基线：760de8d*
