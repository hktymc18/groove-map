// 受付 v145：DAYの体感。DAY HOST が DAYスタッフ・予約受付担当を任命 → 参加者を入れる → 担当と順番を割り振る。
//   DAYスタッフの会員証に担当（自分の担当は「済み」）・参加者のアプリに体感と担当・受付に体感と担当。架空データ
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const TS1 = 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1', TS2 = 'b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2', TT = 'c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3', TR = 'd4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4', TU = 'e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5';
const D = day(3);
const user = (name) => ({ name, union: 'ANTARES', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
const mem = (no, name, x) => Object.assign({ no, name, union: 'ANTARES', group: '見本系列', active: true }, x || {});
const base = () => ({
  'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['ua1'], dayStaff: ['host1'] }, 'checkinConfig/beauty': { testers: ['host1'] }, 'users/host1': user('見本 ほすと'),
  'checkinMembers/ANT0001': mem('ANT0001', '見本 えきすぱ', { badges: ['EXPERT'], cardToken: TS1, kana: 'みほん えきすぱ' }),
  'checkinMembers/ANT0002': mem('ANT0002', '見本 ふつう', { cardToken: TS2, kana: 'みほん ふつう' }),
  'checkinMembers/ANT0003': mem('ANT0003', '見本 けんしゅう', { trainee: true, cardToken: TT, kana: 'みほん けんしゅう' }),
  'checkinMembers/ANT0004': mem('ANT0004', '見本 しょうかい', { badges: ['DIRECTOR'], cardToken: TR, kana: 'みほん しょうかい' }),
  ['cards/' + TS1]: { no: 'ANT0001', name: '見本 えきすぱ', union: 'ANTARES', active: true },
  ['cards/' + TS2]: { no: 'ANT0002', name: '見本 ふつう', union: 'ANTARES', active: true },
  ['cards/' + TT]: { no: 'ANT0003', name: '見本 けんしゅう', union: 'ANTARES', active: true, trainee: true },
  ['cards/' + TR]: { no: 'ANT0004', name: '見本 しょうかい', union: 'ANTARES', active: true },
  ['cards/' + TU]: { kind: 'user', no: 'u1', name: '見本 はなこ', union: 'ANTARES', active: true, visits: 1 },
  'cardClaims/u1': { t: TU },
  'checkinUsers/u1': { uid: 'u1', name: '見本 はなこ', union: 'ANTARES', cardToken: TU, active: true, referrer: '見本 しょうかい', referrerNo: 'ANT0004' },
  'checkinEvents/evD': { date: D, month: D.slice(0, 7), name: '12月のDAY', unions: ['ANTARES'], hostUnion: 'ANTARES', uDay: true, uInfo: '19:00〜 見本ホール' } });
(async () => {
  const b = await P.browser();
  let DATA;
  // ① DAY HOST：任命・参加者・割り振り
  {
    const { ctx, page, ev, wt, errs } = await P.open(b, { uid: 'host1', data: base(), wait: 2600 });
    await page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await page.click('nav button[data-pane="pBeauty"]'); await wt(700);
    await page.click('#btDyGo'); await wt(800);
    c('DAY を選ぶ：これからの DAY（💜 次のDAYとして出すもの）', /12月のDAY/.test(await ev(`document.getElementById('btDyEv').selectedOptions[0].textContent`)));
    await page.click('#btDyStaff'); await wt(700);
    const order = await ev(`[].map.call(document.querySelectorAll('#dySl .dy-sn'), function(x){ return x.textContent; }).join('|')`);
    c('任命：バッジ（EXPERT・DIRECTOR など）の人が上・バッジ付き', /^見本 えきすぱ EXPERT\|見本 しょうかい DIRECTOR/.test(order), order);
    await page.screenshot({ path: OUT + '/ckdy145_staff.png' });
    const idx = async (name) => ev(`[].findIndex.call(document.querySelectorAll('#dySl .dy-sr'), function(r){ return r.querySelector('.dy-sn').textContent.indexOf(${JSON.stringify(name)}) === 0; })`);
    for (const [n, a] of [['見本 えきすぱ', 'data-ss'], ['見本 ふつう', 'data-ss'], ['見本 しょうかい', 'data-sr']]) { const i = await idx(n); await ev(`document.querySelectorAll('#dySl .dy-sr')[${i}].querySelector('[${a}]').click()`); }
    await page.click('#dySgo'); await wt(900);
    const day1 = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['checkinEvents/evD/btDay/ANTARES']||null)`));
    c('任命を保存：DAYスタッフ2人・予約受付担当1人・鍵', day1 && day1.staff.map(s => s.no).join() === 'ANT0001,ANT0002' && day1.recv.map(s => s.no).join() === 'ANT0004' && /^[a-f0-9]{20}$/.test(day1.key), JSON.stringify(day1));
    const key = day1.key;
    c('掲示板の見出し（イベント・ユニオン・DAYスタッフ）', (await ev(`(window.__FBDATA['ckBoard/${key}']||{}).eid`)) === 'evD' && (await ev(`(window.__FBDATA['ckBoard/${key}']||{}).staff.length`)) === 2);
    const m1 = JSON.parse(await ev(`JSON.stringify([window.__FBDATA['cards/${TS1}'].btd_evD, window.__FBDATA['cards/${TR}'].btd_evD, window.__FBDATA['cards/${TT}'].btd_evD||null])`));
    c('任命した人の会員証に印（DAYスタッフ・予約受付担当）・任命していない人には無い', m1[0].key === key && m1[0].role === 'staff' && m1[1].role === 'recv' && m1[2] === null, JSON.stringify(m1));
    // 参加者を足す
    const add = async (o) => {
      await page.click('#btDyAdd'); await wt(500);
      await ev(`(function(){ var k=document.getElementById('dyKind'); k.value=${JSON.stringify(o.kind)}; k.onchange(); var n=document.getElementById('dyName'); n.value=${JSON.stringify(o.name)}; n.oninput(); document.getElementById('dyRef').value=${JSON.stringify(o.ref || '')}; })()`);
      if (o.menu) await page.click(`#dyMenu [data-m="${o.menu}"]`);
      if (o.w1) await page.selectOption('#dyW1', { label: o.w1 });
      if (o.mist) await ev(`document.getElementById('dyMist').click()`);
      const link = await ev(`document.getElementById('dyLink').textContent`);
      await page.click('#dyGo'); await wt(600);
      return link;
    };
    const l1 = await add({ kind: 'na1', name: '見本 はなこ', ref: '見本 しょうかい', menu: 'ルミスパ', w1: '見本 えきすぱ', mist: true });
    c('名簿にいるユーザーは「アプリに体感が出ます」', /アプリに体感が出ます/.test(l1), l1);
    await add({ kind: 'na0', name: '見本 はじめて', ref: '見本 しょうかい' });
    const l3 = await add({ kind: 'tr1', name: '見本 けんしゅう', ref: '見本 しょうかい', menu: 'ウェルスパ' });
    c('研修生はビジネスの名簿から（会員証に体感が出る）', /会員証に体感が出ます/.test(l3), l3);
    const ps = JSON.parse(await ev(`JSON.stringify(Object.keys(window.__FBDATA).filter(function(k){ return k.indexOf('ckBoard/${key}/p/')===0; }).map(function(k){ return window.__FBDATA[k]; }))`));
    const P1 = ps.find(p => p.name === '見本 はなこ'), P2 = ps.find(p => p.name === '見本 はじめて'), P3 = ps.find(p => p.name === '見本 けんしゅう');
    c('参加者3人：区分・メニュー・希望・ミスト・紹介者（会員番号）・名簿とのつながり', ps.length === 3 && P1.kind === 'na1' && P1.menu === 'ルミスパ' && P1.w1 === '見本 えきすぱ' && P1.mist === true && P1.refNo === 'ANT0004' && P1.ckNo === 'u1'
      && P2.kind === 'na0' && P2.menu === '' && P3.memNo === 'ANT0003' && P3.menu === 'ウェルスパ', JSON.stringify(ps).slice(0, 400));
    let t = await ev(`document.getElementById('btDay').innerText`);
    c('一覧：未割り振り2（体感あり）・体感なし1・合計', /参加 3 人（体感 2・体感なし 1）/.test(t) && /未割り振り 2/.test(t), t.slice(0, 300));
    // 割り振り
    const pidOf = (name) => ev(`[].filter.call(document.querySelectorAll('#btDay .dy-row'), function(r){ return r.querySelector('.dy-nm b').textContent === ${JSON.stringify(name)}; })[0].getAttribute('data-pid')`);
    const asg = async (name, no) => { const pid = await pidOf(name); await page.selectOption(`#btDay [data-dyst="${pid}"]`, no); await wt(600); return pid; };
    const pid1 = await asg('見本 はなこ', 'ANT0001');
    const pid3 = await asg('見本 けんしゅう', 'ANT0001');
    c('担当に割り振ると順番（1・2）', (await ev(`window.__FBDATA['ckBoard/${key}/p/${pid1}'].ord`)) === 1 && (await ev(`window.__FBDATA['ckBoard/${key}/p/${pid3}'].ord`)) === 2 && (await ev(`window.__FBDATA['ckBoard/${key}/p/${pid1}'].staffName`)) === '見本 えきすぱ');
    await page.click(`#btDay [data-dyup="${pid3}"]`); await wt(700);
    c('↑ で順番を入れかえ', (await ev(`window.__FBDATA['ckBoard/${key}/p/${pid3}'].ord`)) === 1 && (await ev(`window.__FBDATA['ckBoard/${key}/p/${pid1}'].ord`)) === 2);
    await wt(500);
    const mu = JSON.parse(await ev(`JSON.stringify([window.__FBDATA['cards/${TU}'].exp_evD||null, window.__FBDATA['cards/${TT}'].exp_evD||null])`));
    c('参加者のアプリ（ユーザー）・会員証（研修生）に体感・担当・順番を写す', mu[0] && mu[0].menu === 'ルミスパ' && mu[0].staff === '見本 えきすぱ' && mu[0].ord === 2 && mu[0].st === 'rsv' && mu[1] && mu[1].menu === 'ウェルスパ' && mu[1].ord === 1, JSON.stringify(mu));
    t = await ev(`document.getElementById('btDay').innerText`);
    c('未割り振りが無くなり、担当ごとのまとまり', !(await ev(`!!document.querySelector('#btDay .dy-g.hot')`)) && /見本 えきすぱ（2）/.test(t) && /見本 ふつう（0）/.test(t), t.slice(0, 400));
    await ev(`document.getElementById('btDay').scrollIntoView()`);
    await page.screenshot({ path: OUT + '/ckdy145_host.png', fullPage: true });
    c('エラーなし（DAY HOST）', !errs.length, errs.join(' / '));
    DATA = JSON.parse(await ev('JSON.stringify(window.__FBDATA)'));
    DATA._key = key; DATA._pid1 = pid1; DATA._pid3 = pid3;
    await ctx.close();
  }
  const key = DATA._key, pid1 = DATA._pid1;
  const data2 = Object.assign({}, DATA); delete data2._key; delete data2._pid1; delete data2._pid3;
  // ② DAYスタッフの会員証
  for (const dark of [false, true]) {
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, hash: '#c=' + TS1, data: data2, wait: 2600 });
    await page.addStyleTag({ content: '#toast{display:none!important}' });
    const t = await ev(`document.getElementById('dyArea').innerText`);
    c('DAYスタッフの会員証：DAYの体感・自分の担当（順番・メニュー）' + (dark ? '（ダーク）' : ''), /DAYの体感/.test(t) && /あなたは DAYスタッフ/.test(t) && /あなたの担当（2）/.test(t) && /見本 けんしゅう[\s\S]*見本 はなこ/.test(t) && /ルミスパ/.test(t), t);
    await ev(`document.getElementById('dyArea').scrollIntoView()`);
    await page.screenshot({ path: OUT + '/ckdy145_card' + (dark ? '_d' : '') + '.png' });
    if (!dark) {
      await page.click(`#dyArea [data-dcok="${pid1}"]`); await wt(600);
      c('自分の担当を「済み」に（掲示板・本人の印）', (await ev(`window.__FBDATA['ckBoard/${key}/p/${pid1}'].st`)) === 'done' && (await ev(`(window.__FBDATA['ckBoard/${key}/done/${pid1}']||{}).tk`)) === TS1);
      c('「済み」のあとは「戻す」', !!(await ev(`!!document.querySelector('#dyArea [data-dcrs="${pid1}"]')`)));
      Object.assign(data2, JSON.parse(await ev('JSON.stringify(window.__FBDATA)')));
    }
    c('エラーなし（DAYスタッフの会員証）' + (dark ? '（ダーク）' : ''), !errs.length, errs.join(' / '));
    await ctx.close();
  }
  {
    const o = await P.open(b, { hash: '#c=' + TS2, data: data2, wait: 2400 });
    const t = await o.ev(`document.getElementById('dyArea').innerText`);
    c('担当がいない DAYスタッフ：「まだ割り振られていません」と全体の一覧', /あなたの担当（0）/.test(t) && /まだ割り振られていません/.test(t) && /見本 えきすぱ（2）/.test(t), t);
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#c=' + TR, data: data2, wait: 2400 });
    const t2 = await o2.ev(`document.getElementById('dyArea').innerText`);
    c('予約受付担当：一覧だけ（「済み」は押せない）', /あなたは 予約受付担当/.test(t2) && !/あなたの担当/.test(t2) && !(await o2.ev(`!!document.querySelector('#dyArea [data-dcok]')`)), t2);
    await o2.ctx.close();
    const o3 = await P.open(b, { hash: '#c=' + TT, data: data2, wait: 2400 });
    c('研修生の会員証に「あなたの体感」（メニュー・担当・順番）', /あなたの体感[\s\S]*ウェルスパ[\s\S]*担当 見本 えきすぱ・1番目/.test(await o3.ev(`document.getElementById('dyArea').innerText`)));
    await o3.ctx.close();
  }
  // ③ 参加者のアプリ：次のDAYに体感と担当 → DAY HOST が開くと「済み」が写る → 体感の記録
  {
    const o = await P.open(b, { hash: '#c=' + TU, data: data2, wait: 2600 });
    const t = await o.ev(`document.getElementById('nwArea').innerText`);
    c('アプリの次のDAYに「💆 体感：ルミスパ（担当・順番）」', /💆 体感：ルミスパ（担当 見本 えきすぱ・2番目）/.test(t), t);
    await o.page.addStyleTag({ content: '#toast{display:none!important}' });
    await o.page.screenshot({ path: OUT + '/ckdy145_app.png' });
    await o.ctx.close();
    const h = await P.open(b, { uid: 'host1', data: data2, wait: 2600 });
    await h.page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await h.page.click('nav button[data-pane="pBeauty"]'); await h.wt(700);
    await h.page.click('#btDyGo'); await h.wt(1500);
    c('DAY HOST が開くと、会員証で「済み」にした分がアプリへ写る', (await h.ev(`window.__FBDATA['cards/${TU}'].exp_evD.st`)) === 'done');
    Object.assign(data2, JSON.parse(await h.ev('JSON.stringify(window.__FBDATA)')));
    await h.ctx.close();
    const o2 = await P.open(b, { hash: '#c=' + TU, data: data2, wait: 2600 });
    await o2.page.click('#uaTabs [data-tab="me"]'); await o2.wt(300);
    c('マイページに「体感の記録」', /体感の記録[\s\S]*ルミスパ/.test(await o2.ev(`document.getElementById('exArea').innerText`)));
    c('エラーなし（アプリ）', !o2.errs.length, o2.errs.join(' / '));
    await o2.ctx.close();
  }
  // ④ 受付：初めての人を登録すると、名前が同じ事前登録を出して、つなぐ
  {
    const { ctx, ev, wt, errs } = await P.open(b, { expose: true, data: { 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['j2DPDAccCygHmR9i5K3bTvHnH0V2'] } } });
    await ev('window.__ck.practiceStart()'); await wt(1500);
    await ev(`[].forEach.call(document.querySelectorAll('button'),function(b){ if(/^OK/.test(b.textContent.trim()) && b.offsetParent) b.click(); })`);
    const evId = await ev(`window.__ck.rec().ev.id`), un = await ev(`(window.__ck.rec().ev.unions||[])[0]`);
    const K = 'k1k1k1k1k1k1k1k1k1k1';
    await ev(`(function(){ var d=window.__ck.db(); return Promise.all([d.collection('checkinEvents').doc(${JSON.stringify(evId)}).collection('btDay').doc(${JSON.stringify(un)}).set({ union: ${JSON.stringify(un)}, key: '${K}', staff: [{ no: 'ANT0001', name: '見本 えきすぱ' }], recv: [] }),
      d.collection('ckBoard').doc('${K}').collection('p').doc('x1').set({ kind: 'na1', name: '見本 みどり', ref: '見本 しょうかい', menu: 'ルミスパ', staffNo: 'ANT0001', staffName: '見本 えきすぱ', ord: 1, st: 'rsv', ckNo: '', memNo: '' })]); })()`);
    await ev(`document.getElementById('btnGuest').click()`); await wt();
    await ev(`(function(){ document.getElementById('gName').value='見本 みどり'; var c=document.getElementById('gAsUser'); c.checked=true; c.onchange(); document.getElementById('gRef').value='見本 しょうかい'; document.getElementById('gGo').click(); })()`); await wt(1200);
    const st = await ev(`document.getElementById('stageBody').innerText`);
    c('受付：名前が同じ事前登録の体感・担当・順番を出す', /💆 体感：ルミスパ（担当 見本 えきすぱ・1番目）/.test(st) && /この事前登録とつなぐ/.test(st), st);
    await ev(`document.getElementById('stgDayLink').click()`); await wt(500);
    const uid = await ev(`(function(){ var r=window.__ck.rec(); return Object.keys(r.att).filter(function(x){ return r.att[x].kind==='user'; })[0]; })()`);
    c('「つなぐ」で事前登録にユーザーの番号が入る', (await ev(`window.__ck.db().collection('ckBoard').doc('${K}').collection('p').doc('x1').get().then(function(s){ return s.data().ckNo; })`)) === uid);
    c('受付の画面に「体験・購入」は無い', !(await ev(`!!document.getElementById('stgUserLog')`)));
    c('エラーなし（受付）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
