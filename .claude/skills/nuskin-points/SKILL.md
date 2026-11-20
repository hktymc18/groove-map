---
name: nuskin-points
description: Nu Skin の会員サイト（販売組織 › グループ・チーム・BR のプロキシ）に出ているメンバーの GSV を、指定された月ごとに読み取り、NAVIGATOR（GROOVE MAP）の自分の MAP のその月に転記する。コネクタの Playwright で1か月分を1回の呼び出しで読み、NAVIGATOR に確認の一覧を出す。書き込みは本人が確認の一覧で押す。「Nu Skin のポイントを MAP に入れて」「6月〜11月の GSV を転記して」などで使う。
---

# Nu Skin のポイントを NAVIGATOR の MAP に転記する

コネクタの Playwright（`mcp__plugin_playwright_playwright__*`）で、月ごとに次を行う。

1. `ns_run.js`（このスキルのフォルダ）を1回実行する。中で Nu Skin のグループ・チーム・BR の人のプロキシを読み、まとめて、NAVIGATOR に確認の一覧を出す（1か月で約1分）。
2. 本人が確認の一覧で「書き込む」を押す。

名前は Claude の会話を通らない（`ns_run.js` が返すのは人数だけ）。Playwright のコネクタが無い時だけ、下の「Claude in Chrome で行う時」の手順を使う。

## 守ること

- **パスワードは入力しない。** Nu Skin でも NAVIGATOR でも、ログイン画面が出たら止めて、本人に Playwright の窓でログインしてもらう。
- **Nu Skin では読むだけ。** メール・ダウンロード・送信・登録内容の変更などのボタンは押さない。押してよいのは次だけ（`ns_run.js` もこれだけを押す）。
  - 月・レベルのプルダウン
  - 「ポイントあり」のチェック
  - 人の名前（プロキシを開く時）と「プロキシ」のタブ
  - 閉じる（×）
- **人の「詳細」（住所・電話・メール）は読まない。** 人の名前を押すと、最初に「詳細」タブが開く作りになっている。`ns_run.js` は中身を読まずにすぐ「プロキシ」に切り替える。Claude も、この間に画面写真（`browser_take_screenshot`）やページの読み取り（`browser_snapshot`）をしない。
- **読んだ名前や数字をファイル・リポジトリ・メモリに残さない。** 人の名前を会話に出すのは、本人に聞かれた時だけ。
- **書き込みは本人が確認の一覧で押す。** Claude が `nsSave()` を呼んだり、ボタンを押したりしない。
- 予想と違う結果が出たら、推測で進めずに止めて聞く。

## 準備

1. Playwright のツールを読み込む（`ToolSearch` で `select:mcp__plugin_playwright_playwright__browser_run_code_unsafe,mcp__plugin_playwright_playwright__browser_tabs`）。見つからない時は、本人に「Claude のアプリで Playwright のコネクタ（プラグイン）を有効にしてください」と伝える。
2. 頼まれた月を「2026.06」のような形にそろえて、古い順に並べる。月の指定が無ければ今月だけにする。
3. Playwright の窓は本人にも見える。ログインはその窓のプロフィールに残るので、2回目からはふつう要らない（Nu Skin はしばらくすると切れる）。

## 月ごとの手順

### a. 月を置く

`browser_run_code_unsafe` の `code` で、今のタブに月を置く（`ns_run.js` はここから月を読む）。

```js
async (page) => { await page.evaluate(() => { try { nsClose(); } catch (e) {} window.__nsArgs = { ym: '2026.06' }; }).catch(() => {}); return page.url(); }
```

タブがまだ1つも開いていない（`about:blank`）時も、そのままでよい。

### b. `ns_run.js` を実行する

`browser_run_code_unsafe` の `filename` に、`ns_run.js` の**絶対パス**（このスキルを読み込んだ時に出る「Base directory for this skill」＋ `/ns_run.js`）を渡す。中身を `code` に貼らない。

返り値（人数だけ）：

```
{ ym, group:{read,size,ok}, team:{read,size,ok}, proxy:[{read,size,ok}…], passed, ret, open, chg, same, none, nonePt, sec }
```

- `stop` がある時は止まっている。

  | `stop` | どうする |
  |---|---|
  | `login-nuskin` | 本人に「Playwright の窓の Nu Skin のタブでサインインしてください」と頼み、言われたら a からやり直す |
  | `login-navigator` | 本人に、同じ窓の NAVIGATOR のタブでログインしてもらう |
  | `not-enabled` | まだテスト中。オーナーに アカウント管理 › 新機能のテスト の「Nu Skin のポイントを取り込む」で「先に見られる人」に入れてもらう |
  | `not-own-map` | NAVIGATOR で自分の MAP を開いてもらう（共有された MAP では書き込めない） |
  | `group-no-month` など `-no-month` | その月が Nu Skin のプルダウンに無い。本人に伝えてその月は飛ばす |
  | `-read`・`-month`・`-not-clean`・`cannot-close` | 読めなかった。`diag`（作りだけで名前は入らない）を本人に見せ、「開発に渡してください」と伝える |
- `ok:false`（読んだ人数が「グループ サイズ」と違う）や `proxy` に `fail` がある時は、その事を本人に伝える。一覧は出ているので、書き込むかは本人が決める。
- `ret` が `'open'` か `'switching'` で `open:true` なら、確認の一覧が出ている。

### c. 本人の確認を待つ

本人に次のように伝える（数字は返り値から）。

> 「◯月の確認の一覧を Playwright の窓の NAVIGATOR に出しました。変わる人は◯人です。数字を見て、合っていれば『◯人の GSV を書き込む』を押してください。MAP で見つからない人（ポイントあり◯人）は、プルダウンで MAP の人を選べます（次から自動で合います）」

`chg` が 0 の時は「変わる人はいません（もう入っています）」と伝え、閉じてもらう。

本人が「書き込んだ」と言ったら、`browser_run_code_unsafe` で NAVIGATOR のタブの `window._nsLast` を読む。

```js
async (page) => { const p = page.context().pages().find((x) => /hktymc18\.github\.io/.test(x.url())); return await p.evaluate(() => window._nsLast || null); }
```

`ym` がその月なら書き込み済み。`off` が 1 以上の時は、MAP のつながりが Nu Skin と違う人がいる。本人が「閉じた」「この月はやめる」と言ったら、その月は飛ばす。

## 最後の報告

月ごとに、次を短く伝える。人の名前を並べるのは、本人に聞かれた時だけにする。

- 読んだ人数（グループ・チーム・プロキシ）と、画面の人数と合ったか
- 書き込んだ人数（`_nsLast.n`）
- MAP で見つからなかった人数（`none`、うちポイントあり `nonePt`）
- 合わなかった人数（`off`）
- かかった秒数（`sec`）

## Claude in Chrome で行う時（Playwright が使えない時だけ）

Claude in Chrome（本人の Chrome）で、同じことを1つずつ行う。往復が多く、1か月で数十分かかる。名前も会話を通る。

### 準備

1. スキル `chrome-browser` に従って Claude in Chrome のツールを読み込み、今開いているタブを確かめる。
2. 次の2つのタブを用意する（開いていなければ新しいタブで開く）。
   - Nu Skin：`https://www.nuskin.com/static/vgclient/#/salesOrganization/circleGroup`（チームのタブは `#/salesOrganization/executiveBreakaway`）
   - NAVIGATOR：`https://hktymc18.github.io/groove-map/`
3. NAVIGATOR のタブで次を実行し、`true` になることを確かめる。`false` なら本人にログインと自分の MAP を開いてもらう。`_nsOn()` だけが `false` の時は、まだテスト中で本人が「先に見られる人」に入っていない（オーナーが アカウント管理 › 新機能のテスト の「Nu Skin のポイントを取り込む」に入れる）。

   ```js
   typeof nsImport === 'function' && !!currentUser && !viewingOwnerUid && state.isEditor && _nsOn()
   ```

   Nu Skin は、表が見えていても月を変えた時にログイン画面（`/content/login/...`）へ移ることがある（ログインの期限切れ）。その時も止めて、本人にサインインしてもらう。

4. 頼まれた月を「2026.06」のような形にそろえて、古い順に並べる。月の指定が無ければ今月だけにする。

### 月ごとの手順

#### a. Nu Skin の画面をそろえる（グループタブ）

- 上の月のプルダウンを、その月（例「2026年 6月」）にする。
- 「レベル」を「全部」にする。
- 「ポイントあり」のチェックを外す。0ポイントの人も MAP の今の数字を 0 に直すため。
- 月とレベルは本物のプルダウン（`select`）。押したりキーを送ったりしても変わらないので、`find` で見つけて `form_input` で「2026年 6月」「全部」を選ぶ。月の「<」は押さない。
- 変えた後は、次の式で月・レベル・チェックを確かめる（重なった画面がある時は、後ろの2つが上の画面の分）。

  ```js
  JSON.stringify({ sel: Array.from(document.querySelectorAll('select')).filter(s => s.offsetParent).map(s => s.value), chk: Array.from(document.querySelectorAll('input[type=checkbox]')).filter(c => c.offsetParent).map(c => c.checked) })
  // → {"sel":["string:2026-06","string:ALL"],"chk":[false]}
  ```

#### b. グループの表を読む

1. Nu Skin のタブで、`read_table.js`（このスキルと同じフォルダ）の中身を JavaScript ツールでそのまま実行する。同じタブで2回目からは `window.__nsRun()` だけでよい（タブやプロキシを切り替えても残る。ページを開き直したら入れ直す）。
2. 1〜2秒おきに次を実行し、`state` が `running` でなくなるまで待つ。表が長いとスクロールに数十秒かかる。

   ```js
   JSON.stringify(window.__nsRead)
   ```

3. `state:'done'` になったら、次を確かめる。
   - `ym` が頼んだ月と同じか。違えば a からやり直す。
   - `rows` の人数が画面の「グループ サイズ」と合うか（本人の行も数に入っている）。
4. 行を受け取る時は、一度に全部返すと長すぎて途中で切れる。`[レベル, 名前, GSV]` だけにして、40行ずつ受け取る。

   ```js
   JSON.stringify(window.__nsRead.rows.slice(0, 40).map(r => [r.lv, r.n, r.gsv]))
   ```
5. `state:'fail'` の時は、`diag`（作りだけで名前は入らない）を見て、表が見えているか・見出しが日本語かを確かめる。それでも読めない時は `get_page_text` か画面写真で読み、本人に「表の読み取りが壊れたので開発に `diag` を渡してください」と伝える。

#### c. チームの表を読む

- チームタブを開き、月とレベルを a と同じにして、b と同じく読む。
- チームの表には、BR 以上のメンバーの GSV が入っている。

#### d. BR の配下も入れる時だけ

**本人が頼んだ時だけ行う。** 次の式が 1 以上の時は、MAP に BR の配下の人がいる。頼まれていなければ「BR の配下の分も読みますか」と本人に聞く。式は NAVIGATOR のタブで実行する。

```js
state.members.filter(m => !m.deleted && m.parentId && isBROrAbove((state.members.find(p => p.id === m.parentId) || {}).title)).length
```

チームの表にいる BR 以上の人（本人の行は除く）を、1人ずつ次のように読む。

1. **1回の `browser_batch` で**、チームの表でその人の名前を押す → 3秒待つ → 「プロキシ」タブを押す → 5秒待つ。名前を押すと最初に「詳細」（住所・連絡先）が開くので、この間に画面写真やページの読み取りを入れない。
2. プロキシの月が頼まれた月か確かめ、レベルを「全部」にする（a と同じ。プロキシのプルダウンは後ろの2つ）。
3. `window.__nsRun()` で b と同じく読む。重なった画面の表を読むようになっている。人数が、その画面の「グループ サイズ」と合うか確かめる。
4. 読み終えたら × で閉じてから、次の人に進む。

プロキシは人数が多い（合わせて数百人になることがある）。全員を会話に通さず、Nu Skin のタブの中で次のように絞ってから受け取る。

- レベル 0 の行（その BR 本人）は捨てる。チームの表にもう入っているため。
- ほかのプロキシで読んだ人（名前と GSV が同じ）は捨てる。下の BR は、上の BR のプロキシにも出るため。
- 残りのうち、**GSV が 0 でない人**と、**MAP に名前がある人**だけを渡す。MAP の名前は、NAVIGATOR のタブで `_nsNorm(姓+名)` と `nsName` を集めて、Nu Skin のタブの変数に置いて突き合わせる（そろえ方は `_nsNorm` と同じにする）。0 で MAP にもいない人は、渡しても一覧に出ないので要らない。

#### e. NAVIGATOR に渡す

1. b・c・d の行を1つにまとめる。
   - 同じ名前で GSV も同じ行は1人にする。数字が違う時は、グループ → チーム → プロキシの順に優先する。
   - 確認画面をもう出した後で行を足す時は、`_ns.P.rows` に足して `nsImport` を呼び直す（前の一覧は置き換わる）。
   - 渡す形は `P = { v: 1, ym: '2026.06', rows: [...] }`。
2. NAVIGATOR のタブで `nsImport(P)` を実行する（`P` は JSON をそのまま埋め込む）。
   - 戻り値が `'switching'` の時は、その月の MAP に切り替えて読み込んだ後に、確認画面が自動で開く。
   - 戻り値が `'open'` の時は、すぐ確認画面が開く。
   - それ以外の時（`'not-editable'`・`'not-enabled'` など）は止めて、本人に伝える。`'not-enabled'` は、まだテスト中で「先に見られる人」に入っていない時。

#### f. 本人の確認を待つ

本人に次のように伝える。

> 「◯月の確認画面を出しました。変わる人の数字を見て、合っていれば『◯人の GSV を書き込む』を押してください。MAP で見つからない人は、プルダウンで MAP の人を選べます（次から自動で合います）」

NAVIGATOR のタブで `JSON.stringify(window._nsLast)` を時々見る。`ym` がその月になったら書き込み済み。
- `off` が 1 以上の時は、MAP のつながりが Nu Skin と違う人がいる。報告に入れる。
- 本人が「閉じた」「この月はやめる」と言ったら、その月は飛ばす。

## 開発メモ

- テスト：`node tools/test/tests/ns891_test.js`（`ns_run.js`。偽の Nu Skin でグループ・チーム・プロキシを読み、確認の一覧まで出す。名前・「詳細」の中身を返さないこと、ログイン画面・無い月で止まることも見る）。`node tools/test/tests/ns890_test.js`（`read_table.js` と NAVIGATOR 側）。
- `ns_run.js` の中には `read_table.js` と同じ中身が埋め込んである（コネクタはファイルを1つしか読めず、中から別のファイルも読めないため）。`read_table.js` を直したら `ns_run.js` の `READER` にも同じものを入れる。違うと ns891 が落ちる。
- コネクタの `browser_run_code_unsafe` は、呼び出しをまたいで値を残さない。月は a で今のタブの `window.__nsArgs` に置いて渡す。
- 本物で起きたこと（2026/11）：# だけ変えても前に開いたプロキシの画面が残り、グループとチームを取り違えた → `ns_run.js` はページを開き直す。閉じるボタンは文字の無いアイコン（`em.ns-icon-close`）。最後の BR のプロキシが1回目で開かないことがある → 1回だけやり直す。
- NAVIGATOR 側：`app.js` の「v890: Nu Skin のポイント」の所。`nsImport`・`_nsItems`・`nsSave` がある。名前は空白・全角半角・髙／﨑をそろえて突き合わせる。手で選んだ人は `m.nsName` に覚える。
- 本物の作り（2026/11 に確かめた）：月とレベルは `select`、表は `table.downline-table`（見出しは `th > span`）で `div.downlineScroller` がスクロールする。チームの表は BBLK・GSV・LTSV の並びで PSV が無い。テストの偽ページ D がこの作り。
- 名前の字が違う人（例：「德」と「徳」）は自動では合わない。本人が一覧のプルダウンで選ぶと、次から自動で合う。
- Nu Skin の画面が変わって読めなくなったら、本人から `diag` を貰い、`read_table.js` を直してテストに同じ形の偽ページを足す。
