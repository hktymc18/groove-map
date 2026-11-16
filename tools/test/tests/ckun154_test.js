// 受付 v154：新規登録・プロフィールの所属ユニオンは、オーナーが決めた一覧（appConfig/unions）から選ぶだけ（架空データ）
const fs = require('fs'), path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const cfg = { 'appConfig/unions': { list: [{ name: 'LIEN', upbd: '見本 一郎' }, { name: 'REVE', upbd: '見本 花子' }], names: ['LIEN', 'REVE'] } };
(async () => {
  const b = await P.browser();
  try {
    // プロフィール登録（ユニオンが無いアカウント）
    const o = await P.open(b, { hash: '', uid: 'newbie1', data: Object.assign({ 'users/newbie1': { name: '見本 新人', status: 'pending' } }, cfg), wait: 2200 });
    const v = await o.ev(`({ vis: !document.getElementById('vProfile').classList.contains('hide') || getComputedStyle(document.getElementById('vProfile')).display !== 'none', tag: document.getElementById('pfUnion').tagName,
      opts: [].map.call(document.getElementById('pfUnion').options, function(x){ return x.value; }) })`);
    c('プロフィールの所属ユニオンは選ぶ欄（一覧の名前だけ）', v.tag === 'SELECT' && JSON.stringify(v.opts) === JSON.stringify(['', 'LIEN', 'REVE']), JSON.stringify(v));
    await o.page.selectOption('#pfUnion', 'REVE'); await o.wt(150);
    c('選ぶと、アップBDにそのユニオンの名前が入る', await o.ev(`document.getElementById('pfUpBd').value`) === '見本 花子');
    await o.page.selectOption('#pfUnion', 'LIEN'); await o.wt(150);
    c('選び直すと、自動で入れたアップBDも変わる', await o.ev(`document.getElementById('pfUpBd').value`) === '見本 一郎');
    await o.ev(`document.getElementById('pfUpBd').value = '見本 自分で'`); await o.page.selectOption('#pfUnion', 'REVE'); await o.wt(150);
    c('自分で書いたアップBDは上書きしない', await o.ev(`document.getElementById('pfUpBd').value`) === '見本 自分で');
    await o.page.locator('#vProfile').screenshot({ path: path.join(OUT, 'ckun154_profile.png') });
    // 選ばずに登録 → 止める
    await o.page.selectOption('#pfUnion', ''); await o.page.fill('#pfName', '見本 新人'); await o.page.fill('#pfArea', '福岡'); await o.page.fill('#pfUpRuby', '見本');
    await o.page.click('#btnProfile'); await o.wt(200);
    c('選んでいない時は登録しない', /すべての項目|一覧から選んで/.test(await o.ev(`document.getElementById('pfErr').textContent`)));
    // 新規登録の画面（ログアウト状態）
    const n = await P.open(b, { hash: '', uid: 'nouser', data: cfg, wait: 1500, init: 'window.__FBNOAUTH = 1;' });
    await n.ev(`document.getElementById('toSignup') && document.getElementById('toSignup').click()`); await n.wt(500);
    const s = await n.ev(`({ tag: document.getElementById('suUnion').tagName, opts: [].map.call(document.getElementById('suUnion').options, function(x){ return x.value; }) })`);
    c('新規登録の所属ユニオンも選ぶ欄（一覧の名前だけ）', s.tag === 'SELECT' && s.opts.indexOf('LIEN') >= 0 && s.opts.indexOf('REVE') >= 0 && s.opts.length === 3, JSON.stringify(s));
    c('ページのエラーなし', o.errs.length === 0 && n.errs.length === 0, JSON.stringify(o.errs.concat(n.errs)));
    const H = fs.readFileSync(path.join(__dirname, '../../../checkin/index.html'), 'utf8');
    c('APP_VER v154 以上', +(/var APP_VER = 'v(\d+)'/.exec(H) || [0, 0])[1] >= 154);
    c('自由に書く欄は残っていない', !/<input type="text" id="(su|pf)Union"/.test(H));
  } finally { await b.close(); }
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
