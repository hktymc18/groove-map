// v679：予定の編集画面の項目の文字サイズをそろえる（iPhoneで入力欄だけ16pxになっていた）
const T = require('../lib/head.js')();
const { c } = T;
const fs = require('fs'), p = require('path');
T.run(async () => {
  const h = fs.readFileSync(p.join(__dirname, '../../../index.html'), 'utf8');
  const blk = h.slice(h.indexOf('@supports (-webkit-touch-callout: none) {'), h.indexOf('/* モーダル内で何かがはみ出しても'));
  c('iPhoneでも予定の編集画面の入力欄は15px', /#eventModal \.fi,#eventModal input,#eventModal select,#eventModal textarea\{font-size:15px!important\}/.test(blk));
  c('日付欄の表示も15px', /#eventModal input::-webkit-date-and-time-value\{font-size:15px\}/.test(blk));
  c('入力時の自動ズームを止める設定（maximum-scale=1）', /name="viewport" content="[^"]*maximum-scale=1/.test(h));
  c('カテゴリ・メンバー欄も15px', /\.ev-cat-field\{[^}]*font-size:15px/.test(h));
});
