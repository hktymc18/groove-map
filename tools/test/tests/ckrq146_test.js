// 受付 v146：DAYの参加申し込み。紹介者が会員証から送る → 予約受付担当（受付にログイン・申し込みだけ）・DAY HOST が確かめる → 参加者に入れる →
//   担当の DAYスタッフの会員証に事前情報。架空データ
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const TS1 = 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1', TS2 = 'b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2', TR = 'd4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4', K = 'k1k1k1k1k1k1k1k1k1k1';
const D = day(3);
const user = (name, x) => Object.assign({ name, union: 'ANTARES', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } }, x || {});
const mem = (no, name, x) => Object.assign({ no, name, union: 'ANTARES', group: '見本系列', active: true }, x || {});
const base = () => ({
  'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['ua1'], dayStaff: ['host1'] },
  'checkinConfig/beauty': { testers: ['host1'], cardNos: ['ANT0002'] },
  'users/host1': user('見本 ほすと'), 'users/recv1': user('見本 うけつけ', { ckNo: 'ANT0004' }),
  'checkinMembers/ANT0001': mem('ANT0001', '見本 えきすぱ', { badges: ['EXPERT'], cardToken: TS1 }),
  'checkinMembers/ANT0002': mem('ANT0002', '見本 しょうかい', { cardToken: TS2 }),
  'checkinMembers/ANT0004': mem('ANT0004', '見本 うけつけ', { cardToken: TR }),
  ['cards/' + TS1]: { no: 'ANT0001', name: '見本 えきすぱ', union: 'ANTARES', active: true, btd_evD: { key: K, d: D, ev: '12月のDAY', union: 'ANTARES', role: 'staff' } },
  ['cards/' + TS2]: { no: 'ANT0002', name: '見本 しょうかい', union: 'ANTARES', active: true },
  ['cards/' + TR]: { no: 'ANT0004', name: '見本 うけつけ', union: 'ANTARES', active: true, btd_evD: { key: K, d: D, ev: '12月のDAY', union: 'ANTARES', role: 'recv' } },
  'checkinEvents/evD': { date: D, month: D.slice(0, 7), name: '12月のDAY', unions: ['ANTARES'], hostUnion: 'ANTARES', uDay: true },
  'checkinEvents/evD/btDay/ANTARES': { union: 'ANTARES', date: D, ev: '12月のDAY', key: K, staff: [{ no: 'ANT0001', name: '見本 えきすぱ' }], recv: [{ no: 'ANT0004', name: '見本 うけつけ' }], recvNos: ['ANT0004'], by: 'host1', at: 1 },
  ['ckBoard/' + K]: { eid: 'evD', union: 'ANTARES', date: D, ev: '12月のDAY', staff: [{ no: 'ANT0001', name: '見本 えきすぱ' }], by: 'host1', at: 1 },
  'ckDayPub/evD_ANTARES': { union: 'ANTARES', eid: 'evD', date: D, ev: '12月のDAY', staff: ['見本 えきすぱ'], menus: ['ルミスパ', 'ウェルスパ', 'カウンセリング'], open: true } });
(async () => {
  const b = await P.browser();
  let data = base(), rid = '';
  // ① 紹介者の会員証から申し込む
  for (const dark of [false, true]) {
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, hash: '#c=' + TS2, data, wait: 2600 });
    await page.addStyleTag({ content: '#toast{display:none!important}' });
    const t = await ev(`document.getElementById('rqArea').innerText`);
    c('紹介者の会員証に「DAYの参加申し込み」（窓口が開いている DAY）' + (dark ? '（ダーク）' : ''), /DAYの参加申し込み/.test(t) && /12月のDAY/.test(t) && /申し込む/.test(t), t);
    await page.click('#rqArea [data-rqn="evD"]'); await wt(400);
    c('申し込みの画面：参加区分・名前・体感メニュー・担当の希望（DAYスタッフから）・ミスト・ゴール', !!(await ev(`!!document.getElementById('rqKind') && !!document.getElementById('rqGoal')`)) && /見本 えきすぱ/.test(await ev(`document.getElementById('rqW1').innerText`)) && (await ev(`document.querySelectorAll('#rqMenu button').length`)) === 3);
    if (dark) { await page.screenshot({ path: OUT + '/ckrq146_form_d.png' }); await ctx.close(); continue; }
    await page.fill('#rqName', '見本 みどり'); await page.click('#rqGo'); await wt(200);
    c('初めての人は付き添いBAが必須', /付き添いBA/.test(await ev(`document.getElementById('toast').textContent`)));
    await page.fill('#rqBa', '見本 つきそい'); await page.click('#rqGo'); await wt(200);
    c('体感メニューが必須', /体感メニュー/.test(await ev(`document.getElementById('toast').textContent`)));
    await page.click('#rqMenu [data-m="ルミスパ"]'); await page.click('#rqGo'); await wt(200);
    c('ゴールが必須', /ゴール/.test(await ev(`document.getElementById('toast').textContent`)));
    await page.fill('#rqAge', '30代'); await page.selectOption('#rqSex', '女性'); await page.selectOption('#rqSt', 'NA（NS説明前）');
    await page.fill('#rqJob', '会社員'); await page.fill('#rqRel', '職場の友人'); await page.fill('#rqUp', '見本 るびい');
    await page.selectOption('#rqW1', '見本 えきすぱ'); await page.selectOption('#rqMist', '購入する');
    await page.fill('#rqGoal', '肌のくすみが気になるので、体感して知ってほしい'); await page.fill('#rqTalk', '保湿の話'); await page.fill('#rqNext', '個別体感');
    await page.screenshot({ path: OUT + '/ckrq146_form.png' });
    await page.click('#rqGo'); await wt(700);
    rid = await ev(`Object.keys(window.__FBDATA).filter(function(k){ return /^ckReq\\//.test(k); }).map(function(k){ return k.split('/')[1]; })[0]||''`);
    const r = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckReq/${rid}']||null)`));
    c('送ると申し込み（受付中・紹介者・DAY・中身）', r && r.st === 'new' && r.refNo === 'ANT0002' && r.refName === '見本 しょうかい' && r.eid === 'evD' && r.kind === 'na1' && r.menu === 'ルミスパ' && r.w1 === '見本 えきすぱ' && r.mist === true && r.goal.indexOf('くすみ') > 0 && r.attendBa === '見本 つきそい', JSON.stringify(r).slice(0, 300));
    c('本人の印（会員証のトークン）と、紹介者の会員証の印', (await ev(`(window.__FBDATA['ckReqProof/${rid}']||{}).tk`)) === TS2 && !!(await ev(`!!window.__FBDATA['cards/${TS2}/dreq/${rid}']`)));
    c('会員証に「受付中」で出る・直せる', /見本 みどり[\s\S]*受付中/.test(await ev(`document.getElementById('rqArea').innerText`)) && !!(await ev(`!!document.querySelector('#rqArea [data-rqe]')`)));
    await page.screenshot({ path: OUT + '/ckrq146_card.png' });
    c('エラーなし（紹介者）', !errs.length, errs.join(' / '));
    data = JSON.parse(await ev('JSON.stringify(window.__FBDATA)'));
    await ctx.close();
  }
  {
    const d2 = Object.assign({}, data, { 'checkinConfig/beauty': { testers: ['host1'], cardNos: [] } });
    const o = await P.open(b, { hash: '#c=' + TS2, data: d2, init: `try{ localStorage.removeItem('bci_bty_nos'); }catch(e){}`, wait: 2400 });
    c('準備中：指定していない会員証には出ない', (await o.ev(`document.getElementById('rqArea').innerHTML`)) === '');
    await o.ctx.close();
  }
  // ② 予約受付担当（受付にログイン・確認メンバーでなくてもよい）：申し込みだけを確かめる・差し戻す
  {
    const { ctx, page, ev, wt, errs } = await P.open(b, { uid: 'recv1', data, wait: 2800 });
    await page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    c('予約受付担当：「💜 Beauty」タブが出る', !(await ev(`document.querySelector('nav button[data-pane="pBeauty"]').classList.contains('hide')`)));
    await page.click('nav button[data-pane="pBeauty"]'); await wt(900);
    const t = await ev(`document.getElementById('btBody').innerText`);
    c('申し込みだけ（お知らせ・ラウンジ・DAYの体感は出ない）', /DAYの参加申し込み/.test(t) && /見本 みどり/.test(t) && /受付中/.test(t) && !/お知らせ|ラウンジ|DAYの体感/.test(t), t.slice(0, 300));
    await page.screenshot({ path: OUT + '/ckrq146_recv.png' });
    await page.click(`#btRq [data-rqo="${rid}"]`); await wt(400);
    const m = await ev(`document.querySelector('.modal').innerText`);
    c('詳しく：事前情報が全部見える・「参加者に入れる」は無い（DAY HOST だけ）', /肌のくすみ/.test(m) && /会社員/.test(m) && /職場の友人/.test(m) && /見本 つきそい/.test(m) && !(await ev(`!!document.getElementById('rqIn')`)), m.slice(0, 300));
    await page.click('#rqNg'); await wt(200);
    c('差し戻しは理由が必要', /理由/.test(await ev(`document.getElementById('toast').textContent`)));
    await page.fill('#rqNote', '付き添いBAの名前をフルネームで'); await page.click('#rqNg'); await wt(500);
    const r = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckReq/${rid}'])`));
    c('差し戻し：状態・理由・確かめた人', r.st === 'ng' && r.note === '付き添いBAの名前をフルネームで' && r.chkName === '見本 うけつけ', JSON.stringify(r).slice(0, 200));
    c('エラーなし（予約受付担当）', !errs.length, errs.join(' / '));
    data = JSON.parse(await ev('JSON.stringify(window.__FBDATA)'));
    await ctx.close();
  }
  // ③ 紹介者が直して送り直す
  {
    const { ctx, page, ev, wt, errs } = await P.open(b, { hash: '#c=' + TS2, data, wait: 2600 });
    await page.addStyleTag({ content: '#toast{display:none!important}' });
    c('紹介者の会員証に差し戻しの理由', /差し戻し：付き添いBAの名前をフルネームで/.test(await ev(`document.getElementById('rqArea').innerText`)));
    await page.click(`#rqArea [data-rqe="${rid}"]`); await wt(400);
    await page.fill('#rqBa', '見本 つきそい太郎'); await page.click('#rqGo'); await wt(600);
    const r = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckReq/${rid}'])`));
    c('直して送ると受付中に戻る（中身が新しくなる）', r.st === 'new' && r.attendBa === '見本 つきそい太郎', JSON.stringify(r).slice(0, 200));
    c('エラーなし（直す）', !errs.length, errs.join(' / '));
    data = JSON.parse(await ev('JSON.stringify(window.__FBDATA)'));
    await ctx.close();
  }
  // ④ DAY HOST：確認済み → 参加者に入れる → 担当 → 担当の会員証に事前情報
  {
    const { ctx, page, ev, wt, errs } = await P.open(b, { uid: 'host1', data, wait: 2600 });
    await page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await page.click('nav button[data-pane="pBeauty"]'); await wt(700);
    await page.click('#btDyGo'); await wt(1500);
    c('DAY HOST：「💆 DAYの体感」の下に申し込み', /DAYの参加申し込み[\s\S]*見本 みどり/.test(await ev(`document.getElementById('btRq').innerText`)));
    await page.click(`#btRq [data-rqo="${rid}"]`); await wt(400);
    await page.click('#rqOk'); await wt(500);
    c('確認済みにすると「確認済みの1件を参加者に入れる」', /確認済みの 1 件を参加者に入れる/.test(await ev(`document.getElementById('btRq').innerText`)));
    await page.click('#btRqAll'); await wt(900);
    const pid = await ev(`window.__FBDATA['ckReq/${rid}'].pid`);
    const p = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckBoard/${K}/p/' + ${JSON.stringify(pid)}]||null)`));
    c('参加者に入る（区分・名前・紹介者・メニュー・希望・ミスト・申し込みとのつながり）', p && p.name === '見本 みどり' && p.ref === '見本 しょうかい' && p.refNo === 'ANT0002' && p.menu === 'ルミスパ' && p.w1 === '見本 えきすぱ' && p.mist === true && p.rid === rid, JSON.stringify(p));
    c('DAYの体感の「未割り振り」に出る', /未割り振り（1）[\s\S]*見本 みどり/.test(await ev(`document.getElementById('btDay').innerText`)));
    await page.selectOption(`#btDay [data-dyst="${pid}"]`, 'ANT0001'); await wt(1200);
    const pre = JSON.parse(await ev(`JSON.stringify((window.__FBDATA['cards/${TS1}'].btp_evD||{})[${JSON.stringify(pid)}]||null)`));
    c('担当の DAYスタッフの会員証に、その人の事前情報（ゴール・状況）', pre && /くすみ/.test(pre.goal) && pre.job === '会社員' && pre.attendBa === '見本 つきそい太郎', JSON.stringify(pre));
    c('担当でない人の会員証には事前情報なし', !(await ev(`!!window.__FBDATA['cards/${TR}'].btp_evD`)));
    await ev(`document.getElementById('btRq').scrollIntoView()`);
    await page.screenshot({ path: OUT + '/ckrq146_host.png' });
    c('エラーなし（DAY HOST）', !errs.length, errs.join(' / '));
    data = JSON.parse(await ev('JSON.stringify(window.__FBDATA)'));
    await ctx.close();
  }
  // ⑤ 担当の会員証で事前情報を見る・紹介者の会員証は「参加者に入りました」
  {
    const o = await P.open(b, { hash: '#c=' + TS1, data, wait: 2600 });
    await o.page.addStyleTag({ content: '#toast{display:none!important}' });
    await o.ev(`(function(){ var d=document.querySelector('#dyArea details.dy-pre'); if(d) d.open=true; })()`);
    const t = await o.ev(`document.getElementById('dyArea').innerText`);
    c('担当の会員証：あなたの担当に「事前情報」（ゴール・付き添い）', /見本 みどり/.test(t) && /事前情報/.test(t) && /肌のくすみ/.test(t) && /見本 つきそい太郎/.test(t), t);
    await o.ev(`document.getElementById('dyArea').scrollIntoView()`);
    await o.page.screenshot({ path: OUT + '/ckrq146_staffpre.png' });
    c('エラーなし（担当の会員証）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#c=' + TS2, data, wait: 2600 });
    c('紹介者の会員証：「参加者に入りました」', /見本 みどり[\s\S]*参加者に入りました/.test(await o2.ev(`document.getElementById('rqArea').innerText`)));
    await o2.ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
