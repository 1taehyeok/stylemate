# 👔 StyleMate

AI 기반 스타일링 추천 키오스크 애플리케이션입니다. 사용자의 사진을 촬영하고, TPO(Time, Place, Occasion)에 맞는 의류 코디를 AI가 추천해줍니다.

## ✨ 주요 기능

- 📸 **카메라 촬영** — 키오스크에서 사용자 사진 촬영
- 🧑‍🤝‍🧑 **성별 선택** — 남성/여성 스타일링 구분
- 🎯 **TPO 선택** — 상황에 맞는 스타일 카테고리 선택
- 🤖 **AI 코디 추천** — OpenAI / Google Gemini를 활용한 의류 추천
- 👕 **아이템 상세 보기** — 추천된 의류 아이템 상세 정보 확인

## 🏗️ 기술 스택

### Frontend
- **React 19** + **TypeScript**
- **Vite** (빌드 도구)
- **Electron** (키오스크 데스크톱 앱)
- **TailwindCSS** (스타일링)
- **Framer Motion** (애니메이션)
- **Zustand** (상태 관리)

### Backend
- **FastAPI** (Python 웹 프레임워크)
- **SQLAlchemy** + **SQLite** (데이터베이스)
- **OpenAI API** / **Google Gemini API** (AI 이미지 생성)
- **Pillow** (이미지 처리)

## 📁 프로젝트 구조

```
stylemate/
├── frontend/               # React + Electron 프론트엔드
│   ├── src/
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── components/     # 공통 컴포넌트
│   │   ├── api.ts          # API 통신
│   │   ├── store.ts        # Zustand 상태 관리
│   │   └── App.tsx         # 라우팅 & 앱 진입점
│   ├── electron/           # Electron 메인 프로세스
│   └── package.json
├── backend/                # FastAPI 백엔드
│   ├── app/
│   │   ├── routers/        # API 라우터
│   │   ├── services/       # AI 서비스 로직
│   │   ├── models.py       # DB 모델
│   │   ├── schemas.py      # Pydantic 스키마
│   │   ├── config.py       # 설정
│   │   └── main.py         # FastAPI 앱 진입점
│   ├── .env.example        # 환경 변수 예시
│   └── requirements.txt
└── README.md
```

## 🚀 시작하기

### 사전 요구 사항

- **Node.js** 18+
- **Python** 3.10+
- **OpenAI API Key** 또는 **Google Gemini API Key**

### Backend 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
# .env 파일을 열어 API 키를 입력하세요

# DB 마이그레이션 적용 (권장)
alembic upgrade head

# 샘플 카탈로그 데이터 적재 (선택)
python scripts/import_items.py --csv data/sample_items.csv

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행 (Vite + Electron)
npm run dev
```

## ⚙️ 환경 변수

`backend/.env` 파일에 다음 값을 설정하세요:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `AI_PROVIDER` | AI 제공자 | `openai` 또는 `gemini` |
| `OPENAI_API_KEY` | OpenAI API 키 | `sk-...` |
| `GEMINI_API_KEY` | Google Gemini API 키 | `your-key` |
| `HOST` | 서버 호스트 | `0.0.0.0` |
| `PORT` | 서버 포트 | `8000` |
| `FRONTEND_URL` | 프론트엔드 URL (CORS) | `http://localhost:5173` |
| `DB_URL` | 비동기 SQLAlchemy DB URL | `sqlite+aiosqlite:///./stylemate.db` |
| `AUTO_CREATE_TABLES` | 앱 시작 시 create_all 실행 여부 | `false` |


## 🧪 로컬 코디 조합 검증 (AI 호출 없음)

AI 이미지 생성 비용 없이, DB에 저장된 의류 이미지 + 특징(feature)으로 조합 적합도를 확인할 수 있습니다.

### 1) 샘플 데이터 적재
```bash
cd backend
python scripts/import_items.py --csv data/sample_items.csv
```

### 2) 조합 JSON 확인
```bash
GET /api/outfits/preview?gender=women&tpo=office&season=fall&limit=12
```

### 3) 조합 보드(동시 이미지 확인)
```bash
GET /api/outfits/preview-board?gender=women&tpo=office&season=fall&limit=12
```

브라우저에서 위 URL을 열면 조합 점수/사유와 함께 의류 이미지가 카드 형태로 동시에 표시됩니다.

## 📜 라이선스

This project is for personal/educational use.


## 🗃️ DB 마이그레이션/시드

- 마이그레이션 생성/적용은 Alembic을 사용합니다.
- 운영 환경에서는 `AUTO_CREATE_TABLES=false`를 유지하고 `alembic upgrade head`로 스키마를 관리하세요.
- 샘플 데이터는 `backend/data/sample_items.csv`와 `backend/scripts/import_items.py`를 사용해 적재할 수 있습니다.
