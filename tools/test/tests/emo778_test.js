// v778：絵文字はアプリ全体で線のアイコンに（v510の対応表に足りない分を追加・対応表にない絵文字は出さない・記号は残す）
const T = require('../lib/head.js')();
const { w, c, sleep, $, $$ } = T;
const EMO = /\p{Extended_Pictographic}/u;
const KEEP = /[✓✕✎✔✗★☆☰♂♀✦⛶⚑↩↪⇄↻⌘⌂©®™▶◀▼▲●○◎※↗↘↔↕⬆⬇➡⬅♪]/g;
const left = (root) => { const r = []; const tw = w.document.createTreeWalker(root, 4); let n; while ((n = tw.nextNode())) { const p = n.parentNode; if (p && /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)) continue; if (EMO.test(n.nodeValue.replace(KEEP, ''))) r.push(n.nodeValue.slice(0, 24)); } return r; };
T.run(async () => {
  T.login();
  w.toast('📅 予定に入れました ✓'); await sleep(10);
  c('トースト：絵文字は線のアイコン・✓はそのまま', !!$('#toast svg.lic') && !/📅/.test($('#toast').textContent) && /予定に入れました ✓/.test($('#toast').textContent));
  const d = w.document.createElement('div');
  d.innerHTML = '<span>⛰ 次の山</span><b>😎すごい</b><i>⚠️ 注意</i><u>🐞 バグ</u><em>💻 PC</em><select><option>🎯 目標</option></select><svg><text>🦁3</text></svg><input placeholder="例：🦋 ちょう">';
  w.document.body.appendChild(d); await sleep(20);
  c('足りなかった絵文字（⛰ 🐞 💻）も線のアイコンに', d.querySelector('span svg.lic') && d.querySelector('u svg.lic') && d.querySelector('em svg.lic'));
  c('対応表にない絵文字（顔など）は出さない', d.querySelector('b').textContent === 'すごい');
  c('選択肢・SVGの文字・入力欄の案内も絵文字なし', !EMO.test(d.querySelector('option').textContent) && d.querySelector('svg text').textContent === '3' && !EMO.test(d.querySelector('input').getAttribute('placeholder')));
  c('記号（✓ ✕ ✎ ↩ ▼）はそのまま', w.emoStrip('✓ ✕ ↩ ▼') === '✓ ✕ ↩ ▼');
  const ta = w.document.createElement('textarea'); ta.value = '🎉 メモ'; d.appendChild(ta); await sleep(10);
  c('入力中の文（textarea）は触らない', ta.value === '🎉 メモ');
  // v779: MAP・グラフの枠の中でも、差し替えた小さいアイコンは文字の大きさのまま
  const ih = require('fs').readFileSync(require('path').join(__dirname, '../../../index.html'), 'utf8');
  c('v779: 計画シートのMAP枠などの中でもアイコンが巨大にならない', ['#p2ShMI svg.lic', '.sp-map svg.lic', '#p2ShOrb svg.lic', '.px3-k svg.lic'].every(k => ih.indexOf(k) >= 0) && /svg\.lic\{display:inline-block;width:1\.05em;height:1\.05em/.test(ih));
  // 主な画面に絵文字が残らない
  const views = ['events', 'plan', 'current', 'menu'];
  for (const v of views) { try { w.switchView(v); } catch (e) {} await sleep(60); }
  w.p2Go('ideal', 0); await sleep(40);
  const L = left(w.document.body);
  c('画面（予定・PLAN・MAP・メニュー・理想）に絵文字が残らない', L.length === 0, L.slice(0, 4).join(' | '));
  // お知らせ（更新内容）も
  try { w.rnOpen && w.rnOpen(); } catch (e) {} await sleep(30);
  const L2 = left(w.document.body);
  c('お知らせの文にも絵文字が残らない', L2.length === 0, L2.slice(0, 4).join(' | '));
});
