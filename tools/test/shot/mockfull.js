const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const p = await b.newPage({ viewport: { width: +(process.env.W||1300), height: +(process.env.H||940) }, deviceScaleFactor: +(process.env.DPR||1.5) });
  await p.goto('file://' + __dirname + '/' + process.argv[2]);
  await p.waitForTimeout(400);
  await p.screenshot({ path: __dirname + '/' + process.argv[3], fullPage: true });
  await b.close();
})();
