# WIFFLE 협업 웹사이트 프로젝트

React (Vite) + Node.js 기반의 협업 웹 애플리케이션 프로젝트입니다.  
프론트엔드는 Vite 기반 React로 구성되어 있으며,  
백엔드는 Node.js 환경에서 JavaScript로 작성되었습니다.

---

## 📁 프로젝트 구조

```
project-root/
├── backend/                # 백엔드 서버 (Node.js)
│   ├── package.json
│   ├── .env
│   └── node_modules/
├── frontend/               # 프론트엔드 클라이언트 (React + Vite)
│   ├── package.json
│   └── node_modules/
├── .gitignore              # 공통 무시 규칙
└── README.md               # 프로젝트 설명서
```

---

## 🚀 실행 방법

### ✅ 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

### ✅ 백엔드 실행
```bash
cd backend
npm install
npm run start
```
- 백엔드 실행시 과제 제출란에 함께 올린 env파일을 /backend 폴더 아레 .env 파일로 만든 후 실행 시켜주시기 바랍나다.
 - env 파일 안에 SNS 로그인 시 사용하는 API키가 있어 깃허브에 public으로 공개 할 수 없었습니다.

> 백엔드는 Node.js 서버로 동작하며, 포트와 환경변수는 `.env` 파일로 관리됩니다.

---

## ⚠️ 주의사항

| 조건                                                                 | 이유                                                             |
| -------------------------------------------------------------------  | --------------------------------------------------------------- |
| **1. 루트에서 `npm install` 하지 말기**                               | 루트에는 `package.json`이 없으니 에러 발생 또는 이상한 설치됨      |
| **2. 각 디렉토리 안에서 설치/실행**                                   | `cd frontend && npm install`, `cd backend && npm install`       |
| **3. 루트에서 실행하고 싶으면 `통합용 package.json` 따로 만들기**      | 각 디렉토리 명령을 위임하는 용도로만 사용                          |
| **4. `node_modules/`, `*.lock` 파일들은 `.gitignore`에 꼭 추가**      | 루트 기준으로 무시하지 않으면 충돌 가능성 생김                      |

---

## 📦 패키지 관리

각 디렉토리에는 독립적인 `package.json`이 있으며, 서로 다른 종속성을 관리합니다.

- 프론트: `React`, `Vite`, `styled-components`, `antd` 등
- 백엔드: `Node.js`, `dotenv`, `fs`, `http`, 기타 내장/외부 모듈

---

## 🧪 개발 시 참고

- API 프록시는 `vite.config.js`에서 설정 가능 (`/api` → `http://localhost:5000` 등)
- ESLint, Prettier 설정은 루트에서 통합 관리 가능합니다 (`eslint.config.js`)
- 환경변수는 `.env.example` 파일을 참고하여 `.env` 파일을 작성하세요.

---