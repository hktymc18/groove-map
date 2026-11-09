// v872：アカウント管理などの検索欄で、iPhoneの日本語入力が変換できなかった（1文字ごとに一覧を作り直して、変換の途中で確定していた）。
//   変換の途中（isComposing）は絞り込まず、確定（compositionend）と、ふつうの入力は少し待ってから1回だけ絞り込む（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login();
  for (const [id, fn] of [['adminSearch', 'renderAdminList'], ['sdSearchInput', 'filterSharedCards']]) {
    const el = $('#' + id);
    let n = 0; const orig = w[fn]; w[fn] = function() { n++; };
    el.value = 'すしだ';
    el.dispatchEvent(new w.InputEvent('input', { bubbles: true, isComposing: true })); await sleep(250);
    c(id + '：変換の途中は絞り込まない（一覧を作り直さない）', n === 0, n);
    el.value = '須志田';
    el.dispatchEvent(new w.CompositionEvent('compositionend', { bubbles: true, data: '須志田' })); await sleep(250);
    c(id + '：確定したら絞り込む', n === 1, n);
    n = 0;
    for (const ch of ['L', 'LI', 'LIE']) { el.value = ch; el.dispatchEvent(new w.InputEvent('input', { bubbles: true })); }
    await sleep(250);
    c(id + '：ふつうの入力は、続けて打ってもまとめて1回', n === 1, n);
    c(id + '：連絡先の自動入力を出さない（autocomplete=off・検索の欄）', el.getAttribute('autocomplete') === 'off' && el.getAttribute('type') === 'search');
    w[fn] = orig;
  }
  c('バージョン v872 以降', +(w.APP_JS_VERSION || 'v0').slice(1) >= 872);
});
