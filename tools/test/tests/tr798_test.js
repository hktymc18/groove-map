// v798（#14）：メンバー編集のいちばん上に「次の研修（日時・内容）・前回・段階の流れ」。予定日を過ぎたらその場で 進んだ／流れた／リスケ
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const d = n => w._ppYmd(n);
  w.state.members = [{ id: 'r', lastName: '永尾', firstName: '歩夢', title: 'BR', parentId: '', mapType: 'both' },
    { id: 't', lastName: '別所', firstName: '星哉', title: 'PG', parentId: 'r', mapType: 'both', trainee: true,
      traineeHistory: [{ status: 'マケ', date: d(-20), aSan: '小川拓郎', result: 'next' }, { status: 'PG', date: d(-12), aSan: '平井凛太郎', result: 'next' },
        { status: 'PA', date: d(3), aSan: '山田一郎', result: 'planned', evId: 'ev1' }] },
    { id: 'u', lastName: '大田', firstName: '翔', title: 'BA', parentId: 'r', mapType: 'both', traineeResult: 'BC', traineeHistory: [{ status: 'CO', date: d(-40), result: 'next' }] },
    { id: 'v', lastName: '石井', firstName: '海', title: 'PG', parentId: 'r', mapType: 'both', trainee: true, traineeHistory: [{ status: 'PG', date: d(-5), result: 'next' }] }];
  w.state.events = [{ id: 'ev1', title: 'PA', date: d(3), time: '19:00', memberId: 't' }];
  w.switchView('current'); await sleep(30);
  const M = id => w.state.members.find(x => x.id === id);

  w.openEdit('t'); await sleep(20);
  const tile = () => $('#ppPg .pptr');
  const wd = '日月火水木金土'.charAt(new Date(d(3) + 'T00:00:00').getDay()), md = d(3).slice(5).split('-').map(Number).join('/');
  c('研修中の人は横長の研修タイルがいちばん上（数字の下・ほかのタイルより前）', !!tile() && tile().nextElementSibling && tile().nextElementSibling.classList.contains('pptl'));
  c('次の研修：段階・日付・曜日・時間・Aさん', /次\s*PA/.test(tile().textContent) && tile().textContent.indexOf(md + '（' + wd + '） 19:00') >= 0 && /Aさん 山田一郎/.test(tile().textContent));
  c('前回：PG・12日前・Aさん', /前回\s*PG/.test(tile().textContent) && /12日前/.test(tile().textContent) && /平井凛太郎/.test(tile().textContent));
  const dot = s => $$('#ppPg .pptr .dots span').find(x => x.textContent === s);
  c('段階の流れ（済み＝緑・予定＝黄）', dot('マケ').className === 'ok' && dot('PG').className === 'ok' && dot('PA').className === 'pl' && dot('CO').className === '');
  c('小さい研修タイルは出さない（二重にしない）', $$('#ppPg .pptl>div').every(x => !/^研修/.test(x.querySelector('b').textContent)));
  c('予定日前は結果のボタンは出ない', !$('#ppPg .pptr .acts'));
  tile().click(); await sleep(20);
  c('押すと研修のページ', w._pp.pg === 'tr');
  w.ppGo(''); await sleep(10);

  // 予定日を過ぎた → その場で結果
  M('t').traineeHistory[2].date = d(-3); w._ppRender(); await sleep(10);
  c('過ぎた予定は「3日超過」', /3日超過/.test(tile().textContent) && !!$('#ppPg .pptr .acts'));
  $$('#ppPg .pptr .acts span')[0].click(); await sleep(30);
  c('「✓ 進んだ」でその場で確定（画面はそのまま）', M('t').traineeHistory[2].result === 'next' && w._pp.pg === '' && /前回\s*PA/.test(tile().textContent));
  c('次の予定が無い時は「次は 面談（まだ予定なし）」', /次\s*面談/.test(tile().textContent) && /まだ予定なし/.test(tile().textContent));
  // 予定を入れる
  $('#ppPg .pptr .lk').click(); await sleep(20);
  c('「＋ 予定を入れる」で記録を足す（その段階・予定・日付を選ぶ）', w._pp.pg === 'tr' && w._ppSh && w._ppSh.step === '面談' && w._ppSh.res === 'planned' && w._ppSh.dm === 'p' && !!$('#ppSh #ppShDate'));
  w._ppShClose(); w.ppClose && w.ppClose(); await sleep(10);

  // 流れた
  w.openEdit('v'); await sleep(20);
  M('v').traineeHistory.push({ status: 'DLR', date: d(-1), result: 'planned' }); w._ppRender(); await sleep(10);
  $$('#ppPg .pptr .acts span')[1].click(); await sleep(30);
  c('「流れた」で確定 → 研修結果が決まり、横長タイルは消える', M('v').traineeHistory[1].result === 'left' && !tile());
  w.ppClose && w.ppClose(); await sleep(10);

  // 研修が終わった人
  w.openEdit('u'); await sleep(20);
  c('研修結果が決まった人は今までどおりの小さいタイル', !tile() && $$('#ppPg .pptl>div').some(x => /^研修/.test(x.querySelector('b').textContent)));
});
