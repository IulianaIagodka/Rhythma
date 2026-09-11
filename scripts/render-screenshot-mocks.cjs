const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const mockDir = '/workspace/docs/screenshots/mocks';
const outDir = '/opt/cursor/artifacts/app-store-mocks';
fs.mkdirSync(outDir, { recursive: true });

const screens = ['01-today-dark', '02-year', '03-today-light'];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/local/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--font-render-hinting=none'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1284, height: 2778, deviceScaleFactor: 1 });

  for (const name of screens) {
    const file = path.join(mockDir, `${name}.html`);
    await page.goto(`file://${file}`, { waitUntil: 'networkidle0', timeout: 30000 });
    const dest = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: dest, type: 'png', clip: { x: 0, y: 0, width: 1284, height: 2778 } });
    fs.copyFileSync(dest, path.join(mockDir, `${name}.png`));
    console.log('wrote', dest);
  }

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
