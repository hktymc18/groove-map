# 開発メモ（Claude Code向け作業規約）

## Firestoreルールの変更フロー

ルールの正本はこのリポジトリの `firestore.rules`。変更は必ずこのファイルを更新して
PR → main へマージし、オーナーが **Cloud Shell から `firebase deploy` でデプロイ**する。

```bash
# Cloud Shell での適用手順（オーナーが実行）
# 初回のみ: git clone https://github.com/hktymc18/groove-map.git
git -C groove-map pull
cd groove-map && firebase deploy --only firestore:rules
# ※ deploy は必ず groove-map フォルダの中で実行（外だと firebase.json が見つからずエラーになる）
cd ~
```

- **Firebaseコンソールにルール全文を貼り付ける運用は廃止**。コンソールで直接変えた内容は、
  次に誰かがファイルからデプロイした時に上書きされて消えるため。
- ルールを変更したPRの完了報告では、上記のCloud Shellコマンドの実行を依頼すること
  （テキストファイルでの全文お渡しは不要）。

## その他の注意

- `sw.js` / `app.js` / ルートの `index.html`（GROOVE MAP本体）はオーナーが直接アップロードで
  更新することがある。マージ時は基本 upload 側を採用しつつ、**`sw.js` の `/checkin` 除外ブロック
  （ネットワーク優先。これが無いと受付URLでMAPのログイン画面が出る）が消えていないか必ず確認**し、
  消えていたら再適用して CACHE 名を上げる。
- `checkin/index.html` は受付システム（BASE CHECK-IN）の単一ファイルES5アプリ。
  GitHub Pages（mainブランチ）で配信され、マージ＝本番反映。
- 実在メンバーの名簿CSV・会員証トークンの一覧・氏名の対応表など個人情報は
  公開リポジトリにコミットしない（チャットでの受け渡しのみ）。
- `checkin/index.html` にユーザーに見える変更を入れたら、スクリプト内の
  `APP_VER` を上げて `CHANGELOG` の先頭にユーザー向けの変更点を追記する
  （画面上部の📣お知らせに表示され、未読の人には赤丸が付く）。
  バージョンは `v西暦.月.日`、同日2回目以降は `b` `c` … を付ける（例: v2026.10.04b）。
