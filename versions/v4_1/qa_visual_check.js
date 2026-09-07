/**
 * 作品集 v3.8 视觉自检脚本 v8（VISUAL-TEST-UPGRADE-TOHAVESCREENSHOT）
 * v8 升级（Architect 确认 A 方案 + reducedMotion + 原地升级 + 衔接流程）：
 *  - 从纯 node + playwright-core 改为 @playwright/test test runner
 *  - 新增 toHaveScreenshot() 像素基线对比：首次 --update-snapshots 建基线，此后自动 diff
 *    （padding/间距/徽章尺寸等视觉回归不再靠人眼，直接 FAIL）
 *  - emulateMedia({reducedMotion:'reduce'})（页面 CSS 支持）+ animations:'disabled'（config）双保险关动画
 *  - 70 条 DOM/内容断言全部保留，改用 expect.soft 软断言：失败不中断，收集全部结果
 * 运行（在 v3_8 目录下，由 playwright.config.js 驱动，自动起/复用 8744 服务器）：
 *  首次建基线：node <managed>/node_modules/@playwright/test/cli.js test --update-snapshots
 *  日常自检：  node <managed>/node_modules/@playwright/test/cli.js test
 * 基线位置：qa_shots/baseline/qa_visual_check.js-snapshots/
 */
const { test, expect } = require('C:/Users/ROG/.workbuddy/binaries/node/workspace/node_modules/@playwright/test');

const BASE = 'http://127.0.0.1:8744/胡凯-AI财务作品集.html';
// v8.1 视口精简：768/1920 仅 DOM 断言（768 是 767 断点上一档必须保留断言；1920 与 1280 无布局差异），截图只做 375+1280
const viewports = [
  { name: 'mobile_375', width: 375, height: 812, shot: true },
  { name: 'tablet_768', width: 768, height: 1024, shot: false },
  { name: 'desktop_1280', width: 1280, height: 800, shot: true },
  { name: 'wide_1920', width: 1920, height: 1080, shot: false },
];

// ====== 软断言收集器：全部记录 + expect.soft（失败不中断） ======
function collector() {
  const results = [];
  return {
    results,
    check(name, ok, detail) {
      results.push({ name, ok: !!ok, detail });
      expect.soft(!!ok, `[${name}]${detail ? ' | ' + detail : ''}`).toBeTruthy();
    },
  };
}
function dump(title, c) {
  const fails = c.results.filter(r => !r.ok);
  const pass = c.results.length - fails.length;
  // v8.1 报告分组：一行摘要 + 只列 FAIL（PASS 不再逐条输出，省 token）
  console.log(`[${title}] ${pass}/${c.results.length} ${fails.length ? '❌' : '✅'}${fails.length ? '  FAIL: ' + fails.map(f => f.name).join(' | ') : ''}`);
  fails.forEach(r => console.log(`  ✗ ${r.name}${r.detail ? ' | ' + r.detail : ''}`));
}

async function openPage(page, vp) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1200);
}

// v8.1 iframe 就绪轮询：替代固定 waitForTimeout(1300)，就绪即返回（通常 300-800ms）
async function waitForIframeReady(page, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const state = await page.evaluate(() => {
      const wf = document.getElementById('workFrame');
      const ifr = wf ? wf.querySelector('iframe') : null;
      const doc = ifr ? ifr.contentDocument : null;
      if (!doc) return { ready: false, reason: 'no-doc' };
      const visible = [...doc.querySelectorAll('.portfolio-page')].filter(s => getComputedStyle(s).display !== 'none');
      if (doc.readyState !== 'complete' || visible.length !== 1) return { ready: false, reason: 'state=' + doc.readyState + ' visible=' + visible.length };
      return { ready: true, visibleId: visible.map(s => s.id) };
    });
    if (state.ready) return state;
    await page.waitForTimeout(100);
  }
  return null;
}

// ====== 四视口：结构/溢出/矩阵/技术栈/reveal/截图/console（每视口 10 项断言 + 1 张整页基线截图） ======
test.describe('四视口结构断言', () => {
  for (const vp of viewports) {
    test(`[${vp.name}]`, async ({ page }) => {
      const c = collector();
      const consoleErrors = [];
      page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200)); });
      page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message.slice(0, 200)));

      let navFailed = false;
      try { await openPage(page, vp); }
      catch (e) { navFailed = true; consoleErrors.push('NAVFAIL: ' + e.message.slice(0, 200)); }
      c.check('页面加载', !navFailed, navFailed ? consoleErrors[0] : 'ok');

      if (!navFailed) {
        // 主文档结构
        const struct = await page.evaluate(() => {
          const wrap = document.querySelector('.wrap');
          const kids = wrap ? [...wrap.children].map(el => el.id || el.className || el.tagName) : [];
          return {
            hero: !!document.querySelector('.hero'),
            about: !!document.getElementById('about'),
            works: !!document.getElementById('works'),
            pipeline: !!document.getElementById('pipeline'),
            workFrame: !!document.getElementById('workFrame'),
          };
        });
        c.check('主文档结构完整', struct.hero && struct.about && struct.works && struct.pipeline && struct.workFrame,
          `hero=${struct.hero} about=${struct.about} works=${struct.works} pipeline=${struct.pipeline} frame=${struct.workFrame}`);

        // 横向溢出
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          const sw = doc.scrollWidth, cw = doc.clientWidth;
          const offenders = [];
          document.querySelectorAll('body *').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.right > cw + 2 && r.width > 0 && r.left < cw) {
              const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 50) : el.tagName;
              offenders.push(`${el.tagName}.${cls} right=${Math.round(r.right)}`);
            }
          });
          return { sw, cw, offenders: offenders.slice(0, 8) };
        });
        c.check('无横向溢出', overflow.sw <= overflow.cw,
          `sw=${overflow.sw} cw=${overflow.cw}${overflow.offenders.length ? ' offenders: ' + overflow.offenders.join(' | ') : ''}`);

        // 作品矩阵
        const matrix = await page.evaluate(() => {
          const worksEl = document.querySelector('.works');
          const miniEl = document.querySelector('.works-mini');
          const wide = worksEl ? worksEl.querySelectorAll('a.work.wide').length : 0;
          const mini = miniEl ? miniEl.querySelectorAll('a.work').length : 0;
          const miniStyle = miniEl ? getComputedStyle(miniEl) : null;
          const wideR = worksEl && worksEl.querySelector('a.work.wide') ? worksEl.querySelector('a.work.wide').getBoundingClientRect() : null;
          const miniR = miniEl ? miniEl.getBoundingClientRect() : null;
          return { wide, mini, miniCols: miniStyle ? miniStyle.gridTemplateColumns : null, wideTop: wideR ? Math.round(wideR.top) : null, miniTop: miniR ? Math.round(miniR.top) : null };
        });
        c.check('作品矩阵 3+3 且 wide 在上', matrix.wide === 3 && matrix.mini === 3 && matrix.wideTop < matrix.miniTop,
          `wide=${matrix.wide} mini=${matrix.mini} miniCols=${matrix.miniCols} wideTop=${matrix.wideTop} miniTop=${matrix.miniTop}`);

        // 协作技术栈 3 组卡片
        const stack = await page.evaluate(() => {
          const sec = [...document.querySelectorAll('.sec')].find(s => s.querySelector('h2') && s.querySelector('h2').textContent.includes('协作技术栈'));
          if (!sec) return null;
          const groupEls = [...sec.querySelectorAll('.stack-card')];
          const groupNames = groupEls.map(g => (g.querySelector('div') || {}).textContent || '');
          const flexWrap = sec.querySelector('.stack-flex');
          const text = sec.textContent;
          return {
            groups: groupEls.length,
            names: groupNames,
            flex: flexWrap ? getComputedStyle(flexWrap).flexWrap : null,
            hasGitHub: text.includes('GitHub Skills'),
            has57: text.includes('57 封') || text.includes('57封'),
          };
        });
        c.check('技术栈 3 组卡片', stack && stack.groups === 3 && ['Agentic Workflow', 'Quality Engineering', 'System Governance'].every(n => stack.names.some(x => x.includes(n))),
          stack ? `groups=${stack.groups} names=${JSON.stringify(stack.names)}` : '区块缺失');
        c.check('技术栈无 GitHub Skills/57 封', stack && !stack.hasGitHub && !stack.has57,
          stack ? `gh=${stack.hasGitHub} 57=${stack.has57}` : '无');
        c.check('技术栈 flex-wrap 换行', stack && stack.flex === 'wrap', stack ? `flex=${stack.flex}` : '无');

        // 主文档 reveal（滚动触发）
        const revealMain = await page.evaluate(async () => {
          const reveals = [...document.querySelectorAll('.reveal')];
          for (const r of reveals) { r.scrollIntoView({ block: 'center' }); await new Promise(x => setTimeout(x, 150)); }
          await new Promise(x => setTimeout(x, 250));
          const hidden = reveals.filter(r => !r.classList.contains('in'));
          return { total: reveals.length, hidden: hidden.map(h => (h.textContent || '').trim().slice(0, 25)) };
        });
        c.check('主文档 reveal 全部可见', revealMain.hidden.length === 0,
          `total=${revealMain.total}${revealMain.hidden.length ? ' hidden=' + JSON.stringify(revealMain.hidden) : ''}`);

        // 整页像素基线（reducedMotion + animations:disabled 双保险；v8.1 仅 375/1280 截图）
        // 先隐藏所有 fixed/sticky 元素，避免 fullPage 截图在不同运行中重复渲染导航栏造成 diff 噪音
        if (vp.shot) {
          const hiddenFixed = await page.evaluate(() => {
            const els = [...document.querySelectorAll('*')].filter(el => {
              const p = getComputedStyle(el).position;
              return p === 'fixed' || p === 'sticky';
            });
            const selectors = [];
            els.forEach(el => {
              el.dataset.qaOrigOpacity = el.style.opacity;
              el.style.opacity = '0';
              selectors.push(el.id ? '#' + el.id : el.className ? '.' + String(el.className).split(/\s+/)[0] : el.tagName);
            });
            return { count: els.length, selectors: selectors.slice(0, 6) };
          });

          await expect(page).toHaveScreenshot(`${vp.name}_full.png`, { fullPage: true });

          await page.evaluate(() => {
            document.querySelectorAll('[data-qa-orig-opacity]').forEach(el => {
              el.style.opacity = el.dataset.qaOrigOpacity;
              if (el.dataset.qaOrigOpacity === '') el.style.removeProperty('opacity');
              delete el.dataset.qaOrigOpacity;
            });
          });

          if (hiddenFixed.count) {
            c.check(`截图前隐藏 fixed/sticky 元素`, hiddenFixed.count >= 0, `count=${hiddenFixed.count} first=${hiddenFixed.selectors.join(',')}`);
          }
        }

        c.check('无 console 错误', consoleErrors.length === 0,
          consoleErrors.length ? consoleErrors.join(' || ').slice(0, 300) : 'ok');
      }

      dump(`四视口 [${vp.name}]`, c);
    });
  }
});

// ====== v3.6 / v3.7 / v3.8 内容断言（1280 + 767 响应式，21 项） ======
test.describe('内容断言 v3.6/v3.7/v3.8', () => {
  test('v3.6/v3.7/v3.8 全量内容 + 能力全景响应式', async ({ page }) => {
    const c = collector();
    await openPage(page, { name: 'content_1280', width: 1280, height: 900 });

    // ---- v3.6 段 ----
    // 三层角色卡：Manager + Senior Specialist + 决策者（在 #pipeline 段内）
    const roleCard = await page.evaluate(() => {
      const pipeline = document.getElementById('pipeline');
      if (!pipeline) return null;
      const text = pipeline.textContent;
      return {
        hasClaude: text.includes('Claude（Architect）'),
        hasWorkBuddy: text.includes('WorkBuddy（Builder & Archive）'),
        hasDecider: text.includes('决策者'),
        hasOldTri: text.includes('三角分工'),
        hasOldRole: text.includes('Manager') || text.includes('Senior Specialist'),
      };
    });
    c.check('三层角色卡 Claude+WorkBuddy+决策者', roleCard && roleCard.hasClaude && roleCard.hasWorkBuddy && roleCard.hasDecider,
      roleCard ? `C=${roleCard.hasClaude} WB=${roleCard.hasWorkBuddy} D=${roleCard.hasDecider} oldTri=${roleCard.hasOldTri}` : 'pipeline 缺失');
    c.check('旧称呼"三角分工"已移除', roleCard && !roleCard.hasOldTri, roleCard ? `hasOld=${roleCard.hasOldTri}` : 'pipeline 缺失');
    c.check('对外称呼 Manager/Specialist 清零', roleCard && !roleCard.hasOldRole, roleCard ? `oldRole=${roleCard.hasOldRole}` : 'pipeline 缺失');

    // 徽章：C 徽章 + WB 徽章
    const badges = await page.evaluate(() => {
      const pipeline = document.getElementById('pipeline');
      if (!pipeline) return null;
      const allSpans = [...pipeline.querySelectorAll('span, div')];
      const badgeEls = allSpans.filter(el => {
        const s = getComputedStyle(el);
        const bg = s.backgroundImage;
        return bg && bg !== 'none' && s.display === 'inline-block' && parseInt(s.width) <= 40 && parseInt(s.height) <= 40;
      });
      const texts = badgeEls.map(el => el.textContent.trim());
      return { count: badgeEls.length, texts };
    });
    c.check('徽章存在（C + WB）', badges && badges.count >= 2 && badges.texts.includes('C') && badges.texts.includes('WB'),
      badges ? `count=${badges.count} texts=${JSON.stringify(badges.texts)}` : 'pipeline 缺失');

    // Footer 协作引擎
    const footer = await page.evaluate(() => {
      const f = document.querySelector('.footer');
      if (!f) return null;
      return { text: f.textContent, hasCollab: f.textContent.includes('协作引擎') };
    });
    c.check('Footer 含"协作引擎"', footer && footer.hasCollab, footer ? footer.text.slice(0, 80) : 'footer 缺失');

    // portfolioKB versions（v3.11 起改为独立 JSON 块，从此读取）
    const kbVer = await page.evaluate(() => {
      const el = document.getElementById('portfolioKB-data');
      if (!el) return null;
      try {
        const kb = JSON.parse(el.textContent);
        return { versions: kb.versions || '' };
      } catch (e) { return null; }
    });
    c.check('portfolioKB versions 含 v3.8', kbVer && kbVer.versions.includes('v3.8'),
      kbVer ? kbVer.versions.slice(-80) : 'portfolioKB JSON 块未找到');

    // 协作进化段落
    const evoSec = await page.evaluate(() => {
      const text = document.body.textContent;
      return {
        hasToken: text.includes('Token') || text.includes('token'),
        hasPreflight: text.includes('预检'),
        hasManage: text.includes('我管理了一个 AI 团队') || text.includes('管理') && text.includes('AI 团队'),
      };
    });
    c.check('协作进化段落 Token+预检+AI 团队', evoSec && evoSec.hasToken && evoSec.hasPreflight,
      evoSec ? `token=${evoSec.hasToken} preflight=${evoSec.hasPreflight} manage=${evoSec.hasManage}` : '缺失');

    // ---- v3.7 段 ----
    const capCards = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.cap-sec > .grid-cols-4 > div')];
      const titles = cards.map(c => (c.querySelector('div:nth-child(2)') || {}).textContent || '').filter(Boolean);
      const grid = document.querySelector('.cap-sec > .grid-cols-4');
      const cols = grid ? getComputedStyle(grid).gridTemplateColumns : null;
      return { count: cards.length, titles, cols };
    });
    c.check('能力全景卡片 4 张', capCards && capCards.count === 4 && capCards.titles.length === 4,
      capCards ? `count=${capCards.count} titles=${JSON.stringify(capCards.titles)}` : '缺失');
    c.check('能力全景 4 列网格', capCards && capCards.cols && capCards.cols.split(' ').length === 4,
      capCards ? `cols=${capCards.cols}` : '无');
    c.check('能力全景 4 个能力点齐全', capCards && ['资金运营', '审计内控', 'AI Agent 系统', '数据分析'].every(t => capCards.titles.includes(t)),
      capCards ? JSON.stringify(capCards.titles) : '缺失');

    // 能力全景响应式：767px → 2 列
    await page.setViewportSize({ width: 767, height: 900 });
    await page.waitForTimeout(800);
    const capColsMobile = await page.evaluate(() => {
      const grid = document.querySelector('.cap-sec > .grid-cols-4');
      return grid ? getComputedStyle(grid).gridTemplateColumns : null;
    });
    c.check('能力全景 ≤767px 降为 2 列', capColsMobile && capColsMobile.split(' ').length === 2,
      capColsMobile ? `cols=${capColsMobile}` : '无');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(400);

    // 称呼统一
    const naming = await page.evaluate(() => {
      const body = document.body.textContent;
      const pipeline = document.getElementById('pipeline');
      const pipeText = pipeline ? pipeline.textContent : '';
      return {
        honestUpdated: body.includes('WorkBuddy 某次将回信误写入 outbox'),
        w04BlockUpdated: body.includes('决策者+Architect') && body.includes('Builder & Archive'),
        protocolLink: pipeText.includes('bridge/PROTOCOL.md'),
        oldInPipeline: pipeText.includes('参谋') || pipeText.includes('执行者'),
      };
    });
    c.check('称呼统一：诚实披露+协作描述块', naming.honestUpdated && naming.w04BlockUpdated,
      naming ? `honest=${naming.honestUpdated} w04=${naming.w04BlockUpdated}` : '缺失');
    c.check('协议链接 bridge/PROTOCOL.md 补回', naming.protocolLink, naming ? `link=${naming.protocolLink}` : '缺失');

    // ---- v3.8 段 ----
    // N1：旧称呼全站清零
    const oldNameAll = await page.evaluate(() => {
      const body = document.body.textContent;
      return {
        hasCounsellor: body.includes('参谋'),
        hasExecutor: body.includes('执行者'),
        hasTri: body.includes('三角分工'),
      };
    });
    c.check('N1 旧称呼全站清零（参谋/执行者）', oldNameAll && !oldNameAll.hasCounsellor && !oldNameAll.hasExecutor,
      oldNameAll ? `参谋=${oldNameAll.hasCounsellor} 执行者=${oldNameAll.hasExecutor} 三角=${oldNameAll.hasTri}` : '缺失');

    // N2：审计内控卡新文案
    const auditCard = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.cap-sec > .grid-cols-4 > div')];
      const card = cards.find(c => c.textContent.includes('审计内控'));
      if (!card) return null;
      const text = card.textContent;
      return { hasMazars: text.includes('Mazars：货币资金与往来款项测试'), hasSOX: text.includes('SOX 404'), hasCOSO: text.includes('COSO'), hasITGC: text.includes('ITGC') };
    });
    c.check('N2 审计内控卡 Mazars 实操文案', auditCard && auditCard.hasMazars && !auditCard.hasSOX && !auditCard.hasCOSO && !auditCard.hasITGC,
      auditCard ? `Mazars=${auditCard.hasMazars} SOX=${auditCard.hasSOX} COSO=${auditCard.hasCOSO} ITGC=${auditCard.hasITGC}` : '缺失');

    // N3：AI Agent 卡伏笔 + 3 标签
    const agentCard = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.cap-sec > .grid-cols-4 > div')];
      const card = cards.find(c => c.textContent.includes('AI Agent 系统'));
      return card ? { text: card.textContent } : null;
    });
    c.check('N3 AI Agent 卡伏笔+3标签', agentCard && agentCard.text.includes('即你正在看的这套系统——自定义通信协议 + 自动化质检流水线 + 熔断 & 自检'),
      agentCard ? agentCard.text.slice(0, 60) : '缺失');

    // N4：产品能力 2 层
    const prodCap = await page.evaluate(() => {
      const about = document.getElementById('about');
      if (!about) return null;
      const text = about.textContent;
      return {
        hasDesign: text.includes('产品设计：SmartRecon 对账 Agent · SOX 控制测试工作台 · 月结流程优化方案') && text.includes('数据分析：LPR 走势预测分析'),
        hasTech: text.includes('技术实现：AI Agent / RAG / MCP 系统设计'),
      };
    });
    c.check('N4 产品能力 2 层作品名为首', prodCap && prodCap.hasDesign && prodCap.hasTech,
      prodCap ? `design=${prodCap.hasDesign} tech=${prodCap.hasTech}` : 'about 缺失');

    // N5：工具链分层
    const toolLayers = await page.evaluate(() => {
      const about = document.getElementById('about');
      if (!about) return null;
      const text = about.textContent;
      const html = about.innerHTML;
      return {
        hasModelLayer: text.includes('底层模型：Kimi / DeepSeek / Claude / Codex / Gemini / 千问'),
        hasAgentLayer: text.includes('Agent 系统：') && text.includes('WorkBuddy（Builder & Archive）'),
        hasDSBadge: html.includes('>DS<'),
      };
    });
    c.check('N5 工具链分层模型+Agent', toolLayers && toolLayers.hasModelLayer && toolLayers.hasAgentLayer && !toolLayers.hasDSBadge,
      toolLayers ? `model=${toolLayers.hasModelLayer} agent=${toolLayers.hasAgentLayer} ds=${toolLayers.hasDSBadge}` : 'about 缺失');

    // N6：技术栈 3 组卡片齐全（v3.9 术语升级）
    const stackGroups = await page.evaluate(() => {
      const sec = [...document.querySelectorAll('.sec')].find(s => s.querySelector('h2') && s.querySelector('h2').textContent.includes('协作技术栈'));
      if (!sec) return null;
      const text = sec.textContent;
      return { hasAgentic: text.includes('Agentic Workflow'), hasQE: text.includes('Quality Engineering'), hasGov: text.includes('System Governance'), hasMultiAgent: text.includes('Multi-Agent 编排'), hasAsync: text.includes('异步消息协议'), hasCB: text.includes('Circuit Breaker'), hasToken: text.includes('Token Budget'), hasImmutable: text.includes('Immutable Artifacts'), noOld: !text.includes('通信层') && !text.includes('质检层') && !text.includes('风控层') };
    });
    c.check('N6 技术栈 3 组卡片齐全（v3.9）', stackGroups && stackGroups.hasAgentic && stackGroups.hasQE && stackGroups.hasGov && stackGroups.hasMultiAgent && stackGroups.hasAsync && stackGroups.hasCB && stackGroups.hasToken && stackGroups.hasImmutable && stackGroups.noOld,
      stackGroups ? `agentic=${stackGroups.hasAgentic} qe=${stackGroups.hasQE} gov=${stackGroups.hasGov} old=${stackGroups.noOld}` : '缺失');

    // N7：技术栈无 GitHub Skills / 57 封
    const stackClean = await page.evaluate(() => {
      const sec = [...document.querySelectorAll('.sec')].find(s => s.querySelector('h2') && s.querySelector('h2').textContent.includes('协作技术栈'));
      if (!sec) return null;
      const text = sec.textContent;
      return { hasGitHub: text.includes('GitHub Skills'), has57: text.includes('57 封') || text.includes('57封') || text.includes('57 轮') || text.includes('57轮') };
    });
    c.check('N7 技术栈无 GitHub Skills/57 封', stackClean && !stackClean.hasGitHub && !stackClean.has57,
      stackClean ? `gh=${stackClean.hasGitHub} 57=${stackClean.has57}` : '缺失');

    // N8：去审计化定位
    const deAudit = await page.evaluate(() => {
      const body = document.body.textContent;
      const hero = document.querySelector('.hero');
      const heroText = hero ? hero.textContent : '';
      return {
        heroFinance: heroText.includes('从财务一线痛点出发'),
        heroAudit: heroText.includes('从审计一线'),
        enFinance: body.includes('RESEARCH → PRODUCT → AI SYSTEM → FINANCE'),
        enAudit: body.includes('RESEARCH → PRODUCT → AI SYSTEM → AUDIT'),
        leadFinance: body.includes('财务实务落地能力'),
        leadAudit: body.includes('审计实务落地能力'),
      };
    });
    c.check('N8 去审计化定位（财务一线/FINANCE/财务实务）', deAudit && deAudit.heroFinance && !deAudit.heroAudit && deAudit.enFinance && !deAudit.enAudit && deAudit.leadFinance && !deAudit.leadAudit,
      deAudit ? `hero=${deAudit.heroFinance}/${deAudit.heroAudit} en=${deAudit.enFinance}/${deAudit.enAudit} lead=${deAudit.leadFinance}/${deAudit.leadAudit}` : '缺失');

    // N9：作品矩阵 ↔ portfolioKB 一致性（Gemini 建议 #3）
    const kbSync = await page.evaluate(() => {
      // 收集所有作品入口 id（onclick="showWork('0N')"）
      const ids = new Set();
      document.querySelectorAll('[onclick*="showWork"]').forEach(a => {
        const m = (a.getAttribute('onclick') || '').match(/showWork\('0(\d)'\)/);
        if (m) ids.add('w0' + m[1]);
      });
      const kb = (window.SmartReconAI && window.SmartReconAI.portfolioKB) ? window.SmartReconAI.portfolioKB : null;
      if (!kb || !kb.structure) return { ok: false, reason: 'portfolioKB 缺失', ids: [...ids] };
      const missing = [];
      ids.forEach(id => {
        const item = kb.structure.find(s => s.id === id);
        if (!item) { missing.push(id + ':无条目'); return; }
        if (!item.name || !item.layer || !item.desc) missing.push(id + ':属性不全');
      });
      return { ok: missing.length === 0, ids: [...ids], missing };
    });
    c.check('N9 作品矩阵与 portfolioKB 一致（Gemini#3）', kbSync && kbSync.ok,
      kbSync ? `ids=${JSON.stringify(kbSync.ids)} missing=${JSON.stringify(kbSync.missing)}` : 'evaluate 失败');

    // N10：v3.10 商业化深度（w04 CCC / DLQ+AuditLog；w03 已替换为 LPR v4.1）
    const commercial = await page.evaluate(() => {
      const tpl03 = document.getElementById('page-03');
      const w03 = tpl03 ? tpl03.textContent : '';
      const tpl04 = document.getElementById('page-04');
      const w04 = tpl04 ? tpl04.textContent : '';
      return {
        w03LPR: w03.includes('LPR 走势预测分析') && w03.includes('净息差') && w03.includes('社融') && w03.includes('MLF') && w03.includes('CPI'),
        w03Four: w03.includes('四指标') && w03.includes('1.41%') && w03.includes('1.40%') && w03.includes('463.27') && w03.includes('15 个月'),
        w03Honest: w03.includes('分析预测，非精确模型') && w03.includes('局限与诚实披露'),
        w03NoFake: w03.includes('3.0% / 3.5%') && w03.includes('2025.05'),
        w03Theory: w03.includes('理论视角') && w03.includes('期限结构视角') && w03.includes('泰勒规则') && w03.includes('5Y 定向下行'),
        w03Scenario: w03.includes('情景概率预测') && w03.includes('概率加权期望') && w03.includes('E(LPR)') && w03.includes('60%') && w03.includes('25%') && w03.includes('15%'),
        w03MC: w03.includes('蒙特卡洛模拟') && w03.includes('2.5%-2.8%') && w03.includes('5000 条') && w03.includes('demo/lpr_monte_carlo.py') && w03.includes('2.7%') && w03.includes('69.7%') && w03.includes('27.6%'),
        w03ALM: w03.includes('ALM 联动') && w03.includes('资产负债两端的联动'),
        w03ChartBand: w03.includes('未来 5 年预测区间') && w03.includes('预测区间带') && w03.includes('预测中位数') && w03.includes('2031-07') && w03.includes('lpr_mc_quantiles.csv') && w03.includes('双蒙特卡洛') && w03.includes('青带') && w03.includes('期限利差') && w03.includes('叙事假设'),
        w04CCC: w04.includes('Cash-in-transit') && w04.includes('CCC') && w04.includes('资金占用节省'),
        w04NoNum: !/\d[\d,]*万/.test(w04.match(/清算周期缩短[\s\S]{0,300}?资金占用节省[\s\S]{0,200}/) ? (w04.match(/清算周期缩短[\s\S]{0,300}?资金占用节省[\s\S]{0,200}/)[0] || '') : ''),
        w04DLQ: w04.includes('死信队列') && w04.includes('重复付款存疑') && w04.includes('未达账项存疑') && w04.includes('汇率错配存疑'),
        w04Audit: w04.includes('审计日志') && w04.includes('Prompt Hash') && w04.includes('Agent Version'),
        w04Closed: w04.includes('熔断（事前') && w04.includes('留痕（事后'),
      };
    });
    c.check('N10a w03 LPR 四指标分析案例', commercial && commercial.w03LPR && commercial.w03Four && commercial.w03NoFake,
      commercial ? `LPR=${commercial.w03LPR} four=${commercial.w03Four} honest=${commercial.w03Honest}` : '缺失');
    c.check('N10d w03 v4.2 理论+情景+蒙特卡洛+ALM', commercial && commercial.w03Theory && commercial.w03Scenario && commercial.w03MC && commercial.w03ALM,
      commercial ? `theory=${commercial.w03Theory} scenario=${commercial.w03Scenario} mc=${commercial.w03MC} alm=${commercial.w03ALM}` : '缺失');
    c.check('N10e w03 v4.3 未来 5 年预测区间带图表', commercial && commercial.w03ChartBand,
      commercial ? `chartBand=${commercial.w03ChartBand}` : '缺失');
    c.check('N10b w04 CCC 营运资金公式（无编造数字）', commercial && commercial.w04CCC && commercial.w04NoNum,
      commercial ? `CCC=${commercial.w04CCC} noNum=${commercial.w04NoNum}` : '缺失');
    c.check('N10c w04 死信队列+审计日志闭环', commercial && commercial.w04DLQ && commercial.w04Audit && commercial.w04Closed,
      commercial ? `DLQ=${commercial.w04DLQ} audit=${commercial.w04Audit} closed=${commercial.w04Closed}` : '缺失');

    // N11：v3.11 portfolioKB 独立 JSON 块（结构化完整性 + 引擎加载）
    const kbJson = await page.evaluate(() => {
      const el = document.getElementById('portfolioKB-data');
      if (!el) return { ok: false, reason: 'JSON 块缺失' };
      try {
        const kb = JSON.parse(el.textContent);
        const structOk = kb.structure && kb.structure.length === 7;
        const fieldsOk = kb.structure.every(w => w.id && w.name && w.summary && Array.isArray(w.tags) && w.tags.length && Array.isArray(w.highlights) && w.highlights.length);
        const protoOk = kb.prototypes && kb.prototypes.length === 2;
        const keyOk = kb.keyNumbers && kb.techStack && kb.defectLog && kb.versions.includes('v4.0');
        const engineLoads = window.SmartReconAI && window.SmartReconAI.portfolioKB && window.SmartReconAI.portfolioKB.structure && window.SmartReconAI.portfolioKB.structure.length === 7;
        return { ok: structOk && fieldsOk && protoOk && keyOk && engineLoads, n: kb.structure ? kb.structure.length : 0, engineLoads: !!engineLoads };
      } catch (e) {
        return { ok: false, reason: 'JSON 解析失败: ' + e.message };
      }
    });
    c.check('N11 v4.0 KB 独立 JSON 块 + 引擎加载', kbJson && kbJson.ok,
      kbJson ? `structure=${kbJson.n} engine=${kbJson.engineLoads}` : 'evaluate 失败');

    // N12：v3.11 引擎能力（kbSearch 双通道 / callAPI 流式 onDelta 参数）
    const engineCap = await page.evaluate(() => {
      const ai = window.SmartReconAI;
      if (!ai) return null;
      const kbSearchWorks = typeof ai.kbSearch === 'function' && ai.kbSearch('智对账').length > 0 && ai.kbSearch('智对账')[0].type === 'work';
      const policySearchCompat = typeof ai.policySearch === 'function';
      const streamCapable = ai.callAPI.length >= 4; // (messagesOrText, persona, callback, onDelta)
      return { kbSearchWorks, policySearchCompat, streamCapable };
    });
    c.check('N12 v3.11 引擎能力（kbSearch/流式参数）', engineCap && engineCap.kbSearchWorks && engineCap.policySearchCompat && engineCap.streamCapable,
      engineCap ? `kbSearch=${engineCap.kbSearchWorks} policy=${engineCap.policySearchCompat} stream=${engineCap.streamCapable}` : '缺失');

    dump('内容断言 v3.6/v3.7/v3.8/v3.10/v4.0', c);
  });
});

// ====== 交互：导航 / showWork 01-06 / demo 链接 / HTTP 可达（9 项） ======
test.describe('交互断言', () => {
  test('导航 + showWork 01-06 + demo + HTTP', async ({ page }) => {
    const c = collector();
    await openPage(page, { name: 'interact_1280', width: 1280, height: 900 });

    const navItems = await page.evaluate(() => {
      return [...document.querySelectorAll('nav a, .nav a, .top-nav a')].map(a => ({ text: a.textContent.trim().slice(0, 12), href: a.getAttribute('href') }));
    });
    c.check('导航项存在', navItems.length >= 3, JSON.stringify(navItems));

    const expectMap = { '01': 'work-01', '02': 'work-02', '03': 'work-03', '04': 'work-04', '05': 'work-05', '06': 'work-06' };
    const demoCheck = { '06': 'demo/SOX控制测试工作台.html' };
    // v8.1 demo HTTP 检查提前发起，与作品遍历并行
    const demoRespPromise = page.request.get('http://127.0.0.1:8744/demo/SOX控制测试工作台.html');
    for (const [pid, expectId] of Object.entries(expectMap)) {
      await page.evaluate(i => {
        const sel = `.works a[onclick*="showWork('${i}')"], .works-mini a[onclick*="showWork('${i}')"]`;
        const el = document.querySelector(sel);
        if (el) el.click();
      }, pid);
      const ready = await waitForIframeReady(page);
      const info = ready ? await page.evaluate(() => {
        const wf = document.getElementById('workFrame');
        const ifr = wf ? wf.querySelector('iframe') : null;
        const doc = ifr ? ifr.contentDocument : null;
        if (!doc) return null;
        const visible = [...doc.querySelectorAll('.portfolio-page')].filter(s => getComputedStyle(s).display !== 'none');
        const demo = [...doc.querySelectorAll('a[href*="demo/"], iframe[src*="demo/"]')].map(el => el.getAttribute('href') || el.getAttribute('src'));
        return { visibleId: visible.map(s => s.id), demo, iframeOk: true };
      }) : null;
      const idOk = info && info.visibleId.length === 1 && info.visibleId[0] === expectId;
      c.check(`showWork(${pid}) → ${expectId}`, idOk, ready ? JSON.stringify(info) : 'iframe 超时就绪失败');
      if (demoCheck[pid]) {
        c.check(`work-${pid} demo 链接`, info && info.demo.includes(demoCheck[pid]), info ? JSON.stringify(info.demo) : '无');
      }
    }

    // demo 链接 HTTP 可达性（与遍历并行完成）
    try {
      const resp = await demoRespPromise;
      c.check('SOX demo HTTP 可达', resp.ok(), resp.status() + '');
    } catch (e) {
      c.check('SOX demo HTTP 可达', false, e.message.slice(0, 100));
    }

    dump('交互断言', c);
  });

  // ====== 助手 v3.11：欢迎态 / 面试模式 / 主动导览 / key 设置（6 项） ======
  test('助手 v3.11 功能：欢迎态+面试模式+导览+key', async ({ page }) => {
    const c = collector();
    await openPage(page, { name: 'assist_1280', width: 1280, height: 900 });
    // mock AI：避免测试触发真实 API 请求
    await page.evaluate(() => {
      window.SmartReconAI.askWithHistory = function (history, persona, fallback, cb, scene, onDelta) {
        if (onDelta) onDelta('（测试回答）', false);
        cb('（测试回答）', true, { stream: false });
      };
    });

    // ① 打开面板 → 欢迎态：5 快捷提问 + 6 快速导览 + textarea + 状态点 + 齿轮
    await page.click('#assistantFab');
    await page.waitForTimeout(400);
    const welcome = await page.evaluate(() => {
      const w = document.getElementById('assistantWelcome');
      if (!w) return null;
      return {
        qChips: document.querySelectorAll('#quickChips .q-chip').length,
        navCards: document.querySelectorAll('#quickNav .nv-card').length,
        textarea: document.getElementById('assistantInput').tagName === 'TEXTAREA',
        stateDot: !!document.getElementById('assistantStateDot'),
        gear: !!document.getElementById('assistantGear'),
      };
    });
    c.check('助手欢迎态（5提问+6导览+textarea+状态点+齿轮）', welcome && welcome.qChips === 5 && welcome.navCards === 6 && welcome.textarea && welcome.stateDot && welcome.gear,
      JSON.stringify(welcome));

    // ② 面试模式：触发 → 徽标显示；退出 → 徽标隐藏
    await page.fill('#assistantInput', '模拟面试');
    await page.press('#assistantInput', 'Enter');
    await page.waitForTimeout(400);
    const badgeOn = await page.evaluate(() => getComputedStyle(document.getElementById('assistantInterviewBadge')).display !== 'none');
    c.check('面试模式徽标显示', badgeOn, badgeOn ? '' : '徽标未显示');
    await page.fill('#assistantInput', '退出面试');
    await page.press('#assistantInput', 'Enter');
    await page.waitForTimeout(400);
    const badgeOff = await page.evaluate(() => getComputedStyle(document.getElementById('assistantInterviewBadge')).display === 'none');
    c.check('面试模式退出徽标隐藏', badgeOff, badgeOff ? '' : '徽标未隐藏');

    // ③ 主动导览：「打开第4个作品」→ workFrame 打开 work-04
    await page.fill('#assistantInput', '打开第4个作品');
    await page.press('#assistantInput', 'Enter');
    const ready = await waitForIframeReady(page);
    const w04 = ready ? await page.evaluate(() => {
      const wf = document.getElementById('workFrame');
      const ifr = wf ? wf.querySelector('iframe') : null;
      const doc = ifr ? ifr.contentDocument : null;
      if (!doc) return [];
      return [...doc.querySelectorAll('.portfolio-page')].filter(s => getComputedStyle(s).display !== 'none').map(s => s.id);
    }) : [];
    c.check('主动导览「打开第4个作品」→ work-04', w04.length === 1 && w04[0] === 'work-04', JSON.stringify(w04));

    // ④ 返回主页 → key 设置弹层：打开 → 保存 → 关闭（内存态）
    await page.evaluate(() => { try { window.showHome(); } catch (e) {} });
    await page.click('#assistantFab');
    await page.waitForTimeout(300);
    await page.click('#assistantGear');
    await page.waitForTimeout(200);
    const settingsOpen = await page.evaluate(() => document.getElementById('assistantSettings').classList.contains('open'));
    c.check('key 设置弹层打开', settingsOpen, settingsOpen ? '' : '弹层未打开');
    await page.fill('#assistantKeyInput', 'sk-test-key');
    await page.click('#assistantKeySave');
    await page.waitForTimeout(200);
    const settingsSaved = await page.evaluate(() => {
      const sk = window.SmartReconAI.apiKey;
      return !document.getElementById('assistantSettings').classList.contains('open') && sk === 'sk-test-key';
    });
    c.check('key 保存并切换（内存态）', settingsSaved, settingsSaved ? '' : '保存失败');
    // 清理测试 key（避免污染会话）
    await page.evaluate(() => { try { sessionStorage.removeItem('smartrecon_custom_key'); } catch (e) {} });

    dump('助手 v3.11 功能断言', c);
  });
});
