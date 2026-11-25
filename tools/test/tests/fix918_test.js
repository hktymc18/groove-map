// v918：#50 設定から開いた「MAPの共有」が設定の画面の後ろに隠れない／#49 予定の「どこに出すか」の言葉。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, setWH } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  c('#50 開いている .overlay は設定の画面（z-index 300）より前（305）', /\.overlay\.open\{opacity:1;pointer-events:all;z-index:305\}/.test(html));
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.switchView('menu'); await sleep(50); w.setOpen(); await sleep(50);
  w.openShareModal(); await sleep(50);
  const sp = w.document.getElementById('setPg'), sm = w.document.getElementById('shareModal');
  const z = el => parseInt(w.getComputedStyle(el).zIndex, 10) || 0;
  c('#50 設定を開いたまま「MAPの共有」を開くと、共有の画面が前に出る', !!sp && !!sm && sm.classList.contains('open') && z(sm) > z(sp), sp && sm && (z(sm) + ' > ' + z(sp)));
  c('#49 古い予定の画面：「どこに出すか」「MAPのカードだけ」とカレンダーには入らない説明', /どこに出すか（メンバーを選んだ時）/.test(html) && /MAPのカードだけ/.test(html) && /メンバー本人のアプリのカレンダーには入りません/.test(html));
  const app = fs.readFileSync(path.join(__dirname, '../../../app.js'), 'utf8');
  c('#49 新しい予定の画面も同じ言葉', /'<div class="efl">どこに出すか<\/div>/.test(app) && /MAPのカードだけ<small>自分のカレンダーには出さない/.test(app));
});
