// v816：使い勝手レビュー（期間限定のアンケート）。名前は自動で付く・機能は選択式で詳細まで・結果はオーナー＋指定した人だけ
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.currentUser.name = '架空 一郎'; w.currentUser.union = 'UA';
  const ymd = n => { const d = new w.Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  let cfg = { round: 'r1', title: '使い勝手レビュー', from: ymd(-1), to: ymd(5), viewers: [], names: {} };
  const DB = {}, writes = [];
  let toastMsg = ''; const ot = w.toast; w.toast = m => { toastMsg = m; };
  w._rvLoadCfg = () => Promise.resolve(cfg);
  w._rvSaveCfg = d => { cfg = JSON.parse(JSON.stringify(d)); return Promise.resolve(); };
  w._rvLoadMine = round => Promise.resolve(DB[round + '_' + w.currentUser.uid] || null);
  w._rvWrite = (doc, isNew) => { writes.push({ doc: JSON.parse(JSON.stringify(doc)), isNew }); DB[doc.round + '_' + w.currentUser.uid] = JSON.parse(JSON.stringify(doc)); return Promise.resolve(); };
  // ① 期間中・まだ答えていない → HOMEにお願い
  await w.rvInit(); await sleep(20);
  c('期間中でまだ答えていない人にはHOMEにお願いが出る', /使い勝手レビューのお願い/.test(w._rvHomeCard()));
  w.renderMenuHub(); await sleep(10);
  c('スマホのHOME（メニュー）にも出る', /使い勝手レビューのお願い/.test((w.document.getElementById('view-menu') || {}).textContent || ''));
  // ② 答える
  w.rvOpen(); await sleep(10);
  c('名前は自動で付く（選ばない）', /架空 一郎さんの名前で送ります/.test($('#rvOv').textContent) && !/名前を出さない/.test($('#rvOv').textContent));
  w.rvStep(1); await sleep(5);
  c('満足度・頻度が無いと次へ進まない', w._rv.step === 0 && /満足度/.test(toastMsg));
  w.rvSet('all', 4); w.rvSet('nps', 9); w.rvSet('freq', 'w3'); w.rvStep(1); await sleep(5);
  c('2ページ目：まず大メニュー（PLAN・MAP・予定・ToDo・データ・その他）だけ', w._rv.step === 1 && $$('#rvOv .rv-tiles span').map(e => e.textContent).join() === 'PLAN,MAP,予定,ToDo,データ,その他' && !/翌月コピー/.test($('#rvOv').textContent));
  w.rvStep(1); await sleep(5);
  c('機能を1つも選ばないと次へ進まない', w._rv.step === 1);
  w.rvFeat('map'); await sleep(5);
  c('機能を押すと、その中の詳細が選択式で出る', /現状MAP（ツリー・サークル）/.test($('#rvOv').textContent) && /翌月コピー/.test($('#rvOv').textContent) && $$('#rvOv textarea').length === 1 && !/年の目標/.test($('#rvOv').textContent));
  w.rvSub('map', 0); w.rvSub('map', 1); w.rvSub('map', 1); w.rvSub('map', 3); w.rvSub('map', 99); w.rvFst('map', 4); $('#rvOv textarea').value = '  サークルで名前が重なる  '; w.rvFnote('map', $('#rvOv textarea').value);
  w.rvFeat('plan'); w.rvSub('plan', 1);
  c('★はタップでつく線のアイコン', $$('#rvOv .rv-stars span.on svg').length >= 4);
  c('詳細は押すたびに選ぶ・外す', JSON.stringify(w._rv.a.f.map.s) === JSON.stringify(['現状MAP（ツリー・サークル）', '翌月コピー']) && w._rv.a.f.map.st === 4 && w._rv.a.f.map.n === 'サークルで名前が重なる');
  c('途中の答えは端末に控える', /翌月コピー/.test(w.localStorage.getItem(w._rvDraftKey()) || ''));
  w.rvStep(1); await sleep(5);
  w.rvCf('plan'); w.rvSet('sp', 3);
  const ta = $$('#rvOv textarea'); ta[0].value = '計画シートの場所'; ta[2].value = '読み込みを速く'; ta[3].value = 'LINE通知';
  w.rvSubmit(); await sleep(20);
  const W0 = writes[0];
  c('送ると名前・ユニオン・版・端末が自動で付く', W0 && W0.isNew && W0.doc.name === '架空 一郎' && W0.doc.union === 'UA' && W0.doc.round === 'r1' && /^v\d+/.test(W0.doc.ver) && W0.doc.device);
  c('答えの中身', W0.doc.a.all === 4 && W0.doc.a.nps === 9 && W0.doc.a.freq === 'w3' && W0.doc.a.f.plan.s[0] === '計画シート' && W0.doc.a.cf[0] === 'plan' && W0.doc.a.sp === 3 && W0.doc.a.fix === '読み込みを速く');
  c('送ったらお願いは消える・控えも消す', w._rvHomeCard() === '' && !w.localStorage.getItem(w._rvDraftKey()) && !$('#rvOv'));
  c('設定には「回答ずみ（直せます）」', /回答ずみ/.test(w._rvStLis()));
  // ③ 直して送り直す
  w.rvOpen(); await sleep(5);
  c('もう一度開くと前の答えが入っている', w._rv.a.all === 4 && w._rv.a.f.map.s.length === 2);
  w.rvSet('all', 5); w._rv.step = 2; w.rvSubmit(); await sleep(20);
  c('送り直しは上書き（新しく作らない）', writes[1] && writes[1].isNew === false && writes[1].doc.a.all === 5);
  // ④ 期間外
  cfg.to = ymd(-1); cfg.from = ymd(-9); await w.rvInit(); await sleep(10);
  w.rvOpen(); await sleep(5);
  c('期間外はお願いも出ず、答えられない', w._rvHomeCard() === '' && !$('#rvOv') && /期間ではありません/.test(toastMsg));
  cfg.from = ymd(-1); cfg.to = ymd(5); await w.rvInit();
  // ⑤ 結果（オーナー）
  const ans = (uid, name, union, a) => ({ id: 'r1_' + uid, round: 'r1', uid, name, union, ver: 'v816', device: 'iPhone Safari', a });
  const res = [ans('u1', '試験 二郎', 'UA', { all: 5, nps: 10, freq: 'd', sp: 4, f: { map: { s: ['現状MAP（ツリー・サークル）', '翌月コピー'], st: 5, n: '' }, plan: { s: ['計画シート'], st: 3, n: '計画シートの印刷がずれる' } }, cf: ['plan'], fix: 'PLANをわかりやすく', good: '見やすい' }),
    ans('u2', '見本 三郎', 'UB', { all: 3, nps: 6, freq: 'w1', sp: 3, f: { map: { s: ['現状MAP（ツリー・サークル）'], st: 3, n: '' } }, cf: [], wish: 'LINEに通知' }),
    ans('u3', '例題 四郎', 'UA', { all: 4, nps: 8, freq: 'w3', f: { events: { s: ['カレンダー（月・週・日）'], st: 4 } } })];
  const users = [{ id: 'u1', name: '試験 二郎', union: 'UA', status: 'active' }, { id: 'u2', name: '見本 三郎', union: 'UB', status: 'active' }, { id: 'u3', name: '例題 四郎', union: 'UA', status: 'active' },
    { id: 'u4', name: '仮名 五郎', union: 'UA', status: 'active' }, { id: 'u5', name: '止めた 六郎', union: 'UA', status: 'disabled' }];
  w._rvLoadAll = () => Promise.resolve(JSON.parse(JSON.stringify(res)));
  const fgc = w.fsGetCol; w.fsGetCol = p => p === 'users' ? Promise.resolve(users) : fgc(p);
  c('オーナーは結果を見られる', w._rvViewer() && /レビューの結果/.test(w._rvStLis()));
  w.rvResOpen(); await sleep(20);
  const tx = () => $('#rvResOv').textContent;
  c('回答数／対象（承認ずみで使っている人）', /回答3\/ 4人/.test(tx().replace(/\s+/g, '')) || /3\/ 4人/.test(tx()));
  c('全体の満足度の平均・NPS', /4\/ 5/.test(tx()) && /\+0|0/.test(tx()));
  c('まだ答えていない人の名前', /まだ答えていない人 1人/.test(tx()) && /仮名 五郎/.test(tx()) && !/止めた 六郎/.test(tx()));
  w.rvTab('feat'); await sleep(5);
  c('機能ごと：使っている人数・★平均・詳細の数', /MAP2人・4/.test(tx()) && /現状MAP（ツリー・サークル）2人/.test(tx().replace(/\s+/g, '')) && /計画シートの印刷がずれる/.test(tx()));
  w.rvUn('UB'); await sleep(5);
  c('ユニオンで絞れる', /MAP1人/.test(tx()));
  w.rvUn(''); w.rvTab('cm'); await sleep(5);
  c('ひとこと：直してほしい・うれしい機能・良かったところ', /PLANをわかりやすく/.test(tx()) && /LINEに通知/.test(tx()) && /見やすい/.test(tx()) && /試験 二郎・UA/.test(tx()));
  // バグ・要望に回す
  w._fb.ok = true; w.rvTab('feat'); await sleep(5);
  let made = null; w._fbCreate = (it) => { made = it; return Promise.resolve(42); };
  const k = Object.keys(w._rv._cm).find(x => w._rv._cm[x].t === '計画シートの印刷がずれる');
  w.rvToFb(k); await sleep(10);
  c('気になる声を「バグ・要望」に回せる（画面・誰の声か付き）', made && made.kind === 'req' && made.screen === 'PLAN' && /試験 二郎さん/.test(made.did) && /【PLAN】/.test(made.did) && /#42/.test(toastMsg));
  w.rvTab('who'); await sleep(5); w.rvDet('r1_u1'); await sleep(5);
  c('1人ずつの答えも見られる', /現状MAP（ツリー・サークル）・翌月コピー/.test(tx()) && /一番直してほしいところ/.test(tx()));
  const ct = w._rvClaudeText();
  c('Claude用にコピー：まとめと声', /回答 3人／対象 4人/.test(ct) && /・MAP：2人・★4/.test(ct) && /PLANをわかりやすく/.test(ct));
  w._p2SheetClose('rvResOv');
  // ⑥ 一般の人は結果を見られない・指定された人は見られる
  w.currentUser.uid = 'u2'; c('一般の人は結果を見られない', !w._rvViewer() && !/レビューの結果/.test(w._rvStLis()));
  cfg.viewers = ['u2']; await w.rvInit(); c('指定された人は見られる', w._rvViewer());
  w.currentUser.uid = T.OWNER;
  // ⑦ 設定（オーナー）：期間を決めて始める・新しい回
  cfg = {}; await w.rvInit();
  w.rvCfgOpen(); await sleep(5);
  $('#rvCF').value = ymd(0); $('#rvCTo').value = ymd(13); w.rvCfgSave(0); await sleep(30);
  c('期間を決めて始められる', cfg.round && cfg.from === ymd(0) && cfg.to === ymd(13) && /使い勝手レビュー/.test(cfg.title));
  const r0 = cfg.round;
  w.rvCfgOpen(); await sleep(5); $('#rvCTo').value = ymd(20); w.rvCfgSave(0); await sleep(30);
  c('期間だけ変えると同じ回のまま', cfg.round === r0 && cfg.to === ymd(20));
  w.rvCfgOpen(); await sleep(5); w.rvCfgSave(1); await sleep(30);
  c('新しい回として始めると、前の回は結果で切りかえて見られる', cfg.round !== r0 && cfg.rounds[0].id === r0);
  w._p2SheetClose('rvResOv');
  w.fsGetCol = fgc; w.toast = ot;
});
