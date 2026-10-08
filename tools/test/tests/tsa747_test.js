// v747：iPhoneのSafariが一部の文字だけ勝手に大きくする（テキストの自動拡大）のを止める設定が消えていないか
const fs = require('fs'), path = require('path');
const T = require('../lib/head.js')();
const { c } = T;
T.run(async () => {
  const root = path.resolve(__dirname, '../../..');
  const re = /html\s*\{[^}]*-webkit-text-size-adjust:\s*100%[^}]*\}/;
  c('MAP本体（index.html）に -webkit-text-size-adjust:100%', re.test(fs.readFileSync(root + '/index.html', 'utf8')));
  c('受付（checkin/index.html）にも', re.test(fs.readFileSync(root + '/checkin/index.html', 'utf8')));
  const st = T.w.getComputedStyle(T.w.document.documentElement);
  c('読み込んだページでも効いている', /100%/.test(st.webkitTextSizeAdjust || st.getPropertyValue('-webkit-text-size-adjust') || '') || re.test(T.w.document.head.innerHTML));
});
