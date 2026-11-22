// v908：残っていた色と読みにくい所（ホームの数字＝チャコール・押すボタン＝イエロー・選んだ印＝チャコール など）
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8'), app = fs.readFileSync(path.join(__dirname, '../../../app.js'), 'utf8');
  c('ホームの数字はチャコール', /body \.tdy-t \.v\{color:var\(--text\)!important\}/.test(html));
  c('押すボタン（ずらす・追加 など）はイエロー', /body \.yr-btn\.go,[^{]*\{background:#EFFF40!important;border-color:#EFFF40!important;color:#373334!important\}/.test(html) || /body \.yr-btn\.go[,{]/.test(html) && /body \.ux-nx,body \.yk-add \.go/.test(html));
  c('選んだ印（タブ・切り替え）はチャコール', /body \.adm-tabs span\.on,body \.rv-nps span\.on[^{]*\{background:var\(--nv-ink\)!important/.test(html));
  c('OL の審査中の札はイエロー（MAP と同じ）', /body \.ot-ttl\.loi,body \.ot-ttl\.q\{background:var\(--nvt-ex\)!important;color:var\(--nvt-ex-ink\)!important\}/.test(html));
  c('年の目標の「過ぎた」と締め切りの注意はトーンの赤', /\.yr-dl \.ng\{color:var\(--red\)\}/.test(app) && /\.yr-calc \.or\{color:var\(--red\)\}/.test(app));
  c('🔥 のアイコンは金（オレンジをやめる）', /"🔥": \["flame", "color:var\(--gold\)/.test(app));
  c('地域の札の選んだ方はチャコール', /active \? 'var\(--nv-ink\)' : 'var\(--border\)'/.test(app));
  c('メンバーの画面のタイトルの札は MAP と同じ色', /'background:var\(--nvt-' \+ cat \+ '\);color:var\(--nvt-' \+ cat \+ '-ink\)'/.test(app));
  c('ダークの色を決めていない予定は暗い字（自分で色を付けた予定はそのまま）', /body:not\(\.light\) \.ev-bar\.bar-event\{color:#191717\}/.test(html));
});
