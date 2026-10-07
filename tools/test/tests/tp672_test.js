// v672：上部を押しやすく（時計の下に余白・表示チームは1行の大きめのボタン）
const T = require('../lib/head.js')();
const { w, c, sleep, $$ } = T;
T.run(async () => {
  T.login();
  w.sharedOwners = [{ uid: 'a1', org: 'LIEN', perm: 'edit' }, { uid: 'a2', org: 'DEAR' }, { uid: 'a3', name: '藤木 麻由香' }, { uid: 'a4', org: 'BLOOM' }, { uid: 'a5', org: 'GROOVE' }];
  w.renderTeamPickBars(); await sleep(20);
  const chips = $$('#teamPickStats .tp-row .tp-c');
  c('表示チームは1行（横スクロール）のボタン', chips.length === 6 && !!w.document.querySelector('#teamPickStats .tp-row'));
  const css = w.document.getElementById('tpCss').textContent;
  c('ボタンは押しやすい高さ（36px）・折り返さない', /\.tp-c\{[^}]*height:36px/.test(css) && /\.tp-row\{[^}]*overflow-x:auto/.test(css) && !/flex-wrap:wrap/.test(css));
  w._tdyCss && w._tdyCss();
  const t = (w.document.getElementById('tdyCss') || {}).textContent || '';
  c('時計の下に少し余白（MAP・PLAN・分析）', t.indexOf('padding-top:calc(env(safe-area-inset-top) + 12px)') >= 0);
});
