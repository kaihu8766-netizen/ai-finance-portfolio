const { chromium } = require('playwright');
(async () => {
  const shotDir = 'C:/Users/ROG/WorkBuddy/2026-08-02-03-41-55/outputs/作品集/胡凯-AI财务作品集-v4_1/qa_shots';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 2400, height: 1600 },
    deviceScaleFactor: 2.5,
    bypassCSP: true
  });
  // 拦截请求清除缓存
  await context.route('**/*', async (route) => {
    const headers = { ...route.request().headers(), 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' };
    await route.continue({ headers });
  });
  const page = await context.newPage();
  await page.goto('http://localhost:8747/胡凯-AI财务作品集.html?cb=' + Math.random(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate(() => { showWork('03'); });
  await page.waitForTimeout(1500);
  const frame = page.frames().find(f => f.url() === 'about:srcdoc');
  await frame.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  const chart3 = await frame.$('#chart3');
  await chart3.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const filename = 'chart3_v3_' + Date.now() + '.png';
  await chart3.screenshot({ path: shotDir + '/' + filename, type: 'png' });
  console.log('saved:', filename);
  await browser.close();
})();