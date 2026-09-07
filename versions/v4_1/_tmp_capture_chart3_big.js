const { chromium } = require('playwright');
(async () => {
  const shotDir = 'C:/Users/ROG/WorkBuddy/2026-08-02-03-41-55/outputs/作品集/胡凯-AI财务作品集-v4_1/qa_shots';
  const browser = await chromium.launch({ headless: true });
  // 大 viewport + 高 DPI + 单独看 chart3
  const context = await browser.newContext({
    viewport: { width: 2400, height: 1600 },
    deviceScaleFactor: 2.5
  });
  const page = await context.newPage();
  await page.goto('http://localhost:8747/胡凯-AI财务作品集.html?nocache=' + Date.now());
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
  await page.waitForTimeout(600);
  // 直接放大 chart3 截图
  await chart3.screenshot({ path: shotDir + '/v44e_chart3_big.png', type: 'png' });
  console.log('done');
  await browser.close();
})();