// llm-bridge.mjs — HTTP bridge from the widget to Google Gemini.
// Replaces the old claude-bridge.mjs (which shelled out to the local `claude` CLI).
// Now stateless — calls api.googleapis.com directly with GEMINI_API_KEY.
// Endpoints (same shape as before so the widget needs no changes):
//   POST /claude    — { system?, user, model? } → { text, model }
//   POST /rewrite   — { query, titles? } → { variants: string[], raw }
// Routes are kept named /claude for legacy compatibility with bootstrap.jsx.
//
// Deploy: works as a local Node server on :18801, or drop into Vercel as
// /api/claude.js + /api/rewrite.js (the runLLM core is portable).

import http from 'node:http';

const PORT = Number(process.env.LLM_BRIDGE_PORT || 18801);
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const REWRITER_MODEL = process.env.GEMINI_REWRITER_MODEL || 'gemini-2.5-flash-lite';
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY env var is required');
  console.error('Get one from https://aistudio.google.com/apikey then run:');
  console.error('  GEMINI_API_KEY=your-key node scripts/llm-bridge.mjs');
  process.exit(1);
}

const TIMEOUT_MS = 30000;

async function runLLM({ system, user, model }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500,
    },
    // Disable safety blocks that would otherwise reject legitimate CS prompts
    // (e.g. user typing "ログインできない" can read as "user in distress").
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`gemini ${res.status}: ${errBody.slice(0, 400)}`);
  }
  const data = await res.json();
  // Gemini puts the text response under candidates[0].content.parts[*].text
  const cand = data.candidates?.[0];
  if (!cand) throw new Error('gemini: no candidates returned');
  if (cand.finishReason && cand.finishReason !== 'STOP' && cand.finishReason !== 'MAX_TOKENS') {
    throw new Error(`gemini finish reason: ${cand.finishReason}`);
  }
  const text = (cand.content?.parts || []).map(p => p.text || '').join('').trim();
  if (!text) throw new Error('gemini: empty response');
  return text;
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 1e6) { req.destroy(); reject(new Error('body too large')); } });
    req.on('end', () => resolve(b));
    req.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  if (req.method === 'OPTIONS') { res.writeHead(204, headers); res.end(); return; }
  if (req.method !== 'POST' || (!req.url.startsWith('/claude') && !req.url.startsWith('/rewrite'))) {
    res.writeHead(404, headers);
    res.end(JSON.stringify({ error: 'POST /claude or /rewrite' }));
    return;
  }

  try {
    const body = await readBody(req);
    const payload = JSON.parse(body || '{}');

    if (req.url.startsWith('/rewrite')) {
      const q = payload.query || payload.user || '';
      const titles = Array.isArray(payload.titles) ? payload.titles : [];
      if (!q) { res.writeHead(400, headers); res.end(JSON.stringify({ error: 'missing query' })); return; }
      const titleBlock = titles.length
        ? `\n\nReference: vocabulary used in the KB (these are full article titles — DO NOT copy them verbatim into your output, use them only to understand the domain):\n${titles.map(t => `- ${t}`).join('\n')}`
        : '';
      const system = `You are a search-query rewriter for a Japanese customer support knowledge base about the Degreed learning platform.
Given the user's question in any language, produce 3–5 short Japanese SEARCH KEYWORD PHRASES that would help retrieve relevant articles.

Rules:
- Output STRICT JSON only, no prose, no code fences: {"variants": ["...", "...", "..."]}
- Each variant: 2–6 Japanese keywords joined by spaces (NOT full sentences, NOT full titles).
  Good: "プロフィール画像 変更", "スキル 追加 方法", "パスワード リセット"
  Bad:  "個人情報を更新する" (full title), "プロフィール画像はどこから変更できますか" (full sentence)
- Include literal translations AND likely concept synonyms. Example for "password reset" in Degreed (which has no native password-reset flow): also include "オンボーディング リセット" and "アカウント 設定".
- Prefer katakana form of loanwords (パスワード, not ぱすわーど)
- DO NOT copy KB article titles verbatim — pull individual keywords from them if useful, but never the whole title.${titleBlock}`;
      const raw = await runLLM({ system, user: `User query: ${q}\n\nJSON:`, model: REWRITER_MODEL });
      let variants = [];
      try {
        const m = raw.match(/\{[\s\S]*?"variants"[\s\S]*?\}/);
        const parsed = JSON.parse(m ? m[0] : raw);
        variants = Array.isArray(parsed.variants) ? parsed.variants.slice(0, 5) : [];
      } catch (parseErr) {
        console.warn('[bridge/rewrite] parse fail:', parseErr.message, 'raw:', raw.slice(0, 200));
      }
      res.writeHead(200, headers);
      res.end(JSON.stringify({ variants, raw }));
      return;
    }

    // Default /claude endpoint (kept for backward compatibility)
    const { system = '', user = '', model = DEFAULT_MODEL } = payload;
    if (!user) { res.writeHead(400, headers); res.end(JSON.stringify({ error: 'missing user' })); return; }
    const text = await runLLM({ system, user, model });
    res.writeHead(200, headers);
    res.end(JSON.stringify({ text, model }));
  } catch (err) {
    console.error('[bridge]', err);
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: String(err.message || err) }));
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`llm-bridge on http://127.0.0.1:${PORT}`);
  console.log(`  reply model:    ${DEFAULT_MODEL}`);
  console.log(`  rewrite model:  ${REWRITER_MODEL}`);
});
