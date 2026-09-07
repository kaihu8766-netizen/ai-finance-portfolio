/**
 * 作品集 v3.7 视觉自检脚本 v6（v3.6 基础上：面试官速览→协作技术栈、能力全景卡片、称呼统一、协议链接）
 * 四视口：375 / 768 / 1280 / 1920
 * 检查项：加载、结构、溢出、矩阵布局、协作技术栈、能力全景、reveal、交互、demo 链接、work id 映射、v3.6/v3.7 内容
 */
const { chromium } = require('C:/Users/ROG/.workbuddy/binaries/node/workspace/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8743/胡凯-AI财务作品集.html';
const SHOT_DIR = path.join(__dirname, 'qa_shots');
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR);

const viewports = [
  { name: 'mobile_375', width: 375, height: 812 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'desktop_1280', width: 1280, height: 800 },
  { name: 'wide_1920', width: 1920, height: 1080 },
];

const results = [];
function record(viewport, check, ok, detail) {
  results.push({ viewport, check, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${viewport} | ${check}${detail ? ' | ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch();

  for (const vp of viewports) {
    console.log(`\n========== 视口 ${vp.name} (${vp.width}x${vp.height}) ==========`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200)); });
    page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message.slice(0, 200)));

    let navFailed = false;
    try {
      await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) { navFailed = true; consoleErrors.push('NAVFAIL: ' + e.message.slice(0, 200)); }
    record(vp.name, '页面加载', !navFailed, navFailed ? consoleErrors[0] : 'ok');
    if (navFailed) { await page.close(); continue; }

    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SHOT_DIR, `${vp.name}_top.png`) });

    // 主文档结构：.wrap 内关键区块
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
    record(vp.name, '主文档结构完整', struct.hero && struct.about && struct.works && struct.pipeline && struct.workFrame,
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
    record(vp.name, '无横向溢出', overflow.sw <= overflow.cw,
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
    record(vp.name, '作品矩阵 3+3 且 wide 在上', matrix.wide === 3 && matrix.mini === 3 && matrix.wideTop < matrix.miniTop,
      `wide=${matrix.wide} mini=${matrix.mini} miniCols=${matrix.miniCols} wideTop=${matrix.wideTop} miniTop=${matrix.miniTop}`);

    // 协作技术栈（v3.7 替换面试官速览）：6 标签 + 底部真实数据
    const stack = await page.evaluate(() => {
      const sec = [...document.querySelectorAll('.sec')].find(s => s.querySelector('h2') && s.querySelector('h2').textContent.includes('协作技术栈'));
      if (!sec) return null;
      const tags = [...sec.querySelectorAll('span[style*="border-radius:10px"]')];
      const flexWrap = sec.querySelector('[style*="flex-wrap"]');
      const data = sec.textContent.includes('57 封通信') && sec.textContent.includes('8 个主题归档');
      return { tags: tags.length, flex: flexWrap ? getComputedStyle(flexWrap).flexWrap : null, data };
    });
    record(vp.name, '协作技术栈 6 标签', stack && stack.tags === 6,
      stack ? `tags=${stack.tags} flex=${stack.flex}` : '区块缺失');
    record(vp.name, '技术栈底部真实数据', stack && stack.data,
      stack ? `57封=${stack.data}` : '无');
    record(vp.name, '技术栈 flex-wrap 换行', stack && stack.flex === 'wrap',
      stack ? `flex=${stack.flex}` : '无');

    // 主文档 reveal（滚动触发）
    const revealMain = await page.evaluate(async () => {
      const reveals = [...document.querySelectorAll('.reveal')];
      for (const r of reveals) { r.scrollIntoView({ block: 'center' }); await new Promise(x => setTimeout(x, 150)); }
      await new Promise(x => setTimeout(x, 250));
      const hidden = reveals.filter(r => !r.classList.contains('in'));
      return { total: reveals.length, hidden: hidden.map(h => (h.textContent || '').trim().slice(0, 25)) };
    });
    record(vp.name, '主文档 reveal 全部可见', revealMain.hidden.length === 0,
      `total=${revealMain.total}${revealMain.hidden.length ? ' hidden=' + JSON.stringify(revealMain.hidden) : ''}`);

    await page.screenshot({ path: path.join(SHOT_DIR, `${vp.name}_full.png`), fullPage: true });
    record(vp.name, '整页长截图', true, 'ok');
    record(vp.name, '无 console 错误', consoleErrors.length === 0,
      consoleErrors.length ? consoleErrors.join(' || ').slice(0, 300) : 'ok');
    await page.close();
  }

  // ====== v3.6 内容断言（1280 视口） ======
  console.log(`\n========== v3.6 内容断言 ==========`);
  const v36page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await v36page.goto(BASE, { waitUntil: 'networkidle' });
  await v36page.waitForTimeout(1000);

  // 三层角色卡：Manager + Senior Specialist + 决策者（在 #pipeline 段内）
  const roleCard = await v36page.evaluate(() => {
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
  record('v3.6', '三层角色卡 Claude+WorkBuddy+决策者', roleCard && roleCard.hasClaude && roleCard.hasWorkBuddy && roleCard.hasDecider,
    roleCard ? `C=${roleCard.hasClaude} WB=${roleCard.hasWorkBuddy} D=${roleCard.hasDecider} oldTri=${roleCard.hasOldTri}` : 'pipeline 缺失');
  record('v3.6', '旧称呼"三角分工"已移除', roleCard && !roleCard.hasOldTri,
    roleCard ? `hasOld=${roleCard.hasOldTri}` : 'pipeline 缺失');
  record('v3.6', '对外称呼 Manager/Specialist 清零', roleCard && !roleCard.hasOldRole,
    roleCard ? `oldRole=${roleCard.hasOldRole}` : 'pipeline 缺失');

  // 徽章：C 徽章 + WB 徽章（pipeline 区内 inline-block 圆形渐变元素）
  const badges = await v36page.evaluate(() => {
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
  record('v3.6', '徽章存在（C + WB）', badges && badges.count >= 2 && badges.texts.includes('C') && badges.texts.includes('WB'),
    badges ? `count=${badges.count} texts=${JSON.stringify(badges.texts)}` : 'pipeline 缺失');

  // Footer 协作引擎
  const footer = await v36page.evaluate(() => {
    const f = document.querySelector('.footer');
    if (!f) return null;
    return { text: f.textContent, hasCollab: f.textContent.includes('协作引擎') };
  });
  record('v3.6', 'Footer 含"协作引擎"', footer && footer.hasCollab,
    footer ? footer.text.slice(0, 80) : 'footer 缺失');

  // portfolioKB versions 含 v3.6（对象属性，检查 script 文本）
  const kbVer = await v36page.evaluate(() => {
    const scripts = [...document.querySelectorAll('script')];
    for (const s of scripts) {
      if (s.textContent.includes('portfolioKB') && s.textContent.includes('versions')) {
        const m = s.textContent.match(/versions:\s*'([^']*)'/);
        return { versions: m ? m[1] : '未匹配' };
      }
    }
    return null;
  });
  record('v3.7', 'portfolioKB versions 含 v3.7', kbVer && kbVer.versions.includes('v3.7'),
    kbVer ? kbVer.versions.slice(-80) : 'portfolioKB 未找到');

  // 协作进化段落（Token 效率讨论）
  const evoSec = await v36page.evaluate(() => {
    const text = document.body.textContent;
    return {
      hasToken: text.includes('Token') || text.includes('token'),
      hasPreflight: text.includes('预检'),
      hasManage: text.includes('我管理了一个 AI 团队') || text.includes('管理') && text.includes('AI 团队'),
    };
  });
  record('v3.6', '协作进化段落 Token+预检+AI 团队', evoSec && evoSec.hasToken && evoSec.hasPreflight,
    evoSec ? `token=${evoSec.hasToken} preflight=${evoSec.hasPreflight} manage=${evoSec.hasManage}` : '缺失');

  // ====== v3.7 内容断言 ======
  console.log(`\n========== v3.7 内容断言 ==========`);

  // 能力全景卡片：4 张（资金运营/审计内控/AI Agent 系统/数据分析）
  const capCards = await v36page.evaluate(() => {
    const cards = [...document.querySelectorAll('.sec[style*="margin-bottom:48px"] > div > div')];
    const titles = cards.map(c => (c.querySelector('div:nth-child(2)') || {}).textContent || '').filter(Boolean);
    const grid = document.querySelector('.sec[style*="margin-bottom:48px"] > div');
    const cols = grid ? getComputedStyle(grid).gridTemplateColumns : null;
    return { count: cards.length, titles, cols };
  });
  record('v3.7', '能力全景卡片 4 张', capCards && capCards.count === 4 && capCards.titles.length === 4,
    capCards ? `count=${capCards.count} titles=${JSON.stringify(capCards.titles)}` : '缺失');
  record('v3.7', '能力全景 4 列网格', capCards && capCards.cols && capCards.cols.split(' ').length === 4,
    capCards ? `cols=${capCards.cols}` : '无');
  record('v3.7', '能力全景 4 个能力点齐全', capCards && ['资金运营', '审计内控', 'AI Agent 系统', '数据分析'].every(t => capCards.titles.includes(t)),
    capCards ? JSON.stringify(capCards.titles) : '缺失');

  // 能力全景响应式：767px 视口 → 2 列
  const capMobile = await v36page.evaluate(() => {
    const grid = document.querySelector('.sec[style*="margin-bottom:48px"] > div');
    const el = document.createElement('div');
    return grid ? getComputedStyle(grid).gridTemplateColumns : null;
  });
  const mobilePage = await browser.newPage({ viewport: { width: 767, height: 900 } });
  await mobilePage.goto(BASE, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);
  const capColsMobile = await mobilePage.evaluate(() => {
    const grid = document.querySelector('.sec[style*="margin-bottom:48px"] > div');
    return grid ? getComputedStyle(grid).gridTemplateColumns : null;
  });
  record('v3.7', '能力全景 ≤767px 降为 2 列', capColsMobile && capColsMobile.split(' ').length === 2,
    capColsMobile ? `cols=${capColsMobile}` : '无');
  await mobilePage.close();

  // 称呼统一：诚实披露段落 WorkBuddy + w04 协作块 Architect（历史叙事 v1→v4 流水账允许保留）
  const naming = await v36page.evaluate(() => {
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
  record('v3.7', '称呼统一：诚实披露+协作描述块', naming.honestUpdated && naming.w04BlockUpdated,
    naming ? `honest=${naming.honestUpdated} w04=${naming.w04BlockUpdated}` : '缺失');
  record('v3.7', '协议链接 bridge/PROTOCOL.md 补回', naming.protocolLink,
    naming ? `link=${naming.protocolLink}` : '缺失');

  // 旧称呼检查（仅 pipeline 内允许 v1→v4 流水账保留，检查是否超范围出现）
  const oldNameScope = await v36page.evaluate(() => {
    const pipe = document.getElementById('pipeline');
    if (!pipe) return null;
    const text = pipe.textContent;
    const flowLines = ['参谋设计方向', '参谋一审', '执行者制作', '执行者 v2', '参谋二审', '执行者 v3', '参谋三审'];
    const outside = [];
    flowLines.forEach(l => { if (text.includes(l)) outside.push(l); });
    // 流水账行是否都在"完整协作闭环示例"块内
    const glass = [...pipe.querySelectorAll('.glass')].find(g => g.textContent.includes('完整协作闭环示例'));
    const glassText = glass ? glass.textContent : '';
    return { outside: outside.filter(l => !glassText.includes(l)), glassFound: !!glass };
  });
  record('v3.7', '旧称呼仅限流水账块内', oldNameScope && oldNameScope.outside.length === 0,
    oldNameScope ? `outside=${JSON.stringify(oldNameScope.outside)} glass=${oldNameScope.glassFound}` : '缺失');

  await v36page.close();

  // ====== iframe 作品页遍历（1280） ======
  console.log(`\n========== 作品页 iframe 遍历 ==========`);
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const navItems = await page.evaluate(() => {
    return [...document.querySelectorAll('nav a, .nav a, .top-nav a')].map(a => ({ text: a.textContent.trim().slice(0, 12), href: a.getAttribute('href') }));
  });
  record('交互', '导航项存在', navItems.length >= 3, JSON.stringify(navItems));

  // work id 映射表（期望 page-0N -> work-0N）
  const expectMap = { '01': 'work-01', '02': 'work-02', '03': 'work-03', '04': 'work-04', '05': 'work-05', '06': 'work-06' };
  const demoCheck = { '06': 'demo/SOX控制测试工作台.html' };
  for (const [pid, expectId] of Object.entries(expectMap)) {
    await page.evaluate(i => {
      const sel = `.works a[onclick*="showWork('${i}')"], .works-mini a[onclick*="showWork('${i}')"]`;
      const el = document.querySelector(sel);
      if (el) el.click();
    }, pid);
    await page.waitForTimeout(1300);
    const info = await page.evaluate(() => {
      const wf = document.getElementById('workFrame');
      const ifr = wf ? wf.querySelector('iframe') : null;
      const doc = ifr ? ifr.contentDocument : null;
      if (!doc) return null;
      const visible = [...doc.querySelectorAll('.portfolio-page')].filter(s => getComputedStyle(s).display !== 'none');
      const demo = [...doc.querySelectorAll('a[href*="demo/"], iframe[src*="demo/"]')].map(el => el.getAttribute('href') || el.getAttribute('src'));
      // 滚动触发所有 reveal
      return { visibleId: visible.map(s => s.id), demo, iframeOk: true };
    });
    const idOk = info && info.visibleId.length === 1 && info.visibleId[0] === expectId;
    record('交互', `showWork(${pid}) → ${expectId}`, idOk, info ? JSON.stringify(info) : 'iframe 缺失');
    if (demoCheck[pid]) {
      record('交互', `work-${pid} demo 链接`, info && info.demo.includes(demoCheck[pid]), info ? JSON.stringify(info.demo) : '无');
    }
  }

  // demo 链接 HTTP 可达性
  try {
    const resp = await page.request.get('http://127.0.0.1:8743/demo/SOX控制测试工作台.html');
    record('交互', 'SOX demo HTTP 可达', resp.ok(), resp.status() + '');
  } catch (e) {
    record('交互', 'SOX demo HTTP 可达', false, e.message.slice(0, 100));
  }

  await page.close();
  await browser.close();

  // ====== 汇总 ======
  console.log(`\n========== 汇总 ==========`);
  const fails = results.filter(r => !r.ok);
  console.log(`总检查项: ${results.length}, 通过: ${results.length - fails.length}, 失败: ${fails.length}`);
  if (fails.length) {
    console.log('\n失败明细:');
    fails.forEach(f => console.log(`  [${f.viewport}] ${f.check}: ${f.detail}`));
  }
  process.exit(fails.length ? 1 : 0);
})();
