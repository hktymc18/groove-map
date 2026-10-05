# tools/test — GROOVE MAP の自動テストと画面写真の道具

個人情報（名簿・会員証トークン・氏名の対応表など）は入れないこと。テストのデータは架空のものだけ。

## 準備（初回のみ）
```bash
cd tools/test && npm install      # jsdom を入れる（node_modules はコミットしない）
```

## テスト
```bash
bash tools/test/run.sh            # tests/*_test.js を並列実行。FAILだけ表示、結果は tools/test/out/
node tools/test/tests/ef614_test.js   # 1本だけ
```
- `lib/head.js`：jsdom で index.html＋app.js を読み込み、Firebase はスタブ。時計は 2026-10-14（水）から進む
- 書き方：`const T = require('../lib/head.js')(); const { w, c, sleep, setWH, $, $$ } = T; T.run(async () => { T.login(); … });`

## 画面写真（Playwright・Chromium）
```bash
VIEW=events VW=390 VH=844 PFX=cal SHOTS='[["month","setTheme(\"light\");setEventsMode(\"calendar\")"]]' node tools/test/shot/shot.js
# → tools/test/out/cal_month.png（横向きは VW=844 VH=390）
node tools/test/shot/mockfull.js <mock.html> <out.png>   # モックHTMLの写真
```

## バージョンを上げる・公開の確認
```bash
python3 tools/test/bump.py v614 v615 "  { v:'v615', d:'YYYY-MM-DD', items:['…'] },"   # sw.js・index.html・app.js の7か所＋お知らせ
bash tools/test/waitdeploy.sh <mainのSHA> v615   # "completed success" と 3 が出たら本番に反映済み
```
