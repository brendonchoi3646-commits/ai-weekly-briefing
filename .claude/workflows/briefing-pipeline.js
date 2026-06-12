export const meta = {
  name: 'briefing-pipeline',
  description: 'AI 주간 브리핑 자동 생성 파이프라인 — 리서치·작성·검증·수정·배포를 한 번에 처리',
  phases: [
    { title: 'Research', detail: '4개 섹션 병렬 뉴스 수집' },
    { title: 'Write',    detail: '수집 결과를 HTML 브리핑으로 작성' },
    { title: 'Verify',   detail: '3개 독립 관점으로 품질 검증' },
    { title: 'Fix',      detail: '발견된 이슈 순차 수정' },
    { title: 'Publish',  detail: 'GitHub 커밋 및 푸시' },
  ],
}

// args.date: "YYYY-MM-DD" 형식으로 받음 (예: "2026-06-12")
// args.date 없으면 스킬이 오늘 날짜를 주입
const date = (args && args.date) ? args.date : 'UNKNOWN-DATE'
const filePath = `C:\\Users\\기획팀\\AI뉴스브리핑\\AI브리핑_${date}.html`
const prevFilePath = `C:\\Users\\기획팀\\AI뉴스브리핑\\AI브리핑_2026-06-11.html`

// ── 스키마 정의 ─────────────────────────────────────────────

const NEWS_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title:       { type: 'string' },
          summary:     { type: 'string' },
          badge:       { type: 'string', enum: ['NEW', 'HOT', '동향', '정책'] },
          source_name: { type: 'string' },
          source_url:  { type: 'string' },
          source_date: { type: 'string', description: 'YYYY.MM.DD 형식' },
        },
        required: ['title', 'summary', 'badge', 'source_name', 'source_url', 'source_date'],
      },
      minItems: 3,
    },
    insight: { type: 'string' },
  },
  required: ['items', 'insight'],
}

const ISSUE_SCHEMA = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label:       { type: 'string', enum: ['bug', 'enhancement'] },
          description: { type: 'string' },
          fix:         { type: 'string' },
        },
        required: ['label', 'description', 'fix'],
      },
    },
  },
  required: ['issues'],
}

// ── Phase 1: Research ────────────────────────────────────────
// 공식 패턴: parallel() — 4개 섹션을 배리어 없이 동시 실행.
// 모든 리서치 결과를 한꺼번에 받아야 Write 단계를 시작할 수 있으므로 parallel() 사용.

phase('Research')
log('4개 섹션 병렬 뉴스 수집 시작...')

const SECTIONS = [
  {
    key:   'ai-news',
    title: '이번 주 AI 핵심 뉴스',
    query: '한국 AI 핵심 뉴스 최신 2026 생성형AI LLM',
  },
  {
    key:   'domestic',
    title: '국내 기업 AI 도입 동향',
    query: '국내 대기업 중소기업 AI 도입 동향 스마트팩토리 2026',
  },
  {
    key:   'manufacturing',
    title: '제조·와이어로프 분야 AI',
    query: '철강 제조 와이어로프 AI 비전검사 예지보전 2026',
  },
  {
    key:   'macro',
    title: 'AI 매크로 트렌드',
    query: 'AI 정책 규제 멀티모달 글로벌 트렌드 2026',
  },
]

const researchResults = await parallel(SECTIONS.map(section => () =>
  agent(
    `섹션 "${section.title}" 뉴스를 3건 이상 수집하라.
검색 키워드: ${section.query}

신뢰 출처 우선순위:
1순위: zdnet.co.kr, etnews.com, aitimes.com
2순위: steeldaily.co.kr
3순위: mss.go.kr, bizinfo.go.kr
4순위: newsis.com, hankyung.com

금지 도메인: velog.io, ziin.ai, medium.com, tistory.com 등 개인 블로그
source_date는 반드시 실제 기사 게시일을 YYYY.MM.DD 형식으로 표기할 것.
insight는 이 섹션의 핵심 시사점 2문장으로 작성하라.`,
    {
      label:     `research:${section.key}`,
      phase:     'Research',
      agentType: 'section-researcher',
      schema:    NEWS_SCHEMA,
    }
  )
))

log(`리서치 완료 — ${researchResults.filter(Boolean).length}/4 섹션 수집됨`)

// ── Phase 2: Write ───────────────────────────────────────────
// 공식 패턴: Synthesize — 여러 fan-out 결과를 단일 에이전트가 통합.

phase('Write')
log('수집 결과를 HTML 브리핑으로 작성 중...')

const researchSummary = SECTIONS.map((s, i) => {
  const r = researchResults[i]
  if (!r) return `## ${s.title}\n수집 실패 — 이 섹션은 직접 검색하여 채울 것.`
  const itemLines = r.items.map(item =>
    `[${item.badge}] ${item.title}\n요약: ${item.summary}\n출처: ${item.source_name} | ${item.source_url} | ${item.source_date}`
  ).join('\n\n')
  return `## ${s.title}\n${itemLines}\n\n시사점: ${r.insight}`
}).join('\n\n---\n\n')

await agent(
  `AI 주간 브리핑 HTML 파일을 작성하라.

저장 경로: ${filePath}
참고 파일(구조·CSS 복사): ${prevFilePath}

규칙:
- 참고 파일의 HTML 구조와 <style> 블록을 그대로 사용한다
- 헤더 날짜와 발행일만 ${date}로 변경한다
- 뉴스 내용은 아래 리서치 결과로 완전히 교체한다
- 날짜 표기: YYYY.MM.DD 형식만 허용 (예: 2026.06.12)
  "2026.01.06.12" 같이 월 앞에 "01."이 들어가는 형식 절대 금지
- 각 섹션 section-num 스팬의 건수를 실제 항목 수로 맞출 것

리서치 결과:
${researchSummary}`,
  {
    label:     'write:briefing',
    phase:     'Write',
    agentType: 'briefing-writer',
  }
)

log(`HTML 파일 작성 완료: ${filePath}`)

// ── Phase 3: Verify ──────────────────────────────────────────
// 공식 패턴: Adversarial Verify — 독립된 3개 에이전트가 각기 다른 관점으로 검증.
// 동일 에이전트를 3번 쓰는 게 아니라 관점(lens)을 달리하여 편향을 방지.

phase('Verify')
log('3개 독립 관점으로 품질 검증 중...')

const VERIFY_LENSES = [
  {
    key:    'dates-urls',
    prompt: `날짜·URL 오류만 검사하라.
버그 기준:
- "2026.01.06.XX" 처럼 월 앞에 "01."이 삽입된 날짜 형식 오류
- URL에 nwww., htps:// 같은 도메인 오타
- 출처 날짜가 "2026.01"처럼 일(day) 없이 연월만 있는 항목
(다른 문제는 보고하지 말 것)`,
  },
  {
    key:    'source-trust',
    prompt: `출처 신뢰도만 검사하라.
enhancement 기준:
- velog.io, ziin.ai, medium.com, tistory.com, brunch.co.kr 등 개인 블로그/비전문 도메인 사용
- 기사 제목·내용과 출처 URL의 매체가 일치하지 않는 항목
(다른 문제는 보고하지 말 것)`,
  },
  {
    key:    'balance',
    prompt: `섹션 균형·뉴스 신선도만 검사하라.
enhancement 기준:
- 섹션 건수가 2건 이하인 섹션 (다른 섹션이 3건 이상이면 불균형)
- 출처 날짜가 발행일(${date}) 기준 3개월 이상 오래된 기사
(다른 문제는 보고하지 말 것)`,
  },
]

const verifyResults = await parallel(VERIFY_LENSES.map(lens => () =>
  agent(
    `파일을 읽고 아래 관점으로만 검증하라.
파일 경로: ${filePath}

검증 관점:
${lens.prompt}

문제가 없으면 issues 배열을 빈 배열로 반환.`,
    {
      label:     `verify:${lens.key}`,
      phase:     'Verify',
      agentType: 'fact-checker',
      schema:    ISSUE_SCHEMA,
    }
  )
))

const allIssues = verifyResults
  .filter(Boolean)
  .flatMap(r => r.issues)

log(`검증 완료 — 총 ${allIssues.length}건 발견 (버그: ${allIssues.filter(i => i.label === 'bug').length}, 개선: ${allIssues.filter(i => i.label === 'enhancement').length})`)

// ── Phase 4: Fix ─────────────────────────────────────────────
// 공식 패턴: pipeline() — 각 이슈를 순차 처리. 이슈 간 의존성 없으므로
// 배리어(parallel) 불필요. 이슈 A 수정이 완료되면 즉시 이슈 B로 넘어감.

phase('Fix')

if (allIssues.length === 0) {
  log('발견된 이슈 없음 — Fix 단계 건너뜀.')
} else {
  log(`${allIssues.length}건 순차 수정 시작...`)

  await pipeline(
    allIssues,
    (issue, _, idx) => agent(
      `HTML 파일에서 아래 이슈를 수정하라.

파일: ${filePath}
이슈 번호: ${idx + 1}/${allIssues.length}
유형: ${issue.label}
문제: ${issue.description}
수정 방향: ${issue.fix}

Edit 도구로 실제 파일을 수정하라.
수정 전·후 내용을 간단히 설명하라.`,
      {
        label: `fix:issue-${idx + 1}`,
        phase: 'Fix',
      }
    )
  )

  log('모든 이슈 수정 완료.')
}

// ── Phase 5: Publish ─────────────────────────────────────────

phase('Publish')
log('GitHub 커밋 및 푸시 중...')

await agent(
  `아래 git 명령을 순서대로 실행하라. PowerShell을 사용할 것.

$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
cd "C:\\Users\\기획팀\\AI뉴스브리핑"
git add "AI브리핑_${date}.html"
git commit -m "feat: AI 주간 브리핑 ${date} 자동 생성 (harness pipeline)"
git push

각 명령 결과를 확인하고 오류가 있으면 원인과 함께 보고하라.`,
  {
    label: 'publish:git',
    phase: 'Publish',
  }
)

// ── 최종 반환 ────────────────────────────────────────────────

return {
  file: filePath,
  date: date,
  sections: SECTIONS.map((s, i) => ({
    title: s.title,
    items: researchResults[i] ? researchResults[i].items.length : 0,
  })),
  issues: {
    total:       allIssues.length,
    bugs:        allIssues.filter(i => i.label === 'bug').length,
    enhancements: allIssues.filter(i => i.label === 'enhancement').length,
  },
}
