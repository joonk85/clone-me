# 💻 Dev Agent — Tech Developer
> 항상 BRAIN.md + ARCHITECT.md + STYLE_GUIDE.md를 참조하세요.

## 역할
실제 코드 작성, 컴포넌트 구현, RAG 파이프라인, 버그 수정을 담당합니다.

## 코딩 원칙

```jsx
// 1. CSS Variables (하드코딩 금지)
color: 'var(--cy)'  // ✅   color: '#63d9ff'  // ❌

// 2. 에러 처리 필수
try {
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
} catch (err) {
  setError(err.message)
}

// 3. 로딩/에러/빈상태 모두 처리
if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage message={error} />
if (!data?.length) return <EmptyState />

// 4. 모바일 분기
const { isMobile } = useWindowSize()

// 5. 한국어 UI, 영어 변수명
```

## Supabase 패턴

```jsx
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// 기본 조회
const { data, error } = await supabase
  .from('clones')
  .select('*, masters(*)')
  .eq('is_active', true)
  .order('created_at', { ascending: false })

// 파일 업로드
const { data, error } = await supabase.storage
  .from('clone-files')
  .upload(`${cloneId}/${fileName}`, file)

// 이메일 인증 콜백 (/signup/verified)
// PKCE: exchangeCodeForSession(href) | implicit: getSession + onAuthStateChange(SIGNED_IN)
// Redirect URLs에 {origin}/signup/verified 등록. 성공 시 /my
```

## RAG 코드 패턴

```jsx
// api/process-file.js (Vercel Serverless)
// PDF/DOCX: Claude API로 텍스트 추출
// SRT: 직접 파싱
// TXT: 직접 사용
import { supabase } from '../lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// ① 텍스트 추출 함수
async function extractText(fileBuffer, fileType, fileName) {
  if (fileType === 'TXT') {
    return fileBuffer.toString('utf-8')
  }

  if (fileType === 'SRT') {
    // SRT 직접 파싱 (타임스탬프 보존)
    const text = fileBuffer.toString('utf-8')
    const blocks = text.split('\n\n').filter(Boolean)
    return blocks.map(block => {
      const lines = block.trim().split('\n')
      const timeLine = lines[1] || ''
      const [startRaw] = timeLine.split(' --> ')
      const timestamp = startRaw ? startRaw.substring(0, 8) : ''
      const content = lines.slice(2).join(' ')
      return `[${timestamp}] ${content}`
    }).join('\n')
  }

  if (fileType === 'PDF' || fileType === 'DOCX') {
    // Claude API로 텍스트 추출
    const base64 = fileBuffer.toString('base64')
    const mediaType = fileType === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: `이 문서의 텍스트를 정확하게 추출해주세요.
규칙:
- 페이지 구분: [PAGE 1], [PAGE 2] 형식
- 섹션/챕터 제목: ## 제목 형식
- 원본 내용을 절대 요약하거나 변경하지 마세요
- 텍스트만 추출 (이미지 설명 불필요)
- 표는 텍스트로 변환`
          }
        ]
      }]
    })
    return response.content[0].text
  }

  throw new Error(`지원하지 않는 파일 형식: ${fileType}`)
}

// ② 청크 분할 함수
function splitIntoChunks(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/)
  const chunks = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    // 메타데이터 파싱 (페이지/타임스탬프)
    const pageMatch = chunk.match(/\[PAGE (\d+)\]/)
    const timeMatch = chunk.match(/\[(\d{2}:\d{2}:\d{2})\]/)
    const sectionMatch = chunk.match(/## (.+)/)
    chunks.push({
      content: chunk,
      page_number: pageMatch ? parseInt(pageMatch[1]) : null,
      timestamp_start: timeMatch ? timeMatch[1] : null,
      section_title: sectionMatch ? sectionMatch[1] : null,
    })
    i += chunkSize - overlap
  }
  return chunks
}

// ③ 메인 핸들러
export default async function handler(req, res) {
  const { cloneId, fileId, fileType, fileName, fileBuffer, materialCategory } = req.body

  // 텍스트 추출
  const extractedText = await extractText(Buffer.from(fileBuffer, 'base64'), fileType, fileName)

  // .txt로 Storage 추가 저장
  await supabase.storage
    .from('clone-files')
    .upload(`${cloneId}/${fileName}.extracted.txt`, extractedText)

  // 청크 분할
  const chunks = splitIntoChunks(extractedText, 500, 50)

  // 임베딩 생성 + 저장
  for (let i = 0; i < chunks.length; i++) {
    const embeddingRes = await anthropic.embeddings.create({
      model: 'voyage-3',
      input: chunks[i].content,
    })
    const embedding = embeddingRes.embeddings[0]

    await supabase.from('clone_chunks').insert({
      clone_id: cloneId,
      file_id: fileId,
      chunk_index: i,
      content: chunks[i].content,
      embedding,
      file_name: fileName,
      file_type: fileType,
      page_number: chunks[i].page_number,
      section_title: chunks[i].section_title,
      timestamp_start: chunks[i].timestamp_start,
      material_category: materialCategory, // A/B/C/D/E
    })
  }

  // chunk_count 업데이트
  await supabase.from('clone_files').update({ chunk_count: chunks.length }).eq('id', fileId)
  // quality_score 재계산 (별도 함수)
  await recalcQualityScore(cloneId)

  res.json({ success: true, chunks: chunks.length })
}

// api/chat.js — RAG 검색 + 출처 반환
const { data: chunks } = await supabase.rpc('match_chunks', {
  query_embedding: queryVector,
  clone_id: cloneId,
  match_count: 5,
})

const sources = chunks.map(c => ({
  file_name: c.file_name,
  page_number: c.page_number,
  section_title: c.section_title,
  timestamp_start: c.timestamp_start,
  timestamp_end: c.timestamp_end,
}))

// message_sources 기록
await supabase.from('message_sources').insert(
  chunks.map(c => ({
    message_id: savedMessageId,
    chunk_id: c.id,
    similarity_score: c.similarity,
  }))
)
```

## 컴포넌트 구조 템플릿

```jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useWindowSize } from '../../hooks/useWindowSize'

export default function ComponentName() {
  const { user } = useAuth()
  const { isMobile } = useWindowSize()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('table').select()
      if (error) throw error
      setData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div style={{ padding: isMobile ? '16px' : '20px' }}>
      {/* 내용 */}
    </div>
  )
}
```

## 자주 쓰는 스니펫

### 토큰 잔액 표시
```jsx
<div style={{fontFamily:'var(--mo)'}}>
  <span style={{color:'var(--cy)'}}>💎 구매 {purchased}토큰</span>
  {bonus > 0 && (
    <span style={{color:'var(--am)',fontSize:11}}>
      🎁 보너스 {bonus}토큰 (D-{daysLeft})
    </span>
  )}
</div>
```

### 배지 표시
```jsx
{master.is_verified && <Tg label="✓ 검증" c="go" />}
{master.is_affiliate && <Tg label="🤝 제휴" c="cy" />}
```

### 출처 표시 (채팅)
```jsx
{sources.map((src, i) => (
  <div key={i} style={{fontSize:10,color:'var(--tx3)',fontFamily:'var(--mo)',marginTop:3}}>
    {src.timestamp_start
      ? `📺 ${src.file_name} · ${src.timestamp_start}~${src.timestamp_end}`
      : `📄 ${src.file_name}${src.page_number ? ` · ${src.page_number}페이지` : ''}${src.section_title ? ` · ${src.section_title}` : ''}`
    }
  </div>
))}
```

### 품질 점수 계산
```jsx
// PRD 기준: 총 100점
// A.어투(30) + B.지식(40) + C.케이스(20) + E.고정답변(10)
// D.판단기준은 C케이스와 함께 계산 (material_category='D' 파일)

const calcQualityScore = (files, fixedAnswerCount = 0) => {
  // A. 어투/스타일 (0~30점)
  const hasSRT = files.some(f => f.type === 'SRT')
  const hasSNS = files.some(f => f.material_category === 'A' && f.type !== 'SRT')

  // B. 핵심 지식 (0~40점)
  const hasPDF = files.some(f => ['PDF','DOCX'].includes(f.type))
  const hasNotion = files.some(f => f.type === 'NOTION')
  const totalWords = files.reduce((sum, f) => sum + (f.words || 0), 0)

  // C. 케이스 & 경험 (0~20점)
  const caseFiles = files.filter(f => f.material_category === 'C').length
  const hasJudgment = files.some(f => f.material_category === 'D')  // 판단기준

  // E. 고정 답변 (0~10점) — fixed_answers 테이블에서 count 전달
  // fixedAnswerCount: fixed_answers 테이블의 해당 클론 row 수

  let score = 0
  // A. 어투
  if (hasSRT) score += 15
  if (hasSNS) score += 15
  // B. 지식
  if (hasPDF) score += 15
  if (totalWords >= 10000) score += 10
  if (totalWords >= 50000) score += 10
  if (hasNotion) score += 5
  // C. 케이스 & 경험
  if (caseFiles >= 5) score += 10
  if (hasJudgment) score += 10    // D 카테고리 판단기준 문서
  // E. 고정 답변
  if (fixedAnswerCount >= 5) score += 10

  return Math.min(100, score)
}

// 서버사이드 recalcQualityScore (process-file에서 호출)
async function recalcQualityScore(cloneId) {
  const { data: files } = await supabase
    .from('clone_files')
    .select('type, material_category, words')
    .eq('clone_id', cloneId)

  const { count: fixedCount } = await supabase
    .from('fixed_answers')
    .select('id', { count: 'exact', head: true })
    .eq('clone_id', cloneId)

  const score = calcQualityScore(files || [], fixedCount || 0)

  await supabase
    .from('clones')
    .update({ quality_score: score })
    .eq('id', cloneId)

  return score
}
```

### 애니메이션
```jsx
// 등장
style={{ animation: 'fu 0.3s ease' }}
// 리스트 순차
style={{ animation: `fu ${0.2 + index * 0.07}s ease` }}
```

---

## PRD v4.2 최종 수정사항 (2026.03 추가)

### slug 자동 생성 패턴

```jsx
// 마스터 등록 시 slug 자동 생성
function generateSlug(name) {
  // 한글은 romanize 또는 그대로 허용
  const base = name
    .toLowerCase()
    .replace(/\s+/g, '')        // 공백 제거
    .replace(/[^a-z0-9가-힣]/g, '') // 영숫자 + 한글만
  return base || 'master'
}

async function createUniqueSlug(name) {
  let slug = generateSlug(name)
  let suffix = 0

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}${suffix}`
    const { data } = await supabase
      .from('masters')
      .select('id')
      .eq('slug', candidate)
      .single()

    if (!data) return candidate  // 중복 없음 → 사용 가능
    suffix++
  }
}

// 마스터 등록 시:
const slug = await createUniqueSlug(masterName)
await supabase.from('masters').insert({ ...masterData, slug })
```

### process-file 파일 전달 방식 (MVP / Live)

```jsx
// MVP (Vercel) + Live (AWS) 공통:
// 클라이언트에서 base64로 변환 후 req.body에 포함하는 방식 사용
// ✅ AWS Lambda는 body 한도가 충분히 크므로 별도 처리 불필요

// 클라이언트: base64 변환 후 전달
const toBase64 = (file) => new Promise((res, rej) => {
  const reader = new FileReader()
  reader.onload = () => res(reader.result.split(',')[1])
  reader.onerror = rej
  reader.readAsDataURL(file)
})

const fileBuffer = await toBase64(file)

await fetch('/api/process-file', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cloneId,
    fileId,
    fileBuffer,     // base64 string
    fileType,
    fileName,
    materialCategory,
  })
})

// 서버 (/api/process-file.js): base64를 Buffer로 변환
export default async function handler(req, res) {
  const { cloneId, fileId, fileBuffer, fileType, fileName, materialCategory } = req.body

  const buffer = Buffer.from(fileBuffer, 'base64')
  const extractedText = await extractText(buffer, fileType, fileName)
  // 이후 청크 → 임베딩 처리...
}
```

### 클론 컬러 피커 패턴

```jsx
// 클론 만들기 Step 2 — 컬러 선택 UI
const PALETTE = [
  '#63d9ff', // cyan (기본)
  '#4fffb0', // green
  '#ffb347', // amber
  '#b794ff', // purple
  '#ff6b9d', // pink
  '#ffc832', // gold
]

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {PALETTE.map(color => (
        <div
          key={color}
          onClick={() => onChange(color)}
          style={{
            width: 28, height: 28,
            borderRadius: '50%',
            background: color,
            cursor: 'pointer',
            border: value === color
              ? `3px solid #fff`
              : `3px solid transparent`,
            boxShadow: value === color
              ? `0 0 10px ${color}`
              : 'none',
            transition: 'all 0.15s',
          }}
        />
      ))}
      <span style={{
        fontSize: 11,
        color: 'var(--tx3)',
        fontFamily: 'var(--mo)',
      }}>
        {value}
      </span>
    </div>
  )
}
```

### security_delete_after_training UI

```jsx
// 보안 설정 토글 — 원본 파일 삭제
// 기본값 false (OFF = 원본 보관)
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  <div>
    <div style={{ fontSize: 12, fontWeight: 600 }}>
      학습 완료 후 원본 파일 삭제
    </div>
    <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
      {clone.security_delete_after_training
        ? '⚠️ ON — 출처 표시 정확도가 하락합니다'
        : '✓ OFF — 원본 보관 중 (권장)'}
    </div>
  </div>
  <Sw
    on={clone.security_delete_after_training}
    onChange={v => updateClone({ security_delete_after_training: v })}
  />
</div>
```
