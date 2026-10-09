// v675：PLAN › 理想・まとめ — 書いた内容を全部表示（省略しない）・一番下に「はじめから答え直す」
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const g = w._p2G(); g.p1 = true;
  const put = (k, arr) => { try { const L = w._p2Lst(k); L.length = 0; arr.forEach(x => L.push(x)); } catch (e) {} };
  put('want_do', ['好きな時に好きな場所へ', '仲間と事業を広げる', '家族と海外旅行', '本を出す']);
  put('not_want_do', ['満員電車に乗る', '時間に追われる']);
  w.switchView('plan'); w.p2Go('ideal', 6); await sleep(80);
  const secs = $$('.p2is-c');
  c('4つの項目がカードで出る', secs.length === 4);
  c('やりたいことは4つとも全部表示（ほか○ で省略しない）', secs[0] && secs[0].querySelectorAll('.p2is-i').length === 4 && /本を出す/.test(secs[0].textContent) && !/ほか/.test(secs[0].textContent));
  c('まだの項目は「書く」', secs[2] && /まだ書いていません/.test(secs[2].textContent));
  c('一番下にパートごとの答え直し（v775）', /パートごとに答え直す/.test($('#view-plan').textContent));
  w.p2IdealRedoAll(); await sleep(80);
  c('答え直すと理想の生活の1問目から質問', w._p2PgI === 0 && !$('#p2GwWrap .p2id-dn') && w._p2GwStep === w.P2GW_Q.indexOf(w._p2IdealQs()[0]));
});
