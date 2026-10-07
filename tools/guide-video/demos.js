// 各ミッションの動画デモ（実在しないダミーデータのみ）
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
const day = n => { const x = new Date(Date.now() + n * 86400000), p = v => (v < 10 ? '0' : '') + v; return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()); };
const MEMBERS = {
  'checkinMembers/101': { no: '101', name: '山田 太郎', kana: 'やまだ たろう', group: '山田BD', union: 'ANTARES', sex: 'm', cardToken: 'tok101tok101tok101tok101tok101to', cardSig: 'tok101' },
  'checkinMembers/102': { no: '102', name: '佐藤 花子', kana: 'さとう はなこ', group: '山田BD', union: 'ANTARES', sex: 'f', cardToken: 'tok102tok102tok102tok102tok102to', cardSig: 'tok102' },
  'checkinMembers/103': { no: '103', name: '鈴木 一郎', kana: 'すずき いちろう', group: '鈴木BD', union: 'ANTARES', sex: 'm' },
  'checkinMembers/104': { no: '104', name: '田中 さくら', kana: 'たなか さくら', group: '鈴木BD', union: 'ANTARES', sex: 'f', grade: 'BR' },
  'checkinMembers/105': { no: '105', name: '高橋 健', kana: 'たかはし けん', group: '鈴木 BD', union: 'ANTARES', sex: 'm' }
};
const ALLTR = { PG: { at: day(-20), byName: '山内' }, PA: { at: day(-15), byName: '山内' }, CO: { at: day(-10), byName: '山内' }, 'BPC済み': { at: day(-3), byName: '山内' } };
const TRAINEES = {
  'checkinMembers/TS0001': { no: 'TS0001', name: '研修 みらい', kana: 'けんしゅう みらい', group: '山田BD', union: 'ANTARES', trainee: true, active: true, regBy: OWNER, regByName: 'テスト管理者',
    trainings: { PG: { at: day(-6), byName: 'テスト管理者' } }, cardToken: 'tokts1tokts1tokts1tokts1tokts1to', cardSig: 'tokts1' },
  'checkinMembers/TS0002': { no: 'TS0002', name: '研修 そら', kana: 'けんしゅう そら', group: '鈴木BD', union: 'ANTARES', trainee: true, active: true, regBy: OWNER, regByName: 'テスト管理者',
    trainings: ALLTR, coSheet: { ver: '2.5', date: day(-10) }, cardToken: 'tokts2tokts2tokts2tokts2tokts2to', cardSig: 'tokts2' }
};
function demoEvents() {
  const ev = {};
  ['evself1', 'evself2', 'evon1', 'evnext1', 'evnext2', 'evclosed'].forEach(k => { ev['checkinEvents/' + k] = { date: '2000-01-01', month: '2000-01', name: 'OLD', unions: ['ZZZ'] }; });
  ev['checkinEvents/evToday'] = { date: day(0), month: day(0).slice(0, 7), name: 'ハウディ', speaker: '山内', hostUnion: 'ANTARES', unions: ['ANTARES'], fee1: 1000, fee2: 500 };
  ev['checkinEvents/evNext'] = { date: day(5), month: day(5).slice(0, 7), name: 'P&P', hostUnion: 'ANTARES', unions: ['ANTARES'], rsvp: true, online: true, rsvpDays: 7 };
  ev['checkinEvents/evNext/rsvps/102'] = { no: '102', name: '佐藤 花子', group: '山田BD', union: 'ANTARES', atLocal: '09:12', atMs: Date.now() };
  ev['checkinEvents/evNext/attendance/103'] = { no: '103', name: '鈴木 一郎', group: '鈴木BD', union: 'ANTARES', method: 'online', status: 'pending', atLocal: '10:05' };
  return ev;
}
// 集計用: 今月の過去日に2回開催（終了済み）＋出席
function statData() {
  const t = new Date(), y = t.getFullYear(), m = t.getMonth() + 1, p = v => (v < 10 ? '0' : '') + v;
  const ym = y + '-' + p(m), d1 = ym + '-01', d2 = ym + '-02';
  const o = {};
  o['checkinEvents/evS1'] = { date: d1, month: ym, name: 'ハウディ', hostUnion: 'ANTARES', unions: ['ANTARES'], recClosed: true };
  o['checkinEvents/evS2'] = { date: d2, month: ym, name: 'P&P', hostUnion: 'ANTARES', unions: ['ANTARES'], recClosed: true };
  [['evS1', ['101', '102', '103', '104']], ['evS2', ['101', '102', '105']]].forEach(([e, nos]) => nos.forEach(n => {
    const mm = MEMBERS['checkinMembers/' + n];
    o['checkinEvents/' + e + '/attendance/' + n] = { no: n, name: mm.name, group: mm.group, union: 'ANTARES', sex: mm.sex, fee: 1000, paid: true, method: 'qr' };
  }));
  return o;
}
async function pcPrep(p, extra) {
  await p.evaluate(([m, e, x]) => Object.assign(window.__stubStore, m, e, x || {}), [MEMBERS, demoEvents(), extra]);
  await p.click('#btnActivate'); await p.waitForTimeout(900);
}
async function startRec(p, nos) {
  await p.click('nav button[data-pane="pKiosk"]'); await p.waitForTimeout(200);
  await p.selectOption('#recEvSel', 'evToday'); await p.click('#btnRecStart'); await p.waitForTimeout(900);
  for (const n of (nos || [])) { await p.fill('#numIn', n); await p.click('#btnManual'); await p.waitForTimeout(400); }
}
const trSeed = Object.assign({ 'checkinUnions/ANTARES': { name: 'ANTARES', noPrefix: 'TS', trainers: [], area: '福岡' } }, MEMBERS, TRAINEES);
const R = { setup: 'はじめの準備', rec: '受付する人', adm: '名簿・管理者', stat: '集計を見る', tr: '研修担当' };

const DEMOS = {
  // ── 🚀 はじめの準備 ──
  set1: { role: R.setup, title: '① 名簿を登録する', prep: p => pcPrep(p), run: async h => {
    await h.cap('<b>「名簿」</b> タブを開きます'); await h.tap('nav button[data-pane="pRoster"]');
    await h.cap('<b>「CSV取込」</b> で まとめて登録できます', 2000); await h.tap('#btnCsvIn', 900);
    await h.p.evaluate(() => { const u = window.__stubStore['checkinUnions/ANTARES']; if (u) u.noPrefix = 'AN'; });   // 有効化のあとに頭文字を設定
    await h.cap('<b>「📄 テンプレート」</b> の列で作って、エクセルから貼り付け or ファイルを選ぶ', 2600);
    await h.type('#csvText', '番号,姓,名,系列\n,伊藤,学,伊藤BD\n,中村,ゆい,伊藤BD', 600);
    await h.cap('<b>番号が空欄なら自動で発番</b>。「確認する」を押すと…', 2000); await h.tap('#csvGo', 1500);
    await h.cap('取り込む前に <b>確認画面</b>。他のユニオンと番号が重なっていないかも自動でチェック', 3400);
    await h.tap('#imGo', 1500);
    await h.cap('取り込み完了！ 発番した人の一覧はCSVで保存できます', 2600); await h.closeModal();
    await h.cap('1人ずつなら <b>「＋ メンバー追加」</b>', 1800); await h.tap('#btnAddMember', 800);
    await h.cap('名前と系列を入れて保存。<b>番号は自動</b> で振られます', 1500); await h.type('#mfName', '小林 あおい', 300); await h.type('#mfGroup', '伊藤BD', 300);
    await h.tap('#mfSave', 1200); await h.closeModal();
    await h.cap('登録した人は <b>名簿に並びます</b>', 2600);
  } },
  set2: { role: R.setup, title: '② 会員証を配る', prep: p => pcPrep(p).then(() => p.click('nav button[data-pane="pRoster"]')), run: async h => {
    await h.cap('<b>「会員証一括発行」</b> で まだの人に まとめて発行', 2000); await h.tap('#btnCardBulk', 900); await h.tap('#cbGo', 1800); await h.closeModal();
    await h.cap('いちばんラクなのは <b>「受け取りリンク」</b>', 2000); await h.tap('#btnReceiveLink', 900);
    await h.cap('この <b>共通URLをLINEグループに貼るだけ</b>！<br>みんなが <b>番号とお名前（姓）</b> を入れて受け取れます', 3800); await h.tap('#rlClose', 500);
    await h.cap('番号を知らない人（新しく発番したユニオン）には、会場でQRを読んでもらうか、個別にLINEで', 3200);
    await h.cap('その場で渡すなら 名簿の <b>「会員証」</b> ボタン', 2000); await h.tap('#rosterBody button[data-a="card"]', 1200);
    await h.cap('QRを <b>本人のスマホで読み取って</b> もらえば完了！', 3200); await h.closeModal();
  } },
  set3: { role: R.setup, title: '③ イベントを作る', prep: p => pcPrep(p), run: async h => {
    await h.cap('<b>「イベント」</b> タブを開きます'); await h.tap('nav button[data-pane="pEvents"]');
    await h.cap('<b>「＋ 新規イベント」</b> を押します', 1800); await h.tap('#btnAddEvent', 900);
    await h.cap('日付・名前・料金を入れます', 1200);
    await h.p.fill('#evDate', day(3)); await h.type('#evName', 'ハウディ', 300); await h.type('#evSpeaker', '山内', 300);
    await h.point('#evFee1'); await h.cap('料金は <b>1部・2部</b> それぞれ設定できます', 2400);
    await h.cap('予約受付・オンライン受講も ここで ON にできます', 2400);
    await h.tap('#evSave', 1200);
    await h.cap('イベントが <b>一覧に追加</b> されました！<br>当日は ここの「受付を開始」からでもOK', 3400);
  } },
  set4: { role: R.setup, title: '④ 受付担当を決める', prep: p => pcPrep(p).then(() => p.click('nav button[data-pane="pRoster"]')), run: async h => {
    await h.cap('当日 受付する人を <b>「👑 受付管理者」</b> に任命します', 2200); await h.tap('#btnCkAdmins', 1000);
    await h.cap('任命された人は <b>受付と名簿の操作</b> ができるようになります', 3200); await h.closeModal();
    await h.cap('研修担当の人は <b>「🎓 研修生登録の担当」</b> で任命', 2200); await h.tap('#btnTrainers', 1000);
    await h.cap('任命された人は <b>研修受講カード</b> から研修生を登録できます', 3200); await h.closeModal();
    await h.cap('これで <b>準備OK</b>！ 次は「受付する人」のミッションへ', 2600);
  } },
  set5: { role: R.setup, title: '⑤ 合同イベントを作る',
    prep: p => pcPrep(p, Object.assign({ 'checkinUnions/ANTARES': { name: 'ANTARES' }, 'checkinUnions/BASE REVE': { name: 'BASE REVE' },
      'checkinMembers/301': { no: '301', name: '森 ひかり', kana: 'もり ひかり', group: '森BD', union: 'BASE REVE', sex: 'f', cardToken: 'tok301tok301tok301tok301tok301to', cardSig: 'tok301' } },
      { 'checkinEvents/evToday': { date: '2000-01-01', month: '2000-01', name: 'OLD', unions: ['ZZZ'] } })), run: async h => {
    await h.cap('合同イベントは <b>主催ユニオンが1つだけ</b> 作ります。<br>相手のユニオンは 作らなくてOK！', 3400);
    await h.tap('nav button[data-pane="pEvents"]');
    await h.cap('<b>「＋ 新規イベント」</b> を押します', 1800); await h.tap('#btnAddEvent', 900);
    await h.p.fill('#evDate', day(0)); await h.type('#evName', '合同ハウディ', 300);
    const capTop = on => h.p.evaluate(on => { const c = document.getElementById('vcap'); c.style.top = on ? '64px' : ''; c.style.bottom = on ? 'auto' : ''; }, on);
    await capTop(true);   // チェック欄はフォームの一番下にあるので、字幕を上に出して隠さない
    await h.point('#evUnionsBox'); await h.cap('<b>「合同ユニオン」</b> で いっしょに開くユニオンに <b>全部チェック</b>', 2600);
    await h.tap('#evU0', 900);
    await h.cap('チェックしたユニオンの人の出席が <b>それぞれの集計・稼働率</b> に入ります', 3000);
    await capTop(false);
    await h.tap('#evSave', 1200);
    await h.point('#evList .jointtag'); await h.cap('一覧に <b>「合同」</b> と出ます。<br>相手ユニオンの画面にも 同じイベントが出ます', 3400);
    await h.cap('当日は それぞれのPCで <b>同じイベント</b> の「受付を開始」', 2600);
    await h.tap('#evList button[data-a="rec"]', 1400);
    await h.p.fill('#numIn', 'm:101:tok101'); await h.tap('#btnManual', 900);
    await h.p.fill('#numIn', 'm:301:tok301'); await h.tap('#btnManual', 900);
    await h.cap('相手ユニオンの人も <b>会員証のQR</b> でピッ！', 2600);
    await h.point('#unionTallyTile'); await h.cap('<b>ユニオン別の人数</b> も出ます。<br>出席は1つにまとまるので 二重受付も防げます', 3600);
    await h.cap('受付中に <b>「⚠ 合同ユニオンに入っていません」</b> と出たら チェック漏れ', 3000);
    await h.tap('nav button[data-pane="pEvents"]', 600);
    await h.point('#evList button[data-a="editev"]'); await h.cap('イベントの <b>「編集」</b> でチェックすればOK。<br>受付の あとからでも 集計に入ります', 4000);
  } },
  // ── 🎫 受付する人 ──
  rec1: { role: R.rec, title: '① 受付を始める', prep: p => pcPrep(p), run: async h => {
    await h.cap('まずは <b>「受付」</b> タブを開きます'); await h.tap('nav button[data-pane="pKiosk"]');
    await h.point('#recEvSel'); await h.cap('受付する <b>イベント</b> を選びます。<br>今日のイベントは 最初から選ばれています', 3200);
    await h.point('#feeModeSel'); await h.cap('料金は ふだん <b>「通常受付」</b> のままでOK', 2600);
    await h.cap('<b>「受付を開始」</b> を押すと…', 1800); await h.tap('#btnRecStart', 1200);
    await h.cap('名簿が読み込まれて <b>QRを読める状態</b> になりました！', 3000);
  } },
  rec2: { role: R.rec, title: '② QRでピッ・番号で受付', prep: p => pcPrep(p).then(() => startRec(p)), run: async h => {
    await h.point('#numIn'); await h.cap('QRリーダーやカメラで <b>会員証のQRを読むと自動で受付</b>', 2600);
    await h.p.fill('#numIn', 'm:101:tok101'); await h.tap('#btnManual', 900);
    await h.cap('<b>緑ならOK！</b> 名前と金額が大きく出ます', 2800);
    await h.cap('番号を手で入れて <b>Enter</b> でもOK', 1600); await h.type('#numIn', '102', 200); await h.p.press('#numIn', 'Enter'); await h.wait(900);
    await h.cap('番号がわからない人は <b>名前で検索</b>', 1600); await h.type('#nameIn', '鈴木', 700); await h.tap('#nameSug .sugitem', 900);
    await h.cap('無効の人や 未登録の番号は <b>赤</b> で教えてくれます', 1600); await h.type('#numIn', '999', 200); await h.p.press('#numIn', 'Enter'); await h.wait(1600);
    await h.point('#totalTile'); await h.cap('人数と集金額は ここで <b>リアルタイム</b> に確認', 2800);
  } },
  rec3: { role: R.rec, title: '③ ゲスト・スピーカー', prep: p => pcPrep(p).then(() => startRec(p, ['101'])), run: async h => {
    await h.cap('名簿にいない人は <b>「ゲスト受付」</b>', 1800); await h.tap('#btnGuest', 900);
    await h.cap('名前を入れて 受付します', 1200); await h.type('#gName', '見学 ゲスト', 400);
    await h.tap('#gGo', 1200); await h.cap('ゲストも 出席と金額に 入ります', 2400);
    await h.cap('スピーカーは <b>「スピーカーを登録」</b>（料金なし）', 2000); await h.tap('#btnSpeaker', 900);
    await h.type('#rmQ', '田中', 700); await h.tap('#rmList .sugitem', 1200);
    await h.cap('MCも <b>「MCを登録」</b> から 同じようにできます', 2800);
  } },
  rec4: { role: R.rec, title: '④ 受付の取消・未徴収', prep: p => pcPrep(p).then(() => startRec(p, ['101', '102'])), run: async h => {
    await h.p.fill('#numIn', '103'); await h.p.click('#btnManual'); await h.wait(600);
    await h.cap('あとで払う人は <b>「未徴収にする（後払い）」</b>', 2000); await h.tap('#stgUnpaid', 1000);
    await h.point('#cashTile'); await h.cap('未徴収の人は ここに出ます。払ってもらったら <b>「徴収済」</b> に', 3200);
    await h.cap('間違えて受付したときは 人数のタイルを押して…', 2000); await h.tap('#totalTile', 1000);
    await h.point('.modal button[data-ala="del"]'); await h.cap('<b>「取消」</b> で 出席と集金の記録を消せます', 3000); await h.closeModal();
  } },
  rec5: { role: R.rec, title: '⑤ 受付終了と会計', prep: p => pcPrep(p).then(() => startRec(p, ['101', '102', '103'])), run: async h => {
    await h.cap('受付が終わったら <b>「受付を終了」</b>', 1800); await h.tap('#btnRecStop', 1200);
    await h.cap('そのまま <b>会計</b> を入力できます', 2400); await h.point('#fnSave'); await h.tap('#fnSave', 1000);
    await h.cap('「受付を終了」すると <b>集計（稼働率）に反映</b> されます', 2200); await h.tap('nav button[data-pane="pStats"]', 400); await h.tap('#btnStatReload', 1200);
    await h.cap('出席表と稼働率が すぐ確認できます！', 3000);
  } },
  // ── 📋 名簿・管理者 ──
  adm1: { role: R.adm, title: '① さがす・並べる', prep: p => pcPrep(p, { 'checkinMembers/106': { no: '106', name: '中島 ひろ', group: '山田BD', union: 'ANTARES', active: false } }), run: async h => {
    await h.cap('<b>「名簿」</b> タブを開きます'); await h.tap('nav button[data-pane="pRoster"]');
    await h.cap('名前・番号・系列の一部で <b>すぐ絞り込み</b>', 1600); await h.type('#q', '山田', 1600);
    await h.p.fill('#q', ''); await h.p.dispatchEvent('#q', 'input'); await h.wait(500);
    await h.cap('見出しを押すと <b>並べ替え</b>', 1600); await h.tap('#rosterHead th[data-sk="name"]', 1400);
    await h.cap('無効にした人は ふだん隠れています。<b>チェックで表示</b>', 2000); await h.tap('#qShowOff', 2000);
  } },
  adm2: { role: R.adm, title: '② メンバーを編集する', prep: p => pcPrep(p).then(() => p.click('nav button[data-pane="pRoster"]')), run: async h => {
    await h.cap('直したい人の <b>「編集」</b> を押します', 1800); await h.tap('#rosterBody tr:nth-child(2) button[data-a="edit"]', 900);
    await h.cap('名前・系列・性別・かな・グレードを直せます', 1800); await h.p.fill('#mfKana', ''); await h.type('#mfKana', 'さとう はなこ', 400);
    await h.tap('#mfSave', 1200); await h.closeModal();
    await h.cap('保存すると <b>会員証にも反映</b>。集計の名前からも 同じ編集ができます', 3400);
  } },
  adm3: { role: R.adm, title: '③ 無効化と削除のちがい', prep: p => pcPrep(p).then(() => p.click('nav button[data-pane="pRoster"]')), run: async h => {
    await h.cap('やめた人・休んでいる人は <b>削除ではなく「無効化」</b>', 2200); await h.tap('#rosterBody tr:nth-child(5) button[data-a="tog"]', 1500);
    await h.cap('集計と受付の対象から外れます。<b>出席履歴や領収書は残ります</b>', 3200);
    await h.tap('#qShowOff', 900); await h.cap('<b>「有効化」</b> で いつでも戻せます', 2600);
    await h.point('#rosterBody tr:nth-child(1) button[data-a="del"]'); await h.cap('<b>削除</b> は 間違えて登録した人だけにしてね', 3000);
  } },
  adm4: { role: R.adm, title: '④ 研修生を昇格させる', prep: p => pcPrep(p, TRAINEES).then(() => p.click('nav button[data-pane="pRoster"]')), run: async h => {
    await h.cap('条件を満たした研修生には <b>「昇格待ち」</b> と <b>「⭐ 昇格」</b>', 2400); await h.point('#rosterBody button[data-a="promote"]'); await h.wait(1200);
    await h.cap('条件: DLR・EXP以外ぜんぶ受講済み＋<b>面談シート提出</b>', 3000);
    await h.tap('#rosterBody button[data-a="promote"]', 1500);
    await h.cap('<b>同じ会員証のまま</b> 正規メンバーのカードに変わります！', 3200);
  } },
  adm5: { role: R.adm, title: '⑤ まとめて直す・バックアップ', prep: p => pcPrep(p).then(() => p.click('nav button[data-pane="pRoster"]')), run: async h => {
    await h.cap('<b>「系列名変更」</b> で 表記ゆれを まとめて直せます', 2000); await h.tap('#btnGroupRen', 1200);
    await h.cap('「鈴木BD」と「鈴木 BD」のような ゆれを <b>自動で見つけます</b>', 3400); await h.closeModal();
    await h.cap('チェックで人を選んで <b>グレードをまとめて変更</b>', 1800);
    await h.tap('#rosterBody tr:nth-child(1) .selchk', 300); await h.tap('#rosterBody tr:nth-child(2) .selchk', 300); await h.tap('#btnGradeSel', 1200);
    await h.cap('BR・JETCLUB にすると <b>会員証の色</b> も変わります', 2800); await h.closeModal();
    await h.point('#btnCsvOut'); await h.cap('<b>「CSV出力」</b> で ときどきバックアップしておくと安心', 3000);
  } },
  adm6: { role: R.adm, title: '⑥ 予約・オンライン・会計', prep: p => pcPrep(p), run: async h => {
    await h.cap('<b>「イベント」</b> タブを開きます'); await h.tap('nav button[data-pane="pEvents"]', 900);
    await h.cap('<b>「🎟 予約」</b> で 予約した人の一覧。取消申請もここ', 2200); await h.tap('#evList button[data-a="rsvps"]', 1200); await h.wait(1200); await h.closeModal();
    await h.cap('<b>「💻 オンライン」</b> で オンライン受講の申請を承認', 2200); await h.tap('#evList button[data-a="online"]', 1200); await h.wait(1200); await h.closeModal();
    await h.cap('イベントごとの <b>会計</b> も ここから', 2000); await h.tap('#evList button[data-a="fin"]', 1200); await h.wait(1500); await h.closeModal();
  } },
  // ── 📊 集計を見る ──
  st1: { role: R.stat, title: '① 集計タブをひらく', prep: p => pcPrep(p, statData()), run: async h => {
    await h.cap('<b>「集計」</b> タブを開きます'); await h.tap('nav button[data-pane="pStats"]', 300); await h.tap('#btnStatReload', 1200);
    await h.cap('◀ ▶ で <b>見たい月</b> に切り替え', 1800); await h.tap('#stPrev', 1000); await h.tap('#stNext', 1000);
    await h.point('#stUnionSel'); await h.cap('複数のユニオンを見られる人は <b>ユニオンも切り替え</b> できます', 3000);
  } },
  st2: { role: R.stat, title: '② 数字の見かた', prep: p => pcPrep(p, statData()).then(async () => { await p.click('nav button[data-pane="pStats"]'); await p.click('#btnStatReload'); await p.waitForTimeout(800); }), run: async h => {
    await h.point('#statBody .tile'); await h.cap('<b>開催数</b> には 過去のハウディと 今日「受付を終了」したものが入ります', 3600);
    await h.cap('これからの予定は 入らないので 安心！', 2400);
    await h.point('#statBody .tile:nth-child(2)'); await h.cap('<b>平均稼動数</b> は 1回あたりの出席人数', 2800);
    await h.cap('今日の受付がまだ終わっていないときは <b>「？」</b> が出ます', 2000); await h.tap('#stPendInfo', 1400); await h.closeModal();
  } },
  st3: { role: R.stat, title: '③ 出席表と稼働率', prep: p => pcPrep(p, statData()).then(async () => { await p.click('nav button[data-pane="pStats"]'); await p.click('#btnStatReload'); await p.waitForTimeout(800); }), run: async h => {
    await h.point('#statMatrix'); await h.cap('<b>●が出席</b>。稼働率 ＝ 出席 ÷ 開催数', 3000);
    await h.cap('登録して1ヶ月たっていない人は <b>登録した日から</b> 計算します', 3000);
    await h.cap('名前・番号・系列で <b>絞り込み</b>', 1400); await h.type('#statQ', '鈴木', 1600); await h.p.fill('#statQ', ''); await h.p.dispatchEvent('#statQ', 'input'); await h.wait(400);
    await h.cap('見出しを押すと <b>並べ替え</b>', 1400); await h.tap('#statMatrix thead th[data-sk="rate"]', 1600);
  } },
  st4: { role: R.stat, title: '④ 名前から編集する', prep: p => pcPrep(p, statData()).then(async () => { await p.click('nav button[data-pane="pStats"]'); await p.click('#btnStatReload'); await p.waitForTimeout(800); }), run: async h => {
    await h.cap('出席表の <b>名前（点線の下線）</b> を押すと…', 1800); await h.tap('#statMatrix .stname', 1000);
    await h.cap('その人の <b>操作シート</b> が開きます', 2400);
    await h.cap('名簿と同じく <b>会員証・編集・昇格・無効化・削除</b> がその場でできます', 3400); await h.closeModal();
  } },
  st5: { role: R.stat, title: '⑤ CSV出力と再集計', prep: p => pcPrep(p, statData()).then(async () => { await p.click('nav button[data-pane="pStats"]'); await p.click('#btnStatReload'); await p.waitForTimeout(800); }), run: async h => {
    await h.point('#btnStatCsv'); await h.cap('<b>「CSV出力」</b> で 出席表を エクセルで開けます', 2800);
    await h.cap('受付のあとで数字が古いと思ったら <b>「再集計」</b>', 1800); await h.tap('#btnStatReload', 1600);
    await h.cap('最新の出席で <b>計算し直します</b>', 2400);
  } },
  // ── 🎓 研修担当（スマホ） ──
  tr1: { role: R.tr, title: '① 研修生を登録する', device: 'phone', hash: '#trainer', seed: trSeed, run: async h => {
    await h.cap('<b>「＋ 登録」</b> タブを開きます'); await h.tap('#trTabReg');
    await h.cap('研修生の <b>名前</b> を入れます', 1500); await h.type('#trName', '練習 はなこ');
    await h.type('#trKana', 'れんしゅう はなこ', 300);
    await h.cap('<b>紹介者</b> も入れます（必須）', 1500); await h.type('#trRef', '山田 太郎', 400);
    const v = await h.p.evaluate(() => { const o = Array.from(document.getElementById('trUp').options).find(x => x.value); return o ? o.value : ''; });
    await h.cap('<b>UPルビー</b> は 一覧から 選ぶだけ', 1500); await h.select('#trUp', v);
    await h.cap('<b>「登録して会員証QRを表示」</b> を押すと…', 1800); await h.tap('#trGo', 1500);
    await h.cap('会員証のQRが出ました！<br><b>本人のスマホで読み取って</b> もらえば完了', 3400);
  } },
  tr2: { role: R.tr, title: '② 研修後入力をひらく', device: 'phone', hash: '#trainer', seed: trSeed, run: async h => {
    await h.cap('<b>「研修後入力」</b> タブを開きます'); await h.tap('#trTabList', 900);
    await h.cap('研修した人の <b>会員番号</b> を入れて「開く」', 1600); await h.type('#trOpenNo', 'TS0001', 300); await h.tap('#trOpenGo', 1400);
    await h.cap('その人の <b>チェックリスト</b> が開きます', 2600); await h.closeModal();
    await h.point('#tsResults'); await h.cap('自分が登録した研修生は <b>ここに並びます</b>', 2800);
  } },
  tr3: { role: R.tr, title: '③ 受講を記録する', device: 'phone', hash: '#trainer', seed: trSeed, run: async h => {
    await h.tap('#trTabList', 700); await h.cap('研修生を <b>タップ</b>', 1200); await h.tap('#tsResults [data-tr="0"]', 1000);
    await h.cap('受講した項目の <b>「✓ 受講済みにする」</b>', 1800); await h.tap('.modal button[data-tk="PA"]:not([data-tundo])', 1400);
    await h.cap('日付とあなたの名前で <b>記録</b> されます', 2600);
    await h.point('.modal button[data-tsheet]'); await h.cap('<b>📝 面談シート</b> はここから', 2400);
    await h.point('.modal button[data-tdlr]'); await h.cap('<b>📅 DLR会場受講</b> の予約もここから', 2600);
  } },
  tr4: { role: R.tr, title: '④ 昇格のルール', device: 'phone', hash: '#trainer', seed: trSeed, run: async h => {
    await h.tap('#trTabList', 700); await h.tap('#tsResults [data-tr="0"]', 1200);
    await h.cap('<b>昇格の条件</b>: DLR・EXP以外ぜんぶ受講済み＋面談シート提出', 3400);
    await h.cap('足りないものは <b>「あと: …」</b> で教えてくれます', 3000); await h.closeModal();
    await h.tap('#tsResults [data-tr="1"]', 1200);
    await h.cap('ぜんぶそろうと <b>「昇格待ち」</b>。昇格はユニオン管理者が行います', 3600);
  } },
  tr5: { role: R.tr, title: '⑤ 会員証を送る', device: 'phone', hash: '#trainer', seed: trSeed, run: async h => {
    await h.tap('#trTabList', 900);
    await h.point('#tsResults [data-tsend]'); await h.cap('<b>「📨 送る」</b> で 会員証のURLを LINEなどで送れます', 3200);
    await h.cap('スマホを変えたときも <b>同じURL</b> でOK', 2600);
    await h.cap('いちばんカンタンなのは 登録した直後に <b>QRを読み取ってもらう</b> こと！', 3200);
  } }
};
module.exports = { DEMOS };
