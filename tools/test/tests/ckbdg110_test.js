// 受付 v110：タイトルが RUBY・DIAMOND・BLUE DIAMOND・TEAM ELITE の人のカードにも役職バッジを出す（タイトルの宝石はカード自体なので出さない）。
//   バッジ0の人・通常カード・特別カードは今まで通り。実際のブラウザ（Chromium）で、はみ出し・名前／QRボタンとの重なりも確かめる（架空データ）
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const R = path.join(__dirname, '../../..');
const H = fs.readFileSync(R + '/checkin/index.html', 'utf8');
const { JSDOM } = require(path.join(__dirname, '../node_modules/jsdom'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const pick = re => { const m = H.match(re); if (!m) throw new Error('not found ' + re); return m[0]; };
const slice = (a, b) => { const i = H.indexOf(a), j = H.indexOf(b, i); if (i < 0 || j < 0) throw new Error('slice ' + a); return H.slice(i, j); };
const B8 = ['EXPERT', 'ASSOCIATE', 'マコシエイト', 'DIRECTOR', '受付', '設営', '個別', '体感'];
(async () => {
  // ── しくみ（jsdom）──
  const W = new JSDOM('<div id="x"></div>', { runScripts: 'outside-only' }).window;
  W.eval([pick(/function esc\(s\)\{[\s\S]*?\n\}/), slice('// 👑 タイトル（宝石）: 1人1つ', '// 🃏 レアカード風の技の属性'),
    pick(/function ckBadge\(k\)\{[\s\S]*?\n\}/), pick(/function ckBadgeHtml\(k\)\{[\s\S]*?\n\}/)].join('\n'));
  const box = W.document.getElementById('x');
  const txt = () => [].map.call(box.querySelectorAll('.bdg'), x => x.textContent).join('|');
  W.ckPaintBadges(box, { cardTitle: 'RUBY', badges: ['EXPERT', '受付'] }, true);
  c('ルビー以上: タイトルの宝石は出さず役職バッジだけ', txt() === 'EXPERT|受付' && !box.classList.contains('many'));
  W.ckPaintBadges(box, { cardTitle: 'DIAMOND', badges: B8 }, true);
  c('8つ全部・一覧の順', txt() === B8.join('|') && box.classList.contains('many'));
  W.ckPaintBadges(box, { badge: 'TEAM ELITE' }, true);
  c('バッジ0なら空（カードはv109と同じ）', box.innerHTML === '');
  W.ckPaintBadges(box, { cardTitle: 'GOLD', badges: ['EXPERT'] });
  c('通常: タイトル＋バッジは今まで通り', txt() === 'GOLD|EXPERT');
  W.ckPaintBadges(box, { cardTitle: 'EXPERT' }, true);
  c('noTitle でも宝石以外は消さない（念のため）', txt() === 'EXPERT');
  c('renderCard: ルビー以上だけ noTitle', /ckPaintBadges\(\$\('mcBadge'\), c, ruby \|\| dia\);/.test(H));
  c('CSS: ルビー・ダイヤでバッジを隠すルールが無い', !/\.mc-ruby \.mc-badge\{display:none/.test(H) && !/\.skin-dia \.mc-group,\.membercard\.skin-dia \.mc-badge\{display:none/.test(H));
  c('CSS: COMING SOON（解禁前）は今まで通り出さない', /\.membercard\.skin-soon \.mc-sp,\.membercard\.skin-soon \.mc-badge\{display:none;\}/.test(H));
  c('CSS: 空のバッジ欄は場所を取らない', /\.mc-ruby \.mc-badge:not\(:empty\),\.membercard\.skin-dia:not\(\.skin-soon\) \.mc-badge:not\(:empty\)\{display:flex/.test(H));
  c('APP_VER v110以降・v110のお知らせ', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 110 && /\n  \{ v: 'v110', d: '2026\/10\/28', items: \['🏅/.test(H));

  // ── 実際の表示（Chromium・390×844 と 320×640）──
  const JS = '(function(){var c=document.getElementById("memberCard"),cr=c.getBoundingClientRect(),b=document.getElementById("mcBadge"),r=b.getBoundingClientRect();'
    + 'var ov=function(id){var e=document.getElementById(id);if(!e||getComputedStyle(e).display=="none")return 0;var q=e.getBoundingClientRect();if(!q.height||!r.height)return 0;return (q.left<r.right&&q.right>r.left&&q.top<r.bottom&&q.bottom>r.top)?1:0;};'
    + 'var bs=[].map.call(b.querySelectorAll(".bdg"),function(x){var q=x.getBoundingClientRect();return q.width>0&&q.left>=cr.left&&q.right<=cr.right&&q.top>=cr.top&&q.bottom<=cr.bottom;});'
    + 'var dsg=window.__ck.olDesign({no:"ZZ0001",name:"見本",union:"ANTARES",cardTitle:"RUBY",badges:' + JSON.stringify(B8) + ',skin:"reaperTcg"}),tb=window.__ck.ckTcgBuild(dsg);'
    + 'return JSON.stringify({cls:c.className,n:bs.length,vis:bs.filter(Boolean).length,ovName:ov("mcName"),ovQrb:ov("mcQrBtn"),ovNo:ov("mcNo"),ovGrade:ov("mcGrade"),ovUnion:ov("mcUnion"),'
    + 'bot:r.height?(r.bottom-cr.top)/cr.height:0,h:Math.round(cr.height),sw:document.documentElement.scrollWidth,iw:innerWidth,ol:tb.querySelectorAll(".mc-badge .bdg").length});})()';
  const cards = [['ruby', { cardTitle: 'RUBY' }], ['dia', { cardTitle: 'DIAMOND', grade: 'BR' }], ['bd', { cardTitle: 'BLUE DIAMOND' }], ['te', { cardTitle: 'TEAM ELITE' }]];
  const cases = [];
  cards.forEach(([n, f]) => [[], ['EXPERT'], ['ASSOCIATE', '受付', '体感'], B8].forEach(b => cases.push([n + b.length, Object.assign({ badges: b }, f)])));
  const run = (vw, vh, cs, js) => {
    const out = execFileSync('node', [R + '/tools/test/shot/ckcard.js'], { env: Object.assign({}, process.env, { VW: '' + vw, VH: '' + vh, CASES: JSON.stringify(cs), JS: js || JS, PFX: 'ckbdg110', OUT: path.join(__dirname, '../out/ckbdg110') }), encoding: 'utf8', timeout: 300000 });
    const res = {}; let last = null;
    out.split('\n').forEach(l => { if (l.indexOf('JS ') === 0) last = JSON.parse(l.slice(3)); else if (last && l) { res[l.split(' ')[0]] = last; last = null; } });
    if (/PAGEERR/.test(out)) c('ページのエラーなし', false, out.match(/PAGEERR.*/)[0]);
    return res;
  };
  for (const [vw, vh] of [[390, 844], [320, 640]]) {
    const res = run(vw, vh, cases);
    cases.forEach(([nm, cd]) => {
      const r = res[nm], k = cd.badges.length, ab = /dia|bd|te/.test(nm);
      if (!r) { c(vw + ' ' + nm + ': 表示できた', false); return; }
      c(vw + ' ' + nm + ': バッジ' + k + 'つ全部カードの中に見える', r.n === k && r.vis === k, JSON.stringify(r));
      c(vw + ' ' + nm + ': 名前・QRボタン・番号・グレード・ユニオンと重ならない', !r.ovName && !r.ovQrb && !r.ovNo && !r.ovGrade && !r.ovUnion, JSON.stringify(r));
      if (ab && k) c(vw + ' ' + nm + ': ロゴより上（カードの上から19%まで）', r.bot <= 0.19, r.bot);
      c(vw + ' ' + nm + ': 横にはみ出さない', r.sw <= r.iw, r.sw);
    });
    c(vw + ' DIAMOND/PLATINUMのカードの高さはバッジの数で変わらない', ['dia', 'bd', 'te'].every(n => res[n + '0'] && res[n + '0'].h === res[n + '8'].h));
    c(vw + ' 見た目の切り替えは今まで通り', /mc-ruby/.test(res.ruby1.cls) && /skin-dia/.test(res.dia1.cls) && !/skin-plat/.test(res.dia1.cls) && /skin-plat/.test(res.te8.cls) && /skin-plat/.test(res.bd3.cls));
    c(vw + ' OLコレクションの控え（olDesign）で組んだ特別カードにもタイトル＋8つ', res.ruby8.ol === 9);
  }
  // 解禁前（COMING SOON）は名前と同じくバッジも出さない（今まで通り）。写真の道具はオーナーでログインするので、解禁前の見た目は class を付けて確かめる
  const soon = run(390, 844, [['soon', { cardTitle: 'TEAM ELITE', badges: B8 }]],
    '(function(){var c=document.getElementById("memberCard");c.classList.remove("skin-plat");c.classList.add("skin-soon");var b=document.getElementById("mcBadge");return JSON.stringify({n:b.querySelectorAll(".bdg").length,d:getComputedStyle(b).display,nm:getComputedStyle(document.getElementById("mcName")).display});})()');
  c('COMING SOON ではバッジを出さない（名前と同じ）', soon.soon && soon.soon.n === 8 && soon.soon.d === 'none' && soon.soon.nm === 'none', JSON.stringify(soon.soon));
  console.log(fails ? 'NG ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('exception', e); process.exit(1); });
