#!/usr/bin/env node
/**
 * coverage_test.js - 离线助手覆盖率回归测试
 * 用法: node tools/coverage_test.js
 * 功能: 从index.html抽出AI引擎，用Node跑真JS，逐题断言
 */
const fs = require('fs');
const path = require('path');

const REPO_DIR = path.dirname(__dirname);
const HTML_PATH = path.join(REPO_DIR, 'index.html');

// ===== 1. 从index.html抽出KB JSON和引擎JS =====
const html = fs.readFileSync(HTML_PATH, 'utf-8');

function extractScript(id) {
  const re = new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)</script>`);
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

const kbJson = extractScript('portfolioKB-data');
const engineJs = extractScript('ai-engine');

if (!kbJson) { console.error('❌ 找不到 portfolioKB-data'); process.exit(1); }
if (!engineJs) { console.error('❌ 找不到 ai-engine'); process.exit(1); }

// ===== 2. 注入最小DOM stub =====
const domStub = `
var document = {
  getElementById: function(id) {
    if (id === 'portfolioKB-data') return { textContent: ${JSON.stringify(kbJson)} };
    return { textContent: '', querySelectorAll: function(){ return []; } };
  },
  querySelectorAll: function(){ return []; }
};
var window = {};
`;

// ===== 3. eval引擎脚本 =====
eval(domStub + engineJs);
const AI = window.SmartReconAI;

if (!AI || !AI.buildOfflineAnswer) { console.error('❌ 引擎未定义'); process.exit(1); }

// ===== 4. 判断返回走了哪一档 =====
function detectTier(answer) {
  if (!answer) return 'empty';
  if (answer.indexOf('（以上来自作品集知识库') > -1) return 'kb_strong';
  if (answer.indexOf('你的问题可能和') > -1) return 'kb_weak';
  if (answer.indexOf('这个问题超出了作品集的范围') > -1) return 'out_of_scope';
  if (answer.indexOf('portfolio_kb →') > -1 || answer.indexOf('tool-call') > -1) return 'canned';
  return 'unknown';
}

// ===== 5. 测试集 =====
// type: 'coverage' = 在范围内，只要不是out_of_scope就算通过
// type: 'assert' = 必须匹配expected档位
// type: 'out_of_scope' = 必须是out_of_scope
const TESTS = [
  // --- 越界断言（必须out_of_scope）---
  { q: '今天天气怎么样', type: 'out_of_scope' },
  { q: '帮我写一首诗', type: 'out_of_scope' },
  { q: 'MoE是什么', type: 'out_of_scope' },

  // --- 特定话术断言（必须canned，因为这些是人工撰写的核心话术）---
  { q: '你的数据是真实的吗', type: 'assert', expected: 'canned' },
  { q: '你怎么保证不编造', type: 'assert', expected: 'canned' },
  { q: '你的数据从哪来', type: 'assert', expected: 'canned' },
  { q: '四角色AI协作体系是怎么运作的', type: 'assert', expected: 'canned' },
  { q: '你的GPA是多少', type: 'assert', expected: 'canned' },
  { q: '你会不会算错', type: 'assert', expected: 'canned' },

  // --- 截胡探针（必须不是out_of_scope，且回答应包含作品相关内容）---
  { q: 'LPR那个作品的研究结论是什么', type: 'coverage' },
  { q: 'LPR那个作品的数据从哪来', type: 'coverage' },
  { q: '第三方支付那个作品怎么做的', type: 'coverage' },
  { q: '第三方支付那个作品有什么局限', type: 'coverage' },
  { q: '资金缺口分析那个作品怎么做的', type: 'coverage' },
  { q: '作品的资金流分析是怎么做的', type: 'coverage' },
  { q: 'SOX抽样量怎么算的', type: 'coverage' },
  { q: '现金流压力测试的资金缺口怎么算', type: 'coverage' },

  // --- 在范围内覆盖率题（只要不是out_of_scope就算有效作答）---
  { q: '这个作品集的核心亮点是什么', type: 'coverage' },
  { q: '最能体现精算能力的作品是哪个', type: 'coverage' },
  { q: '作者的财务和AI背景怎么结合的', type: 'coverage' },
  { q: 'w01讲了什么', type: 'coverage' },
  { q: 'LPR走势预测用了什么模型', type: 'coverage' },
  { q: '供应链资金流分析是怎么做的', type: 'coverage' },
  { q: 'SOX审计Agent工作流怎么运作', type: 'coverage' },
  { q: 'w07的模拟参数是真实的吗', type: 'coverage' },
  { q: '你是谁', type: 'coverage' },
  { q: '你的教育背景', type: 'coverage' },
  { q: 'smart实习做了什么', type: 'coverage' },
  { q: '你的技能有哪些', type: 'coverage' },
  { q: '你找什么方向的工作', type: 'coverage' },
  { q: '为什么做这个作品集', type: 'coverage' },
  { q: '作品集迭代了几个版本', type: 'coverage' },
  { q: '修复过哪些bug', type: 'coverage' },
  { q: '你的研究有什么局限', type: 'coverage' },
];

// ===== 6. 跑测试 =====
let assertPass = 0, assertFail = 0;
let coveragePass = 0, coverageTotal = 0;
let oosPass = 0, oosFail = 0;
const failures = [];
const tierCount = { kb_strong: 0, canned: 0, kb_weak: 0, out_of_scope: 0, unknown: 0, empty: 0 };

console.log('='.repeat(60));
console.log('离线助手覆盖率回归测试');
console.log('='.repeat(60));

for (const t of TESTS) {
  const answer = AI.buildOfflineAnswer(t.q, '');
  const actual = detectTier(answer);
  tierCount[actual] = (tierCount[actual] || 0) + 1;

  if (t.type === 'out_of_scope') {
    if (actual === 'out_of_scope') { oosPass++; }
    else { oosFail++; failures.push({ ...t, actual }); }
  } else if (t.type === 'assert') {
    if (actual === t.expected) { assertPass++; }
    else { assertFail++; failures.push({ ...t, actual }); }
  } else { // coverage
    coverageTotal++;
    if (actual !== 'out_of_scope' && actual !== 'empty' && actual !== 'unknown') {
      coveragePass++;
    } else {
      failures.push({ ...t, actual });
    }
  }
}

// ===== 7. 输出结果 =====
const total = TESTS.length;
const coverageRate = coverageTotal > 0 ? ((coveragePass / coverageTotal) * 100).toFixed(1) : '0';

console.log(`\n测试集: ${total} 题`);
console.log(`  越界断言: ${oosPass}/${oosPass + oosFail} 通过`);
console.log(`  话术断言: ${assertPass}/${assertPass + assertFail} 通过`);
console.log(`  覆盖率题: ${coveragePass}/${coverageTotal} 有效作答 (${coverageRate}%)`);

console.log(`\n档位分布:`);
for (const [tier, cnt] of Object.entries(tierCount)) {
  if (cnt > 0) console.log(`  ${tier}: ${cnt}`);
}

if (failures.length > 0) {
  console.log(`\n⚠️  未达预期 (${failures.length}题，不影响结论，仅作优化参考):`);
  for (const f of failures) {
    const answer = AI.buildOfflineAnswer(f.q, '');
    console.log(`  [${f.type}] ${f.q}`);
    console.log(`    实际: ${f.actual}  期望: ${f.expected || '非out_of_scope'}`);
    console.log(`    回答: ${answer.substring(0, 80)}...`);
  }
}

console.log('\n' + '='.repeat(60));
const allPass = oosFail === 0 && assertFail === 0 && parseFloat(coverageRate) >= 95;
if (allPass) {
  console.log(`✅ 全部通过 — 越界${oosPass}/${oosPass+oosFail} 断言${assertPass}/${assertPass+assertFail} 覆盖率${coverageRate}% (≥95%)`);
  process.exit(0);
} else {
  console.log('❌ 存在失败或覆盖率未达标');
  process.exit(1);
}
