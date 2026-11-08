// 受付 v131：ユーザーのカードの「ラウンジ」（NAVIGATOR Beauty・準備中）。同じユニオンのひとこと（60文字・文字だけ）。
//   スタッフが「出す」を押した投稿だけが出る。👏 は1人1回。本人は取り消せる（架空データ）
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
(async () => {
  const b = await P.browser();
  const tok = '0123456789abcdef0123456789abcdef', uid = 'u17620000000001';
  const card = (x) => Object.assign({ kind: 'user', no: uid, name: '見本 はなこ', union: 'ANTARES', referrer: '架空 太郎', active: true, visits: 3 }, x);
  const posts = {
    'ckLounge/p1': { union: 'ANTARES', uid: 'u2', n: '架空 さくら', co: 'ダイエット編', t: '今週は毎日15分歩けました。', st: 'ok', okAt: 2000 },
    'ckLounge/p2': { union: 'ANTARES', uid: 'u3', n: '見本 ゆり', co: '', t: '夜のスキンケア、3日続きました！', st: 'ok', okAt: 3000 },
    'ckLounge/p1/clap/u9': { at: 1 },
    'ckLounge/p3': { union: 'ANTARES', uid: 'u4', n: '見本 まだ', t: 'まだ確認されていない投稿', st: 'wait', at: 1 },
    'ckLounge/p4': { union: 'REVE', uid: 'u5', n: '別のユニオン', t: 'ほかのユニオンの投稿', st: 'ok', okAt: 4000 } };
  // ① ユーザーのカード：出ている投稿・👏・投稿する・取り消す
  for (const dark of [false, true]) {
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, hash: '#c=' + tok, data: Object.assign({ ['cards/' + tok]: card(), ['cardClaims/' + uid]: { t: tok }, ['cards/' + tok + '/plan/me']: { course: 'yuragi', qs: ['am'], days: {}, atMs: 1 } }, posts) });
    const t = await ev(`document.getElementById('lgArea').innerText`);
    c('LOUNGE：出ている投稿が新しい順（確認待ち・ほかのユニオンは出ない）' + (dark ? '（ダーク）' : ''), /LOUNGE/.test(t) && /見本 ゆり さん[\s\S]*夜のスキンケア[\s\S]*架空 さくら さん ・ ダイエット編[\s\S]*毎日15分/.test(t) && !/まだ確認されていない/.test(t) && !/ほかのユニオン/.test(t), t);
    c('👏 の数', /👏 1/.test(t) && /👏 0/.test(t), t);
    c('友だちを招待の下', (await ev(`document.getElementById('fiArea').compareDocumentPosition(document.getElementById('lgArea')) & 4`)) === 4);
    if (!dark) {
      await ev(`document.querySelector('[data-clap="p2"]').click()`); await wt(400);
      c('👏 を押すと1つ増え、もう押せない（1人1回）', /👏 1/.test(await ev(`document.querySelector('[data-clap="p2"]').textContent`)) && (await ev(`document.querySelector('[data-clap="p2"]').disabled`)) === true
        && !!(await ev(`!!window.__FBDATA['ckLounge/p2/clap/${uid}'] && !!window.__FBDATA['cards/${tok}/clap/p2']`)));
      await ev(`document.getElementById('lgGo').click()`); await wt(200);
      c('空では投稿できない', /ひとことを入れて/.test(await ev(`document.getElementById('toast').textContent`)));
      await ev(`(function(){ document.getElementById('lgText').value='朝のスキンケア、7日続きました！'; document.getElementById('lgGo').click(); })()`); await wt(500);
      const id = await ev(`Object.keys(window.__FBDATA).filter(function(k){ return /^cards\\/${tok}\\/lounge\\//.test(k); }).map(function(k){ return k.split('/').pop(); })[0]||''`);
      const post = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckLounge/' + ${JSON.stringify(id)}]||null)`));
      c('投稿すると確認待ちで入る（名前・コース・文・ユニオン）と、自分の印', /^[a-z0-9]{20}$/.test(id) && post && post.st === 'wait' && post.n === '見本 はなこ' && post.co === 'ゆらぎ肌ケア編' && post.union === 'ANTARES' && post.uid === uid && post.t === '朝のスキンケア、7日続きました！', id + ' ' + JSON.stringify(post));
      const t2 = await ev(`document.getElementById('lgArea').innerText`);
      c('自分の投稿は「確認待ち」で出る（みんなの一覧には出ない）', /朝のスキンケア、7日続きました！\s*確認待ち/.test(t2), t2);
      await page.screenshot({ path: OUT + '/cklg131_card.png', fullPage: true });
      await ev(`document.querySelector('[data-lgdel]').click()`); await wt(400);
      c('取り消すと投稿と印が消える', !(await ev(`!!window.__FBDATA['ckLounge/' + ${JSON.stringify(id)}] || !!window.__FBDATA['cards/${tok}/lounge/' + ${JSON.stringify(id)}]`)) && !/確認待ち/.test(await ev(`document.getElementById('lgArea').innerText`)));
      c('横にはみ出さない', (await ev(`document.documentElement.scrollWidth`)) === 390);
    } else {
      await ev(`document.getElementById('lgArea').scrollIntoView()`);
      await page.screenshot({ path: OUT + '/cklg131_card_d.png' });
    }
    c('エラーなし（カード）' + (dark ? '（ダーク）' : ''), !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ② 自分の投稿には👏できない・出せなかった投稿・1日3回まで
  {
    const data = Object.assign({ ['cards/' + tok]: card(), ['cardClaims/' + uid]: { t: tok },
      'ckLounge/m1': { union: 'ANTARES', uid, n: '見本 はなこ', t: '自分の出ている投稿', st: 'ok', okAt: 5000 },
      'ckLounge/m2': { union: 'ANTARES', uid, n: '見本 はなこ', t: 'やせた！', st: 'ng', at: 1 }, ['cards/' + tok + '/lounge/m2']: { at: 1 } }, posts);
    const o = await P.open(b, { hash: '#c=' + tok, data, init: `localStorage.setItem('bci_lgn_${uid}_' + (function(){ var d=new Date(), p=function(n){ return (n<10?'0':'')+n; }; return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); })(), '3');` });
    c('自分の投稿には 👏 できない', (await o.ev(`document.querySelector('[data-clap="m1"]').disabled`)) === true);
    c('出せなかった投稿は「出せませんでした」', /やせた！\s*出せませんでした/.test(await o.ev(`document.getElementById('lgArea').innerText`)));
    await o.ev(`(function(){ document.getElementById('lgText').value='4回目'; document.getElementById('lgGo').click(); })()`); await o.wt(300);
    c('投稿は1日3回まで', /1日3回まで/.test(await o.ev(`document.getElementById('toast').textContent`)));
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#c=tokM', data: { 'cards/tokM': { no: 'ZZ0001', name: '架空 太郎', union: 'ANTARES', active: true } } });
    c('ビジネスの会員証には出ない', (await o2.ev(`document.getElementById('lgArea').innerHTML`)) === '' && !o2.errs.length);
    await o2.ctx.close();
    const o3 = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card({ toMember: 'P0006', toCard: 'feed' }) } });
    c('研修生になったユーザーのカードには出ない', (await o3.ev(`document.getElementById('lgArea').innerHTML`)) === '');
    await o3.ctx.close();
  }
  // ③ スタッフ：ラウンジの確認（出す・出さない・取り下げる・効果をうたう言葉を目立たせる）
  {
    const data = { 'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: [OWNER] },
      'ckLounge/w1': { union: 'GRANT', uid: 'u1', n: '見本 はなこ', co: 'ダイエット編', t: '今週は毎日歩けました', st: 'wait', at: 1 },
      'ckLounge/w2': { union: 'GRANT', uid: 'u2', n: '見本 さくら', t: 'これでアトピーが治った！', st: 'wait', at: 2 },
      'ckLounge/o1': { union: 'GRANT', uid: 'u3', n: '見本 ゆり', t: '出ている投稿', st: 'ok', okAt: 1 },
      'ckLounge/x1': { union: 'REVE', uid: 'u4', n: '別', t: 'ほかのユニオン', st: 'wait', at: 1 } };
    const { ctx, page, ev, wt, errs } = await P.open(b, { data });
    await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(600);
    c('ビジネスの名簿では「ラウンジの確認」は出ない', (await ev(`document.getElementById('btnUserLounge').classList.contains('hide')`)) === true);
    await ev(`document.querySelector('#rosterKind button[data-k="user"]').click()`); await wt(500);
    await ev(`document.getElementById('btnUserLounge').click()`); await wt(500);
    const m = await ev(`document.querySelector('.modal').innerText`);
    c('確認待ち2件・出ている1件（ほかのユニオンは出ない）', /確認待ち（2件）/.test(m) && /今週は毎日歩けました/.test(m) && /出ている投稿/.test(m) && !/ほかのユニオン/.test(m), m);
    c('効果をうたう言葉（アトピー・治った）を目立たせる', (await ev(`document.querySelectorAll('.modal .lg-q.warn').length`)) === 1 && (await ev(`document.querySelectorAll('.modal mark.lg-warn').length`)) >= 2 && /出さないでください/.test(m));
    await page.screenshot({ path: OUT + '/cklg131_staff.png' });
    await ev(`document.querySelector('.modal [data-lgok="w1"]').click()`); await wt(500);
    const w1 = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckLounge/w1'])`));
    c('「出す」で ok・出した時刻・出した人', w1.st === 'ok' && !!w1.okAt && w1.by === OWNER, JSON.stringify(w1));
    await ev(`document.querySelector('.modal [data-lgng="w2"]').click()`); await wt(500);
    c('「出さない」で ng', (await ev(`window.__FBDATA['ckLounge/w2'].st`)) === 'ng');
    await ev(`document.querySelector('.modal [data-lgng="o1"]').click()`); await wt(500);
    c('「取り下げる」で ng', (await ev(`window.__FBDATA['ckLounge/o1'].st`)) === 'ng');
    c('ページのエラーなし（スタッフ）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
