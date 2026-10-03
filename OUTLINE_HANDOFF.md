# アウトライン機能 引き継ぎ資料（ATTACK LIST → GROOVE MAP / NAVIGATOR）

作成日: 2026-10-04

ATTACK LIST（`hktymc18/hotlist` の `index.html`）に一度実装したアウトライン機能を、GROOVE MAP（`hktymc18/groove-map`）の
**メンバー編集 →「活動」タブ**（`#mePageTask`）に移すための資料。ATTACK LIST 側からは機能ごと削除済み（v9）。

この資料だけで実装できるように、出力仕様・データの形・標準フォーマット・ES5 の文面生成コード・入力画面の仕様・確認用の入出力例をまとめている。

---

## 1. 何をする機能か

アウトライン分の前に共有する文面を、項目を埋めるだけで作る。最後に「コピー」で下の形のテキストになり、LINE などに貼る。

```
10月5日 アウトライン分
日時:10月5日 19:00

◾️テーマ
月初の振り返り

◾️場所
天神

◾️参加者
B:（記入者）
C:田中 花子
　キャリア:2ヶ月目 / タイトル:B3 / 稼働:A / 稼働率:80%
　（2人目のC）
　キャリア:半年 / タイトル:BM

＜対象者現状＞
・キャリア　2ヶ月目
・タイトル　B3
・稼働　A

【課題】
・優先順位：ハウディに来ない

【伝えていただきたい事】
・改善改良のスピードを上げる

【望む結果】
・自分で動けるようになる

【御礼】
よろしくお願いします

BASE REVE   （記入者の名前）
```

### 出力のルール

- **入力のある項目だけ**出す。空の項目は見出しごと出さない。項目のかたまりは空行1つで区切る。
- 1行目は `M月D日 アウトライン分`、2行目は `日時:M月D日 HH:MM`（時刻が空なら日付だけ）。日付が空ならこの2行ごと出さない。
- 参加者: `B:名前`、`C:名前`。Cの2人目以降は行頭を全角スペースにする（`C:` は付けない）。
  Cの下の行に `キャリア / タイトル / 稼働 / 稼働率` を ` / ` 区切りで、入力のあるものだけ出す。
- **A の欄は無い**（ユーザー指定）。B は記入者（ログイン中の人）。
- `＜対象者現状＞` は、**先頭の C** のキャリア・タイトル・稼働を自動で先頭に出し、その後に自由記述の行を続ける。
  自動行も自由記述も無ければ見出しごと出さない。
- 末尾の署名は `ユニオン名＋半角スペース3つ＋記入者名`。

---

## 2. データの形

1件のアウトライン = `{ tpl, v, union, writer, createdAt, updatedAt }`

- `tpl`: 作成時点のフォーマット（項目定義の配列）の**コピー**。フォーマットを後から変えても、作成済みの分が崩れないようにするため。
- `v`: 項目 key → 値。値の形は項目のタイプで決まる。

| type | 値の形 | 例 |
|---|---|---|
| `datetime` | `{ date:'YYYY-MM-DD', time:'HH:MM' }` | `{ date:'2026-10-05', time:'19:00' }` |
| `text` / `textarea` | 文字列 | `'月初の振り返り'` |
| `bullets` | 文字列の配列（空文字の行は出力しない） | `['優先順位：ハウディに来ない', '']` |
| `participants` | `{ b:'記入者名', c:[ C, … ] }` | 下記 |
| `section` | 値なし（入力画面の見出し。出力しない） | |

`C` 1人分: `{ name:'田中 花子', career:'2ヶ月目', titles:['B3'], activity:'A', percent:'80' }`

- `titles` は配列（入力はプルダウンで1つ選ぶ。出力は `・` でつなぐので複数でも動く）。
- `percent` は数字の文字列。空は `''`。

項目定義のプロパティ:

| プロパティ | 意味 |
|---|---|
| `key` / `label` / `type` | 項目のキー・表示名・タイプ |
| `fmt` | 出力の形。`head`=1〜2行目、`square`=`◾️見出し`、`angle`=`＜見出し＞`、省略=`【見出し】` |
| `options` | `participants` のタイトルの選択肢 |
| `rows` | `bullets` で最初に用意する空行の数 |
| `presets` | `bullets` の定型文ボタン。`'見出し　例：例文'` と書くと例文つき（下記 4.3） |
| `withTarget` | `true` なら先頭の C のキャリア・タイトル・稼働を自動で先頭に出す |
| `reset` | 「前回から作成」をするなら、引き継がずに空に戻す項目 |

---

## 3. 標準フォーマットと文面生成（ES5・そのまま使える）

GROOVE MAP は ES5 で書く決まりなので ES5 にしてある。ATTACK LIST の出力と**文字単位で一致**することを確認済み（6 章の例）。

```js
// ===== アウトライン：標準フォーマット =====
var OUTLINE_TITLES = ['BD','D','E','R','L','G','BR','Q4','Q3','Q2','LOI',
                      'B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11','BM'];
var OUTLINE_ACTIVITY = ['S','A','B','C'];
var OUTLINE_TPL_DEFAULT = [
  { type:'section', label:'日時・場所' },
  { key:'when',  label:'日時',   type:'datetime', fmt:'head', reset:true },
  { key:'theme', label:'テーマ', type:'text', fmt:'square', reset:true },
  { key:'place', label:'場所',   type:'text', fmt:'square', reset:true },
  { type:'section', label:'参加者' },
  { key:'members', label:'参加者', type:'participants', options:OUTLINE_TITLES, fmt:'square' },
  { key:'current', label:'対象者現状', type:'bullets', rows:1, fmt:'angle', withTarget:true },
  { type:'section', label:'内容' },
  { key:'issues', label:'課題', type:'bullets', rows:2, presets:[
    '優先順位　例：優先順位の重要性をわかっておらず、ハウディに来たり来なかったりする',
    '確信が低い　例：紹介者しか見ておらず、確信が低い',
    '報連相　例：自己流で行動しており、うまくいっていない',
    '行動量　例：条件付けがかかっており、数人にしか伝えていない',
    'オウンシップ　例：紹介者され気分で、オウンシップがない'] },
  { key:'messages', label:'伝えていただきたい事', type:'bullets', rows:2, presets:[
    '改善改良のスピードを上げる','自分で考えて動く','STを活用する','次に話せるネタを持つ'] },
  { key:'goals', label:'望む結果', type:'bullets', rows:2, presets:[
    '自分で動けるようになる','自分で話せるようになる','次回の動きが変わる','業績につなげる'] },
  { key:'thanks', label:'御礼', type:'textarea' }
];

// 定型文「見出し　例：例文」→ { label, eg }
function olPreset(str) {
  var m = String(str).match(/^(.*?)[\s　]*例[:：]\s*(.*)$/);
  return (m && m[1]) ? { label: m[1].replace(/^\s+|\s+$/g, ''), eg: m[2].replace(/^\s+|\s+$/g, '') }
                     : { label: String(str).replace(/^\s+|\s+$/g, ''), eg: '' };
}

function olTrim(s) { return String(s == null ? '' : s).replace(/^[\s　]+|[\s　]+$/g, ''); }

// アウトライン1件 → 共有用テキスト
//   sheet = { tpl:[項目定義], v:{ 項目key: 値 }, union:'BASE REVE', writer:'記入者名' }
//   入力のある項目だけを、空行で区切って出す
function outlineToText(sheet) {
  var tpl = sheet.tpl || OUTLINE_TPL_DEFAULT, v = sheet.v || {};
  var blocks = [], target = null, i;
  for (i = 0; i < tpl.length; i++) {
    if (tpl[i].type === 'participants') { target = ((v[tpl[i].key] || {}).c || [])[0] || null; break; }
  }
  tpl.forEach(function (f) {
    if (f.type === 'section') return;
    var val = v[f.key], lines = [];
    if (f.type === 'datetime') {
      if (!val || !val.date) return;
      var p = val.date.split('-');                       // 'YYYY-MM-DD'
      var md = parseInt(p[1], 10) + '月' + parseInt(p[2], 10) + '日';
      blocks.push([md + ' アウトライン分', f.label + ':' + md + (val.time ? ' ' + val.time : '')]);   // time = 'HH:MM'
      return;
    }
    if (f.type === 'participants') {
      val = val || {};
      if (olTrim(val.b)) lines.push('B:' + olTrim(val.b));
      var started = false;
      (val.c || []).forEach(function (x) {
        var name = olTrim(x.name), meta = [];
        if (olTrim(x.career)) meta.push('キャリア:' + olTrim(x.career));
        if (x.titles && x.titles.length) meta.push('タイトル:' + x.titles.join('・'));
        if (x.activity) meta.push('稼働:' + x.activity);
        if (x.percent !== '' && x.percent != null) meta.push('稼働率:' + x.percent + '%');
        if (!name && !meta.length) return;
        lines.push((started ? '　' : 'C:') + name);    // 2人目以降は全角スペースで字下げ
        started = true;
        if (meta.length) lines.push('　' + meta.join(' / '));
      });
      if (lines.length) blocks.push(['◾️' + f.label].concat(lines));
      return;
    }
    if (f.type === 'bullets') {
      if (f.withTarget && target) {                      // 先頭のCのキャリア・タイトル・稼働を自動で出す
        if (olTrim(target.career)) lines.push('・キャリア　' + olTrim(target.career));
        if (target.titles && target.titles.length) lines.push('・タイトル　' + target.titles.join('・'));
        if (target.activity) lines.push('・稼働　' + target.activity);
      }
      (val || []).forEach(function (s) { if (olTrim(s)) lines.push('・' + olTrim(s)); });
      if (lines.length) blocks.push([(f.fmt === 'angle' ? '＜' + f.label + '＞' : '【' + f.label + '】')].concat(lines));
      return;
    }
    var s = olTrim(val);                                 // text / textarea
    if (!s) return;
    blocks.push([(f.fmt === 'square' ? '◾️' + f.label : '【' + f.label + '】'), s]);
  });
  if (olTrim(sheet.writer)) blocks.push([olTrim((sheet.union || '') + '   ' + sheet.writer)]);
  return blocks.map(function (b) { return b.join('\n'); }).join('\n\n');
}
```

---

## 4. 入力画面の仕様（ATTACK LIST での実装）

### 4.1 参加者

- **B**: テキスト入力。初期値は記入者の名前。
- **C**: 1人につき1つの枠。枠の中は
  - 名前（テキスト）
  - キャリア（テキスト。入力例「2ヶ月目」）
  - タイトル（プルダウン。選択肢は `options`。先頭に「未選択」）
  - 稼働（プルダウン。S / A / B / C。先頭に「未選択」）
  - 稼働率（数字入力、0〜100）
  - 枠の削除ボタン
- 「＋ Cを追加」で空の枠を足す（名前は自由入力）。

### 4.2 MAP 側でやってほしい自動入力

ATTACK LIST ではリストの人が C だったが、MAP ではメンバー編集で開いている**そのメンバーが C**。
メンバーのデータから次を初期値として入れると、手入力がほぼ要らなくなる。

| C の項目 | MAP の元データ |
|---|---|
| 名前 | メンバー名（`mcName(m)`） |
| キャリア | `activityMonths(m, state.currentMonth) + 'ヶ月目'` |
| タイトル | `m.title` |
| 稼働 | `m.activity`（S/A/B/C） |
| 稼働率 | `m.actRate` |

B は自分のプロフィール名、署名のユニオン名は自分のプロフィールの `union`。
自動で入れた値は手で直せるようにする（アウトラインは保存時点の値を持つので、後で MAP 側の値が変わっても文面は変わらない）。

### 4.3 定型文ボタン（課題・伝えていただきたい事・望む結果）

- 箇条書きの下に、`presets` の数だけ「＋ 見出し」ボタンを並べる。
- 押したときの動き:
  - 例文つき（`'優先順位　例：…'`）: 行に **`優先順位：`** を入れ、カーソルをその後ろに置く。続きを本人が書く。
    その行の下に `例：…` をうすい文字で出す（行が `優先順位：` で始まっている間だけ）。
  - 例文なし（`'STを活用する'`）: その文字をそのまま行に入れる。
  - 入れる先は最初の空行。空行が無ければ行を足す。同じものが既にあれば何もしない。
- 箇条書きの入力中に Enter で下に行を追加（日本語変換の確定 Enter は除く: `e.isComposing || e.keyCode === 229`）。

### 4.4 その他

- 日時は `<input type="date">` と `<input type="time">`。
- 入力のたびに自動保存（ATTACK LIST では 1.2 秒の間引き）。
- 「プレビュー」でコピー文を確認、「コピー」でクリップボードへ。

---

## 5. Firestore まわり

### 5.1 ユニオン別フォーマット（すでにルール反映済み・そのまま使える）

- パス: `unions/{ユニオン名}/cdata/outlineTemplate`
- 中身: `{ fields:[項目定義…], updatedAt, updatedBy:uid, updatedByName }`
- ルール（`firestore.rules` の `match /unions/{un}/cdata/{docId}`）: 読み=ログイン済み、書き=オーナー or そのユニオンの `role=='admin'`。
- 無ければ `OUTLINE_TPL_DEFAULT` を使う。妥当性チェック: `fields` が配列で、`type==='participants'` の項目を含むこと。
- ATTACK LIST 側の編集画面は削除したので、**このドキュメントを編集する画面は現在どこにも無い**。
  ユニオンごとにフォーマットを変える運用を続けるなら、MAP 側に編集画面が要る（項目の追加・削除・並べ替え、定型文、タイトルの選択肢）。
  要らなければ `OUTLINE_TPL_DEFAULT` 固定でよい。
- 同じ階層に `template`（CDATA）と `eventTemplate`（イベント用）がある。こちらは ATTACK LIST が使っているので触らないこと。

### 5.2 アウトラインの保存先（MAP 側で決める）

ATTACK LIST では人物ドキュメントの中に持っていた。MAP では未定。候補:

1. **メンバーに紐づく予定の一種として `maps/{uid}/events/{id}` に持つ**（おすすめ）。
   活動タブは OL・タスク・予定の統合タイムラインで、v567 で OL を「予定の一種」にまとめている。同じ作りに乗せれば、
   活動タブの並び・共有（`canSeeSchedule`）・カレンダー表示がそのまま効く。アウトラインの中身は予定ドキュメントに `outline:{ tpl, v }` として持つ。
2. `maps/{uid}/meta/` 配下にメンバー id をキーにして持つ。予定とは別管理にしたい場合。

どちらも既存ルールの範囲で書ける。

### 5.3 ATTACK LIST に残っている過去データ

- 場所: `users/{uid}/people/{personId}` ドキュメントの `outline` フィールド（`{ シートid: { kind:'outline', tpl, v, pf, po, writer, union, createdAt, updatedAt } }`）。
- 機能を出していた期間が短い（2026-10-03〜04）ので件数はわずかのはず。ATTACK LIST の画面からは見えなくなったが、データは消していない。
- 移行は不要と判断してよい。必要なら 3 章の `outlineToText` にそのまま渡せる形をしている。

---

## 6. 確認用の入出力例

```js
var sheet = { union:'BASE REVE', writer:'テスト太郎', tpl:OUTLINE_TPL_DEFAULT, v:{
  when:{ date:'2026-10-05', time:'' }, theme:'', place:'',
  members:{ b:'テスト太郎', c:[
    { name:'田中 花子', career:'2ヶ月目', titles:['B3'], activity:'A', percent:'80' },
    { name:'自由 入力', career:'半年', titles:['BM'], activity:'', percent:'' } ] },
  current:[''], issues:['優先順位：ハウディに来ない','行動量：'],
  messages:['改善改良のスピードを上げる',''], goals:['',''], thanks:'' } };
outlineToText(sheet);
```

期待する出力（ATTACK LIST の実装と一致）:

```
10月5日 アウトライン分
日時:10月5日

◾️参加者
B:テスト太郎
C:田中 花子
　キャリア:2ヶ月目 / タイトル:B3 / 稼働:A / 稼働率:80%
　自由 入力
　キャリア:半年 / タイトル:BM

＜対象者現状＞
・キャリア　2ヶ月目
・タイトル　B3
・稼働　A

【課題】
・優先順位：ハウディに来ない
・行動量：

【伝えていただきたい事】
・改善改良のスピードを上げる

BASE REVE   テスト太郎
```

`olPreset('優先順位　例：ハウディに来たり来なかったりする')` → `{ label:'優先順位', eg:'ハウディに来たり来なかったりする' }`
`olPreset('STを活用する')` → `{ label:'STを活用する', eg:'' }`

---

## 7. これまでに決まっていること（ユーザーの指定）

- C は対象の人、B は記入者（ログイン中の人）。A の欄は不要。
- タイトルの選択肢は `BD D E R L G BR Q4 Q3 Q2 LOI B1〜B11 BM`（B12 ではなく BM）。
- C にはキャリア欄がある（例：2ヶ月目）。タイトルと稼働はボタンではなくプルダウン。
- C の追加は名前の自由入力。追加した C にもキャリア・タイトル・稼働・稼働率を入れられる。
- 課題の定型文は 優先順位／確信が低い／報連相／行動量／オウンシップ の5つ。例文は 3 章の `presets` のとおり。
- フォーマットはユニオン管理者が後から変えられるようにしたい、という要望があった（5.1）。

## 8. MAP 側で決めること

1. 保存先（5.2）。
2. ユニオン別フォーマットの編集画面を MAP に作るか、標準フォーマット固定にするか（5.1）。
3. 1人のメンバーに対して、アウトラインを回ごとに残すか、1枚を上書きするか。
   ATTACK LIST の CDATA とイベント用は「1人1枚を上書き」に変更された（同じ運用にするかはユーザーに確認）。
4. 自動入力の元データ（4.2）は現状 MAP のデータで合っているか。特に稼働率は受付連携の集計値を使うかどうか。

## 参考: ATTACK LIST の元実装

`hktymc18/hotlist` のコミット `f545d4f`（v8、アウトライン削除の直前）の `index.html`。
`OUTLINE_TPL_DEFAULT`、`compactText`（文面生成）、`cdFieldHtml` の `case 'participants'`（参加者の入力欄）、`cdPreset`（定型文）を参照。
