// 受付 v181：DAYスタッフに相談（DM）（架空データ）
//   お客さん：オーナーが「出す」にした時だけ「なかま」に「相談」。相談相手を選ぶ（DAYで担当した人・おすすめ・受付を休む）→ 相談を書く → やりとり・解決・止める・報告
//   スタッフ：「💜 Beauty」タブの「💬 相談の受信箱」（自分あてだけ）→ 返事・効果の言葉の確認・タグ・解決・引き継ぎ・先に送る
//   相談を受けるスタッフだけの人（DAY HOST でない）も、受信箱を使える
const path = require('path'), fs = require('fs');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const TA = '0123456789abcdef0123456789abcdef', UA = 'u17620000000001';
const card = (x) => Object.assign({ kind: 'user', no: UA, name: '見本 はなこ', union: 'REVE', active: true, visits: 2, exp_e1: { d: '2026-11-08', ev: '11月のDAY', menu: 'ルミスパ', staff: '見本 りな', st: 'done' } }, x || {});
const staff = { 'ckCs/REVE/s/st1': { name: '見本 りな', tags: ['skin', 'bust'], bio: '乾燥肌のケアならおまかせください', off: false, ord: 1 },
  'ckCs/REVE/s/st2': { name: '見本 まい', tags: ['skin', 'inner'], bio: '体の内側からのケア', off: false, ord: 2 },
  'ckCs/REVE/s/st3': { name: '見本 さら', tags: ['body'], bio: '', off: true, ord: 3 } };
const plan = { course: 'yuragi', qs: ['am', 'pm', 'moist'], start: '2026-11-01', days: {}, atMs: 1 };
const base = (x) => Object.assign({ ['cards/' + TA]: card(), ['cardClaims/' + UA]: { t: TA }, ['cards/' + TA + '/plan/me']: plan, ['ckBind/' + TA]: { uids: ['dev-1'], by: 'self', at: 1 } }, staff, x || {});
(async () => {
  const b = await P.browser();
  // ① まだ出していない時は「相談」は出ない
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base(), wait: 2800, init: 'window.__FBANON = "dev-1";' });
    c('オーナーが出すまでは「相談」は出ない', await o.ev(`document.getElementById('uaSegCs').hidden`));
    await o.ctx.close();
  }
  // ② お客さん：相談する
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base({ 'checkinConfig/beauty': { csNos: [UA] } }), wait: 2800, init: 'window.__FBANON = "dev-1";' });
    await o.page.addStyleTag({ content: '#toast{display:none!important}' });
    c('試す会員番号に入っていると「相談」が出る', !(await o.ev(`document.getElementById('uaSegCs').hidden`)));
    await o.page.click('#uaTabs [data-tab="friends"]'); await o.wt(200);
    await o.page.click('#uaSegCs'); await o.wt(300);
    c('「相談する」ボタンと説明', /DAYスタッフに、1対1で相談できます/.test(await o.ev(`document.getElementById('csArea').innerText`)));
    await o.page.screenshot({ path: OUT + '/ckdm181_list0.png' });
    await o.ev(`document.getElementById('csNew').click()`); await o.wt(500);
    const tx = await o.ev(`document.querySelector('.modal').innerText`);
    c('相談相手：DAYで担当した人が上・受付を休んでいる人は押せない', /見本 りな\s*DAYで担当した人/.test(tx) && (await o.ev(`document.querySelectorAll('.cs-st')[0].textContent`)).indexOf('見本 りな') >= 0 && (await o.ev(`[].filter.call(document.querySelectorAll('.cs-st'), function(b){ return /さら/.test(b.textContent); })[0].disabled`)), tx);
    c('おすすめ（ゆらぎ肌ケア編 → スキンケアの人）', /見本 まい\s*おすすめ/.test(tx), tx);
    await o.page.screenshot({ path: OUT + '/ckdm181_pick.png' });
    await o.ev(`document.querySelector('#csFlt [data-v="inner"]').click()`); await o.wt(200);
    c('分野で絞れる（体内ケア → まいさんだけ）', (await o.ev(`document.querySelectorAll('.cs-st').length`)) === 1 && /見本 まい/.test(await o.ev(`document.querySelector('.cs-st').textContent`)));
    await o.ev(`document.querySelector('#csFlt [data-v=""]').click()`); await o.wt(200);
    await o.ev(`document.querySelectorAll('.cs-st')[0].click()`); await o.wt(300);
    await o.page.fill('#csTx', '冬になると、夜に保湿しても朝つっぱります。順番を変えた方がいいですか？');
    await o.page.screenshot({ path: OUT + '/ckdm181_compose.png' });
    await o.ev(`document.getElementById('csGo').click()`); await o.wt(600);
    const keys = await o.ev(`Object.keys(window.__FBDATA).filter(function(k){ return /^ckDm\\/[^/]+$/.test(k); })`);
    const th = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['${keys[0]}'] || null)`));
    c('相談を送る：会員証・相手・分野・最後のひとこと', keys.length === 1 && th.tk === TA && th.sUid === 'st1' && th.topic === 'skin' && th.last.by === 'u' && th.byStaff === false && th.st === 'open', JSON.stringify(th));
    const ms = await o.ev(`Object.keys(window.__FBDATA).filter(function(k){ return k.indexOf('${keys[0]}/m/') === 0; }).map(function(k){ return window.__FBDATA[k].by + ':' + window.__FBDATA[k].uid; }).join()`);
    c('メッセージは、この端末の名前で', ms === 'u:dev-1', ms);
    c('やりとりの画面が開く', /朝つっぱります/.test(await o.ev(`document.getElementById('csChat').innerText`)));
    await o.page.screenshot({ path: OUT + '/ckdm181_chat.png' });
    await o.ev(`document.getElementById('csRep').click()`); await o.wt(300);
    c('報告できる', !!(await o.ev(`!!(window.__FBDATA['${keys[0]}'].rep)`)));
    c('エラーなし（お客さん）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ③ スタッフの返事が来ている
  {
    const tid = 'ckDm/t9', now = Date.now();
    const o = await P.open(b, { hash: '#c=' + TA, data: base({ 'checkinConfig/beauty': { csOpen: true }, [tid]: { tk: TA, un: 'REVE', cno: UA, cname: '見本 はなこ', sUid: 'st1', sName: '見本 りな', topic: 'skin', st: 'open', last: { by: 's', t: '化粧水のあとにすぐクリームを', at: now }, uRead: now - 1000, sRead: now, byStaff: false, at: 1, upAt: now },
      [tid + '/m/a']: { by: 'u', uid: 'dev-1', t: '朝つっぱります', at: '2026-11-26T10:00:00Z' }, [tid + '/m/b']: { by: 's', uid: 'st1', t: '化粧水のあとにすぐクリームを重ねてみてね', at: '2026-11-26T11:00:00Z' } }), wait: 2800, init: 'window.__FBANON = "dev-1";' });
    await o.page.addStyleTag({ content: '#toast{display:none!important}' });
    c('REVE の全員に出す設定でも出る・新しい返事に赤丸', !(await o.ev(`document.getElementById('uaSegCs').hidden`)) && !(await o.ev(`document.querySelector('.ua-dot[data-dot="cs"]').hidden`)));
    await o.page.click('#uaTabs [data-tab="friends"]'); await o.wt(200); await o.page.click('#uaSegCs'); await o.wt(300);
    await o.page.screenshot({ path: OUT + '/ckdm181_list.png' });
    await o.ev(`document.querySelector('#csArea [data-th]').click()`); await o.wt(400);
    c('開くと既読', (await o.ev(`window.__FBDATA['${tid}'].uRead`)) >= now);
    c('スタッフの返事が見える', /クリームを重ねてみてね/.test(await o.ev(`document.getElementById('csChat').innerText`)));
    await o.page.fill('#csRe', 'やってみます！'); await o.ev(`document.getElementById('csSend').click()`); await o.wt(400);
    c('返事を送る（最後のひとことも更新）', (await o.ev(`window.__FBDATA['${tid}'].last.t`)) === 'やってみます！');
    await o.ev(`document.getElementById('csStop').click()`); await o.wt(400);
    c('このスタッフを止める（止めた印も）', (await o.ev(`window.__FBDATA['${tid}'].stop`)) === true && !!(await o.ev(`!!window.__FBDATA['ckDmStop/${TA}_st1']`)));
    c('エラーなし（返事）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ④ スタッフ：受信箱（相談を受けるスタッフだけの人）
  {
    const user = (name) => ({ name, union: 'REVE', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
    const tid = 'ckDm/t9', now = Date.now();
    const data = Object.assign({ 'checkinUnions/REVE': { name: 'REVE', dayStaff: ['host1'] }, 'checkinConfig/beauty': { testers: [] }, 'users/st1': user('見本 りな'), 'users/st2': user('見本 まい'),
      'checkinUsers/u2': { name: '見本 ゆり', union: 'REVE', cardToken: 'b'.repeat(32), active: true },
      [tid]: { tk: TA, un: 'REVE', cno: UA, cname: '見本 はなこ', sUid: 'st1', sName: '見本 りな', topic: 'skin', st: 'open', last: { by: 'u', t: '朝つっぱります', at: now }, uRead: now, sRead: 0, byStaff: false, at: 1, upAt: now },
      [tid + '/m/a']: { by: 'u', uid: 'dev-1', t: '冬になると、朝つっぱります', at: '2026-11-26T10:00:00Z' },
      'ckDm/t8': { tk: TA, un: 'REVE', cno: UA, cname: '見本 ほか', sUid: 'st2', sName: '見本 まい', topic: 'inner', st: 'open', last: { by: 'u', t: 'ほかの人あて', at: now }, uRead: now, sRead: 0, byStaff: false, at: 1, upAt: now } }, staff);
    const o = await P.open(b, { uid: 'st1', data, wait: 2600 });
    await o.page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    c('相談を受けるスタッフだけの人にも「💜 Beauty」タブ', !(await o.ev(`document.querySelector('nav button[data-pane="pBeauty"]').classList.contains('hide')`)));
    await o.page.click('nav button[data-pane="pBeauty"]'); await o.wt(800);
    const ib = await o.ev(`document.getElementById('btDm').innerText`);
    c('受信箱：自分あてだけ（未返信 1）', /未返信（1）/.test(ib) && /見本 はなこ/.test(ib) && !/見本 ほか/.test(ib), ib);
    c('受付の切り替え（自分の行）も出る', (await o.ev(`document.querySelectorAll('#btCs [data-csoff]').length`)) === 1);
    await o.page.screenshot({ path: OUT + '/ckdm181_inbox.png' });
    await o.ev(`document.querySelector('#btDm [data-dm]').click()`); await o.wt(400);
    c('開くと既読', (await o.ev(`window.__FBDATA['${tid}'].sRead`)) > 0);
    await o.page.fill('#dmRe', '化粧水のあとにすぐクリームを重ねてみてね'); await o.page.fill('#dmTags', '乾燥、冬');
    await o.page.screenshot({ path: OUT + '/ckdm181_reply.png' });
    await o.ev(`document.getElementById('dmSend').click()`); await o.wt(400);
    const th = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['${tid}'])`));
    c('返事を送る：最後はスタッフ・悩みのタグ', th.last.by === 's' && th.tags.join() === '乾燥,冬', JSON.stringify(th));
    c('メッセージはスタッフの名前で', (await o.ev(`Object.keys(window.__FBDATA).filter(function(k){ return k.indexOf('${tid}/m/') === 0 && window.__FBDATA[k].by === 's'; }).map(function(k){ return window.__FBDATA[k].uid; }).join()`)) === 'st1');
    // 効果の言葉は確認が出る（テストでは「はい」）
    o.page.removeAllListeners('dialog'); let asked = '';
    o.page.on('dialog', d => { asked = d.message(); d.dismiss(); });
    await o.page.fill('#dmRe', 'これで改善します'); await o.ev(`document.getElementById('dmSend').click()`); await o.wt(300);
    c('効果をうたう言葉は、送る前に確認が出る（やめたら送らない）', /効果をうたう言葉（改善）/.test(asked) && (await o.ev(`window.__FBDATA['${tid}'].last.t`)) !== 'これで改善します', asked);
    o.page.removeAllListeners('dialog'); o.page.on('dialog', d => d.accept());
    await o.ev(`document.getElementById('dmHand').click()`); await o.wt(300);
    await o.ev(`document.querySelector('#dmTo input').click()`); await o.ev(`document.getElementById('dmHgo').click()`); await o.wt(400);
    c('ほかのスタッフへ引き継ぐ（引き継いだことも残す）', (await o.ev(`window.__FBDATA['${tid}'].sUid`)) === 'st2' && /引き継ぎました/.test(await o.ev(`window.__FBDATA['${tid}'].last.t`)));
    // 先に送る
    await o.ev(`document.getElementById('btDmNew').click()`); await o.wt(300);
    await o.page.fill('#dmQ', 'ゆり'); await o.ev(`document.getElementById('dmQgo').click()`); await o.wt(400);
    await o.ev(`document.querySelector('#dmQl [data-dq]').click()`); await o.wt(300);
    await o.page.fill('#dmFt', 'この前の DAY ではありがとうございました。その後どうですか？'); await o.ev(`document.getElementById('dmFgo').click()`); await o.wt(500);
    const fk = await o.ev(`Object.keys(window.__FBDATA).filter(function(k){ return /^ckDm\\/[^/]+$/.test(k) && window.__FBDATA[k].byStaff; })`);
    const caps = await o.ev(`Object.keys(window.__FBDATA).filter(function(k){ return k.indexOf('ckDmCap/') === 0; })`);
    c('先に送る：スタッフから始めた印と、月1回の印', fk.length === 1 && caps.length === 1 && caps[0].indexOf('ckDmCap/' + 'b'.repeat(32) + '_st1_') === 0, JSON.stringify([fk, caps]));
    c('エラーなし（スタッフ）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  await b.close();
  const H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
  c('APP_VER v181 以上', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 181);
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
