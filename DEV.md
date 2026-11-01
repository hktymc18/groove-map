# GROOVE MAP 開発ガイド（複数デバイス対応）

会社PC・Mac・iPhone、どこからでも開発するためのメモ。
**GitHubリポジトリが唯一の正**。「作業前に取得（pull）→ 作業ブランチで編集 → PR → main へマージ」を回す（main へ直接 push しない）。

- 公開URL: https://hktymc18.github.io/groove-map/
- リポジトリ: https://github.com/hktymc18/groove-map.git （**public**）
- Firebaseプロジェクト: `hotlist-21865`（APIキーはクライアント公開前提・秘密ではない）

---

## 1. 構成（何を触るか）

| ファイル | 役割 |
|---|---|
| `index.html` / `app.js` | **アプリ本体**（NAVIGATOR。画面は index.html、処理の大半は app.js） |
| `checkin/index.html` | 受付システム（BASE CHECK-IN）の単一ファイルES5アプリ |
| `sw.js` | Service Worker（PWAキャッシュ）。バージョン更新時に一緒に上げる |
| `manifest.webmanifest` / `icon-*.png` | PWA設定・アイコン |
| `firestore.rules` | Firestoreのセキュリティルール |

- **ビルド不要・npm不要**。ただの静的ファイル。
- PR を `main` にマージすると **GitHub Pagesが自動でデプロイ**（1〜3分で反映）。PR ではテスト（`.github/workflows/pr-test.yml`）が自動で回る。
- ⚠️ 旧 `GROOVE_MAP_HANDOFF.md` の「groove_map_full.html をコピー」する方式は**廃止**。今は `index.html` を直接編集する。

---

## 2. デバイス別の始め方

### 🥇 Claude Code on the web（ブラウザだけ・会社PC / iPhone 共通・おすすめ）
1. ブラウザで **https://claude.ai/code** を開く
2. いつものAnthropicアカウントでログイン
3. GitHubを連携し、リポジトリ `hktymc18/groove-map` を開く
4. プロンプトで指示 → クラウド上で作業ブランチに編集・push → PR → マージで自動デプロイ
- **インストール禁止の会社PCでもOK**。iPhoneのSafariからも使える。

### 🖥 会社PC / Mac（ローカルでガッツリ）
```bash
# 初回だけ
git clone https://github.com/hktymc18/groove-map.git
cd groove-map

# 毎回の流れ
git checkout main && git pull        # ← 必ず最初に最新取得
git checkout -b work/変更の名前       # ← 作業ブランチを切る
# 編集（VS Code など）→ bash tools/test/run.sh で確かめる
git add app.js index.html sw.js      # ← ファイル名を指定（git add -A は使わない）
git commit -m "変更内容"
git push -u origin work/変更の名前   # ← GitHub で PR を作り、main へマージで本番反映
```
- エディタは **VS Code** 推奨。
- Macと同じAI開発をしたければ **Claude Code（Win/Mac版）** も入れる。

### 📱 iPhone（アプリで手元修正）
- **Working Copy**（iOS用Gitアプリ）でクローン → 作業ブランチで編集 → commit → push → GitHubアプリで PR
- 小さな修正やPR確認だけなら **GitHubアプリ** でも可。

---

## 3. ローカルで見た目を確認（任意）
単一HTMLなので、ローカルサーバで開くだけ:
```bash
cd groove-map
python3 -m http.server 8000
# → ブラウザで http://localhost:8000
```
（Firebaseは本番プロジェクトに接続されるので、ログイン等も動く）

---

## 4. バージョンの上げ方（PWA更新のため必須）
本番の見た目が更新されない/古いキャッシュが残るのを防ぐため、**変更をデプロイする時は必ずバージョンを上げる**。
`tools/test/bump.py` で **7か所（sw.js 2・index.html 3・app.js 2）** をまとめて上げる（sed で一部だけ上げると版がずれる）。

```bash
# 例: v859 → v860（お知らせ RELEASE_NOTES の先頭にも1行足す）
python3 tools/test/bump.py v859 v860 "  { v:'v860', d:'YYYY-MM-DD', items:['…'] },"
node tools/test/tests/smoke_test.js | tail -1    # ALL PASS なら版がそろっている
```

---

## 5. 守ること（ハマりどころ）

- ✅ **作業前に必ず `git pull`**。複数端末で編集するので、古い状態から上書きするのが一番の事故。
- ✅ 基本は「**作業ブランチで編集→PR→マージ→他端末でpull**」。main へ直接 push しない。同時編集は競合のもと。
- ✅ **ES5で書く**（`const`/`let`/アロー関数/テンプレート文字列は使わない）。iOS Safari互換のため。
- ✅ コミット前に**テスト**：`bash tools/test/run.sh`（最後の行が `PASS N FAIL 0`）。確かめ方はスキル `verify-groove-map`。
- ✅ push権限（＝デプロイ）は各端末で**初回だけGitHub認証**（ブラウザ系はOAuth、ローカルGitは Personal Access Token か SSH鍵）。
- ✅ Firebase APIキーはコードに入っていてOK（公開前提）。GitHubのシークレット警告は「クライアント利用」で無視可。セキュリティは Firestoreルール＋認証で担保。

---

## 6. デプロイ確認
マージ後、数分で反映。ライブのバージョンを確認（`bash tools/test/waitdeploy.sh <mainのSHA> vNNN` でも可）:
```bash
curl -s "https://hktymc18.github.io/groove-map/index.html?cb=$RANDOM" | grep -o 'versionTag[^>]*>v[0-9]\{3\}'
```
スマホPWAは**一度完全に閉じて再起動**すると最新になる（右上のバージョン表示で確認）。
