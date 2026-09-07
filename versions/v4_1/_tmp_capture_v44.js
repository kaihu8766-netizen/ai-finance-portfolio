const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const shotDir = 'C:/Users/ROG/WorkBuddy/2026-08-02-03-41-55/outputs/作品集/胡凯-AI财务作品集-v4_1/qa_shots';
  if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto('http://localhost:8747/胡凯-AI财务作品集.html?nocache=' + Date.now());
  await page.waitForTimeout(800);
  // 打开 w03 作品（主页上下文）
  await page.evaluate(() => { showWork('03'); });
  await page.waitForTimeout(1500);
  // 进入 workIframe
  const frame = page.frames().find(f => f.url() === 'about:srcdoc');
  if (!frame) { console.log('ERROR: iframe not found'); await browser.close(); return; }
  // 触发 reveal 动画完成
  await frame.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  // chart1 detail
  const chart1 = await frame.$('#chart1');
  if (chart1) {
    await chart1.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await chart1.screenshot({ path: shotDir + '/v44_chart1.png', type: 'png' });
  } else console.log('WARN: #chart1 not found in iframe');
  // chart2 + chart3
  const chart2 = await frame.$('#chart2');
  if (chart2) {
    await chart2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await chart2.screenshot({ path: shotDir + '/v44_chart2.png', type: 'png' });
  }
  const chart3 = await frame.$('#chart3');
  if (chart3) {
    await chart3.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await chart3.screenshot({ path: shotDir + '/v44_chart3.png', type: 'png' });
  }
  // full page：把 viewport 撑到 iframe 内容全高，整页截取（元素截图不支持 fullPage 展开）
  const fullH = await frame.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 1280, height: Math.min(fullH + 120, 30000) });
  await page.waitForTimeout(900);  // 等图表 resize + 动画完成
  const body = await frame.$('body');
  if (body) {
    await body.screenshot({ path: shotDir + '/v44_w03_full.png', type: 'png' });
    console.log('full page height=' + fullH);
  } else console.log('WARN: body not found');
  await browser.close();
  console.log('done');
})();
