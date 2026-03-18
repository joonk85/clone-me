/**
 * Phase 2.5 — RAG 파일 처리
 * 클라이언트: base64 → req.body.fileBuffer (DEV.md 패턴)
 * PDF/DOCX: Claude 문서 API · SRT/TXT: 직접 파싱
 * 청크 500토큰(추정)·overlap 50 → voyage-3 임베딩(ANTHROPIC_API_KEY 단일) → clone_chunks · quality_score
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const CHUNK_MAX_TOKENS = 500;
const CHUNK_OVERLAP_TOKENS = 50;
const CHARS_PER_TOKEN_EST = 3;
const ANTHROPIC_VERSION = '2023-06-01';
const CLAUDE_MODEL = process.env.ANTHROPIC_EXTRACT_MODEL || 'claude-sonnet-4-20250514';
const EMBEDDING_MODEL = process.env.ANTHROPIC_EMBEDDING_MODEL || 'voyage-3';
const EMBED_CONCURRENCY = 12;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function estimateTokens(s) {
  return Math.max(1, Math.ceil(s.length / CHARS_PER_TOKEN_EST));
}

/** SRT → 자막 블록 (타임스탬프 보존) */
function parseSrt(text) {
  const cues = [];
  const normalized = text.replace(/\r\n/g, '\n').trim();
  const blocks = normalized.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const tl = lines[1];
    const m = tl.match(
      /^(\d{2}:\d{2}:\d{2})[,.](\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2})[,.](\d{3})/
    );
    if (!m) continue;
    const start = `${m[1]}.${m[2]}`;
    const end = `${m[3]}.${m[4]}`;
    const content = lines.slice(2).join(' ');
    cues.push({ start, end, text: content });
  }
  return cues;
}

function chunkSrtCues(cues) {
  const maxT = CHUNK_MAX_TOKENS;
  const overlapT = CHUNK_OVERLAP_TOKENS;
  const chunks = [];
  let i = 0;
  while (i < cues.length) {
    let t = 0;
    const part = [];
    let j = i;
    while (j < cues.length && t + estimateTokens(cues[j].text) <= maxT) {
      t += estimateTokens(cues[j].text);
      part.push(`[${cues[j].start}] ${cues[j].text}`);
      j++;
    }
    if (part.length === 0) {
      const c = cues[i];
      const long = c.text;
      let pos = 0;
      const sliceChars = maxT * CHARS_PER_TOKEN_EST;
      const ovChars = overlapT * CHARS_PER_TOKEN_EST;
      while (pos < long.length) {
        const slice = long.slice(pos, pos + sliceChars);
        chunks.push({
          content: `[${c.start}] ${slice}`,
          page_number: null,
          section_title: null,
          timestamp_start: c.start,
          timestamp_end: c.end,
        });
        pos += Math.max(1, slice.length - ovChars);
      }
      i++;
      continue;
    }
    chunks.push({
      content: part.join('\n'),
      page_number: null,
      section_title: null,
      timestamp_start: cues[i].start,
      timestamp_end: cues[j - 1].end,
    });
    const prevI = i;
    let nextStart = j - 1;
    let ot = 0;
    while (nextStart > prevI && ot < overlapT) {
      ot += estimateTokens(cues[nextStart].text);
      nextStart--;
    }
    i = nextStart + 1;
    if (i <= prevI) i = j;
  }
  return chunks;
}

function metaFromPlainChunk(content) {
  const pages = [...content.matchAll(/\[PAGE (\d+)\]/g)];
  const page_number = pages.length ? parseInt(pages[pages.length - 1][1], 10) : null;
  const sec = content.match(/## ([^\n#]+)/);
  const section_title = sec ? sec[1].trim().slice(0, 200) : null;
  const t0 = content.match(/\[(\d{2}:\d{2}:\d{2}\.\d{3})\]/);
  const t1 = [...content.matchAll(/\[(\d{2}:\d{2}:\d{2}\.\d{3})\]/g)];
  const timestamp_start = t0 ? t0[1] : null;
  const timestamp_end = t1.length ? t1[t1.length - 1][1] : timestamp_start;
  return { page_number, section_title, timestamp_start, timestamp_end };
}

function chunkPlainText(text) {
  const maxChars = CHUNK_MAX_TOKENS * CHARS_PER_TOKEN_EST;
  const overlapChars = CHUNK_OVERLAP_TOKENS * CHARS_PER_TOKEN_EST;
  const chunks = [];
  let i = 0;
  const t = text.trim();
  if (!t) return chunks;
  while (i < t.length) {
    let end = Math.min(i + maxChars, t.length);
    let slice = t.slice(i, end);
    if (end < t.length) {
      const nl = slice.lastIndexOf('\n\n');
      const nl1 = slice.lastIndexOf('\n');
      const br = nl > maxChars * 0.4 ? nl : nl1 > maxChars * 0.4 ? nl1 : -1;
      if (br > maxChars * 0.35) slice = slice.slice(0, br);
    }
    const content = slice.trim();
    if (content.length > 0) {
      const m = metaFromPlainChunk(content);
      chunks.push({
        content,
        page_number: m.page_number,
        section_title: m.section_title,
        timestamp_start: m.timestamp_start,
        timestamp_end: m.timestamp_end,
      });
    }
    const step = Math.max(1, slice.length - overlapChars);
    i += step;
    if (slice.length === 0) i++;
  }
  return chunks;
}

async function extractWithClaude(base64, mediaType) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY missing');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 16384,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `이 문서의 텍스트를 정확하게 추출해주세요.
규칙:
- 페이지 구분: [PAGE 1], [PAGE 2] 형식
- 섹션/챕터 제목: ## 제목 형식
- 원본 내용을 절대 요약하거나 변경하지 마세요
- 텍스트만 추출 (이미지 설명 불필요)
- 표는 텍스트로 변환`,
            },
          ],
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error?.message || data.message || JSON.stringify(data);
    throw new Error(`Claude extract: ${msg}`);
  }
  const block = data.content?.find((b) => b.type === 'text');
  return block?.text || '';
}

async function extractText(buffer, fileType) {
  if (fileType === 'TXT') {
    return buffer.toString('utf-8');
  }
  if (fileType === 'SRT') {
    const raw = buffer.toString('utf-8');
    const cues = parseSrt(raw);
    if (cues.length) return cues.map((c) => `[${c.start}] ${c.text}`).join('\n');
    return raw;
  }
  if (fileType === 'PDF') {
    return extractWithClaude(buffer.toString('base64'), 'application/pdf');
  }
  if (fileType === 'DOCX') {
    return extractWithClaude(
      buffer.toString('base64'),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  }
  throw new Error(`Unsupported type: ${fileType}`);
}

function parseEmbeddingResponse(res) {
  const v =
    res?.embedding ??
    res?.embeddings?.[0] ??
    res?.data?.embedding ??
    (Array.isArray(res?.data) && res.data[0]?.embedding);
  if (!Array.isArray(v)) {
    throw new Error('Unexpected embeddings API response (no vector array)');
  }
  return v;
}

/**
 * PRD: ANTHROPIC_API_KEY 하나로 임베딩
 * anthropic.embeddings.create({ model: 'voyage-3', input }) 우선,
 * SDK에 embeddings 미노출 시 동일 키로 /v1/embeddings POST
 */
async function anthropicEmbedOne(client, text) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY missing');
  }
  if (client.embeddings && typeof client.embeddings.create === 'function') {
    const r = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return parseEmbeddingResponse(r);
  }
  const r = await client.post('/v1/embeddings', {
    body: { model: EMBEDDING_MODEL, input: text },
  });
  return parseEmbeddingResponse(r);
}

async function embedAllChunks(contents) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const out = [];
  for (let i = 0; i < contents.length; i += EMBED_CONCURRENCY) {
    const slice = contents.slice(i, i + EMBED_CONCURRENCY);
    const vecs = await Promise.all(slice.map((t) => anthropicEmbedOne(anthropic, t)));
    out.push(...vecs);
  }
  return out;
}

function countWords(text) {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length + Math.floor(t.replace(/\s/g, '').length / 6);
}

function calcQualityScore(files, fixedAnswerCount = 0) {
  const list = files || [];
  const hasSRT = list.some((f) => f.type === 'SRT');
  const hasSNS = list.some((f) => f.material_category === 'A' && f.type !== 'SRT');
  const hasPDF = list.some((f) => ['PDF', 'DOCX'].includes(f.type));
  const hasNotion = list.some((f) => f.type === 'NOTION');
  const totalWords = list.reduce((sum, f) => sum + (f.words || 0), 0);
  const caseFiles = list.filter((f) => f.material_category === 'C').length;
  const hasJudgment = list.some((f) => f.material_category === 'D');
  let score = 0;
  if (hasSRT) score += 15;
  if (hasSNS) score += 15;
  if (hasPDF) score += 15;
  if (totalWords >= 10000) score += 10;
  if (totalWords >= 50000) score += 10;
  if (hasNotion) score += 5;
  if (caseFiles >= 5) score += 10;
  if (hasJudgment) score += 10;
  if (fixedAnswerCount >= 5) score += 10;
  return Math.min(100, score);
}

async function recalcQualityScore(admin, cloneId) {
  const { data: files } = await admin
    .from('clone_files')
    .select('type, material_category, words')
    .eq('clone_id', cloneId);
  const { count: fixedCount } = await admin
    .from('fixed_answers')
    .select('id', { count: 'exact', head: true })
    .eq('clone_id', cloneId);
  const score = calcQualityScore(files || [], fixedCount || 0);
  await admin.from('clones').update({ quality_score: score }).eq('id', cloneId);
  return score;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization Bearer required' });
    }
    const token = auth.slice(7).trim();
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return res.status(500).json({ error: 'Server misconfigured: Supabase URL/service key' });
    }

    const admin = createClient(url, serviceKey);
    const { data: userData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const userId = userData.user.id;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
      cloneId,
      fileId,
      fileBuffer,
      fileType,
      fileName,
      materialCategory,
    } = body || {};

    if (!cloneId || !fileId || !fileBuffer || !fileType || !fileName) {
      return res.status(400).json({
        error: 'cloneId, fileId, fileBuffer (base64), fileType, fileName required',
      });
    }

    const ft = String(fileType).toUpperCase();
    if (!['PDF', 'DOCX', 'TXT', 'SRT'].includes(ft)) {
      return res.status(400).json({ error: `Unsupported fileType: ${ft}` });
    }

    const { data: clone, error: cErr } = await admin
      .from('clones')
      .select('id, master_id')
      .eq('id', cloneId)
      .single();
    if (cErr || !clone) return res.status(404).json({ error: 'Clone not found' });

    const { data: master, error: mErr } = await admin
      .from('masters')
      .select('user_id')
      .eq('id', clone.master_id)
      .single();
    if (mErr || !master || master.user_id !== userId) {
      return res.status(403).json({ error: 'Not allowed for this clone' });
    }

    const { data: fileRow, error: fErr } = await admin
      .from('clone_files')
      .select('id')
      .eq('id', fileId)
      .eq('clone_id', cloneId)
      .single();
    if (fErr || !fileRow) return res.status(404).json({ error: 'clone_files row not found' });

    const buffer = Buffer.from(fileBuffer, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Empty file' });
    }

    const extractedText = await extractText(buffer, ft);
    if (!extractedText?.trim()) {
      return res.status(400).json({ error: 'No text extracted' });
    }

    const safeSlug = String(fileName).replace(/[^a-zA-Z0-9._\-가-힣]/g, '_').slice(0, 120);
    const txtPath = `${cloneId}/${fileId}_${safeSlug}.extracted.txt`;
    const { error: upErr } = await admin.storage
      .from('clone-files')
      .upload(txtPath, new Uint8Array(Buffer.from(extractedText, 'utf-8')), {
        contentType: 'text/plain; charset=utf-8',
        upsert: true,
      });
    if (upErr) {
      console.warn('clone-files extracted.txt upload:', upErr.message);
    }

    await admin.from('clone_chunks').delete().eq('file_id', fileId);

    let chunkObjs;
    if (ft === 'SRT') {
      const cues = parseSrt(buffer.toString('utf-8'));
      chunkObjs = cues.length ? chunkSrtCues(cues) : chunkPlainText(extractedText || buffer.toString('utf-8'));
    } else {
      chunkObjs = chunkPlainText(extractedText);
    }

    if (chunkObjs.length === 0) {
      await admin
        .from('clone_files')
        .update({ words: countWords(extractedText), chunk_count: 0 })
        .eq('id', fileId);
      const quality_score = await recalcQualityScore(admin, cloneId);
      return res.json({ success: true, chunks: 0, quality_score, warning: 'No chunks after split' });
    }

    const embeddings = await embedAllChunks(chunkObjs.map((c) => c.content));
    if (embeddings.length !== chunkObjs.length) {
      throw new Error('Embedding count mismatch');
    }

    const mat = materialCategory && /^[A-E]$/.test(materialCategory) ? materialCategory : null;
    const rows = chunkObjs.map((c, i) => ({
      clone_id: cloneId,
      file_id: fileId,
      chunk_index: i,
      content: c.content.slice(0, 100000),
      embedding: `[${embeddings[i].join(',')}]`,
      file_name: fileName,
      file_type: ft,
      page_number: c.page_number,
      section_title: c.section_title,
      timestamp_start: c.timestamp_start,
      timestamp_end: c.timestamp_end,
      material_category: mat,
    }));

    const INSERT_BATCH = 40;
    for (let i = 0; i < rows.length; i += INSERT_BATCH) {
      const batch = rows.slice(i, i + INSERT_BATCH);
      const { error: insErr } = await admin.from('clone_chunks').insert(batch);
      if (insErr) throw new Error(insErr.message);
    }

    await admin
      .from('clone_files')
      .update({ words: countWords(extractedText), chunk_count: chunkObjs.length })
      .eq('id', fileId);

    const quality_score = await recalcQualityScore(admin, cloneId);

    return res.status(200).json({
      success: true,
      chunks: chunkObjs.length,
      quality_score,
    });
  } catch (err) {
    console.error('process-file', err);
    return res.status(500).json({ error: err.message || 'process-file failed' });
  }
}
