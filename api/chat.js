/**
 * Phase 2.5 — RAG 채팅
 * POST JSON + Authorization: Bearer <Supabase access_token>
 * Body: { cloneId, conversationId?, messages: [{ role:'user'|'assistant', content }] }
 * 마지막 메시지는 반드시 user.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const TOP_K = 5;
const ANTHROPIC_VERSION = '2023-06-01';
const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL || 'claude-sonnet-4-20250514';
const EMBEDDING_MODEL = process.env.ANTHROPIC_EMBEDDING_MODEL || 'voyage-3';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function parseEmbeddingResponse(res) {
  const v =
    res?.embedding ??
    res?.embeddings?.[0] ??
    res?.data?.embedding ??
    (Array.isArray(res?.data) && res.data[0]?.embedding);
  if (!Array.isArray(v)) throw new Error('Unexpected embeddings API response');
  return v;
}

async function anthropicEmbedOne(client, text) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing');
  if (client.embeddings && typeof client.embeddings.create === 'function') {
    const r = await client.embeddings.create({ model: EMBEDDING_MODEL, input: text });
    return parseEmbeddingResponse(r);
  }
  const r = await client.post('/v1/embeddings', { body: { model: EMBEDDING_MODEL, input: text } });
  return parseEmbeddingResponse(r);
}

function matchesFixedAnswer(userMsg, question) {
  const u = userMsg.trim().toLowerCase();
  const q = (question || '').trim().toLowerCase();
  if (q.length < 2) return false;
  if (u.includes(q)) return true;
  const tokens = q.split(/[\s,.!?、，。？！\n\r]+/).filter((t) => t.length >= 2);
  return tokens.some((t) => u.includes(t));
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
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
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    const admin = createClient(url, serviceKey);
    const { data: userData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    const userId = userData.user.id;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { cloneId, conversationId, messages: rawMessages } = body || {};

    if (!cloneId || !Array.isArray(rawMessages) || rawMessages.length === 0) {
      return res.status(400).json({ error: 'cloneId and messages[] required' });
    }

    const messages = rawMessages.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content);
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user') {
      return res.status(400).json({ error: 'Last message must be user' });
    }
    const lastUserText = String(last.content).trim();
    if (!lastUserText) return res.status(400).json({ error: 'Empty user message' });

    const { data: clone, error: cErr } = await admin
      .from('clones')
      .select('id, name, is_active, ctx_prompt, quality_citation')
      .eq('id', cloneId)
      .single();
    if (cErr || !clone) return res.status(404).json({ error: 'Clone not found' });
    if (!clone.is_active) return res.status(403).json({ error: 'Clone not active' });

    const { data: fixedRows } = await admin.from('fixed_answers').select('id, question, answer').eq('clone_id', cloneId);

    let answer = '';
    let fromFixed = false;
    let chunks = [];

    for (const fa of fixedRows || []) {
      if (matchesFixedAnswer(lastUserText, fa.question)) {
        answer = fa.answer;
        fromFixed = true;
        break;
      }
    }

    if (!fromFixed) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      let queryVec;
      try {
        queryVec = await anthropicEmbedOne(anthropic, lastUserText);
      } catch (e) {
        console.error('embed', e);
        return res.status(502).json({ error: 'Embedding failed', detail: e.message });
      }

      const vecStr = `[${queryVec.join(',')}]`;
      const { data: matched, error: rpcErr } = await admin.rpc('match_clone_chunks', {
        p_clone_id: cloneId,
        p_query_embedding: vecStr,
        p_match_count: TOP_K,
      });

      if (rpcErr) {
        console.error('match_clone_chunks', rpcErr);
        chunks = [];
      } else {
        chunks = matched || [];
      }

      const cite = clone.quality_citation !== false;
      let contextBlock = '';
      if (chunks.length) {
        contextBlock = chunks
          .map((c, i) => {
            const meta = [
              c.file_name && `파일: ${c.file_name}`,
              c.page_number != null && `페이지: ${c.page_number}`,
              c.section_title && `섹션: ${c.section_title}`,
              c.timestamp_start && `시간: ${c.timestamp_start}${c.timestamp_end ? `–${c.timestamp_end}` : ''}`,
            ]
              .filter(Boolean)
              .join(' · ');
            return `[자료 ${i + 1}${meta ? ` (${meta})` : ''}]\n${c.content}`;
          })
          .join('\n\n---\n\n');
      }

      const systemParts = [
        `당신은 "${clone.name}"의 지식을 바탕으로 답하는 AI 클론입니다. 한국어로 답하세요.`,
        'Claude·Anthropic이라고 밝히지 마세요. 오직 해당 전문가 클론으로만 말하세요.',
        chunks.length
          ? `아래 [참고 자료]만 근거로 답하세요. 자료에 없는 내용은 정확히 다음 한 문장만 사용하세요: "이 내용은 제 자료에 없어서 답변드리기 어렵습니다."`
          : '등록된 참고 자료 청크가 없습니다. 일반적인 인사·가벼운 대화에는 답할 수 있으나, 전문 내용은 "자료를 먼저 학습한 뒤 답변드릴 수 있습니다"라고 안내하세요.',
        clone.ctx_prompt ? `\n[마스터 지시]\n${clone.ctx_prompt}` : '',
        chunks.length ? `\n[참고 자료]\n${contextBlock}` : '',
        cite && chunks.length
          ? '\n답변 마지막에 참고한 자료 번호를 짧게 언급하세요 (예: 자료 1, 3 참고).'
          : '',
      ];
      const systemPrompt = systemParts.join('\n');

      const claudeMsgs = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: CHAT_MODEL,
          max_tokens: 2048,
          system: systemPrompt,
          messages: claudeMsgs,
        }),
      });
      const claudeJson = await claudeRes.json();
      if (!claudeRes.ok) {
        const msg = claudeJson.error?.message || JSON.stringify(claudeJson);
        console.error('Claude', msg);
        return res.status(claudeRes.status >= 400 ? claudeRes.status : 502).json({ error: msg });
      }
      const block = claudeJson.content?.find((b) => b.type === 'text');
      answer = block?.text || '답변을 생성하지 못했습니다.';
    }

    let convId = conversationId;
    if (convId) {
      const { data: conv, error: convErr } = await admin
        .from('conversations')
        .select('id, user_id, clone_id')
        .eq('id', convId)
        .single();
      if (convErr || !conv || conv.user_id !== userId || conv.clone_id !== cloneId) {
        return res.status(403).json({ error: 'Invalid conversation' });
      }
    } else {
      const { data: newConv, error: insConvErr } = await admin
        .from('conversations')
        .insert({ user_id: userId, clone_id: cloneId, is_test: false })
        .select('id')
        .single();
      if (insConvErr || !newConv) {
        console.error('conversation insert', insConvErr);
        return res.status(500).json({ error: 'Could not start conversation' });
      }
      convId = newConv.id;
    }

    const { data: userRow, error: uErr } = await admin
      .from('messages')
      .insert({
        conversation_id: convId,
        role: 'user',
        content: lastUserText,
      })
      .select('id')
      .single();
    if (uErr || !userRow) {
      console.error('user message', uErr);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    const { data: asstRow, error: aErr } = await admin
      .from('messages')
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: answer,
      })
      .select('id')
      .single();
    if (aErr || !asstRow) {
      console.error('assistant message', aErr);
      return res.status(500).json({ error: 'Failed to save reply' });
    }

    await admin.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);

    const sources = fromFixed
      ? []
      : chunks.map((c) => ({
          chunk_id: c.id,
          file_id: c.file_id,
          file_name: c.file_name,
          file_type: c.file_type,
          page_number: c.page_number,
          section_title: c.section_title,
          timestamp_start: c.timestamp_start,
          timestamp_end: c.timestamp_end,
          similarity: c.similarity != null ? Number(c.similarity) : null,
        }));

    if (!fromFixed && chunks.length) {
      const sim = (x) => {
        const n = Number(x);
        if (Number.isNaN(n)) return null;
        return Math.min(0.9999, Math.max(0, n));
      };
      await admin.from('message_sources').insert(
        chunks.map((c) => ({
          message_id: asstRow.id,
          chunk_id: c.id,
          similarity_score: sim(c.similarity),
        }))
      );

      const period = currentPeriod();
      for (const c of chunks) {
        if (!c.file_id) continue;
        const { error: incErr } = await admin.rpc('increment_file_reference_stat', {
          p_file_id: c.file_id,
          p_clone_id: cloneId,
          p_period: period,
        });
        if (incErr) console.error('increment_file_reference_stat', incErr);
      }
    }

    return res.status(200).json({
      answer,
      conversationId: convId,
      sources,
      fromFixedAnswer: fromFixed,
      usedRag: !fromFixed && chunks.length > 0,
    });
  } catch (err) {
    console.error('api/chat', err);
    return res.status(500).json({ error: err.message || 'chat failed' });
  }
}
