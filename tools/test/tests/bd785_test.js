// v785：ホームに誕生日カード（30日以内を近い順・その先は月ごとにたたむ・誕生日がわからない人）。MAPの誕生日シートも同じ中身
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  // 時計は 2026-10-14
  const P = (id, ln, bd, t, x) => Object.assign({ id, lastName: ln, firstName: '', title: t || 'B1', parentId: id === 'r' ? '' : 'r', mapType: 'both', birthday: bd }, x || {});
  w.state.members = [P('r', '山内', '', 'G'), P('a', '佐藤', '2004-10-14', 'DLR'), P('b', '田中', '2001-10-15'), P('c', '鈴木', '1995-10-23'), P('d', '高橋', '1998-11-10', 'Q2'),
    P('e', '伊藤', '2002-11-18'), P('f', '渡辺', '2006-11-29', 'マケ', { gender: 'female' }), P('g', '山本', '1990-12-05'), P('h', '中村', '1990-01-03'), P('i', '小林', '1990-03-03'), P('j', '加藤', '1990-08-08'),
    P('k', '吉田', '1990-10-20', 'OUT'), P('l', '未登録', '')];
  w.switchView('home'); await sleep(30);
  const card = () => $('#view-home .bdc');
  c('ホームに誕生日カード', !!card() && /30日以内 4人/.test(card().querySelector('.bdc-h').textContent));
  const rows = () => $$('#view-home .bdc > .bdr');
  c('30日以内を近い順（OUTは出さない）', rows().map(r => r.querySelector('b').firstChild.textContent).join(',') === '佐藤,田中,鈴木,高橋', rows().map(r => r.textContent).join('|'));
  c('今日・明日は目立たせる', rows()[0].classList.contains('td') && /今日！/.test(rows()[0].textContent) && /22歳に/.test(rows()[0].textContent) && rows()[1].classList.contains('td') && /明日/.test(rows()[1].textContent) && !rows()[2].classList.contains('td'));
  c('あと◯日・日付', /あと9日 10\/23/.test(rows()[2].textContent) && /あと27日 11\/10/.test(rows()[3].textContent));
  c('LINEボタンは無い・予定ボタンはある', !/LINE/.test(card().textContent) && $$('#view-home .bdc > .bdr .bt').length === 4);
  const months = () => $$('#view-home .bdc > .bdm').map(x => x.textContent);
  c('その先は月ごと（近い3か月＋その先はまとめる）', months().length === 4 && /^11月2人伊藤・渡辺/.test(months()[0]) && /^12月1人山本/.test(months()[1]) && /^1月1人中村/.test(months()[2]) && /^3月〜8月2人/.test(months()[3]), months());
  c('30日以内の人は月の中に重ねて出さない', !/高橋/.test(months()[0]));
  $$('#view-home .bdc > .bdm')[0].click(); await sleep(10);
  c('月を押すと開く（日付・曜日・あと◯日）', $$('#view-home .bdc .bdsub .bdr').length === 2 && /11\/18（水）・あと35日・24歳に/.test($('#view-home .bdc .bdsub').textContent));
  $$('#view-home .bdc > .bdm')[3].click(); await sleep(10);
  c('まとめた月を押すと月ごとに', $$('#view-home .bdc .bdsub .bdm').length === 2);
  $$('#view-home .bdc > .bdm')[0].click(); await sleep(10);
  c('もう一度押すと閉じる', $$('#view-home .bdc > .bdsub').length === 1);
  c('誕生日がわからない人の数', /誕生日がわからない人 2人/.test($('#view-home .bdnb').textContent));
  $('#view-home .bdnb').click(); await sleep(10);
  c('わからない人の一覧', !!$('#bdNoOv') && $$('#bdNoOv .ms-act').length === 2);
  $$('#bdNoOv .ms-act').find(x => /未登録/.test(x.textContent)).click(); await sleep(250);
  c('選ぶとプロフィール（誕生日の欄）', !!$('#ppPg') && w._pp.id === 'l' && w._pp.pg === 'prof');
  w.ppClose();
  // 行を押すとメンバー画面
  w._renderHome ? w._renderHome() : w.switchView('home'); await sleep(20);
  rows()[2].click(); await sleep(20);
  c('行を押すとメンバー画面', !!$('#ppPg') && w._pp.id === 'c'); w.ppClose();
  // 30日以内に誰もいない
  w.state.members = [P('r', '山内', '', 'G'), P('e', '伊藤', '2002-11-18'), P('l', '未登録', '')];
  w.switchView('home'); await sleep(20);
  c('30日以内が0人：次の人を1行', /30日以内 0人/.test(card().textContent) && /次は 11\/18 伊藤さん（あと35日）/.test(card().textContent));
  // 誰も入れていない → ホームに出さない
  w.state.members = [P('r', '山内', '', 'G'), P('l', '未登録', '')];
  w.switchView('home'); await sleep(20);
  c('誕生日を1人も入れていない時は出さない', !card());
  // 6人以上は5人＋あと◯人
  w.state.members = [P('r', '山内', '', 'G')].concat([1, 2, 3, 4, 5, 6, 7].map(n => P('z' + n, '人' + n, '2000-10-' + String(14 + n).padStart(2, '0'))));
  w.switchView('home'); await sleep(20);
  c('多い時は5人＋「あと◯人」', rows().length === 5 && /あと2人（30日以内）/.test(card().textContent));
  $$('#view-home .bdc > .bdm').find(x => /あと2人/.test(x.textContent)).click(); await sleep(10);
  c('押すと全員', rows().length === 7 && /少なく表示/.test(card().textContent));
  // MAPの誕生日シートも同じ中身
  w.switchView('current'); await sleep(20);
  w.openBdaySheet(); await sleep(20);
  c('MAPの誕生日シートも同じ形', !!$('#bdayOv .bdc.sh') && $$('#bdayOv .bdc .bdr').length === 7 && /30日以内 7人/.test($('#bdayOv .ms-name').textContent));
  $$('#bdayOv .bdc .bdr')[0].click(); await sleep(250);
  c('シートの行を押すとシートを閉じてメンバー画面', !!$('#ppPg') && w._pp.id === 'z1');
  w.ppClose();
  // PCのホーム
  setWH(1440, 900); w._uxSync && w._uxSync(); w.switchView('home'); await sleep(30);
  c('PCのホームにも（今日の予定・ToDoの下）', !!$('#view-home .ph-g .bdc'));
});
