// 受付 v180：相談の守りの土台（架空データ）
//   お客さん：REVE の会員証を開くと、この端末にひもづく（匿名ログイン）。別の端末にひもづいている時はマイページに案内。ほかのユニオンは何もしない
//   スタッフ：「💜 Beauty」タブの「💬 相談を受けるスタッフ」（足す・分野・ひとこと・受付を休む・外す）と「📱 端末の付け替え」
const path = require('path'), fs = require('fs');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const TA = '0123456789abcdef0123456789abcdef', UA = 'u17620000000001';
const card = (x) => Object.assign({ kind: 'user', no: UA, name: '見本 はなこ', union: 'REVE', active: true, visits: 2 }, x || {});
const base = (x) => Object.assign({ ['cards/' + TA]: card(), ['cardClaims/' + UA]: { t: TA } }, x || {});
(async () => {
  const b = await P.browser();
  // ① 最初の端末がひもづく
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base(), wait: 2800, init: 'window.__FBANON = "dev-1";' });
    const bd = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['ckBind/${TA}'] || null)`));
    c('REVE の会員証を開くと、この端末にひもづく', bd && bd.uids.length === 1 && bd.uids[0] === 'dev-1' && bd.by === 'self', JSON.stringify(bd));
    c('ひもづいた時は、マイページに何も出さない', (await o.ev(`document.getElementById('dvArea').innerText.trim()`)) === '');
    c('エラーなし（ひもづけ）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ② 別の端末にひもづいている
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base({ ['ckBind/' + TA]: { uids: ['dev-1'], by: 'self', at: 1 } }), wait: 2800, init: 'window.__FBANON = "dev-2";', evalHook: true });
    c('別の端末では上書きしない', (await o.ev(`window.__FBDATA['ckBind/${TA}'].uids.join()`)) === 'dev-1');
    c('相談の画面を出すまでは、案内も出さない', (await o.ev(`document.getElementById('dvArea').innerText.trim()`)) === '');
    await o.ev(`window.__ckCsUi = true; window.__ckEval("ckBindStart(gUa.c, gUa.token);")`); await o.wt(300);
    await o.page.click('#uaTabs [data-tab="me"]'); await o.wt(300);
    c('マイページに「別のスマホで使われています」と付け替えの案内', /別のスマホで使われています/.test(await o.ev(`document.getElementById('dvArea').innerText`)) && /端末の付け替え/.test(await o.ev(`document.getElementById('dvArea').innerText`)));
    await o.ev(`document.getElementById('dvArea').scrollIntoView({block:'center'})`);
    await o.page.screenshot({ path: OUT + '/ckcs180_other.png' });
    await o.ctx.close();
  }
  // ③ 付け替えのあと（空）は、新しい端末がひもづく・ほかのユニオンは何もしない
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base({ ['ckBind/' + TA]: { uids: [], by: 'host1', at: 1 } }), wait: 2800, init: 'window.__FBANON = "dev-3";' });
    c('付け替えのあとは、新しい端末がひもづく', (await o.ev(`window.__FBDATA['ckBind/${TA}'].uids.join()`)) === 'dev-3');
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#c=' + TA, data: base({ ['cards/' + TA]: card({ union: 'ANTARES' }) }), wait: 2600 });
    c('ほかのユニオン（まだ試さない）は、ひもづけをしない', !(await o2.ev(`!!window.__FBDATA['ckBind/${TA}']`)));
    await o2.ctx.close();
  }
  // ④ スタッフ：相談を受けるスタッフ・端末の付け替え
  {
    const user = (name, un) => ({ name, union: un || 'REVE', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
    const data = { 'checkinUnions/REVE': { name: 'REVE', unionAdmins: ['ua1'], dayStaff: ['day1'] }, 'checkinConfig/beauty': { testers: ['day1'] },
      'users/day1': user('見本 でい'), 'users/mem1': user('見本 りな'), 'users/mem2': user('見本 まい'), 'users/memx': user('見本 ほか', 'ANTARES'),
      'checkinUsers/u1': { uid: 'u1', name: '見本 はなこ', union: 'REVE', cardToken: TA, active: true },
      ['ckBind/' + TA]: { uids: ['dev-1'], by: 'self', at: 1 } };
    const o = await P.open(b, { uid: 'day1', data, wait: 2600 });
    await o.page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await o.page.click('nav button[data-pane="pBeauty"]'); await o.wt(700);
    c('「💬 相談を受けるスタッフ」が出る（REVE・DAY HOST）', /相談を受けるスタッフ/.test(await o.ev(`document.getElementById('btCs').innerText`)) && /まだいません/.test(await o.ev(`document.getElementById('btCs').innerText`)));
    await o.ev(`document.getElementById('btCsAdd').click()`); await o.wt(400);
    const names = await o.ev(`[].map.call(document.querySelectorAll('#csWho label'), function(l){ return l.textContent.trim(); }).join(',')`);
    c('足せるのは同じユニオンのアカウントだけ', /見本 りな/.test(names) && /見本 まい/.test(names) && !/見本 ほか/.test(names), names);
    await o.ev(`[].filter.call(document.querySelectorAll('#csWho label'), function(l){ return /りな/.test(l.textContent); })[0].querySelector('input').click()`);
    await o.ev(`document.querySelector('#csTags [data-v="skin"]').click(); document.querySelector('#csTags [data-v="bust"]').click();`);
    await o.page.fill('#csBio', 'これで肌が改善します'); await o.ev(`document.getElementById('csGo').click()`); await o.wt(200);
    c('ひとことに効果をうたう言葉は使えない', !(await o.ev(`!!window.__FBDATA['ckCs/REVE/s/mem1']`)));
    await o.page.fill('#csBio', '乾燥肌のケアならおまかせください'); await o.ev(`document.getElementById('csGo').click()`); await o.wt(400);
    const s1 = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['ckCs/REVE/s/mem1'] || null)`));
    c('足す：名前・分野・ひとこと・受付中', s1 && s1.name === '見本 りな' && s1.tags.join() === 'skin,bust' && s1.bio === '乾燥肌のケアならおまかせください' && s1.off === false && s1.by === 'day1', JSON.stringify(s1));
    // 自分も足して「受付を休む」
    await o.ev(`document.getElementById('btCsAdd').click()`); await o.wt(400);
    await o.ev(`[].filter.call(document.querySelectorAll('#csWho label'), function(l){ return /でい/.test(l.textContent); })[0].querySelector('input').click()`);
    await o.ev(`document.querySelector('#csTags [data-v="inner"]').click()`); await o.ev(`document.getElementById('csGo').click()`); await o.wt(400);
    c('自分の行に「受付を休む」', (await o.ev(`document.querySelectorAll('#btCs [data-csoff]').length`)) === 1);
    await o.ev(`document.querySelector('#btCs [data-csoff]').click()`); await o.wt(300);
    c('受付を休む（自分）', (await o.ev(`window.__FBDATA['ckCs/REVE/s/day1'].off`)) === true && /受付を休んでいます/.test(await o.ev(`document.getElementById('btCs').innerText`)));
    await o.ev(`document.getElementById('btCs').scrollIntoView()`); await o.page.screenshot({ path: OUT + '/ckcs180_staff.png' });
    // 端末の付け替え
    c('「📱 端末の付け替え」が出る', /端末の付け替え/.test(await o.ev(`document.getElementById('btDv').innerText`)));
    await o.page.fill('#btDvQ', 'はなこ'); await o.ev(`document.getElementById('btDvGo').click()`); await o.wt(400);
    await o.ev(`document.querySelector('#btDvList [data-dv]').click()`); await o.wt(400);
    const bd = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['ckBind/${TA}'])`));
    c('付け替える：ひもづけを空にする（外した人を残す）', bd.uids.length === 0 && bd.by === 'day1', JSON.stringify(bd));
    await o.ev(`document.getElementById('btDv').scrollIntoView()`); await o.page.screenshot({ path: OUT + '/ckcs180_dev.png' });
    c('エラーなし（スタッフ）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ⑤ ほかのユニオンのスタッフには出ない
  {
    const user = (name, un) => ({ name, union: un, unionSelectedV2: true, status: 'active', email: 'x@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
    const o = await P.open(b, { uid: 'day2', data: { 'checkinUnions/ANTARES': { name: 'ANTARES', dayStaff: ['day2'] }, 'checkinConfig/beauty': { testers: ['day2'] }, 'users/day2': user('見本 に', 'ANTARES') }, wait: 2600 });
    await o.page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await o.page.click('nav button[data-pane="pBeauty"]'); await o.wt(600);
    c('ANTARES のスタッフには、相談の欄は出ない', (await o.ev(`document.getElementById('btCs').innerText.trim()`)) === '' && (await o.ev(`document.getElementById('btDv').innerText.trim()`)) === '');
    await o.ctx.close();
  }
  await b.close();
  const H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
  c('APP_VER v180 以上', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 180);
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
