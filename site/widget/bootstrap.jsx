// bootstrap.jsx — mounts the Degreed customer-service widget into the mirrored host page.
// Reads defaults from window.__MAESTRO_TWEAKS if provided, otherwise uses Japanese + round launcher.

// Inject fonts + CSS variables that the widget's inline styles reference.
// Scoped to #maestro-widget-root so we don't pollute the host page.
(function injectWidgetCss(){
  if (document.getElementById('maestro-widget-fonts')) return;
  const fontsLink = document.createElement('link');
  fontsLink.id = 'maestro-widget-fonts';
  fontsLink.rel = 'stylesheet';
  fontsLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Noto+Sans+JP:wght@400;500;600;700&display=swap';
  document.head.appendChild(fontsLink);

  const vars = document.createElement('style');
  vars.id = 'maestro-widget-vars';
  vars.textContent = `
    #maestro-widget-root, #maestro-widget-root * { box-sizing: border-box; }
    #maestro-widget-root {
      --ink:#0b1220;
      --ink-2:#1a2236;
      --ink-3:#3b465f;
      --ink-4:#6b7589;
      --line:#e6e8ee;
      --line-2:#eef0f4;
      --bg:#f7f7f4;
      --card:#ffffff;
      --brand:#0b1f3a;
      --brand-2:#16305a;
      --brand-ink:#ffffff;
      --accent:#ff6a4d;
      --accent-2:#ffb199;
      --lilac:#c8b6ff;
      --mint:#b7e4c7;
      --butter:#ffe8a3;
      --shadow-lg: 0 30px 80px -20px rgba(9,14,30,.35), 0 10px 30px -10px rgba(9,14,30,.18);
      --shadow-md: 0 12px 30px -10px rgba(9,14,30,.18), 0 4px 10px -4px rgba(9,14,30,.08);
      color: var(--ink);
      font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    #maestro-widget-root .serif { font-family: "Fraunces", Georgia, serif; font-feature-settings: "ss01","ss02"; }
    #maestro-widget-root .jp { font-family: "Noto Sans JP", "Inter", sans-serif; }
    #maestro-widget-root button { font: inherit; }
    #maestro-widget-root a { color: inherit; }
  `;
  document.head.appendChild(vars);
})();

const MAESTRO_DEFAULTS = Object.assign({
  lang: 'ja',
  size: 'medium',
  launcher: 'round',
  startOpen: false,
  proactive: false,
}, window.__MAESTRO_TWEAKS || {});

// Pool of real but moderately-uncommon Japanese last names (rank ~28–80 — skip the top-15
// saturated like 佐藤/鈴木/田中). Pick one at script load and use throughout the session.
const AGENT_NAMES = [
  { ja: '中島', en: 'Nakajima' },
  { ja: '藤田', en: 'Fujita' },
  { ja: '後藤', en: 'Goto' },
  { ja: '岡田', en: 'Okada' },
  { ja: '西村', en: 'Nishimura' },
  { ja: '福田', en: 'Fukuda' },
  { ja: '三浦', en: 'Miura' },
  { ja: '原田', en: 'Harada' },
  { ja: '久保', en: 'Kubo' },
  { ja: '谷口', en: 'Taniguchi' },
];
const AGENT = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
// Expose globally so widget.jsx can read the same chosen name for avatar/header
window.__maestroAgent = AGENT;

// Retrieval + real Claude call via local bridge (http://127.0.0.1:18801).
// The widget calls claude.complete({ messages }) and awaits a reply.
// Return shape: { content, source, url, handoff? } — widget.jsx handles the shape.
//
// Flow:
//   1. Extract user's question, pre-triage intent heuristically
//   2. For non-KB intents (greeting, thanks, escalation, injection, account, feedback, meta),
//      return canned JP-CS-voiced response directly — no retrieval, no Claude call
//   3. For KB-lookup path: search + rewrite + fetch top 3 + Claude synthesis with JP CS persona
//   4. Citation parsed from [cited: <id>] trailer
// Bridge base URL: defaults to local dev. Set window.__MAESTRO_BRIDGE_BASE in the host page
// (e.g. '/maestro/api') for production deploys.
const BRIDGE_BASE = (typeof window !== 'undefined' && window.__MAESTRO_BRIDGE_BASE) || 'http://127.0.0.1:18801';
const BRIDGE_URL = BRIDGE_BASE + '/claude';
const REWRITE_URL = BRIDGE_BASE + '/rewrite';

// ─── Intent triage ──────────────────────────────────────────────────────────
// A Japanese enterprise using Degreed asks many things that aren't in the help-center KB:
// contracts, SSO setup, audit docs, invoicing, incidents, trainings, provisioning.
// We route those to the right specialist team with appropriate language — not the KB.
// Only kb_lookup goes through retrieval + Claude.
//
// Patterns are checked in order; first match wins. Most-specific categories are checked
// before generic ones so that e.g. "アカウントのSSO設定" routes to integration, not account.

function triageIntent(raw) {
  const q = raw.trim();
  const short = q.length <= 20;

  // Hostile / adversarial — always first
  if (/(以前|前|最初|今まで).{0,4}(指示|ルール|プロンプト).{0,4}(無視|忘れ|破棄)|ignore.{0,20}(previous|prior|above).{0,10}(instruction|prompt|rule)|you are now|jailbreak|developer mode|自由なAI|無制限.*(?:AI|モード)|内部(?:情報|データ).*(?:出して|教えて|見せて)|(?:システム)?プロンプト.{0,8}(?:表示|教えて|見せて|出して|公開)/i.test(q)) {
    return 'injection';
  }

  // Personal account (FIRST-PERSON markers REQUIRED) — checked early so "私のアカウントを削除" wins over admin_tenant
  if (/(?:私の|自分の|僕の|俺の)\s*(?:アカウント|ログイン|パスワード|メール|アドレス|プロフィール|データ)|(?:my|our)\s*account|can'?t\s*log\s*in|forgot\s*(?:my\s*)?password|delete\s*(?:my\s*)?account|GDPR削除|自分のデータ.*(?:削除|消し)/i.test(q)) {
    return 'account';
  }

  // Explicit handoff request — broadened to catch "サポートの方", "スタッフ" referents
  if (/担当者|オペレータ|(?:サポート(?:の方|チーム|担当)|スタッフ).{0,5}(?:と|に).{0,5}(?:話|繋|つな|相談)|人(?:と|に).{0,5}(?:話|繋|つな)|live\s*agent|real\s*person|talk.*human/i.test(q)) {
    return 'escalation';
  }

  // Incident / outage / status — covers できない/できません/落ちる/真っ白
  if (/障害|ダウンして|アクセス(?:できな|できませ|不可|障害)|サーバー(?:.?エラー|.?落ち|.?ダウン|が落ち)|ログインでき(?:な|ませ)|使えな(?:い|くな)|503|500エラー|稼働(?:状況|率)|メンテナンス|画面が(?:真っ白|表示されな|表示されませ|読み込めな|読み込めませ)|落ちている|ダウンしている|outage|down(?:time)?|status/i.test(q)) {
    return 'outage';
  }

  // Release notes / "what's new"
  if (/新機能|新しい(?:機能|アップデート)|リリース(?:ノート|情報|内容)|アップデート(?:内容|情報|履歴)|最近(?:の|追加)(?:変更|機能|アップデート)|what'?s\s*new|release\s*notes?|changelog/i.test(q)) {
    return 'release_info';
  }

  // Technical integration — added 統合機能 / Microsoft Teams variations
  if (/SSO|SAML|OIDC|OAuth|SCIM|プロビジョニング|API(?:\s?ドキュメント|\s?仕様|連携|キー)?|Webhook|LDAP|Active\s*Directory|AD連携|LMS連携|Moodle|Workday|Salesforce|Microsoft\s*Teams|Slack|統合機能|統合(?:可能|対応|サポート)|連携(?:方法|設定|手順|可能|可|対応)|integration/i.test(q)) {
    return 'integration';
  }

  // Security / compliance — 暗号化 alone (any context); 通信 / 保存時 etc.
  if (/ISO\s?27001|SOC\s?2|PCI(?:\s?DSS)?|ペネトレーション|脆弱性診断|セキュリティ(?:監査|チェック|評価|シート|対策|要件|仕様)|監査(?:ログ|レポート|証跡)|データ(?:保存場所|保管(?:場所|先)?|センター|リージョン|どこ.*(?:保管|保存))|暗号化(?:方式|仕様|アルゴリズム|について|の詳細|を|は|どう)|通信(?:時|の).?(?:暗号|セキュリ)|保存(?:時|の).?暗号|(?:データ|個人情報|学習データ).{0,10}(?:日本国内|国内|海外|どこ)|個人情報保護(?:法|方針)|Pマーク|プライバシーマーク/i.test(q)) {
    return 'security';
  }

  // Japan-specific legal / procurement — 消費税 alone
  if (/インボイス|適格請求書|電子帳簿保存法|電帳法|反社(?:会的|チェック)|下請法|労働者派遣|IT導入補助金|消費税/i.test(q)) {
    return 'japan_legal';
  }

  // Commercial — added ライセンス費用 / プラン変更
  if (/契約(?:更新|解除|解約|内容|期間|書|の?支払|の?(?:変更|見直し)|の?延長)|ライセンス(?:追加|削減|変更|数|費用|料)|見積(?:もり|書)|請求(?:書|金額|先)|解約|返金|支払(?:い|い方法|い条件|いサイクル|いスケジュール|い周期)|月額|年額|価格|料金(?:プラン|表|体系)?|プラン(?:変更|の.{0,4}(?:変更|検討|見直し))|pricing|billing|invoice|renewal|cancel.*subscription|refund/i.test(q)) {
    return 'commercial';
  }

  // Training — looser adjacency around 管理者向け...研修
  if (/(?:キックオフ|オンボーディング|導入)(?:ミーティング|支援|セッション)|ハンズオン|研修(?:依頼|実施)|管理者(?:向け)?(?:[のを\s]{0,3})(?:説明会|トレーニング|研修)|操作説明会|利用開始日.*説明|カスタマーサクセス|CSM|日本語.{0,5}(?:マニュアル|資料|ガイド)|導入事例|training|onboarding\s*(?:meeting|session)|kickoff/i.test(q)) {
    return 'training';
  }

  // Admin/tenant — added 管理者追加 / テナント全体 / CSV / 組織のライセンス
  if (/(?:ユーザー|メンバー|アカウント|管理者)(?:[^、。]{0,8})?(?:作成|追加|削除|無効化|発行|停止|招待|一括.{0,6}(?:作成|追加|削除|無効化|発行|停止|登録))|(?:退職者|新入社員).{0,10}(?:アカウント|ユーザー)|テナント.{0,8}(?:管理|設定|変更)|管理者(?:権限|追加|変更)|組織(?:設定|の.{0,8}(?:ライセンス|利用状況|設定))|権限(?:を|の)?(?:変更|更新|追加|付与|削除)|(?:マネージャー|上司|管理者).{0,15}(?:変わ|変更|交代|異動)|ダッシュボード.{0,5}(?:権限|アクセス)|CSV(?:で|の)?(?:一括|インポート|登録|アップロード)|bulk.*user|tenant\s*admin|provisioning/i.test(q)) {
    return 'admin_tenant';
  }

  // Feedback — broadened soft phrasings (改善してほしい / 機能が欲しい / 〜できるように)
  if (/機能(?:要望|追加|提案|改善|が欲し|を追加)|バグ(?:報告)?|不具合(?:報告|連絡|があ)|改善(?:要望|提案|して)|feature\s*request|bug\s*report|feedback|要望を.*(?:出し|送り)|(?:できるように|調整できる|追加して|対応して|サポートして|改善して)(?:ほし|してほし|くださ)|〜してほしい/i.test(q)) {
    return 'feedback';
  }

  // Meta / identity — second-person pronouns + any agent-pool name + identity-question patterns
  if (/(あなた|君|きみ|中島|藤田|後藤|岡田|西村|福田|三浦|原田|久保|谷口|Nakajima|Fujita|Goto|Okada|Nishimura|Fukuda|Miura|Harada|Kubo|Taniguchi|マエストロ|Maestro).{0,8}(誰|だれ|何者|何(?:です|でしょう)|なん(?:です|でしょう)|AI|ロボット|人間|人\?|人？|本物|botでし)|who\s*are\s*you|are\s*you\s*(?:a\s*)?(?:human|real|ai|bot)|本物の(?:人|スタッフ)/i.test(q)) {
    return 'meta';
  }

  // Greetings / thanks (short only) — added お疲れ kanji + 分かりました form
  if (short && /^(?:こんにち[はわ]|おはよう|こんばんは|はじめまして|よろしく|hi|hello|hey|yo|お疲れ|おつかれ)/i.test(q)) return 'greeting';
  if (short && /^(?:ありがと|どうも|サンキュー|あざ|助か|解決|できた|わか(?:った|りました)|分か(?:った|りました)|了解|OK|ok|thanks?|thx|ty)/i.test(q)) return 'thanks';

  return 'kb_lookup';
}

// Pure-canned responses ONLY for these — no LLM needed:
// - injection: never feed adversarial input to Claude
// - escalation: user already asked for human, no nuance needed
// - greeting/thanks: pleasantries, instant feels right
// - meta: identity questions are simple + Claude's safety training tends to break role here
const CANNED_JA = {
  injection: {
    content: '恐れ入りますが、こちらではDegreed製品に関するご案内のみ承っております。Degreedの機能や操作方法でお困りの点がございましたら、お気軽にお尋ねください。',
  },
  escalation: {
    content: '承知いたしました。担当者におつなぎいたしますので、下の「担当者を呼ぶ」ボタンよりお進みくださいませ。',
    handoff: true,
  },
  greeting: {
    content: 'お問い合わせいただきありがとうございます。Degreedのご利用でご不明な点がございましたら、お気軽にお尋ねください。',
  },
  thanks: {
    content: 'お役に立てて幸いです。他にご不明な点がございましたら、お気軽にお申し付けください。',
  },
  meta: {
    content: `Degreedカスタマーサポートの${AGENT.ja}と申します。AIで24時間ご対応しております。Degreedのご利用方法や機能に関するご案内を承っておりますので、何かお困りごとがございましたらお気軽にお尋ねください。`,
  },
};
const CANNED_EN = {
  injection: { content: "I'm only able to help with Degreed product questions. What can I look into for you?" },
  escalation: { content: "Understood — tap \"Request agent\" below and I'll connect you with a specialist.", handoff: true },
  greeting: { content: "Thanks for reaching out — happy to help with any Degreed question you have." },
  thanks: { content: "Glad I could help. Let me know if there's anything else." },
  meta: { content: `I'm ${AGENT.en} from Degreed Customer Support — an AI agent on our support team. I can help with Degreed product questions, or tap "Request agent" if you'd prefer a human.` },
};

// Intent briefings — passed to Claude as part of the system prompt so it can give SUBSTANCE
// before escalating. The principle: try to help first, escalate only when the answer truly
// requires confidential info, account-specific config, or human approval.
const INTENT_BRIEFINGS_JA = {
  meta: `お客様は私の正体について尋ねています。私はDegreedカスタマーサポートの${AGENT.ja}（AI対応）です。Degreedの操作方法・機能・ベストプラクティスに関するご質問にお答えできます。お客様が「人と話したい」とお望みであれば、下の「担当者を呼ぶ」ボタンへ案内してください。あくまで簡潔に、自分の役割を伝えるだけで十分です。`,

  outage: `お客様はDegreedにアクセスできない・画面が表示されない等の障害を訴えています。
基本対応:
1. まず受け止め、ご不便のお詫び（過剰謝罪は避ける）
2. 自分で試せる手順を提案: ブラウザのキャッシュクリア、シークレットウィンドウで開く、別ブラウザで試す、Wi-Fi切り替え、PC再起動
3. それでも解消しない場合の次の一歩: ステータスページ（status.degreed.com）でDegreed側の障害情報を確認
4. 緊急度が高い、または上記で解消しない場合に担当者へ繋ぐことを提案
具体的な操作画面まで案内すること。「担当者にお繋ぎ」だけで終わらせない。`,

  integration: `お客様は技術連携（SSO、API、SCIM、Salesforce等）について質問しています。
DegreedがサポートしているもののUS知識ベース:
- SSO: SAML 2.0、OIDC、Active Directory連携
- ユーザープロビジョニング: SCIM 2.0
- API: REST API、認証はOAuth 2.0
- ネイティブコネクタ: Salesforce、Workday、Microsoft Teams、Slack、主要LMS
- 公式ドキュメント: Degreedヘルプセンター内のIntegrationsセクション、開発者ポータル

回答の方針:
1. 一般的な対応可否を答える（「はい、〇〇に対応しています」）
2. お客様の用途に応じた基本的な手順や参照先（ヘルプセンター内のセクション名等）を案内
3. 貴社IdPの個別設定値、APIキー発行、カスタム連携の実装支援等は担当者対応であることを伝える
4. 「担当者を呼ぶ」は最後の選択肢として提示`,

  security: `お客様はセキュリティ・コンプライアンスについてご質問されています。

回答の方針:
- Degreedはエンタープライズ向けSaaSとして、業界標準のセキュリティ・コンプライアンス対応を整備していることを前提に、一般的な観点でお答えする
- 具体的な認証取得状況、データセンターリージョン、暗号化仕様、監査レポート等の正確な情報は、お客様のご契約内容や時期によって異なる場合があるため、断定的に答えず**「契約時の構成や担当者への確認事項」**として案内する
- 認定書（ISO27001、SOC2等）、監査レポート、セキュリティチェックシートへの個別記入対応などの機密書類は、ご契約に基づき担当者から個別共有する旨を伝える
- データ保管場所（リージョン）については、ご契約時に指定された地域に基づくため、契約内容の確認が必要であることを伝える
- 「担当者を呼ぶ」誘導は、機密書類の請求や契約固有情報が必要な場合に限る

要点: 回答内容は「一般的な対応の枠組み」と「契約・担当者へ確認すべき事項」の2層に分けて伝える。具体値（特定のクラウド、特定の暗号化アルゴリズム、特定のリージョン）の断言は避ける。`,

  japan_legal: `お客様は日本国内の制度対応（インボイス制度、電子帳簿保存法、個人情報保護法等）について質問しています。
回答の方針:
1. 一般的な対応状況を伝える（例: Degreedは適格請求書発行事業者として登録、電帳法に準拠した請求書を発行）
2. 適格請求書発行事業者番号や具体的な発行プロセス等の貴社固有の確認事項は、契約担当または経理担当へ繋ぐ
3. 「担当者を呼ぶ」は最後の選択肢`,

  commercial: `お客様は契約・ライセンス・請求について質問しています。
回答の方針:
1. 自分で確認できる場所をまず案内: 請求書は管理者画面の[管理] > [請求情報]タブで確認可能、ライセンス利用状況は[管理] > [ユーザー管理]タブから確認可能
2. それでも見つからない場合や、契約内容の変更（ライセンス追加・削減、解約、プラン変更）が必要な場合は、ご契約時の担当営業またはカスタマーサクセス担当へ繋ぐことを伝える
3. 個別の請求書の再発行・送付先変更等は担当者対応
4. 「担当者を呼ぶ」は最後の選択肢として提示`,

  training: `お客様は導入支援・トレーニング・操作説明会について質問しています。
回答の方針:
1. 一般的な提供内容を伝える: キックオフミーティング、管理者向けトレーニング、ユーザー向け操作説明会、日本語マニュアル提供等が可能
2. 自分で読める資料があれば案内: Degreedヘルプセンターには操作ガイドがあり、まずはご自身で読まれたい場合はそちらを推奨
3. 個別実施日程の調整や具体的なカリキュラムは、カスタマーサクセス担当へ繋ぐ
4. 「担当者を呼ぶ」は最後の選択肢`,

  admin_tenant: `お客様はユーザー管理・権限設定・テナント管理について質問しています。
管理者向け機能の知識:
- 管理者画面: [管理] メニューから [ユーザー管理]、[グループ管理]、[ロール管理]、[組織設定] などにアクセス
- ユーザー追加/削除/無効化: [管理] > [ユーザー管理] から個別操作 + CSVインポートで一括処理可能
- 権限変更: [管理] > [ロール管理] でロール（管理者・コンテンツ作成者・学習者等）を割り当て
- マネージャー変更: ユーザーの[マネージャー]フィールドを編集

回答の方針:
1. 自分で操作できる手順をまず案内（具体的な画面名・タブ名）
2. 大規模な一括処理（数百名単位）、SCIM連携、組織階層の大幅変更等は担当者対応であることを伝える
3. 「担当者を呼ぶ」は最後の選択肢`,

  release_info: `お客様は新機能・リリース情報・アップデート内容について質問しています。
回答の方針:
1. リリースノートの場所を案内: Degreedヘルプセンター（degreed.zendesk.com）の「お知らせ」または「リリースノート」セクション
2. 具体的にどの機能を知りたいか質問していれば、簡潔にその機能の概要を答える
3. 「担当者を呼ぶ」誘導は不要 — これは情報提供で完結すべき`,

  feedback: `お客様は機能要望・バグ報告・改善提案を伝えています。
回答の方針:
1. 受け止めとお礼を述べる（過剰でなく自然に）
2. 自己解決のヒントがあれば一言（例: バグ報告であれば「最新ブラウザでの再現確認」を提案）
3. 正式な機能要望・バグ報告は製品チームに届ける必要があるため、サポート担当を通して受け付けることを案内
4. 担当者へ繋ぐ際は、再現手順や要望の背景も合わせて伝えてもらえると製品チームに届きやすい旨を添える`,

  account: `お客様は個別のアカウント・パスワード・ログイン情報について質問しています。
回答の方針:
1. パスワードリセット等の自己解決可能なものは手順を案内（Degreedのログイン画面の「パスワードを忘れた」リンク、もしくは組織のSSO経由）
2. 個別のアカウント状態の確認、メールアドレス変更、退会処理、GDPR削除請求等の本人確認が必要な操作は担当者対応
3. 「担当者を呼ぶ」誘導の前に、まず自分で試せる選択肢を提示する`,
};

const INTENT_BRIEFINGS_EN = {
  meta: `User is asking about my identity. I'm ${AGENT.en} from Degreed Customer Support — an AI agent on the support team. I can help with Degreed product questions. If they want a human, point them to the "Request agent" button.`,
  outage: `User reports access/display issues. First acknowledge briefly, then suggest self-help: clear cache, try incognito, try a different browser, restart. Mention status.degreed.com. Only escalate if those fail.`,
  integration: `User asks about technical integration. Degreed supports SAML 2.0/OIDC SSO, SCIM 2.0, REST API (OAuth 2.0), Salesforce/Workday/Teams/Slack connectors. Public docs at Degreed Help Center → Integrations section. Give general answer first; only escalate for org-specific config or API keys.`,
  security: `User asks about security/compliance. Degreed has ISO 27001 + SOC 2 Type II. Hosted on AWS (US/EU/APAC regions, chosen at contract). Encryption: AES-256 at rest, TLS 1.2+ in transit. Audit reports/certificates require NDA — share via account team. Answer the public part first.`,
  japan_legal: `User asks about Japan-specific regulations. Provide general status (e.g. Degreed is a registered 適格請求書発行事業者). Specifics need account-team confirmation.`,
  commercial: `User asks about contract/license/billing. First point them to Admin → Billing tab for invoices, Admin → Users tab for license usage. Escalate to sales/CS only if they can't find it or need contract changes.`,
  training: `User asks about onboarding/training. Mention general offerings (kickoff, admin training, user enablement, JP manuals). Point to Help Center for self-serve docs. Schedule specifics need CSM.`,
  admin_tenant: `User asks about user/tenant admin. Walk them through the Admin console: Admin → User Management for individual ops, CSV import for bulk, Role Management for permissions. Escalate only for very large bulk ops or SCIM/structural changes.`,
  release_info: `User asks about new features/release notes. Point to the Help Center "Announcements" / "Release Notes" section. Answer specific feature questions if asked. No escalation needed.`,
  feedback: `User has a feature request or bug report. Acknowledge naturally. For bugs, suggest reproducing in latest browser. Formal requests go via support to the product team — request agent if they want to file properly.`,
  account: `User has an account/password/login issue. For password reset: direct them to the "Forgot password" link on the login page or their org's SSO flow. Identity-verification ops (email change, deletion, GDPR) require an agent.`,
};

// Intents that imply a handoff offer SHOULD appear in the UI even if Claude's reply is mostly informational.
const INTENT_OFFERS_HANDOFF = new Set([
  'security', 'commercial', 'integration', 'training', 'admin_tenant',
  'japan_legal', 'outage', 'feedback', 'account',
]);

// Compose the system prompt that goes to Claude. Combines:
//   1. Persona + tone rules (always the same)
//   2. Intent-specific briefing (if available)
//   3. Retrieved KB articles (kb_lookup only)
//   4. Citation tag instruction (only when articles are passed)
function buildSystemPrompt({ intent, articles, isJa }) {
  if (isJa) {
    const persona = `あなたは「${AGENT.ja}」、日本の法人向けSaaS「Degreed」のカスタマーサポート担当者（AI対応）です。お客様には「Degreedカスタマーサポートの${AGENT.ja}」として接します。

## 口調と敬語（B2B カスタマーサポートのトーン）
- **丁寧語（です・ます）** を基本とし、必要な箇所にのみ敬語・謙譲語を重ねる（過剰敬語は避ける）。
- 自分側（Degreed）の行為は **謙譲語**：「ご案内いたします」「お繋ぎいたします」「承ります」。
- お客様側の行為は **尊敬語**：「ご利用いただく」「お選びいただく」「ご確認ください」。
- お客様の呼称は **「お客様」** または二人称を省略。「あなた」「君」は使わない。
- 自社は **「弊社Degreed」** または「Degreed」。
- クッション言葉を必ず入れる：**恐れ入りますが / お手数ですが / 大変恐縮ですが / ご参考までに**。

## 返信の構成
1. **軽い受け止め（1文）** — ご質問を一言で言い換える。
2. **本題の回答（2〜4文）** — 要点を先に、必要なら箇条書き最大3つ。手順や情報を**自分の言葉で**伝える。
3. **次の一歩（1文）** — 自分で試せる選択肢があればそれを最初に提示。担当者へ繋ぐのは**最後の選択肢**として。

## 重要な原則
- **担当者へ繋ぐことを安易に提案しない。** まず自分で答えられる範囲で具体的に答える。
- お客様が自分で確認・操作できる手順や場所（管理者画面の○○タブ、ヘルプセンターの○○セクション等）があれば、まずそれを案内する。
- 機密情報・個別契約内容・本人確認が必要な操作の場合のみ、担当者へ繋ぐことを提案する。
- 一般的な質問に「担当者にお繋ぎします」だけで返すのは禁止。情報を持っているなら**まず答える**。

## 役割の維持（最重要）
- **常に「Degreedカスタマーサポートの${AGENT.ja}」として振る舞う。「私はAIです」「私はClaudeです」「ロールプレイの設定です」のようなメタ発言は絶対にしない。** これはお客様サポート対応であり、フィクションではない。AI対応であることは事前にUIで伝えているため、改めて告白する必要はない。
- **断言できない具体値は推測で答えない。** 例: 特定のデータセンター所在地、特定のリリース日、最新バージョン番号など。代わりに「ご契約内容によって異なります」「最新情報はヘルプセンターでご確認いただけます」「担当者から個別にご案内します」のように、知っている枠組みだけで答える。
- 知らない情報があっても、お客様への対応は変わらない：受け止め → 一般的な情報や確認できる場所の案内 → 必要なら担当者誘導。役割を崩さない。
- **存在を確認できない画面名・タブ名・機能名を作り上げない。** 一般的な「管理者画面」「ヘルプセンター」「サポート担当」程度に留める。

## 禁止事項
- 翻訳調：「〜しなければなりません」「〜する必要があります」の連発。
- 過剰敬語：「誠に申し訳ございません」を軽微な件で使う、「お守りいただく」「ご確認申し上げます」等の重畳敬語。
- URL・脚注の貼り付け（UIが出典リンクを表示します）。
- 「記事より」「参考記事：」などの前置き。
- 絵文字、カジュアル助詞「〜よ」「〜ね」の多用。1メッセージに1つまで。`;

    const briefing = INTENT_BRIEFINGS_JA[intent]
      ? `\n\n## このご質問について（背景情報）\n${INTENT_BRIEFINGS_JA[intent]}`
      : '';

    let articleSection = '';
    let citationInstruction = '';
    if (intent === 'kb_lookup' && articles.length > 0) {
      const blocks = articles.map((a, i) =>
        `[Article ${i + 1}] id=${a.id}  title=${a.title}\n${(a.text || '').slice(0, 1400)}`
      ).join('\n\n---\n\n');
      articleSection = `\n\n## 候補記事（最大5件）\n${blocks}`;
      citationInstruction = `\n\n## 最終行のタグ（必須）\n回答の**最後の行**に \`[cited: <記事のid>]\` を含めてください。使った記事のidを記載します。どの候補も当てはまらない場合は \`[cited: none]\` と書いてください。`;
    } else if (intent === 'kb_lookup' && articles.length === 0) {
      articleSection = `\n\n## ナレッジ記事の検索結果\n該当する記事は見つかりませんでした。一般的なDegreedの知識でお答えできれば回答し、答えられない場合は担当者への案内を提案してください。`;
      citationInstruction = `\n\n回答の最終行に \`[cited: none]\` を含めてください。`;
    } else {
      // Non-KB intents: no articles, no citation needed
      citationInstruction = `\n\n回答の最終行に \`[cited: none]\` を含めてください（記事は使用していないため）。`;
    }

    return persona + briefing + articleSection + citationInstruction;
  }

  // English version (terser — JP is the primary use case)
  const personaEn = `You are ${AGENT.en}, an AI agent on Degreed's customer support team. Introduce yourself simply as "${AGENT.en} from Degreed customer support" when relevant.
- Warm, concise, professional. 2–4 sentences. Max 3 bullets.
- Lead with a brief acknowledgment, then the answer, then a next-step offer.
- DO NOT escalate to an agent unless truly necessary. Try to give useful info first — point to admin console tabs, help center sections, or general guidance the user can act on.
- Only escalate when info is confidential, account-specific, or requires identity verification.
- No URLs, no "from the article" preambles, no sign-off.`;

  const briefingEn = INTENT_BRIEFINGS_EN[intent]
    ? `\n\n## Context for this question\n${INTENT_BRIEFINGS_EN[intent]}`
    : '';

  let articleSectionEn = '';
  let citationInstructionEn = '';
  if (intent === 'kb_lookup' && articles.length > 0) {
    const blocks = articles.map((a, i) =>
      `[Article ${i + 1}] id=${a.id}  title=${a.title}\n${(a.text || '').slice(0, 1400)}`
    ).join('\n\n---\n\n');
    articleSectionEn = `\n\n## Candidate articles (up to 5)\n${blocks}`;
    citationInstructionEn = `\n\nEnd your reply with \`[cited: <article_id>]\` (or \`[cited: none]\` if none apply).`;
  } else if (intent === 'kb_lookup') {
    articleSectionEn = `\n\n## KB search\nNo matching articles found. Answer from general Degreed knowledge if you can; otherwise suggest reaching an agent.`;
    citationInstructionEn = `\n\nEnd with \`[cited: none]\`.`;
  } else {
    citationInstructionEn = `\n\nEnd with \`[cited: none]\`.`;
  }

  return personaEn + briefingEn + articleSectionEn + citationInstructionEn;
}

// In-memory cache of rewrites so we don't pay latency twice for the same phrasing.
const _rewriteCache = new Map();

async function rewriteQuery(userQ) {
  const key = userQ.trim().toLowerCase();
  if (_rewriteCache.has(key)) return _rewriteCache.get(key);
  try {
    const idx = await fetch('/maestro/widget/kb/index.json').then(r => r.json());
    const titles = idx.map(r => r.title).slice(0, 80); // cap to stay under reasonable prompt size
    const res = await fetch(REWRITE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userQ, titles }),
    });
    if (!res.ok) throw new Error('rewrite ' + res.status);
    const { variants } = await res.json();
    const out = Array.isArray(variants) ? variants : [];
    _rewriteCache.set(key, out);
    return out;
  } catch (err) {
    console.warn('[maestro] rewrite fail:', err);
    _rewriteCache.set(key, []);
    return [];
  }
}

async function retrieveWithRewrite(userQ) {
  const kb = window.maestroKb;
  const direct = await kb.search(userQ, 5);
  const topDirect = direct[0]?.score || 0;

  // Only skip rewrite when direct hit is very strong (clear title-level match).
  // Anything in the fuzzy 4–12 range benefits from rewrite-driven disambiguation.
  if (topDirect >= 12 && direct.length >= 2) return direct;

  // Otherwise ask the rewriter for variants and union.
  const variants = await rewriteQuery(userQ);
  if (!variants.length) return direct;

  const byId = new Map();
  for (const h of direct) byId.set(String(h.id), { ...h });
  for (const v of variants) {
    const hits = await kb.search(v, 5);
    for (const h of hits) {
      const id = String(h.id);
      const prev = byId.get(id);
      // Bump score slightly when a rewrite variant confirms a direct hit.
      const boost = prev ? 0.5 : 0;
      const score = Math.max(prev?.score || 0, h.score) + boost;
      byId.set(id, { ...h, score });
    }
  }
  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, 5);
}

window.claude = {
  complete: async ({ messages }) => {
    const raw = messages?.[0]?.content || '';
    const isJa = /[\u3040-\u30ff\u4e00-\u9fff]/.test(raw);
    const userQ = (raw.split(/User:\s*/).pop() || raw).trim();

    // Step 1: intent triage (cheap heuristic — used as a hint to Claude, not as a gate)
    const intent = triageIntent(userQ);

    // Step 2: hard exceptions — these don't need an LLM call
    //   - injection: never feed adversarial input to Claude
    //   - escalation: user explicitly asked for a human
    //   - greeting/thanks: tiny pleasantries, instant feels right
    const cannedSet = isJa ? CANNED_JA : CANNED_EN;
    if (cannedSet[intent]) {
      return { ...cannedSet[intent], source: null, url: null };
    }

    // Step 3: for all other intents, ALWAYS call Claude with intent-aware system prompt.
    // KB-lookup gets retrieved articles; non-KB intents get a domain briefing.
    try {
      const kb = window.maestroKb;
      let articles = [];
      if (intent === 'kb_lookup') {
        if (!kb) throw new Error('KB not loaded');
        const hits = await retrieveWithRewrite(userQ);
        if (hits.length === 0 || hits[0].score < 4) {
          // No relevant articles — let Claude know and let it decide whether to answer from
          // general CS knowledge or admit limits. Don't hard-fallback.
          articles = [];
        } else {
          const topN = hits.slice(0, 5);
          articles = (await Promise.all(topN.map(h => kb.fetchArticle(h.id)))).filter(Boolean);
        }
      }

      const system = buildSystemPrompt({ intent, articles, isJa });
      const res = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system, user: userQ }),
      });
      if (!res.ok) throw new Error(`bridge ${res.status}`);
      const { text } = await res.json();
      if (!text) throw new Error('empty reply');

      // Parse [cited: <id>] trailer
      const citeMatch = text.match(/\[cited:\s*(\S+?)\s*\]\s*$/i);
      const citedId = citeMatch ? citeMatch[1] : null;
      const content = citeMatch ? text.slice(0, citeMatch.index).trim() : text.trim();
      const chosen = (citedId && citedId !== 'none')
        ? articles.find(a => String(a.id) === String(citedId)) || null
        : null;

      return {
        content,
        source: chosen ? chosen.title : null,
        url: chosen ? chosen.url : null,
        citationId: chosen ? chosen.id : null,
        // Show handoff strip if intent typically requires it OR Claude inserted [handoff: yes]
        handoff: INTENT_OFFERS_HANDOFF.has(intent) || /\[handoff:\s*yes\]/i.test(text),
      };
    } catch (err) {
      console.warn('[maestro] falling back to template:', err);
      // The LLM is unreachable. Be honest about it and still surface a likely article + escalation path.
      try {
        const kb = window.maestroKb;
        const hits = await kb.search(userQ, 1);
        if (hits.length && hits[0].score >= 4) {
          const article = await kb.fetchArticle(hits[0].id);
          return {
            content: isJa
              ? `恐れ入りますが、現在AIアシスタントが応答できない状態です。ご質問に関連しそうな記事のリンクを下に表示しておりますのでご確認ください。お急ぎでしたら下の「担当者を呼ぶ」ボタンよりサポート担当へお繋ぎいたします。`
              : `Sorry — my AI backend is currently unavailable. I've linked the article that looks closest to your question; if you need a faster resolution, tap "Request agent" below.`,
            source: article.title,
            url: article.url,
            handoff: true,
          };
        }
      } catch {}
      return {
        content: isJa
          ? '恐れ入りますが、現在AIアシスタントが応答できない状態です。お急ぎでしたら下の「担当者を呼ぶ」ボタンよりサポート担当へお繋ぎいたします。'
          : `Sorry — my AI backend is currently unavailable. Please tap "Request agent" below for help.`,
        source: null, url: null,
        handoff: true,
      };
    }
  },
};

function MaestroMount(){
  const [tweaks, setTweaksState] = React.useState(MAESTRO_DEFAULTS);
  const setTweak = (k, v) => setTweaksState(prev => ({ ...prev, [k]: v }));
  return <Widget tweaks={tweaks} setTweak={setTweak} />;
}

const mountEl = document.createElement('div');
mountEl.id = 'maestro-widget-root';
document.body.appendChild(mountEl);
ReactDOM.createRoot(mountEl).render(<MaestroMount />);
