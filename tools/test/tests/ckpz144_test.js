// 受付 v144：PRYSMiO は本人がアプリで入れる（受付した日のうちだけ）・スタッフは「💜 Beauty」タブの「📏 今日の測定」で代わりに入れる。架空データ
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const TA = '0123456789abcdef0123456789abcdef', TB = 'abababababababababababababababab', TC = 'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd', UA = 'u17620000000001', T = day(0);
const lvToday = { d: T, ev: '11月のDAY', id: 'evT', until: Date.now() + 3 * 3600e3 };
const card = (x) => Object.assign({ kind: 'user', no: UA, name: '見本 はなこ', union: 'ANTARES', active: true, visits: 2 }, x || {});
const user = (name) => ({ name, union: 'ANTARES', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
(async () => {
  const b = await P.browser();
  // ① 本人：受付した日はアプリから入れられる
  for (const dark of [false, true]) {
    const data = { ['cards/' + TA]: card({ lastVisit: lvToday, pz_old: { v: 760, d: day(-30), ev: '10月のDAY', at: 1 } }), ['cardClaims/' + UA]: { t: TA } };
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, hash: '#c=' + TA, data, wait: 2600 });
    await page.addStyleTag({ content: '#toast{display:none!important}' });
    c('ホームに「📏 今日の結果を入れる」（受付した日）' + (dark ? '（ダーク）' : ''), /今日の結果を入れる/.test(await ev(`document.getElementById('uaHomePz').innerText`)));
    await page.click('#uaTabs [data-tab="me"]'); await wt(300);
    c('マイページの PRYSMiO に「📏 今日の測定の結果を入れる」', /今日の測定の結果を入れる/.test(await ev(`document.getElementById('pzArea').innerText`)));
    await page.click('#pzArea [data-pzself]'); await wt(300);
    c('入れる画面：前回の値・今日のうちだけ', /前回 760/.test(await ev(`document.querySelector('.modal').innerText`)) && /今日（/.test(await ev(`document.querySelector('.modal').innerText`)));
    if (dark) { await page.screenshot({ path: OUT + '/ckpz144_self_d.png' }); await ctx.close(); continue; }
    await page.fill('#pzsV', 'abc'); await page.click('#pzsGo'); await wt(200);
    c('数字でないと保存しない', !(await ev(`!!(window.__FBDATA['cards/${TA}']||{}).pz_evT`)));
    await page.fill('#pzsV', '5000'); await page.click('#pzsGo'); await wt(200);
    c('3000 より大きいと保存しない', !(await ev(`!!(window.__FBDATA['cards/${TA}']||{}).pz_evT`)));
    await page.fill('#pzsV', '８２０'); await wt(100);
    c('入れると色・前回からの差・次の色まで', /パープル/.test(await ev(`document.getElementById('pzsChip').innerText`)) && /前回 760 から \+60/.test(await ev(`document.getElementById('pzsSub').textContent`)));
    await page.screenshot({ path: OUT + '/ckpz144_self.png' });
    await page.click('#pzsGo'); await wt(500);
    const pz = JSON.parse(await ev(`JSON.stringify((window.__FBDATA['cards/${TA}']||{}).pz_evT||null)`));
    c('保存するとカードの pz_{イベント}（本人・日付）', pz && pz.v === 820 && pz.by === 'self' && pz.d === T && pz.ev === '11月のDAY', JSON.stringify(pz));
    const t = await ev(`document.getElementById('pzArea').innerText`);
    c('マイページにすぐ色が出て、ボタンは「今日の結果を直す」', /820/.test(t) && /前回 760 から/.test(t) && /今日の結果を直す/.test(t), t);
    c('端末の覚え（カード）にも入る', /"pz_evT"/.test(await ev(`localStorage.getItem('bci_card_${TA}')`)));
    await page.click('#uaTabs [data-tab="home"]'); await wt(300);
    c('ホームは入れたあと「今日の結果を入れる」が消えて、PRYSMiO の最新が出る', !/今日の結果を入れる/.test(await ev(`document.getElementById('uaHomePz').innerText`)) && /820/.test(await ev(`document.getElementById('uaHomePz').innerText`)));
    c('エラーなし（本人）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ② 入れられない時
  for (const [lv, why] of [[{ d: day(-1), ev: 'きのうのDAY', id: 'evY', until: Date.now() - 1000 }, '受付した次の日'], [{ d: T, ev: '11月のDAY' }, '前の版で受付（イベントIDなし）'], [null, '来場なし']]) {
    const o = await P.open(b, { hash: '#c=' + TA, data: { ['cards/' + TA]: card(lv ? { lastVisit: lv } : {}), ['cardClaims/' + UA]: { t: TA } }, wait: 2400 });
    c(why + '：入れるボタンは出ない', !(await o.ev(`!!document.querySelector('[data-pzself]')`)));
    await o.ctx.close();
  }
  // ③ DAYスタッフ：「📏 今日の測定」
  {
    const data = {
      'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['ua1'], dayStaff: ['day1'] }, 'checkinConfig/beauty': { testers: ['day1'] }, 'users/day1': user('見本 でい'),
      'checkinEvents/evT': { date: T, month: T.slice(0, 7), name: '11月のDAY', hostUnion: 'ANTARES', unions: ['ANTARES'] },
      'checkinEvents/evR': { date: T, month: T.slice(0, 7), name: 'REVEのDAY', hostUnion: 'REVE', unions: ['REVE'] },
      'checkinEvents/evT/attendance/u1': { no: 'u1', name: '見本 はなこ', kind: 'user', union: '', uUnion: 'ANTARES', cardToken: TA },
      'checkinEvents/evT/attendance/u2': { no: 'u2', name: '見本 さくら', kind: 'user', union: '', uUnion: 'ANTARES', cardToken: TB },
      'checkinEvents/evT/attendance/m1': { no: 'ANT0001', name: '架空 太郎', union: 'ANTARES' },
      'checkinEvents/evR/attendance/u3': { no: 'u3', name: '別のユニオン', kind: 'user', union: '', uUnion: 'REVE', cardToken: TC },
      ['cards/' + TA]: card({ lastVisit: lvToday, pz_evT: { v: 820, d: T, ev: '11月のDAY', at: 5, by: 'self' } }),
      ['cards/' + TB]: card({ no: 'u2', name: '見本 さくら', lastVisit: lvToday }),
      ['cards/' + TC]: card({ no: 'u3', name: '別のユニオン', union: 'REVE' }) };
    for (const dark of [false, true]) {
      const { ctx, page, ev, wt, errs } = await P.open(b, { dark, uid: 'day1', data, wait: 2600 });
      await page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
      await page.click('nav button[data-pane="pBeauty"]'); await wt(700);
      c('「📏 今日の測定」は押すまで読まない' + (dark ? '（ダーク）' : ''), /今日の来場者を出す/.test(await ev(`document.getElementById('btPz').innerText`)));
      await page.click('#btPzGo'); await wt(800);
      const t = await ev(`document.getElementById('btPz').innerText`);
      c('今日受付したユーザーだけ（ビジネス・ほかのユニオンは出ない）・本人が入れた数字は「本人が入力」', /見本 さくら/.test(t) && /見本 はなこ/.test(t) && /本人が入力/.test(t) && /まだ/.test(t) && !/架空 太郎/.test(t) && !/別のユニオン/.test(t), t);
      await ev(`document.getElementById('btPz').scrollIntoView()`);
      await page.screenshot({ path: OUT + '/ckpz144_staff' + (dark ? '_d' : '') + '.png' });
      if (!dark) {
        const i = await ev(`[].findIndex.call(document.querySelectorAll('#btPz .pz-row'), function(r){ return /見本 さくら/.test(r.innerText); })`);
        await page.fill(`#btPz [data-pzv="${i}"]`, '640'); await page.click(`#btPz [data-pzs="${i}"]`); await wt(500);
        const pz = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['cards/${TB}'].pz_evT||null)`));
        c('スタッフが入れるとカードの pz_{イベント}（入れた人）', pz && pz.v === 640 && pz.by === 'day1' && pz.d === T, JSON.stringify(pz));
        c('名簿の色（ユーザーの名簿）にも', (await ev(`(window.__FBDATA['checkinUsers/u2']||{}).prysm`)) === 640);
        c('一覧が「スタッフが入力」に', /見本 さくら[\s\S]*スタッフが入力/.test(await ev(`document.getElementById('btPz').innerText`)));
      }
      c('エラーなし（スタッフ）' + (dark ? '（ダーク）' : ''), !errs.length, errs.join(' / '));
      await ctx.close();
    }
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
