// v895：MAP（現状・理想）を開いている間だけ新しいトーン（NAVIGATOR トーン表）。PC はカードの色・角・札、スマホは札の色。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  c('色は MAP を開いている時だけ（body[data-v=current/ideal]）・ライトとダーク', /body\[data-v="current"\]:not\(\.light\),body\[data-v="ideal"\]:not\(\.light\)\{[^}]*--accent:#EFFF40/.test(html) && /body\.light\[data-v="current"\],body\.light\[data-v="ideal"\]\{[^}]*--bg:#F6F6F1/.test(html));
  c('書体 Outfit・Zen Kaku Gothic New を読み込む', /family=Outfit/.test(html) && /Zen\+Kaku\+Gothic\+New/.test(html));
  c('選択中はチャコール（イエローは大事な操作だけ）', /\.pt-ms\.active[^{]*\{background:var\(--nv-ink\)/.test(html) && /\.pcs-item\.active\{background:var\(--nv-ink\)/.test(html));
  T.login(); setWH(1440, 1000); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '見本', firstName: '一', title: 'ゴールド', parentId: '', mapType: 'both', activity: 'S', actRate: 90, ptCurrent: 1000 },
    { id: 'a', lastName: '見本', firstName: '二', title: 'Q2', parentId: 'r', mapType: 'both', activity: 'A', ptCurrent: 300 },
    { id: 'b', lastName: '見本', firstName: '三', title: 'PG', parentId: 'r', mapType: 'both', trainee: true },
    { id: 'd', lastName: '見本', firstName: '四', title: 'B2', parentId: 'r', mapType: 'both', activity: 'B', ptCurrent: 100 }];
  w.switchView('current'); await sleep(250);
  c('MAP を開くと body の data-v が current', w.document.body.getAttribute('data-v') === 'current');
  c('新しいトーンが入っている', w.NV_TONE === true && w.NV_LINE.length === 4);
  const g = $('[data-mid="a"]'), tr = $('[data-mid="b"]'), rt = $('[data-mid="r"]');
  const rect = g && g.querySelector('rect');
  c('PC のカード：角は20px・地は白（ライト）か暗い灰（ダーク）', !!rect && rect.getAttribute('rx') === '20' && /^#(FFFFFF|262425)$/.test(rect.getAttribute('fill')), rect && rect.getAttribute('rx') + ' ' + rect.getAttribute('fill'));
  c('PC：審査中（Q2）にも上に「審査中」の札', !!g && /審査中/.test(g.textContent), g && g.textContent);
  c('PC：研修生は上に「研修生」の札', !!tr && /研修生/.test(tr.textContent));
  c('PC：光らせない（脈打つ輪・光るクラスなし）', !$$('.pc-pulse-ring').length && !$$('.oval-node.pc-fresh,.oval-node.pc-care-tr').length);
  c('PC：BR以上の札はバイオレット', !!rt && [...rt.querySelectorAll('rect')].some(x => /^#(602BFC|B095FE)$/.test(x.getAttribute('fill'))));
  const lk = [...$$('path.pc-link')].map(p => p.getAttribute('stroke'));
  c('PC：系列の線は4色のどれか・細め', lk.length > 0 && lk.every(s => w.NV_LINE.indexOf(s) >= 0) && $('path.pc-link').getAttribute('stroke-width') === '2.5', lk.join());
  c('稼働の札の色（S はターコイズ・C は線だけ）', w._nvActCol('S', true).bg === '#26C7B3' && w._nvActCol('C', true).bg === 'none' && !!w._nvActCol('C', true).line);
  c('上の札の色（審査中＝イエロー・研修生＝ターコイズ・フレッシュ＝バイオレット）', w._nvLabelCol('exam', true).bg === '#EFFF40' && w._nvLabelCol('trainee', true).bg === '#DEF7F4' && w._nvLabelCol('fresh', true).bg === '#E7DFFF');
  // スマホの一覧の札
  const row = w._mxRowHtml({ id: 'a', lastName: '見本', firstName: '二', title: 'Q2', activity: 'A' }, 'current', 1, [], true, '#26C7B3', 0, false, false);
  c('スマホ：タイトルの札は区分の色（var(--nvt-ex)）', /background:var\(--nvt-ex\);color:var\(--nvt-ex-ink\)/.test(row), row.slice(0, 200));
  c('スマホ：系列の線も4色', w.MX_FAM === w.NV_LINE);
  c('APP_JS_VERSION v895 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(fs.readFileSync(path.join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 895);
});
