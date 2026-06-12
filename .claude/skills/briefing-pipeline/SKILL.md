# 브리핑 파이프라인 (Harness)

AI 주간 브리핑 전체 사이클을 하네스 워크플로우로 한 번에 실행한다.
리서치 → 작성 → 검증 → 수정 → GitHub 배포까지 자동 처리.

**트리거 예시:** "브리핑 파이프라인 실행해줘", "하네스로 브리핑 만들어줘", "브리핑 전체 자동으로 돌려줘"

---

## 실행 절차

### 1단계: 오늘 날짜 확인

PowerShell로 오늘 날짜를 확인한다.

```powershell
Get-Date -Format "yyyy-MM-dd"
```

### 2단계: Workflow 도구로 하네스 실행

확인한 날짜를 args로 전달하여 `briefing-pipeline` 워크플로우를 실행한다.

```
Workflow({
  name: "briefing-pipeline",
  args: { date: "YYYY-MM-DD" }  // 1단계에서 확인한 날짜로 교체
})
```

### 3단계: 완료 보고

워크플로우가 반환한 결과를 아래 형식으로 보고한다.

| 항목 | 내용 |
|------|------|
| 생성 파일 | AI브리핑_YYYY-MM-DD.html |
| 섹션별 수집 건수 | 섹션1: N건 / 섹션2: N건 / ... |
| 발견·수정된 이슈 | 버그 N건, 개선 N건 |
| GitHub 커밋 | 완료 / 실패 (실패 시 사유) |

---

## 참고: 하네스 구조

```
Phase 1 Research  : 4개 섹션 parallel() — section-researcher 에이전트 ×4 동시 실행
Phase 2 Write     : Synthesize — briefing-writer 에이전트가 결과 통합
Phase 3 Verify    : Adversarial — fact-checker 에이전트 ×3 독립 관점 검증
Phase 4 Fix       : pipeline() — 이슈별 순차 수정 (배리어 없음)
Phase 5 Publish   : git commit & push
```

워크플로우 스크립트 위치: `C:\Users\기획팀\.claude\workflows\briefing-pipeline.js`
