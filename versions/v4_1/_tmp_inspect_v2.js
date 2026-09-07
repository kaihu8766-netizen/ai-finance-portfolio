const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0',
    bypassCSP: true
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8747/胡凯-AI财务作品集.html?nocache=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.click('text=作品3');
  await page.waitForTimeout(2500);

  const chart3Info = await page.evaluate(() => {
    const chart3 = window.chart3;
    if (!chart3) return { error: 'chart3 not found' };
    const opt = chart3.getOption();
    const series = opt.series.find(s => s.name === '历史利差 (5Y-1Y)');
    if (!series) return { error: 'series not found', seriesNames: opt.series.map(s => s.name) };
    return {
      markPoint: series.markPoint,
      dataFirst3: series.data ? series.data.slice(0, 3) : null,
      dataLast3: series.data ? series.data.slice(-3) : null,
    };
  });
  console.log('chart3Info:', JSON.stringify(chart3Info, null, 2));
  await browser.close();
})();
