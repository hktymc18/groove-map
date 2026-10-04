// 動画撮影リグ: テスト用スタブ（ダミーデータのみ）でアプリを操作し、大きめ字幕・タップ位置・タイトルを焼き込んで録画する
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
// ffmpeg（H.264 が使えるもの）: 環境変数 FFMPEG か、pip の imageio-ffmpeg 同梱版を使う
const FFMPEG = process.env.FFMPEG || execFileSync('python3', ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())']).toString().trim();
const BASE = 'http://localhost:' + (process.env.PORT || 8899) + '/video.html';
const JETKO = fs.readFileSync(__dirname + '/jetko.svg', 'utf8');
const OVERLAY_CSS = (pc) => `
  #vcap{position:fixed;left:50%;bottom:${pc ? 30 : 22}px;transform:translateX(-50%);z-index:99999;width:max-content;max-width:${pc ? '86vw' : 'calc(100vw - 20px)'};box-sizing:border-box;
    background:rgba(20,20,16,.86);color:#fff;font-weight:800;font-size:${pc ? 30 : 21}px;line-height:1.45;padding:${pc ? '14px 28px 14px 82px' : '12px 16px 12px 60px'};
    border-radius:18px;border:3px solid #ffd83d;box-shadow:0 8px 24px rgba(0,0,0,.35);font-family:"IPAGothic","Hiragino Sans",sans-serif;
    opacity:0;transition:opacity .25s;text-align:left;letter-spacing:.02em;pointer-events:none;}
  #vcap.on{opacity:1;}
  #vcap .j{position:absolute;left:${pc ? 12 : 8}px;top:50%;margin-top:${pc ? -30 : -22}px;width:${pc ? 60 : 44}px;height:${pc ? 60 : 44}px;}
  #vcap b{color:#ffd83d;}
  #vcur{position:fixed;z-index:99998;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(255,140,26,.55);
    border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);pointer-events:none;transition:left .55s cubic-bezier(.3,.8,.3,1),top .55s cubic-bezier(.3,.8,.3,1);left:50%;top:60%;}
  .vrip{position:fixed;z-index:99997;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:4px solid #ff8c1a;pointer-events:none;animation:vrip .6s ease-out forwards;}
  @keyframes vrip{from{transform:scale(.6);opacity:1;}to{transform:scale(2.6);opacity:0;}}
  #vtitle{position:fixed;inset:0;z-index:100000;background:linear-gradient(160deg,#ffe066,#ffb703);display:flex;flex-direction:column;align-items:center;justify-content:center;
    color:#3a2a00;font-family:"IPAGothic","Hiragino Sans",sans-serif;text-align:center;}
  #vtitle .j{width:${pc ? 150 : 120}px;height:${pc ? 150 : 120}px;}
  #vtitle .r{font-size:${pc ? 26 : 18}px;font-weight:800;opacity:.75;margin-top:8px;}
  #vtitle .t{font-size:${pc ? 52 : 32}px;font-weight:900;margin-top:4px;padding:0 20px;}
  #vtitle .s{font-size:${pc ? 20 : 15}px;font-weight:700;margin-top:14px;opacity:.7;}
`;
async function record(opts) {
  const pc = opts.device !== 'phone';
  const vp = pc ? { width: 1280, height: 720 } : { width: 390, height: 844 };
  const size = vp;
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const dir = __dirname + '/raw/' + opts.id;
  fs.rmSync(dir, { recursive: true, force: true });
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, recordVideo: { dir, size } });
  const t0 = Date.now();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  const url = BASE + (opts.hash || '');
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(200);
  if (opts.seed) {
    await p.evaluate(sd => localStorage.setItem('__stubSeed', JSON.stringify(sd)), opts.seed);
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(300);
  }
  const install = async () => {
    await p.addStyleTag({ content: OVERLAY_CSS(pc) });
    await p.evaluate(J => {
      if (document.getElementById('vcap')) return;
      const c = document.createElement('div'); c.id = 'vcap'; c.innerHTML = '<span class="j">' + J + '</span><span class="tx"></span>'; document.body.appendChild(c);
      const k = document.createElement('div'); k.id = 'vcur'; document.body.appendChild(k);
    }, JETKO);
  };
  if (opts.prep) await opts.prep(p);
  await install();
  // タイトル
  await p.evaluate(([J, role, title, sub]) => {
    const t = document.createElement('div'); t.id = 'vtitle';
    t.innerHTML = '<div class="j">' + J + '</div><div class="r">🔰 BASE CHECK-IN 使い方 ／ ' + role + '</div><div class="t">' + title + '</div><div class="s">' + sub + '</div>';
    document.body.appendChild(t);
  }, [JETKO, opts.role, opts.title, opts.sub || 'ジェッ子ちゃんと いっしょに やってみよう！']);
  const tStart = Date.now();
  await p.waitForTimeout(2200);
  await p.evaluate(() => document.getElementById('vtitle').remove());
  const h = {
    p,
    async cap(html, ms) {
      await p.evaluate(x => { const c = document.getElementById('vcap'); c.querySelector('.tx').innerHTML = x; c.classList.add('on'); }, html);
      await p.waitForTimeout(ms || 2600);
    },
    async capOff() { await p.evaluate(() => document.getElementById('vcap').classList.remove('on')); await p.waitForTimeout(250); },
    async point(sel) {
      const r = await p.evaluate(s => { const e = typeof s === 'string' ? document.querySelector(s) : null; if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
      if (!r) throw new Error('not found: ' + sel);
      await p.waitForTimeout(150);
      const r2 = await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
      await p.evaluate(r => { const k = document.getElementById('vcur'); k.style.left = r.x + 'px'; k.style.top = r.y + 'px'; }, r2);
      await p.waitForTimeout(650);
      return r2;
    },
    async tap(sel, after) {
      const r = await h.point(sel);
      await p.evaluate(r => { const d = document.createElement('div'); d.className = 'vrip'; d.style.left = r.x + 'px'; d.style.top = r.y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 700); }, r);
      try { await p.click(sel, { timeout: 6000 }); } catch (e) { throw new Error('click ' + sel + ' :: ' + e.message.split('\n').slice(0, 4).join(' / ')); }
      await p.waitForTimeout(after == null ? 700 : after);
    },
    async type(sel, text, after) {
      await h.tap(sel, 200);
      await p.type(sel, text, { delay: 90 });
      await p.waitForTimeout(after == null ? 500 : after);
    },
    async select(sel, val, after) { await h.tap(sel, 200); await p.selectOption(sel, val); await p.waitForTimeout(after == null ? 600 : after); },
    async closeModal() { await p.evaluate(() => { const m = document.querySelector('.modalback'); if (m) m.click(); }); await p.waitForTimeout(400); },
    wait: ms => p.waitForTimeout(ms)
  };
  let tEnd;
  try {
    await opts.run(h);
    // おわり
    await h.cap('🎉 <b>ミッションクリア！</b> 練習モードでも試せるよ', 2200);
    tEnd = Date.now();
  } finally {
    await ctx.close().catch(() => {}); await b.close().catch(() => {});
  }
  const webm = fs.readdirSync(dir).filter(f => f.endsWith('.webm'))[0];
  // 出力先は受付システムの動画フォルダ（checkin/guide/<ミッションID>.mp4）
  const out = __dirname + '/../../checkin/guide/' + opts.id + '.mp4';
  const ss = ((tStart - t0) / 1000 - 0.15).toFixed(2), dur = ((tEnd - tStart) / 1000 + 0.3).toFixed(2);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', ss, '-i', dir + '/' + webm, '-t', dur,
    '-vf', 'fps=24' + (pc ? '' : ',scale=720:-2:flags=lanczos'), '-c:v', 'libx264', '-preset', 'slow', '-crf', pc ? '28' : '27',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out]);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(opts.id + ': ' + dur + 's ' + kb + 'KB' + (errs.length ? ' ERR ' + JSON.stringify(errs) : ''));
  return out;
}
module.exports = { record };
