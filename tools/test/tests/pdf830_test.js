// v830：MAPのPDFの画質。400dpi で 2×2 に分けて描き、ページに並べる（1枚ずつ、その範囲だけの SVG にするので引き伸ばさない）
const T = require('../lib/head.js')();
const { w, c } = T;
T.run(async () => {
  T.login();
  const srcs = [];
  w.Image = function() { const im = this; setTimeout(() => im.onload && im.onload(), 0); Object.defineProperty(im, 'src', { set(v) { srcs.push(v); }, get() { return ''; } }); };
  const P = w.HTMLCanvasElement.prototype, ogc = P.getContext;
  P.getContext = function() { return { fillRect() {}, drawImage() {}, set fillStyle(v) {} }; };
  P.toDataURL = function() { return 'data:image/jpeg;base64,AAAA' + this.width + 'x' + this.height; };
  const NS = 'http://www.w3.org/2000/svg', svg = w.document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1600 1000'); svg.appendChild(w.document.createElementNS(NS, 'circle'));
  const tiles = await new Promise(ok => w._opdfSvgToJpeg(svg, 1600, 1000, 10, ok));
  c('2×2 に分けて描く', tiles && tiles.length === 4, tiles && tiles.length);
  const px = Math.round(420 * 400 / 25.4), py = Math.round(297 * 400 / 25.4);
  c('400dpi（A3横で 約6600×4700 の細かさ）', tiles.reduce((s, t) => s + (t.y < 1 ? +t.url.match(/(\d+)x/)[1] : 0), 0) >= px, px + 'x' + py);
  c('1枚ずつはiPhoneのキャンバスの上限より小さい', tiles.every(t => { const m = t.url.match(/(\d+)x(\d+)/); return +m[1] * +m[2] < 16000000; }));
  const r = tiles.map(t => [t.x, t.y, t.x + t.w, t.y + t.h]);
  c('ページ全体（420×297mm）をすき間なく覆う（少し重ねる）', Math.min(...r.map(a => a[0])) === 0 && Math.min(...r.map(a => a[1])) === 0 && Math.abs(Math.max(...r.map(a => a[2])) - 420) < 0.2 && Math.abs(Math.max(...r.map(a => a[3])) - 297) < 0.2 && r[0][2] > r[1][0] && r[0][3] > r[2][1]);
  const vbs = srcs.map(s => (decodeURIComponent(s).match(/viewBox="([^"]+)"/) || [])[1]);
  c('1枚ずつ、その範囲だけの SVG（viewBox を切り出し・幅と高さ＝描く大きさ）', new Set(vbs).size === 4 && srcs.every(s => /width="\d+" height="\d+"/.test(decodeURIComponent(s)) || /height="\d+"[^>]*width="\d+"/.test(decodeURIComponent(s))));
  P.getContext = ogc;
});
