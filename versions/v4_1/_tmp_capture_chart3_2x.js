const { chromium } = require('playwright');
(async () => {
  const shotDir = 'C:/Users/ROG/WorkBuddy/2026-08-02-03-41-55/outputs/作品集/胡凯-AI财务作品集-v4_1/qa_shots';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1100 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  await page.goto('http://localhost:8747/胡凯-AI财务作品集.html?nocache=' + Date.now());
  await page.waitForTimeout(800);
  await page.evaluate(() => { showWork('03'); });
  await page.waitForTimeout(1500);
  const frame = page.frames().find(f => f.url() === 'about:srcdoc');
  if (!frame) { console.log('ERROR: iframe not found'); await browser.close(); return; }
  await frame.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  // chart3 高分辨率
  const chart3 = await frame.$('#chart3');
  if (chart3) {
    await chart3.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await chart3.screenshot({ path: shotDir + '/v44b_chart3_2x.png', type: 'png' });
  }
  // 加上 chart3 周边 (含 markLine "今天·预测起点" 标签)
  // 用 frame evaluate 获取 chart3 bounding rect, 再截 box 扩展
  const box = await chart3.boundingBox();
  const expandedBox = {
    x: Math.max(0, box.x - 20),
    y: Math.max(0, box.y - 20),
    width: box.width + 80,
    height: box.height + 60
  };
  await page.screenshot({ path: shotDir + '/v44b_chart3_area.png', clip: expandedBox });
  await browser.close();
  console.log('done');
})();