// 受付 v140：「💜 Beauty」タブのクエストの編集（ckQuest/{ユニオン}）と、ユーザーのアプリへの反映。架空データ
//   文を直す・並べかえ・しまう・足す・効果をうたう言葉は保存できない・はじめの内容にもどす
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const user = (name) => ({ name, union: 'ANTARES', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
const staffData = (x) => Object.assign({
  'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['ua1'], dayStaff: ['day1'] },
  'checkinConfig/beauty': { testers: ['day1'] }, 'users/day1': user('見本 でい') }, x || {});
const TA = '0123456789abcdef0123456789abcdef', UA = 'u17620000000001';
(async () => {
  const b = await P.browser();
  // ① DAYスタッフがクエストを直す
  for (const dark of [false, true]) {
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, uid: 'day1', data: staffData(), wait: 2600 });
    await page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await page.click('nav button[data-pane="pBeauty"]'); await wt(700);
    const rows = () => ev(`[].map.call(document.querySelectorAll('#btQeList .qe-row'), function(r){ return r.querySelector('input').value + (r.classList.contains('off') ? '(off)' : ''); }).join('|')`);
    c('クエストの編集：はじめはアプリに組み込みの5つ（ダイエット）' + (dark ? '（ダーク）' : ''), (await rows()) === '朝、コップ1杯の水を飲む|15分歩く|夜ごはんは寝る3時間前までに|5分ストレッチ|いつものボディケアをした', await rows());
    c('「はじめの内容にもどす」は、直していない時は出ない', !(await ev(`!!document.getElementById('btQeReset')`)) && (await ev(`document.getElementById('btQeSave').disabled`)));
    if (dark) { await ev(`document.getElementById('btQe').scrollIntoView()`); await page.screenshot({ path: OUT + '/ckqe140_staff_d.png' }); await ctx.close(); continue; }
    await page.fill('[data-qt="0"]', '朝、白湯を1杯飲む');
    await page.click('[data-qup="2"]'); await wt(100);          // 夜ごはんを2番目へ
    await page.click('[data-qoff="3"]'); await wt(100);         // 5分ストレッチをしまう
    await page.click('#btQeAdd'); await wt(100);
    await page.fill('[data-qt="5"]', 'これで便秘が改善');
    c('効果をうたう言葉はその場で目立たせる', (await ev(`document.querySelector('.qe-row[data-i="5"]').classList.contains('warn')`)) && /改善/.test(await ev(`document.querySelector('.qe-row[data-i="5"] .qe-w').textContent`)));
    await page.click('#btQeSave'); await wt(300);
    c('効果をうたう言葉があると保存できない', !(await ev(`!!window.__FBDATA['ckQuest/ANTARES']`)) && /効果をうたう言葉（改善）/.test(await ev(`document.getElementById('toast').textContent`)));
    await page.fill('[data-qt="5"]', '');
    await page.click('#btQeSave'); await wt(300);
    c('空のクエストは保存できない', !(await ev(`!!window.__FBDATA['ckQuest/ANTARES']`)) && /空です/.test(await ev(`document.getElementById('toast').textContent`)));
    await page.fill('[data-qt="5"]', '階段を使った');
    c('並べかえ・しまう・足すが一覧に出る', (await rows()) === '朝、白湯を1杯飲む|夜ごはんは寝る3時間前までに|15分歩く|5分ストレッチ(off)|いつものボディケアをした|階段を使った', await rows());
    await page.click('#btQeSeg [data-qco="yuragi"]'); await wt(150);
    await page.fill('[data-qt="1"]', '夜のスキンケア（クレンジングから）');
    await page.click('#btQeSeg [data-qco="diet"]'); await wt(150);
    c('コースを切りかえても、直した内容は消えない', /朝、白湯を1杯飲む/.test(await rows()));
    // ラウンジの操作（画面の描き直し）でも消えない
    await ev(`document.getElementById('btReload').click()`); await wt(700);
    c('「読み直す」でも、保存前の直した内容は消えない', /朝、白湯を1杯飲む/.test(await rows()) && !(await ev(`document.getElementById('btQeSave').disabled`)));
    await page.screenshot({ path: OUT + '/ckqe140_staff.png', fullPage: true });
    await page.click('#btQeSave'); await wt(500);
    const q = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckQuest/ANTARES']||null)`));
    const dk = q && q.co.diet.map(x => x.k + ':' + x.t + (x.off ? ':off' : '')).join('|');
    c('保存すると ckQuest に入る（キーはそのまま・しまった印・新しいキー・送った人）', q && q.by === 'day1' && /^water:朝、白湯を1杯飲む\|dinner:夜ごはんは寝る3時間前までに\|walk:15分歩く\|stretch:5分ストレッチ:off\|care:いつものボディケアをした\|q[a-z0-9]{4,6}:階段を使った$/.test(dk), dk);
    c('ほかのコースも保存（ゆらぎ肌の直した文・体内ははじめの内容）', q && q.co.yuragi[1].k === 'pm' && q.co.yuragi[1].t === '夜のスキンケア（クレンジングから）' && q.co.inner.length === 5 && q.co.inner[0].k === 'supp');
    c('この端末のアプリ用の覚えもすぐ新しくなる', /白湯/.test(await ev(`localStorage.getItem('bci_qst_ANTARES')`)));
    c('保存のあと「はじめの内容にもどす」が出る', !!(await ev(`!!document.getElementById('btQeReset')`)));
    await page.click('#btQeReset'); await wt(500);
    c('「はじめの内容にもどす」で消える（組み込みのクエストに戻る）', !(await ev(`!!window.__FBDATA['ckQuest/ANTARES']`)) && /^朝、コップ1杯の水を飲む\|15分歩く/.test(await rows()));
    c('エラーなし（スタッフ）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ② ユーザーのアプリ：直したクエストが出る（しまったものは出ない・選んでいた人の毎日のクエストからも消える）
  {
    const co = { diet: [{ k: 'water', t: '朝、白湯を1杯飲む' }, { k: 'dinner', t: '夜ごはんは寝る3時間前までに' }, { k: 'walk', t: '15分歩く' }, { k: 'stretch', t: '5分ストレッチ', off: true }, { k: 'qabcd1', t: '階段を使った' }] };
    const data = { ['cards/' + TA]: { kind: 'user', no: UA, name: '見本 はなこ', union: 'ANTARES', active: true, visits: 1 }, ['cardClaims/' + UA]: { t: TA },
      ['cards/' + TA + '/plan/me']: { course: 'diet', qs: ['water', 'stretch', 'walk'], start: day(-3), days: { [day(-1)]: ['water', 'stretch'] }, atMs: 1 },
      'ckQuest/ANTARES': { co } };
    const { ctx, page, ev, wt, errs } = await P.open(b, { hash: '#c=' + TA, data, wait: 2600 });
    await page.addStyleTag({ content: '#toast{display:none!important}' });
    const home = await ev(`document.getElementById('uaHomeQ').innerText`);
    c('ホームの今日のクエスト：直した文・しまったものは出ない', /朝、白湯を1杯飲む/.test(home) && /15分歩く/.test(home) && !/ストレッチ/.test(home) && /0\/2/.test(home), home);
    await page.click('#uaTabs [data-tab="plan"]'); await wt(300);
    const pl = await ev(`document.getElementById('mpArea').innerText`);
    c('プラン：同じ（記録の連続日数はそのまま）', /朝、白湯を1杯飲む/.test(pl) && !/ストレッチ/.test(pl) && /0\/2/.test(pl), pl);
    await ev(`document.getElementById('mypEdit').click()`); await wt(400);
    const m = await ev(`[].map.call(document.querySelectorAll('#mypQs label'), function(l){ return l.textContent; }).join('|')`);
    c('プランを変える：直した順で、しまったものは選べない・足したクエストを選べる', m === '朝、白湯を1杯飲む|夜ごはんは寝る3時間前までに|15分歩く|階段を使った', m);
    await page.screenshot({ path: OUT + '/ckqe140_card.png' });
    c('アプリは30分覚える（ckQuest を端末に保存）', /白湯/.test(await ev(`localStorage.getItem('bci_qst_ANTARES')`)));
    c('エラーなし（アプリ）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
