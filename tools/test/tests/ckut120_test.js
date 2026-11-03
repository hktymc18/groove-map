// 受付 v120：ユーザー → 研修生（段階7）。ユーザーの名簿から「研修生にする」（本人の同意を確かめてから）→ 研修生の名簿と会員証ができ、
//   前のユーザーQRでも研修生として受付される。「ユーザーに戻す」でユーザーに戻る（架空データ・練習モード）
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
(async () => {
  const b = await P.browser();
  const { ctx, page, errs, ev, wt } = await P.open(b, { expose: true, data: { 'checkinUnions/ANTARES': { name: 'ANTARES', noPrefix: 'P', unionAdmins: ['j2DPDAccCygHmR9i5K3bTvHnH0V2'] } } });
  await ev('window.__ck.practiceStart()'); await wt(1500);
  await ev(`[].forEach.call(document.querySelectorAll('button'),function(b){ if(/^OK/.test(b.textContent.trim()) && b.offsetParent) b.click(); })`);
  await ev(`document.getElementById('btnGuest').click()`); await wt();
  await ev(`(function(){ document.getElementById('gName').value='見本 はなこ'; var c=document.getElementById('gAsUser'); c.checked=true; c.onchange(); document.getElementById('gRef').value='ジェッ子 ちゃん'; document.getElementById('gGo').click(); })()`); await wt(500);
  const uid = await ev(`(function(){ var r=window.__ck.rec(); return Object.keys(r.att).filter(function(x){ return r.att[x].kind==='user'; })[0]; })()`);
  const tok = await ev(`window.__ck.rec().att[${JSON.stringify(uid)}].cardToken`);
  await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(500);
  await ev(`document.querySelector('#rosterKind button[data-k="user"]').click()`); await wt(500);
  c('ユーザーの名簿に「研修生にする」', !!(await ev(`!!document.querySelector('#rosterBody button[data-ua="tr"]')`)));
  await ev(`document.querySelector('#rosterBody button[data-ua="tr"]').click()`); await wt(300);
  const m0 = JSON.parse(await ev(`JSON.stringify({name:document.getElementById('utName').value, ref:document.getElementById('utRef').value, up:document.getElementById('utUp').value})`));
  c('氏名・紹介者・UPルビー（紹介者 P004 の系列）が初めから入っている', m0.name === '見本 はなこ' && m0.ref === 'ジェッ子 ちゃん' && m0.up === 'ひよこBD', JSON.stringify(m0));
  await page.screenshot({ path: OUT + '/ckut120_modal.png' });
  await ev(`document.getElementById('utGo').click()`); await wt(300);
  c('本人の同意のチェックがないと研修生にしない', /同意/.test(await ev(`document.getElementById('toast').textContent`)) && !!(await ev(`!!document.getElementById('utGo')`)));
  await ev(`(function(){ document.getElementById('utOk').checked=true; document.getElementById('utGo').click(); })()`); await wt(900);
  const d = JSON.parse(await ev(`(function(){ var d=window.__ck.db(); return d.collection('checkinUsers').doc(${JSON.stringify(uid)}).get().then(function(s){ var u=s.data(); return Promise.all([d.collection('checkinMembers').doc(u.toMember||'x').get(), d.collection('cards').doc(${JSON.stringify(tok)}).get()]).then(function(r){ return JSON.stringify({u:u, m:r[0].exists?r[0].data():null, uc:r[1].data()}); }); }); })()`));
  c('研修生の名簿ができる（研修生・紹介者・系列・どのユーザーからか）', d.m && d.m.trainee === true && d.m.no === 'P0006' && d.m.referrer === 'ジェッ子 ちゃん' && d.m.group === 'ひよこBD' && d.m.fromUser === uid && d.m.union === 'ANTARES', JSON.stringify(d.m));
  c('研修生の会員証も発行される', d.m && /^[0-9a-f]{32}$/.test(d.m.cardToken || ''));
  c('ユーザーの名簿に研修生の番号（記録はそのまま）', d.u.toMember === 'P0006' && d.u.visits === 1 && d.u.name === '見本 はなこ');
  c('ユーザーのカードに研修生のカードへの案内', d.uc.toMember === 'P0006' && d.uc.toCard === d.m.cardToken);
  c('研修生のQRを渡す画面', /研修生にしました/.test(await ev(`document.querySelector('.modal').innerText`)) && (await ev(`document.getElementById('utQr').getAttribute('data-qr')`)) === 'https://hktymc18.github.io/groove-map/checkin/index.html#c=' + d.m.cardToken);
  await page.screenshot({ path: OUT + '/ckut120_done.png' });
  await ev(`document.getElementById('utDone').click()`); await wt();
  const row = await ev(`document.getElementById('rosterBody').innerText`);
  c('名簿の行に「研修生 P0006」と「ユーザーに戻す」', /研修生 P0006/.test(row) && /ユーザーに戻す/.test(row) && !/研修生にする/.test(row), row);
  // 前のユーザーQRで受付 → 研修生として
  await ev(`(function(){ var r=window.__ck.rec(); delete r.att[${JSON.stringify(uid)}]; return window.__ck.db().collection('checkinEvents').doc(r.ev.id).collection('attendance').doc(${JSON.stringify(uid)}).delete(); })()`); await wt(300);
  await ev(`document.querySelector('nav button[data-pane="pKiosk"]').click()`); await wt(300);
  await ev(`window.__ck.scan(${JSON.stringify('u:' + uid + ':' + tok.slice(0, 6))}, 'scan')`); await wt(600);
  const a = JSON.parse(await ev(`(function(){ var r=window.__ck.rec(); return JSON.stringify({m:r.att.P0006||null, u:r.att[${JSON.stringify(uid)}]||null, st:document.getElementById('stageBody').innerText}); })()`));
  c('前のユーザーQRでも研修生として受付される（ユーザーとしては入らない）', a.m && a.m.union === 'ANTARES' && !a.u && /研修生/.test(a.st), JSON.stringify(a).slice(0, 300));
  // ユーザーに戻す
  await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(400);
  await ev(`document.querySelector('#rosterKind button[data-k="user"]').click()`); await wt(400);
  await ev(`document.querySelector('#rosterBody button[data-ua="back"]').click()`); await wt(500);
  const d2 = JSON.parse(await ev(`(function(){ var d=window.__ck.db(); return Promise.all([d.collection('checkinUsers').doc(${JSON.stringify(uid)}).get(), d.collection('cards').doc(${JSON.stringify(tok)}).get(), d.collection('checkinMembers').doc('P0006').get()]).then(function(r){ return JSON.stringify({u:r[0].data(), uc:r[1].data(), m:r[2].exists}); }); })()`));
  c('ユーザーに戻すと、ユーザーの名簿・カードから研修生の印が消える（研修生の名簿は残る）', !d2.u.toMember && !d2.uc.toMember && !d2.uc.toCard && d2.u.backAt > 0 && d2.m === true, JSON.stringify(d2));
  c('戻したあとは「研修生にする」がまた出る', !!(await ev(`!!document.querySelector('#rosterBody button[data-ua="tr"]')`)));
  c('ページのエラーなし', !errs.length, errs.join(' / '));
  await ctx.close();
  // 本人のカード: 研修生になった人には案内
  {
    const t = '0123456789abcdef0123456789abcdef';
    const o = await P.open(b, { hash: '#c=' + t, data: { ['cards/' + t]: { kind: 'user', no: 'u1', name: '見本 はなこ', union: 'ANTARES', active: true, toMember: 'P0006', toCard: 'feedfeedfeedfeedfeedfeedfeedfeed' } } });
    const tx = await o.ev(`document.getElementById('pzArea').innerText`);
    const href = await o.ev(`(document.querySelector('.utnote a')||{}).getAttribute ? document.querySelector('.utnote a').getAttribute('href') : ''`);
    c('本人のカード: 研修生になった案内と、研修生のカードを開くボタン', /研修生になりました/.test(tx) && /#c=feedfeed/.test(href), tx + ' ' + href);
    await o.page.screenshot({ path: OUT + '/ckut120_card.png', fullPage: true });
    c('エラーなし（カード）', !o.errs.length, o.errs.join('/'));
    await o.ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
