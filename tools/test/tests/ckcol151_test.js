// 受付 v151：カードコレクション（#col）に「これから集めるカードの枠（影のカード）」を20枠。進み具合のバーは出さない（全部で何枚になるか分からないため）
//   1枚もない時は集め方の3ステップ（普通のOLを受けた回数も）・集めた後も、カードの後ろに影の枠（20枠ごと）。影を押すと震えて集め方（架空データ）
const fs = require('fs'), path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
const me = { name: '見本 太郎', union: 'ANTARES', area: '福岡', upRuby: 'x', upBd: 'x', status: 'active', ckNo: 'A0009' };
const ol = (id, o) => ({ ['olCheckouts/' + id]: Object.assign({ key: 'k', no: 'A0009', name: '見本 太郎', union: 'ANTARES', aNo: 'A0001', aName: '架空 花子', special: false, serial: 3, ymd: '20261101', atMs: 1, impression: '学びが多かった', notice: '話し方', task: {} }, o) });
const design = { no: 'A0002', name: '架空 魔女', union: 'ANTARES', cardTitle: 'TEAM ELITE', skin: 'reaperTcg', skinName: '見本ウィッチ', skinHp: '170', skinSerial: '1/1000', badges: [] };
(async () => {
  const b = await P.browser();
  try {
    const run = async (name, extra) => {
      const o = await P.open(b, { hash: '#col', data: Object.assign({ ['users/' + OWNER]: me }, extra), wait: 2200 });
      const r = await o.ev(`({ ghosts: document.querySelectorAll('#colBox [data-ghost]').length, cards: document.querySelectorAll('#colBox [data-gi]').length,
        how: !!document.querySelector('#colBox .col-how'), text: document.getElementById('colBox').textContent,
        bar: !!document.querySelector('#colBox progress, #colBox .col-bar'), cols: getComputedStyle(document.querySelector('#colBox .col-grid')).gridTemplateColumns.split(' ').length,
        firstNo: (document.querySelector('#colBox [data-ghost] em') || {}).textContent })`);
      await o.page.screenshot({ path: path.join(OUT, 'ckcol151_' + name + '.png'), fullPage: false });
      return Object.assign(r, { o });
    };
    // ① まったく無い
    const a = await run('empty', {});
    c('1枚もない時: 影のカードが20枠・3列', a.ghosts === 20 && a.cards === 0 && a.cols === 3, JSON.stringify({ g: a.ghosts, c: a.cards, cols: a.cols }));
    c('集め方の3ステップを出す・進み具合のバーは出さない', a.how && /カードを集めよう/.test(a.text) && /OLチェックアウト/.test(a.text) && !a.bar && !/種類・/.test(a.text) && a.firstNo === 'No.01');
    c('OLを受けていない人には「〇回受けています」を出さない', !/回受けています/.test(a.text));
    // 影を押す → 震えて集め方
    await a.o.page.click('#colBox [data-ghost]'); await a.o.wt(200);
    const sh = await a.o.ev(`({ shake: document.querySelector('#colBox [data-ghost]').classList.contains('shake'), toast: document.body.textContent.indexOf('ここにカードが入ります') >= 0 })`);
    c('影を押すと震えて「ここにカードが入ります」', sh.shake && sh.toast, JSON.stringify(sh));
    // ② 普通のOLだけ2回
    const p = await run('olonly', Object.assign({}, ol('k_A0009_20261101'), ol('k_A0009_20261102', { ymd: '20261102', atMs: 2 })));
    c('普通のOLだけの人: 影20枠と「OLはもう 2 回受けています」', p.ghosts === 20 && p.cards === 0 && /OLはもう 2 回受けています/.test(p.text), p.text.slice(0, 200));
    // ③ 特別なカードを1枚
    const q = await run('one', ol('k2_A0009_20261103', { key: 'k2', aNo: 'A0002', aName: '架空 魔女', special: true, serial: 12, design, ymd: '20261103', atMs: 3 }));
    c('1枚持っている人: カード1枚＋影19枠（No.02から）・集め方は出さない', q.cards === 1 && q.ghosts === 19 && q.firstNo === 'No.02' && !q.how && /1種類・1枚/.test(q.text), JSON.stringify({ c: q.cards, g: q.ghosts, n: q.firstNo }));
    const sz = await q.o.ev(`(function(){ var s = document.querySelector('#colSlot0'), g = document.querySelector('#colBox [data-ghost] .col-gs'); return { sw: s.offsetWidth, sh: s.offsetHeight, gw: g.offsetWidth, gh: g.offsetHeight }; })()`);
    c('集めたカードと影の枠は同じ大きさ', Math.abs(sz.sw - sz.gw) <= 1 && Math.abs(sz.sh - sz.gh) <= 3, JSON.stringify(sz));
    const fit = await q.o.ev(`(function(){ var g = document.querySelector('#colBox .col-grid'), r = g.getBoundingClientRect(); return [].every.call(g.children, function(x){ var b = x.getBoundingClientRect(); return b.right <= r.right + 0.5 && b.right <= window.innerWidth; }); })()`);
    c('3列が画面からはみ出さない', fit);
    const errs = a.o.errs.concat(p.o.errs, q.o.errs);
    c('ページのエラーなし', errs.length === 0, JSON.stringify(errs));
    const H = fs.readFileSync(path.join(__dirname, '../../../checkin/index.html'), 'utf8');
    c('APP_VER v151 以上', +(/var APP_VER = 'v(\d+)'/.exec(H) || [0, 0])[1] >= 151);
  } finally { await b.close(); }
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
