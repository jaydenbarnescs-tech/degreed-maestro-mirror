// widget.jsx — the Degreed AI Customer Service Widget.
// Original component — no reproduction of any specific Degreed screen.
// Variants are selectable via Tweaks.

const W = {
  launcherWrap: {
    position:'fixed', right:24, bottom:24, zIndex: 9999,
    display:'flex', alignItems:'flex-end', gap:10,
    fontFamily:'Inter,sans-serif'
  },
  launcher: (variant) => ({
    position:'relative', cursor:'pointer',
    transition:'transform .25s cubic-bezier(.2,.9,.3,1.4)',
    animation:'dwFloat 5s ease-in-out infinite',
    ...(variant === 'pill' ? {
      height:56, borderRadius:28, padding:'0 20px 0 14px',
      background:'linear-gradient(140deg, #16305a 0%, #0b1f3a 55%, #0b1f3a 100%)',
      color:'#fff',
      display:'flex', alignItems:'center', gap:10,
      boxShadow:'0 18px 40px -12px rgba(11,31,58,.55), 0 4px 14px -4px rgba(255,106,77,.35), inset 0 1px 0 rgba(255,255,255,.08)',
      border:'1px solid rgba(255,255,255,.08)',
      fontWeight:600, fontSize:14, letterSpacing:'-.01em'
    } : {
      width:64, height:64, borderRadius:32,
      background:'radial-gradient(circle at 35% 30%, #1a3a6a 0%, #0b1f3a 65%)',
      color:'#fff',
      display:'grid', placeItems:'center',
      boxShadow:'0 18px 40px -12px rgba(11,31,58,.55), 0 4px 14px -4px rgba(255,106,77,.35), inset 0 1px 0 rgba(255,255,255,.1)',
      border:'1px solid rgba(255,255,255,.08)'
    })
  }),
  launcherDot: {
    position:'absolute', top:2, right:2,
    width:12, height:12, borderRadius:'50%',
    background:'#22c55e',
    boxShadow:'0 0 0 2px #0b1f3a, 0 0 10px rgba(34,197,94,.8)',
    animation:'dwStatusPulse 2s ease-in-out infinite'
  },
  halo: {
    position:'absolute', inset:-6, borderRadius:'50%',
    background:'conic-gradient(from 0deg, rgba(255,106,77,.0) 0%, rgba(255,106,77,.55) 25%, rgba(200,182,255,.55) 55%, rgba(255,106,77,.0) 100%)',
    filter:'blur(6px)',
    animation:'dwSpin 6s linear infinite',
    opacity:.85, pointerEvents:'none'
  },
  ripple: {
    position:'absolute', inset:0, borderRadius:'50%',
    border:'2px solid rgba(255,106,77,.45)',
    animation:'dwPulse 2.6s ease-out infinite',
    pointerEvents:'none'
  },
  ripple2: {
    position:'absolute', inset:0, borderRadius:'50%',
    border:'2px solid rgba(200,182,255,.35)',
    animation:'dwPulse 2.6s 1.3s ease-out infinite',
    pointerEvents:'none'
  },
  peekBubble: {
    background:'#fff', border:'1px solid var(--line)',
    borderRadius:'14px 14px 4px 14px',
    padding:'10px 13px', fontSize:13, color:'var(--ink-2)',
    boxShadow:'0 12px 30px -10px rgba(9,14,30,.22), 0 2px 6px rgba(9,14,30,.06)',
    maxWidth:220, lineHeight:1.35,
    position:'relative', marginBottom:10,
    display:'flex', alignItems:'center', gap:8,
    animation:'dwPop .5s cubic-bezier(.2,.9,.3,1.4) both'
  },
  peekClose: {
    width:18, height:18, borderRadius:'50%',
    border:'none', background:'var(--bg)', color:'var(--ink-4)',
    display:'grid', placeItems:'center', cursor:'pointer', fontSize:11,
    position:'absolute', top:-6, right:-6,
    boxShadow:'0 2px 6px rgba(0,0,0,.12)'
  },
  panel: (size) => ({
    position:'fixed', right:24, bottom:24, zIndex: 9999,
    width: size === 'compact' ? 380 : size === 'large' ? 520 : 440,
    height: size === 'compact' ? 560 : size === 'large' ? 680 : 620,
    maxHeight:'calc(100vh - 48px)',
    background:'#fff', borderRadius:20,
    boxShadow:'var(--shadow-lg)',
    border:'1px solid var(--line)',
    display:'flex', flexDirection:'column', overflow:'hidden',
    fontFamily:'Inter,sans-serif'
  }),
  header: {
    padding:'18px 20px',
    background:'var(--brand)',
    color:'#fff',
    position:'relative'
  },
  headerTop: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  agent: { display:'flex', alignItems:'center', gap:12 },
  agentAvatar: {
    width:40, height:40, borderRadius:12,
    background:'linear-gradient(135deg,#ff6a4d,#ffb199)',
    display:'grid', placeItems:'center',
    color:'#1a0d07', fontFamily:'Fraunces,serif', fontWeight:600, fontSize:18,
    position:'relative'
  },
  onlineDot: {
    position:'absolute', bottom:-2, right:-2,
    width:12, height:12, borderRadius:'50%',
    background:'#22c55e', border:'2px solid var(--brand)'
  },
  agentName: { fontSize:14, fontWeight:600, letterSpacing:'-.01em' },
  agentStatus: { fontSize:12, color:'rgba(255,255,255,.65)' },
  headerBtn: {
    width:32, height:32, borderRadius:8,
    background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)',
    color:'#fff', display:'grid', placeItems:'center', cursor:'pointer'
  },
  greeting: {
    fontFamily:'Fraunces,serif', fontWeight:500,
    fontSize:22, lineHeight:1.2, letterSpacing:'-.015em',
    margin:'18px 0 4px'
  },
  greetSub: { fontSize:13, color:'rgba(255,255,255,.7)', margin:0 },
  tabs: {
    display:'flex', gap:2, padding:'2px',
    background:'rgba(0,0,0,.18)', borderRadius:10,
    marginTop:16, fontSize:12.5
  },
  tab: (active) => ({
    flex:1, padding:'7px 10px', borderRadius:8,
    background: active ? 'rgba(255,255,255,.14)' : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,.6)',
    textAlign:'center', cursor:'pointer',
    fontWeight: active ? 600 : 500
  }),
  body: {
    flex:1, minHeight:0,
    overflowY:'auto',
    background:'#fbfaf7',
    padding:'18px 20px 10px',
    display:'flex', flexDirection:'column', gap:14
  },
  quickTitle: {
    fontSize:11, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase',
    color:'var(--ink-4)', margin:'4px 0 2px'
  },
  quickList: { display:'flex', flexDirection:'column', gap:8 },
  quick: {
    padding:'12px 14px', background:'#fff',
    border:'1px solid var(--line)', borderRadius:12,
    display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
    cursor:'pointer', textAlign:'left', width:'100%'
  },
  quickL: { display:'flex', alignItems:'center', gap:10, fontSize:13.5, color:'var(--ink)', fontWeight:500 },
  quickIcon: (bg) => ({
    width:28, height:28, borderRadius:8,
    background:bg, display:'grid', placeItems:'center', color:'#1a0d07', flex:'0 0 28px'
  }),
  resources: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:4 },
  resource: {
    padding:'12px 12px', background:'#fff',
    border:'1px solid var(--line)', borderRadius:12,
    cursor:'pointer'
  },
  resTitle: { fontSize:12.5, fontWeight:600, color:'var(--ink)', lineHeight:1.3, margin:'6px 0 2px' },
  resMeta: { fontSize:11, color:'var(--ink-4)' },
  bubbleUser: {
    alignSelf:'flex-end', maxWidth:'82%',
    padding:'10px 14px', borderRadius:'16px 16px 4px 16px',
    background:'var(--brand)', color:'#fff', fontSize:13.5, lineHeight:1.45
  },
  bubbleAI: {
    alignSelf:'flex-start', maxWidth:'90%',
    padding:'12px 14px', borderRadius:'16px 16px 16px 4px',
    background:'#fff', border:'1px solid var(--line)',
    color:'var(--ink)', fontSize:13.5, lineHeight:1.5
  },
  source: {
    display:'flex', alignItems:'center', gap:8,
    marginTop:10, padding:'8px 10px',
    background:'var(--bg)', borderRadius:8,
    fontSize:11.5, color:'var(--ink-3)',
    borderLeft:'2px solid var(--accent)'
  },
  footer: {
    borderTop:'1px solid var(--line)',
    padding:'12px 14px 14px',
    background:'#fff'
  },
  inputWrap: {
    display:'flex', alignItems:'flex-end', gap:8,
    background:'#fbfaf7', border:'1px solid var(--line)', borderRadius:14,
    padding:'8px 8px 8px 14px'
  },
  input: {
    flex:1, border:'none', background:'transparent', outline:'none',
    fontSize:13.5, lineHeight:1.4, color:'var(--ink)', resize:'none',
    fontFamily:'inherit', maxHeight:100, minHeight:20, padding:'4px 0'
  },
  iconBtn: {
    width:32, height:32, borderRadius:10,
    background:'transparent', border:'none', color:'var(--ink-4)',
    display:'grid', placeItems:'center', cursor:'pointer'
  },
  sendBtn: {
    width:32, height:32, borderRadius:10,
    background:'var(--brand)', color:'#fff', border:'none',
    display:'grid', placeItems:'center', cursor:'pointer'
  },
  footNote: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    marginTop:8, fontSize:10.5, color:'var(--ink-4)'
  },
  escalate: {
    margin:'4px 0 0', padding:'10px 12px',
    background:'#fff', border:'1px dashed var(--line)', borderRadius:10,
    display:'flex', alignItems:'center', gap:10,
    fontSize:12.5, color:'var(--ink-3)'
  },
  escBtn: {
    marginLeft:'auto', padding:'6px 10px', borderRadius:8,
    background:'var(--brand)', color:'#fff', border:'none',
    fontSize:12, fontWeight:600, cursor:'pointer'
  },

  /* Voice mode */
  voiceScrim: {
    flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    gap:18, background:'radial-gradient(ellipse at center, #f1ecff 0%, #fbfaf7 70%)'
  },
  orb: {
    width:140, height:140, borderRadius:'50%',
    background:'radial-gradient(circle at 35% 30%, #ffb199, #ff6a4d 55%, #0b1f3a 120%)',
    boxShadow:'0 20px 60px -10px rgba(255,106,77,.55), inset 0 0 40px rgba(255,255,255,.25)',
    position:'relative'
  },
  orbRing: {
    position:'absolute', inset:-18, borderRadius:'50%',
    border:'1px solid rgba(11,31,58,.12)'
  },
  nudge: {
    position:'fixed', right:96, bottom:36, zIndex:9998,
    background:'#fff', borderRadius:14, border:'1px solid var(--line)',
    padding:'12px 14px 12px 14px', maxWidth:260,
    boxShadow:'var(--shadow-md)', display:'flex', gap:10, alignItems:'flex-start'
  }
};

// Animated Maestro face — eyes blink, mouth gently curves, reacts to hover.
function MaestroFace({listening=false}){
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" style={{overflow:'visible'}}>
      <defs>
        <radialGradient id="mfGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".45"/>
          <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#mfGlow)"/>
      {/* eyes */}
      <g style={{animation:'dwBlinkEyes 5.5s infinite', transformOrigin:'center'}}>
        <ellipse cx="14" cy="18" rx="2.2" ry={listening ? 2.6 : 2.2} fill="#1a0d07"/>
        <ellipse cx="26" cy="18" rx="2.2" ry={listening ? 2.6 : 2.2} fill="#1a0d07"/>
        {/* sparkle */}
        <circle cx="14.8" cy="17.2" r=".7" fill="#fff"/>
        <circle cx="26.8" cy="17.2" r=".7" fill="#fff"/>
      </g>
      {/* mouth */}
      <path
        d={listening ? "M14 26 Q20 30 26 26" : "M14 26 Q20 28.5 26 26"}
        stroke="#1a0d07" strokeWidth="1.8" strokeLinecap="round" fill="none"
        style={{transition:'d .3s ease'}}
      />
    </svg>
  );
}

function AgentIcon({size=22, color='#fff'}){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-4l-4 3v-3H7a3 3 0 0 1-3-3z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="9.5" cy="10.5" r="1" fill={color}/>
      <circle cx="14.5" cy="10.5" r="1" fill={color}/>
      <path d="M9 13.5c.8.8 2 1 3 1s2.2-.2 3-1" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function SparkIcon({size=16, color='currentColor'}){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

const COPY = {
  en: {
    agentName: 'Customer Support',
    agentRole: 'AI agent • Yui',
    greet: 'How can I help you today?',
    greetSub: "Ask anything about Degreed — Yui from our customer support team is here to help.",
    tabs: ['Ask', 'Learn', 'Contact'],
    quickTitle: 'Popular questions',
    quicks: [
      ['How do I add a skill to my profile?', '#ffe3db'],
      ['What is a Pathway vs an Academy?', '#dce4f5'],
      ['How do skill reviews work?', '#ece7ff'],
      ['Reset my password', '#fff4b0'],
    ],
    resTitle: 'From the knowledge base',
    res: [
      ['Getting started with Degreed', '4 min read'],
      ['Creating your first Pathway', '6 min read'],
    ],
    placeholder: 'Type a message…',
    footNote: 'AI-generated • verified against Degreed docs',
    escalate: "Still need help? Talk to a human specialist.",
    escBtn: 'Request agent',
    voiceTitle: 'Listening…',
    voiceSub: 'Ask your question out loud. Tap to stop.',
    launcherPill: 'Ask Support',
    nudgeTitle: 'New to Degreed?',
    nudgeBody: "Hi, I'm Yui from Degreed customer support — I can walk you through your first skill setup in 2 minutes.",
    peeks: [
      "Hi — need a hand?",
      "Stuck? I can help.",
      "Ask me anything about Degreed ✨",
      "Want a quick tour?"
    ]
  },
  ja: {
    agentName: 'カスタマーサポート',
    agentRole: 'AI対応 • 担当: ユイ',
    greet: '本日はどのようなご用件ですか？',
    greetSub: 'Degreedに関するご質問は何でもお聞きください。担当のユイがご案内いたします。',
    tabs: ['質問', '学ぶ', 'お問合せ'],
    quickTitle: 'よくあるご質問',
    quicks: [
      ['プロフィールにスキルを追加する方法は？', '#ffe3db'],
      ['パスウェイとアカデミーの違いは？', '#dce4f5'],
      ['スキル評価の仕組みは？', '#ece7ff'],
      ['パスワードをリセット', '#fff4b0'],
    ],
    resTitle: 'ナレッジベースから',
    res: [
      ['Degreedを始める', '4分で読める'],
      ['最初のパスウェイを作成', '6分で読める'],
    ],
    placeholder: 'メッセージを入力…',
    footNote: 'AI生成 • Degreedドキュメントで検証済み',
    escalate: 'サポートが必要ですか？担当者と話す。',
    escBtn: '担当者を呼ぶ',
    voiceTitle: '聞いています…',
    voiceSub: '質問を声でお話しください。タップで停止。',
    launcherPill: 'サポートに聞く',
    nudgeTitle: 'Degreedは初めてですか？',
    nudgeBody: 'カスタマーサポートのユイと申します。最初のスキル設定を2分でご案内します。',
    peeks: [
      "こんにちは、お手伝いしましょうか？",
      "お困りですか？",
      "Degreedについて何でもどうぞ ✨",
      "簡単なツアーはいかがですか？"
    ]
  }
};

function Bubble({role, children}){
  return <div style={role === 'user' ? W.bubbleUser : W.bubbleAI}>{children}</div>;
}

function TypingDots(){
  return (
    <div style={{display:'flex', gap:4, alignItems:'center', padding:'4px 2px'}}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width:6, height:6, borderRadius:'50%', background:'var(--ink-4)',
          animation:`dwBlink 1.2s ${i*0.15}s infinite ease-in-out`
        }}/>
      ))}
    </div>
  );
}

function Widget({ tweaks, setTweak }){
  const lang = tweaks.lang === 'ja' ? 'ja' : 'en';
  // Agent display name: picked once at script load by bootstrap.jsx; pool of 10 JP last names
  const AGENT = (typeof window !== 'undefined' && window.__maestroAgent) || { ja: '中島', en: 'Nakajima' };
  const agentNameInLang = lang === 'ja' ? AGENT.ja : AGENT.en;
  const agentInitial = lang === 'ja' ? AGENT.ja.charAt(0) : AGENT.en.charAt(0);
  const baseT = COPY[lang];
  // Inject the agent name into copy strings that reference 担当: ユイ etc.
  const t = {
    ...baseT,
    agentRole: lang === 'ja' ? `AI対応 • 担当: ${AGENT.ja}` : `AI agent • ${AGENT.en}`,
    greetSub: lang === 'ja'
      ? `Degreedに関するご質問は何でもお聞きください。担当の${AGENT.ja}がご案内いたします。`
      : `Ask anything about Degreed — ${AGENT.en} from our customer support team is here to help.`,
    nudgeBody: lang === 'ja'
      ? `カスタマーサポートの${AGENT.ja}と申します。最初のスキル設定を2分でご案内します。`
      : `Hi, I'm ${AGENT.en} from Degreed customer support — I can walk you through your first skill setup in 2 minutes.`,
  };
  const [open, setOpen] = React.useState(tweaks.startOpen);
  // Modes: 'chat' (default — chat with welcome quick-actions when empty) | 'voice'
  // The old 'human' intake / 'ticket_submitted' modes are gone — escalation is now inline
  // (an email-collect form chip rendered below assistant messages with handoff:true).
  const [mode, setMode] = React.useState('chat');
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [streaming, setStreaming] = React.useState(false);
  const [nudgeVisible, setNudgeVisible] = React.useState(false);
  const bodyRef = React.useRef(null);

  React.useEffect(() => {
    if (!tweaks.proactive || open) return;
    const id = setTimeout(() => setNudgeVisible(true), 2500);
    return () => clearTimeout(id);
  }, [tweaks.proactive, open]);

  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, streaming]);

  React.useEffect(() => { setOpen(tweaks.startOpen); }, [tweaks.startOpen]);

  // Inline ticket-form state — at most one form open at a time, attached to the latest
  // assistant message that flagged handoff:true. Once submitted, that message records the ticket.
  const [inlineEmail, setInlineEmail] = React.useState('');
  const [submittingTicket, setSubmittingTicket] = React.useState(false);
  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || '').trim());

  async function submitInlineTicket(messageIndex) {
    if (!isValidEmail(inlineEmail) || submittingTicket) return;
    setSubmittingTicket(true);
    await new Promise(r => setTimeout(r, 700)); // simulated API latency
    const id = 'DGR-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    setMessages(ms => ms.map((m, i) =>
      i === messageIndex ? { ...m, ticketStatus: 'sent', ticketId: id, ticketEmail: inlineEmail } : m
    ));
    setInlineEmail('');
    setSubmittingTicket(false);
  }

  // Reset chat when widget is re-opened fresh
  React.useEffect(() => {
    if (open && mode !== 'chat' && mode !== 'voice') {
      setMode('chat');
      setMessages([]);
      setInlineEmail('');
    }
  }, [open]);

  async function send(text){
    const q = (text ?? input).trim();
    if (!q || streaming) return;
    setInput('');
    setMode('chat');
    const newMsgs = [...messages, { role:'user', content: q }];
    setMessages(newMsgs);
    setStreaming(true);

    // Simulated typing delay, then Claude call
    let reply = { content: '', source: null, url: null };
    try {
      const system = `You are Yui, an AI agent on Degreed's customer support team.
Respond in ${lang === 'ja' ? 'Japanese' : 'English'}.
Keep answers short (2–4 sentences), friendly, and link to concepts like Pathways, Skills, Academies, Skill Reviews when relevant.
If the user needs human help, suggest "Request agent".`;
      const out = await window.claude.complete({
        messages: [
          { role:'user', content: system + '\n\nUser: ' + q }
        ]
      });
      reply = (out && typeof out === 'object')
        ? { content: out.content || '', source: out.source || null, url: out.url || null, handoff: !!out.handoff }
        : { content: String(out || ''), source: null, url: null, handoff: false };
    } catch(e){
      reply = { content: lang === 'ja'
        ? '申し訳ございません。再度お試しください。'
        : "Sorry — I hit a snag. Please try again.", source: null, url: null, handoff: false };
    }
    setMessages(m => [...m, { role:'assistant', content: reply.content, source: reply.source, url: reply.url, handoff: reply.handoff }]);
    setStreaming(false);
  }

  const launcherVariant = tweaks.launcher || 'round';
  const [launchHover, setLaunchHover] = React.useState(false);
  const [peekVisible, setPeekVisible] = React.useState(false);
  const [peekIndex, setPeekIndex] = React.useState(0);

  // Show peek bubble after a beat, then cycle through prompts so the launcher feels alive.
  React.useEffect(() => {
    if (open) { setPeekVisible(false); return; }
    const first = setTimeout(() => setPeekVisible(true), 1800);
    return () => clearTimeout(first);
  }, [open]);

  React.useEffect(() => {
    if (open || !peekVisible) return;
    const cycle = setInterval(() => {
      setPeekIndex(i => (i + 1) % t.peeks.length);
    }, 4200);
    return () => clearInterval(cycle);
  }, [open, peekVisible, t.peeks.length]);

  return (
    <React.Fragment>
      {/* Proactive nudge */}
      {nudgeVisible && !open && (
        <div style={W.nudge}>
          <div style={{...W.agentAvatar, width:32, height:32, borderRadius:10, fontSize:14, flex:'0 0 32px'}}>{agentInitial}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12.5, fontWeight:600, marginBottom:2}}>{t.nudgeTitle}</div>
            <div style={{fontSize:12, color:'var(--ink-3)', lineHeight:1.4}}>{t.nudgeBody}</div>
            <div style={{display:'flex', gap:8, marginTop:8}}>
              <button onClick={() => { setNudgeVisible(false); setOpen(true); }} style={{
                padding:'5px 10px', borderRadius:6, background:'var(--brand)',
                color:'#fff', border:'none', fontSize:11.5, fontWeight:600, cursor:'pointer'
              }}>{lang==='ja'?'始める':'Start tour'}</button>
              <button onClick={() => setNudgeVisible(false)} style={{
                padding:'5px 8px', borderRadius:6, background:'transparent',
                color:'var(--ink-4)', border:'none', fontSize:11.5, cursor:'pointer'
              }}>{lang==='ja'?'あとで':'Not now'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Launcher */}
      {!open && (
        <div style={W.launcherWrap}>
          {/* Peek bubble cycling greetings */}
          {peekVisible && (
            <div style={W.peekBubble} key={peekIndex}>
              <span>{t.peeks[peekIndex]}</span>
              <button style={W.peekClose} onClick={(e) => { e.stopPropagation(); setPeekVisible(false); }} aria-label="Dismiss">×</button>
            </div>
          )}

          <button
            onClick={() => { setOpen(true); setNudgeVisible(false); setPeekVisible(false); }}
            onMouseEnter={() => setLaunchHover(true)}
            onMouseLeave={() => setLaunchHover(false)}
            style={{
              ...W.launcher(launcherVariant),
              transform: launchHover ? 'translateY(-3px) scale(1.05)' : 'translateY(0) scale(1)'
            }}
            aria-label="Open support chat"
          >
            {launcherVariant === 'pill' ? (
              <React.Fragment>
                <span style={{
                  position:'relative',
                  width:32, height:32, borderRadius:'50%',
                  background:'radial-gradient(circle at 35% 30%, #ffd1c2, #ff6a4d 60%)',
                  display:'grid', placeItems:'center', color:'#1a0d07',
                  boxShadow:'0 4px 10px rgba(255,106,77,.5), inset 0 1px 0 rgba(255,255,255,.4)'
                }}>
                  <MaestroFace listening={launchHover}/>
                </span>
                <span className={lang==='ja'?'jp':''}>{t.launcherPill}</span>
                <span style={{
                  marginLeft:4, display:'flex', gap:3, alignItems:'center'
                }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width:3, height:3, borderRadius:'50%', background:'rgba(255,255,255,.6)',
                      animation:`dwBlink 1.4s ${i*0.18}s infinite ease-in-out`
                    }}/>
                  ))}
                </span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                {/* layered aura / ripples */}
                <span style={W.halo}/>
                <span style={W.ripple}/>
                <span style={W.ripple2}/>
                <span style={{
                  position:'relative', width:'100%', height:'100%',
                  display:'grid', placeItems:'center'
                }}>
                  <MaestroFace listening={launchHover}/>
                </span>
                <span style={W.launcherDot}/>
              </React.Fragment>
            )}
          </button>
        </div>
      )}

      {/* Panel */}
      {open && (
        <div style={W.panel(tweaks.size)} className={lang==='ja'?'jp':''}>
          <header style={W.header}>
            <div style={W.headerTop}>
              <div style={W.agent}>
                <div style={W.agentAvatar}>
                  {agentInitial}<span style={W.onlineDot}/>
                </div>
                <div>
                  <div style={W.agentName}>{t.agentName}</div>
                  <div style={W.agentStatus}>{t.agentRole}</div>
                </div>
              </div>
              <div style={{display:'flex', gap:6}}>
                <button style={W.headerBtn} onClick={() => setMode(mode==='voice'?'chat':'voice')} aria-label="Voice">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
                  </svg>
                </button>
                <button style={W.headerBtn} onClick={() => setOpen(false)} aria-label="Close">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18"/>
                  </svg>
                </button>
              </div>
            </div>

            {messages.length === 0 && mode === 'chat' && (
              <React.Fragment>
                <h2 style={W.greeting}>{t.greet}</h2>
                <p style={W.greetSub}>{t.greetSub}</p>
              </React.Fragment>
            )}
          </header>

          {mode === 'voice' ? (
            <div style={W.voiceScrim}>
              <div style={W.orb}>
                <div style={W.orbRing}/>
                <div style={{...W.orbRing, inset:-34}}/>
                <div style={{...W.orbRing, inset:-54}}/>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:'Fraunces,serif', fontSize:20, letterSpacing:'-.01em'}}>{t.voiceTitle}</div>
                <div style={{fontSize:12.5, color:'var(--ink-4)', marginTop:4}}>{t.voiceSub}</div>
              </div>
              <button onClick={() => setMode(messages.length?'chat':'human')} style={{
                padding:'10px 18px', borderRadius:999, border:'1px solid var(--line)',
                background:'#fff', color:'var(--ink-2)', fontWeight:500, cursor:'pointer'
              }}>{lang==='ja'?'停止':'Stop'}</button>
            </div>
          ) : (
            <React.Fragment>
              <div style={W.body} ref={bodyRef}>
                {messages.length === 0 && (
                  <React.Fragment>
                    <div style={W.quickTitle}>{t.quickTitle}</div>
                    <div style={W.quickList}>
                      {t.quicks.map(([q, bg], i) => (
                        <button key={i} style={W.quick} onClick={() => send(q)}>
                          <span style={W.quickL}>
                            <span style={W.quickIcon(bg)}>
                              <SparkIcon size={14} color="#1a0d07"/>
                            </span>
                            {q}
                          </span>
                          <span style={{color:'var(--ink-4)'}}>→</span>
                        </button>
                      ))}
                    </div>

                    <div style={{...W.quickTitle, marginTop:8}}>{t.resTitle}</div>
                    <div style={W.resources}>
                      {t.res.map(([title, meta], i) => (
                        <div key={i} style={W.resource}>
                          <div style={{
                            height:56, borderRadius:8,
                            background: i===0?'linear-gradient(135deg,#dce4f5,#ece7ff)':'linear-gradient(135deg,#ffe3db,#fff4b0)'
                          }}/>
                          <div style={W.resTitle}>{title}</div>
                          <div style={W.resMeta}>{meta}</div>
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                )}

                {messages.map((m, i) => (
                  <Bubble key={i} role={m.role}>
                    <div style={{whiteSpace:'pre-wrap'}}>{m.content}</div>
                    {m.source && (m.url ? (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" style={{...W.source, textDecoration:'none', cursor:'pointer'}}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>
                        <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{m.source}</span>
                      </a>
                    ) : (
                      <div style={W.source}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>
                        {m.source}
                      </div>
                    ))}
                  </Bubble>
                ))}

                {streaming && (
                  <Bubble role="assistant"><TypingDots/></Bubble>
                )}

                {/* Inline email-collect form — appears below the latest assistant message that flagged handoff:true */}
                {!streaming && (() => {
                  const lastHandoffIdx = (() => {
                    for (let i = messages.length - 1; i >= 0; i--) {
                      if (messages[i].role === 'assistant' && messages[i].handoff) return i;
                    }
                    return -1;
                  })();
                  if (lastHandoffIdx === -1) return null;
                  const m = messages[lastHandoffIdx];
                  if (m.ticketStatus === 'sent') {
                    return (
                      <div style={{
                        marginTop: -2,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: '#dcfce7',
                        border: '1px solid #bbf7d0',
                        display: 'flex', alignItems: 'center', gap: 10,
                        fontSize: 12.5, color: '#15803d',
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span style={{flex:1}}>
                          {lang==='ja'
                            ? `お問い合わせを受け付けました。担当者より１営業日以内にご返信いたします。`
                            : `Got it — a specialist will reply within one business day.`}
                        </span>
                        <span style={{fontFamily:'monospace', fontSize:11, opacity:0.8, letterSpacing:'.04em'}}>{m.ticketId}</span>
                      </div>
                    );
                  }
                  return (
                    <div style={{
                      marginTop: -2,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: '#fff',
                      border: '1px solid var(--line)',
                      borderLeft: '3px solid var(--brand)',
                      display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                      <div style={{
                        display:'flex', alignItems:'center', gap:8,
                        fontSize:11.5, color:'var(--ink-3)', fontWeight:600,
                        letterSpacing:'.04em', textTransform:'uppercase',
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <span className={lang==='ja'?'jp':''}>
                          {lang==='ja' ? '担当者へお問い合わせ' : 'Contact a specialist'}
                        </span>
                      </div>
                      <div style={{
                        display:'flex', alignItems:'center', gap:6,
                        background:'#fbfaf7', borderRadius:8,
                        border:'1px solid var(--line)',
                        padding:'2px 4px 2px 10px',
                      }}>
                        <input
                          type="email"
                          value={inlineEmail}
                          onChange={(e) => setInlineEmail(e.target.value)}
                          placeholder={lang==='ja' ? 'メールアドレスを入力' : 'your email'}
                          style={{
                            flex:1, border:'none', outline:'none',
                            background:'transparent', fontSize:13, color:'var(--ink)',
                            fontFamily:'inherit', padding:'8px 0',
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && isValidEmail(inlineEmail)) {
                              e.preventDefault();
                              submitInlineTicket(lastHandoffIdx);
                            }
                          }}
                        />
                        <button
                          onClick={() => submitInlineTicket(lastHandoffIdx)}
                          disabled={!isValidEmail(inlineEmail) || submittingTicket}
                          style={{
                            width:30, height:30, borderRadius:8,
                            background: (!isValidEmail(inlineEmail) || submittingTicket) ? 'var(--ink-4)' : 'var(--brand)',
                            color:'#fff', border:'none',
                            display:'grid', placeItems:'center',
                            cursor: (!isValidEmail(inlineEmail) || submittingTicket) ? 'default' : 'pointer',
                            transition:'background .2s',
                          }}
                          aria-label="Submit ticket"
                        >
                          {submittingTicket ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'dwSpin 1s linear infinite'}}>
                              <path d="M21 12a9 9 0 1 1-6.2-8.55" strokeLinecap="round"/>
                            </svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      <div style={{fontSize:11, color:'var(--ink-4)'}} className={lang==='ja'?'jp':''}>
                        {lang==='ja'
                          ? 'これまでのチャット内容も担当者へ共有されます。'
                          : 'Your chat history will be shared with the specialist.'}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={W.footer}>
                <div style={W.inputWrap}>
                  <button style={W.iconBtn} aria-label="Attach">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 11l-8.5 8.5a5 5 0 1 1-7-7L14 4a3.5 3.5 0 1 1 5 5l-8.5 8.5a2 2 0 1 1-3-3L16 6"/></svg>
                  </button>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } }}
                    placeholder={t.placeholder}
                    rows={1}
                    style={W.input}
                  />
                  <button style={W.iconBtn} onClick={() => setMode('voice')} aria-label="Voice">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
                  </button>
                  <button style={W.sendBtn} onClick={() => send()} aria-label="Send" disabled={streaming}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
                  </button>
                </div>
                <div style={W.footNote}>
                  <span>{t.footNote}</span>
                  <span style={{display:'flex', alignItems:'center', gap:4}}>
                    <span style={{fontWeight:600, color:'var(--ink-3)'}}>Degreed</span>
                    <span>{lang === 'ja' ? 'サポート' : 'Support'}</span>
                  </span>
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
      )}

      <style>{`
        @keyframes dwBlink { 0%, 80%, 100% { opacity: .3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } }
        @keyframes dwPulse { 0% { transform:scale(1); opacity:.6; } 100% { transform:scale(1.75); opacity:0; } }
        @keyframes dwFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes dwSpin { to { transform: rotate(360deg); } }
        @keyframes dwStatusPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 2px #0b1f3a, 0 0 10px rgba(34,197,94,.8); }
          50% { transform: scale(1.15); box-shadow: 0 0 0 2px #0b1f3a, 0 0 16px rgba(34,197,94,1); }
        }
        @keyframes dwPop {
          0% { opacity: 0; transform: translateY(8px) scale(.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dwBlinkEyes {
          0%, 92%, 100% { transform: scaleY(1); }
          94%, 98% { transform: scaleY(.1); }
        }
      `}</style>
    </React.Fragment>
  );
}

window.Widget = Widget;
