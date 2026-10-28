// v848：計画シートにまとめる（新機能のテスト sheet2）。「○月の目標」をなくし、数字は計画シートの「数字と改善点」へ。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '一郎', title: 'B3', parentId: '', mapType: 'both', ptCurrent: 3000, activity: 'S' },
    { id: 'a', lastName: '見本', firstName: '一', title: 'B2', parentId: 'r', mapType: 'both', activity: 'S', actRate: 100 },
    { id: 'b', lastName: '見本', firstName: '二', title: 'B1', parentId: 'a', mapType: 'both', activity: 'A' },
    { id: 'u1', lastName: '利用', firstName: '一', title: 'ユーザー', parentId: 'r', mapType: 'both', ptCurrent: 1200 },
    { id: 'u2', lastName: '利用', firstName: '二', title: 'ユーザー', parentId: 'r', mapType: 'both', ptCurrent: 800 },
    { id: 'u3', lastName: '利用', firstName: '三', title: 'ユーザー', parentId: 'a', mapType: 'both', ptCurrent: 500 }];
  const ym = w._p2Ym(0), nx = w._p2Ym(1);
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('plan');
  const nms = () => $$('.sp-kr .nm').map(x => x.textContent);

  // ① スイッチが切れている時は今までどおり
  w._featCfg = {}; w.localStorage.removeItem('gm_feat');
  w.p2Go('mon'); await sleep(30);
  c('スイッチなし：「○月の目標」はそのまま', w._p2Pg === 'mon');
  w.p2Go('sheet'); await sleep(30);
  c('スイッチなし：自分自身の目標・チームの目標は出ない', !$('.sp-s2') && !nms().some(t => /ユーザーPT|S稼働/.test(t)));
  w._p2M(ym).declared = true;
  c('スイッチなし：設定したかは「設定する」のまま', w._p2Declared(ym) === true);

  // ② 先に見られる人（テスト中）
  w._featCfg = { sheet2: { on: false, testers: [w.currentUser.uid] } };
  c('先に見られる人には出る', w._p2Sh2() === true);
  w.p2Go('mon'); await sleep(30);
  c('「○月の目標」を開くと計画シート（今月）', w._p2Pg === 'sheet' && w._p2ShYmN() === ym);
  w.p2MonFor(1); await sleep(30);
  c('来月の目標を開くと来月の計画シート', w._p2Pg === 'sheet' && w._p2ShYmN() === nx);
  w.p2ShMon(-1); await sleep(30);
  w._p2Pg = 'mon'; w.renderPlan(); await sleep(30);
  c('前の画面のまま開いていても計画シートに', w._p2Pg === 'sheet');
  c('「テスト中」の印', /テスト中（開発メンバーだけ）/.test(($('.sp-fold') || {}).textContent || ''));

  // ③ 自分自身の目標
  c('自分自身の目標の見出し', $$('.sp-s2').some(x => /自分自身の目標/.test(x.textContent)));
  const N = nms(), iu = N.findIndex(t => /ユーザーPT/.test(t)), ir = N.findIndex(t => /UR動員数/.test(t));
  c('ユーザーPTはUR動員数のすぐ下', iu === ir + 1 && ir >= 0);
  const uRow = () => $$('.sp-kr').find(r => /ユーザーPT/.test(r.querySelector('.nm').textContent));
  c('ユーザーPTの今＝MAPの自分の直下のユーザーのポイント合計（孫のユーザーは入れない）', /2000/.test(uRow().querySelector('.nw').textContent) && /MAP/.test(uRow().querySelector('.nw').textContent));
  w.p2ShKT('upt', 0, '3000'); await sleep(30);
  c('ユーザーPTの目標は月の目標の欄（upt）に入る', w._p2M(ym).upt === 3000 && /67%/.test(uRow().querySelector('.sp-rt').textContent));
  w.p2ShKS('upt', 1); await sleep(10);
  c('ユーザーPTの今は自動（− ＋ はない）', !uRow().querySelector('.sp-st') && w._p2ShM(ym).man.upt === undefined);
  c('⚙ 項目を変えるは自分自身の目標の下', /数字の項目を変える/.test($('.sp-ft').textContent));

  // ④ チームの目標：0段目がBR以上の時だけ
  c('B3（BR未満）の時はチームの目標を出さない', !$$('.sp-s2').some(x => /チームの目標/.test(x.textContent)) && !nms().some(t => /S稼働/.test(t)));
  w.state.members[0].title = 'BR'; w.renderPlan(); await sleep(30);
  c('BRになると出る', $$('.sp-s2').some(x => /チームの目標/.test(x.textContent)));
  const N2 = nms();
  c('S稼働・チームのB1・平均稼働人数・チームのPG動員・チームのDLR動員・ST', ['S稼働', 'チームのB1', '平均稼働人数', 'チームのPG動員', 'チームのDLR動員', 'ST'].every(t => N2.some(x => x.indexOf(t) === 0)));
  c('チームPT・自分の成長・審査中・BR全員1,000ptは出さない', !$('#view-plan').textContent.match(/チームPT|自分の成長|審査中を全員|BR全員/));
  const row = (lb) => $$('.sp-kr').find(r => r.querySelector('.nm').textContent.indexOf(lb) === 0);
  c('S稼働は必ず決める・めやす（次の段・あと一歩）', /必ず決める/.test(row('S稼働').textContent) && /めやす：次の段 5人・あと一歩 1人/.test(row('S稼働').textContent));
  c('S稼働の今はMAPから（Sの人数）', /今\s*2/.test(row('S稼働').querySelector('.nw').textContent.replace(/\s+/g, ' ')));
  w.p2ShKT('s', 0, '5'); await sleep(30);
  c('S稼働の目標は前と同じ欄（s）', w._p2M(ym).s === 5 && !/必ず決める/.test(row('S稼働').textContent));
  w.p2ShKT('actN', 0, '2.5'); await sleep(30);
  c('平均稼働人数は小数で', w._p2M(ym).actN === 2.5);
  w.p2ShKT('teamPg', 0, '4'); await sleep(30);
  const pg = row('チームのPG動員'), plus = pg.querySelector('.sp-st i:last-child');
  plus.click(); plus.click(); await sleep(10);
  c('チームのPG動員は − ＋ で（目標は teamPg）', w._p2M(ym).teamPg === 4 && w._p2ShM(ym).man.teamPg === 2 && /50%/.test(pg.querySelector('.sp-rt').textContent));
  w.p2ShKS('s', 1);
  c('自動の行は − ＋ で変わらない', w._p2ShM(ym).man.s === undefined);
  c('今月の自動の数を記録（来月に先月の結果として出す）', w._p2ShM(ym).snap && w._p2ShM(ym).snap.s === 2 && w._p2ShM(ym).snap.upt === 2000);

  // ⑤ それぞれたためる
  w.p2Sh2SecTgl('team'); await sleep(30);
  c('チームの目標をたたむと1行のまとめ', !nms().some(t => /S稼働/.test(t)) && /S稼働 2\/5/.test($('#view-plan').textContent));
  w.p2Sh2SecTgl('self'); await sleep(30);
  c('自分自身の目標もたためる', !nms().length);
  w.p2Sh2SecTgl('team'); w.p2Sh2SecTgl('self'); await sleep(30);
  c('ひらくと戻る', nms().some(t => /ユーザーPT/.test(t)) && nms().some(t => /S稼働/.test(t)));

  // ⑥ 決めたか＝月収とフロントの目標が入っているか
  const m = w._p2M(ym); m.comm = ''; w.p2RmCell('front', ym, '');
  c('月収とフロントが空なら決めていない（前の「設定する」は関係ない）', w._p2Declared(ym) === false);
  w.p2Go(''); await sleep(30);
  c('PLANの入口に「月収とフロントの目標を決めましょう」', /月収とフロントの目標を決めましょう/.test($('#view-plan').textContent) && !/月の目標を決める/.test($('#view-plan').textContent));
  m.comm = 50;
  c('月収だけではまだ', w._p2Declared(ym) === false);
  w.p2RmCell('front', ym, '2');
  c('両方入ると決めた', w._p2Declared(ym) === true);
  w.renderPlan(); await sleep(30);
  c('決めたら入口の赤い行は消える', !/月収とフロントの目標を決めましょう/.test($('#view-plan').textContent));
  m.comm = ''; w.window._p2GoalsLoaded = true; w.switchView('home'); w._p2Boot(); w._p2BannerSync(); await sleep(10);
  const bn = w.document.getElementById('p2Banner');
  c('HOMEの赤い帯も「月収とフロントの目標を決めましょう」', !!bn && /月収とフロントの目標を決めましょう/.test(bn.textContent) && bn.style.display === 'block');
  m.comm = 50; w._p2BannerSync();
  c('入れると帯は自動で消える', bn.style.display === 'none');
  bn.onclick(); await sleep(30);
  c('帯を押すと計画シート', w._p2Pg === 'sheet' && w.currentView === 'plan');

  // ⑦ PC：タブに「○月の目標」を出さない・表も2つに分かれる
  setWH(1440, 900); w._uxSync && w._uxSync(); w.switchView('plan'); w.p2Go('sheet'); await sleep(60);
  const tabs = $$('.pcx2-tabs span').map(x => x.textContent);
  c('PC：「○月の目標」のタブはない', tabs.some(t => /計画シート/.test(t)) && !tabs.some(t => /月の目標/.test(t)));
  c('PC：表に自分自身の目標とチームの目標', $$('.sp-s2').length === 2 && $$('.sp-tb').length === 2 && /ユーザーPT/.test($$('.sp-tb')[0].textContent) && /S稼働/.test($$('.sp-tb')[1].textContent));

  // ⑧ 全員に公開・スイッチを切ると戻る
  w._featCfg = { sheet2: { on: false, testers: [] } }; w.renderPlan(); await sleep(60);
  c('先に見られる人から外すと前の画面（タブも戻る）', $$('.pcx2-tabs span').some(t => /月の目標/.test(t.textContent)) && !$('.sp-s2'));
  c('データは前の画面と共通（S稼働の目標はそのまま）', w._p2M(ym).s === 5 && w._p2M(ym).upt === 3000);
  w._featCfg = { sheet2: { on: true, testers: [] } }; w.renderPlan(); await sleep(60);
  c('全員に公開すると出る（印は出ない）', $$('.sp-s2').length === 2 && !/テスト中（開発メンバーだけ）/.test($('#view-plan').textContent));
  c('印刷にもユーザーPT・チームの目標', /ユーザーPT/.test(w._p2ShPrintHtml(ym)) && /S稼働/.test(w._p2ShPrintHtml(ym)));
  c('サマリーにも出る', /ユーザーPT/.test(w._p2ShSumHtml(ym)) && /S稼働/.test(w._p2ShSumHtml(ym)));
});
