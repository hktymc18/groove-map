# GROOVE MAP 開発ガイド（複数デバイス対応）

会社PC・Mac・iPhone、どこからでも開発するためのメモ。
**GitHubリポジトリが唯一の正**なので、「作業前に取得（pull）→ 編集 → 反映（push）」を各デバイスで回すだけ。

- 公開URL: https://hktymc18.github.io/groove-map/
- リポジトリ: https://github.com/hktymc18/groove-map.git （**public**）
- Firebaseプロジェクト: `hotlist-21865`（APIキーはクライアント公開前提・秘密ではない）

---

## 1. 構成（何を触るか）

| ファイル | 役割 |
|---|---|
| `index.html` | **アプリ本体**（単一HTML。HTML/CSS/JSぜんぶ入り）。基本ここだけ編集 |
| `sw.js` | Service Worker（PWAキャッシュ）。バージョン更新時に一緒に上げる |
| `manifest.webmanifest` / `icon-*.png` | PWA設定・アイコン |
| `firestore.rules` | Firestoreのセキュリティルール |

- **ビルド不要・npm不要**。ただの静的ファイル。
- `main` ブランチに push すると **GitHub Pagesが自動でデプロイ**（1〜3分で反映）。
- ⚠️ 旧 `GROOVE_MAP_HANDOFF.md` の「groove_map_full.html をコピー」する方式は**廃止**。今は `index.html` を直接編集する。

---

## 2. デバイス別の始め方

### 🥇 Claude Code on the web（ブラウザだけ・会社PC / iPhone 共通・おすすめ）
1. ブラウザで **https://claude.ai/code** を開く
2. いつものAnthropicアカウントでログイン
3. GitHubを連携し、リポジトリ `hktymc18/groove-map` を開く
4. プロンプトで指示 → クラウド上で編集 → そのままpush → 自動デプロイ
- **インストール禁止の会社PCでもOK**。iPhoneのSafariからも使える。

### 🖥 会社PC / Mac（ローカルでガッツリ）
```bash
# 初回だけ
git clone https://github.com/hktymc18/groove-map.git
cd groove-map

# 毎回の流れ
git pull                 # ← 必ず最初に最新取得
# index.html を編集（VS Code など）
git add index.html sw.js
git commit -m "変更内容"
git push                 # ← push で本番反映
```
- エディタは **VS Code** 推奨。
- Macと同じAI開発をしたければ **Claude Code（Win/Mac版）** も入れる。

### 📱 iPhone（アプリで手元修正）
- **Working Copy**（iOS用Gitアプリ）でクローン → 内蔵エディタで `index.html` を編集 → commit → push
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
`index.html` の `>vNNN<`（右上表示）と `sw.js` の `groove-map-vNNN` の**2箇所**を同じ番号に。

```bash
# 例: v221 → v222（Macのsed。Linux/WSLは -i '' を -i に）
sed -i '' 's/v221/v222/g' index.html sw.js
```

---

## 5. 守ること（ハマりどころ）

- ✅ **作業前に必ず `git pull`**。複数端末で編集するので、古い状態から上書きするのが一番の事故。
- ✅ 基本は「**1端末で編集→push→他端末でpull**」。同時編集は競合のもと。
- ✅ **ES5で書く**（`const`/`let`/アロー関数/テンプレート文字列は使わない）。iOS Safari互換のため。
- ✅ コミット前に**括弧の対応チェック**:
  ```bash
  python3 -c "s=open('index.html').read();print(s.count('{')==s.count('}'), s.count('(')==s.count(')'))"
  ```
- ✅ push権限（＝デプロイ）は各端末で**初回だけGitHub認証**（ブラウザ系はOAuth、ローカルGitは Personal Access Token か SSH鍵）。
- ✅ Firebase APIキーはコードに入っていてOK（公開前提）。GitHubのシークレット警告は「クライアント利用」で無視可。セキュリティは Firestoreルール＋認証で担保。

---

## 6. デプロイ確認
push後、数分で反映。ライブのバージョンを確認:
```bash
curl -s "https://hktymc18.github.io/groove-map/index.html?cb=$RANDOM" | grep -o 'versionTag[^>]*>v[0-9]\{3\}'
```
スマホPWAは**一度完全に閉じて再起動**すると最新になる（右上のバージョン表示で確認）。
