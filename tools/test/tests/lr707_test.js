// v706：PCは上の帯なし（年月・翌月コピー・共有MAPはMAPの上の帯）／v707：計画シートPCは左右2分割（左MAP・右に書く欄）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(1440, 900); w._uxSync && w._uxSync(); await sleep(20);
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both', ptCurrent: 3000 }, { id: 'a', lastName: '佐藤', firstName: '花', title: 'B1', parentId: 'r', mapType: 'both', ptCurrent: 300 }];
  w.switchView('current'); await sleep(30); try { w.showCopyBtn(); } catch (e) {}
  c('v706: PCは上の帯を出さない', w.document.body.classList.contains('px3') && /header\{display:none!important\}/.test(($('#px3Css') || {}).textContent || ''));
  c('v706: MAPの上の帯に年月・翌月コピー', /\d+年\d+月/.test($('#pcToolbarC .pt-mon').textContent) && /翌月コピー/.test($('#pcToolbarC .pt-mon').textContent));
  c('v706: 版・保存は左下', !!$('#pcsVer #versionTag'));
  w.switchView('plan'); w.p2Go('sheet'); await sleep(40);
  c('v707: 計画シートは左右2分割（左にMAP・右に数字と行動）', !!$('.sp-lr .sp-lrL #p2ShMF') && !!$('.sp-lrR .sp-acts') && !$('.sp-lrL .sp-acts'));
  c('v707: 左右の時は「上に固定」はなし（左はいつも見える）', !$('.sp-pn') && !!$('.st-h .lay span.on') && /左右/.test($('.st-h .lay span.on').textContent));
  c('v707: 課題はMAPの下', !!$('.sp-lrL .sp-mis .iss'));
  w.p2ShLayTgl('tb'); await sleep(30);
  c('v707: 「上下」で前の並び', !$('.sp-lr') && !!$('.sp-pn') && w.localStorage.getItem('gm_shLay') === 'tb');
  w.p2ShLayTgl('lr'); await sleep(30);
  c('v707: 「左右」に戻す', !!$('.sp-lr') && !w.localStorage.getItem('gm_shLay'));
});
