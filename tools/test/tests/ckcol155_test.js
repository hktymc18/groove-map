// 受付 v155・NAVIGATOR v881：カードコレクション（#col）を、PCの広い画面ではカードを横にたくさん並べる。NAVIGATOR のライト／ダーク（&th=）に合わせる（架空データ）
// v160: 背景の色はコムギニュースと同じ（ライト #f2f2f3・ダーク #1f2023）
const fs = require('fs'), path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
const me = { name: '見本 太郎', union: 'ANTARES', area: '福岡', upRuby: 'x', upBd: 'x', status: 'active', ckNo: 'A0009' };
const design = { no: 'A0002', name: '架空 魔女', union: 'ANTARES', cardTitle: 'TEAM ELITE', skin: 'reaperTcg', skinName: '見本ウィッチ', skinHp: '170', skinSerial: '1/1000', badges: [] };
const data = { ['users/' + OWNER]: me, 'olCheckouts/k2_A0009_20261103': { key: 'k2', no: 'A0009', name: '見本 太郎', union: 'ANTARES', aNo: 'A0002', aName: '架空 魔女', special: true, serial: 12, design, ymd: '20261103', atMs: 3, impression: 'x', notice: 'y', task: {} } };
(async () => {
  const b = await P.browser();
  try {
    const look = (o) => o.ev(`(function(){ var g = document.querySelector('#colBox .col-grid.bind'), s = document.querySelector('#colSlot0'); return { cols: getComputedStyle(g).gridTemplateColumns.split(' ').length, cw: s.offsetWidth,
      bg: getComputedStyle(document.body).backgroundColor, th: document.documentElement.getAttribute('data-theme'), ghosts: document.querySelectorAll('#colBox [data-ghost]').length,
      fit: [].every.call(g.children, function(x){ return x.getBoundingClientRect().right <= innerWidth; }) }; })()`);
    // PC（ライト・端末はダーク）
    const pc = await P.open(b, { hash: '#col&th=light', data, dark: true, vw: 1280, vh: 800, wait: 2400 });
    const a = await look(pc);
    c('PC: カードを横にたくさん並べる（6列以上）・はみ出さない', a.cols >= 6 && a.fit && a.ghosts === 19, JSON.stringify(a));
    c('PC: カードは大きめ（150px より大きい）', a.cw > 150, a.cw);
    c('端末がダークでも、NAVIGATOR がライトならライト（明るい背景）', a.th === 'light' && a.bg === 'rgb(242, 242, 243)', JSON.stringify(a));
    await pc.page.screenshot({ path: path.join(OUT, 'ckcol155_pc_light.png') });
    // 窓を狭くすると列が減る
    await pc.page.setViewportSize({ width: 900, height: 800 }); await pc.wt(700);
    const a2 = await look(pc);
    c('窓の幅を変えると、列の数を合わせ直す', a2.cols < a.cols && a2.cols >= 4 && a2.fit, JSON.stringify(a2));
    // PC（ダーク・端末はライト）
    const dk = await P.open(b, { hash: '#col&th=dark', data, dark: false, vw: 1280, vh: 800, wait: 2400 });
    const d = await look(dk);
    c('端末がライトでも、NAVIGATOR がダークならダーク（暗い背景）', d.th === 'dark' && d.bg === 'rgb(31, 32, 35)', JSON.stringify(d));
    await dk.page.screenshot({ path: path.join(OUT, 'ckcol155_pc_dark.png') });
    // スマホは3列のまま
    const sp = await P.open(b, { hash: '#col&th=light', data, vw: 390, vh: 844, wait: 2400 });
    const s = await look(sp);
    c('スマホは今までどおり3列', s.cols === 3 && s.fit && s.cw <= 150, JSON.stringify(s));
    // th が無い時（会員証から直接など）は端末の設定のまま
    const no = await P.open(b, { hash: '#col', data, dark: true, vw: 390, vh: 844, wait: 2400 });
    const n = await look(no);
    c('th が無い時は端末の設定に合わせる（今までどおり）', n.th === null && n.bg === 'rgb(31, 32, 35)', JSON.stringify(n));
    const errs = pc.errs.concat(dk.errs, sp.errs, no.errs);
    c('ページのエラーなし', errs.length === 0, JSON.stringify(errs));
    const H = fs.readFileSync(path.join(__dirname, '../../../checkin/index.html'), 'utf8'), A = fs.readFileSync(path.join(__dirname, '../../../app.js'), 'utf8');
    c('APP_VER v155 以上・APP_JS_VERSION v881 以上', +(/var APP_VER = 'v(\d+)'/.exec(H) || [0, 0])[1] >= 155 && +(/APP_JS_VERSION = 'v(\d+)'/.exec(A) || [0, 0])[1] >= 881);
  } finally { await b.close(); }
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
