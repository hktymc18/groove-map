# GROOVE MAP 引き継ぎドキュメント

## プロジェクト概要
- **ツール名**: GROOVE MAP（組織管理ツール）
- **形式**: HTMLシングルファイル
- **現バージョン**: v110
- **公開URL**: https://hktymc18.github.io/groove-map/
- **GitHubリポジトリ**: https://github.com/hktymc18/groove-map.git
- **Firebaseプロジェクト**: hotlist-21865

## デプロイ方法
```bash
cp ~/Downloads/groove_map_full.html ~/Desktop/groove-map/index.html && cd ~/Desktop/groove-map && git add . && git commit -m "update" && git push
```

## Firebase設定
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBHLz19p4wsSi043V0hhE-Crjwv6VBKBro",
  authDomain: "hotlist-21865.firebaseapp.com",
  projectId: "hotlist-21865",
  storageBucket: "hotlist-21865.firebasestorage.app",
  messagingSenderId: "565556414915",
  appId: "1:565556414915:web:f8c3489260e8d9d6e49576"
};
```

## Firestoreデータ構造
```
users/{uid}                          → プロフィール（name, org, area, union, email）
maps/{uid}/months/{month}_current    → 現状MAPメンバー
maps/{uid}/months/{month}_ideal      → 理想MAPメンバー
maps/{uid}/stats/{month}             → stats, commission, freshData
maps/{uid}/shared/{safeEmail}        → 共有設定
sharedWith/{safeEmail}/from/{uid}    → 受け取り側の共有情報
```

## Firestoreセキュリティルール
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /maps/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/sharedWith/$(request.auth.token.email.replace('.','_').replace('@','_'))/from/$(uid));
    }
    match /sharedWith/{email}/from/{ownerUid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## タブ構成（順番）
現状 → 理想 → OL → データ → 差分

## 主要機能

### 認証
- Firebase Auth（メール/パスワード）
- 新規登録：名前・屋号・活動地域・所属ユニオン
- ヘッダー左上をタップでプロフィール編集モーダル

### 現状/理想MAP（モバイル）
- カードリスト表示（縦ライン＋インデントで系列識別）
- ダブルタップで編集、FABで追加
- 段数フィルター（検索欄上）
- 研修生：水色ボーダー
- 流れた：グレーアウト、ユーザー：ブルーグレーアウト

### 現状/理想MAP（PC、768px以上）
- 楕円形SVGマップ表示
- 右クリックで「直下に追加/編集/削除/Instagram」メニュー
- ノードをドラッグで位置調整
- 背景ドラッグでスクロール
- ズームコントロール（右上の−/⊡/＋）
- Ctrl+ホイールでズーム
- 初期表示は全体フィット

### メンバーデータ構造
```javascript
{
  id, parentId, lastName, firstName, gender,  // male/female
  title,        // BR/ゴールド/LOI等
  activity,     // S/A/B/C
  actRate,      // 稼働率%
  morale,       // 1=🌱 2=💪 3=🔥（デフォルト1）
  ptCurrent, ptFixed,
  mapType,      // current/ideal/both
  trainee,      // boolean
  traineeHistory: [{status, date, aSan, result}],  // result: 'next'|'left'
  traineeResult, // BC/ユーザー/流れた
  traineeStatus, // 最新ステータス（自動）
  instaUrl, memo
}
```

### OLタブ
- フレッシュリスト（＋追加、タグ色分け、パネル展開）
- 金の船リスト（＋追加、タスク管理、チェックでグレーアウト）
- 3〜7人のアウトライン（対象者複数追加、完了チェック）

### データタブ
- 月次推移（12ヶ月、手入力＋自動集計）
- チャート（選択した行をグラフ表示）
- パワーライン（LTSV 5000P以上自動表示）
- 研修生ファネル（traineeHistoryベース）
- Aさん別決定率（resultベース転換率）

### 共有機能
- 共有する側：共有ボタン→メールアドレス追加
- 受け取る側：ログイン後ヘッダーにボタン表示→切り替え

### 月コピー
- 「→翌月」ボタンで当月データを翌月にコピー

## 重要な実装メモ

### ES5準拠（iOS対応）
- バッククォート・アロー関数・const/let・async/await不可
- querySelectorAll→Array.prototype.slice.call()

### localStorage完全無効化
- Firebase接続時はlsSave/lsLoadは何もしない
- 全データFirestoreから読み込み

### 自動保存
- メンバー追加/編集/削除時に自動でFirestoreに保存
- autoSave()関数を使用

### PC MAP レンダリング
- renderPCMap(mapType)でSVG描画
- subtreeSize比で扇形を分割してノードが重ならないよう配置
- スクロール可能なコンテナ内にSVGを配置
- window._pcCustomPos でドラッグ位置を保持

### バージョン管理
- DATA_VERSION変数とヘッダーのversionTag divで表示
- 両方を更新すること

## よくある問題と対処

### データが消える
→ fsSaveToFirestoreがfreshDataを含んでいるか確認

### 二重表示
→ renderTree内でskipChildren=trueをルートに渡しているか確認

### PC MAPが表示されない
→ isPCMode()がtrueか、requestAnimationFrameで遅延しているか確認

### コンテキストメニューが2回目以降出ない
→ closeCtxMenuで_ctxTargetId=nullにする前にIDを別変数に保存

## 開発継続時の注意
1. 構文チェック必須: `node --check` でエラーがないこと
2. 括弧バランス確認: `{`と`}`の数が一致すること
3. バージョンを上げること（DATA_VERSION + versionTag両方）
4. ES5で書くこと（const/let/アロー関数禁止）
