// 受付 v147：「📈 体感のその後」。最近90日の DAY の参加者 × 購入の道（ckFollow・NAVIGATOR から）× ビジネスの道（受付の記録から自動）。
//   見られるのはオーナー・ユニオン管理者と、「DAY HOST にも見せる」をオンにしたユニオンの DAY HOST。架空データ
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const K = 'k1k1k1k1k1k1k1k1k1k1', D = day(-10);
const user = (name, x) => Object.assign({ name, union: 'ANTARES', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } }, x || {});
const P_ = (id, x) => ({ ['ckBoard/' + K + '/p/' + id]: Object.assign({ kind: 'na1', st: 'done', ref: '見本 しょうかい', staffNo: 'ANT0001', staffName: '見本 えきすぱ', ord: 1, menu: 'ルミスパ' }, x) });
const data = (x) => Object.assign({
  'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['ua1'], dayStaff: ['host1'] },
  'checkinConfig/beauty': { testers: ['ua1', 'host1'] },
  'users/ua1': user('見本 かんり'), 'users/host1': user('見本 ほすと'),
  'checkinEvents/evP': { date: D, month: D.slice(0, 7), name: '11月のDAY', unions: ['ANTARES'], hostUnion: 'ANTARES', uDay: true },
  'checkinEvents/evP/btDay/ANTARES': { union: 'ANTARES', key: K, staff: [{ no: 'ANT0001', name: '見本 えきすぱ' }], recv: [], recvNos: [] },
  ['ckBoard/' + K]: { eid: 'evP', union: 'ANTARES', staff: [] },
  'ckFollow/u1': { union: 'ANTARES', refNo: 'ANT0002', name: '見本 はなこ', shop: day(-8), buy1: day(-5), nBuy: 1, amt: 4500, adp: true, by: 'x', at: 1 },
  'checkinUsers/u1': { uid: 'u1', name: '見本 はなこ', union: 'ANTARES', active: true },
  'checkinUsers/u2': { uid: 'u2', name: '見本 さくら', union: 'ANTARES', active: true, toMember: 'ANT0005' },
  'checkinUsers/u3': { uid: 'u3', name: '見本 ゆり', union: 'ANTARES', active: true },
  'checkinMembers/ANT0005': { no: 'ANT0005', name: '見本 さくら', union: 'ANTARES', active: true, trainee: true, trainings: { t1: { d: day(-3) } } },
  'checkinMembers/ANT0003': { no: 'ANT0003', name: '見本 けんしゅう', union: 'ANTARES', active: true, trainee: false, promotedAt: 1 } },
  P_('p1', { name: '見本 はなこ', ckNo: 'u1' }), P_('p2', { name: '見本 さくら', ckNo: 'u2', menu: 'ウェルスパ' }), P_('p3', { kind: 'na0', name: '見本 ゆり', ckNo: 'u3', menu: '', staffNo: '' }),
  P_('p4', { name: '見本 つながってない', ckNo: '' }), P_('p5', { kind: 'tr1', name: '見本 けんしゅう', memNo: 'ANT0003', menu: 'カウンセリング', staffNo: '', staffName: '' }), x || {});
(async () => {
  const b = await P.browser();
  // ① ユニオン管理者
  for (const dark of [false, true]) {
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, uid: 'ua1', data: data(), wait: 2600 });
    await page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await page.click('nav button[data-pane="pBeauty"]'); await wt(700);
    c('ユニオン管理者：「📈 体感のその後」が出る' + (dark ? '（ダーク）' : ''), (await ev(`!document.getElementById('btFu').classList.contains('hide')`)) && /体感のその後/.test(await ev(`document.getElementById('btFu').innerText`)));
    await page.click('#btFuGo'); await wt(1500);
    const t = await ev(`document.getElementById('btFu').innerText`);
    c('DAY 1回・参加5人（NA 4人）', /DAY 1回・参加 5人（NA 4人）/.test(t), t.slice(0, 200));
    const flow = await ev(`[].map.call(document.querySelectorAll('#btFu .fu-flow'), function(f){ return [].map.call(f.querySelectorAll('.fu-st'), function(s){ return s.querySelector('small').textContent + ':' + s.querySelector('b').textContent; }).join(','); }).join(' / ')`);
    c('購入の道：参加4・体感3・会員登録1・初めて購入1・ADP1／ビジネスの道：研修生1・研修に通った1・ビジネススタート0', flow === '参加:4,体感した:3,会員登録:1,初めて購入:1,ADP（定期）:1 / 研修生になった:1,研修に通った:1,ビジネススタート:0', flow);
    c('DAY から初めての購入まで平均5日', /平均 5日（1人）/.test(t), t);
    c('その後の記録がまだ2人（紹介者ごと）・アプリとつながっていない1人', /その後の記録がまだ 2人/.test(t) && /見本 しょうかい 2人/.test(t) && /つながっていない NA が 1人/.test(t), t);
    const row = async (k) => ev(`(function(){ var r=[].filter.call(document.querySelectorAll('#btFu .fu-tb tbody tr'), function(x){ return x.querySelector('th').textContent === ${JSON.stringify(k)}; })[0]; return r ? [].map.call(r.querySelectorAll('td'), function(td){ return td.firstChild.textContent; }).join(',') : ''; })()`);
    c('体感メニュー別：ルミスパ（参加2・体感2・会員登録1・初回購入1・ADP1）', (await row('ルミスパ')) === '2,2,1,1,1,0,0', await row('ルミスパ'));
    c('体感メニュー別：ウェルスパ（研修生1）・カウンセリング（研修生の体感・ビジネス1）', (await row('ウェルスパ')) === '1,1,0,0,0,1,0' && (await row('カウンセリング')) === '1,1,0,0,0,1,1', (await row('ウェルスパ')) + ' / ' + (await row('カウンセリング')));
    await page.click('#btFuCut [data-cut="staff"]'); await wt(200);
    c('切り口を担当別に', (await row('見本 えきすぱ')) !== '' && (await row('（未割り振り）')) !== '');
    await ev(`document.getElementById('btFu').scrollIntoView()`);
    await page.screenshot({ path: OUT + '/ckfu147' + (dark ? '_d' : '') + '.png', fullPage: !dark });
    if (!dark) {
      await page.click('#btFuHost'); await wt(500);
      c('「DAY HOST にも見せる」で checkinUnions.hostFollow', (await ev(`window.__FBDATA['checkinUnions/ANTARES'].hostFollow`)) === true);
    }
    c('横にはみ出さない', (await ev('document.documentElement.scrollWidth')) === 390);
    c('エラーなし（ユニオン管理者）' + (dark ? '（ダーク）' : ''), !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ② DAY HOST：許可がない時は出ない・ある時は出る（切り替えはできない）
  for (const on of [false, true]) {
    const o = await P.open(b, { uid: 'host1', data: data(on ? { 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['ua1'], dayStaff: ['host1'], hostFollow: true } } : {}), wait: 2600 });
    await o.page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await o.page.click('nav button[data-pane="pBeauty"]'); await o.wt(700);
    const vis = await o.ev(`!document.getElementById('btFu').classList.contains('hide')`);
    c(on ? 'DAY HOST：許可があると出る（切り替えのチェックは出ない）' : 'DAY HOST：許可がないと出ない', on ? vis && !(await o.ev(`!!document.getElementById('btFuHost')`)) : !vis);
    c('エラーなし（DAY HOST）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
