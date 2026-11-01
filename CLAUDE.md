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

## マージの決まり（自動の実行）

- **自動の実行**＝人が見ていない実行（スケジュール実行・brain のタスクの自動実行）。
  自動の実行は**最初に `.claude/autonomous.flag` を作る**（`touch .claude/autonomous.flag`。.gitignore 済み）。
- 自動の実行では**マージしない**。PR を作るところまで（タスクに `#自動マージOK` がある時だけ例外）。
  会話で本人が「マージして」と頼んだ時はマージしてよい。
- 目印がある時は PreToolUse フック `tools/hooks/guard-autonomous.sh` が `gh pr merge`・main への push・
  `--force`・MCP のマージ／自動マージの有効化を止める（目印が無い会話では何も止めない）。
  テストは `bash tools/hooks/guard_test.sh`。

## 確かめ方とPR

- 確かめ方はスキル `verify-groove-map`（`.claude/skills/verify-groove-map/SKILL.md`）を使う。
- PR の本文は `.github/pull_request_template.md` の形で書く。
- 同じ指摘が2回出たら、強い順に仕組みにする（作りで防ぐ → CI・lint で止める → テスト → 最後にルールに書く）。
- `git add -A` は使わない（ファイル名を指定して add する。写真・名簿などの混入を防ぐ）。

## その他の注意

- GROOVE MAP本体（`app.js` / ルートの `index.html` / `sw.js`）の変更は、Claude が作業ブランチで
  テスト → コミット → PR作成まで行う。**会話でオーナー本人に「マージして」と頼まれた時は
  mainへマージ（＝GitHub Pagesで本番反映）まで行う**（ファイルのアップロードは不要）。
  マージ方式は merge（作業ブランチの履歴を保つ）。自動の実行では下の「マージの決まり」に従う。
- `sw.js` / `app.js` / ルートの `index.html`（GROOVE MAP本体）はオーナーが直接アップロードで
  更新することがある。マージ時は基本 upload 側を採用しつつ、**`sw.js` の `/checkin` 除外ブロック
  （ネットワーク優先。これが無いと受付URLでMAPのログイン画面が出る）が消えていないか必ず確認**し、
  消えていたら再適用して CACHE 名を上げる。
- `checkin/index.html` は受付システム（BASE CHECK-IN）の単一ファイルES5アプリ。
  GitHub Pages（mainブランチ）で配信され、マージ＝本番反映。
- 実在メンバーの名簿CSV・会員証トークンの一覧・氏名の対応表など個人情報は
  公開リポジトリにコミットしない（チャットでの受け渡しのみ）。
- `checkin/index.html` にユーザーに見える変更を入れたら、スクリプト内の
  `APP_VER` を連番で1つ上げ（v5 → v6）、`CHANGELOG` の先頭に
  `{ v: 'v6', d: 'YYYY/MM/DD'（JSTの更新日）, items: [ユーザー向けの変更点…] }` を追記する
  （画面上部の📣お知らせに表示され、未読の人には赤丸が付く）。
- GROOVE MAP本体の `RELEASE_NOTES` は、ユーザーに知らせたい大きい更新のときだけ
  `pop: { t: 見出し, items: [3つまで], go: ['ボタン名', 'onclickのJS'] }` を付ける
  （アップデート後に最初に開いた時、まだ見ていない pop 付きの更新だけを1回まとめて表示する。
  「見た」は users/{uid}.seenNote と端末の localStorage。細かい修正には付けない）。
