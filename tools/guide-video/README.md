# 使い方ガイドの動画（自動撮影）

受付システム（`checkin/index.html`）の使い方ガイドの「▶ 動画」を、**ダミーデータだけ**で自動撮影して
`checkin/guide/<ミッションID>.mp4` を作り直すための道具です。実在メンバーのデータは一切使いません。

画面を改修して動画が古くなったら、撮り直してコミットしてください。

## 必要なもの
- Node.js と Playwright（`npm i playwright`）、Chromium
- Python3 と `pip install imageio-ffmpeg`（H.264 で書き出すため）

## 撮り方
```bash
cd tools/guide-video
python3 mkpage.py                      # 撮影用ページを www/ に作る（index.html を変えたら毎回）
(cd www && python3 -m http.server 8899 &)
node run.js                            # 全ミッション（25本）
node run.js rec1 tr1                   # 一部だけ
```
- `CHROME=/path/to/chrome` でブラウザを指定できます
- 字幕・タップ位置・タイトルは `rig.js`、各ミッションの操作と字幕は `demos.js`
- PC向け（受付管理）は 1280×720、研修担当はスマホ縦（720幅）で書き出します
