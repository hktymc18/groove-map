# セミナー受付・稼働率管理システム 設計書 v2（BASE CHECK-IN）

v2 の変更点: 所属ユニオン項目の追加（ユニオンごとの名簿・集計）、イベントの月単位管理、
複数ユニオン合同イベント対応。既存の users プロフィール（union / role / status）と
認証基盤をそのまま利用する設計に変更。

## 1. 現状の整理（ANTARES.numbers の分析結果）

- **QRコードSS シート**: 約2,200名の名簿マスタ（QRコード番号・氏名・UPBD系列・性別）
- **日付別シート**: 受付でQRカードをスキャン → 番号がA列に入力 → VLOOKUP で氏名・系列
  → COUNTIF で系列別集計
- 稼働率は別の稼働表 Numbers に手転記、MAP の actRate にも手入力（計3回入力）
- 出欠方式は受付スキャンを継続（当日パスワード方式は不採用と決定済み。
  スマホ画面のQRは現行リーダーで読めることを確認済み）

## 2. 全体像

受付用Webアプリ（`checkin/index.html`、GitHub Pages 配信）がスキャン結果を直接
Firestore に書き込む。稼働率はユニオン×月で自動計算され、MAP が読んで actRate に反映。

```
[受付端末] スキャン ──▶ checkinEvents/{id}/attendance   [Firestore]
    リアルタイム集計 ◀── onSnapshot        │
                              月次集計（ユニオン×月）
                                          │
                MAP「稼働率取込」 ◀────────┘ （フェーズ3）
```

- MAP と同じ Firebase プロジェクト（hotlist-21865）・同じログインアカウントを使う
- コレクションは MAP と完全に分離した checkin* 名前空間（既存データには触れない）
- 技術構成: シングルファイル HTML + Firebase compat SDK + GitHub Pages（MAPと同じ）

## 3. ユニオンと権限（既存基盤の再利用）

既存の `users/{uid}` プロフィールがすでに `union`（所属ユニオン名）と
`role`（'admin' = ユニオンリーダー）、`status` を持っているため、
**受付システム独自のアカウント・権限管理は作らない**。

| 役割 | 判定 | できること |
|---|---|---|
| オーナー | 固定UID | 全ユニオンの全操作、ユニオン切替 |
| ユニオン管理者 | role=='admin' かつ 同ユニオン | 自ユニオンの名簿編集・イベント作成/削除・集計 |
| 受付スタッフ | 同ユニオンの有効メンバー（roleは問わない） | 参加ユニオンのイベントの受付（出席の記録） |

- 受付スタッフは MAP と同じアカウントでログインするだけ。管理者権限は不要
- 新しいユニオンの横展開 = そのユニオンの管理者がログインして「ユニオンを有効化」
  （checkinUnions にドキュメントを1件作成）→ 名簿CSVインポート → 運用開始

## 4. データベース設計

### 4.1 コレクション（すべて新設。既存の unions/{un}/events は MAP の予定共有用なので不使用）

```
checkinUnions/{unionName}               … 受付システムで有効化されたユニオン
  name, area, createdBy, createdAt

checkinMembers/{memberId}               … 名簿（全ユニオン共通のトップレベル）
  no,                                   … memberId = 既存QRコード番号（例 "412211"）
  union,                                … 所属ユニオン名 ★v2で追加
  name, kana, group（UPBD系列）, gender,
  active: true

checkinEvents/{eventId}                 … イベント（トップレベル・合同対応）
  month: "2026-09",                     … 月単位管理のキー ★v2
  date:  "2026-09-01",
  name:  "SYS",
  hostUnion: "ANTARES",                 … 主催ユニオン
  unions: ["ANTARES", "OTHER"],         … 参加ユニオン。合同はここに複数 ★v2
  createdBy, createdAt

checkinEvents/{eventId}/attendance/{memberId}
  no, name, group,
  union,                                … 本人の所属ユニオン（集計の分離キー）
  method: "scan" | "manual" | "guest",
  guest: true?,                         … 名簿外ゲスト（IDは "g<timestamp>"）
  at, by
```

設計判断:

- **名簿をトップレベルに置く理由**: QRコード番号は組織全体で一意なので、合同イベント
  の受付で「どのユニオンの人でも1回のスキャンで解決」できる。ユニオンごとの管理は
  `where union == X` で行う
- **イベントをトップレベルに置く理由**: 合同イベントは特定ユニオンの所有物ではない。
  `unions` 配列に参加ユニオンを持たせ、各ユニオンの月次集計では
  「自ユニオンが参加したイベント」だけが分母になる
- **出席レコードに union を非正規化**: 合同イベントの出席を1クエリでユニオン別に
  分けられる
- 出席者数のカウンタはイベントに持たせず、count() 集計クエリで取得
  （受付スタッフにイベント更新権限を与えずに済む）

### 4.2 月単位の管理と稼働率

- イベントは `month` フィールドで月にグルーピング。画面は月送り（◀ 2026年9月 ▶）
- ユニオン U・月 M の集計:
  - 分母 `eventsHeld` = checkinEvents where month==M and unions array-contains U
  - 各メンバーの出席 = 各イベントの attendance where union==U
  - **稼働率 = 出席回数 ÷ eventsHeld × 100**
- 集計は画面表示時にクライアントで計算（イベント数〜15/月 × 出席数百件で十分軽い）

### 4.3 セキュリティルール（firestore.rules に追記済み）

```
function isCkAdmin(un) {   // オーナー or 同ユニオンの role=='admin'
  return isOwnerAdmin()
    || (signedIn() && profileExists(request.auth.uid)
        && profile(request.auth.uid).get('role','') == 'admin'
        && profile(request.auth.uid).get('union','') == un);
}

checkinUnions/{un}:      read=ログイン済 / create,update=isCkAdmin(un)
checkinMembers/{no}:     read=ログイン済 / write=isCkAdmin(そのメンバーのunion)
checkinEvents/{eid}:     read=ログイン済 / create,update,delete=isCkAdmin(hostUnion)
  attendance/{aid}:      read=ログイン済 /
                         write=参加ユニオン(unions配列)に所属する有効メンバー
```

⚠️ ルールは `firebase deploy --only firestore:rules` で公開が必要（追記のみで
既存アプリへの影響なし）。

## 5. 画面構成（checkin/index.html）

- **ログイン**: MAPと同じメール/パスワード。プロフィール未作成なら必須4項目
  （union/area/upRuby/upBd）の登録フォームを表示（既存ルールの要件）
- **受付**: イベントを選んで受付開始。全画面スキャン待ち（USBリーダー/手入力）、
  ピッ→氏名・系列・（合同時は所属ユニオンも）を大きく表示+効果音、重複警告、
  ゲスト受付。サイドにリアルタイム集計（合計/ユニオン別/系列別/履歴）。
  Firestoreオフライン永続化で電波が悪くても受付継続
- **名簿**: ユニオン切替つき一覧（全員閲覧可・編集はそのユニオンの管理者のみ）。
  検索・追加・編集（オーナーは所属ユニオンの付け替えも可）・無効化・削除・
  チェックボックスによる選択削除・全削除、CSVインポート（取込先ユニオンを明示、
  オーナーは選択可）/エクスポート、オーナー用「＋ユニオン」追加
- **イベント**: ユニオン切替つきで月送り一覧（日付・名称・出席数・合同バッジ）。
  単独開催はそのユニオンのみ、合同は全参加ユニオンの画面に表示。作成は
  表示中ユニオンが主催（管理者のみ）、受付開始は参加ユニオンのメンバーとオーナー、
  削除は主催ユニオンの管理者のみ
- **集計**: ユニオン切替つきで月送り。開催数/のべ出席/平均稼働率、系列別のべ出席、
  メンバー×イベントの出席マトリクス+稼働率、CSV出力

オーナーはヘッダーのユニオン切替で操作の基準ユニオンをまとめて変更できる。

## 6. MAP 連携（フェーズ3）

MAP 側に「稼働率取込」ボタンを追加。当月の checkinEvents/attendance を読んで
稼働率を計算し、MAP の現状メンバーと姓+名で自動マッチング（不一致は手動ヒモ付け →
checkinMembers.mapLink に保存）。変更プレビュー後に actRate を一括更新。
同一プロジェクト・同一認証のためサーバー処理は不要。

## 7. QRカードの発行と管理（フェーズ2）

- スマホ会員証: 会員ごとの固有カードURL（`cards/{token}` に公開読取ドキュメント、
  トークンは推測不能な乱数）。リンクを送るだけで発行完了、ログイン不要、
  PWAで圏外でも表示。再発行=トークン差し替え、無効化=ドキュメント削除
- 紙が必要な人には名刺サイズ10面付けA4のPDF一括生成
- 既存の紙カードは番号がそのまま有効。回収・再発行不要

## 8. 移行手順

1. ブランチをマージして GitHub Pages に checkin/ を公開
2. `firebase deploy --only firestore:rules` でルール公開
3. オーナーでログイン → ANTARES を有効化
4. 名簿CSV（ANTARES.numbers の QRコードSS から抽出済み）をインポート
5. 1〜2回のセミナーで Numbers と並行運用 → 集計一致を確認して切替

## 9. ロードマップ

| フェーズ | 内容 | 状態 |
|---|---|---|
| 1. MVP | 受付・名簿・イベント（月単位/合同）・集計、ユニオン権限 | 実装済み（checkin/index.html） |
| 2. スマホ会員証 | カードURL発行・再発行・無効化、紙カードPDF | 未着手 |
| 3. MAP連携 | 「稼働率取込」で actRate 自動反映 | 未着手 |
| 4. 横展開強化 | ユニオン向けオンボーディング画面、権限の細分化 | 未着手 |

## 10. 未確定事項

1. 稼働率の分母の定義（当月全開催で実装済み。対象セミナー限定などのルールが
   あれば調整）
2. 「NA」「他」「大分・北九州」など名簿外カテゴリの扱い
3. 受付スタッフに名簿編集権限を与えるか（現状は管理者のみ）
