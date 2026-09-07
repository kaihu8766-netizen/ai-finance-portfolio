const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('console', msg => console.log('[BROWSER]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[ERR]', err.message));
  await page.goto('http://localhost:8747/胡凯-AI财务作品集.html?nocache=' + Date.now());
  await page.waitForTimeout(800);
  await page.evaluate(() => { showWork('03'); });
  await page.waitForTimeout(1500);
  const frame = page.frames().find(f => f.url() === 'about:srcdoc');
  const info = await frame.evaluate(() => {
    var c = echarts.getInstanceByDom(document.getElementById('chart3'));
    if (!c) return 'no chart3 instance';
    var opt = c.getOption();
    var s = opt.series;
    var histIdx = s.findIndex(x => x.name === '历史利差 (5Y-1Y)');
    var histSeries = s[histIdx];
    return {
      histLabel: histSeries.label,
      histMarkPoint: histSeries.markPoint,
      spreadHist_first: histSeries.data[0],
      spreadHist_4: histSeries.data[4],
      spreadHist_11: histSeries.data[11]
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();