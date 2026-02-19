# StyleMate 실데이터/DB 전환 TODO (이슈 단위)

아래는 현재 repo 구조를 기준으로 바로 이슈 트래킹 도구(GitHub Issues/Jira)에 옮길 수 있는 형태로 정리한 작업 목록입니다.

## 상태 요약 (2026-02-19 코드 기준)

- 완료(✅): DB-1, BE-1, BE-3
- 부분완료(🟡): FE-1, FE-2
- 미완료(⬜): DB-2, DB-3, BE-2, BE-4, FE-3, FE-4, OPS-1, OPS-2, OPS-3

### 완료(✅)
- `DB-1` Alembic 마이그레이션 체계 도입 및 실행 문서화 반영
- `BE-1` `/api/results/{task_id}` 응답에 `recommended_items` 포함
- `BE-3` CSV 기반 카탈로그 업서트 스크립트(`backend/scripts/import_items.py`) 반영

### 부분완료(🟡)
- `FE-1` 결과 API 기반 바인딩은 반영됐지만 fallback 매칭/문구가 일부 남아 있음
- `FE-2` 상세 렌더링 구조는 개선됐지만 placeholder/fallback 텍스트가 일부 남아 있음

### 미완료(⬜)
- `DB-2` 생성 이미지-상품 N:M 매핑 테이블(`generated_image_items`) 미도입
- `DB-3` `stock_info`/`category` 정규화 미완료
- `BE-2` `limit`/`offset`/`sort` 파라미터 미구현
- `BE-4` 백엔드 API 테스트 파일 미작성
- `FE-3` 재시도 버튼/복귀 UX 등 실패 대응 동작 미흡
- `FE-4` 프론트 테스트 파일 미작성
- `OPS-1`~`OPS-3` 운영 환경 분리/품질 체크리스트/메트릭 체계 미완료

---

## Epic 1) DB 스키마/마이그레이션 체계 정비

### Issue DB-1: Alembic 도입 및 초기 마이그레이션 생성
- **목표**: `create_all` 기반 자동 생성에서 벗어나 운영 가능한 마이그레이션 체계 구축
- **작업**
  - Alembic 설치/초기화
  - SQLAlchemy 모델 기준 초기 revision 생성
  - 실행 문서화(개발/배포 공통)
- **완료 조건(AC)**
  - `alembic upgrade head`로 로컬 DB 생성 가능
  - 신규 개발자가 README 절차만으로 동일 스키마 구성 가능
- **영향 파일(예상)**
  - `backend/alembic.ini`
  - `backend/alembic/*`
  - `backend/requirements.txt`
  - `README.md`

### Issue DB-2: 생성 이미지-상품 매핑 스키마 추가
- **목표**: AI 생성 결과와 실제 판매 상품 연결
- **작업**
  - `generated_image_items`(N:M) 테이블 설계 및 모델 추가
  - FK/인덱스 정의 (`generated_image_id`, `item_id`)
  - 마이그레이션 작성
- **완료 조건(AC)**
  - 하나의 생성 이미지에 다수 상품 매핑 가능
  - 동일 상품이 여러 생성 결과에 재사용 가능
- **의존성**: DB-1
- **영향 파일(예상)**
  - `backend/app/models.py`
  - `backend/alembic/versions/*.py`

### Issue DB-3: 카탈로그 필드 정규화(재고/카테고리)
- **목표**: 문자열 기반 임시 필드를 운영 가능한 구조로 개선
- **작업**
  - `stock_info` 문자열을 재고 테이블(옵션: size별 수량)로 분리 여부 결정
  - `category` 값 enum/코드셋 정의
  - 데이터 검증 규칙 추가
- **완료 조건(AC)**
  - 프론트에서 필터/표시 시 파싱 로직 없이 데이터 사용 가능
  - 카테고리 오타/중복 입력 방지
- **의존성**: DB-1

---

## Epic 2) 백엔드 API 실데이터화

### Issue BE-1: `/api/results/{task_id}`에 추천 상품 포함
- **목표**: 프론트 랜덤값 제거를 위해 결과 API에서 실상품 데이터 동시 제공
- **작업**
  - 응답 스키마에 `recommended_items` 추가
  - task의 성별/카테고리 기준으로 `clothing_items` 조회
  - 생성 이미지와 매핑 테이블 데이터 조인
- **완료 조건(AC)**
  - 결과 API 단일 호출로 화면 렌더링 가능한 데이터 제공
  - 상품 데이터가 비어도 API가 안정적으로 응답(빈 배열)
- **의존성**: DB-2
- **영향 파일(예상)**
  - `backend/app/routers/generation.py`
  - `backend/app/schemas.py`

### Issue BE-2: 상품 목록 API 필터/정렬 고도화
- **목표**: 운영에서 필요한 조회 기능 제공
- **작업**
  - `gender`, `category` 외 `limit`, `offset`, `sort` 파라미터 추가
  - 기본 정렬 기준(최신/인기/가격) 정책 반영
- **완료 조건(AC)**
  - 프론트 탭/필터 요구사항을 API 레벨에서 충족
  - 대량 데이터(1000+)에서도 응답 지연 최소화
- **영향 파일(예상)**
  - `backend/app/routers/items.py`
  - `backend/app/schemas.py`

### Issue BE-3: 카탈로그 대량 업서트(Seed/Import) API 또는 스크립트
- **목표**: 엑셀/CSV 실데이터를 반복적으로 반영
- **작업**
  - CSV import CLI 스크립트 작성(권장)
  - 중복 키 기준 upsert 정책 수립(예: `name+gender+category`)
  - 실패 행 리포트 출력
- **완료 조건(AC)**
  - 100건 이상 카탈로그를 1회 명령으로 반영 가능
  - 재실행 시 중복 insert 없이 갱신
- **영향 파일(예상)**
  - `backend/scripts/import_items.py` (신규)
  - `README.md`

### Issue BE-4: 백엔드 테스트 추가(핵심 API)
- **목표**: 랜덤/임시 데이터 회귀 방지
- **작업**
  - items list/detail/create 테스트
  - results API의 추천상품 포함 여부 테스트
- **완료 조건(AC)**
  - CI에서 주요 API 통과
  - 추천상품 필드 누락 시 테스트 실패
- **영향 파일(예상)**
  - `backend/tests/test_items_api.py` (신규)
  - `backend/tests/test_generation_results_api.py` (신규)

---

## Epic 3) 프론트엔드 목업 제거 및 실데이터 바인딩

### Issue FE-1: LoadingPage 랜덤 데이터 제거
- **목표**: 현재 `price/stock/location/description` 랜덤/고정값 제거
- **작업**
  - 결과 API 응답 구조 변경 반영
  - 상태 저장 타입을 백엔드 스키마와 맞춤
- **완료 조건(AC)**
  - 새로고침/재시도해도 같은 task 결과는 동일 데이터 표시
  - 랜덤 값 생성 코드 완전 제거
- **영향 파일(예상)**
  - `frontend/src/pages/LoadingPage.tsx`
  - `frontend/src/store.ts`
  - `frontend/src/api.ts`

### Issue FE-2: ResultItem 타입 재정의 및 상세 페이지 실데이터화
- **목표**: 임시 UI fallback 텍스트 제거
- **작업**
  - `ResultItem`에 실제 DB 필드 기준 타입 반영
  - 상세 페이지 fallback 문구 제거/빈 상태 처리 UI 추가
- **완료 조건(AC)**
  - 상품 상세에서 하드코딩 텍스트 미노출
  - 데이터 없음 상태가 UX적으로 명확히 처리됨
- **영향 파일(예상)**
  - `frontend/src/store.ts`
  - `frontend/src/pages/ItemDetailPage.tsx`
  - `frontend/src/pages/ResultsPage.tsx`

### Issue FE-3: API 에러/로딩 상태 개선
- **목표**: 실데이터 연동 시 실패 시나리오 대응
- **작업**
  - 생성 실패/타임아웃/빈결과 안내 UI
  - 재시도 버튼 및 이전 단계 복귀 동작
- **완료 조건(AC)**
  - 네트워크/서버 에러 시 사용자 액션 가능
  - 콘솔 에러만 남고 멈추는 상태 제거

### Issue FE-4: 프론트 테스트 추가
- **목표**: 화면 바인딩 회귀 방지
- **작업**
  - Loading → Results 데이터 매핑 테스트
  - 상세 페이지 렌더링 테스트
- **완료 조건(AC)**
  - 랜덤 문자열/하드코딩 노출 회귀를 테스트로 탐지

---

## Epic 4) 운영/배포 준비

### Issue OPS-1: DB 환경 분리(local/staging/prod)
- **목표**: SQLite 개발환경 + Postgres 운영환경 분리
- **작업**
  - `.env.example`에 DB_URL 패턴 명시
  - 환경별 실행 가이드 업데이트
- **완료 조건(AC)**
  - 환경별 동일 앱 코드로 DB만 교체 가능

### Issue OPS-2: 데이터 품질 체크리스트 수립
- **목표**: 잘못된 카탈로그 데이터 사전 차단
- **작업**
  - 필수값 누락/이미지 경로 오류/가격 음수 검증 항목 정의
  - import 시 검증 리포트 저장
- **완료 조건(AC)**
  - 배포 전 체크리스트로 데이터 문제 발견 가능

### Issue OPS-3: 관측성(로그/메트릭) 최소 도입
- **목표**: 운영 장애 대응 시간 단축
- **작업**
  - task_id 단위 로그 상관관계 강화
  - 생성 성공률/소요시간 지표 수집
- **완료 조건(AC)**
  - 실패 task 원인을 로그만으로 추적 가능

---

## 추천 우선순위(실행 순서)

1. **DB-1 → DB-2 → BE-1 → FE-1**
2. **BE-3(실데이터 주입) → FE-2(상세 실데이터화)**
3. **BE-4/FE-4(테스트) → OPS-1/2/3(운영화)**

---

## 스프린트용 최소 MVP 묶음

- **MVP-A (필수)**
  - DB-1, DB-2, BE-1, FE-1
- **MVP-B (현업사용 가능)**
  - BE-3, FE-2, OPS-2
- **MVP-C (안정화)**
  - BE-4, FE-4, OPS-1, OPS-3

