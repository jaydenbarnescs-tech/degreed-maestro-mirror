// kb-search.js — client-side search + fetch tools over the Degreed Zendesk KB.
// Exposes window.maestroKb = { ready, search(q, n), fetchArticle(id) }.
// Loaded as a classic script before the widget boots.

(function () {
  const INDEX_URL = '/maestro/widget/kb/index.json';
  const ARTICLES_URL = '/maestro/widget/kb/articles.json';

  let indexPromise = null;
  let articlesPromise = null;

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(INDEX_URL).then(r => {
        if (!r.ok) throw new Error('kb index fetch failed: ' + r.status);
        return r.json();
      });
    }
    return indexPromise;
  }

  function loadArticles() {
    if (!articlesPromise) {
      articlesPromise = fetch(ARTICLES_URL).then(r => {
        if (!r.ok) throw new Error('kb articles fetch failed: ' + r.status);
        return r.json().then(arr => {
          const byId = new Map();
          for (const a of arr) byId.set(String(a.id), a);
          return byId;
        });
      });
    }
    return articlesPromise;
  }

  // Scoring tuned for short Japanese queries. Good enough for 58 articles.
  const CJK = /[\u3040-\u30ff\u4e00-\u9fff]/;
  const HIRA = /[\u3040-\u309f]/;
  // Particle/filler bigrams we don't want to reward — they match almost everything.
  const CJK_STOP_BIGRAMS = new Set([
    'する','して','した','され','れる','れて','られ','でき','ます','ませ','せん',
    'てい','てく','とい','いう','こと','もの','ため','よう','です','だっ',
    'につ','から','まで','では','には','とは','への','ある','あり','ない',
    'なる','なっ','にす','させ','自分','方法','教え','えて',
  ]);

  // Normalize for search: NFKC width-folding + katakana→hiragana transliteration.
  // Matches what scrape-kb.mjs pre-computes via wanakana — keeps hiragana and katakana
  // forms of the same loanword ("ぱすわーど" ↔ "パスワード") in the same space.
  function normalize(s) {
    if (!s) return '';
    const nfkc = s.normalize('NFKC').toLowerCase();
    let out = '';
    for (const ch of nfkc) {
      const cp = ch.codePointAt(0);
      // Katakana block U+30A1–U+30F6 → subtract 0x60 for hiragana equivalent.
      if (cp >= 0x30a1 && cp <= 0x30f6) out += String.fromCodePoint(cp - 0x60);
      else out += ch;
    }
    return out;
  }

  // Score one raw/reading pair against the needle pair. Returns the max per field.
  function scoreField(rawField, readingField, needle, needleReading, weight) {
    let s = 0;
    if (!rawField && !readingField) return 0;
    // Exact/contains match on both tracks, take max.
    let direct = 0;
    if (rawField && needle && rawField.includes(needle)) direct = weight * 3.5;
    if (readingField && needleReading && needleReading !== needle && readingField.includes(needleReading)) {
      direct = Math.max(direct, weight * 3.5);
    }
    s += direct;
    return s;
  }

  function score(q, rec) {
    if (!q) return 0;
    const needle = q.toLowerCase().trim();
    const needleReading = normalize(needle);
    const title = (rec.title || '').toLowerCase();
    const summary = (rec.summary || '').toLowerCase();
    const labels = (rec.labels || []).join(' ').toLowerCase();
    const section = (rec.section || '').toLowerCase();
    const titleR = rec.title_reading || '';
    const summaryR = rec.summary_reading || '';
    const labelsR = rec.labels_reading || '';
    const sectionR = rec.section_reading || '';

    let s = 0;

    // Exact title
    if (title === needle || titleR === needleReading) s += 20;

    // Whole-needle substring matches, per field, take max(raw, reading) per field.
    const matches = (raw, rdg) => (raw && needle && raw.includes(needle)) || (rdg && needleReading && rdg.includes(needleReading));
    if (matches(title, titleR)) s += 10;
    if (matches(section, sectionR)) s += 4;
    if (matches(labels, labelsR)) s += 3;
    if (matches(summary, summaryR)) s += 2;

    // Word tokens (English-friendly). Skip tokens that are the whole sentence.
    const tokens = needle.split(/[\s、。！？・,.\-_/]+/).filter(t => t.length >= 2 && t.length <= 6);
    for (const t of tokens) {
      const tR = normalize(t);
      if (title.includes(t) || titleR.includes(tR)) s += 3;
      if (section.includes(t) || sectionR.includes(tR)) s += 1.5;
      if (labels.includes(t) || labelsR.includes(tR)) s += 2;
      if (summary.includes(t) || summaryR.includes(tR)) s += 1;
    }

    // CJK bigram matching on the reading layer (catches hiragana↔katakana loanwords).
    if (HIRA.test(needleReading) && needleReading.length >= 2) {
      for (let i = 0; i < needleReading.length - 1; i++) {
        const bg = needleReading.slice(i, i + 2);
        if (CJK_STOP_BIGRAMS.has(bg)) continue;
        if (!HIRA.test(bg[0]) && !HIRA.test(bg[1])) continue;
        if (titleR.includes(bg)) s += 1;
        if (sectionR.includes(bg)) s += 0.5;
        if (summaryR.includes(bg)) s += 0.2;
      }
    }

    return s;
  }

  async function search(query, n = 5) {
    const index = await loadIndex();
    const scored = [];
    for (const rec of index) {
      const s = score(query, rec);
      if (s > 0) scored.push({ ...rec, score: s });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, n);
  }

  async function fetchArticle(id) {
    const articles = await loadArticles();
    const rec = articles.get(String(id));
    if (!rec) return null;
    return {
      id: rec.id,
      title: rec.title,
      url: rec.url,
      category: rec.category,
      section: rec.section,
      text: rec.body_text,
    };
  }

  // Warm the index in the background so first query feels snappy.
  const ready = loadIndex().then(() => true).catch(() => false);

  window.maestroKb = { ready, search, fetchArticle };
})();
