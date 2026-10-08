// v687：計画シートを記入例に合わせて作り直し（紙と同じ1枚・書き込むだけ・改善点は数字の1行ごと・目標は自分で入れる）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.switchView('plan'); await sleep(50);
  const s = w.state, ym = w._p2Ym(0), pv = w._p2YmAdd(ym, -1);
  s.members = [{ id: 'r', lastName: '山内', title: 'ゴールド', parentId: '', ptCurrent: 2700, activity: 'S' },
    { id: 'a', lastName: '佐藤', title: 'BR', parentId: 'r', ptCurrent: 2000, activity: 'S', startMonth: '2025-01' },
    { id: 'u', lastName: '林', title: 'ユーザー', parentId: 'r', ptCurrent: 200, startMonth: '2025-01' },
    { id: 'b', lastName: '菊池', title: 'Q2', parentId: 'r', ptCurrent: 100, activity: 'B', actRate: 80, startMonth: '2025-01' },
    { id: 'n', lastName: '井上', title: 'LOI', parentId: 'r', ptCurrent: 1100, startMonth: ym }];
  s.idealMembers = [];
  const p = s.goals.plan; p.income = 3410000; p.title = 'チームエリート'; p.deadline = '2027-12';
  w._p2Rm().ms = [{ id: 'm1', ym: w._p2YmAdd(ym, 2), t: 'EMERALD' }];
  w.currentUser.union = 'GRANT';
  w.p2Go('sheet'); await sleep(30);
  const v = () => $('#view-plan').textContent;
  c('1ページ（下の●なし）', $$('.ux-btm .ux-dot, .ux-btm i').length === 0 || !/目標・MAP/.test($('.ux-btm').textContent));
  c('v703: 見出し1行：計画シート・年月・ユニオン名', /計画シート/.test($('.st-h').textContent) && /GRANT/.test($('.st-h').textContent) && !$('.sp-ln') && !$('.sp-why'));
  c('v703: カード：年の目標・マイルストーン・今月・数字', $$('.st-c').length === 4 && /341/.test($$('.st-c')[0].textContent) && /TEAM ELITE/.test($$('.st-c')[0].textContent) && /EMERALD/.test($$('.st-c')[1].textContent));
  c('上から順に：目標 → MAP → 数字と改善点 → 行動', (() => { const t = v(); return t.indexOf('の目標') < t.indexOf('MAP＞') && t.indexOf('MAP＞') < t.indexOf('数字と改善点') && t.indexOf('数字と改善点') < t.indexOf('フロント作りに関して'); })());
  c('＋−ボタン・進捗バーはない', !$('#view-plan .pm') && !$('#view-plan .sh-bar') && !$('#view-plan .ux-pm'));
  const inc = $$('.st-c .sp-in')[0]; inc.value = '45'; inc.onchange(); await sleep(10);
  c('月収を書く', w._p2M(ym).comm === 45);
  $$('.st-c .sp-in')[1].value = '2'; $$('.st-c .sp-in')[1].onchange(); await sleep(10);
  c('NEWフロントを書く（ロードマップと同じ数字）', +w._p2FrontTgt(ym) === 2);
  c('v703: つながり：マイルストーンまで・フロントBRあと・今月NEWフロント', /あと2ヶ月/.test($$('.st-c')[1].textContent) && /フロントBR あと3本/.test($$('.st-c')[1].textContent) && $$('.st-c .sp-in')[1].value === '2');
  const svg = $('.sp-map svg').innerHTML;
  c('MAP：流通・ビジネス・点線のNEW（目標2−今1）・稼働率（説明はiの中）', /流通/.test(svg) && /ビジネス/.test(svg) && /NEW/.test(svg) && /80%/.test(svg));
  c('数字は8行（1項目＝1行）', $$('.sp-kr').length === 8);
  c('v688: 説明文は画面に出さず i の中', !$('.sp-leg') && !/Howdy稼働基準/.test(v()) && $$('#view-plan .ux-ib').length >= 3);
  c('v688: 改善点の欄は項目ごとに記入例（同じ文の繰り返しなし）', /S-SET/.test($$('.sp-kr')[0].querySelector('.sp-kz').placeholder) && /CT取りを前月25日/.test($$('.sp-kr')[4].querySelector('.sp-kz').placeholder) && new Set($$('.sp-kz').map(x => x.placeholder)).size === 8);
  c('v699: 記入例は空いた行の薄い文字だけ（全部・押しても入らない）・「＋ 書く」はなし', $$('.sp-at .r.nw input').filter(x => /^例：/.test(x.placeholder)).length === 3 + 5 + 6 + 5 && !/＋ 書く/.test($('#view-plan').innerHTML) && !$('.sp-at .r.ex'));
  const r0 = $$('.sp-at')[0].querySelectorAll('.r').length; w.p2ShActRow('front'); await sleep(10);
  c('v699: 行を追加', $$('.sp-at')[0].querySelectorAll('.r').length === r0 + 1);
  w.p2ShKzTgl(); await sleep(10);
  c('v697: 数字と改善点をたためる（1行のまとめだけ）', $$('.sp-kr').length === 0 && /ひらく/.test($('.sp-fold').textContent));
  w.p2ShKzTgl(); await sleep(10);
  c('v697: ひらくと戻る', $$('.sp-kr').length === 8);
  c('目標は割合で自動に入れない（空のまま）', w._p2ShKv(ym, w._p2ShK('ct')).t === null && $$('.sp-kr')[4].querySelector('.sp-in').value === '');
  const ct = $$('.sp-kr')[4].querySelector('.sp-in'); ct.value = '32'; ct.onchange(); await sleep(10);
  c('今月の目標を書く', w._p2ShKv(ym, w._p2ShK('ct')).t === 32);
  c('書いた目標は「今月の数字」のカードにも', /CT <b>32<\/b>/.test($('.st-k').innerHTML));
  w._p2ShM(pv).kpi.ft = 16; w._p2ShM(pv).man = {}; w.p2Go('sheet'); await sleep(10);
  c('先月の目標→結果（届かなければ赤）', /16/.test($$('.sp-kr')[3].querySelector('.pv').textContent) && !!$$('.sp-kr')[3].querySelector('.pv b.ng'));
  const kz = $$('.sp-kr')[3].querySelector('.sp-kz'); kz.value = 'FTの改善のアドバイスをもらう'; kz.onchange(); await sleep(10);
  c('改善点はその行に書く', w._p2ShM(ym).kz.ft === 'FTの改善のアドバイスをもらう');
  const ids = $$('.sp-kr')[5].querySelectorAll('.sp-in'); ids[1].value = '3'; ids[1].onchange(); await sleep(10);
  c('自動で数えない項目は今の数も書ける', w._p2ShKv(ym, w._p2ShK('ids')).v === 3);
  c('行動：4分野の表（✔・行動・実行期日）', $$('.sp-at').length === 4 && /実行期日/.test($('.sp-at .h').textContent));
  const n0 = s.events.length, ni = $('#p2ShIn_front_0'); ni.value = 'リストアップ書き直し'; ni.onchange(); await sleep(40);
  const e = s.events[s.events.length - 1];
  c('空いた行に書くと行動が足される（＝ToDoのタスク）', s.events.length === n0 + 1 && e.type === 'task' && e.planCat === 'front' && e.planYm === ym && /リストアップ書き直し/.test($('.sp-at').innerHTML));
  w.p2ShActDate(e.id, ym + '-25'); await sleep(10);
  c('期日を入れる', e.date === ym + '-25');
  w.p2ShActTg(e.id); await sleep(20);
  c('✔＝完了', e.done === true && !!$('.sp-at .r.dn'));
  w.p2ShActEdit(e.id, 'リストアップを書き直す'); c('行動を書き直せる', e.title === 'リストアップを書き直す');
  const ph = w._p2ShPrintHtml(ym);
  c('印刷：A3横・改善点は表の列・実行期日', /size:A3 landscape/.test(ph) && /＜改善点＞/.test(ph) && /FTの改善のアドバイスをもらう/.test(ph) && /実行期日/.test(ph) && /ユニオン名：GRANT/.test(ph));
  setWH(1400, 900); w._uxSync(); w.p2Go(''); await sleep(30);
  c('PC：1枚（左＝目標・MAP・数字と改善点の表｜右＝行動）', !!$('.sp-pc') && $$('.sp-pc .sp-at').length === 4 && !!$('.sp-pc .sp-tb') && !!$('.sp-pc .sp-map svg'));
  c('PC：表に改善点の列', /改善点/.test($('.sp-tb').textContent) && $$('.sp-tb .sp-kz').length === 8);
});
