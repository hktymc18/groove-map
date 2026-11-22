// 受付 v166：リーダー向けガイド（checkin/leader.html）。使っている画像が全部あるか・🔰 使い方から開けるか・
//   研修生登録のタブがグレーの丸（v160 で黒に戻っていた）
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '../../../checkin');
const H = fs.readFileSync(R + '/index.html', 'utf8'), G = fs.readFileSync(R + '/leader.html', 'utf8');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const imgs = [...G.matchAll(/src="(leader\/[^"]+)"/g)].map(m => m[1]);
const missing = imgs.filter(f => !fs.existsSync(R + '/' + f));
c('ガイドの画像が全部ある（' + imgs.length + '枚）', imgs.length >= 30 && !missing.length, missing.join(','));
const unused = fs.readdirSync(R + '/leader').filter(f => imgs.indexOf('leader/' + f) < 0);
c('使っていない画像を置いていない', !unused.length, unused.join(','));
c('目次の行き先が全部ある', [...G.matchAll(/href="#(\w+)"/g)].every(m => G.indexOf('id="' + m[1] + '"') >= 0));
c('特別カードの画像（skins/）は使わない', !/skins\//.test(G));
c('🔰 使い方から開ける（受付管理と研修生登録の画面）', /gxView\(\) === 'vApp' \|\| gxView\(\) === 'vTrainer'\n      \? '<a class="gx-mis" href="leader\.html"/.test(H));
c('研修生登録のタブはグレーの丸（黒で上書きしない）', !/\.trtabs button\.on\{background:var\(--ink\)/.test(H) && !/\.trsex button\.on\{background:var\(--ink\)/.test(H) && /\.trtabs button\.on, \.trsex button\.on\{background:var\(--chip\)/.test(H));
c('APP_VER v166以降・v166のお知らせ', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 166 && /\n  \{ v: 'v166', d: '2026\/11\/21'/.test(H));
console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
