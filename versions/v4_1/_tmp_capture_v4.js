const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const shotDir = 'C:/Users/ROG/WorkBuddy/2026-08-02-03-41-55/outputs/作品集/胡凯-AI财务作品集-v4_1/qa_shots';
  const userDataDir = 'C:/Users/ROG/WorkBuddy/2026-08-02-03-41-55/outputs/作品集/胡凯-AI财务作品集-v4_1/playwright_temp_' + Date.now();
  fs.mkdirSync(userDataDir, { recursive: true });
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    viewport: { width: 2400, height: 1600 },
    deviceScaleFactor: 2.5,
    args: ['--disable-cache', '--disable-application-cache', '--disk-cache-size=1']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:8747/胡凯-AI财务作品集.html?nocache=' + Date.now(), { waitUntil: 'networkidle' });
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
  const filename = 'chart3_v4_' + Date.now() + '.png';
  await chart3.screenshot({ path: shotDir + '/' + filename, type: 'png' });
  const stat = fs.statSync(shotDir + '/' + filename);
  console.log('saved:', filename, 'size=', stat.size);
  await browser.close();
  // 清理临时 user-data-dir
  fs.rmSync(userDataDir, { recursive: true, force: true });
})();