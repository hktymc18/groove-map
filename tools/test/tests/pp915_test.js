// v915：メンバーの画面・設定・PC の表の選んだ札はチャコール、表の字は読める色
const T = require('../lib/head.js')();
const { c } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8'), app = fs.readFileSync(path.join(__dirname, '../../../app.js'), 'utf8');
  c('メンバーの画面・設定の選んだ札（.ppb・.ppt）と表の絞り込みはチャコール', /body \.ppb span\.on,body \.ppt span\.on,body \.tbl-filter-chip\.active\{background:var\(--nv-ink\)!important;border-color:var\(--nv-ink\)!important;color:var\(--nv-sel-ink\)!important\}/.test(html));
  c('タイトルの画面の今のタイトルの札もチャコール', /body \.ttc \.hd \.cur\{background:var\(--nv-ink\)!important;color:var\(--nv-sel-ink\)!important\}/.test(html));
  c('PC の表：研修中・研修生のタイトルは濃いターコイズ（var(--trainee)）', /tdTr\.style\.color = NV_TONE \? 'var\(--trainee\)'/.test(app) && /else if \(m\.trainee\) tdT\.style\.color = NV_TONE \? 'var\(--trainee\)'/.test(app));
  c('PC の表：稼働と段の字はチャコール・灰', /tdA\.style\.color = NV_TONE \? \(m\.activity \? 'var\(--text\)'/.test(app) && /tdD\.style\.color = NV_TONE \? 'var\(--text-mid\)'/.test(app));
  c('研修結果の「進行中」のアイコンはターコイズ（前の水色をやめる）', /\['', '進行中', 'clock', 'var\(--green\)'\]/.test(app));
});
