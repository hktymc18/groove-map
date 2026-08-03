# カレンダー＆ToDo 引き継ぎ書（web版Claude用）

GROOVE MAP の予定タブを「Googleカレンダー代替＋リマインダー風ToDo」に刷新するプロジェクト。
**CAL-1（月間カレンダー刷新）は v285 で実装済み**。残りは CAL-2 → CAL-3 → CAL-4。

## ⚠️ 作業前の鉄則（過去に事故あり・必読）
1. **編集前に必ず GitHub の main から最新の index.html / sw.js を取得し直す**。手元の古いコピーを丸ごとアップロードすると他の作業が消える（v264ベース上書き事故が実際に起きた）。右上の `>vNNN<` が本番 https://hktymc18.github.io/groove-map/ と同じか確認してから編集開始。
2. **バージョン更新は3点セット**：`index.html` の `>vNNN<`（versionTag）と `DATA_VERSION = 'vNNN'`、`sw.js` の `groove-map-vNNN` を同じ新番号に（例: 全ファイルで v285→v286 置換）。
3. **ES5のみ**（iOS Safari対策）：`const`/`let`/アロー関数/テンプレートリテラル/分割代入は禁止。`var` と `function` で書く。
4. **コミット前検証**：`{`と`}`、`(`と`)` の個数一致を確認。可能ならscriptブロックを `Function(code)` でパース。
5. `renderCurrentView()` はデバウンス版。**直接 `_renderCurrentViewNow()` を呼ばない**。
6. Firestoreルール（firestore.rules）を変えたら、オーナー（山内さん）にコンソール反映を依頼（pushだけでは反映されない）。
7. Mac版Claude Codeと並行開発中。着手時にユーザーへ「CAL-◯をやる」と宣言し、同じ領域を同時に触らない。

## デザインシステム「SUMMIT」（必ず従う）
- ダークネイビー基調。CSS変数を使う: `--bg:#0B0E15 --surface:#141A28 --surface2:#1B2232 --border:#232B3D --text:#F4F6FB --text-mid:#AAB6CF --text-dim:#7E8AA6`
- **行動色 `--accent:#2CE5B8`（ボタン・進捗）と報酬色 `--gold:#FFB454`（XP・達成）を混ぜない**
- 情報=`--go-sky:#5AD7FF` / 危機=`--go-rose:#FF5D73` / 特別=`--purple:#8B7CFF`
- 角丸: カード16px・コントロール10px。グローは報酬の瞬間だけ。ライトテーマ（body.light）でも破綻しないこと。

## 既存データモデル（予定・タスク）
```
state.events[] = {
  id, title, date:'YYYY-MM-DD', time:'HH:MM', endTime?, type:'task'|'event',
  done, completedAt, memberId, categoryId, priority:'high'|'normal',
  memo?, deleted, updatedAt
}
保存: saveEventDoc(e) → maps/{uid}/events/{id}（1件1ドキュメント）
読込: loadEvents(uid) / 保存先uid: eventsUid()（共有編集中はオーナー）
カテゴリ: findCategory(id) → {id,name,color}
```

## CAL-1で入れたもの（v285・触る時の前提）
- `evBarHtml(e)`: セル内チップ（時刻`<b>`+タイトル・カテゴリ色tint+左ボーダー・完了は取り消し線）
- `renderCalendar()`: MAXBARS=7、`_calSelDate` 未選択なら今日を自動選択
- `renderCalDayList()`: 選択日の予定を **#evDayPanel**（グリッド直下のインラインパネル）に描画。旧 #evDaySheet（ボトムシート）は廃止済み（要素は残存・display:none）
- CSS: `.ev-day-panel` 系 / `.ev-bar` 系 / `#view-events #evCalGrid{grid-auto-rows:auto}`

---

# 残タスク

## CAL-2: テンプレ機能＋MAP連動（次にやる・優先）

### 目的
「日付選択→テンプレ選択だけで内容・時間・通知がデフォルト設定」（要件3）＋完了→MAP実績への自動還元。

### データ
```
maps/{uid}/meta/evTemplates = { items: [
  { id, name:'CT', emoji:'☕', type:'event', durationMin:60, defaultTime:'',
    notifyOffset:15, titleTpl:'{name}CT', categoryId:'', stage:'ct', memo:'' }
]}
初期テンプレ（stageはGL_STAGESのキーに対応）:
  📲CT取り(stage:ctget,30分) / ☕CT(ct,60分) / 🎤FT(ft,60分) /
  🎓PG同席(pg,120分) / 🎪DLR動員(dlr,180分) / 🏛ミーティング(stage無し,60分)
```

### UX
1. `openEventModal`（新規追加時）と「＋この日に追加」シートの**最上部にテンプレチップ列**を表示。タップで title/time/endTime/type/通知/カテゴリ をプリフィル
2. **メンバー選択（evMember）と連動**: titleTpl の `{name}` をメンバー名に置換（例: ななみ選択→「ななみCT」）。メンバー未選択なら `{name}` は空
3. チップ長押し（またはチップ横の✎）でテンプレ編集モーダル（名前/絵文字/種別/所要分/通知/雛形/対応ステージ）。「＋テンプレ作成」も
4. **メンバー情報パネル**（`memberInfoHtml`）に「＋予定を入れる」ボタン → `openEventAdd(memberId)` でテンプレチップ付きモーダル

### 完了→MAP還元（最重要・差別化ポイント）
`toggleEventDone` で done=true になった時:
- `e.templateStage`（作成時にテンプレのstageを保存しておく）があり、**自分のMAP**（`!viewingOwnerUid`）で、`!e.rewarded` なら:
  - `state.goals.plan.dailyActuals[完了日][stage]++`（`quickRecord(stage)` の中身を関数分離して再利用可）
  - XP付与（`GAME_XP[stage]`・`gameXpFloat`）、`e.rewarded=true` 保存（二重加算防止）
  - stage が ct/ft の場合、トースト後に「OL記録つける？」→ `openOlRecordModal(e.memberId)`（memberId がある時のみ）

### 実装アンカー
- モーダル: `openEventModal(id, memberId, date)` / 保存処理はその近辺の save 関数
- クイック記録の実体: `quickRecord(stage)`・`GAME_XP`・`gameXpFloat`・`gameCheck`
- OLポップアップ: `openOlRecordModal(mid, editIdx?)`

## CAL-3: ToDoビュー刷新（リマインダー風）

- 予定タブのセグメント（アジェンダ/カレンダー切替のある `renderEvents` / `renderAgenda`）のアジェンダ側を刷新:
  - 最上部に**即入力ボックス**（入力してEnter→今日のタスクとして即作成・type:task）
  - グループ: 期限切れ / 今日 / 次の7日間 / ⭐星付き / 日付なし / 完了済み
  - **完了済みの月別アーカイブは実装済み**（v282 `.ev-mgrp` details折りたたみ）— 壊さない
- **星付き**: `e.star` boolean。evItemHtml に☆トグル追加
- **サブタスク**（要件4）: `e.subtasks:[{id,t,done}]`。編集モーダルにチェックリスト編集UI、`evItemHtml` の親カードに進捗「2/4」＋ミニバー表示。サブタスク完了もチェックできる（一覧では親展開時）
- リスト分け（マイリスト等）は任意（工数次第で後回し可）。`e.listId` + `maps/{uid}/meta/evLists`

## CAL-4: Push通知（FCM・最後）

前提: **オーナーがFirebaseをBlazeプランに切替**（無料枠内・コンソール作業）+ Cloud Messaging の VAPID鍵取得。

1. クライアント: `firebase-messaging-compat.js` 追加。設定画面（プロフィールモーダル）に「🔔通知を有効にする」ボタン → `Notification.requestPermission()` → `messaging.getToken({vapidKey})` → `users/{uid}/fcmTokens/{token}` に保存（ua, updatedAt）
2. sw.js: `importScripts('firebase-app-compat.js','firebase-messaging-compat.js')` + `onBackgroundMessage` で表示
3. 予約: イベント保存時に `notifQueue/{autoId}` = {uid, eventId, fireAt(ISO), title, body} を書く（notifyOffset から算出）。編集/削除時は該当キューも更新/削除
4. サーバー: Cloud Functions（スケジュール実行・5分毎）で `fireAt <= now` を検索 → 対象uidの全トークンへ send → キュー削除。コードは `functions/` ディレクトリを新設
5. firestore.rules: notifQueue は本人のみ write / functions(admin) が read-delete
6. iOS注意: ホーム画面追加済みPWA + iOS16.4+ のみ。許可ダイアログは**ユーザー操作起点**でしか出せない

## 参考（このリポジトリの他ドキュメント）
- `GAME_ROADMAP.md` … ゲーム化全体設計（Phase 0〜N。CはチームフィードでCAL-4のFCM基盤と相性が良い）
- `DEV.md` … 開発環境・デプロイ手順
- 通知/カレンダーのUI参考: Lifebear（ユーザー提供のスクショに基づく。ラベル・サブタスク等の有料機能は本アプリでは無料提供、広告なし、スタンプ機能は不採用）

## 完了条件チェックリスト（各CALリリース時）
- [ ] 最新mainから編集した（versionTag一致を確認した）
- [ ] ES5のみ / 括弧バランスOK
- [ ] バージョン3点セットを+1した
- [ ] ライト/ダーク両テーマで表示確認
- [ ] 共有MAP閲覧中（viewingOwnerUid あり）に副作用がない（XP還元は自分のMAPのみ等）
- [ ] 既存データ（events/テンプレ無しユーザー）で壊れない
