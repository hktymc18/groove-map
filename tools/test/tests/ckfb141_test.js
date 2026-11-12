// 受付 v141：テストのフィードバックの直し（架空データ）
//   ① コースを変えた日の「全部できました」 ② ホームの円の大きさ ④ お知らせ10分・ベルで読み直す ⑤ 当日のお礼の言い方 ⑦ カレンダーの時間
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const TA = '0123456789abcdef0123456789abcdef', UA = 'u17620000000001', T = day(0);
const card = (x) => Object.assign({ kind: 'user', no: UA, name: '見本 はなこ', union: 'ANTARES', active: true, visits: 1 }, x || {});
(async () => {
  const b = await P.browser();
  // ① ダイエットで3つ → ゆらぎ肌に変えた（今日のチェックはダイエットのキーだけ）
  {
    const data = { ['cards/' + TA]: card(), ['cardClaims/' + UA]: { t: TA },
      ['cards/' + TA + '/plan/me']: { course: 'yuragi', qs: ['am', 'pm', 'moist'], start: day(-1), days: { [T]: ['water', 'walk', 'dinner'] }, atMs: 1 } };
    const { ctx, page, ev, wt, errs } = await P.open(b, { hash: '#c=' + TA, data, wait: 2600 });
    await page.click('#uaTabs [data-tab="plan"]'); await wt(300);
    let t = await ev(`document.getElementById('mpArea').innerText`);
    c('① コースを変えた日：前のコースのチェックは数えない（0/3・「全部できました」は出ない）', /今日のクエスト\s*0\/3/.test(t) && !/全部できました/.test(t), t.slice(0, 200));
    await page.click('#mpArea [data-q="am"]'); await wt(400);
    t = await ev(`document.getElementById('mpArea').innerText`);
    c('① 1つチェックで 1/3（4/3 にならない）', /今日のクエスト\s*1\/3/.test(t) && !/全部できました/.test(t));
    for (const k of ['pm', 'moist']) { await page.click('#mpArea [data-q="' + k + '"]'); await wt(400); }
    t = await ev(`document.getElementById('mpArea').innerText`);
    c('① 3つ全部で 3/3 と「全部できました」', /今日のクエスト\s*3\/3/.test(t) && /全部できました/.test(t));
    await page.click('#uaTabs [data-tab="home"]'); await wt(300);
    const r = await ev(`(function(){ var s=document.querySelector('#uaHomeQ .ua-ring').getBoundingClientRect(); return Math.round(s.width) + 'x' + Math.round(s.height); })()`);
    c('② ホームの円は 64×64（横いっぱいに広がらない）', r === '64x64', r);
    c('エラーなし（①②）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ④⑤ お知らせ：10分覚える・ベルで読み直す／当日のお礼は「ございます」
  {
    const old = (min) => `localStorage.setItem('bci_ntc_ANTARES', JSON.stringify({ at: Date.now() - ${min} * 60000, items: [{ t: '古いお知らせ', d: '${day(-1)}' }] }));`;
    const data = { ['cards/' + TA]: card({ lastVisit: { d: T, ev: '今日のDAY' } }), ['cardClaims/' + UA]: { t: TA }, 'ckNotice/ANTARES': { items: [{ t: '新しいお知らせ', d: T }] } };
    let o = await P.open(b, { hash: '#c=' + TA, data, init: `try{ if(!sessionStorage.getItem('s')){ ${old(11)} sessionStorage.setItem('s','1'); } }catch(e){}`, wait: 2600 });
    let t = await o.ev(`document.getElementById('nwArea').innerText`);
    c('④ 11分前に覚えたお知らせは読み直す（10分）', /新しいお知らせ/.test(t) && !/古いお知らせ/.test(t), t);
    c('⑤ 受付した当日は「ご来場ありがとうございます。」', /ご来場ありがとうございます。/.test(t) && !/ございました/.test(t), t);
    await o.ctx.close();
    o = await P.open(b, { hash: '#c=' + TA, data, init: `try{ if(!sessionStorage.getItem('s')){ ${old(5)} sessionStorage.setItem('s','1'); } }catch(e){}`, wait: 2600 });
    t = await o.ev(`document.getElementById('nwArea').innerText`);
    c('④ 5分前なら覚えている分を使う（読まない）', /古いお知らせ/.test(t), t);
    await o.page.click('#uaTabs [data-tab="plan"]'); await o.wt(200);
    await o.page.click('#uaBell'); await o.wt(1200);
    t = await o.ev(`document.getElementById('nwArea').innerText`);
    c('④ 右上のベルを押すと読み直す（新しいお知らせが出る）', /新しいお知らせ/.test(t) && (await o.ev(`document.querySelector('#uaApp .ua-pg.on').getAttribute('data-p')`)) === 'home', t);
    c('エラーなし（④⑤）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#c=' + TA, data: { ['cards/' + TA]: card({ lastVisit: { d: day(-2), ev: 'DAY' } }), ['cardClaims/' + UA]: { t: TA } }, wait: 2600 });
    c('⑤ 次の日からは「ご来場ありがとうございました。」', /ご来場ありがとうございました。/.test(await o2.ev(`document.getElementById('nwArea').innerText`)));
    await o2.ctx.close();
  }
  // ⑦ 時間の読み取り（日本時間 → UTC）。次のDAY の「Googleカレンダー」のリンクで確かめる
  {
    const D = day(5), Dn = D.replace(/-/g, ''), Dp = day(4).replace(/-/g, '');
    const tm = async (u) => {
      const o = await P.open(b, { hash: '#c=' + TA, data: { ['cards/' + TA]: card(), ['cardClaims/' + UA]: { t: TA },
        'checkinEvents/e1': { date: D, name: 'テストDAY', unions: ['ANTARES'], uDay: true, uInfo: u } }, wait: 2400 });
      const h = await o.ev(`(document.getElementById('nwGcal')||{}).href||''`); await o.ctx.close();
      return (/dates=([^&]+)/.exec(h) || [])[1] || h;
    };
    let r;
    c('⑦ 「19:00〜 テスト会場」→ 19:00〜21:00（2時間）', (r = await tm('19:00〜 テスト会場')) === Dn + 'T100000Z/' + Dn + 'T120000Z', r);
    c('⑦ 「13:30〜16:00」→ 終わりも入る', (r = await tm('13:30〜16:00 見本ホール')) === Dn + 'T043000Z/' + Dn + 'T070000Z', r);
    c('⑦ 「19時〜」も読む', (r = await tm('19時〜 見本ホール')) === Dn + 'T100000Z/' + Dn + 'T120000Z', r);
    c('⑦ 朝8時は前の日のUTC（日付をまたぐ）', (r = await tm('8:00〜')) === Dp + 'T230000Z/' + Dn + 'T010000Z', r);
    c('⑦ 時間が無ければ終日', (r = await tm('見本ホール')) === Dn + '/' + day(6).replace(/-/g, ''), r);
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
