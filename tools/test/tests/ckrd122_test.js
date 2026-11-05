// 受付 v122：読み取りを減らす。会員証のこれからのイベントは10分覚える・裏面の設定は6時間・解禁は30分／会計タブは2分以内なら読み直さない／
//   受付の名簿は参加ユニオン＋自分のユニオンだけ（架空データ）
const fs = require('fs'), path = require('path');
const P = require('../lib/ckpage.js');
const H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const after = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
(async () => {
  c('これからのイベント：日付順に30件まで・代わりの読み方は90日先まで40件まで', /where\('date', '>=', t\)\.orderBy\('date'\)\.limit\(30\)\.get\(\)/.test(H) && /where\('date', '<=', end\)\.orderBy\('date'\)\.limit\(40\)/.test(H));
  c('受付の名簿は参加ユニオン＋自分のユニオンだけ', /var unionSet = \[gUnion\];\n  \(ev\.unions \|\| \[\]\)\.forEach/.test(H) && !/var unionSet = ckViewableUnions\(\);/.test(H));
  c('会計タブは同じユニオン・月を2分以内に読んでいたら読み直さない', /if\(!\(gFinLoaded\.k === fk && Date\.now\(\) - gFinLoaded\.at < 120000\)\) loadFinanceTab\(\);/.test(H));
  c('裏面の設定なし（none の印）は組み込みの裏面のまま', /if\(c && !c\.none\) return/.test(H));
  c('APP_VER v122以降・v122のお知らせ', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 122 && /\n  \{ v: 'v122', d: '2026\/11\/05'/.test(H));
  const b = await P.browser();
  const tok = '0123456789abcdef0123456789abcdef';
  const data = { ['cards/' + tok]: { no: 'ZZ0001', name: '見本 太郎', union: 'ANTARES', active: true },
    'checkinEvents/e1': { name: '見本ハウディ1', date: after(3), month: after(3).slice(0, 7), unions: ['ANTARES'], hostUnion: 'ANTARES' },
    'checkinEvents/e2': { name: 'ほかのユニオン', date: after(4), month: after(4).slice(0, 7), unions: ['OTHER'], hostUnion: 'OTHER' } };
  const o = await P.open(b, { hash: '#c=' + tok, data });
  const t1 = await o.ev(`document.getElementById('nextArea').innerText`);
  c('会員証にこれからのイベント（自分のユニオンだけ）', /見本ハウディ1/.test(t1) && !/ほかのユニオン/.test(t1), t1);
  const st = JSON.parse(await o.ev(`localStorage.getItem('bci_up_ANTARES')`));
  c('読んだ結果を端末に覚える（自分のユニオンの分だけ）', st && st.list.length === 1 && st.list[0].id === 'e1');
  // 新しいイベントを足して開き直す → 10分は覚えた結果のまま
  await o.ev(`(function(){ localStorage.setItem('bci_up_ANTARES', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('bci_up_ANTARES')), { list: [{ id: 'e9', d: { name: '覚えていた分', date: '${after(5)}', unions: ['ANTARES'] } }] }))); })()`);
  await o.page.reload(); await o.wt(1500);
  c('10分以内に開き直したら覚えた結果を使う（読み直さない）', /覚えていた分/.test(await o.ev(`document.getElementById('nextArea').innerText`)));
  await o.ev(`(function(){ var x=JSON.parse(localStorage.getItem('bci_up_ANTARES')); x.at = Date.now() - 11*60000; localStorage.setItem('bci_up_ANTARES', JSON.stringify(x)); })()`);
  await o.page.reload(); await o.wt(1500);
  c('10分たったら読み直す', /見本ハウディ1/.test(await o.ev(`document.getElementById('nextArea').innerText`)));
  c('裏面・解禁の設定も覚える', !!(await o.ev(`localStorage.getItem('bci_launch_c')`)) && !!(await o.ev(`localStorage.getItem('bci_cbk_ANTARES')`)));
  c('エラーなし', !o.errs.length, o.errs.join('/'));
  await o.ctx.close();
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
