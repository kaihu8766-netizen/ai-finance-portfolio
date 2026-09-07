/**
 * 作品集 v3.8 视觉自检配置（VISUAL-TEST-UPGRADE-TOHAVESCREENSHOT）
 * 配套 qa_visual_check.js v8：@playwright/test test runner + toHaveScreenshot 像素基线
 * 基线目录：qa_shots/baseline/qa_visual_check.js-snapshots/
 * 运行：
 *  首次建基线：node <managed>/@playwright/test/cli.js test --update-snapshots
 *  日常自检：  node <managed>/@playwright/test/cli.js test
 */
const { defineConfig } = require('C:/Users/ROG/.workbuddy/binaries/node/workspace/node_modules/@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'qa_visual_check.js',
  timeout: 120000,
  workers: 1,            // 串行：避免截图/服务器资源竞争
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8744',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  snapshotDir: 'qa_shots/baseline',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,   // 允许 2% 像素差（抗锯齿/亚像素）
      maxDiffPixels: 500,
      threshold: 0.2,
      animations: 'disabled',    // 强制动画跳到最终态（与页面 prefers-reduced-motion 双保险）
    },
  },
  webServer: {
    command: '"C:/Users/ROG/.workbuddy/binaries/python/versions/3.13.12/python.exe" -m http.server 8744',
    url: 'http://127.0.0.1:8744/胡凯-AI财务作品集.html',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
