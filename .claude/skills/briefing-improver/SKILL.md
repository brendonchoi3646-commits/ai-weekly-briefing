---
name: briefing-improver
description: >
  AI 주간 브리핑 HTML의 개선점을 점검하고 GitHub 이슈를 등록한 뒤,
  이슈별로 현황 파악 → 댓글(해결 계획) → 수정 → 커밋 → 이슈 종료까지 한 번에 처리한다.
  "브리핑 개선해줘", "브리핑 점검해줘", "이슈 처리해줘", "리포트 버그 잡아줘",
  "브리핑 퀄리티 올려줘" 같은 요청에 사용한다.
  브리핑 HTML이 새로 만들어진 직후, 또는 사용자가 품질 점검을 원할 때 사용한다.
allowed-tools: Read Grep Glob Edit WebSearch Bash
---

# 브리핑 개선 사이클

최신 브리핑 HTML을 대상으로 아래 3단계를 순서대로 진행한다.

---

## 준비: 대상 파일 확인

`C:\Users\기획팀\AI뉴스브리핑\` 폴더에서 가장 최근 `AI브리핑_*.html` 파일을 찾는다.

```bash
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
```

GitHub 리포: `brendonchoi3646-commits/ai-weekly-briefing`

---

## 1단계: 약점 발견 → GitHub 이슈 등록

### 1-1. HTML 파일 전체 읽기

Read 도구로 대상 HTML 파일을 읽는다. 아래 항목들을 기준으로 문제를 찾는다.

**버그 기준 (`bug` 라벨)**
- 링크 URL 오타 (예: `nwww.` 같은 도메인 오타)
- 날짜·시제 불일치 (발행일보다 미래 사건을 과거형으로 표기)
- 출처 날짜 누락 (다른 항목들은 날짜 있는데 특정 항목만 없음)

**개선 기준 (`enhancement` 라벨)**
- 특정 섹션 뉴스 항목이 다른 섹션보다 현저히 적음 (예: 2건 vs 3건)
- 출처 신뢰도 문제 (개인 블로그, 출처 불명 도메인 사용)
- 오래된 기사 사용 (최신 트렌드 섹션에 3개월 이상 지난 기사)
- 기사 내용과 출처 불일치

### 1-2. 이슈 등록

발견한 항목마다 `gh issue create`로 이슈를 만든다.

```bash
gh issue create \
  --repo brendonchoi3646-commits/ai-weekly-briefing \
  --title "[버그] 문제 제목" \
  --body "## 문제\n내용\n\n## 수정\n수정 방향" \
  --label bug
```

개선 항목은 `--label enhancement` 사용.

등록한 이슈 목록(번호, 제목, 라벨)을 사용자에게 보고한 뒤 2단계로 넘어간다.

---

## 2단계: 이슈별 처리 (파악 → 댓글 → 수정 → 커밋)

열린 이슈 목록을 확인한 뒤, **각 이슈를 순서대로** 처리한다.

```bash
gh issue list --repo brendonchoi3646-commits/ai-weekly-briefing --state open
```

### 이슈 하나당 처리 순서

**① 이슈 내용 확인**
```bash
gh issue view [번호] --repo brendonchoi3646-commits/ai-weekly-briefing
```

**② HTML 현황 파악**

Grep 또는 Read로 이슈에서 언급된 줄 번호·키워드를 확인한다.
- 버그라면: 문제가 되는 코드가 실제로 어떤 상태인지 확인
- 개선이라면: 현재 구현이 어떻게 되어 있는지 파악
- 이미 수정된 경우에도 반드시 현재 상태를 확인한다

**③ 해결 계획 댓글 작성**

이슈에 댓글을 달아 파악 결과와 수정 계획을 기록한다.

```bash
gh issue comment [번호] \
  --repo brendonchoi3646-commits/ai-weekly-briefing \
  --body "## 파악 결과\n\n현재 상태 설명\n\n## 수정 내용\n\n구체적인 변경 계획"
```

댓글에 포함할 내용:
- 현재 코드/내용 상태 (어떤 줄, 어떤 값)
- 구체적인 수정 방향 (무엇을 → 무엇으로)

**④ HTML 수정**

Edit 도구로 실제 파일을 수정한다.
- 출처 교체가 필요한 경우 WebSearch로 신뢰도 높은 대체 출처를 먼저 찾는다
- 뉴스 항목 추가가 필요한 경우 해당 섹션 주제로 WebSearch 후 내용을 작성한다

**⑤ 커밋 (closes 키워드로 이슈 자동 종료)**

```bash
cd "C:\Users\기획팀\AI뉴스브리핑"
git add "AI브리핑_*.html"
git commit -m "fix: 이슈 내용 요약 closes #[번호]"
git push
```

`closes #N` 키워드가 커밋 메시지에 포함되면 GitHub가 이슈를 자동으로 닫는다.
여러 이슈를 한 커밋으로 처리할 때는: `closes #2, closes #3, closes #4`

---

## 3단계: 완료 보고

모든 이슈 처리 후 아래 형식으로 보고한다.

| 이슈 | 분류 | 처리 내용 |
|------|------|-----------|
| #N | 버그/개선 | 수정 요약 |

- 총 처리 이슈 수
- 수정된 파일
- GitHub 커밋 링크

---

## 주의사항

- 이슈가 이미 열려 있는 경우 중복 등록하지 않는다 (등록 전 `gh issue list`로 확인)
- 출처 교체 시 반드시 `zdnet.co.kr`, `etnews.com`, `aitimes.com`, `steeldaily.co.kr`, `mss.go.kr`, `bizinfo.go.kr` 등 신뢰도 높은 사이트로 대체한다
- 각 이슈마다 댓글을 먼저 달고 수정한다 — 계획 없이 바로 수정하지 않는다
- 커밋 메시지에 반드시 `closes #N` 포함
