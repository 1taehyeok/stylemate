# PR 실행 가이드 (바로 따라하기)

요청하신 대로, PR 머지 전에 **pull 받아서 직접 돌려보는 표준 절차**를 짧고 명확하게 정리했습니다.

## 1) PR 브랜치 받아오기

```bash
git fetch origin
git checkout <pr-branch-name>
git pull origin <pr-branch-name>
```

## 2) 백엔드 실행

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Windows: copy .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 3) 프론트 실행

새 터미널에서:

```bash
cd frontend
npm install
npm run dev
```

## 4) 확인 포인트 (리뷰 체크리스트)

- 앱 첫 진입부터 결과 화면까지 에러 없이 이동되는가
- 결과 카드의 데이터가 랜덤/하드코딩이 아니라 API 기반인가
- 상세 페이지에서 가격/재고/위치가 정상 노출되는가
- 브라우저 콘솔 및 백엔드 로그에 치명 오류가 없는가

## 5) 이상 있을 때

- 이슈를 만들 때 아래 3개를 같이 남기면 수정이 빠릅니다.
  1. 재현 절차
  2. 기대 결과 vs 실제 결과
  3. 로그/스크린샷

## 6) 권장 방식 (한 줄 요약)

**작은 PR 단위로 제가 구현 → 당신이 pull해서 검증 → 피드백 반영 후 머지**가 가장 안전하고 빠릅니다.
